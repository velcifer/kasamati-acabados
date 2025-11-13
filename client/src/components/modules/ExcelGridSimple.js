import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  CloudIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import ProyectoDetalle from './ProyectoDetalle';
import dataService from '../../services/dataService';
import { useExcelGrid } from '../../hooks/useProjectData';

const ExcelGridSimple = () => {
  const navigate = useNavigate();
  const [selectedCell, setSelectedCell] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Sistema de pestañas
  const [activeTab, setActiveTab] = useState('principal');
  const [tabs, setTabs] = useState([]);
  const [nextProjectNumber, setNextProjectNumber] = useState(1);
  
  // Sistema de eliminación
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedRowsToDelete, setSelectedRowsToDelete] = useState([]);
  
  // 📱 Estado para menú lateral móvil
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // 🎛️ Estado para menú lateral colapsible (oculto por defecto en Excel)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // 🔗 Estados de conectividad y carga
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');

  // 📱 DETECTAR TAMAÑO DE PANTALLA RESPONSIVE MEJORADO CON ZOOM
  const [screenSize, setScreenSize] = useState('desktop');
  const [forceUpdate, setForceUpdate] = useState(0);
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024);
      
      // Detección ULTRA-RESPONSIVE para todos los zooms
      if (width < 500) {
        setScreenSize('ultra-small');
      } else if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 800) {
        setScreenSize('small-tablet');
      } else if (width < 1000) {
        setScreenSize('tablet');
      } else if (width < 1300) {
        setScreenSize('laptop');
      } else if (width < 1700) {
        setScreenSize('desktop');
      } else {
        setScreenSize('desktop-large');
      }
      
      // Forzar re-render para actualizar configuraciones
      setForceUpdate(prev => prev + 1);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Detectar cambios de zoom con debounce
    let resizeTimeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    };
    
    window.addEventListener('orientationchange', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // 📊 Datos de proyectos con sincronización automática
  const { data, updateCell, createProject: createNewProject, deleteProject } = useExcelGrid();
  
  // 🔍 Estados para filtros
  const [filters, setFilters] = useState({
    nombreProyecto: '',
    nombreCliente: '',
    estadoProyecto: '',
    tipoProyecto: ''
  });
  
  // 🔄 Cargar datos iniciales - Ya no necesario con hook useExcelGrid
  useEffect(() => {
    // Los datos se cargan automáticamente con useExcelGrid
    setLoading(false);
    setSyncMessage('✅ Datos sincronizados automáticamente');
    setTimeout(() => setSyncMessage(''), 2000);
  }, [data]);

  const loadProjectsData = async () => {
    try {
      setLoading(true);
      setSyncMessage('Cargando proyectos...');
      
      const result = await dataService.getAllProjects();
      const connectionStatus = dataService.getConnectionStatus();
      
      if (result.success) {
        console.log('📊 Datos recibidos del backend:', result.data);
        
        // 🔄 PASO 1: Ordenar proyectos por numero_proyecto ASCENDENTE
        const sortedProjects = result.data.sort((a, b) => {
          const numA = a.numero_proyecto || a.id || 0;
          const numB = b.numero_proyecto || b.id || 0;
          return numA - numB;
        });
        
        console.log('🔢 Proyectos ordenados:', sortedProjects.map(p => ({
          id: p.id,
          numero_proyecto: p.numero_proyecto,
          nombre: p.nombre_proyecto
        })));
        
        // 🔄 PASO 2: Convertir a formato objeto con índices SECUENCIALES
        const projectsObject = {};
        let rowIndex = 1; // Empezar desde 1
        
        sortedProjects.forEach(project => {
          projectsObject[rowIndex] = {
            // ID del proyecto para referencias
            numeroProyecto: project.numero_proyecto || project.id,
            id: project.id,
            
            // Datos del proyecto
            nombreProyecto: project.nombre_proyecto || project.nombreProyecto,
            nombreCliente: project.nombre_cliente || project.nombreCliente,
            estadoProyecto: project.estado_proyecto || project.estadoProyecto,
            tipoProyecto: project.tipo_proyecto || project.tipoProyecto,
            montoContrato: project.monto_contrato || project.montoContrato,
            presupuestoProyecto: project.presupuesto_proyecto || project.presupuestoProyecto,
            balanceProyecto: project.balance_proyecto || project.balanceProyecto,
            utilidadEstimadaSinFactura: project.utilidad_estimada_sin_factura || project.utilidadEstimadaSinFactura,
            utilidadRealSinFactura: project.utilidad_real_sin_factura || project.utilidadRealSinFactura,
            balanceUtilidadSinFactura: project.balance_utilidad_sin_factura || project.balanceUtilidadSinFactura,
            utilidadEstimadaFacturado: project.utilidad_estimada_facturado || project.utilidadEstimadaFacturado,
            utilidadRealFacturado: project.utilidad_real_facturado || project.utilidadRealFacturado,
            balanceUtilidadConFactura: project.balance_utilidad_con_factura || project.balanceUtilidadConFactura,
            totalContratoProveedores: project.total_contrato_proveedores || project.totalContratoProveedores,
            saldoPagarProveedores: project.saldo_pagar_proveedores || project.saldoPagarProveedores,
            adelantosCliente: project.adelantos_cliente || project.adelantosCliente,
            saldosRealesProyecto: project.saldos_reales_proyecto || project.saldosRealesProyecto,
            saldosCobrarProyecto: project.saldos_cobrar_proyecto || project.saldosCobrarProyecto,
            creditoFiscal: project.credito_fiscal || project.creditoFiscal,
            impuestoRealProyecto: project.impuesto_real_proyecto || project.impuestoRealProyecto
          };
          
          rowIndex++; // Incrementar para el siguiente proyecto
        });
        
        console.log('📋 Objeto de proyectos creado:', {
          totalProyectos: Object.keys(projectsObject).length,
          filas: Object.keys(projectsObject),
          proyectos: Object.values(projectsObject).map(p => ({
            fila: Object.keys(projectsObject).find(key => projectsObject[key] === p),
            numeroProyecto: p.numeroProyecto,
            nombre: p.nombreProyecto
          }))
        });
        
        // 🔄 PASO 3: Actualizar estado
        setData(projectsObject);
        
        // 🔄 PASO 4: Calcular siguiente número de proyecto
        const maxNumeroProyecto = sortedProjects.length > 0 
          ? Math.max(...sortedProjects.map(p => p.numero_proyecto || p.id || 0))
          : 0;
        const nextNumber = maxNumeroProyecto + 1;
        
        console.log('🔢 Siguiente número de proyecto calculado:', {
          maxNumeroProyecto,
          nextNumber,
          totalProyectos: sortedProjects.length
        });
        
        setNextProjectNumber(nextNumber);
        
        // 🔄 PASO 5: Limpiar pestañas huérfanas y sincronizar con proyectos cargados
        setTabs(prevTabs => {
          const validTabs = prevTabs.filter(tab => {
            // Mantener solo pestañas que correspondan a proyectos existentes
            const existsInData = Object.values(projectsObject).some(project => 
              project.numeroProyecto === tab.number || project.id === tab.number
            );
            
            if (!existsInData) {
              console.log('🗑️ Removiendo pestaña huérfana:', tab.name);
            }
            
            return existsInData;
          });
          
          console.log('📑 Pestañas sincronizadas:', {
            antes: prevTabs.length,
            despues: validTabs.length,
            removidas: prevTabs.length - validTabs.length
          });
          
          return validTabs;
        });
        
        setSyncMessage(`✅ ${sortedProjects.length} proyectos cargados y ordenados correctamente`);
        
      } else {
        console.error('Error cargando proyectos:', result.error);
        setSyncMessage(`❌ Error: ${result.error}`);
      }
      
      setConnectionStatus(connectionStatus);
    } catch (error) {
      console.error('Error en loadProjectsData:', error);
      setSyncMessage('❌ Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/inicio');
  };

  // 🧮 FUNCIÓN PARA CALCULAR CAMPOS AUTOMÁTICOS
  const calculateAutomaticFields = (projectData) => {
    // Convertir string de dinero a número para cálculos
    const parseMoneyValue = (value) => {
      if (!value) return 0;
      if (typeof value === 'number') return value;
      return parseFloat(value.toString().replace(/[$,\/]/g, '')) || 0;
    };

    // Convertir número a formato de dinero
    const formatMoney = (value) => {
      return `$/${value.toFixed(2)}`;
    };

    // 📊 EXTRAER VALORES PARA CÁLCULOS COMPLETOS
    const montoContrato = parseMoneyValue(projectData.montoContrato);
    const presupuestoProyecto = parseMoneyValue(projectData.presupuestoProyecto);
    const adelantosCliente = parseMoneyValue(projectData.adelantosCliente);
    const totalContratoProveedores = parseMoneyValue(projectData.totalContratoProveedores);
    const saldoPagarProveedores = parseMoneyValue(projectData.saldoPagarProveedores);
    const utilidadEstimadaSin = parseMoneyValue(projectData.utilidadEstimadaSinFactura);
    const utilidadRealSin = parseMoneyValue(projectData.utilidadRealSinFactura);
    const utilidadEstimadaCon = parseMoneyValue(projectData.utilidadEstimadaFacturado);
    const utilidadRealCon = parseMoneyValue(projectData.utilidadRealFacturado);
    const creditoFiscal = parseMoneyValue(projectData.creditoFiscal);
    const impuestoReal = parseMoneyValue(projectData.impuestoRealProyecto);

    // 🧮 FÓRMULAS FINANCIERAS REALES DE EXCEL
    
    // 1. Balance del Presupuesto = Presupuesto - Monto Contrato
    const balancePresupuesto = presupuestoProyecto - montoContrato;
    
    // 2. Si no hay utilidad estimada sin factura, calcularla como 20% del monto del contrato
    const utilidadEstimadaSinCalculada = utilidadEstimadaSin || (montoContrato * 0.20);
    
    // 3. Si no hay utilidad real sin factura, calcularla basada en costos
    const utilidadRealSinCalculada = utilidadRealSin || (montoContrato - totalContratoProveedores);
    
    // 4. Balance de Utilidad Sin Factura = Estimada - Real
    const balanceUtilidadSin = utilidadEstimadaSinCalculada - utilidadRealSinCalculada;
    
    // 5. Si no hay utilidad estimada facturada, usar 15% del monto
    const utilidadEstimadaConCalculada = utilidadEstimadaCon || (montoContrato * 0.15);
    
    // 6. Si no hay utilidad real facturada, calcularla
    const utilidadRealConCalculada = utilidadRealCon || (utilidadRealSinCalculada * 0.75);
    
    // 7. Balance de Utilidad Con Factura = Estimada - Real
    const balanceUtilidadCon = utilidadEstimadaConCalculada - utilidadRealConCalculada;
    
    // 8. Saldo a Pagar Proveedores = Total Contrato - Pagos Realizados
    const saldoPagar = totalContratoProveedores - saldoPagarProveedores;
    
    // 9. Saldo X Cobrar = Monto Contrato - Adelantos
    const saldoCobrar = montoContrato - adelantosCliente;
    
    // 10. Saldo X Cobrar del Proyecto (más complejo)
    const saldoCobrarProyecto = montoContrato - adelantosCliente - (montoContrato * 0.05); // Menos retención
    
    // 11. Impuesto Real del Proyecto = Monto Contrato * 0.19 (IVA en Colombia)
    const impuestoRealCalculado = impuestoReal || (montoContrato * 0.19);
    
    // 12. Crédito Fiscal = Impuesto sobre compras a proveedores
    const creditoFiscalCalculado = creditoFiscal || (totalContratoProveedores * 0.19);

    return {
      ...projectData,
      // 🧮 FÓRMULAS AUTOMÁTICAS APLICADAS
      balanceProyecto: formatMoney(balancePresupuesto),
      utilidadEstimadaSinFactura: formatMoney(utilidadEstimadaSinCalculada),
      utilidadRealSinFactura: formatMoney(utilidadRealSinCalculada),
      balanceUtilidadSinFactura: formatMoney(balanceUtilidadSin),
      utilidadEstimadaFacturado: formatMoney(utilidadEstimadaConCalculada),
      utilidadRealFacturado: formatMoney(utilidadRealConCalculada),
      balanceUtilidadConFactura: formatMoney(balanceUtilidadCon),
      saldoPagarProveedores: formatMoney(saldoPagar),
      saldosCobrarProyecto: formatMoney(saldoCobrarProyecto),
      saldosRealesProyecto: formatMoney(saldoCobrar),
      impuestoRealProyecto: formatMoney(impuestoRealCalculado),
      creditoFiscal: formatMoney(creditoFiscalCalculado)
    };
  };

  const handleCellChange = (rowIndex, columnKey, value) => {
    console.log('📝 CAMBIO EN CELDA - SISTEMA SINCRONIZADO:', { fila: rowIndex, campo: columnKey, valor: value });
    
    // 🔄 SISTEMA NUEVO: Usar updateCell del hook para sincronización automática
    // Esto actualizará automáticamente tanto la tabla Excel como el detalle del proyecto
    updateCell(rowIndex, columnKey, value);
    
    // 🔄 Sincronizar con pestañas abiertas inmediatamente
    const openTab = tabs.find(tab => tab.rowIndex === parseInt(rowIndex));
    if (openTab) {
      console.log('📑 Sincronizando pestaña abierta:', openTab.name);
      setTabs(prev => prev.map(tab =>
        tab.rowIndex === parseInt(rowIndex)
          ? {
              ...tab,
              data: {
                ...tab.data,
                [columnKey]: value
              },
              name: columnKey === 'nombreProyecto' ? value || `Proyecto ${rowIndex}` : tab.name
            }
          : tab
      ));
    }
    
    // 🔄 Mensaje de confirmación
    setSyncMessage(`✅ ${columnKey} actualizado - Sincronizado automáticamente`);
    setTimeout(() => setSyncMessage(''), 2000);
  };

  // Funciones para manejo de pestañas
  const handleAddProject = async () => {
    try {
      setSyncMessage('Creando nuevo proyecto...');
      
      // 🔄 SISTEMA NUEVO: Usar createNewProject del hook
      const currentProjects = Object.keys(data);
      const numeroProyecto = nextProjectNumber;
      
      console.log('🆕 Creando nuevo proyecto con hook:', {
        numeroProyecto,
        currentProjectsCount: currentProjects.length
      });
      
      const projectData = {
        nombreProyecto: `Proyecto ${numeroProyecto}`,
        nombreCliente: '',
        estadoProyecto: 'Ejecucion',
        tipoProyecto: 'Recibo',
        montoContrato: 0,
        presupuestoProyecto: 0
      };
      
      // El hook creará el proyecto automáticamente y actualizará el estado
      const newProject = createNewProject(projectData);
      const newRowIndex = currentProjects.length + 1;
      
      console.log('✅ Proyecto creado automáticamente:', newProject);
      
      // 🔄 Crear y agregar nueva pestaña
      const newTab = {
        id: `proyecto-${numeroProyecto}-${Date.now()}`,
        name: `Proyecto ${numeroProyecto}`,
        number: numeroProyecto,
        rowIndex: newRowIndex,
        data: projectData
      };
      
      setTabs(prev => [...prev, newTab]);
      
      // 🔄 Actualizar nextProjectNumber
      setNextProjectNumber(prev => prev + 1);
      
      // 🔄 Cambiar a la nueva pestaña
      setActiveTab(newTab.id);
      
      setSyncMessage(`✅ Proyecto ${numeroProyecto} creado automáticamente`);
      
      console.log('✅ Proyecto y pestaña creados:', {
        newRowIndex,
        newProject,
        newTab
      });
    } catch (error) {
      console.error('❌ Error en handleAddProject:', error);
      setSyncMessage('❌ Error creando proyecto');
    }
  };

  const handleCloseTab = (tabId) => {
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTab === tabId) {
      setActiveTab('principal');
    }
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  // 🖱️ FUNCIÓN PARA HACER CLIC EN FILAS Y ABRIR PESTAÑAS
  const handleRowClick = (rowIndex) => {
    console.log('🖱️ Click en fila:', rowIndex, 'Datos:', data[rowIndex]);
    
    if (!data[rowIndex]) {
      console.warn('⚠️ No hay datos para la fila:', rowIndex);
      return;
    }
    
    const projectData = data[rowIndex];
    console.log('📊 Datos del proyecto:', projectData);
    
    // Buscar pestaña existente por rowIndex
    const existingTab = tabs.find(tab => tab.rowIndex === parseInt(rowIndex));
    
    if (existingTab) {
      console.log('📑 Pestaña existente encontrada:', existingTab.name);
      setActiveTab(existingTab.id);
      setSyncMessage(`📂 Abriendo ${existingTab.name}`);
    } else {
      // Crear nueva pestaña con datos completos
      const projectName = projectData.nombreProyecto || `Proyecto ${projectData.numeroProyecto || rowIndex}`;
      const newTab = {
        id: `proyecto-${projectData.numeroProyecto || rowIndex}-${Date.now()}`,
        name: projectName,
        number: projectData.numeroProyecto || rowIndex,
        rowIndex: parseInt(rowIndex),
        data: projectData
      };
      
      console.log('📝 Creando nueva pestaña:', newTab);
      
      setTabs(prev => {
        const updated = [...prev, newTab];
        console.log('📑 Pestañas actualizadas:', updated.map(t => t.name));
        return updated;
      });
      
      setActiveTab(newTab.id);
      setSyncMessage(`📂 Creando pestaña: ${projectName}`);
    }
  };

  const handleSaveProject = async (projectSummary, projectFullData, tabId) => {
    try {
      setSyncMessage('Guardando proyecto...');
      
      console.log('💾 INICIANDO handleSaveProject:', {
        tabId,
        projectSummary: projectSummary?.nombreProyecto,
        projectFullData: !!projectFullData
      });
      
      const currentTab = tabs.find(tab => tab.id === tabId);
      console.log('🔍 Tab encontrado:', currentTab);
      
      if (currentTab && currentTab.rowIndex) {
        console.log(`💾 Guardando proyecto en fila ${currentTab.rowIndex}`);
        
        // 🔄 SISTEMA NUEVO: Los datos ya están sincronizados automáticamente con el hook
        console.log('🔄 Datos sincronizados automáticamente:', {
          rowIndex: currentTab.rowIndex,
          data: projectSummary
        });
        
        // 🔄 PASO 2: Actualizar datos en la pestaña
        setTabs(prev => prev.map(tab => 
          tab.id === tabId ? { 
            ...tab, 
            data: projectFullData,
            name: projectSummary.nombreProyecto || `Proyecto ${currentTab.number}`
          } : tab
        ));
        
        // 🔄 PASO 3: Actualizar en backend en paralelo (no bloqueante)
        try {
          const result = await dataService.updateProject(currentTab.rowIndex, projectSummary);
          console.log('🔄 Resultado del backend:', result);
          
          if (result.success) {
            setSyncMessage(`✅ Proyecto "${projectSummary.nombreProyecto}" guardado y sincronizado`);
            console.log(`✅ Proyecto ${currentTab.rowIndex} sincronizado con BD`);
          } else {
            console.warn('⚠️ Backend falló pero UI actualizada:', result.error);
            setSyncMessage(`⚠️ Cambios guardados localmente, error de sincronización: ${result.error}`);
          }
        } catch (backendError) {
          console.warn('⚠️ Error de backend, pero UI actualizada:', backendError);
          setSyncMessage(`⚠️ Cambios guardados localmente, error de conexión`);
        }
        
      } else {
        console.error('❌ No se encontró tab o rowIndex:', { currentTab, tabId, tabs });
        setSyncMessage('❌ Error: No se encontró el proyecto');
      }
    } catch (error) {
      console.error('❌ Error en handleSaveProject:', error);
      setSyncMessage('❌ Error guardando proyecto');
    }
  };

  // Funciones para manejo de eliminación
  const handleOpenDeletePopup = () => {
    setShowDeletePopup(true);
    setSelectedRowsToDelete([]);
  };

  const handleCloseDeletePopup = () => {
    setShowDeletePopup(false);
    setSelectedRowsToDelete([]);
  };
  
  // 🔍 FUNCIONES DE FILTRADO
  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      nombreProyecto: '',
      nombreCliente: '',
      estadoProyecto: '',
      tipoProyecto: ''
    });
  };

  // Filtrar datos basado en los filtros aplicados
  const getFilteredData = () => {
    const dataEntries = Object.entries(data);
    
    if (!filters.nombreProyecto && !filters.nombreCliente && !filters.estadoProyecto && !filters.tipoProyecto) {
      return data; // Sin filtros, devolver todos los datos
    }

    const filteredEntries = dataEntries.filter(([rowIndex, rowData]) => {
      const matchesNombreProyecto = !filters.nombreProyecto || 
        (rowData.nombreProyecto && rowData.nombreProyecto.toLowerCase().includes(filters.nombreProyecto.toLowerCase()));
      
      const matchesNombreCliente = !filters.nombreCliente || 
        (rowData.nombreCliente && rowData.nombreCliente.toLowerCase().includes(filters.nombreCliente.toLowerCase()));
      
      const matchesEstadoProyecto = !filters.estadoProyecto || 
        rowData.estadoProyecto === filters.estadoProyecto;
      
      const matchesTipoProyecto = !filters.tipoProyecto || 
        rowData.tipoProyecto === filters.tipoProyecto;

      return matchesNombreProyecto && matchesNombreCliente && matchesEstadoProyecto && matchesTipoProyecto;
    });

    return Object.fromEntries(filteredEntries);
  };

  const handleToggleRowSelection = (rowIndex) => {
    setSelectedRowsToDelete(prev => {
      if (prev.includes(rowIndex)) {
        return prev.filter(idx => idx !== rowIndex);
      } else {
        return [...prev, rowIndex];
      }
    });
  };

  const handleDeleteSelectedRows = async () => {
    if (selectedRowsToDelete.length === 0) return;

    try {
      setSyncMessage('Eliminando proyectos seleccionados...');
      
      console.log('🗑️ INICIANDO eliminación de filas:', selectedRowsToDelete);
      
      // 🔄 PASO 1: ELIMINAR INMEDIATAMENTE DEL ESTADO LOCAL (UI PRIMERO)
      const deletedProjectNames = selectedRowsToDelete.map(rowIndex => 
        data[rowIndex]?.nombreProyecto || `Proyecto ${rowIndex}`
      );
      
      console.log('📝 Proyectos a eliminar:', deletedProjectNames);
      
      // 🔄 SISTEMA NUEVO: Usar deleteProject del hook para cada proyecto
      selectedRowsToDelete.forEach(rowIndex => {
        console.log(`🗑️ Eliminando proyecto ${rowIndex} con hook:`, data[rowIndex]?.nombreProyecto);
        deleteProject(rowIndex);
      });
      
      console.log('📊 Proyectos eliminados automáticamente con hook');
      
      // 🔄 PASO 2: ACTUALIZAR PESTAÑAS
      setTabs(prev => {
        // Eliminar pestañas que correspondan a proyectos eliminados
        const remainingTabs = prev.filter(tab => 
          !selectedRowsToDelete.includes(tab.rowIndex)
        );
        
        console.log('🗑️ Pestañas eliminadas:', 
          prev.filter(tab => selectedRowsToDelete.includes(tab.rowIndex))
            .map(t => `${t.name} (fila ${t.rowIndex})`)
        );
        
        return remainingTabs;
      });
      
      // 🔄 PASO 3: SI LA PESTAÑA ACTIVA FUE ELIMINADA, VOLVER A PRINCIPAL
      const activeTabData = tabs.find(tab => tab.id === activeTab);
      if (activeTabData && selectedRowsToDelete.includes(activeTabData.rowIndex)) {
        console.log('📑 Cerrando pestaña activa eliminada:', activeTabData.name);
        setActiveTab('principal');
      }
      
      // 🔄 PASO 4: ACTUALIZAR NEXT PROJECT NUMBER
      const remainingProjects = Object.keys(data).filter(key => 
        !selectedRowsToDelete.includes(parseInt(key))
      );
      const newNextNumber = remainingProjects.length + 1;
      setNextProjectNumber(newNextNumber);
      
      console.log('🔢 Siguiente número de proyecto actualizado:', newNextNumber);
      
      setSyncMessage(`✅ ${selectedRowsToDelete.length} proyecto(s) eliminado(s) exitosamente`);
      
      // 🔄 PASO 5: SINCRONIZAR CON BACKEND EN BACKGROUND (opcional, no bloqueante)
      try {
        const result = await dataService.deleteProjects(selectedRowsToDelete);
        if (result.success) {
          console.log('✅ Eliminación sincronizada con backend');
        } else {
          console.warn('⚠️ Error de sincronización backend:', result.error);
          // No mostrar error al usuario, la UI ya está actualizada
        }
      } catch (backendError) {
        console.warn('⚠️ Error backend, pero eliminación local exitosa:', backendError);
      }
      
      console.log('✅ ELIMINACIÓN COMPLETADA exitosamente');
      
    } catch (error) {
      console.error('❌ Error en handleDeleteSelectedRows:', error);
      setSyncMessage('❌ Error eliminando proyectos');
    }

    // Cerrar popup y limpiar selección
    handleCloseDeletePopup();
  };

  // 🔥 CONFIGURACIÓN ULTRA-RESPONSIVE - FUNCIONA EN CUALQUIER ZOOM/DISPOSITIVO
  const getColumnConfig = () => {
    const totalColumns = 16; // Total de columnas en proyectos
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = width / height;
    
    // 🔍 ZOOM ULTRA-REDUCIDO: < 500px - MODO SÚPER COMPACTO
    if (width < 500) {
      return {
  columnWidth: '36px',
  indexWidth: '12px',
  headerHeight: '16px',
  rowHeight: '14px',
  fontSize: 'text-[6px]',
  headerFontSize: 'text-[6px]',
  padding: 'px-0',
  headerPadding: 'px-0 py-0',
        containerWidth: 'auto',
        screenType: 'ultra-small'
      };
    }
    // 📱 MÓVIL/ZOOM MUY REDUCIDO: 500px - 640px - SÚPER COMPACTO
    else if (width < 640) {
      return {
  columnWidth: '44px',
  indexWidth: '14px',
  headerHeight: '18px',
  rowHeight: '16px',
  fontSize: 'text-[7px]',
  headerFontSize: 'text-[7px]',
  padding: 'px-0',
  headerPadding: 'px-0 py-0',
        containerWidth: 'auto',
        screenType: 'mobile'
      };
    }
    // 📟 ZOOM REDUCIDO: 640px - 800px - MUY COMPACTO
    else if (width < 800) {
      return {
  columnWidth: '55px',
  indexWidth: '16px',
  headerHeight: '18px',
  rowHeight: '17px',
  fontSize: 'text-[8px]',
  headerFontSize: 'text-[7px]',
  padding: 'px-0.5',
  headerPadding: 'px-0.5 py-0',
        containerWidth: 'auto',
        screenType: 'small-tablet'
      };
    }
    // 📟 TABLET/ZOOM MEDIO: 800px - 1000px - COMPACTO
    else if (width < 1000) {
      return {
  columnWidth: '62px',
  indexWidth: '18px',
  headerHeight: '20px',
  rowHeight: '18px',
  fontSize: 'text-[8px]',
  headerFontSize: 'text-[8px]',
  padding: 'px-0.5',
  headerPadding: 'px-0.5 py-0',
        containerWidth: 'auto',
        screenType: 'tablet'
      };
    }
    // 💻 LAPTOP/ZOOM ESTÁNDAR: 1000px - 1300px - EQUILIBRADO Y UNIFORME
    else if (width < 1300) {
      return {
  columnWidth: '75px', // reducido para compactar
  indexWidth: '28px',
  headerHeight: '24px',
  rowHeight: '22px',
  fontSize: 'text-[9px]',
  headerFontSize: 'text-[9px]',
  padding: 'px-1',
  headerPadding: 'px-1 py-0.5',
        containerWidth: 'auto',
        screenType: 'laptop'
      };
    }
    // 🖥️ DESKTOP: 1300px - 1700px - CÓMODO Y BIEN PROPORCIONADO
    else if (width < 1700) {
      return {
  columnWidth: '90px', // reducido
  indexWidth: '34px',
  headerHeight: '28px',
  rowHeight: '26px',
  fontSize: 'text-[10px]',
  headerFontSize: 'text-[10px]',
  padding: 'px-1',
  headerPadding: 'px-1 py-1',
        containerWidth: 'auto',
        screenType: 'desktop'
      };
    }
    // 🖥️ DESKTOP GRANDE: > 1700px - ÓPTIMO Y ESPACIOSO
    else {
      return {
  columnWidth: '100px', // más compacto
  indexWidth: '38px',
  headerHeight: '30px',
  rowHeight: '28px',
  fontSize: 'text-[11px]',
  headerFontSize: 'text-[11px]',
  padding: 'px-1.5',
  headerPadding: 'px-1.5 py-1',
        containerWidth: 'auto',
        screenType: 'desktop-large'
      };
    }
  };

  // 🔥 ANCHOS EQUILIBRADOS - UNIFORME Y LEGIBLE EN TODOS LOS ZOOMS
  const getColumnWidth = (columnKey, config) => {
    // 📝 COLUMNAS DE TEXTO (importantes, necesitan más espacio)
    const textColumns = ['nombreProyecto', 'nombreCliente'];
    
    // 📊 COLUMNAS DE SELECCIÓN (necesitan espacio para dropdowns completos)
    const selectColumns = ['estadoProyecto', 'tipoProyecto'];
    
    // 💰 COLUMNAS DE DINERO/NÚMEROS (compactas pero legibles)
    const moneyColumns = [
      'montoContrato', 'presupuestoProyecto', 'balanceProyecto',
      'utilidadEstimadaSinFactura', 'utilidadRealSinFactura', 'balanceUtilidadSinFactura',
      'utilidadEstimadaFacturado', 'utilidadRealFacturado', 'balanceUtilidadConFactura',
      'totalContratoProveedores', 'saldoPagarProveedores', 'adelantosCliente',
      'saldosRealesProyecto', 'saldosCobrarProyecto', 'creditoFiscal', 'impuestoRealProyecto'
    ];
    
    const baseWidth = parseInt(config.columnWidth);
    
    if (textColumns.includes(columnKey)) {
      // Texto: Más ancho para legibilidad
  const multiplier = config.screenType === 'ultra-small' ? 1.35 :
        config.screenType === 'mobile' ? 1.25 : 
        config.screenType === 'small-tablet' ? 1.15 :
        config.screenType === 'tablet' ? 1.1 : 
        config.screenType === 'laptop' ? 1.05 :
        config.screenType === 'desktop' ? 1.1 :
        1.15; // desktop-large
      return `${Math.round(baseWidth * multiplier)}px`;
    } else if (selectColumns.includes(columnKey)) {
      // Selecciones: MÁS ANCHAS para que se vea el texto completo de los dropdowns
  const multiplier = config.screenType === 'ultra-small' ? 0.9 :
        config.screenType === 'mobile' ? 0.9 : 
        config.screenType === 'small-tablet' ? 0.88 :
        config.screenType === 'tablet' ? 0.9 : 
        config.screenType === 'laptop' ? 1.0 :
        config.screenType === 'desktop' ? 1.05 :
        1.1; // desktop-large
      return `${Math.round(baseWidth * multiplier)}px`;
    } else if (moneyColumns.includes(columnKey)) {
      // Dinero/números: Equilibradas, no demasiado pequeñas
  const multiplier = config.screenType === 'ultra-small' ? 0.7 :
        config.screenType === 'mobile' ? 0.75 : 
        config.screenType === 'small-tablet' ? 0.78 :
        config.screenType === 'tablet' ? 0.8 : 
        config.screenType === 'laptop' ? 0.88 :
        config.screenType === 'desktop' ? 0.9 :
        0.92; // desktop-large
      return `${Math.round(baseWidth * multiplier)}px`;
    }
    
    // Por defecto: ancho base
    return config.columnWidth;
  };

  // 📊 SECCIONES EXACTAS COMO EXCEL ORIGINAL - FORMATO IDÉNTICO
  const sections = [
    {
      title: 'DATOS GENERALES DEL PROYECTO',
      color: 'bg-red-600',
      columns: ['nombreProyecto', 'nombreCliente', 'estadoProyecto', 'tipoProyecto']
    },
    {
      title: 'ANÁLISIS FINANCIERO DEL PROYECTO', 
      color: 'bg-blue-800',
      columns: [
        'montoContrato', 'presupuestoProyecto', 'balanceProyecto',
        'utilidadEstimadaSinFactura', 'utilidadRealSinFactura', 'balanceUtilidadSinFactura',
        'utilidadEstimadaFacturado', 'utilidadRealFacturado', 'balanceUtilidadConFactura'
      ]
    },
    {
      title: 'COBRANZAS Y SALDOS POR PAGAR',
      color: 'bg-green-600', 
      columns: ['totalContratoProveedores', 'saldoPagarProveedores', 'adelantosCliente', 'saldosRealesProyecto', 'saldosCobrarProyecto']
    },
    {
      title: 'SUNAT',
      color: 'bg-orange-600',
      columns: ['creditoFiscal', 'impuestoRealProyecto']
    }
  ];

  // Calcular ancho total de una sección sumando anchos de sus columnas
  const getSectionWidth = (section) => {
    try {
      const cols = section.columns || [];
      const total = cols.reduce((acc, col) => {
        const w = getColumnWidth(col, config);
        const n = typeof w === 'string' ? parseInt(w.replace(/px/, '')) || 0 : Number(w) || 0;
        return acc + n;
      }, 0);
      return `${total}px`;
    } catch (e) {
      return config.columnWidth;
    }
  };

  // Recalcular configuración dinámicamente cuando cambie el tamaño
  const config = useMemo(() => getColumnConfig(), [forceUpdate]);

  // 🏷️ ETIQUETAS ADAPTATIVAS - MÁS CORTAS EN PANTALLAS PEQUEÑAS  
  const getColumnLabels = () => {
    const isUltraSmall = screenSize === 'ultra-small';
    const isSmall = screenSize === 'mobile' || screenSize === 'small-tablet';
    
    if (isUltraSmall) {
      // ULTRA-COMPACTO: Etiquetas súper cortas
      return {
        nombreProyecto: 'Proy.',
        nombreCliente: 'Cliente', 
        estadoProyecto: 'Est.',
        tipoProyecto: 'Tipo',
        montoContrato: 'Mnt.',
        presupuestoProyecto: 'Pres.',
        balanceProyecto: 'Bal.',
        utilidadEstimadaSinFactura: 'U.E.SF',
        utilidadRealSinFactura: 'U.R.SF',
        balanceUtilidadSinFactura: 'B.SF',
        utilidadEstimadaFacturado: 'U.E.F',
        utilidadRealFacturado: 'U.R.F', 
        balanceUtilidadConFactura: 'B.+/-',
        totalContratoProveedores: 'T.Prov',
        saldoPagarProveedores: 'S.Pagar',
        adelantosCliente: 'Adel.',
        saldosRealesProyecto: 'S.Real',
        saldosCobrarProyecto: 'X Cobr',
        creditoFiscal: 'C.Fisc',
        impuestoRealProyecto: 'Imp.'
      };
    } else if (isSmall) {
      // COMPACTO: Etiquetas cortas pero legibles
      return {
        nombreProyecto: 'Proyecto',
        nombreCliente: 'Cliente', 
        estadoProyecto: 'Estado',
        tipoProyecto: 'Tipo',
        montoContrato: 'Monto',
        presupuestoProyecto: 'Presup.',
        balanceProyecto: 'Balance',
        utilidadEstimadaSinFactura: 'U.Est.SF',
        utilidadRealSinFactura: 'U.Real SF',
        balanceUtilidadSinFactura: 'Bal. SF',
        utilidadEstimadaFacturado: 'U.Est.F',
        utilidadRealFacturado: 'U.Real F', 
        balanceUtilidadConFactura: 'Bal. +/-',
        totalContratoProveedores: 'Tot.Prov.',
        saldoPagarProveedores: 'Saldo Pagar',
        adelantosCliente: 'Adelantos',
        saldosRealesProyecto: 'Saldo Real',
        saldosCobrarProyecto: 'X Cobrar',
        creditoFiscal: 'Créd.Fiscal',
        impuestoRealProyecto: 'Impuesto'
      };
    } else {
      // NORMAL: Etiquetas completas
      return {
        nombreProyecto: 'Proyecto',
        nombreCliente: 'Cliente', 
        estadoProyecto: 'Estado',
        tipoProyecto: 'Tipo',
        montoContrato: 'Monto',
        presupuestoProyecto: 'Presup.',
        balanceProyecto: 'Balance',
        utilidadEstimadaSinFactura: 'Util. Est. SF',
        utilidadRealSinFactura: 'Util. Real SF',
        balanceUtilidadSinFactura: 'Bal. SF',
        utilidadEstimadaFacturado: 'Util. Est. F',
        utilidadRealFacturado: 'Util. Real F', 
        balanceUtilidadConFactura: 'Bal. +/-',
        totalContratoProveedores: 'Total Prov.',
        saldoPagarProveedores: 'Saldo Pagar',
        adelantosCliente: 'Adelantos',
        saldosRealesProyecto: 'Saldo Real',
        saldosCobrarProyecto: 'X Cobrar',
        creditoFiscal: 'Créd. Fiscal',
        impuestoRealProyecto: 'Impuesto'
      };
    }
  };

  // Recalcular etiquetas dinámicamente cuando cambie el screenSize
  const columnLabels = useMemo(() => getColumnLabels(), [screenSize]);

  const renderInput = (rowIndex, columnKey, value) => {
    // 🎯 ESTRUCTURA SIMPLE EXACTA COMO GESTOR DE VENTAS - TODAS LAS CELDAS IGUALES
    
    if (columnKey === 'estadoProyecto') {
      return (
        <select
          value={value}
          onChange={(e) => handleCellChange(rowIndex, columnKey, e.target.value)}
          className={`w-full h-full border-none outline-none ${config.fontSize} bg-white text-black focus:bg-blue-50 focus:ring-1 focus:ring-blue-300 text-center leading-tight font-medium`}
          style={{
            lineHeight: '1.2',
            height: config.rowHeight,
            padding: '2px 4px', // Padding fijo para mejor legibilidad
            minWidth: '100%'
          }}
        >
          <option value="Planificacion" className={`bg-white text-black ${config.fontSize}`}>Planificación</option>
          <option value="Ejecucion" className={`bg-white text-black ${config.fontSize}`}>Ejecución</option>
          <option value="Completado" className={`bg-white text-black ${config.fontSize}`}>Completado</option>
          <option value="Pausado" className={`bg-white text-black ${config.fontSize}`}>Pausado</option>
          <option value="Cancelado" className={`bg-white text-black ${config.fontSize}`}>Cancelado</option>
        </select>
      );
    } else if (columnKey === 'tipoProyecto') {
      return (
        <select
          value={value}
          onChange={(e) => handleCellChange(rowIndex, columnKey, e.target.value)}
          className={`w-full h-full border-none outline-none ${config.fontSize} bg-white text-black focus:bg-blue-50 focus:ring-1 focus:ring-blue-300 text-center leading-tight font-medium`}
          style={{
            lineHeight: '1.2',
            height: config.rowHeight,
            padding: '2px 4px', // Padding fijo para mejor legibilidad
            minWidth: '100%'
          }}
        >
          <option value="Contrato" className={`bg-white text-black ${config.fontSize}`}>Contrato</option>
          <option value="Servicio" className={`bg-white text-black ${config.fontSize}`}>Servicio</option>
          <option value="Recibo" className={`bg-white text-black ${config.fontSize}`}>Recibo</option>
          <option value="Proyecto" className={`bg-white text-black ${config.fontSize}`}>Proyecto</option>
        </select>
      );
    } else {
      // 🔥 TODOS LOS DEMÁS CAMPOS: INPUT ULTRA COMPACTO ESTILO EXCEL
      const moneyColumns = [
        'montoContrato', 'presupuestoProyecto', 'balanceProyecto',
        'utilidadEstimadaSinFactura', 'utilidadRealSinFactura', 'balanceUtilidadSinFactura',
        'utilidadEstimadaFacturado', 'utilidadRealFacturado', 'balanceUtilidadConFactura',
        'totalContratoProveedores', 'saldoPagarProveedores', 'adelantosCliente',
        'saldosRealesProyecto', 'saldosCobrarProyecto', 'creditoFiscal', 'impuestoRealProyecto'
      ];
      
      // Usar fuente más pequeña para números/dinero
      const fontSize = moneyColumns.includes(columnKey) ? 'text-[7px]' : config.fontSize;
      
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleCellChange(rowIndex, columnKey, e.target.value)}
          onClick={columnKey === 'nombreProyecto' ? () => handleRowClick(rowIndex) : undefined}
          className={`w-full h-full px-0.5 sm:px-0 border-none outline-none ${fontSize} bg-white text-black placeholder-gray-400 focus:bg-blue-50 focus:ring-1 focus:ring-blue-300 text-center leading-tight font-medium ${
            columnKey === 'nombreProyecto' ? 'cursor-pointer text-left' : ''
          }`}
          placeholder=""
          title={columnKey === 'nombreProyecto' ? `🖱️ Hacer clic para abrir ${value || `Proyecto ${rowIndex}`}` : ''}
          style={{
            lineHeight: '1.1',
            height: config.rowHeight,
            paddingTop: '0px',
            paddingBottom: '0px'
          }}
        />
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex flex-col">
      
      {/* 🔗 Estado de conectividad */}
      {connectionStatus && (
        <div className={`w-full px-4 py-2 text-xs flex items-center justify-between ${
          connectionStatus.isOnline ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
        }`}>
          <div className="flex items-center space-x-2">
            {connectionStatus.isOnline ? (
              <ServerIcon className="h-4 w-4" />
            ) : (
              <CloudIcon className="h-4 w-4" />
            )}
            <span>
              {connectionStatus.isOnline ? '🟢 Conectado a MySQL' : '🟡 Modo offline (localStorage)'}
            </span>
          </div>
          {syncMessage && (
            <span className="text-xs opacity-75">
              {syncMessage}
            </span>
          )}
        </div>
      )}
      
      {/* 🔄 Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white font-medium">Cargando proyectos...</p>
            <p className="text-white/60 text-sm mt-2">{syncMessage}</p>
          </div>
        </div>
      )}
      
      {/* Header móvil mejorado */}
      <div className="lg:hidden bg-white/10 backdrop-blur-md border-b border-white/20 p-2 sm:p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className="flex items-center text-white/80 hover:text-white transition-all duration-200 bg-white/10 px-2 sm:px-3 py-1 sm:py-2 rounded-lg border border-white/20"
          >
            <ArrowLeftIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Volver</span>
          </button>
          <h1 className="text-xs sm:text-sm font-bold text-white">Excel Proyectos</h1>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="flex items-center text-white/80 hover:text-white transition-all duration-200 bg-white/10 px-2 py-1 rounded-lg border border-white/20"
          >
            <span className="text-xs">☰</span>
          </button>
        </div>
      </div>

      {/* Menú lateral móvil */}
      {showMobileMenu && screenSize === 'mobile' && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          ></div>
          <div className="fixed top-0 right-0 w-64 h-full bg-white/10 backdrop-blur-md border-l border-white/20 z-50 lg:hidden">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm">Acciones</h3>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="text-white/70 hover:text-white"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <button 
                onClick={() => {
                  handleAddProject();
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center text-white/80 hover:text-white transition-all duration-200 bg-green-500/20 px-3 py-2 rounded-lg border border-green-400/30 hover:bg-green-500/30 text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-3" />
                <span>Agregar Proyecto</span>
              </button>

              <button 
                onClick={() => {
                  handleOpenDeletePopup();
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center text-white/80 hover:text-white transition-all duration-200 bg-red-500/20 px-3 py-2 rounded-lg border border-red-400/30 hover:bg-red-500/30 text-sm"
              >
                <TrashIcon className="h-4 w-4 mr-3" />
                <span>Eliminar Proyectos</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Sistema de Pestañas - Estilo Excel Responsive */}
      <div className="bg-white/5 border-b border-white/20 px-1 sm:px-2 lg:px-6 overflow-x-auto">
        <div className="flex items-end space-x-1 min-w-max">
          {/* Pestaña Principal Responsive */}
          <button
            onClick={() => handleTabClick('principal')}
            className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-t-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              activeTab === 'principal' 
                ? 'bg-white/20 text-white border-t border-l border-r border-white/30' 
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            Principal
          </button>
          
          {/* Pestañas de Proyectos Responsive */}
          {tabs.map((tab) => (
            <div key={tab.id} className="flex items-end">
              <button
                onClick={() => handleTabClick(tab.id)}
                className={`px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-t-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-white/20 text-white border-t border-l border-r border-white/30' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {screenSize === 'mobile' ? `P${tab.name.split(' ')[1]}` : tab.name}
              </button>
              <button
                onClick={() => handleCloseTab(tab.id)}
                className="ml-0.5 sm:ml-1 p-0.5 sm:p-1 text-white/50 hover:text-white hover:bg-red-500/20 rounded transition-all duration-200"
              >
                <XMarkIcon className="h-2 w-2 sm:h-3 sm:w-3" />
              </button>
            </div>
          ))}
          
          {/* Botón para agregar pestaña Responsive */}
          <button
            onClick={handleAddProject}
            className="px-1 sm:px-2 py-1 sm:py-2 text-white/50 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
            title="Agregar nuevo proyecto"
          >
            <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      {/* Renderización condicional: Hoja Principal o Detalle de Proyecto */}
      {activeTab === 'principal' ? (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          
          {/* 🎛️ MENÚ LATERAL COLAPSIBLE - Desktop MEJORADO */}
          <div className={`hidden lg:flex transition-all duration-300 ${
            sidebarCollapsed ? 'lg:w-0' : 'lg:w-64'
          } bg-white/10 backdrop-blur-md border-r border-white/20 overflow-hidden flex-col`}>
            <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
              <button
                onClick={handleGoBack}
                className="w-full flex items-center text-white/80 hover:text-white transition-all duration-200 bg-white/10 px-3 lg:px-4 py-2 lg:py-3 rounded-xl border border-white/20 hover:bg-white/20 text-sm"
              >
                <ArrowLeftIcon className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
                <span>Volver</span>
              </button>

              <button 
                onClick={handleAddProject}
                className="w-full flex items-center text-white/80 hover:text-white transition-all duration-200 bg-green-500/20 px-3 lg:px-4 py-2 lg:py-3 rounded-xl border border-green-400/30 hover:bg-green-500/30 text-sm"
              >
                <PlusIcon className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
                <span>Agregar Proyecto</span>
              </button>

              <button 
                onClick={handleOpenDeletePopup}
                className="w-full flex items-center text-white/80 hover:text-white transition-all duration-200 bg-red-500/20 px-3 lg:px-4 py-2 lg:py-3 rounded-xl border border-red-400/30 hover:bg-red-500/30 text-sm"
              >
                <TrashIcon className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
                <span>Eliminar Proyectos</span>
              </button>

              <div className="pt-4 border-t border-white/20">
                <p className="text-white/60 text-xs mb-2">Estadísticas</p>
                <div className="space-y-2">
                  <div className="text-xs text-white/80">
                    <span className="block">Total: {Object.keys(data).length} proyectos</span>
                    <span className="block">Filtrados: {Object.keys(getFilteredData()).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Área Principal - Excel Grid Completamente Responsive */}
          <div className="flex-1 p-1 sm:p-2 lg:p-4 xl:p-6 min-h-0 overflow-hidden">
            <div className="bg-transparent backdrop-blur-md rounded-lg lg:rounded-2xl border border-white/10 shadow-2xl h-full flex flex-col overflow-hidden">
              
              {/* Header con botón toggle - SIEMPRE VISIBLE Desktop */}
              <div className="hidden lg:flex lg:items-center lg:justify-between bg-white/10 p-2 lg:p-3 xl:p-4 border-b border-white/20">
                <div className="flex items-center space-x-2 lg:space-x-4">
                  {/* 🔹 BOTÓN TOGGLE SIDEBAR - FIJO Y SIEMPRE VISIBLE */}
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="flex items-center text-white/90 hover:text-white transition-all duration-200 bg-white/20 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg border border-white/30 hover:bg-white/30 shadow-lg"
                    title={sidebarCollapsed ? "Mostrar menú lateral" : "Ocultar menú lateral"}
                    style={{minWidth: '40px', minHeight: '36px'}}
                  >
                    <span className="text-base lg:text-lg font-bold">{sidebarCollapsed ? '☰' : '✕'}</span>
                  </button>
                  
                  <h1 className="text-sm lg:text-lg xl:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Excel Principal - Proyectos
                  </h1>
                </div>
                
                <div className="text-xs lg:text-sm text-white/60">
                  <div className={screenSize === 'ultra-small' ? 'text-[9px]' : ''}>{Object.keys(getFilteredData()).length} de {Object.keys(data).length}</div>
                  <div className={`${screenSize === 'ultra-small' ? 'block text-[8px]' : 'hidden sm:block text-[10px] lg:text-xs'} text-white/50 mt-1`}>
                    {screenSize === 'ultra-small' ? '🔍 Ultra' : '📱 Responsive • 🔄 Auto-sync • ↔️ Scroll horizontal'}
                  </div>
                </div>
              </div>

              {/* Sección de Filtros ULTRA-RESPONSIVE */}
              <div className={`bg-white/10 backdrop-blur-md rounded-lg border border-white/20 ${screenSize === 'ultra-small' ? 'p-1' : 'p-2 sm:p-3 lg:p-4'} mb-2 sm:mb-3 lg:mb-4 mx-2 sm:mx-0`}>
                {screenSize !== 'ultra-small' && (
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 lg:gap-3">
                      {/* 🔹 BOTÓN TOGGLE BACKUP - SIEMPRE DISPONIBLE */}
                      <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="hidden lg:flex items-center text-white/90 hover:text-white transition-all duration-200 bg-blue-500/20 px-2 py-1.5 rounded-md border border-blue-400/30 hover:bg-blue-500/30"
                        title={sidebarCollapsed ? "☰ Mostrar menú" : "✕ Ocultar menú"}
                        style={{minWidth: '32px', minHeight: '28px'}}
                      >
                        <span className="text-sm font-bold">{sidebarCollapsed ? '☰' : '✕'}</span>
                      </button>
                      
                      <h3 className="text-white font-semibold text-xs sm:text-sm flex items-center gap-2">
                        🔍 Filtros de Búsqueda
                      </h3>
                    </div>
                    <button
                      onClick={clearAllFilters}
                      className="text-[10px] sm:text-xs bg-red-500/20 text-red-300 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full hover:bg-red-500/30 transition-colors border border-red-500/30"
                    >
                      Limpiar Filtros
                    </button>
                    <div className="text-[10px] sm:text-xs text-white/60">
                      {Object.values(filters).filter(f => f).length > 0 && 
                        `Mostrando ${Object.keys(getFilteredData()).length} de ${Object.keys(data).length} proyectos`
                      }
                    </div>
                  </div>
                )}

                {/* Filtros compactos en modo ultra-small */}
                {screenSize === 'ultra-small' && (
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-white text-[10px] font-medium">🔍 Filtros</div>
                    <button
                      onClick={clearAllFilters}
                      className="text-[8px] bg-red-500/20 text-red-300 px-1 py-0.5 rounded hover:bg-red-500/30 transition-colors border border-red-500/30"
                    >
                      Limpiar
                    </button>
                  </div>
                )}

                <div className={`grid ${screenSize === 'ultra-small' ? 'grid-cols-2 gap-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4'}`}>
                  {/* Filtro por Nombre del Proyecto */}
                  <div className={screenSize === 'ultra-small' ? 'space-y-0.5' : 'space-y-1 sm:space-y-2'}>
                    <label className={`block text-white/80 font-medium ${screenSize === 'ultra-small' ? 'text-[8px]' : 'text-[10px] sm:text-xs'}`}>
                      {screenSize === 'ultra-small' ? 'Proyecto' : 'Nombre del Proyecto'}
                    </label>
                    <input
                      type="text"
                      value={filters.nombreProyecto}
                      onChange={(e) => handleFilterChange('nombreProyecto', e.target.value)}
                      placeholder={screenSize === 'ultra-small' ? 'Proy...' : screenSize === 'mobile' ? 'Nombre...' : 'Buscar por nombre...'}
                      className={`w-full bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:bg-white/20 focus:border-blue-400/50 focus:outline-none transition-colors ${screenSize === 'ultra-small' ? 'px-1 py-0.5 text-[8px]' : 'px-2 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs'}`}
                    />
                  </div>

                  {/* Filtro por Nombre del Cliente */}
                  <div className={screenSize === 'ultra-small' ? 'space-y-0.5' : 'space-y-1 sm:space-y-2'}>
                    <label className={`block text-white/80 font-medium ${screenSize === 'ultra-small' ? 'text-[8px]' : 'text-[10px] sm:text-xs'}`}>
                      {screenSize === 'ultra-small' ? 'Cliente' : 'Nombre del Cliente'}
                    </label>
                    <input
                      type="text"
                      value={filters.nombreCliente}
                      onChange={(e) => handleFilterChange('nombreCliente', e.target.value)}
                      placeholder={screenSize === 'ultra-small' ? 'Cli...' : screenSize === 'mobile' ? 'Cliente...' : 'Buscar por cliente...'}
                      className={`w-full bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:bg-white/20 focus:border-blue-400/50 focus:outline-none transition-colors ${screenSize === 'ultra-small' ? 'px-1 py-0.5 text-[8px]' : 'px-2 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs'}`}
                    />
                  </div>

                  {screenSize !== 'ultra-small' && (
                    <>
                      {/* Filtro por Estado del Proyecto */}
                      <div className="space-y-1 sm:space-y-2">
                        <label className="block text-[10px] sm:text-xs text-white/80 font-medium">
                          Estado del Proyecto
                        </label>
                        <select
                          value={filters.estadoProyecto}
                          onChange={(e) => handleFilterChange('estadoProyecto', e.target.value)}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs bg-white/10 border border-white/20 rounded-lg text-white focus:bg-white/20 focus:border-blue-400/50 focus:outline-none transition-colors"
                        >
                          <option value="" className="bg-gray-800 text-white">Todos los estados</option>
                          <option value="Planificacion" className="bg-gray-800 text-white">Planificación</option>
                          <option value="Ejecucion" className="bg-gray-800 text-white">Ejecución</option>
                          <option value="Completado" className="bg-gray-800 text-white">Completado</option>
                          <option value="Pausado" className="bg-gray-800 text-white">Pausado</option>
                          <option value="Cancelado" className="bg-gray-800 text-white">Cancelado</option>
                        </select>
                      </div>

                      {/* Filtro por Tipo de Proyecto */}
                      <div className="space-y-1 sm:space-y-2">
                        <label className="block text-[10px] sm:text-xs text-white/80 font-medium">
                          Tipo de Proyecto
                        </label>
                        <select
                          value={filters.tipoProyecto}
                          onChange={(e) => handleFilterChange('tipoProyecto', e.target.value)}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 text-[10px] sm:text-xs bg-white/10 border border-white/20 rounded-lg text-white focus:bg-white/20 focus:border-blue-400/50 focus:outline-none transition-colors"
                        >
                          <option value="" className="bg-gray-800 text-white">Todos los tipos</option>
                          <option value="Contrato" className="bg-gray-800 text-white">Contrato</option>
                          <option value="Servicio" className="bg-gray-800 text-white">Servicio</option>
                          <option value="Recibo" className="bg-gray-800 text-white">Recibo</option>
                          <option value="Proyecto" className="bg-gray-800 text-white">Proyecto</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Contenedor Excel ULTRA-RESPONSIVE con Scroll Optimizado */}
              <div className="flex-1 overflow-hidden">
                {/* Indicador de scroll horizontal dinámico */}
                <div className={`${screenSize === 'ultra-small' || screenSize === 'mobile' || screenSize === 'small-tablet' ? 'block' : 'hidden'} bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 text-xs px-2 py-1 text-center border-b border-blue-400/20 animate-pulse`}>
                  {screenSize === 'ultra-small' ? '↔️ Scroll' : '👆 Desliza horizontalmente para ver todas las columnas'}
                </div>
                
                {/* Información de modo ultra-compacto */}
                {(screenSize === 'ultra-small' || screenSize === 'mobile') && (
                  <div className="bg-yellow-500/20 text-yellow-300 text-[10px] px-2 py-1 text-center border-b border-yellow-400/20">
                    🔍 Modo Ultra-Compacto Activado • {Object.keys(getFilteredData()).length} proyectos
                  </div>
                )}
                
                <div 
                  className="h-full overflow-auto excel-scrollbar" 
                  style={{ 
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin', // Firefox: scroll súper delgado como Excel
                    scrollbarColor: '#C0C0C0 #F5F5F5', // Colores sutiles como Excel
                    overscrollBehavior: 'contain'
                  }}
                >
                  <div className="relative" style={{ minWidth: 'max-content' }}>
                    
                    {/* Header de Excel - FORMATO IDÉNTICO AL ORIGINAL */}
                    <div className="sticky top-0 z-30 bg-gray-100 border-b-2 border-gray-400">
                      {/* Fila superior: Banda de secciones (encabezados agrupados) */}
                      <div className="flex">
                        <div style={{width: config.indexWidth, height: '22px'}} className="bg-transparent border-r border-gray-300"></div>
                        {sections.map((section) => (
                          <div
                            key={`band-${section.title}`}
                            className={`flex items-center justify-center border-r border-gray-300 text-sm font-semibold text-white`}
                            style={{
                              width: getSectionWidth(section),
                              background: section.color === 'bg-red-600' ? '#b91c1c' : section.color === 'bg-blue-800' ? '#1e40af' : section.color === 'bg-green-600' ? '#15803d' : '#c2410c',
                              height: '22px'
                            }}
                          >
                            <span className="px-2 text-xs truncate">{section.title}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex">
                        <div 
                          className="bg-gray-200 flex items-center justify-center text-black font-bold border border-gray-400"
                          style={{width: config.indexWidth, height: config.headerHeight}}
                        >
                          #
                        </div>
                        
                        {/* Headers de secciones - EXACTOS COMO EXCEL ORIGINAL */}
                        {sections.map(section => 
                          section.columns.map((column, idx) => (
                            <div 
                              key={column}
                              className={`${section.color} text-white font-bold text-center border border-gray-400 flex items-center justify-center`}
                              style={{
                                width: getColumnWidth(column, config),
                                height: config.headerHeight,
                                minWidth: getColumnWidth(column, config)
                              }}
                            >
                              <span className="text-center text-[8px] leading-tight px-1 font-bold text-white" title={columnLabels[column]}>
                                {columnLabels[column]}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Filas de datos - FORMATO EXCEL ORIGINAL */}
                    <div className="bg-white">
                      {Object.keys(getFilteredData()).map((rowIndex) => (
                        <div key={rowIndex} className="flex hover:bg-gray-50 transition-colors duration-200">
                          {/* Columna índice - ESTILO EXCEL */}
                          <div 
                            className="bg-gray-200 text-black text-center font-semibold border border-gray-400 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors duration-200"
                            style={{width: config.indexWidth, height: config.rowHeight}}
                            onClick={() => handleRowClick(rowIndex)}
                            title={`Hacer clic para abrir ${getFilteredData()[rowIndex]?.nombreProyecto || `Proyecto ${rowIndex}`}`}
                          >
                            {rowIndex}
                          </div>
                          
                          {/* Celdas de datos - ESTILO EXCEL */}
                          {sections.map(section => 
                            section.columns.map(column => (
                              <div 
                                key={column}
                                className="border border-gray-400 bg-white"
                                style={{
                                  width: getColumnWidth(column, config),
                                  height: config.rowHeight,
                                  minWidth: getColumnWidth(column, config)
                                }}
                              >
                                {renderInput(rowIndex, column, getFilteredData()[rowIndex][column])}
                              </div>
                            ))
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Vista de Detalle del Proyecto */
        <div className="flex-1 overflow-hidden">
          <ProyectoDetalle 
            proyecto={(() => {
              const currentTab = tabs.find(tab => tab.id === activeTab);
              return currentTab ? data[currentTab.rowIndex] || {} : {};
            })()}
            onBack={() => setActiveTab('principal')}
            onSave={(summary, fullData) => handleSaveProject(summary, fullData, activeTab)}
            projectNumber={tabs.find(tab => tab.id === activeTab)?.rowIndex || 1}
          />
        </div>
      )}

      {/* Botones de acción móvil - Solo en vista principal */}
      {activeTab === 'principal' && (
        <div className="lg:hidden bg-white/10 backdrop-blur-md border-t border-white/20 p-4 flex space-x-2 justify-center">
          <button 
            onClick={handleAddProject}
            className="bg-green-500/20 px-4 py-2 rounded-lg border border-green-400/30 text-white text-sm flex items-center hover:bg-green-500/30 transition-all duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar
          </button>
          <button 
            onClick={handleOpenDeletePopup}
            className="bg-red-500/20 px-4 py-2 rounded-lg border border-red-400/30 text-white text-sm flex items-center hover:bg-red-500/30 transition-all duration-200"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Eliminar
          </button>
        </div>
      )}

      {/* Popup de Eliminación */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl max-w-md w-full max-h-96 overflow-hidden">
            {/* Header del popup */}
            <div className="bg-white/20 p-4 border-b border-white/20 flex items-center justify-between">
              <h2 className="text-white font-bold text-lg flex items-center">
                <TrashIcon className="h-5 w-5 mr-2 text-red-400" />
                Eliminar Proyectos
              </h2>
              <button
                onClick={handleCloseDeletePopup}
                className="text-white/60 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Lista de filas */}
            <div className="p-4 max-h-64 overflow-y-auto scrollbar-thin">
              <p className="text-white/80 text-sm mb-4">
                Selecciona las filas (proyectos) que deseas eliminar:
              </p>
              
              <div className="space-y-2">
                {Object.entries(data).map(([rowIndex, rowData]) => (
                  <label
                    key={rowIndex}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRowsToDelete.includes(parseInt(rowIndex))}
                      onChange={() => handleToggleRowSelection(parseInt(rowIndex))}
                      className="w-4 h-4 text-red-500 bg-white/10 border-white/30 rounded focus:ring-red-500 focus:ring-2"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        Fila {rowIndex}: {rowData.nombreProyecto || 'Sin nombre'}
                      </div>
                      <div className="text-white/60 text-xs truncate">
                        Cliente: {rowData.nombreCliente || 'Sin cliente'} | Estado: {rowData.estadoProyecto}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              {Object.keys(data).length === 0 && (
                <div className="text-white/60 text-center py-8">
                  No hay proyectos para eliminar
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="bg-white/5 p-4 border-t border-white/20 flex space-x-3">
              <button
                onClick={handleCloseDeletePopup}
                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSelectedRows}
                disabled={selectedRowsToDelete.length === 0}
                className={`flex-1 px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                  selectedRowsToDelete.length === 0
                    ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500/20 text-red-300 border border-red-400/30 hover:bg-red-500/30'
                }`}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Eliminar {selectedRowsToDelete.length > 0 && `(${selectedRowsToDelete.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelGridSimple;