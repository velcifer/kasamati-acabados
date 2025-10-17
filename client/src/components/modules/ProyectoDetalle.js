import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useProjectDetail } from '../../hooks/useProjectData';
import { PencilIcon, DocumentArrowUpIcon, FolderIcon, EyeIcon } from '@heroicons/react/24/solid';

const ProyectoDetalle = ({ proyecto, onBack, projectNumber }) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [documentosPopupOpen, setDocumentosPopupOpen] = useState(false);
  const fileInputRef = useRef(null);

  // 🎯 SISTEMA DE AUTO-SYNC CON EXCEL PRINCIPAL
  const { project, loading, updateField, updateCategory, addCategory, totales } = useProjectDetail(projectNumber);
  
  const [projectData, setProjectData] = useState({
    // Datos básicos del proyecto
    estado: 'Ejecucion',
    nombreProyecto: proyecto?.nombreProyecto || `Proyecto ${projectNumber}`,
    tipo: 'contrato',
    nombreCliente: proyecto?.nombreCliente || '',
    telefono: '',
    
    // Análisis Financiero del Proyecto (todos en cero para ser editables)
    utilidadEstimadaSinFactura: '$/ 0.00',
    utilidadRealSinFactura: '$/ 0.00',
    balanceUtilidadSinFactura: '$/ 0.00',
    utilidadEstimadaConFactura: '$/ 0.00',
    utilidadRealConFactura: '$/ 0.00',
    balanceUtilidadConFactura: '$/ 0.00',
    
    // Cobranzas del Proyecto
    montoContrato: '$/ 0.00',
    adelantos: '$/ 0.00',
    saldoXCobrar: '$/ 0.00',
    presupuestoDelProyecto: '$/ 0.00',
    totalEgresosProyecto: '$/ 0.00',
    balanceDelPresupuesto: '$/ 0.00',
    
    // 📅 COBRANZAS - FECHAS Y MONTOS EDITABLES
    cobranzas: Array.from({length: 13}, (_, i) => ({
      id: i + 1,
      fecha: '',
      monto: 0
    })),
    
    // IGV - SUNAT 18% (todos en cero para ser editables)
    igvSunat: '$/ 0.00',
    creditoFiscalEstimado: '$/ 0.00',
    impuestoEstimadoDelProyecto: '$/ 0.00',
    creditoFiscalReal: '$/ 0.00',
    impuestoRealDelProyecto: '$/ 0.00',
    
    // Totales y Balance (todos en cero para ser editables)
    totalContratoProveedores: '$/ 0.00',
    totalSaldoPorPagarProveedores: '$/ 0.00',
    balanceDeComprasDelProyecto: '$/ 0.00',
    
    // Observaciones
    observacionesDelProyecto: '',
    
    // Fechas de cobro (15 campos)
    fechaCobro1: '$/ 0.00',
    fechaCobro2: '$/ 0.00',
    fechaCobro3: '$/ 0.00',
    fechaCobro4: '$/ 0.00',
    fechaCobro5: '$/ 0.00',
    fechaCobro6: '$/ 0.00',
    fechaCobro7: '$/ 0.00',
    fechaCobro8: '$/ 0.00',
    fechaCobro9: '$/ 0.00',
    fechaCobro10: '$/ 0.00',
    fechaCobro11: '$/ 0.00',
    fechaCobro12: '$/ 0.00',
    fechaCobro13: '$/ 0.00',
    fechaCobro14: '$/ 0.00',
    fechaCobro15: '$/ 0.00',
    
    // Categorías iniciales con datos de ejemplo
    categorias: [
      { id: 1, nombre: 'Melamina y Servicios', tipo: 'F', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 2, nombre: 'Melamina High Gloss', tipo: 'F', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 3, nombre: 'Accesorios y Ferretería', tipo: 'F', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 4, nombre: 'Puertas Alu Vidrios', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 5, nombre: 'Led Y Electricidad', tipo: 'F', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 6, nombre: 'Flete y/o Camioneta', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 7, nombre: 'Logística Operativa', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 8, nombre: 'Extras y/o Eventos', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 9, nombre: 'Despecie', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 10, nombre: 'Mano de Obra', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 11, nombre: 'Mano de Obra', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 12, nombre: 'Mano de Obra', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 13, nombre: 'Mano de Obra', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 14, nombre: 'OF - ESCP', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 15, nombre: 'Granito Y/O Cuarzo', tipo: 'F', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 16, nombre: 'Extras Y/O Eventos GyC', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 17, nombre: 'Tercializacion 1 Facturada', tipo: 'F', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 18, nombre: 'Extras Y/O Eventos Terc. 1', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 19, nombre: 'Tercializacion 2 Facturada', tipo: 'F', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 20, nombre: 'Extras Y/O Eventos Terc. 2', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 21, nombre: 'Tercializacion 1 NO Facturada', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 22, nombre: 'Extras Y/O Eventos Terc. 1 NF', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 23, nombre: 'Tercializacion 2 NO Facturada', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' },
      { id: 24, nombre: 'Extras Y/O Eventos Terc. 2 NF', presupuestoDelProyecto: '$/ 0.00', contratoProvedYServ: '$/ 0.00', registroEgresos: '$/ 0.00', saldosPorCancelar: '$/ 0.00' }
    ]
  });

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
  };

  // 🔄 AUTO-SAVE: Handler para categorías (nuevo sistema)
  const handleCategoriaChange = (categoriaId, field, value) => {
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
  };

  // 🧮 FUNCIÓN DE TOTALES AUTOMÁTICOS (como Excel)
  const calcularTotales = () => {
    if (!projectData.categorias || projectData.categorias.length === 0) {
      return {
        presupuesto: 0,
        contrato: 0,
        egresos: 0,
        saldos: 0
      };
    }

    return projectData.categorias.reduce((totales, categoria) => {
      const presupuesto = parseFloat(categoria.presupuestoDelProyecto) || 0;
      const contrato = parseFloat(categoria.contratoProvedYServ) || 0;
      const egresos = parseFloat(categoria.registroEgresos) || 0;
      const saldos = parseFloat(categoria.saldosPorCancelar) || 0;

      return {
        presupuesto: totales.presupuesto + presupuesto,
        contrato: totales.contrato + contrato,
        egresos: totales.egresos + egresos,
        saldos: totales.saldos + saldos
      };
    }, { presupuesto: 0, contrato: 0, egresos: 0, saldos: 0 });
  };

  // 🧮 FÓRMULAS AUTOMÁTICAS DEL ANÁLISIS FINANCIERO
  const calcularAnalisisFinanciero = () => {
    const totales = calcularTotales();
    const montoContrato = parseFloat(projectData.montoContrato?.replace(/[^0-9.-]/g, '')) || 0;
    const presupuestoProyecto = parseFloat(projectData.presupuestoDelProyecto?.replace(/[^0-9.-]/g, '')) || 0;
    
    // Balance de Compras = Presupuesto - Egresos
    const balanceCompras = totales.presupuesto - totales.egresos;
    
    // Utilidad Real = Monto Contrato - Egresos Totales
    const utilidadReal = montoContrato - totales.egresos;
    
    // Saldo por Cobrar = Monto Contrato - Adelantos
    const adelantos = parseFloat(projectData.adelantos?.replace(/[^0-9.-]/g, '')) || 0;
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
  const handleCobranzaChange = (index, field, value) => {
    setProjectData(prev => {
      const newCobranzas = [...prev.cobranzas];
      if (field === 'monto') {
        // Convertir a número y validar
        const numericValue = parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0;
        newCobranzas[index] = { ...newCobranzas[index], [field]: numericValue };
      } else {
        newCobranzas[index] = { ...newCobranzas[index], [field]: value };
      }
      
      const updated = { ...prev, cobranzas: newCobranzas };
      
      // 🔄 AUTO-SAVE: Guardar en el servicio
      if (updateField) {
        updateField('cobranzas', newCobranzas);
      }
      
      return updated;
    });
  };

  // 🧮 CALCULAR TOTAL DE COBRANZAS
  const calcularTotalCobranzas = () => {
    return projectData.cobranzas?.reduce((total, cobranza) => {
      return total + (parseFloat(cobranza.monto) || 0);
    }, 0) || 0;
  };

  // 💰 MANEJAR CAMBIO EN MONTO DEL CONTRATO
  const handleMontoContratoChange = (value) => {
    const numericValue = parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0;
    setProjectData(prev => ({ ...prev, montoContrato: numericValue }));
    
    // 🔄 AUTO-SAVE
    if (updateField) {
      updateField('montoContrato', numericValue);
    }
  };

  // 💰 MANEJAR CAMBIO EN ADELANTOS
  const handleAdelantosChange = (value) => {
    const numericValue = parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0;
    setProjectData(prev => ({ ...prev, adelantos: numericValue }));
    
    // 🔄 AUTO-SAVE
    if (updateField) {
      updateField('adelantos', numericValue);
    }
  };

  // 📊 MANEJAR CAMBIO EN UTILIDAD ESTIMADA SIN FACTURA
  const handleUtilidadEstimadaSFChange = (value) => {
    const numericValue = parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0;
    setProjectData(prev => ({ ...prev, utilidadEstimadaSinFactura: numericValue }));
    
    // 🔄 AUTO-SAVE
    if (updateField) {
      updateField('utilidadEstimadaSinFactura', numericValue);
    }
  };

  // 📊 MANEJAR CAMBIO EN UTILIDAD ESTIMADA CON FACTURA
  const handleUtilidadEstimadaCFChange = (value) => {
    const numericValue = parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0;
    setProjectData(prev => ({ ...prev, utilidadEstimadaConFactura: numericValue }));
    
    // 🔄 AUTO-SAVE
    if (updateField) {
      updateField('utilidadEstimadaConFactura', numericValue);
    }
  };

  // 📊 OBTENER TOTALES CALCULADOS
  const totalesCalculados = calcularTotales();
  const analisisCalculado = calcularAnalisisFinanciero();

  // 🔄 AUTO-SYNC: Actualizar campos calculados cuando cambien las categorías
  useEffect(() => {
    if (projectData.categorias && updateField) {
      // 🧮 CALCULAR TOTALES AUTOMÁTICAMENTE
      const totalesCategoria = projectData.categorias.reduce((acc, cat) => {
        const presupuesto = parseFloat(cat.presupuestoDelProyecto?.toString().replace(/[^0-9.-]/g, '')) || 0;
        const contrato = parseFloat(cat.contratoProvedYServ?.toString().replace(/[^0-9.-]/g, '')) || 0;
        const egresos = parseFloat(cat.registroEgresos?.toString().replace(/[^0-9.-]/g, '')) || 0;
        
        return {
          totalPresupuesto: acc.totalPresupuesto + presupuesto,
          totalContrato: acc.totalContrato + contrato,
          totalEgresos: acc.totalEgresos + egresos
        };
      }, { totalPresupuesto: 0, totalContrato: 0, totalEgresos: 0 });

      // 🧮 CALCULAR CAMPOS FINANCIEROS
      const montoContrato = parseFloat(projectData.montoContrato?.toString().replace(/[^0-9.-]/g, '')) || 0;
      const adelantos = parseFloat(projectData.adelantos?.toString().replace(/[^0-9.-]/g, '')) || 0;
      const utilidadEstimadaSF = parseFloat(projectData.utilidadEstimadaSinFactura?.toString().replace(/[^0-9.-]/g, '')) || 0;
      const utilidadEstimadaCF = parseFloat(projectData.utilidadEstimadaConFactura?.toString().replace(/[^0-9.-]/g, '')) || 0;

      // 🔄 ACTUALIZAR TODOS LOS CAMPOS CALCULADOS EN EL SERVICIO
      
      // 📊 CAMPOS BÁSICOS DE TOTALES
      updateField('totalContratoProveedores', totalesCategoria.totalContrato);
      updateField('totalSaldoPorPagarProveedores', totalesCategoria.totalEgresos);
      updateField('presupuestoProyecto', totalesCategoria.totalPresupuesto);
      updateField('totalEgresosProyecto', totalesCategoria.totalEgresos);
      
      // 🧮 ANÁLISIS FINANCIERO SIN FACTURA
      const utilidadRealSF = utilidadEstimadaSF - totalesCategoria.totalEgresos;
      updateField('utilidadRealSinFactura', utilidadRealSF);
      updateField('balanceUtilidadSinFactura', utilidadRealSF);
      
      // 🧮 ANÁLISIS FINANCIERO CON FACTURA  
      const utilidadRealCF = utilidadEstimadaCF - totalesCategoria.totalEgresos;
      updateField('utilidadRealConFactura', utilidadRealCF);
      updateField('balanceUtilidadConFactura', utilidadRealCF);
      
      // 💰 COBRANZAS Y SALDOS
      updateField('saldoXCobrar', montoContrato - adelantos);
      updateField('balanceDeComprasDelProyecto', totalesCategoria.totalPresupuesto - totalesCategoria.totalEgresos);
      updateField('balanceDelPresupuesto', totalesCategoria.totalPresupuesto - montoContrato);
      
      // 🧾 IGV - SUNAT 18% (calculados automáticamente)
      const igvRate = 0.18;
      const igvSunat = utilidadRealSF * igvRate;
      const creditoFiscalEstimado = utilidadEstimadaSF * igvRate;
      const impuestoEstimado = montoContrato * igvRate;
      const creditoFiscalReal = utilidadRealSF * igvRate;
      const impuestoReal = totalesCategoria.totalEgresos * igvRate;
      
      updateField('igvSunat', igvSunat);
      updateField('creditoFiscalEstimado', creditoFiscalEstimado);
      updateField('impuestoEstimadoDelProyecto', impuestoEstimado);
      updateField('creditoFiscalReal', creditoFiscalReal);
      updateField('impuestoRealDelProyecto', impuestoReal);
      
      console.log('🧮 Sincronización automática completada:', {
        totalContrato: totalesCategoria.totalContrato,
        totalEgresos: totalesCategoria.totalEgresos,
        utilidadRealSF,
        utilidadRealCF,
        saldoXCobrar: montoContrato - adelantos,
        igvSunat,
        creditoFiscalReal
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

  // 📊 SINCRONIZAR TOTALES CON DATOS DEL SERVICIO
  useEffect(() => {
    if (project && project.categorias) {
      setProjectData(prev => ({
        ...prev,
        // Sincronizar datos principales
        nombreProyecto: project.nombreProyecto || prev.nombreProyecto,
        nombreCliente: project.nombreCliente || prev.nombreCliente,
        estadoProyecto: project.estadoProyecto || prev.estadoProyecto,
        tipoProyecto: project.tipoProyecto || prev.tipoProyecto,
        
        // 💰 DATOS EDITABLES BÁSICOS
        montoContrato: project.montoContrato || prev.montoContrato,
        adelantos: project.adelantos || prev.adelantos,
        utilidadEstimadaSinFactura: project.utilidadEstimadaSinFactura || prev.utilidadEstimadaSinFactura,
        utilidadEstimadaConFactura: project.utilidadEstimadaConFactura || prev.utilidadEstimadaConFactura,
        
        // 🧮 ANÁLISIS FINANCIERO - CAMPOS CALCULADOS
        utilidadRealSinFactura: `$/ ${project.utilidadRealSinFactura || 0}`,
        balanceUtilidadSinFactura: `$/ ${project.balanceUtilidadSinFactura || 0}`,
        utilidadRealConFactura: `$/ ${project.utilidadRealConFactura || 0}`,
        balanceUtilidadConFactura: `$/ ${project.balanceUtilidadConFactura || 0}`,
        
        // 🧾 IGV - SUNAT 18% - CAMPOS CALCULADOS
        igvSunat: `$/ ${project.igvSunat || 0}`,
        creditoFiscalEstimado: `$/ ${project.creditoFiscalEstimado || 0}`,
        impuestoEstimadoDelProyecto: `$/ ${project.impuestoEstimadoDelProyecto || 0}`,
        creditoFiscalReal: `$/ ${project.creditoFiscalReal || 0}`,
        impuestoRealDelProyecto: `$/ ${project.impuestoRealDelProyecto || 0}`,
        
        // 🧮 TOTALES Y BALANCES - CAMPOS CALCULADOS
        totalContratoProveedores: `$/ ${project.totalContratoProveedores || 0}`,
        totalSaldoPorPagarProveedores: `$/ ${project.totalSaldoPorPagarProveedores || 0}`,
        balanceDeComprasDelProyecto: `$/ ${project.balanceDeComprasDelProyecto || 0}`,
        saldoXCobrar: `$/ ${project.saldoXCobrar || 0}`,
        presupuestoProyecto: `$/ ${project.presupuestoProyecto || 0}`,
        totalEgresosProyecto: `$/ ${project.totalEgresosProyecto || 0}`,
        balanceDelPresupuesto: `$/ ${project.balanceDelPresupuesto || 0}`,
        
        // Categorías sincronizadas
        categorias: project.categorias.length > 0 ? project.categorias.map(cat => ({
          ...cat,
          presupuestoDelProyecto: cat.presupuestoDelProyecto || 0,
          contratoProvedYServ: cat.contratoProvedYServ || 0,
          registroEgresos: cat.registroEgresos || 0,
          saldosPorCancelar: cat.saldosPorCancelar || 0
        })) : prev.categorias,
        
        // 📅 SINCRONIZAR COBRANZAS GUARDADAS
        cobranzas: project.cobranzas || prev.cobranzas
      }));
    }
  }, [project]); // Se ejecuta cada vez que el proyecto del servicio cambie

  const openViewer = (file) => {
    setCurrentFile(file);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setCurrentFile(null);
  };

  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('Archivos seleccionados:', files);
      // Aquí puedes agregar la lógica para manejar los archivos
    }
  };

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
      presupuestoDelProyecto: '$/ 0.00',
      contratoProvedYServ: '$/ 0.00',
      registroEgresos: '$/ 0.00',
      saldosPorCancelar: '$/ 0.00'
    };
    
    setProjectData(prev => ({
      ...prev,
      categorias: [...prev.categorias, newCategoria]
    }));
  };

  // Cargar datos del proyecto si existe
  useEffect(() => {
    if (proyecto) {
      setProjectData(prev => ({
        ...prev,
        ...proyecto,
        categorias: proyecto.categorias || prev.categorias
      }));
    }
  }, [proyecto]);
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header estilo imagen - fondo blanco */}
      <div className="bg-white border-b border-gray-300 shadow-sm">
        {/* Barra superior con navegación y botones */}
        <div className="px-2 sm:px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          {/* Lado izquierdo - Navegación y título */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              ← Volver
            </button>
            
            <div className="hidden sm:block h-5 w-px bg-gray-300"></div>
            
            <h1 className="text-base sm:text-lg font-semibold text-gray-800">
              Proyecto {projectNumber} - Detalle Completo
            </h1>
            </div>
          
          {/* Lado derecho - Botones de acción estilo imagen */}
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => setDocumentosPopupOpen(true)}
              className="flex items-center justify-center px-3 sm:px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-medium rounded-md border border-orange-600 transition-colors shadow-sm w-full sm:w-auto"
            >
              <span className="hidden sm:inline">📄 DATOS ADICIONALES</span>
              <span className="sm:hidden">📄 DATOS</span>
            </button>
          </div>
        </div>

        {/* Barra de información del proyecto - fondo blanco */}
        <div className="bg-white border-t border-gray-200 px-2 sm:px-4 py-3">
          {/* Vista móvil - apilada */}
          <div className="block lg:hidden space-y-3">
            {/* Fila 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <span className="font-medium text-gray-700 text-xs">Proyecto:</span>
                <input
                  type="text"
                  value={projectData.nombreProyecto}
                  onChange={(e) => handleInputChange('nombreProyecto', e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1.5 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors text-sm w-full"
                  placeholder="Nombre del proyecto"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <span className="font-medium text-gray-700 text-xs">Cliente:</span>
                <input
                  type="text"
                  value={projectData.nombreCliente}
                  onChange={(e) => handleInputChange('nombreCliente', e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1.5 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors text-sm w-full"
                  placeholder="Nombre del cliente"
                />
              </div>
            </div>
            
            {/* Fila 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <span className="font-medium text-gray-700 text-xs">Estado:</span>
            <select
              value={projectData.estado}
              onChange={(e) => handleInputChange('estado', e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1.5 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors text-sm w-full"
                >
                  <option value="Cotizando">Cotizando</option>
                  <option value="Ejecucion">En Ejecución</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Cancelado">Cancelado</option>
            </select>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="font-medium text-gray-700 text-xs">Tipo:</span>
            <select
              value={projectData.tipo}
              onChange={(e) => handleInputChange('tipo', e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1.5 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors text-sm w-full"
                >
                  <option value="contrato">Contrato</option>
                  <option value="servicio">Servicio</option>
                  <option value="recibo">Recibo</option>
                  <option value="proyecto">Proyecto</option>
            </select>
              </div>
            </div>
          </div>
          
          {/* Vista desktop - horizontal */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Proyecto:</span>
          <input
            type="text"
            value={projectData.nombreProyecto}
            onChange={(e) => handleInputChange('nombreProyecto', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors w-56"
            placeholder="Nombre del proyecto"
          />
            </div>
          
            <div className="h-5 w-px bg-gray-300"></div>
          
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Cliente:</span>
          <input
            type="text"
            value={projectData.nombreCliente}
            onChange={(e) => handleInputChange('nombreCliente', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors w-44"
                placeholder="Cliente"
          />
        </div>

            <div className="h-5 w-px bg-gray-300"></div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Estado:</span>
              <select
                value={projectData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors w-36"
              >
                <option value="Cotizando">Cotizando</option>
                <option value="Ejecucion">En Ejecución</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            
            <div className="h-5 w-px bg-gray-300"></div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Tipo:</span>
              <select
                value={projectData.tipo}
                onChange={(e) => handleInputChange('tipo', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors w-32"
              >
                <option value="contrato">Contrato</option>
                <option value="servicio">Servicio</option>
                <option value="recibo">Recibo</option>
                <option value="proyecto">Proyecto</option>
              </select>
                </div>
              </div>
            </div>
          </div>

      {/* Contenido principal - Layout responsive centrado */}
      <div className="flex-1 flex flex-col xl:flex-row gap-2 px-1 py-1 sm:py-2 justify-center items-start xl:items-stretch max-w-[1400px] 2xl:max-w-[1600px] mx-auto">
        {/* Tabla principal de categorías */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full xl:w-[480px] 2xl:w-[520px]" style={{
          height: 'calc(100vh - 160px)',
          maxHeight: '80vh',
          minHeight: '420px'
        }}>
        {/* Header de la tabla */}
        <div className="bg-gray-800 text-white px-3 py-2 text-sm font-medium flex items-center">
          <span>📊 CATEGORÍAS Y SERVICIOS DEL PROYECTO</span>
            </div>

        {/* Contenedor con scroll horizontal y vertical para responsive */}
        <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 pb-8">
          <table className="w-full min-w-[600px] table-auto mb-4">
            {/* Headers de la tabla con colores específicos */}
            <thead className="sticky top-0">
              <tr className="text-xs font-bold">
                <th className="bg-gray-200 border border-gray-400 p-1 text-black text-left font-bold min-w-[170px] w-[170px] text-xs">
                  Categoría Del Proveedor<br />y/o el servicio
                </th>
                <th className="bg-green-600 border border-gray-400 p-1 text-white text-left font-bold min-w-[80px] w-[80px] text-xs">
                  Presupuesto<br />Del Proyecto
                </th>
                <th className="bg-blue-600 border border-gray-400 p-1 text-white text-left font-bold min-w-[80px] w-[80px] text-xs">
                  Contrato<br />Proved. Y Serv.
                </th>
                <th className="bg-red-600 border border-gray-400 px-2 py-1 text-white text-left font-bold min-w-[140px] w-[140px] text-xs leading-tight">
                  Registro<br />Egresos
                </th>
                <th className="bg-orange-500 border border-gray-400 p-1 text-white text-left font-bold min-w-[85px] w-[85px] text-xs">
                  Saldos por cancelar<br />servicio Proveedores
                </th>
              </tr>
            </thead>
            
            {/* Body de la tabla con celdas blancas editables */}
            <tbody>
              {projectData.categorias.map((categoria) => (
                <tr key={categoria.id} className="hover:bg-gray-50 h-8">
                  <td className="border border-gray-400 px-1 py-0.5 bg-white">
                    <div className="flex items-center">
                    {categoria.tipo && (
                        <span className={`inline-flex items-center justify-center w-3 h-3 rounded-full text-white text-xs font-bold mr-1 ${
                          categoria.tipo === 'F' ? 'bg-red-600' : 'bg-gray-600'
                        }`}>
                        {categoria.tipo}
                      </span>
                    )}
                      <input
                        type="text"
                        value={categoria.nombre}
                        onChange={(e) => handleCategoriaChange(categoria.id, 'nombre', e.target.value)}
                        className="bg-transparent border-none outline-none text-xs w-full"
                        placeholder="Categoría"
                      />
                  </div>
                  </td>
                  <td className="border border-gray-400 px-1 py-0.5 bg-white">
                  <input
                    type="text"
                    value={categoria.presupuestoDelProyecto}
                    onChange={(e) => handleCategoriaChange(categoria.id, 'presupuestoDelProyecto', e.target.value)}
                      className="w-full text-xs border-none outline-none text-left bg-transparent"
                      placeholder="$/ 0.00"
                  />
                  </td>
                  <td className="border border-gray-400 px-1 py-0.5 bg-white">
                  <input
                    type="text"
                    value={categoria.contratoProvedYServ}
                    onChange={(e) => handleCategoriaChange(categoria.id, 'contratoProvedYServ', e.target.value)}
                      className="w-full text-xs border-none outline-none text-left bg-transparent"
                      placeholder="$/ 0.00"
                  />
                  </td>
                  <td className="border border-gray-400 px-2 py-0.5 bg-white min-w-[140px] w-[140px] text-left">
                  <input
                    type="text"
                    value={categoria.registroEgresos}
                    onChange={(e) => handleCategoriaChange(categoria.id, 'registroEgresos', e.target.value)}
                      className="w-full text-xs border-none outline-none text-left bg-transparent"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-gray-400 px-1 py-0.5 bg-white text-left">
                    <span className="text-xs text-red-600 font-semibold">
                      {categoria.saldosPorCancelar || 'S/ 0.00'}
                    </span>
                  </td>
                </tr>
              ))}
              
              {/* Fila de TOTALES - FÓRMULAS AUTOMÁTICAS */}
              <tr className="bg-black text-white font-bold h-12 border-t-4 border-gray-600">
                <td className="border border-gray-400 px-1 py-1 text-left text-xs">
                  TOTALES
                </td>
                <td className="border border-gray-400 px-1 py-1 text-left text-xs bg-green-600">
                  S/ {totalesCalculados.presupuesto.toFixed(2)}
                </td>
                <td className="border border-gray-400 px-1 py-1 text-left text-xs bg-blue-600">
                  S/ {totalesCalculados.contrato.toFixed(2)}
                </td>
                <td className="border border-gray-400 px-2 py-1 text-left text-xs bg-red-600 min-w-[140px] w-[140px] font-bold">
                  S/ {totalesCalculados.egresos.toFixed(2)}
                </td>
                <td className="border border-gray-400 px-1 py-1 text-left text-xs bg-orange-500">
                  S/ {totalesCalculados.saldos.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
        
        {/* Cuadros del lado derecho - Responsive */}
        <div className="flex flex-col gap-1 justify-start w-full xl:w-[800px] 2xl:w-[900px] xl:ml-3 2xl:ml-4">
          {/* Fila superior - Responsive: vertical en móviles, horizontal en pantallas grandes */}
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
            {/* ANÁLISIS FINANCIERO DEL PROYECTO */}
            <div className="w-full sm:w-[395px] 2xl:w-[445px] bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-red-600 text-white px-2 py-1 text-xs font-bold flex items-center justify-center">
                <span>📊 ANÁLISIS FINANCIERO DEL PROYECTO</span>
              </div>
              <div className="p-1">
                <table className="w-full text-xs">
                  <tbody>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Utilidad Estimada Sin Factura</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        <input 
                          type="text" 
                          className="w-full border-none outline-none text-xs px-1 py-0.5" 
                          placeholder="S/ 0.00" 
                          value={`S/ ${parseFloat(projectData.utilidadEstimadaSinFactura?.toString().replace(/[^0-9.-]/g, '')) || 0}`}
                          onChange={(e) => handleUtilidadEstimadaSFChange(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Utilidad Real Sin Factura</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        {projectData.utilidadRealSinFactura || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Balance de Utilidad +/-</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        {projectData.balanceUtilidadSinFactura || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Utilidad Estimada Con Factura</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        <input 
                          type="text" 
                          className="w-full border-none outline-none text-xs px-1 py-0.5" 
                          placeholder="S/ 0.00" 
                          value={`S/ ${parseFloat(projectData.utilidadEstimadaConFactura?.toString().replace(/[^0-9.-]/g, '')) || 0}`}
                          onChange={(e) => handleUtilidadEstimadaCFChange(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Utilidad Real Con Factura</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        {projectData.utilidadRealConFactura || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Balance de Utilidad</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        {projectData.balanceUtilidadConFactura || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">IGV - SUNAT 18%</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        {projectData.igvSunat || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Crédito Fiscal Estimado</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        {projectData.creditoFiscalEstimado || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Impuesto Estimado del Proyecto</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        {projectData.impuestoEstimadoDelProyecto || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Crédito Fiscal Real</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        {projectData.creditoFiscalReal || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Impuesto Real del Proyecto</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        {projectData.impuestoRealDelProyecto || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Total Contrato Proveedores</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        {projectData.totalContratoProveedores || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Total Saldo Por Pagar Proveedores</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        {projectData.totalSaldoPorPagarProveedores || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-black text-white border border-gray-400 px-1 py-0.5 font-bold text-xs">Balance De Compras Del Proyecto</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-black text-white font-bold text-xs">
                        {projectData.balanceDeComprasDelProyecto || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Monto Del Contrato</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        <input 
                          type="text" 
                          className="w-full border-none outline-none text-xs px-1 py-0.5" 
                          placeholder="S/ 0.00" 
                          value={`S/ ${parseFloat(projectData.montoContrato?.toString().replace(/[^0-9.-]/g, '')) || 0}`}
                          onChange={(e) => handleMontoContratoChange(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Adelantos</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        <input 
                          type="text" 
                          className="w-full border-none outline-none text-xs px-1 py-0.5" 
                          placeholder="S/ 0.00" 
                          value={`S/ ${parseFloat(projectData.adelantos?.toString().replace(/[^0-9.-]/g, '')) || 0}`}
                          onChange={(e) => handleAdelantosChange(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Saldo Por Cobrar</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        {projectData.saldoXCobrar || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Presupuesto Del Proyecto</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        {projectData.presupuestoProyecto || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">Total de Egresos del Proyecto</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                        {projectData.totalEgresosProyecto || 'S/ 0.00'}
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-black text-white border border-gray-400 px-1 py-0.5 font-bold text-xs">Balance Del Presupuesto</td>
                      <td className="border border-gray-400 px-1 py-0.5 bg-black text-white font-bold text-xs">
                        {projectData.balanceDelPresupuesto || 'S/ 0.00'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* COBRANZAS DEL PROYECTO */}
            <div className="w-full sm:w-[395px] 2xl:w-[445px] bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-green-600 text-white px-2 py-1 text-xs font-bold flex items-center justify-center">
              <span>💰 COBRANZAS DEL PROYECTO</span>
            </div>
            <div className="p-1">
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 font-bold text-xs">MONTO DEL CONTRATO</td>
                    <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                      <input 
                        type="text" 
                        className="w-full border-none outline-none text-xs px-1 py-0.5" 
                        placeholder="S/ 0.00" 
                        value={`S/ ${parseFloat(projectData.montoContrato?.toString().replace(/[^0-9.-]/g, '')) || 0}`}
                        onChange={(e) => handleMontoContratoChange(e.target.value)}
                      />
                    </td>
                  </tr>
                  {projectData.cobranzas?.map((cobranza, index) => (
                  <tr key={cobranza.id}>
                    <td className="bg-gray-100 border border-gray-400 px-1 py-0.5 text-xs">
                      <input 
                        type="date" 
                        className="w-full border-none outline-none text-xs px-1 py-0.5 bg-gray-100" 
                        value={cobranza.fecha || ''}
                        onChange={(e) => handleCobranzaChange(index, 'fecha', e.target.value)}
                      />
                    </td>
                    <td className="border border-gray-400 px-1 py-0.5 bg-white text-xs">
                      <input 
                        type="text" 
                        className="w-full border-none outline-none text-xs px-1 py-0.5" 
                        placeholder="S/ 0.00" 
                        value={`S/ ${cobranza.monto || 0}`}
                        onChange={(e) => handleCobranzaChange(index, 'monto', e.target.value)}
                      />
                    </td>
                  </tr>
                  ))}
                  <tr>
                    <td className="bg-black text-white border border-gray-400 px-1 py-0.5 font-bold text-xs">SALDO X COBRAR</td>
                    <td className="border border-gray-400 px-1 py-0.5 bg-black text-white font-bold text-xs">S/ {calcularTotalCobranzas().toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              {/* OBSERVACIONES DEL PROYECTO - Parte inferior del cuadro COBRANZAS */}
              <div className="mt-2 border-t border-gray-300 pt-2">
                <div className="bg-gray-700 text-white px-2 py-1 text-xs font-bold flex items-center justify-center rounded-t">
                  <span>📝 OBSERVACIONES DEL PROYECTO</span>
                </div>
                <div className="p-1 bg-gray-50 rounded-b">
                  <textarea 
                    className="w-full h-12 sm:h-16 border border-gray-300 rounded p-1 text-xs resize-none"
                    placeholder="Escriba aquí las observaciones del proyecto..."
                  ></textarea>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

    {/* 📄 POPUP DE DOCUMENTOS DEL PROYECTO - DISEÑO EXACTO IMAGEN */}
      {documentosPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header naranja del popup */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 rounded-t-lg flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-white font-bold text-lg">📄 DOCUMENTOS DEL PROYECTO</span>
              </div>
              <button
                onClick={() => setDocumentosPopupOpen(false)}
                className="text-white hover:text-orange-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
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
                <div className="border-2 border-dashed border-gray-500 rounded-lg p-8 text-center text-white">
                  <div className="mb-4">
                    <div className="w-12 h-12 mx-auto mb-4 text-4xl">
                      📎
                    </div>
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
              <h3 className="text-lg font-semibold text-gray-800">
                📄 {currentFile.name}
              </h3>
              <button
                onClick={closeViewer}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              </div>

            {/* Contenido del viewer */}
            <div className="flex-1 p-4 overflow-auto bg-gray-50 flex items-center justify-center">
              <div className="text-center text-gray-600">
                <DocumentIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Vista previa de {currentFile.name}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Vista previa de archivos en desarrollo...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProyectoDetalle;