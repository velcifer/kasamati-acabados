import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const AgendarCitas = () => {
  const navigate = useNavigate();
  const [citasData, setCitasData] = useState({
    citasHoy: [],
    citasSemana: [],
    citasPendientes: [],
    estadisticas: {
      totalCitas: 0,
      citasConfirmadas: 0,
      citasPendientes: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [fechaCalendario, setFechaCalendario] = useState(new Date());
  const [nuevaCita, setNuevaCita] = useState({
    cliente: '',
    fecha: '',
    hora: '',
    servicio: '',
    notas: ''
  });

  useEffect(() => {
    fetchCitasData();
  }, []);

  const fetchCitasData = async () => {
    try {
      const response = await axios.get('/api/citas');
      setCitasData(response.data.data);
    } catch (error) {
      console.error('Error fetching citas data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/inicio');
  };

  const confirmarCita = async (citaId) => {
    try {
      await axios.put(`/api/citas/${citaId}/confirmar`);
      fetchCitasData();
    } catch (error) {
      console.error('Error confirming appointment:', error);
    }
  };

  const crearCita = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/citas', nuevaCita);
      setNuevaCita({
        cliente: '',
        fecha: '',
        hora: '',
        servicio: '',
        notas: ''
      });
      setMostrarFormulario(false);
      fetchCitasData();
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  // Funciones del calendario
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Días del mes anterior (espacios vacíos)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(fechaCalendario);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setFechaCalendario(newDate);
  };

  const getCitasForDay = (day) => {
    if (!day) return [];
    
    const dateStr = `${fechaCalendario.getFullYear()}-${String(fechaCalendario.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Combinar todas las citas
    const todasLasCitas = [...citasData.citasHoy, ...citasData.citasSemana, ...citasData.citasPendientes];
    
    return todasLasCitas.filter(cita => cita.fecha === dateStr);
  };

  const abrirFormularioConFecha = (day) => {
    if (!day) return;
    
    const dateStr = `${fechaCalendario.getFullYear()}-${String(fechaCalendario.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setNuevaCita({
      ...nuevaCita,
      fecha: dateStr
    });
    setMostrarFormulario(true);
    setMostrarCalendario(false);
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const estadisticasCards = [
    {
      title: 'Total Citas',
      value: citasData.estadisticas.totalCitas,
      icon: CalendarIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Confirmadas',
      value: citasData.estadisticas.citasConfirmadas,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Pendientes',
      value: citasData.estadisticas.citasPendientes,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleGoBack}
            className="btn-primary inline-flex items-center"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver al Inicio
          </button>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient flex-1 text-center">
            Agendar Citas
          </h1>
          
          <button 
            onClick={() => setMostrarFormulario(true)}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Cita
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {estadisticasCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="card animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color} mr-4`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.textColor}`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Citas de hoy */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Citas de Hoy</h2>
            
            {citasData.citasHoy.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No hay citas programadas para hoy</p>
                <button 
                  onClick={() => setMostrarFormulario(true)}
                  className="btn-primary mt-4"
                >
                  Agendar Primera Cita
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {citasData.citasHoy.map((cita, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <h3 className="font-medium text-gray-900">{cita.cliente}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cita.estado === 'confirmada' ? 'bg-green-100 text-green-800' :
                        cita.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cita.estado}
                      </span>
                    </div>
                    
                    <div className="flex items-center mb-2">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{cita.hora}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{cita.servicio}</p>
                    
                    {cita.estado === 'pendiente' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => confirmarCita(cita.id)}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          Confirmar
                        </button>
                        <button className="btn-secondary text-xs py-1 px-3">
                          Reprogramar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            {/* Citas próximas */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Próximas Citas</h2>
              {citasData.citasSemana.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay citas programadas</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {citasData.citasSemana.slice(0, 5).map((cita, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{cita.cliente}</p>
                        <p className="text-sm text-gray-500">{cita.fecha} - {cita.hora}</p>
                      </div>
                      <span className={`w-3 h-3 rounded-full ${
                        cita.estado === 'confirmada' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Acciones rápidas */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => setMostrarFormulario(true)}
                  className="w-full btn-secondary text-left"
                >
                  <div className="flex items-center">
                    <PlusIcon className="h-5 w-5 mr-3" />
                    <div>
                      <p className="font-medium">Agendar Cita</p>
                      <p className="text-sm text-gray-500">Programar nueva cita</p>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={() => setMostrarCalendario(true)}
                  className="w-full btn-secondary text-left"
                >
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-3" />
                    <div>
                      <p className="font-medium">Ver Calendario</p>
                      <p className="text-sm text-gray-500">Vista mensual completa</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de nueva cita */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Nueva Cita</h3>
                <button
                  onClick={() => setMostrarFormulario(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={crearCita} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <input
                    type="text"
                    className="input-field"
                    value={nuevaCita.cliente}
                    onChange={(e) => setNuevaCita({...nuevaCita, cliente: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    className="input-field"
                    value={nuevaCita.fecha}
                    onChange={(e) => setNuevaCita({...nuevaCita, fecha: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                  <input
                    type="time"
                    className="input-field"
                    value={nuevaCita.hora}
                    onChange={(e) => setNuevaCita({...nuevaCita, hora: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                  <select
                    className="input-field"
                    value={nuevaCita.servicio}
                    onChange={(e) => setNuevaCita({...nuevaCita, servicio: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar servicio</option>
                    <option value="consulta">Consulta</option>
                    <option value="reunion">Reunión</option>
                    <option value="presentacion">Presentación</option>
                    <option value="seguimiento">Seguimiento</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                  <textarea
                    className="input-field"
                    rows="3"
                    value={nuevaCita.notas}
                    onChange={(e) => setNuevaCita({...nuevaCita, notas: e.target.value})}
                  ></textarea>
                </div>
                
                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary flex-1">
                    Agendar Cita
                  </button>
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal del calendario */}
        {mostrarCalendario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Calendario de Citas</h3>
                <button
                  onClick={() => setMostrarCalendario(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Header del calendario */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
                </button>
                
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {formatMonthYear(fechaCalendario)}
                </h2>
                
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronRightIcon className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                  <div key={day} className="p-3 text-center font-medium text-gray-500 bg-gray-50 rounded-lg">
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(fechaCalendario).map((day, index) => {
                  const citasDelDia = getCitasForDay(day);
                  const esHoy = day && 
                    fechaCalendario.getFullYear() === new Date().getFullYear() &&
                    fechaCalendario.getMonth() === new Date().getMonth() &&
                    day === new Date().getDate();

                  return (
                    <div
                      key={index}
                      className={`min-h-[80px] p-2 rounded-lg border transition-all duration-200 ${
                        day 
                          ? 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer' 
                          : 'bg-gray-50 border-transparent'
                      } ${esHoy ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-200' : ''}`}
                      onClick={() => abrirFormularioConFecha(day)}
                    >
                      {day && (
                        <>
                          <div className={`text-sm font-medium mb-1 ${esHoy ? 'text-blue-700' : 'text-gray-900'}`}>
                            {day}
                          </div>
                          
                          {/* Citas del día */}
                          <div className="space-y-1">
                            {citasDelDia.slice(0, 3).map((cita, citaIndex) => (
                              <div
                                key={citaIndex}
                                className={`text-xs p-1 rounded truncate ${
                                  cita.estado === 'confirmada' 
                                    ? 'bg-green-100 text-green-800' 
                                    : cita.estado === 'pendiente'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                                title={`${cita.hora} - ${cita.cliente} - ${cita.servicio}`}
                              >
                                {cita.hora} {cita.cliente}
                              </div>
                            ))}
                            
                            {/* Indicador de más citas */}
                            {citasDelDia.length > 3 && (
                              <div className="text-xs text-blue-600 font-medium">
                                +{citasDelDia.length - 3} más
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Leyenda */}
              <div className="flex items-center justify-center mt-6 space-x-6 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
                  <span className="text-gray-600">Hoy</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
                  <span className="text-gray-600">Confirmadas</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-100 rounded mr-2"></div>
                  <span className="text-gray-600">Pendientes</span>
                </div>
              </div>

              {/* Acciones del calendario */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => {
                    setMostrarCalendario(false);
                    setMostrarFormulario(true);
                  }}
                  className="btn-primary inline-flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nueva Cita
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendarCitas;
