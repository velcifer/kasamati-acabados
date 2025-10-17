import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  FolderIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  TableCellsIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const GestorProyectos = () => {
  const navigate = useNavigate();
  const [proyectosData, setProyectosData] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalProyectos: 0,
    totalContratos: 0,
    totalPorCobrar: 0,
    estadisticasPorEstado: []
  });
  const [loading, setLoading] = useState(true);

  // 📱 DETECTAR TAMAÑO DE PANTALLA ULTRA-RESPONSIVE CON ZOOM
  const [screenSize, setScreenSize] = useState('desktop');
  const [forceUpdate, setForceUpdate] = useState(0);
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
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

  useEffect(() => {
    Promise.all([
      fetchProyectosData(),
      fetchEstadisticas()
    ]);
  }, []);

  const fetchProyectosData = async () => {
    try {
      const response = await axios.get('/api/proyectos');
      if (response.data.success) {
        setProyectosData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching proyectos data:', error);
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const response = await axios.get('/api/proyectos/stats/dashboard');
      if (response.data.success) {
        setEstadisticas(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/inicio');
  };

  const handleNavigateToExcel = () => {
    navigate('/proyectos'); // Va al Excel avanzado existente
  };

  const handleCreateProject = () => {
    navigate('/proyectos'); // Va al Excel para crear proyecto
  };

  // 📊 Calcular estadísticas derivadas
  const proyectosEnEjecucion = estadisticas.estadisticasPorEstado.find(e => e.estado_proyecto === 'Ejecucion')?.cantidad || 0;
  const proyectosCompletados = estadisticas.estadisticasPorEstado.find(e => e.estado_proyecto === 'Completado')?.cantidad || 0;
  const proyectosRecibo = estadisticas.estadisticasPorEstado.find(e => e.estado_proyecto === 'Recibo')?.cantidad || 0;

  // 💰 Formatear montos
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const estadisticasCards = [
    {
      title: 'Total Proyectos',
      value: estadisticas.totalProyectos,
      icon: FolderIcon,
      gradient: 'from-blue-500 to-cyan-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-400/30'
    },
    {
      title: 'En Ejecución',
      value: proyectosEnEjecucion,
      icon: ClockIcon,
      gradient: 'from-yellow-500 to-orange-600',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-400/30'
    },
    {
      title: 'Completados',
      value: proyectosCompletados,
      icon: CheckCircleIcon,
      gradient: 'from-green-500 to-emerald-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-400/30'
    },
    {
      title: 'Recibos',
      value: proyectosRecibo,
      icon: DocumentTextIcon,
      gradient: 'from-purple-500 to-violet-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-400/30'
    },
    {
      title: 'Total Contratos',
      value: formatMoney(estadisticas.totalContratos),
      icon: CurrencyDollarIcon,
      gradient: 'from-indigo-500 to-blue-600',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-500/20',
      borderColor: 'border-indigo-400/30',
      isLarge: true
    },
    {
      title: 'Por Cobrar',
      value: formatMoney(estadisticas.totalPorCobrar),
      icon: ExclamationTriangleIcon,
      gradient: 'from-red-500 to-pink-600',
      textColor: 'text-red-600',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-400/30',
      isLarge: true
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden ${
      screenSize === 'ultra-small' ? 'px-2 py-4' : 
      screenSize === 'mobile' ? 'px-3 py-6' : 
      'px-4 sm:px-6 lg:px-8 py-8'
    }`}>
      
      {/* Fondo animado - Ajustado para pantallas pequeñas */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700 ${
          screenSize === 'ultra-small' ? '-top-20 -right-20 w-48 h-48 opacity-40' : 
          screenSize === 'mobile' ? '-top-30 -right-30 w-64 h-64 opacity-50' :
          '-top-40 -right-40 w-96 h-96 opacity-60'
        }`}></div>
        <div className={`absolute bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse ${
          screenSize === 'ultra-small' ? '-bottom-20 -left-20 w-40 h-40 opacity-50' : 
          screenSize === 'mobile' ? '-bottom-30 -left-30 w-60 h-60 opacity-60' :
          '-bottom-40 -left-40 w-80 h-80 opacity-70'
        }`}></div>
        {screenSize !== 'ultra-small' && (
          <div className={`absolute bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse delay-300 ${
            screenSize === 'mobile' ? 'top-1/4 left-1/5 w-48 h-48' : 'top-1/3 left-1/4 w-72 h-72'
          }`}></div>
        )}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header ULTRA-RESPONSIVE */}
        <div className={`flex ${screenSize === 'ultra-small' ? 'flex-col space-y-2' : 'items-center justify-between'} backdrop-blur-sm bg-white/5 rounded-2xl border border-white/20 shadow-2xl ${
          screenSize === 'ultra-small' ? 'p-3 mb-4' : 
          screenSize === 'mobile' ? 'p-4 mb-6' : 
          'p-6 mb-8'
        }`}>
          <button
            onClick={handleGoBack}
            className={`inline-flex items-center text-white/80 hover:text-white transition-all duration-200 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 ${
              screenSize === 'ultra-small' ? 'px-3 py-1.5 text-sm self-start' :
              screenSize === 'mobile' ? 'px-3 py-2' :
              'px-4 py-2'
            }`}
          >
            <ArrowLeftIcon className={screenSize === 'ultra-small' ? 'h-4 w-4 mr-1' : 'h-5 w-5 mr-2'} />
            {screenSize === 'ultra-small' ? 'Inicio' : 'Volver al Inicio'}
          </button>
          
          <h1 className={`font-extrabold text-center bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl ${
            screenSize === 'ultra-small' ? 'text-lg' :
            screenSize === 'mobile' ? 'text-xl' :
            screenSize === 'small-tablet' ? 'text-2xl' :
            'text-3xl sm:text-4xl flex-1'
          }`}>
            {screenSize === 'ultra-small' ? '📊 PROYECTOS' : '📊 DASHBOARD DE PROYECTOS'}
          </h1>
          
          <button
            onClick={handleNavigateToExcel}
            className={`inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${
              screenSize === 'ultra-small' ? 'py-1.5 px-3 text-xs self-end' :
              screenSize === 'mobile' ? 'py-2 px-4 text-sm' :
              'py-3 px-6'
            }`}
          >
            <TableCellsIcon className={screenSize === 'ultra-small' ? 'h-4 w-4' : 'h-5 w-5 mr-2'} />
            {screenSize !== 'ultra-small' && 'Excel Avanzado'}
            {screenSize !== 'ultra-small' && <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />}
          </button>
        </div>

        {/* Estadísticas ULTRA-RESPONSIVE */}
        <div className={`grid mb-8 ${
          screenSize === 'ultra-small' ? 'grid-cols-2 gap-2' :
          screenSize === 'mobile' ? 'grid-cols-2 gap-3' :
          screenSize === 'small-tablet' ? 'grid-cols-2 sm:grid-cols-3 gap-4' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
        }`}>
          {estadisticasCards.map((stat, index) => {
            const IconComponent = stat.icon;
            // En ultra-small, mostrar solo los primeros 4 stats más importantes
            if (screenSize === 'ultra-small' && index > 3) return null;
            
            return (
              <div 
                key={index} 
                className={`backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl hover:bg-white/20 hover:scale-105 transition-all duration-300 animate-fade-in ${
                  stat.isLarge && screenSize !== 'ultra-small' && screenSize !== 'mobile' ? 'sm:col-span-2 lg:col-span-1' : ''
                } ${
                  screenSize === 'ultra-small' ? 'p-2' : 
                  screenSize === 'mobile' ? 'p-3' : 'p-6'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`flex ${screenSize === 'ultra-small' ? 'flex-col items-center text-center' : 'items-center justify-between'}`}>
                  <div className="flex-1">
                    <p className={`text-white/80 font-medium mb-2 ${
                      screenSize === 'ultra-small' ? 'text-[10px]' : 
                      screenSize === 'mobile' ? 'text-xs' : 'text-sm'
                    }`}>
                      {screenSize === 'ultra-small' ? 
                        (stat.title.includes('Total') ? stat.title.replace('Total ', '') : stat.title) : 
                        stat.title
                      }
                    </p>
                    <p className={`font-bold text-white drop-shadow-lg ${
                      screenSize === 'ultra-small' ? 'text-sm' :
                      screenSize === 'mobile' ? 'text-lg' :
                      stat.isLarge ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'
                    }`}>
                      {screenSize === 'ultra-small' && typeof stat.value === 'string' && stat.value.includes('S/') ?
                        stat.value.replace('S/', 'S/').substring(0, 10) + '...' :
                        stat.value
                      }
                    </p>
                  </div>
                  {screenSize !== 'ultra-small' && (
                    <div className={`rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg ${
                      screenSize === 'mobile' ? 'p-2' : 'p-4'
                    }`}>
                      <IconComponent className={`text-white drop-shadow-lg ${
                        screenSize === 'mobile' ? 'h-6 w-6' : 'h-8 w-8'
                      }`} />
                    </div>
                  )}
                </div>
                
                {/* Indicador de progreso visual - Solo en pantallas no ultra-small */}
                {screenSize !== 'ultra-small' && (
                  <div className={`bg-white/10 rounded-full overflow-hidden ${
                    screenSize === 'mobile' ? 'mt-2 h-1' : 'mt-4 h-2'
                  }`}>
                    <div 
                      className={`h-full bg-gradient-to-r ${stat.gradient} transition-all duration-1000 ease-out`}
                      style={{ 
                        width: stat.isLarge ? '100%' : `${Math.min(100, (typeof stat.value === 'number' ? stat.value : 0) * 10)}%` 
                      }}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contenido Principal ULTRA-RESPONSIVE */}
        <div className={`grid gap-8 ${
          screenSize === 'ultra-small' || screenSize === 'mobile' ? 'grid-cols-1' : 
          'grid-cols-1 xl:grid-cols-3'
        }`}>
          
          {/* Acciones Principales */}
          <div className={screenSize !== 'ultra-small' && screenSize !== 'mobile' ? 'xl:col-span-2' : ''}>
            <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              <div className={`bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 ${
                screenSize === 'ultra-small' ? 'p-3' : 
                screenSize === 'mobile' ? 'p-4' : 'p-6'
              }`}>
                <h2 className={`font-bold text-white flex items-center ${
                  screenSize === 'ultra-small' ? 'text-lg' :
                  screenSize === 'mobile' ? 'text-xl' : 'text-2xl'
                }`}>
                  <ChartBarIcon className={`mr-3 ${
                    screenSize === 'ultra-small' ? 'h-5 w-5' : 'h-6 w-6'
                  }`} />
                  {screenSize === 'ultra-small' ? 'Control' : 'Centro de Control'}
                </h2>
                <p className={`text-white/90 mt-2 ${
                  screenSize === 'ultra-small' ? 'text-xs' : 'text-sm'
                }`}>
                  {screenSize === 'ultra-small' ? 
                    'Gestiona proyectos' : 
                    'Gestiona todos tus proyectos desde aquí'
                  }
                </p>
              </div>
              
              <div className={`grid gap-6 ${
                screenSize === 'ultra-small' ? 'p-3 grid-cols-1 gap-3' :
                screenSize === 'mobile' ? 'p-4 grid-cols-1 gap-4' : 
                'p-6 grid-cols-1 sm:grid-cols-2'
              }`}>
                
                {/* Excel Avanzado */}
                <button
                  onClick={handleNavigateToExcel}
                  className={`group relative backdrop-blur-md bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl border border-green-400/30 hover:bg-green-500/30 transition-all duration-300 hover:scale-105 shadow-lg ${
                    screenSize === 'ultra-small' ? 'p-3' :
                    screenSize === 'mobile' ? 'p-4' : 'p-6'
                  }`}
                >
                  {screenSize !== 'ultra-small' && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowTopRightOnSquareIcon className="h-5 w-5 text-green-400" />
                    </div>
                  )}
                  <TableCellsIcon className={`text-green-400 mb-4 ${
                    screenSize === 'ultra-small' ? 'h-8 w-8' :
                    screenSize === 'mobile' ? 'h-10 w-10' : 'h-12 w-12'
                  }`} />
                  <h3 className={`font-bold text-white mb-2 ${
                    screenSize === 'ultra-small' ? 'text-sm' :
                    screenSize === 'mobile' ? 'text-base' : 'text-lg'
                  }`}>
                    {screenSize === 'ultra-small' ? 'Excel' : 'Excel de Proyectos'}
                  </h3>
                  <p className={`text-white/80 mb-4 ${
                    screenSize === 'ultra-small' ? 'text-xs' : 'text-sm'
                  }`}>
                    {screenSize === 'ultra-small' ? 
                      'Vista completa avanzada' : 
                      'Vista completa con 20+ columnas, fórmulas automáticas y gestión avanzada'
                    }
                  </p>
                  <div className={`flex items-center text-green-400 font-medium ${
                    screenSize === 'ultra-small' ? 'text-xs' : 'text-sm'
                  }`}>
                    <span>
                      {screenSize === 'ultra-small' ? 'Abrir' : 'Abrir Excel Avanzado'}
                    </span>
                    <ArrowTopRightOnSquareIcon className={`ml-2 group-hover:translate-x-1 transition-transform duration-300 ${
                      screenSize === 'ultra-small' ? 'h-3 w-3' : 'h-4 w-4'
                    }`} />
                  </div>
                </button>

                {/* Crear Proyecto */}
                <button
                  onClick={handleCreateProject}
                  className={`group relative backdrop-blur-md bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-xl border border-blue-400/30 hover:bg-blue-500/30 transition-all duration-300 hover:scale-105 shadow-lg ${
                    screenSize === 'ultra-small' ? 'p-3' :
                    screenSize === 'mobile' ? 'p-4' : 'p-6'
                  }`}
                >
                  <PlusIcon className={`text-blue-400 mb-4 ${
                    screenSize === 'ultra-small' ? 'h-8 w-8' :
                    screenSize === 'mobile' ? 'h-10 w-10' : 'h-12 w-12'
                  }`} />
                  <h3 className={`font-bold text-white mb-2 ${
                    screenSize === 'ultra-small' ? 'text-sm' :
                    screenSize === 'mobile' ? 'text-base' : 'text-lg'
                  }`}>
                    {screenSize === 'ultra-small' ? 'Crear' : 'Nuevo Proyecto'}
                  </h3>
                  <p className={`text-white/80 mb-4 ${
                    screenSize === 'ultra-small' ? 'text-xs' : 'text-sm'
                  }`}>
                    {screenSize === 'ultra-small' ? 
                      'Nuevo proyecto' : 
                      'Crea un proyecto con plantillas predefinidas y categorías automáticas'
                    }
                  </p>
                  <div className={`flex items-center text-blue-400 font-medium ${
                    screenSize === 'ultra-small' ? 'text-xs' : 'text-sm'
                  }`}>
                    <span>
                      {screenSize === 'ultra-small' ? 'Crear' : 'Crear Proyecto'}
                    </span>
                    <PlusIcon className={`ml-2 group-hover:rotate-90 transition-transform duration-300 ${
                      screenSize === 'ultra-small' ? 'h-3 w-3' : 'h-4 w-4'
                    }`} />
                  </div>
                </button>

                {/* Reportes */}
                <button className="group relative backdrop-blur-md bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-xl border border-purple-400/30 p-6 hover:bg-purple-500/30 transition-all duration-300 hover:scale-105 shadow-lg">
                  <ChartBarIcon className="h-12 w-12 text-purple-400 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Análisis y Reportes</h3>
                  <p className="text-white/80 text-sm mb-4">Visualiza tendencias, rentabilidad y métricas de rendimiento</p>
                  <div className="flex items-center text-purple-400 text-sm font-medium">
                    <span>Ver Reportes</span>
                    <ChartBarIcon className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </button>

                {/* Gestión de Tareas */}
                <button className="group relative backdrop-blur-md bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-xl border border-orange-400/30 p-6 hover:bg-orange-500/30 transition-all duration-300 hover:scale-105 shadow-lg">
                  <ClipboardDocumentListIcon className="h-12 w-12 text-orange-400 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Gestión de Tareas</h3>
                  <p className="text-white/80 text-sm mb-4">Administra pendientes, fechas límite y seguimiento de avances</p>
                  <div className="flex items-center text-orange-400 text-sm font-medium">
                    <span>Gestionar Tareas</span>
                    <ClipboardDocumentListIcon className="h-4 w-4 ml-2 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                </button>
                
              </div>
            </div>
          </div>

          {/* Proyectos Recientes */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <FolderIcon className="h-5 w-5 mr-3" />
                Proyectos Recientes
              </h2>
            </div>
            
            <div className="p-6">
              {proyectosData.length === 0 ? (
                <div className="text-center py-8">
                  <FolderIcon className="mx-auto h-12 w-12 text-white/40 mb-4" />
                  <p className="text-white/60 mb-4">No hay proyectos todavía</p>
                  <button
                    onClick={handleCreateProject}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Crear Primer Proyecto
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/30">
                  {proyectosData.slice(0, 10).map((proyecto, index) => (
                    <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-white truncate">{proyecto.nombre_proyecto}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          proyecto.estado_proyecto === 'Completado' ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
                          proyecto.estado_proyecto === 'Ejecucion' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                          'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                        }`}>
                          {proyecto.estado_proyecto}
                        </span>
                      </div>
                      <p className="text-sm text-white/70 mb-2">{proyecto.nombre_cliente || 'Sin cliente'}</p>
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span>#{proyecto.numero_proyecto}</span>
                        <span>{proyecto.montoContrato}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Footer con información adicional */}
        <div className="mt-12 text-center">
          <div className="backdrop-blur-md bg-white/5 rounded-2xl p-6 border border-white/20 shadow-2xl max-w-4xl mx-auto">
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4 drop-shadow-lg">
              Sistema de Proyectos KSAMATI
            </h2>
            <p className="text-white/80 text-lg drop-shadow-md mb-4">
              Gestiona proyectos con <strong>fórmulas automáticas</strong>, <strong>24 categorías de proveedores</strong>, y <strong>análisis financiero completo</strong>
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/70">
              <div className="flex items-center justify-center">
                <TableCellsIcon className="h-4 w-4 mr-2 text-green-400" />
                <span>Excel con 20+ columnas</span>
              </div>
              <div className="flex items-center justify-center">
                <CurrencyDollarIcon className="h-4 w-4 mr-2 text-blue-400" />
                <span>Cálculos automáticos</span>
              </div>
              <div className="flex items-center justify-center">
                <ChartBarIcon className="h-4 w-4 mr-2 text-purple-400" />
                <span>Reportes en tiempo real</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestorProyectos;

