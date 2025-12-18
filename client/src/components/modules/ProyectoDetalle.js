import React, { useState, useEffect, useRef, useMemo } from 'react';
import { XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { localStorageAPI } from '../../services/localStorage';
import { useProjectDetail } from '../../hooks/useProjectData';
import { PencilIcon, DocumentArrowUpIcon, FolderIcon, EyeIcon } from '@heroicons/react/24/solid';
import projectDataService from '../../services/projectDataService';

const ProyectoDetalle = ({ proyecto, onBack, projectNumber }) => {
  // IDs de categorías cuya celda "Contrato Prov. y Serv." debe estar bloqueada y pintada
  const BLOCKED_CONTRACT_CATEGORY_IDS = [1, 2, 3, 4, 5, 6, 7, 8];
  
  // 🔒 SISTEMA DE PRESERVACIÓN: Rastrear qué valores fueron editados por el usuario
  // Este ref mantiene un registro permanente de valores editados por el usuario
  const userEditedValuesRef = useRef(new Map()); // Map<`${categoriaId}-${field}`, value>

  // Función helper para identificar si una categoría debe tener color plomo en "Saldos por cancelar"
  // Solo las primeras 8 filas específicas según la imagen
  // 🔍 Función para identificar categorías que deben sumarse en el total de "Saldos por cancelar"
  // Solo las celdas marcadas en rojo (NO las de fondo gris)
  const shouldSumInTotalSaldos = (categoriaNombre) => {
    if (!categoriaNombre) return false;
    const nombre = categoriaNombre.toString().toLowerCase().trim();
    
    // Solo estas categorías específicas se suman en el total (las marcadas en rojo)
    const categoriasParaSumar = [
      'despecie',
      'mano de obra',
      'of - escp',
      'of escp',
      'granito y/o cuarzo',
      'granito y/o cuarz',
      'extras y/o eventos gyc',
      'extras y/o eventos g y c',
      'tercializacion 1 facturada',
      'tercialización 1 facturada',
      'extras y/o eventos terc. 1',
      'extras y/o eventos tercializacion 1',
      'tercializacion 2 facturada',
      'tercialización 2 facturada',
      'extras y/o eventos terc. 2',
      'extras y/o eventos tercializacion 2',
      'tercializacion 1 no facturada',
      'tercialización 1 no facturada',
      'extras y/o eventos terc. 1 nf',
      'extras y/o eventos tercializacion 1 nf',
      'tercializacion 2 no facturada',
      'tercialización 2 no facturada',
      'extras y/o eventos terc. 2 nf',
      'extras y/o eventos tercializacion 2 nf'
    ];
    
    // Verificar coincidencia exacta o parcial para "Mano de Obra" (puede tener variaciones)
    if (nombre.includes('mano de obra')) {
      return true;
    }
    
    const esMarcada = categoriasParaSumar.some(cat => nombre === cat || nombre.includes(cat));
    
    // Debug: mostrar si una categoría está marcada
    if (esMarcada) {
      console.log(`✅ Categoría marcada detectada: "${categoriaNombre}" → será excluida de totales horizontales`);
    }
    
    return esMarcada;
  };

  // 🔍 Función para identificar si una fila debe usar Presup. Del Proy. - Registro Egresos (marcadas en rojo)
  // Solo las filas marcadas en rojo usan esta fórmula, las demás usan Contrato Prov. Y Serv. - Registro Egresos
  const shouldUsePresupuestoFormula = (categoria) => {
    if (!categoria) return false;
    
    // Verificar si tiene valor en Presup. Del Proy. (las celdas marcadas en rojo)
    // Solo usar Presup. Del Proy. cuando tenga un valor mayor a 0
    const presupuesto = parseMonetary(categoria.presupuestoDelProyecto || 0);
    const tienePresupuesto = presupuesto > 0;
    
    // Si tiene Presup. Del Proy. con valor, usar esa fórmula (filas marcadas en rojo)
    // Si no, usar Contrato Prov. Y Serv. (filas normales)
    return tienePresupuesto;
  };

  const shouldHaveGrayBackground = (categoriaNombre) => {
    if (!categoriaNombre) return false;
    const nombre = categoriaNombre.toString().toLowerCase().trim();
    
    // Solo estas categorías específicas deben tener fondo plomo (las primeras 8 filas exactas)
    // Usar coincidencias exactas o muy específicas para evitar falsos positivos
    const categoriasPlomo = [
      'melamina y servicios',
      'melamina high gloss',
      'accesorios y ferretería',
      'accesorios y ferreteria',
      'puertas alu vidrios',
      'puertas alu y vidrios',
      'led y electricidad',
      'flete y/o camioneta',
      'logística operativa',
      'logistica operativa'
    ];
    
    // Para "Extras y/o Eventos", solo si es exactamente esa categoría (no las variantes GyC, Terc., etc.)
    if (nombre === 'extras y/o eventos' || nombre === 'extras y/o evento') {
      return true;
    }
    
    return categoriasPlomo.some(cat => nombre === cat);
  };

  // Util: parsear valores monetarios (acepta string con símbolos o números)
  const parseMonetary = (v) => {
    if (v === undefined || v === null) return 0;
    if (typeof v === 'number') return v;
    try {
      const s = String(v).replace(/[^0-9.-]/g, '');
      return parseFloat(s) || 0;
    } catch (e) { return 0; }
  };
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [documentosPopupOpen, setDocumentosPopupOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [archivosAdjuntos, setArchivosAdjuntos] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error' | 'syncing'

  // 🎯 SISTEMA DE AUTO-SYNC CON EXCEL PRINCIPAL
  const { project, loading, updateField, updateCategory, addCategory, totales } = useProjectDetail(projectNumber);
  
  // Estados para rastrear qué celdas monetarias están siendo editadas
  const [editingCells, setEditingCells] = useState({}); // { 'categoriaId-field': true }
  const [editingValues, setEditingValues] = useState({}); // { 'categoriaId-field': 'raw value' }
  const [editingMontoContrato, setEditingMontoContrato] = useState(false);
  const [montoContratoRaw, setMontoContratoRaw] = useState('');
  
  // Popup de Cobranzas (acceso desde "Monto del Contrato" de la izquierda)
  const [cobranzasPopupOpen, setCobranzasPopupOpen] = useState(false);
  const [cobranzasPreviewOpen, setCobranzasPreviewOpen] = useState(false); // Vista previa antes de PDF
  const [generatingPDF, setGeneratingPDF] = useState(false); // Indicador de generación de PDF
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false); // Menú de opciones PDF/Imprimir
  const pdfMenuRef = useRef(null); // Referencia para cerrar el menú al hacer click fuera
  const cobranzasFilesInputRef = useRef(null);
  const [cobranzasFiles, setCobranzasFiles] = useState([]); // hasta 10 archivos
  const addCobranzasFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const current = [...cobranzasFiles];
    const available = Math.max(0, 10 - current.length);
    const toAdd = Array.from(fileList)
      .slice(0, available)
      .map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        name: f.name,
        type: f.type,
        url: URL.createObjectURL(f),
        file: f
      }));
    setCobranzasFiles([...current, ...toAdd]);
  };
  const removeCobranzasFile = (id) => {
    setCobranzasFiles((prev) => prev.filter((f) => f.id !== id));
  };
  const viewCobranzasFile = (fileObj) => {
    if (!fileObj || !fileObj.url) return;
    window.open(fileObj.url, '_blank');
  };

  // Referencia para el área de impresión principal del proyecto
  const printAreaRef = useRef(null);
  
  // Handler para imprimir usando window.print()
  const handlePrintWindow = () => {
    // Convertir inputs y selects a texto visible antes de imprimir
    const convertInputsToText = () => {
      const printArea = document.getElementById('print-area');
      if (!printArea) return;

      // Convertir inputs a spans con el valor
      const inputs = printArea.querySelectorAll('input[type="text"], input[type="number"]');
      inputs.forEach(input => {
        const span = document.createElement('span');
        span.textContent = input.value || input.placeholder || '';
        span.className = input.className;
        span.style.display = 'inline-block';
        span.style.width = input.offsetWidth + 'px';
        span.style.padding = window.getComputedStyle(input).padding;
        span.style.margin = window.getComputedStyle(input).margin;
        span.style.fontSize = window.getComputedStyle(input).fontSize;
        span.style.fontWeight = window.getComputedStyle(input).fontWeight;
        span.style.color = window.getComputedStyle(input).color;
        if (input.parentNode) {
          input.parentNode.replaceChild(span, input);
        }
      });

      // Convertir selects a spans con el texto seleccionado
      const selects = printArea.querySelectorAll('select');
      selects.forEach(select => {
        const span = document.createElement('span');
        const selectedOption = select.options[select.selectedIndex];
        span.textContent = selectedOption ? selectedOption.text : '';
        span.className = select.className;
        span.style.display = 'inline-block';
        span.style.width = select.offsetWidth + 'px';
        span.style.padding = window.getComputedStyle(select).padding;
        span.style.margin = window.getComputedStyle(select).margin;
        span.style.fontSize = window.getComputedStyle(select).fontSize;
        span.style.color = window.getComputedStyle(select).color;
        if (select.parentNode) {
          select.parentNode.replaceChild(span, select);
        }
      });
    };

    // Ocultar elementos no deseados antes de imprimir
    const style = document.createElement('style');
    style.id = 'print-styles';
    style.innerHTML = `
      @media print {
        .no-print { display: none !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        #print-area { 
          display: flex !important;
          flex-direction: row !important;
          gap: 20px !important;
          width: 100% !important;
        }
        .left-banner { display: none !important; }
        .left-panel, .right-panel { 
          width: auto !important;
          flex-shrink: 0 !important;
          page-break-inside: avoid !important;
        }
        button { display: none !important; }
        
        /* Asegurar que las tablas se muestren */
        table { 
          display: table !important;
          border-collapse: collapse !important;
          width: 100% !important;
        }
        table td, table th { 
          display: table-cell !important;
          visibility: visible !important;
          opacity: 1 !important;
          color: #000 !important;
          padding: 2px 4px !important;
          font-size: 11px !important;
        }
        
        /* Asegurar que los valores se muestren */
        .right-panel td:last-child,
        .right-panel .print-value {
          white-space: nowrap !important;
          display: table-cell !important;
          visibility: visible !important;
          opacity: 1 !important;
          color: #000 !important;
          background-color: #fff !important;
          content: "" !important;
        }
        
        /* Asegurar que el contenido de las celdas sea visible */
        .right-panel td * {
          visibility: visible !important;
          opacity: 1 !important;
          color: #000 !important;
          display: inline !important;
        }
        
        input, select { 
          border: none !important;
          background: transparent !important;
          -webkit-appearance: none !important;
          appearance: none !important;
          display: inline-block !important;
          visibility: visible !important;
          opacity: 1 !important;
          color: #000 !important;
        }
        
        /* Asegurar que todos los elementos de texto sean visibles */
        td, th, span, div {
          visibility: visible !important;
          opacity: 1 !important;
          color: inherit !important;
        }
        
        /* Forzar visibilidad de contenido calculado */
        .right-panel tbody tr td:last-child {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
    
    // Convertir inputs antes de agregar estilos
    convertInputsToText();
    document.head.appendChild(style);
    
    // Esperar un momento y luego imprimir
    setTimeout(() => {
      window.print();
      // Remover el estilo después de imprimir
      setTimeout(() => {
        const printStyle = document.getElementById('print-styles');
        if (printStyle && document.head.contains(printStyle)) {
          document.head.removeChild(printStyle);
        }
        // Recargar la página para restaurar los inputs (opcional, o puedes restaurarlos manualmente)
        // window.location.reload();
      }, 1000);
    }, 200);
  };

  // Cerrar el menú PDF cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(event.target)) {
        setPdfMenuOpen(false);
      }
    };

    if (pdfMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pdfMenuOpen]);
  
  // Handler para generar PDF del proyecto completo (tabla de categorías + análisis financiero)
  const handlePrintProyecto = () => {
    // Buscar los dos cuadros principales directamente
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');
    
    if (!leftPanel || !rightPanel) {
      alert('Error: No se encontraron los cuadros para generar el PDF.');
      console.error('Elementos no encontrados:', { 
        leftPanel: !!leftPanel, 
        rightPanel: !!rightPanel,
        allLeftPanels: document.querySelectorAll('.left-panel').length,
        allRightPanels: document.querySelectorAll('.right-panel').length
      });
      return;
    }

    console.log('🔍 Elementos encontrados:', {
      leftPanelHeight: leftPanel.scrollHeight,
      rightPanelHeight: rightPanel.scrollHeight,
      leftPanelHasTable: !!leftPanel.querySelector('table'),
      rightPanelHasTable: !!rightPanel.querySelector('table')
    });

    // Cargar html2pdf.js desde CDN si no está disponible
    const loadHtml2Pdf = () => {
      return new Promise((resolve, reject) => {
        if (window.html2pdf) {
          resolve(window.html2pdf);
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve(window.html2pdf);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadHtml2Pdf().then((html2pdf) => {
      // Clonar los dos cuadros principales (deep clone para incluir todos los estilos)
      const cloneLeftPanel = leftPanel.cloneNode(true);
      const cloneRightPanel = rightPanel.cloneNode(true);
      
      // Ocultar botones y elementos no necesarios en ambos clones
      [cloneLeftPanel, cloneRightPanel].forEach((clone) => {
        // Ocultar botones
        const buttons = clone.querySelectorAll('button');
        buttons.forEach((btn) => {
          btn.style.display = 'none';
          btn.remove();
        });
        
        // Ocultar inputs de edición y reemplazar con spans que muestren el valor
        const inputs = clone.querySelectorAll('input');
        inputs.forEach((input) => {
          if (input.type === 'text' || input.type === 'number') {
            const span = document.createElement('span');
            span.textContent = input.value || input.placeholder || '';
            span.className = input.className;
            span.style.display = 'inline-block';
            span.style.width = input.style.width || 'auto';
            span.style.padding = input.style.padding || '0';
            span.style.margin = input.style.margin || '0';
            if (input.parentNode) {
            input.parentNode.replaceChild(span, input);
            }
          } else {
            input.style.display = 'none';
          }
        });

        // Ocultar selects y mostrar su valor seleccionado
        const selects = clone.querySelectorAll('select');
        selects.forEach((select) => {
          const span = document.createElement('span');
          const selectedOption = select.options[select.selectedIndex];
          span.textContent = selectedOption ? selectedOption.text : '';
          span.className = select.className;
          span.style.display = 'inline-block';
          if (select.parentNode) {
            select.parentNode.replaceChild(span, select);
          }
        });

        // Asegurar que todos los elementos sean visibles
        const allElements = clone.querySelectorAll('*');
        allElements.forEach((el) => {
          if (el.style) {
            el.style.visibility = 'visible';
            el.style.opacity = '1';
            if (el.style.display === 'none' && !el.classList.contains('hidden')) {
              el.style.display = '';
            }
          }
        });
      });

      // Crear un contenedor temporal VISIBLE para html2canvas
      const printContainer = document.createElement('div');
      printContainer.id = 'pdf-container';
      printContainer.style.position = 'fixed';
      printContainer.style.left = '0';
      printContainer.style.top = '0';
      printContainer.style.width = '1200px';
      printContainer.style.backgroundColor = '#ffffff';
      printContainer.style.padding = '20px';
      printContainer.style.display = 'flex';
      printContainer.style.flexDirection = 'row';
      printContainer.style.gap = '20px';
      printContainer.style.alignItems = 'flex-start';
      printContainer.style.zIndex = '99999';
      printContainer.style.visibility = 'visible';
      printContainer.style.opacity = '1';
      printContainer.style.overflow = 'visible';
      // Mover fuera de pantalla pero mantener visible para html2canvas
      printContainer.style.transform = 'translateX(-10000px) translateY(0)';
      
      // Aplicar estilos a los clones para asegurar visibilidad
      cloneLeftPanel.style.display = 'block';
      cloneLeftPanel.style.visibility = 'visible';
      cloneLeftPanel.style.opacity = '1';
      cloneLeftPanel.style.flexShrink = '0';
      cloneLeftPanel.style.width = 'auto';
      cloneLeftPanel.style.height = 'auto';
      
      cloneRightPanel.style.display = 'block';
      cloneRightPanel.style.visibility = 'visible';
      cloneRightPanel.style.opacity = '1';
      cloneRightPanel.style.flexShrink = '0';
      cloneRightPanel.style.width = 'auto';
      cloneRightPanel.style.height = 'auto';
      
      printContainer.appendChild(cloneLeftPanel);
      printContainer.appendChild(cloneRightPanel);
      document.body.appendChild(printContainer);
      
      // Log para debugging
      console.log('📄 Contenido preparado para PDF:', {
        tieneLeftPanel: !!cloneLeftPanel,
        tieneRightPanel: !!cloneRightPanel,
        leftPanelHeight: cloneLeftPanel.scrollHeight,
        rightPanelHeight: cloneRightPanel.scrollHeight,
        alturaContainer: printContainer.scrollHeight,
        anchoContainer: printContainer.scrollWidth,
        leftPanelHasTable: !!cloneLeftPanel.querySelector('table'),
        rightPanelHasTable: !!cloneRightPanel.querySelector('table')
      });

      // Esperar a que se renderice completamente
      setTimeout(() => {
        // Verificar que el contenedor tenga contenido antes de generar el PDF
        const hasTable = printContainer.querySelector('table');
        const hasRightPanel = printContainer.querySelector('.right-panel');
        const leftTable = cloneLeftPanel.querySelector('table');
        const rightTable = cloneRightPanel.querySelector('table');
        
        console.log('🔍 Verificación antes de generar PDF:', {
          hasTable: !!hasTable,
          hasRightPanel: !!hasRightPanel,
          leftTableRows: leftTable ? leftTable.querySelectorAll('tr').length : 0,
          rightTableRows: rightTable ? rightTable.querySelectorAll('tr').length : 0,
          containerHeight: printContainer.scrollHeight
        });
        
        if (!hasTable || !hasRightPanel || !leftTable || !rightTable) {
          alert('Error: No se pudo capturar el contenido completo. Por favor, intenta nuevamente.');
          if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
          }
          return;
        }
        
        // Asegurar que el contenedor tenga altura suficiente
        const containerHeight = Math.max(
          printContainer.scrollHeight, 
          cloneLeftPanel.scrollHeight, 
          cloneRightPanel.scrollHeight, 
          800
        );
        printContainer.style.height = `${containerHeight}px`;
        
        const opt = {
          margin: [10, 10, 10, 10],
          filename: `Proyecto_${projectData.nombreProyecto || 'Proyecto'}_${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: true, // Habilitar logging para debugging
            backgroundColor: '#ffffff',
            allowTaint: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 1200,
            windowHeight: containerHeight,
            onclone: (clonedDoc) => {
              // Asegurar que todos los elementos sean visibles en el documento clonado
              const clonedContainer = clonedDoc.querySelector('#pdf-container') || clonedDoc.body.firstElementChild;
              if (clonedContainer) {
                clonedContainer.style.display = 'flex';
                clonedContainer.style.flexDirection = 'row';
                clonedContainer.style.visibility = 'visible';
                clonedContainer.style.opacity = '1';
                clonedContainer.style.width = '1200px';
                clonedContainer.style.backgroundColor = '#ffffff';
                
                // Asegurar que los paneles sean visibles
                const clonedLeft = clonedContainer.querySelector('.left-panel');
                const clonedRight = clonedContainer.querySelector('.right-panel');
                if (clonedLeft) {
                  clonedLeft.style.visibility = 'visible';
                  clonedLeft.style.opacity = '1';
                  clonedLeft.style.display = 'block';
                }
                if (clonedRight) {
                  clonedRight.style.visibility = 'visible';
                  clonedRight.style.opacity = '1';
                  clonedRight.style.display = 'block';
                }

                // Asegurar que las tablas sean visibles
                const tables = clonedContainer.querySelectorAll('table');
                tables.forEach(table => {
                  table.style.visibility = 'visible';
                  table.style.opacity = '1';
                  table.style.display = 'table';
                  
                  const cells = table.querySelectorAll('td, th');
                  cells.forEach(cell => {
                    cell.style.visibility = 'visible';
                    cell.style.opacity = '1';
                    cell.style.display = 'table-cell';
                  });
                });
              }
            }
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        console.log('🔄 Generando PDF del proyecto...');

        html2pdf().set(opt).from(printContainer).save().then(() => {
          // Limpiar el contenedor temporal
          if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
          }
          console.log('✅ PDF del proyecto generado exitosamente');
        }).catch((error) => {
          console.error('❌ Error al generar PDF:', error);
          alert('Error al generar el PDF: ' + error.message + '\n\nRevisa la consola para más detalles.');
          // Limpiar el contenedor temporal en caso de error
          if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer);
          }
        });
      }, 1500); // Aumentar el tiempo de espera para asegurar que se renderice
    }).catch((error) => {
      console.error('❌ Error al cargar html2pdf.js:', error);
      alert('Error al cargar la librería de PDF. Por favor, intenta nuevamente.');
    });
  };

  // Referencia y handler para imprimir SOLO el popup de Cobranzas
  const cobranzasPopupRef = useRef(null);
  const cobranzasPreviewRef = useRef(null);
  
  // Función para preparar el contenido para PDF (sin generar aún)
  const prepareCobranzasContent = () => {
    const node = cobranzasPopupRef.current;
    if (!node) {
      alert('Error: No se encontró el contenido para generar el PDF.');
      return null;
    }

    // Clonar el contenido del popup (deep clone para incluir todos los estilos)
    const clone = node.cloneNode(true);
    
    // Ocultar botones en el clon
    const cloneButtons = clone.querySelectorAll('button');
    cloneButtons.forEach((btn) => {
      const btnText = btn.textContent || '';
      const hasSvg = btn.querySelector('svg');
      if (btnText.includes('Generar PDF') || btnText.includes('Vista Previa') || btnText.includes('Cerrar') || hasSvg) {
        btn.style.display = 'none';
        btn.remove(); // Eliminar completamente en lugar de solo ocultar
      }
    });

    // Ocultar el input de archivos también
    const fileInputs = clone.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      input.style.display = 'none';
      input.remove();
    });

    // Ocultar la sección de adjuntos en la vista previa (solo mostrar la tabla)
    const adjuntosSection = clone.querySelector('.bg-green-700');
    if (adjuntosSection) {
      const adjuntosContainer = adjuntosSection.closest('.mt-3');
      if (adjuntosContainer) {
        adjuntosContainer.style.display = 'none';
      }
    }

    // Ocultar el footer con botones
    const footer = clone.querySelector('.bg-gray-50');
    if (footer && footer.textContent.includes('Cerrar')) {
      footer.style.display = 'none';
    }

    // Aplicar estilos al clon para que se vea correctamente
    clone.style.position = 'relative';
    clone.style.transform = 'none';
    clone.style.top = 'auto';
    clone.style.left = 'auto';
    clone.style.margin = '0';
    clone.style.width = '100%';
    clone.style.maxWidth = 'none';
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';
    clone.style.border = 'none';
    clone.style.boxShadow = 'none';
    clone.style.backgroundColor = '#ffffff';

    // Asegurar que los inputs se vean como texto estático en la vista previa
    const inputs = clone.querySelectorAll('input');
    inputs.forEach(input => {
      input.style.pointerEvents = 'none';
      input.style.backgroundColor = 'transparent';
      input.style.border = 'none';
      input.readOnly = true;
    });

    return clone;
  };

  // Mostrar vista previa antes de generar PDF
  const handlePreviewCobranzas = () => {
    const content = prepareCobranzasContent();
    if (content) {
      setCobranzasPreviewOpen(true);
      // Esperar a que el modal se renderice antes de insertar el contenido
      setTimeout(() => {
        const previewContainer = cobranzasPreviewRef.current;
        if (previewContainer) {
          previewContainer.innerHTML = '';
          previewContainer.appendChild(content);
          
          // Forzar re-renderizado para asegurar que los estilos se apliquen
          previewContainer.offsetHeight;
          
          // Aplicar estilos adicionales después de insertar
          const tables = previewContainer.querySelectorAll('table');
          tables.forEach(table => {
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
          });
        }
      }, 150);
    }
  };

  // Generar PDF desde la vista previa
  const handleGeneratePDFFromPreview = () => {
    // Usar el contenido de la vista previa que ya está visible y renderizado
    const previewContainer = cobranzasPreviewRef.current;
    if (!previewContainer) {
      alert('Error: No se encontró el contenido de vista previa.');
      setGeneratingPDF(false);
      return;
    }

    // Verificar que la vista previa tenga contenido
    const previewTable = previewContainer.querySelector('table');
    if (!previewTable) {
      alert('Error: La vista previa no tiene contenido. Por favor, cierra y vuelve a abrir la vista previa.');
      setGeneratingPDF(false);
      return;
    }

    // Mostrar indicador de carga
    setGeneratingPDF(true);

    // Cargar html2pdf.js desde CDN si no está disponible
    const loadHtml2Pdf = () => {
      return new Promise((resolve, reject) => {
        if (window.html2pdf) {
          resolve(window.html2pdf);
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve(window.html2pdf);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadHtml2Pdf().then((html2pdf) => {
      // Usar directamente el contenedor de vista previa que ya está visible
      // Crear un wrapper para asegurar que html2canvas lo capture correctamente
      const printContainer = document.createElement('div');
      printContainer.id = 'pdf-cobranzas-container';
      printContainer.style.position = 'absolute';
      printContainer.style.left = '0';
      printContainer.style.top = '0';
      printContainer.style.width = '760px';
      printContainer.style.backgroundColor = '#ffffff';
      printContainer.style.padding = '20px';
      printContainer.style.zIndex = '99999';
      printContainer.style.visibility = 'visible';
      printContainer.style.opacity = '1';
      printContainer.style.display = 'block';
      printContainer.style.overflow = 'visible';
      
      // Clonar el contenido de la vista previa (que ya está renderizado y visible)
      const clone = previewContainer.cloneNode(true);
      
      // Aplicar estilos al clon para asegurar visibilidad
      clone.style.position = 'relative';
      clone.style.transform = 'none';
      clone.style.top = 'auto';
      clone.style.left = 'auto';
      clone.style.margin = '0';
      clone.style.width = '100%';
      clone.style.maxWidth = 'none';
      clone.style.maxHeight = 'none';
      clone.style.overflow = 'visible';
      clone.style.backgroundColor = '#ffffff';
      clone.style.visibility = 'visible';
      clone.style.opacity = '1';
      clone.style.display = 'block';
      
      // Asegurar que todos los elementos hijos sean visibles
      const allChildren = clone.querySelectorAll('*');
      allChildren.forEach(child => {
        child.style.visibility = 'visible';
        child.style.opacity = '1';
        if (child.style.display === 'none') {
          child.style.display = '';
        }
      });
      
      printContainer.appendChild(clone);
      // Mover fuera de pantalla pero mantener en el DOM
      printContainer.style.left = '-10000px';
      document.body.appendChild(printContainer);

      // Esperar a que se renderice completamente
      setTimeout(() => {
        // Asegurar que el contenedor tenga el tamaño correcto
        const containerHeight = Math.max(printContainer.scrollHeight, clone.scrollHeight, 600);
        printContainer.style.height = `${containerHeight}px`;
        
        // Verificar que el contenido tenga elementos visibles
        const hasTable = printContainer.querySelector('table');
        const hasGreenHeader = printContainer.querySelector('.bg-green-600');
        const tableRows = hasTable ? hasTable.querySelectorAll('tr').length : 0;
        
        console.log('🔍 Verificando contenido para PDF:', {
          containerHeight: printContainer.scrollHeight,
          cloneHeight: clone.scrollHeight,
          containerWidth: printContainer.scrollWidth,
          hasTable: !!hasTable,
          hasGreenHeader: !!hasGreenHeader,
          tableRows: tableRows,
          tableHTML: hasTable ? hasTable.innerHTML.substring(0, 300) : 'No table'
        });

        if (!hasTable || tableRows === 0) {
          alert('Error: El contenido para el PDF está vacío. Por favor, cierra y vuelve a abrir la vista previa.');
          if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer);
          }
          setGeneratingPDF(false);
          return;
        }

        const opt = {
          margin: [10, 10, 10, 10],
          filename: `Cobranzas_Proyecto_${projectData.nombreProyecto || 'Proyecto'}_${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: true, // Habilitar logging para debugging
            backgroundColor: '#ffffff',
            allowTaint: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 760,
            windowHeight: containerHeight,
            onclone: (clonedDoc) => {
              // Asegurar que todos los estilos se apliquen correctamente en el clon de html2canvas
              const clonedContainer = clonedDoc.querySelector('#pdf-cobranzas-container') || 
                                     clonedDoc.querySelector('#cobranzas-preview-content') ||
                                     clonedDoc.body.firstElementChild;
              if (clonedContainer) {
                clonedContainer.style.width = '760px';
                clonedContainer.style.backgroundColor = '#ffffff';
                clonedContainer.style.position = 'relative';
                clonedContainer.style.transform = 'none';
                clonedContainer.style.left = '0';
                clonedContainer.style.top = '0';
                clonedContainer.style.visibility = 'visible';
                clonedContainer.style.opacity = '1';
                clonedContainer.style.display = 'block';
                
                // Asegurar que las tablas se vean correctamente
                const tables = clonedContainer.querySelectorAll('table');
                tables.forEach(table => {
                  table.style.width = '100%';
                  table.style.borderCollapse = 'collapse';
                  table.style.visibility = 'visible';
                  table.style.display = 'table';
                  table.style.opacity = '1';
                  
                  // Asegurar que las celdas sean visibles
                  const cells = table.querySelectorAll('td, th');
                  cells.forEach(cell => {
                    cell.style.visibility = 'visible';
                    cell.style.opacity = '1';
                    cell.style.display = 'table-cell';
                  });
                });

                // Asegurar que todos los elementos sean visibles
                const allElements = clonedContainer.querySelectorAll('*');
                allElements.forEach(el => {
                  if (el.style) {
                    el.style.visibility = 'visible';
                    el.style.opacity = '1';
                    if (el.style.display === 'none') {
                      el.style.display = '';
                    }
                  }
                });
              }
            }
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        console.log('🔄 Generando PDF...', {
          containerHeight: printContainer.scrollHeight,
          containerWidth: printContainer.scrollWidth,
          hasTable: !!hasTable,
          tableContent: hasTable ? hasTable.innerHTML.substring(0, 200) : 'No table'
        });

        html2pdf().set(opt).from(printContainer).save().then(() => {
          // Limpiar el contenedor temporal
          if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer);
          }
          setGeneratingPDF(false);
          setCobranzasPreviewOpen(false);
          console.log('✅ PDF generado exitosamente');
        }).catch((error) => {
          console.error('❌ Error al generar PDF:', error);
          setGeneratingPDF(false);
          alert('Error al generar el PDF: ' + error.message + '\n\nPor favor, verifica que el contenido se vea correctamente en la vista previa.');
          // Limpiar el contenedor temporal en caso de error
          if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer);
          }
        });
      }, 1500); // Tiempo suficiente para asegurar renderizado completo
    }).catch((error) => {
      console.error('❌ Error al cargar html2pdf.js:', error);
      setGeneratingPDF(false);
      alert('Error al cargar la librería de PDF. Por favor, verifica tu conexión a internet e intenta nuevamente.');
    });
  };

  // Función para imprimir el popup de cobranzas usando window.print()
  const handlePrintCobranzasWindow = () => {
    // Convertir inputs a texto visible antes de imprimir
    const convertCobranzasInputsToText = () => {
      const popup = cobranzasPopupRef.current;
      if (!popup) return;

      // Convertir inputs de fecha a texto
      const dateInputs = popup.querySelectorAll('input[type="date"]');
      dateInputs.forEach(input => {
        const span = document.createElement('span');
        span.textContent = input.value || 'dd/mm/aaaa';
        span.className = input.className;
        span.style.display = 'inline-block';
        span.style.width = input.offsetWidth + 'px';
        span.style.padding = window.getComputedStyle(input).padding;
        span.style.textAlign = 'center';
        if (input.parentNode) {
          input.parentNode.replaceChild(span, input);
        }
      });

      // Convertir inputs de monto a texto
      const montoInputs = popup.querySelectorAll('input[type="text"]');
      montoInputs.forEach(input => {
        const span = document.createElement('span');
        span.textContent = input.value || 'S/0.00';
        span.className = input.className;
        span.style.display = 'inline-block';
        span.style.width = input.offsetWidth + 'px';
        span.style.padding = window.getComputedStyle(input).padding;
        if (input.parentNode) {
          input.parentNode.replaceChild(span, input);
        }
      });
    };

    // Ocultar elementos no deseados antes de imprimir
    const style = document.createElement('style');
    style.id = 'print-cobranzas-styles';
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #cobranzas-print-area,
        #cobranzas-print-area * {
          visibility: visible;
        }
        #cobranzas-print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print-cobranzas { display: none !important; }
        button { display: none !important; }
        input[type="file"] { display: none !important; }
      }
    `;
    
    // Convertir inputs antes de agregar estilos
    convertCobranzasInputsToText();
    
    // Crear un área de impresión específica
    const popup = cobranzasPopupRef.current;
    if (popup) {
      const printArea = popup.cloneNode(true);
      printArea.id = 'cobranzas-print-area';
      printArea.style.position = 'absolute';
      printArea.style.left = '-10000px';
      printArea.style.top = '0';
      printArea.style.width = '760px';
      printArea.style.backgroundColor = '#ffffff';
      
      // Ocultar botones en el clon
      const buttons = printArea.querySelectorAll('button');
      buttons.forEach(btn => btn.remove());
      
      // Ocultar inputs de archivos
      const fileInputs = printArea.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => input.remove());
      
      // Ocultar sección de adjuntos
      const adjuntosSection = printArea.querySelector('.bg-green-700');
      if (adjuntosSection) {
        const adjuntosContainer = adjuntosSection.closest('.mt-3');
        if (adjuntosContainer) {
          adjuntosContainer.remove();
        }
      }
      
      document.body.appendChild(printArea);
      document.head.appendChild(style);
      
      // Esperar un momento y luego imprimir
      setTimeout(() => {
        window.print();
        // Limpiar después de imprimir
        setTimeout(() => {
          if (document.body.contains(printArea)) {
            document.body.removeChild(printArea);
          }
          const printStyle = document.getElementById('print-cobranzas-styles');
          if (printStyle && document.head.contains(printStyle)) {
            document.head.removeChild(printStyle);
          }
          // Cerrar el popup después de imprimir
          setCobranzasPopupOpen(false);
        }, 1000);
      }, 200);
    }
  };

  // Función legacy para mantener compatibilidad
  const handlePrintCobranzas = () => {
    handlePrintCobranzasWindow();
  };

  // Generar PDF directamente desde el modal de cobranzas (sin vista previa)
  const handleGeneratePDFDirect = () => {
    const node = cobranzasPopupRef.current;
    if (!node) {
      alert('Error: No se encontró el contenido para generar el PDF.');
      return;
    }

    // Mostrar indicador de carga
    setGeneratingPDF(true);

    // Cargar html2pdf.js desde CDN si no está disponible
    const loadHtml2Pdf = () => {
      return new Promise((resolve, reject) => {
        if (window.html2pdf) {
          resolve(window.html2pdf);
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve(window.html2pdf);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadHtml2Pdf().then((html2pdf) => {
      // Preparar el contenido desde el popup original
      const content = prepareCobranzasContent();
      if (!content) {
        setGeneratingPDF(false);
        return;
      }

      // Crear un contenedor temporal VISIBLE para html2canvas
      const printContainer = document.createElement('div');
      printContainer.id = 'pdf-cobranzas-direct-container';
      printContainer.style.position = 'fixed';
      printContainer.style.left = '0';
      printContainer.style.top = '0';
      printContainer.style.width = '760px';
      printContainer.style.backgroundColor = '#ffffff';
      printContainer.style.padding = '20px';
      printContainer.style.zIndex = '99999';
      printContainer.style.visibility = 'visible';
      printContainer.style.opacity = '1';
      printContainer.style.display = 'block';
      printContainer.style.overflow = 'visible';
      
      // Aplicar estilos al contenido clonado
      content.style.position = 'relative';
      content.style.transform = 'none';
      content.style.top = 'auto';
      content.style.left = 'auto';
      content.style.margin = '0';
      content.style.width = '100%';
      content.style.maxWidth = 'none';
      content.style.maxHeight = 'none';
      content.style.overflow = 'visible';
      content.style.backgroundColor = '#ffffff';
      content.style.visibility = 'visible';
      content.style.opacity = '1';
      content.style.display = 'block';
      
      // Asegurar que todos los elementos hijos sean visibles
      const allChildren = content.querySelectorAll('*');
      allChildren.forEach(child => {
        if (child.style) {
          child.style.visibility = 'visible';
          child.style.opacity = '1';
          if (child.style.display === 'none') {
            child.style.display = '';
          }
        }
      });
      
      printContainer.appendChild(content);
      // Mover fuera de pantalla pero mantener en el DOM y visible para html2canvas
      printContainer.style.left = '-10000px';
      document.body.appendChild(printContainer);

      // Esperar a que se renderice completamente
      setTimeout(() => {
        // Asegurar que el contenedor tenga el tamaño correcto
        const containerHeight = Math.max(printContainer.scrollHeight, content.scrollHeight, 600);
        printContainer.style.height = `${containerHeight}px`;
        
        // Verificar que el contenido tenga elementos visibles
        const hasTable = printContainer.querySelector('table');
        const hasGreenHeader = printContainer.querySelector('.bg-green-600');
        const tableRows = hasTable ? hasTable.querySelectorAll('tr').length : 0;
        
        console.log('🔍 Verificando contenido para PDF directo:', {
          containerHeight: printContainer.scrollHeight,
          contentHeight: content.scrollHeight,
          containerWidth: printContainer.scrollWidth,
          hasTable: !!hasTable,
          hasGreenHeader: !!hasGreenHeader,
          tableRows: tableRows,
          tableHTML: hasTable ? hasTable.innerHTML.substring(0, 300) : 'No table'
        });

        if (!hasTable || tableRows === 0) {
          alert('Error: El contenido para el PDF está vacío. Por favor, intenta nuevamente.');
          if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer);
          }
          setGeneratingPDF(false);
          return;
        }

        const opt = {
          margin: [10, 10, 10, 10],
          filename: `Cobranzas_Proyecto_${projectData.nombreProyecto || 'Proyecto'}_${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: true, // Habilitar logging para debugging
            backgroundColor: '#ffffff',
            allowTaint: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: 760,
            windowHeight: containerHeight,
            onclone: (clonedDoc) => {
              // Asegurar que todos los estilos se apliquen correctamente en el clon de html2canvas
              const clonedContainer = clonedDoc.querySelector('#pdf-cobranzas-direct-container') || 
                                     clonedDoc.body.firstElementChild;
              if (clonedContainer) {
                clonedContainer.style.width = '760px';
                clonedContainer.style.backgroundColor = '#ffffff';
                clonedContainer.style.position = 'relative';
                clonedContainer.style.transform = 'none';
                clonedContainer.style.left = '0';
                clonedContainer.style.top = '0';
                clonedContainer.style.visibility = 'visible';
                clonedContainer.style.opacity = '1';
                clonedContainer.style.display = 'block';
                
                // Asegurar que las tablas se vean correctamente
                const tables = clonedContainer.querySelectorAll('table');
                tables.forEach(table => {
                  table.style.width = '100%';
                  table.style.borderCollapse = 'collapse';
                  table.style.visibility = 'visible';
                  table.style.display = 'table';
                  table.style.opacity = '1';
                  
                  // Asegurar que las celdas sean visibles
                  const cells = table.querySelectorAll('td, th');
                  cells.forEach(cell => {
                    cell.style.visibility = 'visible';
                    cell.style.opacity = '1';
                    cell.style.display = 'table-cell';
                  });
                });

                // Asegurar que todos los elementos sean visibles
                const allElements = clonedContainer.querySelectorAll('*');
                allElements.forEach(el => {
                  if (el.style) {
                    el.style.visibility = 'visible';
                    el.style.opacity = '1';
                    if (el.style.display === 'none') {
                      el.style.display = '';
                    }
                  }
                });
              }
            }
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        console.log('🔄 Generando PDF directo...', {
          containerHeight: printContainer.scrollHeight,
          containerWidth: printContainer.scrollWidth,
          hasTable: !!hasTable,
          tableContent: hasTable ? hasTable.innerHTML.substring(0, 200) : 'No table'
        });

        html2pdf().set(opt).from(printContainer).save().then(() => {
          // Limpiar el contenedor temporal
          if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer);
          }
          setGeneratingPDF(false);
          console.log('✅ PDF generado exitosamente');
        }).catch((error) => {
          console.error('❌ Error al generar PDF:', error);
          setGeneratingPDF(false);
          alert('Error al generar el PDF: ' + error.message + '\n\nIntenta usar "Vista Previa" primero para verificar el contenido.');
          // Limpiar el contenedor temporal en caso de error
          if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer);
          }
        });
      }, 1500); // Tiempo suficiente para asegurar renderizado completo
    }).catch((error) => {
      console.error('❌ Error al cargar html2pdf.js:', error);
      setGeneratingPDF(false);
      alert('Error al cargar la librería de PDF. Por favor, verifica tu conexión a internet e intenta nuevamente.');
    });
  };

  // Popup por-celda para "Contrato Prov. y Serv." (categoría)
  const [contratoPopupOpenFor, setContratoPopupOpenFor] = useState(null); // categoryId | null
  const [contratoPopupAnchor, setContratoPopupAnchor] = useState(null); // {top,left} | null
  const [contratoForm, setContratoForm] = useState({
    proveedor: '',
    descripcion: '',
    monto: '',
    abonos: Array.from({ length: 5 }, () => ({ fecha: '', monto: '' }))
  });
  const openContratoPopup = (categoria, anchorEl) => {
    const abonos = Array.isArray(categoria?.abonosContrato) && categoria.abonosContrato.length > 0
      ? categoria.abonosContrato.slice(0, 5).map(a => ({ fecha: a.fecha || '', monto: a.monto || '' }))
      : Array.from({ length: 5 }, () => ({ fecha: '', monto: '' }));
    setContratoForm({
      proveedor: categoria?.proveedorServicio || '',
      descripcion: categoria?.descripcionServicio || '',
      monto: categoria?.contratoProvedYServ || '',
      abonos
    });
    setContratoPopupOpenFor(categoria.id);
    try {
      if (anchorEl && anchorEl.getBoundingClientRect) {
        const rect = anchorEl.getBoundingClientRect();
        setContratoPopupAnchor({
          top: Math.max(rect.top + window.scrollY - 8, 8),
          left: rect.right + 12 + window.scrollX
        });
      } else {
        setContratoPopupAnchor(null);
      }
    } catch (e) {
      setContratoPopupAnchor(null);
    }
  };
  const closeContratoPopup = () => { setContratoPopupOpenFor(null); setContratoPopupAnchor(null); };
  const saveContratoPopup = () => {
    if (!contratoPopupOpenFor) return;
    const monto = parseMonetary(contratoForm.monto);
    const abonosSanitized = contratoForm.abonos.map(a => ({
      fecha: a.fecha || '',
      monto: parseMonetary(a.monto)
    }));
    // NO calcular saldosPorCancelar aquí - se calcula automáticamente en el useEffect
    // Fórmula automática: Saldos por Cancelar = Contrato Prov. Y Serv. - Registro Egresos
    updateCategory(contratoPopupOpenFor, {
      proveedorServicio: contratoForm.proveedor,
      descripcionServicio: contratoForm.descripcion,
      contratoProvedYServ: monto,
      abonosContrato: abonosSanitized
      // saldosPorCancelar se calculará automáticamente en el useEffect
    });
    setContratoPopupOpenFor(null);
  };

  // Popup por-celda: Registro de Egresos
  const [egresoPopupOpenFor, setEgresoPopupOpenFor] = useState(null); // categoryId | null
  const egresoFileInputRef = useRef(null);
  const [egresoForm, setEgresoForm] = useState({
    descripcion: '',
    items: Array.from({ length: 5 }, () => ({ fecha: '', monto: '' })),
    pdfName: '',
    pdfData: ''
  });
  const openEgresoPopup = (categoria) => {
    const items = Array.isArray(categoria?.egresosDetalles) && categoria.egresosDetalles.length > 0
      ? categoria.egresosDetalles.slice(0, 5).map(e => ({ fecha: e.fecha || '', monto: e.monto || '' }))
      : Array.from({ length: 5 }, () => ({ fecha: '', monto: '' }));
    setEgresoForm({
      descripcion: categoria?.descripcionEgreso || '',
      items,
      pdfName: categoria?.egresoPdfName || '',
      pdfData: categoria?.egresoPdfData || ''
    });
    setEgresoPopupOpenFor(categoria.id);
  };
  const closeEgresoPopup = () => setEgresoPopupOpenFor(null);
  const handleEgresoFilePick = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(',')[1] || '';
      setEgresoForm(f => ({ ...f, pdfName: file.name, pdfData: base64 }));
    };
    reader.readAsDataURL(file);
  };
  const viewEgresoPdf = () => {
    if (!egresoForm.pdfData) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<iframe src="data:application/pdf;base64,${egresoForm.pdfData}" frameborder="0" style="width:100%;height:100vh;"></iframe>`);
    }
  };
  const deleteEgresoPdf = () => setEgresoForm(f => ({ ...f, pdfName: '', pdfData: '' }));
  const saveEgresoPopup = () => {
    if (!egresoPopupOpenFor) return;
    const itemsSanitized = egresoForm.items.map(i => ({
      fecha: i.fecha || '',
      monto: parseMonetary(i.monto)
    }));
    const total = itemsSanitized.reduce((s, i) => s + (i.monto || 0), 0);
    updateCategory(egresoPopupOpenFor, {
      egresosDetalles: itemsSanitized,
      descripcionEgreso: egresoForm.descripcion,
      egresoPdfName: egresoForm.pdfName,
      egresoPdfData: egresoForm.pdfData,
      registroEgresos: total
    });
    setEgresoPopupOpenFor(null);
  };
  const [projectData, setProjectData] = useState({
    // Datos básicos del proyecto
    estado: 'Ejecución',
    nombreProyecto: proyecto?.nombreProyecto || `Proyecto ${projectNumber}`,
    tipo: 'Facturado',
    nombreCliente: proyecto?.nombreCliente || '',
    telefono: '',
    
    // Análisis Financiero del Proyecto (todos en cero para ser editables)
    utilidadEstimadaSinFactura: 'S/0.00',
    utilidadRealSinFactura: 'S/0.00',
    balanceUtilidadSinFactura: 'S/0.00',
    utilidadEstimadaConFactura: 'S/0.00',
    utilidadRealConFactura: 'S/0.00',
    balanceUtilidadConFactura: 'S/0.00',
    
    // Cobranzas del Proyecto
    montoContrato: 'S/0.00',
    adelantos: 'S/0.00',
    saldoXCobrar: 'S/0.00',
    presupuestoDelProyecto: 'S/0.00',
    totalEgresosProyecto: 'S/0.00',
    balanceDelPresupuesto: 'S/0.00',
    
    // 📅 COBRANZAS - FECHAS Y MONTOS EDITABLES
    cobranzas: Array.from({length: 13}, (_, i) => ({
      id: i + 1,
      fecha: '',
      monto: 0
    })),
    
    // IGV - SUNAT 18% (todos en cero para ser editables)
    igvSunat: 'S/0.00',
    creditoFiscalEstimado: 'S/0.00',
    impuestoEstimadoDelProyecto: 'S/0.00',
    creditoFiscalReal: 'S/0.00',
    impuestoRealDelProyecto: 'S/0.00',
    
    // Totales y Balance (todos en cero para ser editables)
    totalContratoProveedores: 'S/0.00',
    totalSaldoPorPagarProveedores: 'S/0.00',
    balanceDeComprasDelProyecto: 'S/0.00',
    
    // Observaciones
    observacionesDelProyecto: '',
    
    // Fechas de cobro (15 campos)
    fechaCobro1: 'S/0.00',
    fechaCobro2: 'S/0.00',
    fechaCobro3: 'S/0.00',
    fechaCobro4: 'S/0.00',
    fechaCobro5: 'S/0.00',
    fechaCobro6: 'S/0.00',
    fechaCobro7: 'S/0.00',
    fechaCobro8: 'S/0.00',
    fechaCobro9: 'S/0.00',
    fechaCobro10: 'S/0.00',
    fechaCobro11: 'S/0.00',
    fechaCobro12: 'S/0.00',
    fechaCobro13: 'S/0.00',
    fechaCobro14: 'S/0.00',
    fechaCobro15: 'S/0.00',
    
    // Categorías iniciales con datos de ejemplo
    categorias: [
      { id: 1, nombre: 'Melamina y Servicios', tipo: 'F', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 2, nombre: 'Melamina High Gloss', tipo: 'F', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 3, nombre: 'Accesorios y Ferretería', tipo: 'F', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 4, nombre: 'Puertas Alu Vidrios', tipo: 'F', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 5, nombre: 'Led Y Electricidad', tipo: 'F', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 6, nombre: 'Flete y/o Camioneta', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 7, nombre: 'Logística Operativa', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 8, nombre: 'Extras y/o Eventos', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 9, nombre: 'Despecie', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 10, nombre: 'Mano de Obra', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 11, nombre: 'Mano de Obra', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 12, nombre: 'Mano de Obra', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 13, nombre: 'Mano de Obra', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 14, nombre: 'OF - ESCP', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 15, nombre: 'Granito Y/O Cuarzo', tipo: 'F', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 16, nombre: 'Extras Y/O Eventos GyC', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 17, nombre: 'Tercializacion 1 Facturada', tipo: 'F', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 18, nombre: 'Extras Y/O Eventos Terc. 1', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 19, nombre: 'Tercializacion 2 Facturada', tipo: 'F', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 20, nombre: 'Extras Y/O Eventos Terc. 2', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 21, nombre: 'Tercializacion 1 NO Facturada', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 22, nombre: 'Extras Y/O Eventos Terc. 1 NF', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 23, nombre: 'Tercializacion 2 NO Facturada', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' },
      { id: 24, nombre: 'Extras Y/O Eventos Terc. 2 NF', presupuestoDelProyecto: 'S/0.00', contratoProvedYServ: 'S/0.00', registroEgresos: 'S/0.00', saldosPorCancelar: 'S/0.00' }
    ]
  });

  // Helper para formatear dinero como muestra la UI
  const moneyFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatMoney = (v) => {
    const num = parseMonetary(v);
    return `S/${Number.isFinite(num) ? moneyFormatter.format(num) : '0.00'}`;
  };
  // Formato sin signo negativo (valor absoluto)
  const formatAbsMoney = (v) => {
    const num = Math.abs(parseMonetary(v));
    return `S/${Number.isFinite(num) ? moneyFormatter.format(num) : '0.00'}`;
  };

  // Helper para extraer solo números y decimales de un string (permite edición libre con puntos y comas)
  const extractNumericValue = (str) => {
    if (!str || str === '') return '';
    // Permite números, punto, coma y signo negativo al inicio
    let cleaned = str.toString().replace(/[^0-9.,-]/g, '');
    
    // Detectar si hay coma o punto
    const hasComa = cleaned.includes(',');
    const hasPunto = cleaned.includes('.');
    
    if (hasComa && hasPunto) {
      // Si tiene ambos, determinar cuál es el separador decimal basado en la posición
      const lastComa = cleaned.lastIndexOf(',');
      const lastPunto = cleaned.lastIndexOf('.');
      
      if (lastPunto > lastComa) {
        // Formato: 20,000.00 (coma para miles, punto para decimales) - FORMATO ESTÁNDAR
        // Quitar todas las comas (son separadores de miles)
        cleaned = cleaned.replace(/,/g, '');
      } else {
        // Formato: 20.000,00 (punto para miles, coma para decimales) - FORMATO EUROPEO
        // Quitar todos los puntos (son separadores de miles) y convertir coma a punto
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      }
    } else if (hasComa) {
      // Solo tiene coma
      const comas = cleaned.split(',');
      if (comas.length === 2 && comas[1].length <= 3) {
        // Probablemente es formato: 20000,50 (coma como decimal)
        cleaned = comas[0] + '.' + comas[1];
      } else if (comas.length > 1) {
        // Múltiples comas: todas menos la última son miles, la última puede ser decimal
        const lastPart = comas[comas.length - 1];
        if (lastPart.length <= 3) {
          // La última parte es decimal
          cleaned = comas.slice(0, -1).join('') + '.' + lastPart;
        } else {
          // Todas son miles
          cleaned = comas.join('');
        }
      } else {
        // Solo una coma, si el número es grande probablemente es miles, si es pequeño puede ser decimal
        const numPart = comas[0];
        if (numPart.length > 3) {
          // Probablemente es miles, quitar la coma
          cleaned = numPart;
        } else {
          // Probablemente es decimal
          cleaned = cleaned.replace(',', '.');
        }
      }
    } else if (hasPunto) {
      // Solo tiene punto
      const puntos = cleaned.split('.');
      if (puntos.length > 2) {
        // Múltiples puntos: todos menos el último son miles
        cleaned = puntos.slice(0, -1).join('') + '.' + puntos[puntos.length - 1];
      }
      // Si tiene un solo punto, dejarlo como está (probablemente decimal)
    }
    
    // Asegurar que solo hay un punto decimal
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    return cleaned;
  };

  // Helper para formatear un número con separadores de miles y decimales automáticamente
  const formatWithDecimals = (value) => {
    const num = parseFloat(extractNumericValue(value)) || 0;
    // Formatear con separadores de miles y 2 decimales
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Helper para formatear un número para mostrar (con separadores de miles y decimales)
  const formatMonetaryDisplay = (value) => {
    const num = parseMonetary(value);
    if (num === 0 || !Number.isFinite(num)) return '';
    // Formatear con separadores de miles y 2 decimales
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Helper para obtener el valor display de una celda monetaria (sin formato forzado)
  const getMonetaryDisplayValue = (value, isEditing = false) => {
    if (isEditing) {
      // Mientras edita, mostrar solo el número sin formato
      const num = extractNumericValue(value);
      return num === '' ? '' : num;
    }
    // Cuando no está editando, mostrar formato solo si hay valor
    const num = parseMonetary(value);
    if (num === 0 || !Number.isFinite(num)) return '';
    // Permitir mostrar con o sin decimales según lo que el usuario escribió
    const str = value?.toString() || '';
    if (str.includes('.')) {
      return `S/${num.toFixed(2)}`;
    }
    return `S/${Math.round(num)}`;
  };

  // Sincronizar estado local con cambios del servicio (project)
  useEffect(() => {
    if (!project) return;

    try {
      setProjectData(prev => {
        // ⚡ Asegurar que siempre tengamos las 24 categorías por defecto
        let categoriasToMap = project.categorias || [];
        
        // Si no hay categorías o no son 24, inicializar con las categorías por defecto
        if (!Array.isArray(categoriasToMap) || categoriasToMap.length !== 24) {
          console.log(`🔧 Inicializando categorías faltantes para proyecto ${projectNumber}`);
          // Obtener categorías por defecto desde projectDataService
          const defaultCategories = projectDataService.getInitialProjects()[1].categorias;
          categoriasToMap = [...defaultCategories];
          
          // Si el proyecto tiene algunas categorías, intentar preservarlas
          if (Array.isArray(project.categorias) && project.categorias.length > 0) {
            // Mapear las categorías existentes por nombre
            const existingCategoriesMap = new Map();
            project.categorias.forEach(cat => {
              if (cat.nombre) {
                existingCategoriesMap.set(cat.nombre.toLowerCase().trim(), cat);
              }
            });
            
            // Actualizar las categorías por defecto con los valores existentes
            categoriasToMap = defaultCategories.map(defaultCat => {
              const existing = existingCategoriesMap.get(defaultCat.nombre.toLowerCase().trim());
              return existing ? { ...defaultCat, ...existing } : defaultCat;
            });
          }
        }
        
        // 🔒 PRESERVAR valores editados por el usuario (SISTEMA ROBUSTO)
        const mappedCategorias = categoriasToMap.map(cat => {
          // ⚡ SOLO usar ID para identificar categorías (NO usar nombre como fallback para evitar propagación)
          // Esto asegura que cada fila sea independiente, incluso si tienen el mismo nombre
          const prevCat = prev.categorias?.find(pc => String(pc.id) === String(cat.id));
          
          // Parsear valores del servicio (pueden venir como número o string formateado)
          const presupuestoServicio = parseMonetary(cat.presupuestoDelProyecto || 0);
          const contratoServicio = parseMonetary(cat.contratoProvedYServ || 0);
          const egresosServicio = parseMonetary(cat.registroEgresos || 0);
          const saldosServicio = parseMonetary(cat.saldosPorCancelar || 0);
          
          // Parsear valores del estado previo
          const presupuestoPrev = prevCat ? parseMonetary(prevCat.presupuestoDelProyecto || 0) : 0;
          const contratoPrev = prevCat ? parseMonetary(prevCat.contratoProvedYServ || 0) : 0;
          const egresosPrev = prevCat ? parseMonetary(prevCat.registroEgresos || 0) : 0;
          const saldosPrev = prevCat ? parseMonetary(prevCat.saldosPorCancelar || 0) : 0;
          
          // 🔒 VERIFICAR SI EL USUARIO EDITÓ ESTOS VALORES (prioridad absoluta)
          const presupuestoEditado = userEditedValuesRef.current.get(`${cat.id}-presupuestoDelProyecto`);
          const contratoEditado = userEditedValuesRef.current.get(`${cat.id}-contratoProvedYServ`);
          const egresosEditado = userEditedValuesRef.current.get(`${cat.id}-registroEgresos`);
          const saldosEditado = userEditedValuesRef.current.get(`${cat.id}-saldosPorCancelar`);
          
          // ⚡ LÓGICA DE PRESERVACIÓN (en orden de prioridad):
          // 1. Si el usuario editó el valor → SIEMPRE usar el valor editado
          // 2. Si el valor previo > 0 → mantenerlo (usuario lo escribió antes)
          // 3. Solo usar el valor del servicio si no hay valor previo ni editado
          const presupuestoFinal = presupuestoEditado !== undefined ? presupuestoEditado : 
                                   (presupuestoPrev > 0 ? presupuestoPrev : presupuestoServicio);
          const contratoFinal = contratoEditado !== undefined ? contratoEditado : 
                               (contratoPrev > 0 ? contratoPrev : contratoServicio);
          const egresosFinal = egresosEditado !== undefined ? egresosEditado : 
                             (egresosPrev > 0 ? egresosPrev : egresosServicio);
          const saldosFinal = saldosEditado !== undefined ? saldosEditado : 
                            (saldosPrev > 0 ? saldosPrev : saldosServicio);
          
          return {
            id: cat.id,
            nombre: cat.nombre || '',
            tipo: cat.tipo || '',
            presupuestoDelProyecto: formatMoney(presupuestoFinal),
            contratoProvedYServ: formatMoney(contratoFinal),
            registroEgresos: formatMoney(egresosFinal),
            saldosPorCancelar: formatMoney(saldosFinal)
          };
        });

        return {
          ...prev,
          nombreProyecto: project.nombreProyecto || prev.nombreProyecto,
          nombreCliente: project.nombreCliente || prev.nombreCliente,
          montoContrato: formatMoney(project.montoContrato || 0),
          adelantos: formatMoney(project.adelantos || 0),
          presupuestoDelProyecto: formatMoney(project.presupuestoProyecto || 0),
          utilidadEstimadaSinFactura: formatMoney(project.utilidadEstimadaSinFactura || 0),
          utilidadEstimadaConFactura: formatMoney(project.utilidadEstimadaConFactura || 0),
          totalContratoProveedores: formatMoney(project.totalContratoProveedores || 0),
          totalSaldoPorPagarProveedores: formatMoney(project.totalSaldoPorPagarProveedores || 0),
          balanceDeComprasDelProyecto: formatMoney(project.balanceDeComprasDelProyecto || 0),
          cobranzas: Array.isArray(project.cobranzas) ? project.cobranzas.map(c => ({ ...c })) : prev.cobranzas,
          categorias: mappedCategorias
        };
      });
      
      // ⚡ Si el proyecto no tenía categorías, actualizarlo en el servicio
      if (!project.categorias || project.categorias.length !== 24) {
        const defaultCategories = projectDataService.getInitialProjects()[1].categorias;
        if (updateField) {
          updateField('categorias', defaultCategories);
        }
      }
    } catch (e) {
      console.warn('Error sincronizando projectData desde servicio', e);
    }
  }, [project, projectNumber, updateField, editingCells, editingMontoContrato]); // ⚡ Incluir editingCells para preservar valores

  // Helpers para persistencia local: soportar ambas claves usadas en el proyecto
  const saveProjectToLocalStores = (projNum, data) => {
    try {
      const keyA = 'ksamti_proyectos'; // antigua/cliente
      const keyB = 'ksamati_projects'; // servicio

      const a = JSON.parse(localStorage.getItem(keyA) || '{}');
      a[projNum] = { ...(a[projNum] || {}), ...data };
      localStorage.setItem(keyA, JSON.stringify(a));

      const b = JSON.parse(localStorage.getItem(keyB) || '{}');
      b[projNum] = { ...(b[projNum] || {}), ...data };
      localStorage.setItem(keyB, JSON.stringify(b));
    } catch (e) {
      console.warn('No se pudo guardar projectData en localStores:', e);
    }
  };

  const loadProjectFromLocalStores = (projNum) => {
    try {
      const keyA = 'ksamti_proyectos';
      const keyB = 'ksamati_projects';
      const a = JSON.parse(localStorage.getItem(keyA) || '{}');
      if (a && a[projNum]) return a[projNum];
      const b = JSON.parse(localStorage.getItem(keyB) || '{}');
      if (b && b[projNum]) return b[projNum];
    } catch (e) {
      console.warn('Error cargando projectData desde localStores', e);
    }
    return null;
  };

  // 🔄 AUTO-SAVE: Handler para campos del proyecto (nuevo sistema)
  const handleInputChange = (field, value) => {
    // Sistema de auto-sync: cualquier cambio se guarda automáticamente
    if (updateField) {
      updateField(field, value);
    }
    
    // Mantener compatibilidad con estado local
    setProjectData(prev => ({
        ...prev,
        [field]: value
    }));

    // Persistencia redundante: guardar en localStores para asegurar último estado
    try {
      const numeric = (typeof value === 'number') ? value : parseMonetary(value);
      saveProjectToLocalStores(projectNumber, { [field]: numeric });
    } catch (e) {
      /* ignore */
    }
  };

  // 🔄 AUTO-SAVE: Handler para categorías (nuevo sistema)
  // Handler para cuando una celda monetaria gana el foco
  const handleMonetaryCellFocus = (categoriaId, field, currentValue) => {
    const cellKey = `${categoriaId}-${field}`;
    setEditingCells(prev => ({ ...prev, [cellKey]: true }));
    // Inicializar el valor raw con el número sin separadores de miles pero con decimales
    const num = parseMonetary(currentValue);
    // Mostrar sin separadores de miles para facilitar la edición
    setEditingValues(prev => ({ ...prev, [cellKey]: num === 0 ? '' : num.toFixed(2).replace(/,/g, '') }));
  };

  // Handler para cuando una celda monetaria pierde el foco
  const handleMonetaryCellBlur = (categoriaId, field) => {
    const cellKey = `${categoriaId}-${field}`;
    setEditingCells(prev => {
      const newState = { ...prev };
      delete newState[cellKey];
      return newState;
    });
    // Guardar el valor final: primero extraer el número correctamente, luego guardar
    const rawValue = editingValues[cellKey] || '';
    // Extraer el número correctamente (maneja comas como separadores de miles)
    const numericString = extractNumericValue(rawValue);
    const finalValue = parseFloat(numericString) || 0;
    
    // 🔒 MARCAR COMO EDITADO POR EL USUARIO (preservar siempre)
    userEditedValuesRef.current.set(cellKey, finalValue);
    console.log(`🔒 Valor marcado como editado por usuario: ${cellKey} = ${finalValue}`);
    
    // Actualizar el campo modificado PRIMERO en el servicio (para guardar en BD)
    if (updateCategory) {
      updateCategory(categoriaId, { [field]: finalValue });
    }
    
    // Actualizar estado local INMEDIATAMENTE (para mostrar el valor formateado)
    const updatedCategorias = projectData.categorias.map(cat => {
      if (cat.id === categoriaId) {
        const updatedCat = { ...cat, [field]: formatMoney(finalValue) }; // ⚡ Formatear para mostrar correctamente
        
        // Si se actualizó presupuestoDelProyecto o registroEgresos, calcular saldosPorCancelar automáticamente
        // Solo calcular si hay un valor en "Registro Egresos"
        if (field === 'presupuestoDelProyecto' || field === 'registroEgresos') {
          const presupuesto = field === 'presupuestoDelProyecto' ? finalValue : parseMonetary(cat.presupuestoDelProyecto);
          const egresos = field === 'registroEgresos' ? finalValue : parseMonetary(cat.registroEgresos);
          
          // Solo calcular si hay egresos (mayor que 0)
          let saldosCalculados = 0;
          if (egresos && egresos > 0) {
            saldosCalculados = presupuesto - egresos;
          }
          
          updatedCat.saldosPorCancelar = formatMoney(saldosCalculados); // ⚡ Formatear para mostrar correctamente
          
          // Actualizar también en el servicio (guardar número sin formato)
          if (updateCategory) {
            updateCategory(categoriaId, { saldosPorCancelar: saldosCalculados });
          }
        }
        
        return updatedCat;
      }
      return cat;
    });
    
    setProjectData(prev => ({
      ...prev,
      categorias: updatedCategorias
    }));
    
    // Limpiar el valor raw
    setEditingValues(prev => {
      const newState = { ...prev };
      delete newState[cellKey];
      return newState;
    });
  };

  const handleCategoriaChange = (categoriaId, field, value) => {
    const monetaryKeys = ['presupuestoDelProyecto', 'contratoProvedYServ', 'registroEgresos', 'saldosPorCancelar'];
    const isMonetary = monetaryKeys.includes(field);
    
    // Guardar valor raw mientras se edita (permitir puntos y comas)
    if (isMonetary) {
      const cellKey = `${categoriaId}-${field}`;
      // Guardar el valor tal como lo escribe el usuario (con puntos y comas)
      // Solo limpiar caracteres no numéricos excepto punto y coma
      const cleanedValue = value.toString().replace(/[^0-9.,-]/g, '');
      setEditingValues(prev => ({ ...prev, [cellKey]: cleanedValue }));
    } else {
    // Sistema de auto-sync: cualquier cambio se guarda automáticamente
    if (updateCategory) {
        updateCategory(categoriaId, { [field]: value });
      }
    // Mantener compatibilidad con estado local
    setProjectData(prev => ({
      ...prev,
      categorias: prev.categorias.map(cat => 
        cat.id === categoriaId ? { ...cat, [field]: value } : cat
      )
    }));
    }
  };

  // 🧮 FUNCIÓN DE TOTALES PARA LA TABLA (suma vertical - incluye TODAS las filas)
  const calcularTotalesTabla = () => {
    if (!projectData.categorias || projectData.categorias.length === 0) {
      return {
        presupuesto: 0,
        contrato: 0,
        egresos: 0,
        saldos: 0
      };
    }
    const sanitize = (v) => {
      if (v === undefined || v === null) return 0;
      try {
        const s = String(v).replace(/[^0-9.-]/g, '');
        return parseFloat(s) || 0;
      } catch (e) { return 0; }
    };

    // Para la tabla: sumar TODAS las filas verticalmente (incluyendo las marcadas en rojo)
    return projectData.categorias.reduce((totales, categoria) => {
      const presupuesto = sanitize(categoria.presupuestoDelProyecto);
      const contrato = sanitize(categoria.contratoProvedYServ);
      const egresos = sanitize(categoria.registroEgresos);
      
      // Para saldos: solo sumar las categorías específicas marcadas
      let saldos = 0;
      if (shouldSumInTotalSaldos(categoria.nombre)) {
        saldos = sanitize(categoria.saldosPorCancelar);
      }

      return {
        presupuesto: totales.presupuesto + presupuesto,
        contrato: totales.contrato + contrato, // Sumar TODOS los contratos
        egresos: totales.egresos + egresos, // Sumar TODOS los egresos
        saldos: totales.saldos + saldos
      };
    }, { presupuesto: 0, contrato: 0, egresos: 0, saldos: 0 });
  };

  // 🧮 FUNCIÓN DE TOTALES PARA COLUMNAS DE LA DERECHA (excluye filas marcadas en rojo)
  const calcularTotalesHorizontales = () => {
    if (!projectData.categorias || projectData.categorias.length === 0) {
      return {
        presupuesto: 0,
        contrato: 0,
        egresos: 0
      };
    }
    const sanitize = (v) => {
      if (v === undefined || v === null) return 0;
      try {
        const s = String(v).replace(/[^0-9.-]/g, '');
        return parseFloat(s) || 0;
      } catch (e) { return 0; }
    };

    // Para columnas de la derecha: EXCLUIR filas marcadas en rojo
    return projectData.categorias.reduce((totales, categoria) => {
      const presupuesto = sanitize(categoria.presupuestoDelProyecto);
      const contrato = sanitize(categoria.contratoProvedYServ);
      const egresos = sanitize(categoria.registroEgresos);
      
      // 🔴 EXCLUIR SOLO LAS FILAS MARCADAS EN ROJO de los cálculos horizontales
      // Solo las filas identificadas por shouldSumInTotalSaldos (marcadas en el cuadro rojo)
      // Las otras filas con presupuesto > 0 deben sumarse normalmente
      const esFilaMarcada = shouldSumInTotalSaldos(categoria.nombre);
      const debeExcluirse = esFilaMarcada; // Solo excluir las filas marcadas específicamente

      // Debug: mostrar qué filas se están excluyendo
      if (debeExcluirse && (contrato > 0 || egresos > 0)) {
        console.log(`🔴 EXCLUYENDO fila "${categoria.nombre}": Contrato=${contrato}, Egresos=${egresos}, Presupuesto=${presupuesto}, EsMarcada=${esFilaMarcada}`);
      }

      return {
        // Solo sumar Presupuesto, Contrato y Egresos si NO está marcada en rojo
        presupuesto: totales.presupuesto + (debeExcluirse ? 0 : presupuesto),
        contrato: totales.contrato + (debeExcluirse ? 0 : contrato),
        egresos: totales.egresos + (debeExcluirse ? 0 : egresos)
      };
    }, { presupuesto: 0, contrato: 0, egresos: 0 });
  };

  // 🧮 FUNCIÓN PARA CALCULAR TOTAL SALDO POR PAGAR PROVEEDORES
  // Suma los "Saldos por cancelar" SOLO de las filas marcadas en rojo
  const calcularTotalSaldoPorPagarProveedores = () => {
    if (!projectData.categorias || projectData.categorias.length === 0) {
      return 0;
    }
    const sanitize = (v) => {
      if (v === undefined || v === null) return 0;
      try {
        const s = String(v).replace(/[^0-9.-]/g, '');
        return parseFloat(s) || 0;
      } catch (e) { return 0; }
    };

    return projectData.categorias.reduce((sum, categoria) => {
      if (shouldSumInTotalSaldos(categoria.nombre)) {
        return sum + sanitize(categoria.saldosPorCancelar);
      }
      return sum;
    }, 0);
  };

  // Función de compatibilidad (usa totales de tabla para mantener compatibilidad)
  const calcularTotales = calcularTotalesTabla;

  // 🧮 FÓRMULAS AUTOMÁTICAS DEL ANÁLISIS FINANCIERO
  const calcularAnalisisFinanciero = () => {
    // Usar totales horizontales (excluye filas marcadas) para los cálculos de la derecha
    const totales = calcularTotalesHorizontales();
    const montoContrato = parseMonetary(projectData.montoContrato);
    const presupuestoProyecto = parseMonetary(projectData.presupuestoDelProyecto);
    
    // Balance de Compras = Presupuesto - Egresos
    const balanceCompras = totales.presupuesto - totales.egresos;
    
    // Utilidad Real = Monto Contrato - Egresos Totales
    const utilidadReal = montoContrato - totales.egresos;
    
    // Saldo por Cobrar = Monto Contrato - Adelantos
  const adelantos = parseMonetary(projectData.adelantos);
    const saldoPorCobrar = montoContrato - adelantos;

    return {
      balanceCompras,
      utilidadReal,
      saldoPorCobrar,
      totalEgresos: totales.egresos,
      totalContrato: totales.contrato
    };
  };

  // 💰 FUNCIONES PARA COBRANZAS
  // 🎯 HANDLERS PARA COBRANZAS - FORMATO MONETARIO CON DECIMALES
  const handleCobranzaMontoFocus = (index, currentValue) => {
    const cellKey = `cobranza-${index}-monto`;
    // Mostrar valor raw sin formato para edición fácil
    const rawValue = parseMonetary(currentValue);
    setEditingCells(prev => ({ ...prev, [cellKey]: true }));
    setEditingValues(prev => ({ ...prev, [cellKey]: rawValue === 0 ? '' : rawValue.toString() }));
  };

  const handleCobranzaMontoBlur = (index) => {
    const cellKey = `cobranza-${index}-monto`;
    setEditingCells(prev => {
      const newState = { ...prev };
      delete newState[cellKey];
      return newState;
    });
    
    // Guardar el valor final: primero extraer el número correctamente, luego guardar
    const rawValue = editingValues[cellKey] || '';
    const numericString = extractNumericValue(rawValue);
    const finalValue = parseFloat(numericString) || 0;
    
    // Actualizar el estado
    setProjectData(prev => {
      const newCobranzas = [...prev.cobranzas];
      newCobranzas[index] = { ...newCobranzas[index], monto: finalValue };
      
      // 🔄 AUTO-SAVE: Guardar en el servicio
      if (updateField) {
        updateField('cobranzas', newCobranzas);
      }
      
      return { ...prev, cobranzas: newCobranzas };
    });
    
    // Limpiar el valor raw
    setEditingValues(prev => {
      const newState = { ...prev };
      delete newState[cellKey];
      return newState;
    });
  };

  const handleCobranzaChange = (index, field, value) => {
      if (field === 'monto') {
      // Guardar valor raw mientras se edita (permitir puntos y comas)
      const cellKey = `cobranza-${index}-monto`;
      // Guardar el valor tal como lo escribe el usuario (con puntos y comas)
      const cleanedValue = value.toString().replace(/[^0-9.,-]/g, '');
      setEditingValues(prev => ({ ...prev, [cellKey]: cleanedValue }));
      } else {
      // Para otros campos (fecha), guardar directamente
      setProjectData(prev => {
        const newCobranzas = [...prev.cobranzas];
        newCobranzas[index] = { ...newCobranzas[index], [field]: value };
      
      // 🔄 AUTO-SAVE: Guardar en el servicio
      if (updateField) {
        updateField('cobranzas', newCobranzas);
      }
      
        return { ...prev, cobranzas: newCobranzas };
    });
    }
  };

  // 🧮 CALCULAR TOTAL DE COBRANZAS
  const calcularTotalCobranzas = () => {
    return projectData.cobranzas?.reduce((total, cobranza) => {
      return total + (parseFloat(cobranza.monto) || 0);
    }, 0) || 0;
  };

  // 🧮 SALDO RESTANTE = Monto del contrato - total de cobranzas
  const calcularSaldoRestante = () => {
    const contrato = parseMonetary(projectData.montoContrato) || 0;
    const totalCobranzas = calcularTotalCobranzas();
    const restante = contrato - totalCobranzas;
    return restante;
  };

  // 🎨 Estilo de nombres según imagen Excel (colores por categoría)
  const getNombreCategoriaClass = (nombre) => {
    try {
      const n = String(nombre || '').toLowerCase();
      if (!n) return 'text-black';
      
      // Púrpura/Morado (indigo): Comision, Ayudante
      if (n.includes('comision') || n.includes('comisión')) return 'text-indigo-600';
      if (n.includes('ayudante')) return 'text-indigo-600';
      
      // Naranja: Melamina y Servicios, Melamina High Gloss (ambas con el mismo color)
      if (n.includes('melamina y servicios') || n === 'melamina y servicios') return 'text-orange-600';
      if (n.includes('melamina high gloss') || n === 'melamina high gloss') return 'text-orange-600';
      
      // Azul: Accesorios, Puertas, Led
      if (n.includes('accesorios') || n.includes('puertas') || n.includes('vidrios') || n.includes('led')) {
        return 'text-blue-600';
      }
      
      // Rojo: Despecie, Mano de Obra
      if (n.includes('despecie') || n.includes('despiece')) return 'text-red-600';
      if (n.includes('mano de obra')) return 'text-red-600';
      
      // Rojo: Granito Y/O Cuarzo, Extras Y/O Eventos GyC, Tercializacion Facturada (1 y 2), Extras Y/O Eventos Terc. 1 y 2
      if (n.includes('granito') || n.includes('cuarzo')) return 'text-red-600';
      if (n.includes('extras y/o eventos gyc') || n === 'extras y/o eventos gyc') return 'text-red-600';
      if ((n.includes('tercializacion 1 facturada') || n === 'tercialización 1 facturada') && !n.includes('no')) return 'text-red-600';
      if (n.includes('extras y/o eventos terc. 1') && !n.includes('nf')) return 'text-red-600';
      if ((n.includes('tercializacion 2 facturada') || n === 'tercialización 2 facturada') && !n.includes('no')) return 'text-red-600';
      if (n.includes('extras y/o eventos terc. 2') && !n.includes('nf')) return 'text-red-600';
      
      // Verde: Flete, Logística, Extras y/o Eventos (sin GyC ni Terc)
      if (n.includes('flete') || n.includes('logística') || n.includes('logistica')) return 'text-green-600';
      if (n.includes('extras y/o eventos') && !n.includes('gyc') && !n.includes('terc')) return 'text-green-600';
      
      // Gris: NO Facturada, NF
      if ((n.includes('tercializacion') || n.includes('extras')) && (n.includes('no facturada') || n.includes('nf'))) {
        return 'text-gray-500';
      }
      
      // Negro: resto (OF - ESCP, etc.)
      return 'text-black';
    } catch {
      return 'text-black';
    }
  };

  // 💰 MANEJAR CAMBIO EN MONTO DEL CONTRATO
  const handleMontoContratoChange = (value) => {
    // Guardar valor raw mientras se edita (permitir puntos y comas)
    // Solo limpiar caracteres no numéricos excepto punto y coma
    const cleanedValue = value.toString().replace(/[^0-9.,-]/g, '');
    setMontoContratoRaw(cleanedValue);
  };

  const handleMontoContratoFocus = () => {
    setEditingMontoContrato(true);
    const num = parseMonetary(projectData.montoContrato);
    // Mostrar sin separadores de miles para facilitar la edición
    setMontoContratoRaw(num === 0 ? '' : num.toFixed(2).replace(/,/g, ''));
  };

  const handleMontoContratoBlur = () => {
    setEditingMontoContrato(false);
    // Extraer el número correctamente (maneja comas como separadores de miles)
    const numericString = extractNumericValue(montoContratoRaw);
    const numericValue = parseFloat(numericString) || 0;
    // Calcular equivalentes: con factura (sin IGV) y sin factura
    const estimadoConFactura = numericValue > 0 ? (numericValue / 1.18) : 0;
    
    // 🧮 UTILIDAD ESTIMADA SIN FACTURA se calculará automáticamente en el useEffect
    // No establecerla aquí, se calculará como: Monto del Contrato - Presupuesto Del Proyecto

    setProjectData(prev => ({
      ...prev,
      montoContrato: numericValue,
      utilidadEstimadaConFactura: estimadoConFactura,
      // ⛔ Ya no propagar a todas las filas de Cobranzas. Dejarlas en 0 (vacías visualmente).
      cobranzas: Array.isArray(prev.cobranzas)
        ? prev.cobranzas.map(c => ({ ...c, monto: 0 }))
        : prev.cobranzas
    }));
    
    // 🔄 AUTO-SAVE
    if (updateField) {
      updateField('montoContrato', numericValue);
      // También actualizar utilidad estimada con factura derivada del contrato
      updateField('utilidadEstimadaConFactura', estimadoConFactura);
      // utilidadEstimadaSinFactura se calculará automáticamente en el useEffect
      try {
        // Guardar cobranzas actualizadas si existen
        const current = projectData?.cobranzas || [];
        const updated = Array.isArray(current)
          ? current.map(c => ({ ...c, monto: 0 }))
          : current;
        updateField('cobranzas', updated);
      } catch (e) {
        // ignore save error for optional field
      }
    }
    setMontoContratoRaw('');
  };

  // 💰 MANEJAR CAMBIO EN ADELANTOS
  const handleAdelantosChange = (value) => {
    // Extraer el número correctamente (maneja comas como separadores de miles)
    const numericString = extractNumericValue(value);
    const numericValue = parseFloat(numericString) || 0;
    setProjectData(prev => ({ ...prev, adelantos: numericValue }));
    
    // 🔄 AUTO-SAVE
    if (updateField) {
      updateField('adelantos', numericValue);
    }
  };

  // 📊 MANEJAR CAMBIO EN UTILIDAD ESTIMADA SIN FACTURA
  const handleUtilidadEstimadaSFChange = (value) => {
    // Extraer el número correctamente (maneja comas como separadores de miles)
    const numericString = extractNumericValue(value);
    const numericValue = parseFloat(numericString) || 0;
    setProjectData(prev => ({ ...prev, utilidadEstimadaSinFactura: numericValue }));
    
    // 🔄 AUTO-SAVE
    if (updateField) {
      updateField('utilidadEstimadaSinFactura', numericValue);
    }
  };

  // 📊 MANEJAR CAMBIO EN UTILIDAD ESTIMADA CON FACTURA
  const handleUtilidadEstimadaCFChange = (value) => {
    // Extraer el número correctamente (maneja comas como separadores de miles)
    const numericString = extractNumericValue(value);
    const numericValue = parseFloat(numericString) || 0;
    setProjectData(prev => ({ ...prev, utilidadEstimadaConFactura: numericValue }));
    
    // 🔄 AUTO-SAVE
    if (updateField) {
      updateField('utilidadEstimadaConFactura', numericValue);
    }
  };

  // 📊 OBTENER TOTALES CALCULADOS
  // Totales para la tabla (suma vertical - incluye todas las filas)
  const totalesCalculados = calcularTotalesTabla();
  // Totales para columnas de la derecha (excluye filas marcadas en rojo)
  const totalesHorizontales = calcularTotalesHorizontales();
  const analisisCalculado = calcularAnalisisFinanciero();

  // 🔄 AUTO-SYNC: Actualizar campos calculados cuando cambien las categorías
  // ⚡ PROTECCIÓN: NO ejecutar si hay celdas siendo editadas (evitar sobrescribir valores del usuario)
  useEffect(() => {
    // ⚡ Si hay celdas siendo editadas, NO ejecutar este efecto (preservar valores del usuario)
    const hayCeldasEditando = Object.keys(editingCells).length > 0;
    if (hayCeldasEditando) {
      return; // Salir temprano para no sobrescribir valores en edición
    }
    
    if (projectData.categorias && updateField) {
      // 🧮 CALCULAR TOTALES AUTOMÁTICAMENTE PARA COLUMNAS DE LA DERECHA
      // Usar la función que excluye las filas marcadas en rojo
      const totalesCategoria = calcularTotalesHorizontales();
      
      // Debug: mostrar los totales calculados
      console.log('📊 TOTALES HORIZONTALES (excluyendo filas marcadas):', {
        totalContrato: totalesCategoria.totalContrato,
        totalEgresos: totalesCategoria.totalEgresos,
        totalPresupuesto: totalesCategoria.totalPresupuesto
      });

      // 🧮 CALCULAR CAMPOS FINANCIEROS
    const montoContrato = parseMonetary(projectData.montoContrato);
  const adelantos = parseMonetary(projectData.adelantos);
  const utilidadEstimadaSF = parseMonetary(projectData.utilidadEstimadaSinFactura);
  const utilidadEstimadaCF = parseMonetary(projectData.utilidadEstimadaConFactura);

      // 🔄 ACTUALIZAR TODOS LOS CAMPOS CALCULADOS EN EL SERVICIO
      
      // 📊 ACTUALIZAR SALDOS POR CANCELAR PARA FILAS ESPECÍFICAS
      // 1. Filas marcadas en rojo (shouldSumInTotalSaldos): SIEMPRE usar Contrato Prov. Y Serv. - Registro Egresos (NO usar Presup. Del Proy.)
      // 2. Filas NO marcadas con Presup. Del Proy. > 0: Saldos por Cancelar = Presup. Del Proy. - Registro Egresos
      // Las demás filas mantienen su valor sin calcularse automáticamente
      // Esta fórmula NO debe ser afectada por las celdas de IGV (Impuesto Estimado, Crédito Fiscal Real, etc.)
      if (projectData.categorias && projectData.categorias.length > 0) {
        const categoriasActualizadas = projectData.categorias.map(cat => {
          // Verificar si está marcada en rojo (estas SIEMPRE usan Contrato, nunca Presupuesto)
          const esFilaMarcada = shouldSumInTotalSaldos(cat.nombre);
          
          // Verificar si debe usar Presup. Del Proy. (solo si NO está marcada en rojo)
          const usarPresupuesto = !esFilaMarcada && shouldUsePresupuestoFormula(cat);
          
          if (esFilaMarcada) {
            // Para filas marcadas en rojo: SIEMPRE usar Contrato Prov. Y Serv. - Registro Egresos (ignorar Presup. Del Proy.)
            const contrato = parseMonetary(cat.contratoProvedYServ || 0);
            const egresos = parseMonetary(cat.registroEgresos || 0);
            const saldosPorCancelar = contrato - egresos;
            
            return {
              ...cat,
              saldosPorCancelar: formatMoney(saldosPorCancelar) // ⚡ Formatear para mantener consistencia
            };
          } else if (usarPresupuesto) {
            // Para filas NO marcadas con Presup. Del Proy. > 0: Presup. Del Proy. - Registro Egresos
            const presupuesto = parseMonetary(cat.presupuestoDelProyecto || 0);
            const egresos = parseMonetary(cat.registroEgresos || 0);
            const saldosPorCancelar = presupuesto - egresos;
            
            return {
              ...cat,
              saldosPorCancelar: formatMoney(saldosPorCancelar) // ⚡ Formatear para mantener consistencia
            };
          } else {
            // Para las demás filas: mantener el valor actual sin calcular automáticamente
            return {
              ...cat
              // No modificar saldosPorCancelar - mantener valor existente
            };
          }
        });
        
        // Actualizar en el estado local
        setProjectData(prev => ({
          ...prev,
          categorias: categoriasActualizadas
        }));
        
        // Actualizar en el servicio (solo las filas que se calculan automáticamente)
        if (updateCategory) {
          categoriasActualizadas.forEach(cat => {
            const esFilaMarcada = shouldSumInTotalSaldos(cat.nombre);
            const usarPresupuesto = !esFilaMarcada && shouldUsePresupuestoFormula(cat);
            
            if (esFilaMarcada || usarPresupuesto) {
              const originalCat = projectData.categorias.find(c => c.id === cat.id);
              if (originalCat) {
                const originalSaldos = parseMonetary(originalCat.saldosPorCancelar || 0);
                const nuevosSaldos = parseMonetary(cat.saldosPorCancelar || 0);
                // Solo actualizar si cambió el valor
                if (Math.abs(originalSaldos - nuevosSaldos) > 0.01) {
                  updateCategory(cat.id, { saldosPorCancelar: nuevosSaldos });
                }
              }
            }
          });
        }
      }
      
      // 📊 CAMPOS BÁSICOS DE TOTALES
      // Formatear valores con separadores de miles y dos decimales
      // Calcular totales completos de la tabla (incluye todas las filas)
      const totalesCalculadosTabla = calcularTotalesTabla();
      
      console.log('📊 COMPONENTE: Actualizando totales:', {
        totalContrato: totalesCategoria.totalContrato,
        totalEgresos: totalesCategoria.totalEgresos,
        totalPresupuestoCompleto: totalesCalculadosTabla.presupuesto,
        totalEgresosCompleto: totalesCalculadosTabla.egresos
      });
      
      // Total Contrato Proveedores = Total completo de "Contrato Prov. Y Serv." de la fila TOTALES (incluye todas las filas)
      updateField('totalContratoProveedores', formatMoney(totalesCalculadosTabla.contrato));
      updateField('totalSaldoPorPagarProveedores', formatMoney(totalesCategoria.totalEgresos));
      // Presupuesto Del Proyecto = Total completo de Presup. Del Proy. de la fila TOTALES
      updateField('presupuestoProyecto', formatMoney(totalesCalculadosTabla.presupuesto));
      updateField('totalEgresosProyecto', formatMoney(totalesCalculadosTabla.egresos));
      
      // 🧮 ANÁLISIS FINANCIERO SIN FACTURA
      // Utilidad Real Sin Factura = Monto del Contrato - Total Registro de Egresos (total completo de la tabla)
      const totalEgresosCompleto = calcularTotalesTabla().egresos;
      const utilidadRealSF = montoContrato - totalEgresosCompleto;
      updateField('utilidadRealSinFactura', utilidadRealSF);
      
      // 🧮 UTILIDAD ESTIMADA SIN FACTURA = Monto del Contrato - Presupuesto Del Proyecto (total completo de la tabla)
      const totalPresupuestoCompleto = calcularTotalesTabla().presupuesto;
      const utilidadEstimadaSFCalculada = montoContrato - totalPresupuestoCompleto;
      
      // Balance de Utilidad +/- = Utilidad Estimada Sin Factura - Utilidad Real Sin Factura
      const balanceUtilidadSF = utilidadEstimadaSFCalculada - utilidadRealSF;
      updateField('balanceUtilidadSinFactura', balanceUtilidadSF);
      
      // 💰 COBRANZAS Y SALDOS
      // Usar totales horizontales (excluye filas marcadas) para los balances
      const saldoXCobrarCalculado = montoContrato - adelantos;
      console.log(`💰 ProyectoDetalle: Calculando saldoXCobrar:`, {
        montoContrato: montoContrato,
        adelantos: adelantos,
        calculado: saldoXCobrarCalculado,
        proyectoId: projectNumber,
        proyectoNombre: projectData.nombreProyecto
      });
      updateField('saldoXCobrar', saldoXCobrarCalculado);
      // Balance De Compras Del Proyecto = (Suma de Presup. Del Proy. de categorías específicas + Suma de Contrato Prov. Y Serv. de categorías específicas) - Total Registro Egresos
      // Usar los nombres exactos como aparecen en el código (normalizados a minúsculas para comparación)
      const categoriasPresupuesto = [
        'melamina y servicios',
        'melamina high gloss',
        'accesorios y ferretería',
        'puertas alu vidrios',
        'led y electricidad',
        'flete y/o camioneta',
        'logística operativa',
        'extras y/o eventos'
      ];
      
      const categoriasContrato = [
        'despecie',
        'mano de obra', // Se suman todas las instancias de "Mano de Obra"
        'of - escp',
        'granito y/o cuarzo',
        'extras y/o eventos gyc',
        'tercializacion 1 facturada',
        'extras y/o eventos terc. 1',
        'tercializacion 2 facturada',
        'extras y/o eventos terc. 2',
        'tercializacion 1 no facturada',
        'extras y/o eventos terc. 1 nf',
        'tercializacion 2 no facturada',
        'extras y/o eventos terc. 2 nf'
      ];
      
      const sumaPresupuestoEspecifico = (projectData.categorias || []).reduce((sum, cat) => {
        const nombreOriginal = (cat?.nombre || '').toString();
        const nombre = nombreOriginal.toLowerCase().trim().replace(/\s+/g, ' ');
        // Comparación estricta: solo coincidencia exacta (sin espacios extra, sin variaciones)
        const incluir = categoriasPresupuesto.some(catName => {
          const nombreCat = catName.toLowerCase().trim().replace(/\s+/g, ' ');
          // Solo coincidencia exacta
          const coincide = nombre === nombreCat;
          if (coincide) {
            console.log(`   ✅ MATCH Presupuesto: "${nombreOriginal}" === "${catName}"`);
          }
          return coincide;
        });
        if (incluir) {
          const valor = parseMonetary(cat.presupuestoDelProyecto || 0);
          console.log(`   ✅ Presupuesto incluido: "${nombreOriginal}" = S/${valor.toFixed(2)}`);
          return sum + valor;
        } else {
          // Log para debugging: mostrar qué categorías NO se están incluyendo
          const nombreNormalizado = nombre;
          const enLista = categoriasPresupuesto.some(catName => {
            const nombreCat = catName.toLowerCase().trim().replace(/\s+/g, ' ');
            return nombreNormalizado === nombreCat;
          });
          if (!enLista && parseMonetary(cat.presupuestoDelProyecto || 0) > 0) {
            console.log(`   ❌ Presupuesto NO incluido (valor > 0): "${nombreOriginal}" (normalizado: "${nombreNormalizado}")`);
          }
        }
        return sum;
      }, 0);
      
      const sumaContratoEspecifico = (projectData.categorias || []).reduce((sum, cat) => {
        const nombreOriginal = (cat?.nombre || '').toString();
        const nombre = nombreOriginal.toLowerCase().trim().replace(/\s+/g, ' ');
        // Comparación estricta: solo coincidencia exacta
        const incluir = categoriasContrato.some(catName => {
          const nombreCat = catName.toLowerCase().trim().replace(/\s+/g, ' ');
          // Solo coincidencia exacta
          const coincide = nombre === nombreCat;
          if (coincide) {
            console.log(`   ✅ MATCH Contrato: "${nombreOriginal}" === "${catName}"`);
          }
          return coincide;
        });
        if (incluir) {
          const valor = parseMonetary(cat.contratoProvedYServ || 0);
          console.log(`   ✅ Contrato incluido: "${nombreOriginal}" = S/${valor.toFixed(2)}`);
          return sum + valor;
        } else {
          // Log para debugging: mostrar qué categorías NO se están incluyendo
          const nombreNormalizado = nombre;
          const enLista = categoriasContrato.some(catName => {
            const nombreCat = catName.toLowerCase().trim().replace(/\s+/g, ' ');
            return nombreNormalizado === nombreCat;
          });
          if (!enLista && parseMonetary(cat.contratoProvedYServ || 0) > 0) {
            console.log(`   ❌ Contrato NO incluido (valor > 0): "${nombreOriginal}" (normalizado: "${nombreNormalizado}")`);
          }
        }
        return sum;
      }, 0);
      
      console.log('🧮 ===== CÁLCULO BALANCE DE COMPRAS DEL PROYECTO =====');
      console.log(`   📊 Suma Presupuesto Específico: S/${sumaPresupuestoEspecifico.toFixed(2)}`);
      console.log(`   📊 Suma Contrato Específico: S/${sumaContratoEspecifico.toFixed(2)}`);
      console.log(`   📊 Total Registro Egresos: S/${totalesCalculadosTabla.egresos.toFixed(2)}`);
      console.log(`   💰 Suma Total (Presup + Contrato): S/${(sumaPresupuestoEspecifico + sumaContratoEspecifico).toFixed(2)}`);
      console.log(`   💰 Balance De Compras: S/${(sumaPresupuestoEspecifico + sumaContratoEspecifico - totalesCalculadosTabla.egresos).toFixed(2)}`);
      console.log('🧮 ===== LISTA DE CATEGORÍAS EN EL PROYECTO =====');
      (projectData.categorias || []).forEach((cat, idx) => {
        const nombre = (cat?.nombre || '').toString();
        const presup = parseMonetary(cat.presupuestoDelProyecto || 0);
        const contrato = parseMonetary(cat.contratoProvedYServ || 0);
        const egresos = parseMonetary(cat.registroEgresos || 0);
        console.log(`   ${idx + 1}. "${nombre}" - Presup: S/${presup.toFixed(2)}, Contrato: S/${contrato.toFixed(2)}, Egresos: S/${egresos.toFixed(2)}`);
      });
      console.log('🧮 ===================================================');
      
      const balanceDeComprasCalculado = (sumaPresupuestoEspecifico + sumaContratoEspecifico) - totalesCalculadosTabla.egresos;
      updateField('balanceDeComprasDelProyecto', balanceDeComprasCalculado);
      // Balance Del Presupuesto = Presupuesto Del Proyecto - Total de Egresos del Proyecto
      const balanceDelPresupuestoCalculado = totalesCalculadosTabla.presupuesto - totalesCalculadosTabla.egresos;
      updateField('balanceDelPresupuesto', balanceDelPresupuestoCalculado);
      
      // 🧮 UTILIDAD ESTIMADA SIN FACTURA = Monto del Contrato - Presupuesto Del Proyecto (total completo de la tabla)
      // Ya calculado arriba, reutilizamos la variable
      updateField('utilidadEstimadaSinFactura', utilidadEstimadaSFCalculada);
      
      // Actualizar también en projectData local para mostrar inmediatamente
      setProjectData(prev => ({
        ...prev,
        utilidadEstimadaSinFactura: formatMoney(utilidadEstimadaSFCalculada),
        utilidadEstimadaConFactura: formatMoney(utilidadEstimadaCFCalculada),
        totalContratoProveedores: formatMoney(totalesCategoria.totalContrato),
        totalSaldoPorPagarProveedores: formatMoney(totalesCategoria.totalEgresos),
        presupuestoProyecto: formatMoney(totalesCalculadosTabla.presupuesto),
        totalEgresosProyecto: formatMoney(totalesCalculadosTabla.egresos),
        balanceDeComprasDelProyecto: formatMoney(balanceDeComprasCalculado),
        balanceDelPresupuesto: formatMoney(totalesCalculadosTabla.presupuesto - totalesCalculadosTabla.egresos),
        utilidadRealSinFactura: formatMoney(utilidadRealSF),
        balanceUtilidadSinFactura: formatMoney(balanceUtilidadSF)
        // Nota: utilidadRealConFactura y balanceUtilidadConFactura se actualizan después de calcular el impuesto estimado
      }));
      
      // 🧾 IGV - SUNAT 18% (calculados automáticamente)
      const igvRate = 0.18;
      // IGV = (Monto del Contrato / 1.18) * 18%
      const igvSunat = (montoContrato / 1.18) * igvRate;

      // Crédito Fiscal Estimado = (Suma de PRESUPUESTOS de categorías con "F" (factura) / 1.18) * 18%
      // Se consideran todas las filas del cuadro izquierdo cuyo tipo es 'F' (rojo)
      const nombresF = new Set([
        'melamina y servicios',
        'melamina high gloss',
        'accesorios y ferretería',
        'accesorios y ferreteria',
        'puertas alu vidrios',
        'puertas alu y vidrios',
        'led y electricidad',
        'granito y/o cuarzo',
        'tercializacion 1 facturada',
        'tercialización 1 facturada',
        'tercializacion 2 facturada',
        'tercialización 2 facturada'
      ]);
      // 🧾 Crédito Fiscal Estimado = Suma de PRESUPUESTOS con F × 0.18 / 1.18
      const baseCredito = (projectData.categorias || []).reduce((sum, cat) => {
        const nombre = (cat?.nombre || '').toString().toLowerCase().trim();
        const esTipoF = (cat?.tipo || '').toString().toUpperCase() === 'F';
        const esListado = nombresF.has(nombre);
        const califica = esTipoF || esListado;
        const bruto = cat?.presupuestoDelProyecto ?? 0;
        const valor = parseFloat(String(bruto).replace(/[^0-9.-]/g, '')) || 0;
        return califica ? sum + valor : sum;
      }, 0);
      const creditoFiscalEstimado = (baseCredito / 1.18) * igvRate;
      
      // 🧾 Crédito Fiscal Real = Suma de REGISTRO EGRESOS con F / 1.18 * 18%
      const totalEgresosConFactura = (projectData.categorias || []).reduce((sum, cat) => {
        const esTipoF = (cat?.tipo || '').toString().toUpperCase() === 'F';
        if (esTipoF) {
          // Usar parseMonetary para manejar diferentes formatos (número, string con S/, etc.)
          const monto = parseMonetary(cat.registroEgresos || 0);
          console.log(`   📌 Categoría con F: "${cat.nombre}" - Registro Egresos: ${cat.registroEgresos} → ${monto}`);
          return sum + monto;
        }
        return sum;
      }, 0);
      const creditoFiscalReal = (totalEgresosConFactura / 1.18) * 0.18;
      
      // 🧾 Impuesto Estimado del Proyecto = IGV - SUNAT 18% - Crédito Fiscal Estimado
      const impuestoEstimado = igvSunat - creditoFiscalEstimado;
      
      console.log('🧾 ===== CÁLCULO IGV - EGRESOS CON F =====');
      console.log(`   📊 Total egresos con factura (F): S/ ${totalEgresosConFactura.toFixed(2)}`);
      console.log(`   📐 Fórmula Crédito Fiscal Real: ${totalEgresosConFactura.toFixed(2)} / 1.18 × 18%`);
      console.log(`   💰 Crédito Fiscal Real: S/ ${creditoFiscalReal.toFixed(2)}`);
      console.log(`   💰 IGV - SUNAT 18%: S/ ${igvSunat.toFixed(2)}`);
      console.log(`   💰 Crédito Fiscal Estimado: S/ ${creditoFiscalEstimado.toFixed(2)}`);
      console.log(`   💰 Impuesto Estimado del Proyecto: S/ ${impuestoEstimado.toFixed(2)} (IGV - Crédito Fiscal Estimado)`);
      console.log('🧾 ===========================================');
      
      // Impuesto Real del Proyecto = IGV - SUNAT 18% - Crédito Fiscal Real
      const impuestoReal = igvSunat - creditoFiscalReal;
      
      updateField('igvSunat', igvSunat);
      updateField('creditoFiscalEstimado', creditoFiscalEstimado);
      updateField('impuestoEstimadoDelProyecto', impuestoEstimado);
      updateField('creditoFiscalReal', creditoFiscalReal);
      updateField('impuestoRealDelProyecto', impuestoReal);
      
      // 🧮 ANÁLISIS FINANCIERO CON FACTURA (después de calcular impuesto estimado)
      // Utilidad Estimada Con Factura = Monto del Contrato - (Presupuesto Del Proyecto + Impuesto Estimado del Proyecto)
      const utilidadEstimadaCFCalculada = montoContrato - (totalesCalculadosTabla.presupuesto + impuestoEstimado);
      updateField('utilidadEstimadaConFactura', utilidadEstimadaCFCalculada);
      
      // Utilidad Real Con Factura = Monto del Contrato - (Total Registro de Egresos + Crédito Fiscal Real)
      const totalEgresosCompletoCF = totalesCalculadosTabla.egresos;
      const utilidadRealCF = montoContrato - (totalEgresosCompletoCF + creditoFiscalReal);
      updateField('utilidadRealConFactura', utilidadRealCF);
      
      // Balance de Utilidad = Utilidad Estimada Con Factura - Utilidad Real Con Factura
      const balanceUtilidadCF = utilidadEstimadaCFCalculada - utilidadRealCF;
      updateField('balanceUtilidadConFactura', balanceUtilidadCF);
      
      // Actualizar también en projectData local para mostrar inmediatamente
      setProjectData(prev => ({
        ...prev,
        impuestoEstimadoDelProyecto: formatMoney(impuestoEstimado),
        creditoFiscalReal: formatMoney(creditoFiscalReal),
        utilidadEstimadaConFactura: formatMoney(utilidadEstimadaCFCalculada),
        utilidadRealConFactura: formatMoney(utilidadRealCF),
        balanceUtilidadConFactura: formatMoney(balanceUtilidadCF),
        creditoFiscalEstimado: formatMoney(creditoFiscalEstimado),
        igvSunat: formatMoney(igvSunat),
        impuestoRealDelProyecto: formatMoney(impuestoReal)
      }));
      
      console.log('🧮 Sincronización automática completada:', {
        totalContrato: totalesCategoria.totalContrato,
        totalEgresos: totalesCategoria.totalEgresos,
        utilidadRealSF,
        utilidadRealCF,
        saldoXCobrar: montoContrato - adelantos,
        igvSunat,
        creditoFiscalReal,
        impuestoEstimado,
        totalEgresosConFactura,
        '📊 Impuesto Estimado calculado': impuestoEstimado,
        '📊 Total egresos con F': totalEgresosConFactura
      });
    }
  }, [
    projectData.categorias, 
    projectData.montoContrato, 
    projectData.adelantos, 
    projectData.utilidadEstimadaSinFactura,
    projectData.utilidadEstimadaConFactura,
    updateField
  ]);

  // 🧾 CALCULAR IMPUESTO ESTIMADO Y CRÉDITO FISCAL REAL cuando cambian egresos con F
  // Crear una dependencia estable basada en los valores de registroEgresos de categorías con F
  const egresosConFacturaKey = useMemo(() => {
    if (!projectData.categorias || projectData.categorias.length === 0) return '';
    return projectData.categorias
      .filter(cat => (cat?.tipo || '').toString().toUpperCase() === 'F')
      .map(cat => `${cat.id}:${parseMonetary(cat.registroEgresos || 0)}`)
      .join('|');
  }, [projectData.categorias]);

  useEffect(() => {
    if (!projectData.categorias || projectData.categorias.length === 0) return;
    
    // Calcular suma de egresos con F
    const totalEgresosConFactura = projectData.categorias.reduce((sum, cat) => {
      const esTipoF = (cat?.tipo || '').toString().toUpperCase() === 'F';
      if (esTipoF) {
        const monto = parseMonetary(cat.registroEgresos || 0);
        console.log(`   📌 Categoría con F: "${cat.nombre}" - Registro Egresos: ${cat.registroEgresos} → ${monto}`);
        return sum + monto;
      }
      return sum;
    }, 0);
    
    // Calcular Crédito Fiscal Real = Suma de REGISTRO EGRESOS con F / 1.18 * 18%
    const creditoFiscalReal = (totalEgresosConFactura / 1.18) * 0.18;
    
    // Calcular IGV - SUNAT 18%
    const montoContrato = parseMonetary(projectData.montoContrato || 0);
    const igvSunat = (montoContrato / 1.18) * 0.18;
    
    // Calcular Crédito Fiscal Estimado (suma de PRESUPUESTOS con F)
    const nombresF = new Set([
      'melamina y servicios',
      'melamina high gloss',
      'accesorios y ferretería',
      'accesorios y ferreteria',
      'puertas alu vidrios',
      'puertas alu y vidrios',
      'led y electricidad',
      'granito y/o cuarzo',
      'tercializacion 1 facturada',
      'tercialización 1 facturada',
      'tercializacion 2 facturada',
      'tercialización 2 facturada'
    ]);
    const baseCredito = projectData.categorias.reduce((sum, cat) => {
      const nombre = (cat?.nombre || '').toString().toLowerCase().trim();
      const esTipoF = (cat?.tipo || '').toString().toUpperCase() === 'F';
      const esListado = nombresF.has(nombre);
      const califica = esTipoF || esListado;
      const bruto = cat?.presupuestoDelProyecto ?? 0;
      const valor = parseFloat(String(bruto).replace(/[^0-9.-]/g, '')) || 0;
      return califica ? sum + valor : sum;
    }, 0);
    const creditoFiscalEstimado = (baseCredito / 1.18) * 0.18;
    
    // 🧾 Impuesto Estimado del Proyecto = IGV - SUNAT 18% - Crédito Fiscal Estimado
    const impuestoEstimado = igvSunat - creditoFiscalEstimado;
    
    console.log('🧾 ===== RECÁLCULO IMPUESTO ESTIMADO Y CRÉDITO FISCAL REAL =====');
    console.log(`   📊 Total egresos con factura (F): S/ ${totalEgresosConFactura.toFixed(2)}`);
    console.log(`   📐 Fórmula Crédito Fiscal Real: ${totalEgresosConFactura.toFixed(2)} / 1.18 × 18%`);
    console.log(`   💰 Crédito Fiscal Real: S/ ${creditoFiscalReal.toFixed(2)}`);
    console.log(`   💰 IGV - SUNAT 18%: S/ ${igvSunat.toFixed(2)}`);
    console.log(`   💰 Crédito Fiscal Estimado: S/ ${creditoFiscalEstimado.toFixed(2)}`);
    console.log(`   💰 Impuesto Estimado del Proyecto: S/ ${impuestoEstimado.toFixed(2)} (IGV - Crédito Fiscal Estimado)`);
    console.log('🧾 ============================================================');
    
    // Actualizar en el servicio
    updateField('creditoFiscalReal', creditoFiscalReal);
    updateField('impuestoEstimadoDelProyecto', impuestoEstimado);
    
    // Actualizar localmente para mostrar inmediatamente
    setProjectData(prev => ({
      ...prev,
      creditoFiscalReal: formatMoney(creditoFiscalReal),
      impuestoEstimadoDelProyecto: formatMoney(impuestoEstimado)
    }));
  }, [egresosConFacturaKey, updateField, projectData.montoContrato, projectData.categorias]);

  // 📊 SINCRONIZAR TOTALES CON DATOS DEL SERVICIO
  // ⚡ PROTECCIÓN: No sobrescribir valores que el usuario está editando activamente
  useEffect(() => {
    if (project && project.categorias) {
      // ⚡ Verificar si hay celdas siendo editadas actualmente
      const hayCeldasEditando = Object.keys(editingCells).length > 0;
      
      setProjectData(prev => {
        // ⚡ Si hay celdas siendo editadas, NO sobrescribir las categorías (preservar valores del usuario)
        let categoriasFinales;
        if (hayCeldasEditando) {
          categoriasFinales = prev.categorias; // Mantener las categorías actuales si hay edición en curso
        } else if (project.categorias && project.categorias.length > 0) {
          // 🔒 PRESERVAR valores editados por el usuario (SISTEMA ROBUSTO)
          categoriasFinales = project.categorias.map(cat => {
            // ⚡ SOLO usar ID para identificar categorías (NO usar nombre como fallback para evitar propagación)
            // Esto asegura que cada fila sea independiente, incluso si tienen el mismo nombre
            const prevCat = prev.categorias?.find(pc => String(pc.id) === String(cat.id));
            
            // Parsear valores del servicio
            const presupuestoServicio = parseMonetary(cat.presupuestoDelProyecto || 0);
            const contratoServicio = parseMonetary(cat.contratoProvedYServ || 0);
            const egresosServicio = parseMonetary(cat.registroEgresos || 0);
            const saldosServicio = parseMonetary(cat.saldosPorCancelar || 0);
            
            // Parsear valores del estado previo
            const presupuestoPrev = prevCat ? parseMonetary(prevCat.presupuestoDelProyecto || 0) : 0;
            const contratoPrev = prevCat ? parseMonetary(prevCat.contratoProvedYServ || 0) : 0;
            const egresosPrev = prevCat ? parseMonetary(prevCat.registroEgresos || 0) : 0;
            const saldosPrev = prevCat ? parseMonetary(prevCat.saldosPorCancelar || 0) : 0;
            
            // 🔒 VERIFICAR SI EL USUARIO EDITÓ ESTOS VALORES (prioridad absoluta)
            const presupuestoEditado = userEditedValuesRef.current.get(`${cat.id}-presupuestoDelProyecto`);
            const contratoEditado = userEditedValuesRef.current.get(`${cat.id}-contratoProvedYServ`);
            const egresosEditado = userEditedValuesRef.current.get(`${cat.id}-registroEgresos`);
            const saldosEditado = userEditedValuesRef.current.get(`${cat.id}-saldosPorCancelar`);
            
            // ⚡ LÓGICA DE PRESERVACIÓN (en orden de prioridad):
            // 1. Si el usuario editó el valor → SIEMPRE usar el valor editado
            // 2. Si el valor previo > 0 → mantenerlo (usuario lo escribió antes)
            // 3. Solo usar el valor del servicio si no hay valor previo ni editado
            const presupuestoFinal = presupuestoEditado !== undefined ? presupuestoEditado : 
                                     (presupuestoPrev > 0 ? presupuestoPrev : presupuestoServicio);
            const contratoFinal = contratoEditado !== undefined ? contratoEditado : 
                                 (contratoPrev > 0 ? contratoPrev : contratoServicio);
            const egresosFinal = egresosEditado !== undefined ? egresosEditado : 
                               (egresosPrev > 0 ? egresosPrev : egresosServicio);
            const saldosFinal = saldosEditado !== undefined ? saldosEditado : 
                              (saldosPrev > 0 ? saldosPrev : saldosServicio);
            
            return {
              ...cat,
              presupuestoDelProyecto: formatMoney(presupuestoFinal),
              contratoProvedYServ: formatMoney(contratoFinal),
              registroEgresos: formatMoney(egresosFinal),
              saldosPorCancelar: formatMoney(saldosFinal)
            };
          });
        } else {
          categoriasFinales = prev.categorias;
        }
        
        return {
          ...prev,
          // Sincronizar datos principales (solo si no están siendo editados)
          nombreProyecto: project.nombreProyecto || prev.nombreProyecto,
          nombreCliente: project.nombreCliente || prev.nombreCliente,
          estadoProyecto: project.estadoProyecto || prev.estadoProyecto,
          tipoProyecto: project.tipoProyecto || prev.tipoProyecto,
          
          // 💰 DATOS EDITABLES BÁSICOS (solo actualizar si no están siendo editados)
          montoContrato: editingMontoContrato ? prev.montoContrato : formatMoney(project.montoContrato || 0),
          adelantos: formatMoney(project.adelantos || 0),
          utilidadEstimadaSinFactura: formatMoney(project.utilidadEstimadaSinFactura || 0),
          utilidadEstimadaConFactura: formatMoney(project.utilidadEstimadaConFactura || 0),
          
          // 🧮 ANÁLISIS FINANCIERO - CAMPOS CALCULADOS (formato con separadores y 2 decimales)
          utilidadRealSinFactura: formatMoney(project.utilidadRealSinFactura || 0),
          balanceUtilidadSinFactura: formatMoney(project.balanceUtilidadSinFactura || 0),
          utilidadRealConFactura: formatMoney(project.utilidadRealConFactura || 0),
          balanceUtilidadConFactura: formatMoney(project.balanceUtilidadConFactura || 0),
          
          // 🧾 IGV - SUNAT 18% - CAMPOS CALCULADOS
          igvSunat: formatMoney(project.igvSunat || 0),
          creditoFiscalEstimado: formatMoney(project.creditoFiscalEstimado || 0),
          impuestoEstimadoDelProyecto: formatMoney(project.impuestoEstimadoDelProyecto || 0),
          creditoFiscalReal: formatMoney(project.creditoFiscalReal || 0),
          impuestoRealDelProyecto: formatMoney(project.impuestoRealDelProyecto || 0),
          
          // 🧮 TOTALES Y BALANCES - CAMPOS CALCULADOS
          totalContratoProveedores: formatMoney(project.totalContratoProveedores || 0),
          totalSaldoPorPagarProveedores: formatMoney(project.totalSaldoPorPagarProveedores || 0),
          balanceDeComprasDelProyecto: formatMoney(project.balanceDeComprasDelProyecto || 0),
          saldoXCobrar: formatMoney(project.saldoXCobrar || 0),
          presupuestoProyecto: formatMoney(project.presupuestoProyecto || 0),
          totalEgresosProyecto: formatMoney(project.totalEgresosProyecto || 0),
          balanceDelPresupuesto: formatMoney(project.balanceDelPresupuesto || 0),
          
          // Categorías sincronizadas (solo si no hay edición en curso)
          categorias: categoriasFinales,
        
          // 📅 SINCRONIZAR COBRANZAS GUARDADAS
          // Si todas las filas tienen el mismo monto que el monto del contrato (estado antiguo),
          // las reiniciamos a 0 para que aparezcan vacías.
          cobranzas: (() => {
            const fromService = project.cobranzas || prev.cobranzas;
            if (Array.isArray(fromService) && fromService.length > 0) {
              const contrato = parseFloat(project.montoContrato || 0);
              const allEqualToContrato = fromService.every(c => (parseFloat(c?.monto) || 0) === contrato);
              if (allEqualToContrato && contrato > 0) {
                return fromService.map(c => ({ ...c, monto: 0 }));
              }
            }
            return fromService;
          })()
        };
      });
    }
  }, [project, editingCells, editingMontoContrato]); // ⚡ Incluir editingCells y editingMontoContrato para no sobrescribir valores en edición

  const openViewer = (item) => {
    // item es el objeto que contiene { file, url, name, type }
    setCurrentFile(item);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setCurrentFile(null);
  };

  const addFiles = (filesList) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const files = Array.from(filesList || []).filter(f => allowed.includes(f.type));

    if (files.length === 0) return;

    setArchivosAdjuntos(prev => {
      const available = Math.max(0, 4 - prev.length);
      const toAdd = files.slice(0, available).map(f => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        file: f,
        name: f.name,
        size: f.size,
        type: f.type,
        url: URL.createObjectURL(f)
      }));

      return [...prev, ...toAdd];
    });
  };

  const handleFileSelect = (event) => {
    const files = event.target.files;
    addFiles(files);
    // reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) addFiles(files);
  };

  const removeFile = (id) => {
    setArchivosAdjuntos(prev => {
      const found = prev.find(p => p.id === id);
      if (found) URL.revokeObjectURL(found.url);
  const next = prev.filter(p => p.id !== id);
      // eliminar de localStorage si existe
      try {
        const key = `ksamti_attachments_${projectNumber}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const arr = JSON.parse(raw);
          const filtered = arr.filter(a => a.id !== id);
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch (e) { /* ignore */ }
  return next;
    });
  };

  const downloadFile = (item) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      archivosAdjuntos.forEach(a => URL.revokeObjectURL(a.url));
    };
  }, [archivosAdjuntos]);

  // --- Persistencia local: convertir archivo a DataURL y guardar en localStorage por proyecto ---
  // IndexedDB based persistence
  const saveAttachmentsToLocal = async () => {
    if (!projectNumber) return;
    setSaveStatus('saving');
    try {
      const key = `ksamti_attachments_${projectNumber}`;
      // convertir a dataURL para guardar en localStorage
      const payload = await Promise.all(archivosAdjuntos.map(async item => ({
        id: item.id,
        name: item.name,
        size: item.size,
        type: item.type,
        dataUrl: await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(item.file instanceof Blob ? item.file : new Blob([item.file]));
        }),
        uploaded: false,
        savedAt: new Date().toISOString()
      })));

      localStorage.setItem(key, JSON.stringify(payload));

  // Guardar también los datos del proyecto en localStorage (ambas claves)
  saveProjectToLocalStores(projectNumber, projectData);
      setSaveStatus('saved');
      setTimeout(() => trySyncAttachments(), 1000);
      return { success: true };
    } catch (error) {
      console.error('Error guardando attachments en IndexedDB:', error);
      setSaveStatus('error');
      return { success: false, error };
    }
  };

  const loadAttachmentsFromLocal = async () => {
    if (!projectNumber) return;
    try {
      const key = `ksamti_attachments_${projectNumber}`;
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const list = JSON.parse(raw);
      const reconstructed = list.map(item => {
        const blob = (function(dataUrl){
          const arr = dataUrl.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) u8arr[n] = bstr.charCodeAt(n);
          return new Blob([u8arr], { type: mime });
        })(item.dataUrl);
        const url = URL.createObjectURL(blob);
        return { id: item.id, name: item.name, size: item.size, type: item.type, file: blob, url };
      });
      setArchivosAdjuntos(reconstructed);
      setSaveStatus('saved');
    } catch (error) {
      console.warn('No hay attachments en IndexedDB o falló la carga:', error);
    }
  };

  // Intento básico de sincronización con backend (plantilla)
  const trySyncAttachments = async () => {
    if (!projectNumber) return;
    setSaveStatus('syncing');
    try {
      // Comprobar endpoint health
      const health = await fetch('/api/health').then(r => r.ok).catch(() => false);
      if (!health) {
        console.warn('Servidor no disponible para sincronizar attachments');
        setSaveStatus('saved');
        return;
      }

      // Cargar localmente guardados
  const key = `ksamti_attachments_${projectNumber}`;
  const raw = localStorage.getItem(key);
  if (!raw) { setSaveStatus('saved'); return; }
  const list = JSON.parse(raw);

      // Enviar cada archivo como FormData a un endpoint (ajustar ruta según backend)
      for (const item of list) {
  if (item.uploaded) continue;
  const fd = new FormData();
  // si está en dataUrl -> reconstruir blob
  const blob = item.file instanceof Blob ? item.file : (function(dataUrl){ const arr = dataUrl.split(','); const mime = arr[0].match(/:(.*?);/)[1]; const bstr = atob(arr[1]); let n = bstr.length; const u8arr = new Uint8Array(n); while (n--) u8arr[n] = bstr.charCodeAt(n); return new Blob([u8arr], { type: mime }); })(item.dataUrl || item.file);
  fd.append('file', blob, item.name);
        fd.append('meta', JSON.stringify({ name: item.name, size: item.size, type: item.type }));

        try {
          const res = await fetch(`/api/proyectos/${projectNumber}/archivos`, { method: 'POST', body: fd });
          if (res.ok) {
            // marcar como subido en localStorage
            try {
              const raw2 = localStorage.getItem(key);
              if (raw2) {
                const arr2 = JSON.parse(raw2);
                const mapped = arr2.map(a => a.id === item.id ? { ...a, uploaded: true } : a);
                localStorage.setItem(key, JSON.stringify(mapped));
              }
            } catch (e) { /* ignore */ }
          }
        } catch (err) {
          console.warn('Error subiendo archivo al servidor:', err);
        }
      }

  // Guardado actualizado ya en IndexedDB
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error sincronizando attachments:', error);
      setSaveStatus('error');
    }
  };

  // Cargar attachments locales cuando cambia el proyecto
  useEffect(() => {
    // Cargar attachments guardados
    loadAttachmentsFromLocal();

    // Cargar datos del proyecto guardados (si existen) y fusionarlos con el estado actual
    try {
      const saved = loadProjectFromLocalStores(projectNumber);
      if (saved) {
        // ⚡ Asegurar que siempre tengamos las 24 categorías por defecto
        let categoriasFinales = saved.categorias;
        
        if (!Array.isArray(categoriasFinales) || categoriasFinales.length !== 24) {
          console.log(`🔧 Inicializando categorías desde localStorage para proyecto ${projectNumber}`);
          const defaultCategories = projectDataService.getInitialProjects()[1].categorias;
          categoriasFinales = [...defaultCategories];
          
          // Si hay algunas categorías guardadas, intentar preservarlas
          if (Array.isArray(saved.categorias) && saved.categorias.length > 0) {
            const existingCategoriesMap = new Map();
            saved.categorias.forEach(cat => {
              if (cat.nombre) {
                existingCategoriesMap.set(cat.nombre.toLowerCase().trim(), cat);
              }
            });
            
            categoriasFinales = defaultCategories.map(defaultCat => {
              const existing = existingCategoriesMap.get(defaultCat.nombre.toLowerCase().trim());
              return existing ? { ...defaultCat, ...existing } : defaultCat;
            });
          }
          
          // Actualizar saved con las categorías inicializadas
          saved.categorias = categoriasFinales;
        }
        
        setProjectData(prev => ({ ...prev, ...saved }));
        // también sincronizar con el servicio si existe
        if (updateField) {
          Object.keys(saved).forEach(k => {
            try { updateField(k, saved[k]); } catch (e) { /* ignore */ }
          });
        }
      }
    } catch (e) {
      console.warn('No se pudo cargar projectData desde localStorage', e);
    }

  }, [projectNumber]);

  // Guardado automático de projectData en localStorage (debounce mejorado)
  useEffect(() => {
    if (!projectNumber) return;
    
    // ⚡ PROTECCIÓN: Solo guardar si projectData realmente cambió (evitar bucles)
    const t = setTimeout(() => {
      try {
        // Verificar que projectData tenga contenido válido antes de guardar
        if (projectData && Object.keys(projectData).length > 0) {
          saveProjectToLocalStores(projectNumber, projectData);
        }
      } catch (e) {
        console.warn('No se pudo guardar projectData automáticamente en localStorage', e);
      }
    }, 1000); // ⚡ Aumentar debounce a 1 segundo para evitar escrituras excesivas

    return () => clearTimeout(t);
  }, [projectNumber, projectData]);

  // Estado para manejar los proveedores y sus pagos
  const [proveedores, setProveedores] = useState([
    {
      id: 1,
      nombre: '',
      descripcion: '',
      pagos: [{
        id: 1,
        descripcion: '',
        fecha: '',
        monto: ''
      }],
      mostrarPagos: false
    },
    {
      id: 2,
      nombre: '',
      descripcion: '',
      pagos: [{
        id: 1,
        descripcion: '',
        fecha: '',
        monto: ''
      }],
      mostrarPagos: false
    },
    {
      id: 3,
      nombre: '',
      descripcion: '',
      pagos: [{
        id: 1,
        descripcion: '',
        fecha: '',
        monto: ''
      }],
      mostrarPagos: false
    },
    {
      id: 4,
      nombre: '',
      descripcion: '',
      pagos: [{
        id: 1,
        descripcion: '',
        fecha: '',
        monto: ''
      }],
      mostrarPagos: false
    },
    {
      id: 5,
      nombre: '',
      descripcion: '',
      pagos: [{
        id: 1,
        descripcion: '',
        fecha: '',
        monto: ''
      }],
      mostrarPagos: false
    }
  ]);

  const agregarPago = (proveedorId) => {
    setProveedores(prev => prev.map(proveedor => {
      if (proveedor.id === proveedorId && proveedor.pagos.length < 10) {
        const maxPagoId = Math.max(...proveedor.pagos.map(p => p.id), 0);
        return {
          ...proveedor,
          pagos: [...proveedor.pagos, {
            id: maxPagoId + 1,
            descripcion: '',
            fecha: '',
            monto: ''
          }]
        };
      }
      return proveedor;
    }));
  };

  const toggleMostrarPagos = (proveedorId) => {
    setProveedores(prev => prev.map(proveedor => {
      if (proveedor.id === proveedorId) {
        return {
          ...proveedor,
          mostrarPagos: !proveedor.mostrarPagos
        };
      }
      return proveedor;
    }));
  };

  const actualizarProveedor = (proveedorId, campo, valor) => {
    setProveedores(prev => prev.map(proveedor => {
      if (proveedor.id === proveedorId) {
        return {
          ...proveedor,
          [campo]: valor
        };
      }
      return proveedor;
    }));
  };

  const actualizarPago = (proveedorId, pagoId, campo, valor) => {
    setProveedores(prev => prev.map(proveedor => {
      if (proveedor.id === proveedorId) {
        return {
          ...proveedor,
          pagos: proveedor.pagos.map(pago => {
            if (pago.id === pagoId) {
              return {
                ...pago,
                [campo]: valor
              };
            }
            return pago;
          })
        };
      }
      return proveedor;
    }));
  };

  const calcularTotalProveedor = (proveedorId) => {
    const proveedor = proveedores.find(p => p.id === proveedorId);
    if (!proveedor) return 0;
    return proveedor.pagos.reduce((total, pago) => {
      const monto = parseFloat(pago.monto) || 0;
      return total + monto;
    }, 0);
  };

  const calcularTotalGeneral = () => {
    return proveedores.reduce((total, proveedor) => {
      return total + calcularTotalProveedor(proveedor.id);
    }, 0);
  };

  const handleAddCategoria = () => {
    const maxId = Math.max(...projectData.categorias.map(c => c.id), 0);
    const newCategoria = {
      id: maxId + 1,
      nombre: 'Nueva Categoría',
      presupuestoDelProyecto: 'S/ 0.00',
      contratoProvedYServ: 'S/ 0.00',
      registroEgresos: 'S/ 0.00',
      saldosPorCancelar: 'S/ 0.00'
    };
    
    setProjectData(prev => ({
      ...prev,
      categorias: [...prev.categorias, newCategoria]
    }));
  };

  // Cargar datos del proyecto si existe
  useEffect(() => {
    if (proyecto) {
      // ⚡ Asegurar que siempre tengamos las 24 categorías por defecto
      let categoriasFinales = proyecto.categorias;
      
      if (!Array.isArray(categoriasFinales) || categoriasFinales.length !== 24) {
        console.log(`🔧 Inicializando categorías desde prop proyecto para proyecto ${projectNumber}`);
        const defaultCategories = projectDataService.getInitialProjects()[1].categorias;
        categoriasFinales = [...defaultCategories];
        
        // Si hay algunas categorías, intentar preservarlas
        if (Array.isArray(proyecto.categorias) && proyecto.categorias.length > 0) {
          const existingCategoriesMap = new Map();
          proyecto.categorias.forEach(cat => {
            if (cat.nombre) {
              existingCategoriesMap.set(cat.nombre.toLowerCase().trim(), cat);
            }
          });
          
          categoriasFinales = defaultCategories.map(defaultCat => {
            const existing = existingCategoriesMap.get(defaultCat.nombre.toLowerCase().trim());
            return existing ? { ...defaultCat, ...existing } : defaultCat;
          });
        }
      }
      
      setProjectData(prev => ({
        ...prev,
        ...proyecto,
        categorias: categoriasFinales || prev.categorias || []
      }));
    }
  }, [proyecto, projectNumber]);
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Estilos para impresión */}
      <style>{`
        /* Estilos para vista previa de PDF de Cobranzas */
        #cobranzas-preview-content {
          font-family: Arial, sans-serif;
        }
        #cobranzas-preview-content table {
          border-collapse: collapse;
          width: 100%;
        }
        #cobranzas-preview-content table td,
        #cobranzas-preview-content table th {
          border: 1px solid #9ca3af;
          padding: 4px 8px;
          font-size: 12px;
        }
        #cobranzas-preview-content .bg-green-600 {
          background-color: #16a34a !important;
          color: white !important;
        }
        #cobranzas-preview-content .bg-black {
          background-color: #000000 !important;
          color: white !important;
        }
        #cobranzas-preview-content input {
          pointer-events: none;
          background: transparent !important;
        }
        
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          #print-area {
            display: flex !important;
            flex-direction: row !important;
            gap: 20px !important;
            width: 100% !important;
          }
          #print-area .left-banner { display: none !important; }
          #print-area .left-panel, #print-area .right-panel { 
            width: auto !important;
            flex-shrink: 0 !important;
            page-break-inside: avoid !important;
          }
          #print-area * { overflow: visible !important; }
          
          /* Asegurar que las tablas se muestren correctamente */
          #print-area table { 
            width: 100% !important;
            border-collapse: collapse !important;
            display: table !important;
          }
          #print-area table td, 
          #print-area table th { 
            padding: 2px 4px !important; 
            font-size: 11px !important;
            display: table-cell !important;
            visibility: visible !important;
            opacity: 1 !important;
            color: #000 !important;
            background-color: transparent !important;
          }
          
          /* Asegurar que los valores del panel derecho se muestren */
          #print-area .right-panel table td:last-child { 
            white-space: nowrap !important;
            display: table-cell !important;
            visibility: visible !important;
            opacity: 1 !important;
            color: #000 !important;
            content: attr(data-value) !important;
          }
          
          /* Asegurar que los inputs y selects muestren sus valores */
          #print-area input[type="text"],
          #print-area input[type="number"],
          #print-area select {
            border: none !important;
            background: transparent !important;
            -webkit-appearance: none !important;
            appearance: none !important;
            display: inline-block !important;
            visibility: visible !important;
            opacity: 1 !important;
            color: #000 !important;
          }
          
          /* Asegurar que los valores calculados se muestren */
          #print-area .right-panel td {
            content: "" !important;
          }
          
          /* Escala global para que quepa en una sola hoja */
          html, body { zoom: 0.88; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>
      {/* Encabezado con acciones */}
      <div className="px-3 py-0 flex items-center gap-2">
            <button 
              onClick={onBack}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 no-print"
            >
              ← Volver
            </button>
            <button
              onClick={handlePrintWindow}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-green-600 text-white text-xs font-semibold shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 no-print"
              title="Imprimir proyecto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
        </div>

      {/* Contenido principal - Layout responsive centrado */}
      <div id="print-area" className="flex flex-row gap-6 px-2 py-0 max-w-[1400px] mx-auto overflow-x-hidden -mt-4 justify-center items-start">
        {/* Barra lateral izquierda con controles */}
        <aside className="hidden md:block w-44 mt-6 left-banner z-30">
          <div className="bg-white rounded-lg shadow p-3 sticky top-24 z-30">
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-700">Proyecto</span>
                <input
                  type="text"
                  value={projectData.nombreProyecto}
                  onChange={(e) => handleInputChange('nombreProyecto', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  placeholder="Proyecto"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-700">Cliente</span>
                <input
                  type="text"
                  value={projectData.nombreCliente}
                  onChange={(e) => handleInputChange('nombreCliente', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                placeholder="Cliente"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-700">Estado</span>
            <select
              value={projectData.estado}
              onChange={(e) => handleInputChange('estado', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                >
                  <option value="En Cierre">En Cierre</option>
                  <option value="Ejecución">Ejecución</option>
                  <option value="Cobranza">Cobranza</option>
                  <option value="Archivado">Archivado</option>
            </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-700">Tipo</span>
            <select
              value={projectData.tipo}
              onChange={(e) => handleInputChange('tipo', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                >
                  <option value="Facturado">Facturado</option>
                  <option value="Boleta de venta">Boleta de venta</option>
                  <option value="Recibo Interno">Recibo Interno</option>
            </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Tabla principal de categorías */}
        <div className="flex-shrink-0 left-panel">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{
          width: '560px',
          maxWidth: '100%',
          minHeight: '420px'
        }}>
        {/* Header de la tabla */}
        <div className="bg-gray-800 text-white px-3 py-2 text-sm font-medium flex items-center">
          <span>📊 CATEGORÍAS Y SERVICIOS DEL PROYECTO</span>
            </div>
          


        {/* Barra superior: Monto del Contrato (entrada rápida) */}
        <div className="px-3 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">Monto del Contrato</span>
          <div className="flex items-center gap-2">
          <input
            type="text"
              value={editingMontoContrato ? montoContratoRaw : formatMonetaryDisplay(projectData.montoContrato)}
              onChange={(e) => handleMontoContratoChange(e.target.value)}
              onFocus={handleMontoContratoFocus}
              onBlur={handleMontoContratoBlur}
              className="text-left text-xs border border-gray-300 rounded px-2 py-1 w-32 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
              placeholder="S/0.00"
            />
            <button
              onClick={() => setCobranzasPopupOpen(true)}
              title="Abrir Cobranzas del Proyecto"
              className="px-2 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
            >
              Abrir
            </button>
            </div>
            </div>

        {/* Contenedor con scroll horizontal y vertical para responsive */}
        <div className="overflow-x-hidden">
          <table className="table-fixed mb-4" style={{width: '560px', minWidth: '560px'}}>
            {/* Headers de la tabla con colores específicos (match Excel) */}
            <thead className="sticky top-0">
              <tr className="text-xs font-bold">
                <th className="bg-gray-100 border border-gray-400 px-0 py-0 text-black text-center font-bold min-w-[22px] w-[22px] text-[10px]">
                  F
                </th>
                <th className="bg-gray-200 border border-gray-400 px-1 py-0.5 text-black text-left font-bold text-[10px] leading-tight" style={{width: '180px', minWidth: '180px', maxWidth: '180px'}}>
                  Categoría Del Proveedor<br />y/o el servicio
                </th>
                <th className="bg-green-600 border border-gray-400 px-1 py-0.5 text-white text-center font-bold text-[9px] leading-tight" style={{width: '70px', minWidth: '70px', maxWidth: '70px'}}>
                  Presup.<br />Del Proy.
                </th>
                <th className="bg-blue-600 border border-gray-400 px-1 py-1 text-white text-center font-bold text-[9px] leading-tight break-words whitespace-normal" style={{width: '100px', minWidth: '100px', maxWidth: '100px'}}>
                  Contrato<br />Prov. Y Serv.
                </th>
                <th className="bg-red-600 border border-gray-400 px-1 py-1 text-white text-center font-bold text-[9px] leading-tight break-words whitespace-normal" style={{width: '100px', minWidth: '100px', maxWidth: '100px'}}>
                  Registro<br />Egresos
                </th>
                <th className="bg-gray-600 border border-gray-400 px-1 py-0.5 text-white text-center font-bold text-[9px] leading-tight" style={{width: '80px', minWidth: '80px', maxWidth: '80px'}}>
                  Saldos por<br />cancelar
                </th>
              </tr>
            </thead>
            
            {/* Body de la tabla con celdas blancas editables */}
            <tbody>
              {projectData.categorias.map((categoria, index) => (
                <tr key={categoria.id} className="hover:bg-gray-50 h-5">
                  {/* Columna F dedicada */}
                  <td className="border border-gray-400 px-0 py-0 bg-white text-center align-middle min-w-[22px] w-[22px]">
                    {categoria.tipo ? (
                      <span className="inline-flex items-center justify-center h-4 px-1 rounded-sm text-white text-[10px] font-bold bg-red-600 select-none">
                        {categoria.tipo}
                      </span>
                    ) : null}
                  </td>
                  <td className="border border-gray-400 px-1 py-0 bg-white align-middle" style={{width: '180px', minWidth: '180px', maxWidth: '180px'}}>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={categoria.nombre}
                        onChange={(e) => handleCategoriaChange(categoria.id, 'nombre', e.target.value)}
                        className={`bg-transparent border-none outline-none text-[10px] w-full h-4 leading-tight px-0 ${getNombreCategoriaClass(categoria.nombre)}`}
                        placeholder="Categoría"
                      />
                  </div>
                  </td>
                  <td className="border border-gray-400 px-1 py-0 bg-white align-middle" style={{width: '70px', minWidth: '70px', maxWidth: '70px'}}>
                  <input
                    type="text"
                    value={(() => {
                      const cellKey = `${categoria.id}-presupuestoDelProyecto`;
                      if (editingCells[cellKey]) {
                        return editingValues[cellKey] || '';
                      }
                      return formatMonetaryDisplay(categoria.presupuestoDelProyecto);
                    })()}
                    onChange={(e) => handleCategoriaChange(categoria.id, 'presupuestoDelProyecto', e.target.value)}
                    onFocus={() => handleMonetaryCellFocus(categoria.id, 'presupuestoDelProyecto', categoria.presupuestoDelProyecto)}
                    onBlur={() => handleMonetaryCellBlur(categoria.id, 'presupuestoDelProyecto')}
                      className="w-full text-[9px] border-none outline-none text-left bg-transparent h-4 leading-tight px-0"
                    placeholder="S/0.00"
                  />
                  </td>
                  <td
                      className={`border border-gray-400 px-1 py-0 align-middle ${BLOCKED_CONTRACT_CATEGORY_IDS.includes(categoria.id) ? 'bg-gray-300' : 'bg-white'}`}
                      style={{
                        width: '100px',
                        minWidth: '100px',
                        maxWidth: '100px',
                        backgroundImage: BLOCKED_CONTRACT_CATEGORY_IDS.includes(categoria.id)
                          ? 'none'
                          : 'repeating-linear-gradient(45deg, #f3f4f6 0, #f3f4f6 2px, transparent 2px, transparent 4px)'
                      }}>
                  {BLOCKED_CONTRACT_CATEGORY_IDS.includes(categoria.id) ? (
                    <span
                      className="w-full inline-block text-[9px] text-left bg-transparent h-4 leading-tight pr-4 select-text cursor-not-allowed text-gray-800"
                      aria-label="Contrato Proveedor y Servicios (bloqueado)"
                    >
                      {categoria.contratoProvedYServ || 'S/0.00'}
                    </span>
                  ) : (
                    <div className="relative w-full">
                  <input
                    type="text"
                    value={(() => {
                      const cellKey = `${categoria.id}-contratoProvedYServ`;
                      if (editingCells[cellKey]) {
                        return editingValues[cellKey] || '';
                      }
                      return formatMonetaryDisplay(categoria.contratoProvedYServ);
                    })()}
                    onChange={(e) => handleCategoriaChange(categoria.id, 'contratoProvedYServ', e.target.value)}
                    onFocus={() => handleMonetaryCellFocus(categoria.id, 'contratoProvedYServ', categoria.contratoProvedYServ)}
                    onBlur={() => handleMonetaryCellBlur(categoria.id, 'contratoProvedYServ')}
                    className="w-full text-[9px] border-none outline-none text-left bg-transparent h-4 leading-tight pr-5"
                    placeholder="S/0.00"
                      />
                      <button
                        type="button"
                        onClick={(e) => openContratoPopup(categoria, e.currentTarget)}
                        className="absolute right-[2px] top-1/2 -translate-y-1/2 h-4 w-4 inline-flex items-center justify-center rounded bg-orange-500 text-white hover:bg-orange-600"
                        title="Editar detalles del contrato"
                      >
                        <DocumentIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  </td>
                  <td className="border border-gray-400 px-1 py-0 bg-white text-left align-middle" style={{width: '100px', minWidth: '100px', maxWidth: '100px'}}>
                  <div className="relative w-full">
                  <input
                    type="text"
                    value={(() => {
                      const cellKey = `${categoria.id}-registroEgresos`;
                      if (editingCells[cellKey]) {
                        return editingValues[cellKey] || '';
                      }
                      return formatMonetaryDisplay(categoria.registroEgresos);
                    })()}
                    onChange={(e) => handleCategoriaChange(categoria.id, 'registroEgresos', e.target.value)}
                    onFocus={() => handleMonetaryCellFocus(categoria.id, 'registroEgresos', categoria.registroEgresos)}
                    onBlur={() => handleMonetaryCellBlur(categoria.id, 'registroEgresos')}
                    className="w-full text-[9px] border-none outline-none text-left bg-transparent h-4 leading-tight pr-5"
                    placeholder="S/0.00"
                      />
                    <button
                      type="button"
                      onClick={() => openEgresoPopup(categoria)}
                      className="absolute right-[2px] top-1/2 -translate-y-1/2 h-4 w-4 inline-flex items-center justify-center rounded bg-orange-500 text-white hover:bg-orange-600"
                      title="Registrar egresos y adjunto"
                    >
                      <DocumentIcon className="h-3 w-3" />
                    </button>
                  </div>
                  </td>
                  <td className={`border border-gray-400 px-1 py-0 text-center align-middle ${shouldHaveGrayBackground(categoria.nombre) ? 'bg-gray-300' : 'bg-white'}`} style={{width: '80px', minWidth: '80px', maxWidth: '80px'}}>
                    <span className="text-[9px] text-red-600 font-bold leading-tight">
                      {(() => {
                        // Verificar qué fórmula usar según el tipo de fila
                        // IMPORTANTE: Las filas marcadas en rojo SIEMPRE usan Contrato Prov. Y Serv., nunca Presup. Del Proy.
                        const esFilaMarcada = shouldSumInTotalSaldos(categoria.nombre);
                        const usarPresupuesto = !esFilaMarcada && shouldUsePresupuestoFormula(categoria);
                        
                        if (esFilaMarcada) {
                          // Para filas marcadas en rojo: SIEMPRE usar Contrato Prov. Y Serv. - Registro Egresos (ignorar Presup. Del Proy.)
                          const contrato = parseMonetary(categoria.contratoProvedYServ || 0);
                          const egresos = parseMonetary(categoria.registroEgresos || 0);
                          const resultado = contrato - egresos;
                          return formatMonetaryDisplay(resultado);
                        } else if (usarPresupuesto) {
                          // Para filas NO marcadas con Presup. Del Proy. > 0: Presup. Del Proy. - Registro Egresos
                          const presupuesto = parseMonetary(categoria.presupuestoDelProyecto || 0);
                          const egresos = parseMonetary(categoria.registroEgresos || 0);
                          const resultado = presupuesto - egresos;
                          return formatMonetaryDisplay(resultado);
                        } else {
                          // Para las demás filas: mostrar el valor actual sin calcular automáticamente
                          return formatMonetaryDisplay(categoria.saldosPorCancelar || 0);
                        }
                      })()}
                    </span>
                  </td>
                </tr>
              ))}
              
              {/* Fila de TOTALES - FÓRMULAS AUTOMÁTICAS (siempre visible al hacer scroll) */}
              <tr className="text-white font-bold h-9 border-t-4 border-gray-600 sticky bottom-0 z-20 bg-black">
                {/* Columna F vacía en totales */}
                <td className="border border-gray-400 px-0 py-0 bg-black"></td>
                {/* Etiqueta TOTALES */}
                <td className="border border-gray-400 px-1 py-0.5 text-left text-[10px] bg-black" style={{width: '180px', minWidth: '180px', maxWidth: '180px'}}>
                  TOTALES
                </td>
                {/* Totales por columna */}
                <td className="border border-gray-400 px-1 py-0.5 text-center text-[9px] bg-green-600" style={{width: '70px', minWidth: '70px', maxWidth: '70px'}}>
                  {formatMoney(totalesCalculados.presupuesto)}
                </td>
                <td className="border border-gray-400 px-1 py-0.5 text-center text-[9px] bg-blue-600" style={{width: '100px', minWidth: '100px', maxWidth: '100px'}}>
                  {formatMoney(totalesCalculados.contrato)}
                </td>
                <td className="border border-gray-400 px-1 py-0.5 text-center text-[9px] bg-red-600 font-bold" style={{width: '100px', minWidth: '100px', maxWidth: '100px'}}>
                  {formatMoney(totalesCalculados.egresos)}
                </td>
                <td className="border border-gray-400 px-1 py-0.5 text-center text-[9px] bg-gray-600 font-bold" style={{width: '80px', minWidth: '80px', maxWidth: '80px'}}>
                  {formatMoney(totalesCalculados.saldos)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
        </div>
        
        {/* Cuadros del lado derecho - Responsive */}
        <div className="flex-1 min-w-0 flex flex-col gap-1 justify-start w-full">
          {/* Fila superior - Responsive: vertical en móviles, horizontal en pantallas grandes */}
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 min-w-0">
            {/* ANÁLISIS FINANCIERO DEL PROYECTO */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden shrink-0 right-panel" style={{ width: '440px' }}>
              <div className="bg-red-600 text-white px-2 py-1 text-xs font-bold flex items-center justify-center">
                <span>📊 ANÁLISIS FINANCIERO DEL PROYECTO</span>
              </div>
              <div className="p-1">
                <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col className="w-[200px]" />
                    <col className="w-[120px]" />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Utilidad Estimada Sin Factura</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[110px] max-w-[110px] text-left whitespace-nowrap pl-1 font-bold text-gray-900 print-value">
                        {formatMoney(parseMonetary(projectData.montoContrato || 0) - totalesCalculados.presupuesto) || 'S/0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Utilidad Real Sin Factura</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[110px] max-w-[110px] text-left whitespace-nowrap pl-1 font-bold text-gray-900 print-value">
                        {formatMoney(parseMonetary(projectData.montoContrato || 0) - totalesCalculados.egresos) || 'S/0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Balance de Utilidad +/-</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[110px] max-w-[110px] text-left whitespace-nowrap pl-1 font-bold text-gray-900 print-value">
                        {(() => {
                          // Calcular directamente desde los totales para asegurar precisión
                          const montoContrato = parseMonetary(projectData.montoContrato || 0);
                          const utilidadEstimadaSF = montoContrato - totalesCalculados.presupuesto;
                          const utilidadRealSF = montoContrato - totalesCalculados.egresos;
                          const balanceUtilidad = utilidadEstimadaSF - utilidadRealSF;
                          return formatAbsMoney(balanceUtilidad);
                        })()}
                      </td>
                    </tr>
                    {/* Separador visual entre bloques */}
                    <tr>
                      <td colSpan={2} className="p-0 bg-black" style={{ height: '8px' }}></td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Utilidad Estimada Con Factura</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[110px] max-w-[110px] text-left whitespace-nowrap pl-1 font-bold text-gray-900 print-value">
                        {(() => {
                          // Utilidad Estimada Con Factura = Monto del Contrato - (Presupuesto Del Proyecto + Impuesto Estimado del Proyecto)
                          const montoContrato = parseMonetary(projectData.montoContrato || 0);
                          const presupuestoProyecto = totalesCalculados.presupuesto;
                          
                          // Calcular Impuesto Estimado del Proyecto directamente: IGV - SUNAT 18% - Crédito Fiscal Estimado
                          const igvSunat = (montoContrato / 1.18) * 0.18;
                          
                          // Calcular Crédito Fiscal Estimado (suma de PRESUPUESTOS con F)
                          const nombresF = new Set([
                            'melamina y servicios', 'melamina high gloss', 'accesorios y ferretería', 'accesorios y ferreteria',
                            'puertas alu vidrios', 'puertas alu y vidrios', 'led y electricidad', 'granito y/o cuarzo',
                            'tercializacion 1 facturada', 'tercialización 1 facturada', 'tercializacion 2 facturada', 'tercialización 2 facturada'
                          ]);
                          const baseCredito = (projectData.categorias || []).reduce((sum, cat) => {
                            const nombre = (cat?.nombre || '').toString().toLowerCase().trim();
                            const esTipoF = (cat?.tipo || '').toString().toUpperCase() === 'F';
                            const esListado = nombresF.has(nombre);
                            const califica = esTipoF || esListado;
                            const bruto = cat?.presupuestoDelProyecto ?? 0;
                            const valor = parseFloat(String(bruto).replace(/[^0-9.-]/g, '')) || 0;
                            return califica ? sum + valor : sum;
                          }, 0);
                          const creditoFiscalEstimado = (baseCredito / 1.18) * 0.18;
                          
                          // Impuesto Estimado del Proyecto = IGV - Crédito Fiscal Estimado
                          const impuestoEstimado = igvSunat - creditoFiscalEstimado;
                          
                          const utilidadEstimadaCF = montoContrato - (presupuestoProyecto + impuestoEstimado);
                          return formatMoney(utilidadEstimadaCF) || 'S/0.00';
                        })()}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Utilidad Real Con Factura</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[110px] max-w-[110px] text-left whitespace-nowrap pl-1 font-bold text-gray-900 print-value">
                        {(() => {
                          // Utilidad Real Con Factura = Monto del Contrato - (Total Registro de Egresos + Crédito Fiscal Real)
                          const montoContrato = parseMonetary(projectData.montoContrato || 0);
                          const totalEgresos = totalesCalculados.egresos;
                          
                          // Calcular Crédito Fiscal Real (suma de egresos con F)
                          const totalEgresosConFactura = (projectData.categorias || []).reduce((sum, cat) => {
                            const esTipoF = (cat?.tipo || '').toString().toUpperCase() === 'F';
                            if (esTipoF) {
                              return sum + parseMonetary(cat.registroEgresos || 0);
                            }
                            return sum;
                          }, 0);
                          const creditoFiscalReal = (totalEgresosConFactura / 1.18) * 0.18;
                          
                          const utilidadRealCF = montoContrato - (totalEgresos + creditoFiscalReal);
                          return formatMoney(utilidadRealCF) || 'S/0.00';
                        })()}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Balance de Utilidad</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[110px] max-w-[110px] text-left whitespace-nowrap pl-1 font-bold text-gray-900 print-value">
                        {(() => {
                          // Balance de Utilidad = Utilidad Estimada Con Factura - Utilidad Real Con Factura
                          const montoContrato = parseMonetary(projectData.montoContrato || 0);
                          const presupuestoProyecto = totalesCalculados.presupuesto;
                          
                          // Calcular Impuesto Estimado del Proyecto
                          const igvSunat = (montoContrato / 1.18) * 0.18;
                          const nombresF = new Set([
                            'melamina y servicios', 'melamina high gloss', 'accesorios y ferretería', 'accesorios y ferreteria',
                            'puertas alu vidrios', 'puertas alu y vidrios', 'led y electricidad', 'granito y/o cuarzo',
                            'tercializacion 1 facturada', 'tercialización 1 facturada', 'tercializacion 2 facturada', 'tercialización 2 facturada'
                          ]);
                          const baseCredito = (projectData.categorias || []).reduce((sum, cat) => {
                            const nombre = (cat?.nombre || '').toString().toLowerCase().trim();
                            const esTipoF = (cat?.tipo || '').toString().toUpperCase() === 'F';
                            const esListado = nombresF.has(nombre);
                            const califica = esTipoF || esListado;
                            const bruto = cat?.presupuestoDelProyecto ?? 0;
                            const valor = parseFloat(String(bruto).replace(/[^0-9.-]/g, '')) || 0;
                            return califica ? sum + valor : sum;
                          }, 0);
                          const creditoFiscalEstimado = (baseCredito / 1.18) * 0.18;
                          const impuestoEstimado = igvSunat - creditoFiscalEstimado;
                          
                          // Utilidad Estimada Con Factura
                          const utilidadEstimadaCF = montoContrato - (presupuestoProyecto + impuestoEstimado);
                          
                          // Utilidad Real Con Factura
                          const totalEgresos = totalesCalculados.egresos;
                          const totalEgresosConFactura = (projectData.categorias || []).reduce((sum, cat) => {
                            const esTipoF = (cat?.tipo || '').toString().toUpperCase() === 'F';
                            if (esTipoF) {
                              return sum + parseMonetary(cat.registroEgresos || 0);
                            }
                            return sum;
                          }, 0);
                          const creditoFiscalReal = (totalEgresosConFactura / 1.18) * 0.18;
                          const utilidadRealCF = montoContrato - (totalEgresos + creditoFiscalReal);
                          
                          // Balance de Utilidad
                          const balanceUtilidad = utilidadEstimadaCF - utilidadRealCF;
                          return formatAbsMoney(balanceUtilidad);
                        })()}
                      </td>
                    </tr>
                    {/* Separador visual entre bloques */}
                    <tr>
                      <td colSpan={2} className="p-0 bg-black" style={{ height: '8px' }}></td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">IGV - SUNAT 18%</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[110px] max-w-[110px] text-left whitespace-nowrap pl-1 font-bold text-gray-900">
                        {projectData.igvSunat || 'S/0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Crédito Fiscal Estimado</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[110px] max-w-[110px] text-left whitespace-nowrap pl-1 font-bold text-gray-900">
                        {projectData.creditoFiscalEstimado || 'S/0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Impuesto Estimado del Proyecto</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[110px] max-w-[110px] text-left whitespace-nowrap pl-1 font-bold text-gray-900 print-value">
                        {(() => {
                          const igvSunat = (parseMonetary(projectData.montoContrato || 0) / 1.18) * 0.18;
                          const creditoFiscalEstimado = parseMonetary(projectData.creditoFiscalEstimado || 0);
                          const impuestoEstimado = igvSunat - creditoFiscalEstimado;
                          return formatMoney(impuestoEstimado) || 'S/0.00';
                        })()}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Crédito Fiscal Real</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[110px] max-w-[110px] text-left whitespace-nowrap pl-1 font-bold text-gray-900 print-value">
                        {(() => {
                          // Suma de Registro Egresos con F (roja)
                          const totalEgresosConFactura = (projectData.categorias || []).reduce((sum, cat) => {
                            const esTipoF = (cat?.tipo || '').toString().toUpperCase() === 'F';
                            if (esTipoF) {
                              return sum + parseMonetary(cat.registroEgresos || 0);
                            }
                            return sum;
                          }, 0);
                          // Fórmula: Suma / 1.18 * 18%
                          const creditoFiscalReal = (totalEgresosConFactura / 1.18) * 0.18;
                          return formatMoney(creditoFiscalReal) || 'S/0.00';
                        })()}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Impuesto Real del Proyecto</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[90px] max-w-[90px] text-left whitespace-nowrap pl-1 font-bold text-gray-900 print-value">
                        {(() => {
                          // Impuesto Real del Proyecto = IGV - SUNAT 18% - Crédito Fiscal Real
                          const montoContrato = parseMonetary(projectData.montoContrato || 0);
                          const igvSunat = (montoContrato / 1.18) * 0.18;
                          
                          // Calcular Crédito Fiscal Real (suma de egresos con F)
                          const totalEgresosConFactura = (projectData.categorias || []).reduce((sum, cat) => {
                            const esTipoF = (cat?.tipo || '').toString().toUpperCase() === 'F';
                            if (esTipoF) {
                              return sum + parseMonetary(cat.registroEgresos || 0);
                            }
                            return sum;
                          }, 0);
                          const creditoFiscalReal = (totalEgresosConFactura / 1.18) * 0.18;
                          
                          const impuestoReal = igvSunat - creditoFiscalReal;
                          return formatMoney(impuestoReal) || 'S/0.00';
                        })()}
                      </td>
                    </tr>
                    {/* Separador visual entre bloques */}
                    <tr>
                      <td colSpan={2} className="p-0 bg-black" style={{ height: '8px' }}></td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Total Contrato Proveedores</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[90px] max-w-[90px] text-left whitespace-nowrap pl-1 font-bold text-gray-900 print-value">
                        {formatMoney(totalesCalculados.contrato) || 'S/0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Total Saldo Por Pagar Proveedores</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[90px] max-w-[90px] text-left whitespace-nowrap pl-1 font-bold text-gray-900 print-value">
                        {projectData.totalSaldoPorPagarProveedores || 'S/0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-white text-black border border-gray-400 px-1 py-0.5 font-bold text-xs" style={{ borderTop: '4px solid #000' }}>
                        Balance De Compras Del Proyecto
                      </td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-gray-900 font-bold text-xs w-[110px] max-w-[110px] text-left whitespace-nowrap pl-1" style={{ borderTop: '4px solid #000' }}>
                        {(() => {
                          // Balance De Compras Del Proyecto = (Suma de Presup. Del Proy. de categorías específicas + Suma de Contrato Prov. Y Serv. de categorías específicas) - Total Registro Egresos
                          // Usar los nombres exactos como aparecen en el código (normalizados a minúsculas para comparación)
                          const categoriasPresupuesto = [
                            'melamina y servicios',
                            'melamina high gloss',
                            'accesorios y ferretería',
                            'puertas alu vidrios',
                            'led y electricidad',
                            'flete y/o camioneta',
                            'logística operativa',
                            'extras y/o eventos'
                          ];
                          
                          const categoriasContrato = [
                            'despecie',
                            'mano de obra', // Se suman todas las instancias de "Mano de Obra"
                            'of - escp',
                            'granito y/o cuarzo',
                            'extras y/o eventos gyc',
                            'tercializacion 1 facturada',
                            'extras y/o eventos terc. 1',
                            'tercializacion 2 facturada',
                            'extras y/o eventos terc. 2',
                            'tercializacion 1 no facturada',
                            'extras y/o eventos terc. 1 nf',
                            'tercializacion 2 no facturada',
                            'extras y/o eventos terc. 2 nf'
                          ];
                          
                          const sumaPresupuestoEspecifico = (projectData.categorias || []).reduce((sum, cat) => {
                            const nombreOriginal = (cat?.nombre || '').toString();
                            const nombre = nombreOriginal.toLowerCase().trim().replace(/\s+/g, ' ');
                            // Comparación estricta: solo coincidencia exacta (igual que en useEffect)
                            const incluir = categoriasPresupuesto.some(catName => {
                              const nombreCat = catName.toLowerCase().trim().replace(/\s+/g, ' ');
                              // Solo coincidencia exacta
                              return nombre === nombreCat;
                            });
                            if (incluir) {
                              return sum + parseMonetary(cat.presupuestoDelProyecto || 0);
                            }
                            return sum;
                          }, 0);
                          
                          const sumaContratoEspecifico = (projectData.categorias || []).reduce((sum, cat) => {
                            const nombreOriginal = (cat?.nombre || '').toString();
                            const nombre = nombreOriginal.toLowerCase().trim().replace(/\s+/g, ' ');
                            // Comparación estricta: solo coincidencia exacta (igual que en useEffect)
                            const incluir = categoriasContrato.some(catName => {
                              const nombreCat = catName.toLowerCase().trim().replace(/\s+/g, ' ');
                              // Solo coincidencia exacta
                              return nombre === nombreCat;
                            });
                            if (incluir) {
                              return sum + parseMonetary(cat.contratoProvedYServ || 0);
                            }
                            return sum;
                          }, 0);
                          
                          // Usar totalesCalculados.egresos que es el total completo de la tabla (igual que totalesCalculadosTabla.egresos)
                          const balanceDeCompras = (sumaPresupuestoEspecifico + sumaContratoEspecifico) - totalesCalculados.egresos;
                          
                          // Log para debugging (solo en desarrollo)
                          if (process.env.NODE_ENV === 'development') {
                            console.log('🔍 RENDERIZADO - Balance De Compras:', {
                              sumaPresupuesto: sumaPresupuestoEspecifico,
                              sumaContrato: sumaContratoEspecifico,
                              totalEgresos: totalesCalculados.egresos,
                              balance: balanceDeCompras
                            });
                          }
                          
                          return formatMoney(balanceDeCompras) || 'S/0.00';
                        })()}
                      </td>
                    </tr>
                    {/* Separador visual - bloque inferior */}
                    <tr>
                      <td colSpan={2} className="p-0 bg-black" style={{ height: '8px' }}></td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Monto Del Contrato</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[90px] max-w-[90px] text-left whitespace-nowrap pl-1">
                        <input 
                          type="text" 
                          className="w-full border-none outline-none text-xs px-1 py-0.5 text-left font-bold text-gray-900" 
                          placeholder="S/0.00" 
                          value={formatMoney(projectData.montoContrato || 0)}
                          onChange={(e) => handleMontoContratoChange(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Adelantos</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[90px] max-w-[90px] text-left whitespace-nowrap pl-1">
                        <input 
                          type="text" 
                          className="w-full border-none outline-none text-xs px-1 py-0.5 text-left font-bold text-gray-900" 
                          placeholder="S/0.00" 
                          value={formatMoney(projectData.adelantos || 0)}
                          onChange={(e) => handleAdelantosChange(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Saldo Por Cobrar</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[90px] max-w-[90px] text-left whitespace-nowrap pl-1 font-bold text-gray-900 print-value">
                        {projectData.saldoXCobrar || 'S/0.00'}
                      </td>
                    </tr>
                    {/* Separador visual - antes de presupuesto/egresos */}
                    <tr>
                      <td colSpan={2} className="p-0 bg-black" style={{ height: '8px' }}></td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Presupuesto Del Proyecto</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[90px] max-w-[90px] text-left whitespace-nowrap pl-1 font-bold text-gray-900 print-value">
                        {formatMoney(totalesCalculados.presupuesto) || 'S/0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Total de Egresos del Proyecto</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[90px] max-w-[90px] text-left whitespace-nowrap pl-1 font-bold text-gray-900 print-value">
                        {formatMoney(totalesCalculados.egresos) || 'S/0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-white text-black border border-gray-400 px-1 py-0.5 font-bold text-xs" style={{ borderBottom: '4px solid #000' }}>Balance Del Presupuesto</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-black font-bold text-xs w-[90px] max-w-[90px] text-left whitespace-nowrap pl-1" style={{ borderBottom: '4px solid #000' }}>
                        {formatMoney(totalesCalculados.presupuesto - totalesCalculados.egresos) || 'S/0.00'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Panel de Cobranzas removido: ahora se gestiona desde el botón 'Abrir' en Monto del Contrato (popup). */}
          </div>
        </div>
      </div>

      {/* 🧾 POPUP POR-CELDA: DETALLES DEL CONTRATO DE SERVICIO */}
      {contratoPopupOpenFor && (
        <>
          {/* Capa para cerrar al hacer click fuera */}
          <div className="fixed inset-0 z-40" onClick={closeContratoPopup} />
          {/* Panel anclado a la celda */}
          <div
            className="fixed z-50 bg-white rounded-lg shadow-2xl w-[680px] max-w-[95vw] max-h-[80vh] overflow-y-auto border border-gray-200"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-2 rounded-t-lg flex justify-between items-center">
              <div className="text-white font-semibold text-sm">Contrato de Servicio</div>
              <button onClick={closeContratoPopup} className="text-white/90 hover:text-white">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Body (layout horizontal) */}
            <div className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Columna izquierda: Proveedor + Descripción */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Proveedor / Empresa</label>
                    <input
                      type="text"
                      value={contratoForm.proveedor}
                      onChange={(e) => setContratoForm(f => ({ ...f, proveedor: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="Nombre del proveedor"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Descripción del Servicio</label>
                    <textarea
                      value={contratoForm.descripcion}
                      onChange={(e) => setContratoForm(f => ({ ...f, descripcion: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm min-h-[140px] resize-y"
                      placeholder="Descripción breve del servicio"
                    />
                  </div>
                </div>

                {/* Columna derecha: Monto + Abonos */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Monto del Contrato</label>
                    <input
                      type="text"
                      value={contratoForm.monto}
                      onChange={(e) => setContratoForm(f => ({ ...f, monto: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="S/0.00"
                    />
                  </div>

                  <div>
                    <div className="bg-gray-700 text-white px-2 py-1 text-xs font-bold rounded-t">Abonos al Servicio (máx. 5)</div>
                    <div className="border border-gray-300 rounded-b overflow-y-auto max-h-48">
                      <div className="grid grid-cols-2 text-xs font-semibold bg-gray-100 border-b border-gray-300 sticky top-0">
                        <div className="px-2 py-1">Fecha</div>
                        <div className="px-2 py-1">Monto</div>
                      </div>
                      {contratoForm.abonos.map((a, idx) => (
                        <div key={idx} className="grid grid-cols-2 border-t border-gray-200">
                          <input
                            type="date"
                            value={a.fecha}
                            onChange={(e) => setContratoForm(f => {
                              const ab = [...f.abonos]; ab[idx] = { ...ab[idx], fecha: e.target.value }; return { ...f, abonos: ab };
                            })}
                            className="px-2 py-1 text-sm border-r border-gray-200"
                          />
                          <input
                            type="text"
                            value={a.monto}
                            onChange={(e) => setContratoForm(f => {
                              const ab = [...f.abonos]; ab[idx] = { ...ab[idx], monto: e.target.value }; return { ...f, abonos: ab };
                            })}
                            className="px-2 py-1 text-sm"
                            placeholder="S/0.00"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 rounded-b-lg">
              <button onClick={closeContratoPopup} className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 text-sm">Cancelar</button>
              <button onClick={saveContratoPopup} className="px-3 py-1.5 rounded bg-orange-500 text-white text-sm hover:bg-orange-600">Guardar</button>
            </div>
          </div>
        </>
      )}

      {/* 💸 POPUP POR-CELDA: REGISTRO DE EGRESOS (con adjunto PDF) */}
      {egresoPopupOpenFor && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeEgresoPopup} />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-2xl w-[680px] max-w-[95vw] max-h-[80vh] overflow-y-auto border border-gray-200"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-3 py-2 rounded-t-lg flex justify-between items-center">
              <div className="text-white font-semibold text-sm">Registro de Egresos</div>
              <button onClick={closeEgresoPopup} className="text-white/90 hover:text-white">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-3 space-y-3">
              {/* Tabla (Fecha | Egreso) */}
              <div>
                <div className="bg-gray-700 text-white px-2 py-1 text-xs font-bold rounded-t">Egresos del Servicio (máx. 5)</div>
                <div className="border border-gray-300 rounded-b overflow-hidden">
                  <div className="grid grid-cols-2 text-xs font-semibold bg-gray-100 border-b border-gray-300">
                    <div className="px-2 py-1">Fecha</div>
                    <div className="px-2 py-1">Egreso</div>
                  </div>
                  {egresoForm.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-2 border-t border-gray-200">
                      <input
                        type="date"
                        value={it.fecha}
                        onChange={(e) => setEgresoForm(f => {
                          const items = [...f.items]; items[idx] = { ...items[idx], fecha: e.target.value }; return { ...f, items };
                        })}
                        className="px-2 py-1 text-sm border-r border-gray-200"
                      />
                      <input
                        type="text"
                        value={it.monto}
                        onChange={(e) => setEgresoForm(f => {
                          const items = [...f.items]; items[idx] = { ...items[idx], monto: e.target.value }; return { ...f, items };
                        })}
                        className="px-2 py-1 text-sm"
                        placeholder="S/0.00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Descripción:</label>
                <textarea
                  value={egresoForm.descripcion}
                  onChange={(e) => setEgresoForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm min-h-[70px] resize-y"
                  placeholder="Descripción del egreso"
                />
              </div>

              {/* Adjuntar/Ver/Eliminar PDF */}
              <div className="flex items-center gap-2">
                <input
                  ref={egresoFileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleEgresoFilePick}
                />
                <button
                  onClick={() => egresoFileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                >
                  Adjuntar PDF
                </button>
                <button
                  onClick={viewEgresoPdf}
                  disabled={!egresoForm.pdfData}
                  className={`px-3 py-1.5 rounded text-sm ${egresoForm.pdfData ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  Ver PDF
                </button>
                <button
                  onClick={deleteEgresoPdf}
                  disabled={!egresoForm.pdfData}
                  className={`px-3 py-1.5 rounded text-sm ${egresoForm.pdfData ? 'bg-gray-700 text-white hover:bg-gray-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  Eliminar PDF
                </button>
                {egresoForm.pdfName && <span className="text-xs text-gray-600 truncate">Archivo: {egresoForm.pdfName}</span>}
              </div>
            </div>

            {/* Footer */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 rounded-b-lg">
              <button onClick={closeEgresoPopup} className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 text-sm">Cancelar</button>
              <button onClick={saveEgresoPopup} className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700">Guardar</button>
            </div>
          </div>
        </>
      )}

      {/* 💚 POPUP: COBRANZAS DEL PROYECTO (desde Monto del Contrato) */}
      {cobranzasPopupOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setCobranzasPopupOpen(false)} />
          <div ref={cobranzasPopupRef} className="fixed z-50 bg-white rounded-lg shadow-2xl w-[760px] max-w-[95vw] max-h-[85vh] overflow-y-auto border border-green-600" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            {/* Header verde */}
            <div className="bg-green-600 text-white px-3 py-2 text-sm font-bold flex items-center justify-between rounded-t-lg">
              <span>💰 Cobranzas del Proyecto</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrintCobranzasWindow} 
                  className="bg-white text-green-700 px-2 py-1 rounded text-xs hover:bg-gray-100"
                >
                  Imprimir
                </button>
                <button onClick={() => setCobranzasPopupOpen(false)} className="text-white/90 hover:text-white">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-3">
              {/* Reutilizamos el mismo panel de cobranzas */}
              <div className="border border-gray-300 rounded">
            <div className="bg-green-600 text-white px-2 py-1 text-xs font-bold flex items-center justify-center">
              <span>💰 COBRANZAS DEL PROYECTO</span>
            </div>
                <div className="p-1 bg-white">
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">MONTO DEL CONTRATO</td>
                        <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[110px] max-w-[110px] text-left whitespace-nowrap pl-1">
                      <input 
                        type="text" 
                        className="w-full border-none outline-none text-xs px-1 py-0.5 text-left" 
                            placeholder="S/0.00"
                            value={editingMontoContrato ? montoContratoRaw : formatMonetaryDisplay(projectData.montoContrato)}
                        onChange={(e) => handleMontoContratoChange(e.target.value)}
                        onFocus={handleMontoContratoFocus}
                        onBlur={handleMontoContratoBlur}
                      />
                    </td>
                  </tr>
                  {projectData.cobranzas?.map((cobranza, index) => (
                        <tr key={`popup-${cobranza.id}`}>
                          <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 text-xs w-[110px] max-w-[110px]">
                      <input 
                        type="date" 
                              className="w-full border-none outline-none text-xs px-1 py-0.5 bg-gray-100 text-center"
                        value={cobranza.fecha || ''}
                        onChange={(e) => handleCobranzaChange(index, 'fecha', e.target.value)}
                      />
                    </td>
                          <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs w-[110px] max-w-[110px]">
                      <input 
                        type="text" 
                        className="w-full border-none outline-none text-xs px-1 py-0.5 text-left" 
                              placeholder="S/0.00"
                              value={(() => {
                                const cellKey = `cobranza-${index}-monto`;
                                if (editingCells[cellKey]) {
                                  return editingValues[cellKey] || '';
                                }
                                return formatMonetaryDisplay(cobranza.monto || 0);
                              })()}
                        onChange={(e) => handleCobranzaChange(index, 'monto', e.target.value)}
                        onFocus={() => handleCobranzaMontoFocus(index, cobranza.monto)}
                        onBlur={() => handleCobranzaMontoBlur(index)}
                      />
                    </td>
                  </tr>
                  ))}
                  <tr>
                    <td className="bg-black text-white border border-gray-400 px-1 py-0.5 font-bold text-xs">SALDO X COBRAR</td>
                        <td className="border border-gray-400 px-1 py-0.5 bg-black text-white font-bold text-xs w-[110px] max-w-[110px] text-left whitespace-nowrap pl-1">
                          {formatMoney(calcularSaldoRestante())}
                        </td>
                  </tr>
                </tbody>
              </table>
                </div>
              </div>

              {/* Adjuntos (hasta 10) */}
              <div className="mt-3">
                <div className="bg-green-700 text-white px-2 py-1 text-xs font-bold rounded-t">Adjuntos (PDF, Imágenes) máx. 10</div>
                <div className="border border-green-200 rounded-b p-2 space-y-2 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      ref={cobranzasFilesInputRef}
                      type="file"
                      accept="application/pdf,image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => addCobranzasFiles(e.target.files)}
                    />
                    <button
                      onClick={() => cobranzasFilesInputRef.current?.click()}
                      className="px-3 py-1.5 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                    >
                      Adjuntar archivos
                    </button>
                    <span className="text-xs text-gray-600">{cobranzasFiles.length}/10</span>
                </div>
                  {cobranzasFiles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cobranzasFiles.map((f) => (
                        <div key={f.id} className="flex items-center justify-between border rounded px-2 py-1">
                          <span className="text-xs text-gray-700 truncate mr-2">{f.name}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => viewCobranzasFile(f)} className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs hover:bg-blue-700">Ver</button>
                            <button onClick={() => removeCobranzasFile(f.id)} className="px-2 py-0.5 rounded bg-gray-700 text-white text-xs hover:bg-gray-800">Eliminar</button>
                </div>
              </div>
                      ))}
            </div>
                  )}
            </div>
          </div>
        </div>

            {/* Footer */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 rounded-b-lg">
              <button onClick={() => setCobranzasPopupOpen(false)} className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 text-sm">Cerrar</button>
      </div>
          </div>
        </>
      )}

      {/* 📄 MODAL DE VISTA PREVIA PARA PDF DE COBRANZAS */}
      {cobranzasPreviewOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setCobranzasPreviewOpen(false)} />
          <div className="fixed z-50 bg-white rounded-lg shadow-2xl w-[90vw] max-w-[800px] max-h-[90vh] overflow-hidden border-2 border-blue-500" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            {/* Header azul para vista previa */}
            <div className="bg-blue-600 text-white px-4 py-3 text-base font-bold flex items-center justify-between">
              <span>👁️ Vista Previa - Cobranzas del Proyecto</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleGeneratePDFFromPreview} 
                  disabled={generatingPDF}
                  className={`px-3 py-1.5 rounded text-sm font-semibold ${
                    generatingPDF 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {generatingPDF ? '⏳ Generando...' : '✅ Generar PDF'}
                </button>
                <button 
                  onClick={() => {
                    setCobranzasPreviewOpen(false);
                    setGeneratingPDF(false);
                  }} 
                  disabled={generatingPDF}
                  className={`px-3 py-1.5 rounded text-sm font-semibold ${
                    generatingPDF 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  ✖️ Cerrar
                </button>
              </div>
            </div>

            {/* Contenedor de vista previa con scroll */}
            <div className="p-6 bg-gray-50 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {/* Mensaje informativo arriba */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <p className="font-semibold mb-1">📋 Vista Previa de Impresión</p>
                <p>Esta es la vista exacta de cómo se verá el PDF. Si todo se ve correctamente, haz clic en "Generar PDF" para descargarlo.</p>
              </div>
              
              <div className="bg-white p-4 rounded shadow-sm border border-gray-300">
                <div 
                  ref={cobranzasPreviewRef} 
                  id="cobranzas-preview-content"
                  className="w-full"
                  style={{ 
                    backgroundColor: '#ffffff',
                    minHeight: '400px',
                    fontFamily: 'Arial, sans-serif'
                  }}
                >
                  {/* El contenido se insertará aquí dinámicamente */}
                  <div className="text-center text-gray-400 py-20">
                    <p>Cargando vista previa...</p>
                  </div>
                </div>
              </div>
      </div>
          </div>
        </>
      )}

    {/* 📄 POPUP DE DOCUMENTOS DEL PROYECTO - DISEÑO EXACTO IMAGEN */}
      {documentosPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header naranja del popup */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 rounded-t-lg flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-white font-bold text-lg">📄 DOCUMENTOS DEL PROYECTO</span>
                {saveStatus === 'saving' && <span className="text-sm text-yellow-100">Guardando...</span>}
                {saveStatus === 'saved' && <span className="text-sm text-green-100">Guardado localmente</span>}
                {saveStatus === 'syncing' && <span className="text-sm text-blue-100">Sincronizando...</span>}
                {saveStatus === 'error' && <span className="text-sm text-red-100">Error guardando</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveAttachmentsToLocal}
                  className="bg-white text-orange-600 px-3 py-1 rounded-md font-semibold hover:bg-gray-100"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setDocumentosPopupOpen(false)}
                  className="text-white hover:text-orange-200 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="text-white bg-orange-500 px-4 py-1 text-sm">
              Proyecto 1 - Proyecto 1
            </div>

            {/* Contenido del popup */}
            <div className="p-4">
              {/* Tabla de proveedores */}
              <div className="bg-gray-700 rounded-lg overflow-hidden mb-4">
                {/* Header de la tabla */}
                <div className="grid grid-cols-6 gap-0 bg-gray-700 text-white text-sm font-bold">
                  <div className="p-3 border-r border-gray-600">Proveedor:</div>
                  <div className="p-3 border-r border-gray-600">Descripción:</div>
                  <div className="p-3 border-r border-gray-600">Fecha</div>
                  <div className="p-3 border-r border-gray-600">$/0.00</div>
                  <div className="p-3 border-r border-gray-600">Total</div>
                  <div className="p-3">Acciones</div>
                </div>

                {/* Filas de proveedores */}
                {proveedores.map((proveedor) => (
                  <div key={proveedor.id}>
                    {/* Fila principal del proveedor */}
                    <div className="grid grid-cols-6 gap-0 bg-gray-600 text-white text-sm border-t border-gray-500">
                      <div className="p-2 border-r border-gray-500">
                        <input 
                          type="text" 
                          placeholder="Proveedor" 
                          value={proveedor.nombre}
                          onChange={(e) => actualizarProveedor(proveedor.id, 'nombre', e.target.value)}
                          className="w-full bg-transparent text-white placeholder-gray-300 border-none outline-none text-sm"
                        />
                      </div>
                      <div className="p-2 border-r border-gray-500">
                        <input 
                          type="text" 
                          placeholder="Descripción" 
                          value={proveedor.pagos[0]?.descripcion || ''}
                          onChange={(e) => actualizarPago(proveedor.id, 1, 'descripcion', e.target.value)}
                          className="w-full bg-transparent text-white placeholder-gray-300 border-none outline-none text-sm"
                        />
                      </div>
                      <div className="p-2 border-r border-gray-500">
                        <input 
                          type="text" 
                          placeholder="dd/mm/aaaa" 
                          value={proveedor.pagos[0]?.fecha || ''}
                          onChange={(e) => actualizarPago(proveedor.id, 1, 'fecha', e.target.value)}
                          className="w-full bg-transparent text-white placeholder-gray-300 border-none outline-none text-sm"
                        />
                      </div>
                      <div className="p-2 border-r border-gray-500">
                        <input 
                          type="text" 
                          placeholder="$/0.00" 
                          value={proveedor.pagos[0]?.monto || ''}
                          onChange={(e) => actualizarPago(proveedor.id, 1, 'monto', e.target.value)}
                          className="w-full bg-transparent text-white placeholder-gray-300 border-none outline-none text-sm"
                        />
                      </div>
                      <div className="p-2 border-r border-gray-500 text-center font-bold text-orange-400">
                        ${calcularTotalProveedor(proveedor.id).toFixed(2)}
                      </div>
                      <div className="p-1 flex gap-1 justify-center">
                        {/* Botón + Agregar Pago */}
                        <button
                          onClick={() => agregarPago(proveedor.id)}
                          disabled={proveedor.pagos.length >= 10}
                          className={`w-6 h-6 rounded text-xs font-bold ${
                            proveedor.pagos.length < 10 
                              ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer' 
                              : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                          }`}
                          title="Agregar pago"
                        >
                          +
                        </button>
                        {/* Botón Ver/Ocultar Pagos */}
                        <button
                          onClick={() => toggleMostrarPagos(proveedor.id)}
                          className="w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
                          title={proveedor.mostrarPagos ? 'Ocultar pagos' : 'Ver pagos'}
                        >
                          {proveedor.mostrarPagos ? '−' : '👁'}
                        </button>
                      </div>
                    </div>

                    {/* Sub-filas de pagos adicionales (se muestran cuando está expandido) */}
                    {proveedor.mostrarPagos && proveedor.pagos.length > 1 && (
                      <div className="bg-gray-500">
                        {proveedor.pagos.slice(1).map((pago, index) => (
                          <div key={pago.id} className="grid grid-cols-6 gap-0 bg-gray-500 text-white text-sm border-t border-gray-400">
                            <div className="p-2 border-r border-gray-400 text-center text-gray-300 text-xs">
                              Pago {index + 2}
                            </div>
                            <div className="p-2 border-r border-gray-400">
                              <input 
                                type="text" 
                                placeholder="Descripción" 
                                value={pago.descripcion}
                                onChange={(e) => actualizarPago(proveedor.id, pago.id, 'descripcion', e.target.value)}
                                className="w-full bg-transparent text-white placeholder-gray-300 border-none outline-none text-sm"
                              />
                            </div>
                            <div className="p-2 border-r border-gray-400">
                              <input 
                                type="text" 
                                placeholder="dd/mm/aaaa" 
                                value={pago.fecha}
                                onChange={(e) => actualizarPago(proveedor.id, pago.id, 'fecha', e.target.value)}
                                className="w-full bg-transparent text-white placeholder-gray-300 border-none outline-none text-sm"
                              />
                            </div>
                            <div className="p-2 border-r border-gray-400">
                              <input 
                                type="text" 
                                placeholder="$/0.00" 
                                value={pago.monto}
                                onChange={(e) => actualizarPago(proveedor.id, pago.id, 'monto', e.target.value)}
                                className="w-full bg-transparent text-white placeholder-gray-300 border-none outline-none text-sm"
                              />
                            </div>
                            <div className="p-2 border-r border-gray-400 text-center text-gray-300 text-xs">
                              ${parseFloat(pago.monto || 0).toFixed(2)}
                            </div>
                            <div className="p-2"></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Fila TOTAL */}
                <div className="grid grid-cols-6 gap-0 bg-gray-800 text-white text-sm font-bold border-t border-gray-500">
                  <div className="p-3 col-span-5 border-r border-gray-600 text-right">TOTAL:</div>
                  <div className="p-3 text-orange-400">${calcularTotalGeneral().toFixed(2)}</div>
                </div>
              </div>

              {/* Sección ARCHIVOS ADJUNTOS */}
              <div className="bg-red-600 text-white px-4 py-2 font-bold text-center mb-4 rounded-t-lg">
                📎 ARCHIVOS ADJUNTOS
              </div>
              
              {/* Área de arrastrar archivos */}
              <div className="bg-gray-800 rounded-b-lg p-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center text-white transition-all ${dragActive ? 'border-red-400 bg-red-500/10' : 'border-gray-500'}`}
                >
                  <div className="mb-4">
                    <div className="w-12 h-12 mx-auto mb-4 text-4xl">📎</div>
                    <p className="text-white mb-2">Arrastra archivos aquí o haz clic para seleccionar (1-4 archivos máximo)</p>
                    <p className="text-gray-400 text-sm">Formatos: PDF, JPG, PNG, GIF, WEBP</p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                  >
                    📷 ADJUNTAR FOTO
                  </button>
                </div>

                {/* Mini-grilla de archivos adjuntos */}
                {archivosAdjuntos.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-white font-medium text-sm mb-2">Archivos adjuntos ({archivosAdjuntos.length}/4):</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {archivosAdjuntos.map(item => (
                        <div key={item.id} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center text-sm text-white overflow-hidden">
                              {item.type.startsWith('image/') ? (
                                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <DocumentIcon className="h-6 w-6 text-white" />
                              )}
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-medium text-white truncate" style={{maxWidth: 220}}>{item.name}</div>
                              <div className="text-xs text-gray-300">{(item.size/1024).toFixed(1)} KB</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openViewer(item)} title="Ver" className="bg-blue-600 hover:bg-blue-700 text-white rounded p-2 text-xs">
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => downloadFile(item)} title="Descargar" className="bg-green-600 hover:bg-green-700 text-white rounded p-2 text-xs">
                              ⬇
                            </button>
                            <button onClick={() => removeFile(item.id)} title="Eliminar" className="bg-red-600 hover:bg-red-700 text-white rounded p-2 text-xs">
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 👁️ POPUP DE VISTA PREVIA DE ARCHIVOS */}
      {viewerOpen && currentFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full m-4 flex flex-col">
            {/* Header del viewer */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">📄 {currentFile.name}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadFile(currentFile)} className="text-sm text-blue-600 hover:underline">Descargar</button>
                <button onClick={closeViewer} className="text-gray-500 hover:text-gray-700 transition-colors">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Contenido del viewer: imagen o PDF embebido */}
            <div className="flex-1 p-4 overflow-auto bg-gray-50 flex items-center justify-center">
              {currentFile.type && currentFile.type.startsWith('image/') ? (
                <img src={currentFile.url} alt={currentFile.name} className="max-w-full max-h-[75vh] object-contain" />
              ) : currentFile.type === 'application/pdf' ? (
                <iframe src={currentFile.url} title={currentFile.name} className="w-full h-[75vh] border-0" />
              ) : (
                <div className="text-center text-gray-600">
                  <DocumentIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Vista previa de {currentFile.name}</p>
                  <p className="text-sm text-gray-600 mt-2">Tipo de archivo no previsualizable. Puedes descargarlo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProyectoDetalle;