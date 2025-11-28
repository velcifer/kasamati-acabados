import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderIcon, 
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const HomeScreen = () => {
  const navigate = useNavigate();

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

  const menuItems = [
    {
      id: 'proyectos',
      title: 'Gestor Proyectos',
      description: 'Gestiona proyectos y tareas',
      icon: FolderIcon,
      gradient: 'from-green-500 to-emerald-600',
      hoverGradient: 'hover:from-green-600 hover:to-emerald-700',
      shadowColor: 'shadow-green-500/25',
      path: '/proyectos'
    }
  ];

  const handleNavigation = (path, event) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(path);
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 ${
      screenSize === 'ultra-small' ? 'px-2 py-4' : 
      screenSize === 'mobile' ? 'px-3 py-6' : 
      'px-4 sm:px-6 lg:px-8 py-8'
    }`}>
      
      {/* Fondo animado ULTRA-RESPONSIVE */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700 ${
          screenSize === 'ultra-small' ? '-top-20 -left-20 w-48 h-48 opacity-40' : 
          screenSize === 'mobile' ? '-top-30 -left-30 w-64 h-64 opacity-50' :
          '-top-40 -left-40 w-96 h-96 opacity-60'
        }`}></div>
        <div className={`absolute bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse ${
          screenSize === 'ultra-small' ? '-bottom-20 -right-20 w-40 h-40 opacity-50' : 
          screenSize === 'mobile' ? '-bottom-30 -right-30 w-60 h-60 opacity-60' :
          '-bottom-40 -right-40 w-80 h-80 opacity-70'
        }`}></div>
        {screenSize !== 'ultra-small' && (
          <>
            <div className={`absolute bg-gradient-to-br from-orange-400 to-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse delay-300 ${
              screenSize === 'mobile' ? 'top-1/4 right-1/5 w-48 h-48' : 'top-1/3 right-1/4 w-72 h-72'
            }`}></div>
            <div className={`absolute bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse delay-1000 ${
              screenSize === 'mobile' ? 'bottom-1/4 left-1/5 w-40 h-40' : 'bottom-1/3 left-1/4 w-64 h-64'
            }`}></div>
          </>
        )}
        
        {/* Partículas flotantes - Solo en pantallas no ultra-small */}
        {screenSize !== 'ultra-small' && (
          <>
            <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full opacity-60 animate-bounce delay-100"></div>
            <div className="absolute top-1/3 right-16 w-3 h-3 bg-cyan-300 rounded-full opacity-50 animate-bounce delay-500"></div>
            <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-pink-400 rounded-full opacity-70 animate-bounce delay-800"></div>
            <div className="absolute top-2/3 right-1/3 w-4 h-4 bg-yellow-300 rounded-full opacity-40 animate-bounce delay-200"></div>
            <div className="absolute bottom-20 right-20 w-3 h-3 bg-purple-400 rounded-full opacity-60 animate-bounce delay-600"></div>
          </>
        )}
        
        {/* Líneas decorativas - Solo en pantallas medianas y grandes */}
        {screenSize !== 'ultra-small' && screenSize !== 'mobile' && (
          <>
            <div className="absolute top-16 right-32 w-28 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 transform rotate-12"></div>
            <div className="absolute bottom-24 left-24 w-32 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent opacity-30 transform -rotate-12"></div>
            <div className="absolute top-1/2 left-16 w-20 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-25 transform rotate-45"></div>
          </>
        )}
      </div>

      {/* Header ULTRA-RESPONSIVE */}
      <div className="max-w-6xl mx-auto relative z-10">
        <div className={`flex items-center justify-between ${
          screenSize === 'ultra-small' ? 'mb-4' : 
          screenSize === 'mobile' ? 'mb-6' : 'mb-8'
        }`}>
          <button
            onClick={handleGoBack}
            className={`inline-flex items-center text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm bg-white/10 rounded-full border border-white/20 hover:bg-white/20 shadow-lg ${
              screenSize === 'ultra-small' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
            }`}
          >
            <ArrowLeftIcon className={`drop-shadow-md ${
              screenSize === 'ultra-small' ? 'h-4 w-4 mr-1' : 'h-5 w-5 mr-2'
            }`} />
            <span className="drop-shadow-md">
              {screenSize === 'ultra-small' ? 'Atrás' : 'Volver'}
            </span>
          </button>
          
          <h1 className={`font-extrabold text-center flex-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-2xl ${
            screenSize === 'ultra-small' ? 'text-xl' :
            screenSize === 'mobile' ? 'text-2xl' :
            screenSize === 'small-tablet' ? 'text-3xl' :
            'text-3xl sm:text-4xl md:text-5xl'
          }`}>
            INICIO
          </h1>
          
          <div className={screenSize === 'ultra-small' ? 'w-8' : 'w-16'}></div> {/* Espaciador para centrar el título */}
        </div>

        {/* Grid de botones del menú ULTRA-RESPONSIVE - Centrado */}
        <div className={`flex justify-center items-center animate-fade-in`}>
          <div className={`grid ${
            screenSize === 'ultra-small' ? 'grid-cols-1 gap-3' :
            screenSize === 'mobile' ? 'grid-cols-1 gap-4' :
            screenSize === 'small-tablet' ? 'grid-cols-1 gap-5' :
            screenSize === 'tablet' ? 'grid-cols-1 gap-5' :
            'grid-cols-1 gap-6'
          }`}>
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            
            return (
              <div
                key={item.id}
                className={`group relative backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl ${item.shadowColor} hover:shadow-xl hover:scale-105 cursor-pointer animate-slide-up transition-all duration-300 hover:bg-white/20 ${
                  screenSize === 'ultra-small' ? 'p-3' :
                  screenSize === 'mobile' ? 'p-4' : 'p-6'
                } ${screenSize !== 'ultra-small' && screenSize !== 'mobile' ? 'max-w-md mx-auto' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={(event) => handleNavigation(item.path, event)}
              >
                {/* Efecto de brillo al hover - Solo en pantallas no ultra-small */}
                {screenSize !== 'ultra-small' && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"></div>
                )}
                
                <div className="text-center relative z-10 pointer-events-none">
                  <div className={`mx-auto bg-gradient-to-br ${item.gradient} ${item.hoverGradient} rounded-2xl flex items-center justify-center shadow-xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                    screenSize === 'ultra-small' ? 'w-12 h-12 mb-3' :
                    screenSize === 'mobile' ? 'w-16 h-16 mb-4' : 'w-20 h-20 mb-6'
                  }`}>
                    <IconComponent className={`text-white drop-shadow-lg ${
                      screenSize === 'ultra-small' ? 'h-6 w-6' :
                      screenSize === 'mobile' ? 'h-8 w-8' : 'h-10 w-10'
                    }`} />
                  </div>
                  
                  <h3 className={`font-bold text-white mb-2 drop-shadow-lg ${
                    screenSize === 'ultra-small' ? 'text-xs' :
                    screenSize === 'mobile' ? 'text-sm' : 'text-lg'
                  }`}>
                    {screenSize === 'ultra-small' ? 
                      item.title.replace('Gestor ', '').replace('Agendar ', '') : 
                      item.title
                    }
                  </h3>
                  
                  {screenSize !== 'ultra-small' && (
                    <p className={`text-white/80 drop-shadow-md ${
                      screenSize === 'mobile' ? 'text-xs' : 'text-sm'
                    }`}>
                      {screenSize === 'mobile' ? 
                        item.description.substring(0, 30) + '...' : 
                        item.description
                      }
                    </p>
                  )}
                </div>

                {/* Partículas decorativas - Solo en pantallas no ultra-small */}
                {screenSize !== 'ultra-small' && (
                  <>
                    <div className="absolute top-2 right-2 w-2 h-2 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 pointer-events-none"></div>
                  </>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-12 text-center">
          <div className="backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20 shadow-2xl max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4 drop-shadow-lg">
              Sistema KSAMATI
            </h2>
            <p className="text-white/80 text-lg drop-shadow-md">
              Plataforma integral para la gestión de tu negocio. 
              Selecciona el módulo que deseas utilizar.
            </p>
            
            {/* Iconos decorativos */}
            <div className="flex justify-center items-center mt-6 space-x-4">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-300"></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-600"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Elementos decorativos adicionales */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Estrellas brillantes */}
        <div className="absolute top-32 right-24 w-1 h-1 bg-white rounded-full opacity-70 animate-ping delay-200"></div>
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-300 rounded-full opacity-60 animate-ping delay-600"></div>
        <div className="absolute bottom-40 right-1/3 w-1 h-1 bg-pink-400 rounded-full opacity-50 animate-ping delay-1000"></div>
        <div className="absolute top-3/4 left-16 w-1 h-1 bg-purple-400 rounded-full opacity-80 animate-ping delay-400"></div>
        
        {/* Círculos decorativos giratorios */}
        <div className="absolute top-24 left-1/3 w-16 h-16 border border-white/10 rounded-full animate-spin" style={{animationDuration: '25s'}}></div>
        <div className="absolute bottom-32 right-1/4 w-12 h-12 border border-cyan-400/20 rounded-full animate-spin" style={{animationDuration: '20s'}}></div>
        <div className="absolute top-1/2 right-12 w-8 h-8 border border-pink-400/15 rounded-full animate-spin" style={{animationDuration: '30s'}}></div>
      </div>
    </div>
  );
};

export default HomeScreen;
