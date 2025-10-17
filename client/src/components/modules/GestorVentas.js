import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  CloudIcon,
  ServerIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import VentaDetalle from './VentaDetalle';
import dataService from '../../services/dataService';
import { useVentasGrid } from '../../hooks/useVentasData';

const GestorVentas = () => {
  const navigate = useNavigate();
  const [selectedCell, setSelectedCell] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // 🎯 USAR HOOK PERSONALIZADO PARA VENTAS
  const { data, updateCell, createNewVenta, deleteVenta, deleteMultipleVentas } = useVentasGrid();
  
  // Sistema de pestañas
  const [activeTab, setActiveTab] = useState('principal');
  const [tabs, setTabs] = useState([]);
  
  // Sistema de eliminación
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedRowsToDelete, setSelectedRowsToDelete] = useState([]);
  
  // 🎛️ Estado para menú lateral colapsible (oculto por defecto en Excel)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // 🔗 Estados de conectividad y carga
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ isOnline: false, source: 'localStorage' });
  const [syncMessage, setSyncMessage] = useState('✅ Ventas cargadas desde localStorage');

  // 📱 DETECTAR TAMAÑO DE PANTALLA ULTRA-RESPONSIVE CON ZOOM
  const [screenSize, setScreenSize] = useState('desktop');
  const [forceUpdate, setForceUpdate] = useState(0);
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024);
      
      // Detección ULTRA-RESPONSIVE para todos los zooms
      if (width < 400) {
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

  // 🔍 Estados para filtros
  const [filters, setFilters] = useState({
    estado: '',
    cliente: '',
    requerimiento: ''
  });

  const handleGoBack = () => {
    navigate('/inicio');
  };

  // 🧮 FUNCIÓN PARA CALCULAR CAMPOS AUTOMÁTICOS EN VENTAS
  const calculateAutomaticFields = (ventaData) => {
    // Convertir string de dinero a número para cálculos
    const parseMoneyValue = (value) => {
      if (!value) return 0;
      if (typeof value === 'number') return value;
      return parseFloat(value.toString().replace(/[$,\/]/g, '')) || 0;
    };

    // Convertir número a formato de dinero
    const formatMoney = (value) => {
      return `$/ ${value.toFixed(2)}`;
    };

    // Extraer valores para cálculo de utilidad
    const requerimiento = ventaData.requerimiento || '';
    const proyecto = ventaData.proyecto || '';
    const estado = ventaData.estado || '';

    // 🧮 FÓRMULAS FINANCIERAS PARA VENTAS
    
    // 1. Calcular utilidad basada en el tipo de requerimiento y estado
    let utilidadCalculada = 0;

    // Detectar montos mencionados en requerimiento o proyecto
    const montoMatch = (requerimiento + ' ' + proyecto).match(/\$[\d,]+|\d+,\d+|\d+\.\d+/g);
    let montoBase = 0;
    
    if (montoMatch) {
      montoBase = parseFloat(montoMatch[0].replace(/[$,]/g, '')) || 0;
    }

    // Calcular utilidad según estado y tipo de requerimiento
    if (estado === 'Facturado') {
      utilidadCalculada = montoBase * 0.25; // 25% si ya está facturado
    } else if (estado === 'Aprobado') {
      utilidadCalculada = montoBase * 0.20; // 20% si está aprobado
    } else if (estado === 'Enviado') {
      utilidadCalculada = montoBase * 0.15; // 15% estimado si está enviado
    } else if (estado === 'Cotizando') {
      // Calcular según tipo de servicio
      if (requerimiento.toLowerCase().includes('mobiliario') || requerimiento.toLowerCase().includes('muebles')) {
        utilidadCalculada = montoBase * 0.30; // 30% para mobiliario
      } else if (requerimiento.toLowerCase().includes('oficina') || requerimiento.toLowerCase().includes('corporativo')) {
        utilidadCalculada = montoBase * 0.25; // 25% para oficinas
      } else if (requerimiento.toLowerCase().includes('casa') || requerimiento.toLowerCase().includes('hogar')) {
        utilidadCalculada = montoBase * 0.35; // 35% para casas residenciales
      } else {
        utilidadCalculada = montoBase * 0.20; // 20% por defecto
      }
    }

    // Si no se detectó monto automáticamente, usar valores por defecto según tipo
    if (montoBase === 0) {
      if (requerimiento.toLowerCase().includes('mobiliario')) {
        utilidadCalculada = 2500; // Utilidad promedio para mobiliario
      } else if (requerimiento.toLowerCase().includes('oficina')) {
        utilidadCalculada = 3500; // Utilidad promedio para oficinas
      } else {
        utilidadCalculada = 1500; // Utilidad base
      }
    }

    return {
      ...ventaData,
      // 🧮 FÓRMULA AUTOMÁTICA APLICADA
      utilidad: formatMoney(utilidadCalculada)
    };
  };

  const handleCellChange = (rowIndex, columnKey, value) => {
    console.log('📝 CAMBIO EN CELDA VENTA:', { fila: rowIndex, campo: columnKey, valor: value });
    
    // 🔄 Actualizar usando el nuevo servicio de datos
    updateCell(rowIndex, columnKey, value);
    
    console.log('💾 Auto-guardado activado para venta mediante servicio de datos');
  };

  // Funciones para manejo de pestañas
  const handleAddVenta = async () => {
    try {
      setSyncMessage('Creando nueva venta...');
      
      // Crear nueva venta usando el servicio
      const ventaInfo = createNewVenta();
      
      // Agregar nueva pestaña
      const newTab = {
        id: ventaInfo.tabId,
        name: ventaInfo.name,
        number: ventaInfo.id,
        rowIndex: ventaInfo.id,
        data: ventaInfo.data
      };
      
      setTabs(prev => [...prev, newTab]);
      setActiveTab(newTab.id);
      setSyncMessage(`✅ ${ventaInfo.name} creada exitosamente`);
      
      console.log('✅ Nueva venta creada:', ventaInfo);
    } catch (error) {
      console.error('Error en handleAddVenta:', error);
      setSyncMessage('❌ Error creando venta');
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

  // 👁️ FUNCIÓN PARA ABRIR VENTA EXISTENTE
  const handleOpenVenta = (ventaId) => {
    try {
      setSyncMessage(`Abriendo Venta ${ventaId}...`);
      
      // Verificar si ya existe una pestaña para esta venta
      const existingTab = tabs.find(tab => tab.rowIndex === parseInt(ventaId));
      if (existingTab) {
        setActiveTab(existingTab.id);
        setSyncMessage(`✅ Venta ${ventaId} ya está abierta`);
        return;
      }

      // Obtener datos de la venta del servicio
      const ventaData = data[ventaId];
      if (!ventaData) {
        setSyncMessage(`❌ Venta ${ventaId} no encontrada`);
        return;
      }

      // Crear nueva pestaña
      const newTab = {
        id: `venta-${ventaId}`,
        name: ventaData.proyecto || `Venta ${ventaId}`,
        number: parseInt(ventaId),
        rowIndex: parseInt(ventaId),
        data: ventaData
      };
      
      setTabs(prev => [...prev, newTab]);
      setActiveTab(newTab.id);
      setSyncMessage(`✅ Venta "${newTab.name}" abierta exitosamente`);
      
      console.log('✅ Venta abierta:', newTab);
    } catch (error) {
      console.error('Error en handleOpenVenta:', error);
      setSyncMessage('❌ Error abriendo venta');
    }
  };

  const handleSaveVenta = async (ventaSummary, ventaFullData, tabId) => {
    try {
      setSyncMessage('Guardando venta...');
      
      const currentTab = tabs.find(tab => tab.id === tabId);
      if (currentTab && currentTab.rowIndex) {
        // Actualizar usando el servicio de datos
        Object.keys(ventaSummary).forEach(field => {
          updateCell(currentTab.rowIndex, field, ventaSummary[field]);
        });
        
        // Actualizar datos de la venta en la pestaña
        setTabs(prev => prev.map(tab => 
          tab.id === tabId ? { 
            ...tab, 
            data: { ...tab.data, datosCompletos: ventaFullData },
            name: ventaSummary.proyecto || `Venta ${currentTab.rowIndex}`
          } : tab
        ));
        
        setSyncMessage(`✅ Venta "${ventaSummary.proyecto}" guardada exitosamente`);
        
        console.log(`✅ Venta guardada en fila ${currentTab.rowIndex}:`, ventaSummary);
      }
    } catch (error) {
      console.error('Error en handleSaveVenta:', error);
      setSyncMessage('❌ Error guardando venta');
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
      estado: '',
      cliente: '',
      requerimiento: ''
    });
  };

  // Filtrar datos basado en los filtros aplicados
  const getFilteredData = () => {
    const dataEntries = Object.entries(data);
    
    if (!filters.estado && !filters.cliente && !filters.requerimiento) {
      return data; // Sin filtros, devolver todos los datos
    }

    const filteredEntries = dataEntries.filter(([rowIndex, rowData]) => {
      const matchesEstado = !filters.estado || 
        rowData.estado === filters.estado;
      
      const matchesCliente = !filters.cliente || 
        (rowData.cliente && rowData.cliente.toLowerCase().includes(filters.cliente.toLowerCase()));
      
      const matchesRequerimiento = !filters.requerimiento || 
        (rowData.requerimiento && rowData.requerimiento.toLowerCase().includes(filters.requerimiento.toLowerCase()));

      return matchesEstado && matchesCliente && matchesRequerimiento;
    });

    return Object.fromEntries(filteredEntries);
  };

  const handleToggleRowSelection = (rowIndex) => {
    setSelectedRowsToDelete(prev => {
      if (prev.includes(rowIndex)) {
        return prev.filter(id => id !== rowIndex);
      } else {
        return [...prev, rowIndex];
      }
    });
  };

  const handleDeleteSelectedRows = async () => {
    if (selectedRowsToDelete.length === 0) return;

    try {
      setSyncMessage('Eliminando ventas seleccionadas...');
      
      // Si la pestaña activa va a ser eliminada, volver a Principal
      const activeTabData = tabs.find(tab => tab.id === activeTab);
      if (activeTabData && selectedRowsToDelete.includes(activeTabData.rowIndex)) {
        setActiveTab('principal');
      }
      
      // Eliminar las ventas usando el servicio
      deleteMultipleVentas(selectedRowsToDelete);
      
      // Filtrar tabs eliminados
      const remainingTabs = tabs.filter(tab => 
        !selectedRowsToDelete.includes(tab.rowIndex)
      );
      
      setTabs(remainingTabs);
      
      setSyncMessage(`✅ ${selectedRowsToDelete.length} venta(s) eliminada(s) exitosamente`);
    } catch (error) {
      console.error('Error en handleDeleteSelectedRows:', error);
      setSyncMessage('❌ Error eliminando ventas');
    }

    handleCloseDeletePopup();
  };

  // 🔥 CONFIGURACIÓN ULTRA-RESPONSIVE - FUNCIONA EN CUALQUIER ZOOM/DISPOSITIVO
  const getColumnConfig = () => {
    const totalColumns = 7; // ESTADO, CLIENTE, REQUERIMIENTO, TELEFONO, PROYECTO, UTILIDAD, ACCIONES
    const width = window.innerWidth;
    
    // 🔍 ZOOM ULTRA-REDUCIDO: < 400px - MODO SÚPER COMPACTO
    if (width < 400) {
      return {
        columnWidth: '70px',
        indexWidth: '15px',
        headerHeight: '18px',
        rowHeight: '16px',
        fontSize: 'text-[5px]',
        headerFontSize: 'text-[5px]',
        padding: 'p-0',
        headerPadding: 'px-0 py-0',
        containerWidth: 'auto',
        screenType: 'ultra-small'
      };
    }
    // 📱 MÓVIL/ZOOM MUY REDUCIDO: 400px - 640px - SÚPER COMPACTO
    else if (width < 640) {
      return {
        columnWidth: '85px',
        indexWidth: '18px',
        headerHeight: '20px',
        rowHeight: '18px',
        fontSize: 'text-[6px]',
        headerFontSize: 'text-[6px]',
        padding: 'p-0.5',
        headerPadding: 'px-0.5 py-0',
        containerWidth: 'auto',
        screenType: 'mobile'
      };
    }
    // 📟 ZOOM REDUCIDO: 640px - 800px - MUY COMPACTO
    else if (width < 800) {
      return {
        columnWidth: '95px',
        indexWidth: '20px',
        headerHeight: '22px',
        rowHeight: '20px',
        fontSize: 'text-[7px]',
        headerFontSize: 'text-[7px]',
        padding: 'p-0.5',
        headerPadding: 'px-0.5 py-0.5',
        containerWidth: 'auto',
        screenType: 'small-tablet'
      };
    }
    // 📟 TABLET/ZOOM MEDIO: 800px - 1000px - COMPACTO
    else if (width < 1000) {
      return {
        columnWidth: '105px',
        indexWidth: '22px',
        headerHeight: '24px',
        rowHeight: '22px',
        fontSize: 'text-[8px]',
        headerFontSize: 'text-[8px]',
        padding: 'p-1',
        headerPadding: 'px-1 py-0.5',
        containerWidth: 'auto',
        screenType: 'tablet'
      };
    }
    // 💻 LAPTOP/ZOOM ESTÁNDAR: 1000px - 1300px - EQUILIBRADO
    else if (width < 1300) {
      return {
        columnWidth: '115px',
        indexWidth: '25px',
        headerHeight: '26px',
        rowHeight: '24px',
        fontSize: 'text-[9px]',
        headerFontSize: 'text-[9px]',
        padding: 'p-1',
        headerPadding: 'px-1 py-0.5',
        containerWidth: 'auto',
        screenType: 'laptop'
      };
    }
    // 🖥️ DESKTOP: 1300px - 1700px - CÓMODO
    else if (width < 1700) {
      return {
        columnWidth: '130px',
        indexWidth: '28px',
        headerHeight: '28px',
        rowHeight: '26px',
        fontSize: 'text-[10px]',
        headerFontSize: 'text-[9px]',
        padding: 'p-1.5',
        headerPadding: 'px-1.5 py-1',
        containerWidth: 'auto',
        screenType: 'desktop'
      };
    }
    // 🖥️ DESKTOP GRANDE: > 1700px - ÓPTIMO
    else {
      return {
        columnWidth: '150px',
        indexWidth: '32px',
        headerHeight: '32px',
        rowHeight: '30px',
        fontSize: 'text-xs',
        headerFontSize: 'text-[11px]',
        padding: 'p-2',
        headerPadding: 'px-2 py-1.5',
        containerWidth: 'auto',
        screenType: 'desktop-large'
      };
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
        estado: 'EST',
        cliente: 'CLI',
        requerimiento: 'REQ',
        telefono: 'TEL',
        proyecto: 'PROY',
        utilidad: 'UTIL',
        acciones: 'ACC'
      };
    } else if (isSmall) {
      // COMPACTO: Etiquetas cortas pero legibles
      return {
        estado: 'ESTADO',
        cliente: 'CLIENTE',
        requerimiento: 'REQUERI.',
        telefono: 'TELÉF.',
        proyecto: 'PROYECTO',
        utilidad: 'UTILIDAD',
        acciones: 'ACCIONES'
      };
    } else {
      // NORMAL: Etiquetas completas
      return {
        estado: 'ESTADO',
        cliente: 'CLIENTE',
        requerimiento: 'REQUERIMIENTO',
        telefono: 'TELÉFONO',
        proyecto: 'PROYECTO',
        utilidad: 'UTILIDAD',
        acciones: 'ACCIONES'
      };
    }
  };

  // Recalcular etiquetas dinámicamente cuando cambie el screenSize
  const columnLabels = useMemo(() => getColumnLabels(), [screenSize]);

  // 📊 ESTRUCTURA DE COLUMNAS PARA VENTAS CON ETIQUETAS DINÁMICAS
  const columns = [
    { key: 'estado', title: columnLabels.estado },
    { key: 'cliente', title: columnLabels.cliente },
    { key: 'requerimiento', title: columnLabels.requerimiento },
    { key: 'telefono', title: columnLabels.telefono },
    { key: 'proyecto', title: columnLabels.proyecto },
    { key: 'utilidad', title: columnLabels.utilidad },
    { key: 'acciones', title: columnLabels.acciones }
  ];

  const renderInput = (rowIndex, columnKey, value) => {
    if (columnKey === 'acciones') {
      return (
        <div className="flex items-center justify-center h-full">
          <button
            onClick={() => handleOpenVenta(rowIndex)}
            className="p-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-md border border-blue-400/30 transition-all duration-200 flex items-center justify-center"
            title="Ver/Editar Venta"
          >
            <EyeIcon className="h-3 w-3" />
          </button>
        </div>
      );
    } else if (columnKey === 'estado') {
      return (
        <select
          value={value}
          onChange={(e) => handleCellChange(rowIndex, columnKey, e.target.value)}
          className={`w-full h-full px-1 border-none outline-none ${config.fontSize} bg-transparent text-white focus:bg-white/10 focus:ring-1 focus:ring-white/30`}
        >
          <option value="Cotizando" className="bg-gray-800 text-white">Cotizando</option>
          <option value="Enviado" className="bg-gray-800 text-white">Enviado</option>
          <option value="Aprobado" className="bg-gray-800 text-white">Aprobado</option>
          <option value="Rechazado" className="bg-gray-800 text-white">Rechazado</option>
          <option value="Facturado" className="bg-gray-800 text-white">Facturado</option>
        </select>
      );
    } else {
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleCellChange(rowIndex, columnKey, e.target.value)}
          className={`w-full h-full px-1 border-none outline-none ${config.fontSize} bg-transparent text-white placeholder-white/50 focus:bg-white/10 focus:ring-1 focus:ring-white/30`}
          placeholder={`Ingrese ${columnKey}`}
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
            <p className="text-white font-medium">Cargando ventas...</p>
            <p className="text-white/60 text-sm mt-2">{syncMessage}</p>
          </div>
        </div>
      )}
      
      {/* Header ULTRA-RESPONSIVE */}
      <div className="lg:hidden bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50" style={{
        padding: screenSize === 'ultra-small' ? '8px' : '16px'
      }}>
        <div className="flex items-center justify-between">
          <button
            onClick={handleGoBack}
            className={`flex items-center text-white/80 hover:text-white transition-all duration-200 bg-white/10 rounded-lg border border-white/20 ${
              screenSize === 'ultra-small' ? 'px-2 py-1 text-xs' : 'px-3 py-2'
            }`}
          >
            <ArrowLeftIcon className={screenSize === 'ultra-small' ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'} />
            {screenSize === 'ultra-small' ? 'Inicio' : 'Inicio'}
          </button>
          
          <h1 className={`font-bold text-white ${
            screenSize === 'ultra-small' ? 'text-sm' : 
            screenSize === 'mobile' ? 'text-base' : 'text-lg'
          }`}>
            {screenSize === 'ultra-small' ? 'Ventas' : 'Gestor de Ventas'}
          </h1>
          
          <button
            onClick={handleAddVenta}
            className={`flex items-center bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-400/30 ${
              screenSize === 'ultra-small' ? 'px-2 py-1 text-xs' : 'px-3 py-2'
            }`}
          >
            <PlusIcon className={screenSize === 'ultra-small' ? 'h-3 w-3' : 'h-4 w-4 mr-1'} />
            {screenSize !== 'ultra-small' && 'Agregar'}
          </button>
        </div>

        {/* Barra de acciones móvil - Solo en pantallas no ultra-pequeñas */}
        {screenSize !== 'ultra-small' && (
          <div className="flex space-x-2 mt-4">
            <button 
              onClick={handleOpenDeletePopup}
              className="flex-1 flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 bg-red-500/20 px-3 py-2 rounded-lg border border-red-400/30 hover:bg-red-500/30"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Eliminar Ventas
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* 🎛️ SIDEBAR COLAPSIBLE - Desktop */}
        <div className={`hidden lg:flex transition-all duration-300 ${
          sidebarCollapsed ? 'w-0' : 'w-64'
        } bg-white/10 backdrop-blur-md border-r border-white/20 overflow-hidden flex-col`}>
          <div className="p-6 border-b border-white/20">
            <h2 className="text-xl font-bold text-white mb-2">Gestor de Ventas</h2>
            <p className="text-white/60 text-sm">Sistema de cotizaciones y ventas</p>
          </div>

          <div className="flex-1 p-4 space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full flex items-center text-white/80 hover:text-white transition-all duration-200 bg-white/10 px-4 py-3 rounded-xl border border-white/20"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-3" />
              <span>Regresar a Inicio</span>
            </button>

            <button
              onClick={handleAddVenta}
              className="w-full flex items-center text-white/80 hover:text-white transition-all duration-200 bg-blue-500/20 px-4 py-3 rounded-xl border border-blue-400/30 hover:bg-blue-500/30"
            >
              <PlusIcon className="h-5 w-5 mr-3" />
              <span>Crear Venta</span>
            </button>

            <button 
              onClick={handleOpenDeletePopup}
              className="w-full flex items-center text-white/80 hover:text-white transition-all duration-200 bg-red-500/20 px-4 py-3 rounded-xl border border-red-400/30 hover:bg-red-500/30"
            >
              <TrashIcon className="h-5 w-5 mr-3" />
              <span>Eliminar Ventas</span>
            </button>

            <div className="pt-4 border-t border-white/20">
              <p className="text-white/60 text-xs mb-2">Estadísticas</p>
              <div className="space-y-2">
                <div className="text-xs text-white/80">
                  <span className="block">Total: {Object.keys(data).length} ventas</span>
                  <span className="block">Filtradas: {Object.keys(getFilteredData()).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'principal' ? (
            <>
              {/* Sistema de Pestañas - Estilo Excel */}
              <div className="bg-white/5 border-b border-white/20 px-2 lg:px-6 overflow-x-auto">
                <div className="flex items-end space-x-1 min-w-max">
                  {/* Pestaña Principal */}
                  <button
                    onClick={() => handleTabClick('principal')}
                    className="px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-200 bg-blue-500/30 text-blue-200 border-t border-l border-r border-blue-400/50"
                  >
                    📊 Excel Principal
                  </button>
                  
                  {/* Pestañas de Ventas */}
                  {tabs.map((tab) => (
                    <div key={tab.id} className="flex items-end">
                      <button
                        onClick={() => handleTabClick(tab.id)}
                        className="px-4 py-2 rounded-t-lg text-sm font-medium transition-all duration-200 bg-white/10 text-white/80 hover:bg-white/20 border-t border-l border-r border-white/20 flex items-center"
                      >
                        🛒 {tab.name}
                      </button>
                      <button
                        onClick={() => handleCloseTab(tab.id)}
                        className="ml-1 p-1 text-white/60 hover:text-white/80 hover:bg-red-500/20 rounded transition-all duration-200"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sección de Filtros ULTRA-RESPONSIVE */}
              <div className={`bg-white/10 backdrop-blur-md rounded-lg border border-white/20 mb-4 ${
                screenSize === 'ultra-small' ? 'p-2' : 'p-4'
              }`}>
                {screenSize !== 'ultra-small' && (
                  <div className="flex flex-wrap items-center gap-4 mb-3">
                    {/* 🔹 BOTÓN TOGGLE SIDEBAR - Solo Desktop */}
                    <button
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="hidden lg:flex items-center text-white/80 hover:text-white transition-all duration-200 bg-white/10 px-3 py-2 rounded-lg border border-white/20 hover:bg-white/20"
                      title={sidebarCollapsed ? "Mostrar menú lateral" : "Ocultar menú lateral"}
                    >
                      <span className="text-lg">{sidebarCollapsed ? '☰' : '✕'}</span>
                    </button>
                    
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                      🔍 Filtros de Búsqueda
                    </h3>
                    <button
                      onClick={clearAllFilters}
                      className="text-xs bg-red-500/20 text-red-300 px-3 py-1 rounded-full hover:bg-red-500/30 transition-colors border border-red-500/30"
                    >
                      Limpiar Filtros
                    </button>
                    <div className="text-xs text-white/60">
                      {Object.values(filters).filter(f => f).length > 0 && 
                        `Mostrando ${Object.keys(getFilteredData()).length} de ${Object.keys(data).length} ventas`
                      }
                    </div>
                  </div>
                )}

                {/* Filtros compactos para ultra-small */}
                {screenSize === 'ultra-small' && (
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white text-xs font-medium">🔍 Filtros</div>
                    <button
                      onClick={clearAllFilters}
                      className="text-[10px] bg-red-500/20 text-red-300 px-2 py-1 rounded hover:bg-red-500/30 transition-colors border border-red-500/30"
                    >
                      Limpiar
                    </button>
                  </div>
                )}

                <div className={`grid gap-4 ${
                  screenSize === 'ultra-small' ? 'grid-cols-1 gap-2' : 
                  screenSize === 'mobile' || screenSize === 'small-tablet' ? 'grid-cols-1 md:grid-cols-2' :
                  'grid-cols-1 md:grid-cols-3'
                }`}>
                  {/* Filtro por Estado */}
                  <div className={screenSize === 'ultra-small' ? 'space-y-1' : 'space-y-2'}>
                    <label className={`block text-white/80 font-medium ${
                      screenSize === 'ultra-small' ? 'text-[10px]' : 'text-xs'
                    }`}>
                      Estado
                    </label>
                    <select
                      value={filters.estado}
                      onChange={(e) => handleFilterChange('estado', e.target.value)}
                      className={`w-full bg-white/10 border border-white/20 rounded text-white focus:bg-white/20 focus:border-blue-400/50 focus:outline-none transition-colors ${
                        screenSize === 'ultra-small' ? 'px-2 py-1 text-[9px]' : 'px-3 py-2 text-xs'
                      }`}
                    >
                      <option value="" className="bg-gray-800 text-white">Todos los estados</option>
                      <option value="Cotizando" className="bg-gray-800 text-white">Cotizando</option>
                      <option value="Enviado" className="bg-gray-800 text-white">Enviado</option>
                      <option value="Aprobado" className="bg-gray-800 text-white">Aprobado</option>
                      <option value="Rechazado" className="bg-gray-800 text-white">Rechazado</option>
                      <option value="Facturado" className="bg-gray-800 text-white">Facturado</option>
                    </select>
                  </div>

                  {/* Filtro por Cliente - Solo en pantallas no ultra-small o como segundo filtro */}
                  {(screenSize !== 'ultra-small' || !filters.estado) && (
                    <div className={screenSize === 'ultra-small' ? 'space-y-1' : 'space-y-2'}>
                      <label className={`block text-white/80 font-medium ${
                        screenSize === 'ultra-small' ? 'text-[10px]' : 'text-xs'
                      }`}>
                        Cliente
                      </label>
                      <input
                        type="text"
                        value={filters.cliente}
                        onChange={(e) => handleFilterChange('cliente', e.target.value)}
                        placeholder={screenSize === 'ultra-small' ? 'Cliente...' : 'Buscar por cliente...'}
                        className={`w-full bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:bg-white/20 focus:border-blue-400/50 focus:outline-none transition-colors ${
                          screenSize === 'ultra-small' ? 'px-2 py-1 text-[9px]' : 'px-3 py-2 text-xs'
                        }`}
                      />
                    </div>
                  )}

                  {/* Filtro por Requerimiento - Solo en pantallas normales */}
                  {screenSize !== 'ultra-small' && screenSize !== 'mobile' && (
                    <div className="space-y-2">
                      <label className="block text-xs text-white/80 font-medium">
                        Requerimiento
                      </label>
                      <input
                        type="text"
                        value={filters.requerimiento}
                        onChange={(e) => handleFilterChange('requerimiento', e.target.value)}
                        placeholder="Buscar por requerimiento..."
                        className="w-full px-3 py-2 text-xs bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:bg-white/20 focus:border-blue-400/50 focus:outline-none transition-colors"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Excel Principal de Ventas ULTRA-RESPONSIVE */}
              <div className="flex-1 overflow-hidden">
                {/* Indicador de scroll horizontal dinámico */}
                <div className={`${screenSize === 'ultra-small' || screenSize === 'mobile' || screenSize === 'small-tablet' ? 'block' : 'hidden'} bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 text-xs px-2 py-1 text-center border-b border-purple-400/20 animate-pulse`}>
                  {screenSize === 'ultra-small' ? '↔️ Scroll' : '👆 Desliza horizontalmente para ver todas las columnas'}
                </div>
                
                {/* Información de modo ultra-compacto */}
                {(screenSize === 'ultra-small' || screenSize === 'mobile') && (
                  <div className="bg-orange-500/20 text-orange-300 text-[10px] px-2 py-1 text-center border-b border-orange-400/20">
                    🔍 Modo Ultra-Compacto • {Object.keys(getFilteredData()).length} ventas
                  </div>
                )}
                
                <div 
                  className="h-full overflow-auto scrollbar-thin scrollbar-track-gray-300 scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-600" 
                  style={{ 
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: screenSize === 'ultra-small' || screenSize === 'mobile' ? 'thick' : 'auto',
                    scrollbarColor: '#6B7280 #D1D5DB',
                    overscrollBehavior: 'contain'
                  }}
                >
                  <div className="relative" style={{ minWidth: 'max-content' }}>
                    
                    {/* Header de Excel */}
                    <div className="sticky top-0 z-30 bg-white/20 backdrop-blur-md border-b border-white/30">
                      {/* Espacio para columna índice */}
                      <div className="flex">
                        <div 
                          className="bg-white/10 flex items-center justify-center text-white font-bold text-xs border-r border-white/20"
                          style={{width: config.indexWidth, height: config.headerHeight}}
                        >
                          #
                        </div>
                        
                        {/* Headers de columnas */}
                        {columns.map(column => (
                          <div 
                            key={column.key}
                            className={`text-white font-semibold text-center ${config.fontSize} ${config.padding} flex items-center justify-center border-r border-white/20 bg-blue-600`}
                            style={{
                              width: config.columnWidth,
                              height: config.headerHeight,
                              minWidth: config.columnWidth
                            }}
                          >
                            <span className="truncate px-1" title={column.title}>
                              {column.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Filas de datos */}
                    <div className="bg-transparent">
                      {Object.keys(getFilteredData()).map((rowIndex) => (
                        <div key={rowIndex} className="flex border-b border-white/10 hover:bg-white/5 backdrop-blur-sm transition-colors duration-200">
                          {/* Columna índice */}
                          <div 
                            className={`bg-white/10 text-white text-center font-semibold ${config.fontSize} flex items-center justify-center border-r border-white/20`}
                            style={{width: config.indexWidth, height: config.rowHeight}}
                          >
                            {rowIndex}
                          </div>
                          
                          {/* Celdas de datos */}
                          {columns.map(column => (
                            <div 
                              key={column.key}
                              className="border-r border-white/20 bg-transparent"
                              style={{
                                width: config.columnWidth,
                                height: config.rowHeight,
                                minWidth: config.columnWidth
                              }}
                            >
                              {renderInput(rowIndex, column.key, getFilteredData()[rowIndex][column.key])}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Vista de Detalle de Venta */
            <VentaDetalle
              venta={tabs.find(tab => tab.id === activeTab)?.data || {}}
              ventaNumber={tabs.find(tab => tab.id === activeTab)?.rowIndex || 1}
              onBack={() => setActiveTab('principal')}
              onSave={(ventaSummary, ventaFullData) => handleSaveVenta(ventaSummary, ventaFullData, activeTab)}
            />
          )}
        </div>
      </div>

      {/* Popup de eliminación */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Eliminar Ventas</h3>
            
            <div className="mb-4">
              <p className="text-white/80 text-sm mb-3">Selecciona las ventas que deseas eliminar:</p>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.keys(getFilteredData()).map((rowIndex) => (
                  <label key={rowIndex} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={selectedRowsToDelete.includes(parseInt(rowIndex))}
                      onChange={() => handleToggleRowSelection(parseInt(rowIndex))}
                      className="form-checkbox h-4 w-4 text-blue-500 rounded border-white/30"
                    />
                    <span className="text-white text-sm">
                      Venta {rowIndex}: {getFilteredData()[rowIndex].cliente || getFilteredData()[rowIndex].proyecto}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCloseDeletePopup}
                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200"
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

export default GestorVentas;