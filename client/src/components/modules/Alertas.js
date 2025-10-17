import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  FireIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const Alertas = () => {
  const navigate = useNavigate();
  const [alertasData, setAlertasData] = useState({
    alertasActivas: [],
    alertasLeidas: [],
    estadisticas: {
      totalAlertas: 0,
      alertasImportantes: 0,
      alertasPendientes: 0,
      alertasCriticas: 0,
      alertasInfo: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas'); // todas, criticas, importantes, info
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchAlertasData();
    
    // Auto-refresh cada 30 segundos si está habilitado
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchAlertasData, 30000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  const fetchAlertasData = async () => {
    try {
      const response = await axios.get('/api/alertas');
      if (response.data.success) {
        setAlertasData(response.data.data);
        
        // Reproducir sonido si hay nuevas alertas críticas (solo si está habilitado)
        if (soundEnabled && response.data.data.alertasActivas.some(a => a.tipo === 'critical')) {
          playNotificationSound();
        }
      }
    } catch (error) {
      console.error('Error fetching alertas data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/inicio');
  };

  // 🔊 Reproducir sonido de notificación
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    // Crear un tono de notificación usando Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const marcarComoLeida = async (alertaId) => {
    try {
      await axios.put(`/api/alertas/${alertaId}/leer`);
      // Actualizar el estado local
      fetchAlertasData();
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await axios.put('/api/alertas/leer-todas');
      fetchAlertasData();
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  };

  const getAlertIcon = (tipo) => {
    switch(tipo) {
      case 'critical':
        return FireIcon;
      case 'error':
        return ExclamationTriangleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      case 'success':
        return CheckCircleIcon;
      case 'info':
        return InformationCircleIcon;
      default:
        return BellIcon;
    }
  };

  const getAlertStyles = (tipo) => {
    switch(tipo) {
      case 'critical':
        return {
          border: 'border-red-500/50',
          bg: 'bg-red-500/10',
          text: 'text-red-300',
          icon: 'text-red-400',
          glow: 'shadow-red-500/25',
          pulse: 'animate-pulse'
        };
      case 'error':
        return {
          border: 'border-red-400/40',
          bg: 'bg-red-500/5',
          text: 'text-red-200',
          icon: 'text-red-300',
          glow: 'shadow-red-400/20',
          pulse: ''
        };
      case 'warning':
        return {
          border: 'border-yellow-400/40',
          bg: 'bg-yellow-500/5',
          text: 'text-yellow-200',
          icon: 'text-yellow-300',
          glow: 'shadow-yellow-400/20',
          pulse: ''
        };
      case 'success':
        return {
          border: 'border-green-400/40',
          bg: 'bg-green-500/5',
          text: 'text-green-200',
          icon: 'text-green-300',
          glow: 'shadow-green-400/20',
          pulse: ''
        };
      case 'info':
        return {
          border: 'border-blue-400/40',
          bg: 'bg-blue-500/5',
          text: 'text-blue-200',
          icon: 'text-blue-300',
          glow: 'shadow-blue-400/20',
          pulse: ''
        };
      default:
        return {
          border: 'border-gray-400/40',
          bg: 'bg-gray-500/5',
          text: 'text-gray-200',
          icon: 'text-gray-300',
          glow: 'shadow-gray-400/20',
          pulse: ''
        };
    }
  };

  // Filtrar alertas según el filtro seleccionado
  const getFilteredAlertas = () => {
    if (filter === 'todas') return alertasData.alertasActivas;
    return alertasData.alertasActivas.filter(alerta => alerta.tipo === filter);
  };

  const estadisticasCards = [
    {
      title: 'Total Alertas',
      value: alertasData.estadisticas.totalAlertas,
      icon: BellIcon,
      gradient: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-400/30'
    },
    {
      title: 'Críticas',
      value: alertasData.estadisticas.alertasCriticas || 0,
      icon: FireIcon,
      gradient: 'from-red-500 to-pink-600',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-400/30'
    },
    {
      title: 'Importantes',
      value: alertasData.estadisticas.alertasImportantes,
      icon: ExclamationTriangleIcon,
      gradient: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-400/30'
    },
    {
      title: 'Información',
      value: alertasData.estadisticas.alertasInfo || 0,
      icon: InformationCircleIcon,
      gradient: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-400/30'
    }
  ];

  const filterButtons = [
    { id: 'todas', label: 'Todas', icon: BellIcon },
    { id: 'critical', label: 'Críticas', icon: FireIcon },
    { id: 'error', label: 'Errores', icon: ExclamationTriangleIcon },
    { id: 'warning', label: 'Avisos', icon: ExclamationTriangleIcon },
    { id: 'info', label: 'Info', icon: InformationCircleIcon }
  ];

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white font-medium">Cargando alertas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 px-4 sm:px-6 lg:px-8 py-8 relative overflow-hidden">
      
      {/* Fondo animado */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-red-500 to-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse delay-700"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse delay-300"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Mejorado */}
        <div className="flex items-center justify-between mb-8 backdrop-blur-sm bg-white/5 rounded-2xl p-6 border border-white/20 shadow-2xl">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-white/80 hover:text-white transition-all duration-200 bg-white/10 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/20"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver al Inicio
          </button>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center flex-1 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-2xl">
            🔔 CENTRO DE ALERTAS
          </h1>
          
          <div className="flex items-center space-x-3">
            {/* Control de sonido */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                soundEnabled 
                  ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
              }`}
              title={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
            >
              {soundEnabled ? <SpeakerWaveIcon className="h-4 w-4" /> : <SpeakerXMarkIcon className="h-4 w-4" />}
            </button>
            
            {/* Auto-refresh */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                autoRefresh 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
              }`}
              title={autoRefresh ? 'Auto-refresh activado' : 'Auto-refresh desactivado'}
            >
              <ClockIcon className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Marcar todas como leídas */}
            <button
              onClick={marcarTodasLeidas}
              className="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Leer Todas
            </button>
          </div>
        </div>

        {/* Estadísticas Mejoradas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {estadisticasCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={index} 
                className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 hover:bg-white/20 hover:scale-105 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white/80 text-sm font-medium mb-2">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <IconComponent className="h-8 w-8 text-white drop-shadow-lg" />
                  </div>
                </div>
                
                {/* Indicador de progreso visual */}
                <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${stat.gradient} transition-all duration-1000 ease-out`}
                    style={{ 
                      width: `${Math.min(100, (stat.value || 0) * 20)}%` 
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filtros de Alertas */}
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Cog6ToothIcon className="h-5 w-5 mr-3" />
            Filtros de Alertas
          </h2>
          <div className="flex flex-wrap gap-3">
            {filterButtons.map((btn) => {
              const IconComponent = btn.icon;
              const isActive = filter === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/20'
                  }`}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Alertas Mejorada */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Alertas Activas */}
          <div className="xl:col-span-2 backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <BellIcon className="h-6 w-6 mr-3" />
                Alertas Activas
                <span className="ml-3 bg-white/20 px-2 py-1 rounded-full text-sm">
                  {getFilteredAlertas().length}
                </span>
              </h2>
            </div>
            
            <div className="p-6">
              {getFilteredAlertas().length === 0 ? (
                <div className="text-center py-12">
                  <ShieldCheckIcon className="mx-auto h-16 w-16 text-green-400 mb-4 animate-pulse" />
                  <p className="text-white/80 text-lg mb-2">¡Todo funcionando perfectamente!</p>
                  <p className="text-white/60 text-sm">No hay alertas {filter === 'todas' ? 'activas' : `de tipo "${filter}"`}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/30">
                  {getFilteredAlertas().map((alerta, index) => {
                    const IconComponent = getAlertIcon(alerta.tipo);
                    const styles = getAlertStyles(alerta.tipo);
                    return (
                      <div 
                        key={alerta.id || index} 
                        className={`p-4 rounded-xl border ${styles.border} ${styles.bg} ${styles.glow} ${styles.pulse} hover:scale-105 transition-all duration-300 animate-fade-in shadow-xl`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start">
                          <div className={`p-2 rounded-lg ${styles.bg} mr-4`}>
                            <IconComponent className={`h-6 w-6 ${styles.icon}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-bold ${styles.text} mb-2 text-lg`}>
                              {alerta.titulo}
                            </h3>
                            <p className="text-white/80 text-sm mb-3 leading-relaxed">
                              {alerta.mensaje}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-xs text-white/60">
                                <span>⏰ {alerta.fechaCreacion}</span>
                                <span className={`px-2 py-1 rounded-full ${styles.bg} ${styles.text} font-medium`}>
                                  {alerta.tipo?.toUpperCase()}
                                </span>
                              </div>
                              <button
                                onClick={() => marcarComoLeida(alerta.id)}
                                className="flex items-center px-3 py-1 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-all duration-200 text-sm font-medium border border-green-400/30"
                              >
                                <EyeIcon className="h-3 w-3 mr-1" />
                                Marcar Leída
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Panel Lateral - Configuración y Historial */}
          <div className="space-y-6">
            
            {/* Configuración Inteligente */}
            <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Cog6ToothIcon className="h-5 w-5 mr-2" />
                  Configuración Inteligente
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Notificaciones de Sonido</p>
                    <p className="text-sm text-white/70">Alertas críticas con audio</p>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      soundEnabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Auto-Actualización</p>
                    <p className="text-sm text-white/70">Cada 30 segundos</p>
                  </div>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoRefresh ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={fetchAlertasData}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center"
                  >
                    <BellIcon className="h-4 w-4 mr-2" />
                    Actualizar Ahora
                  </button>
                </div>
              </div>
            </div>

            {/* Historial Reciente */}
            <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Historial Reciente
                </h3>
              </div>
              <div className="p-6">
                {alertasData.alertasLeidas.length === 0 ? (
                  <div className="text-center py-8">
                    <EyeSlashIcon className="mx-auto h-12 w-12 text-white/40 mb-4" />
                    <p className="text-white/60">Sin historial aún</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/30">
                    {alertasData.alertasLeidas.slice(0, 8).map((alerta, index) => (
                      <div key={index} className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200">
                        <CheckCircleIcon className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{alerta.titulo}</p>
                          <p className="text-white/60 text-xs">{alerta.fechaCreacion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* Footer con información del sistema */}
        <div className="mt-12 text-center">
          <div className="backdrop-blur-md bg-white/5 rounded-2xl p-6 border border-white/20 shadow-2xl max-w-4xl mx-auto">
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4 drop-shadow-lg">
              Sistema de Alertas KSAMATI
            </h2>
            <p className="text-white/80 text-lg drop-shadow-md mb-4">
              Monitoreo inteligente con <strong>notificaciones en tiempo real</strong>, <strong>filtros avanzados</strong> y <strong>alertas automáticas</strong>
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/70">
              <div className="flex items-center justify-center">
                <ClockIcon className="h-4 w-4 mr-2 text-blue-400" />
                <span>Tiempo real (30s)</span>
              </div>
              <div className="flex items-center justify-center">
                <BellIcon className="h-4 w-4 mr-2 text-red-400" />
                <span>Alertas inteligentes</span>
              </div>
              <div className="flex items-center justify-center">
                <SpeakerWaveIcon className="h-4 w-4 mr-2 text-green-400" />
                <span>Notificaciones de audio</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alertas;
