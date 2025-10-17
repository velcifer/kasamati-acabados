import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

const WelcomeScreen = () => {
  const navigate = useNavigate();

  const handleIngresar = () => {
    navigate('/inicio');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      
      {/* Fondo animado con formas geométricas */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse delay-500"></div>
        
        {/* Partículas flotantes */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-white rounded-full opacity-40 animate-bounce"></div>
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-yellow-300 rounded-full opacity-60 animate-bounce delay-200"></div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-pink-400 rounded-full opacity-50 animate-bounce delay-700"></div>
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-cyan-400 rounded-full opacity-40 animate-bounce delay-1000"></div>
        
        {/* Líneas decorativas */}
        <div className="absolute top-20 left-20 w-32 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 transform rotate-45"></div>
        <div className="absolute bottom-20 right-20 w-24 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-40 transform -rotate-45"></div>
      </div>

      {/* Contenedor principal con backdrop blur */}
      <div className="max-w-md w-full space-y-8 animate-fade-in relative z-10 backdrop-blur-sm bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
        
        {/* Logo/Icono decorativo */}
        <div className="text-center">
          <div className="mx-auto h-28 w-28 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 animate-bounce-in animate-float border-2 border-white/30 shadow-2xl animate-glow">
            <SparklesIcon className="h-16 w-16 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Título de bienvenida */}
        <div className="text-center animate-slide-up">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
            ¡Hola Bienvenidos!
          </h1>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-8 drop-shadow-2xl">
            APP KSAMATI
          </h2>
        </div>

        {/* Botón Ingresar */}
        <div className="text-center">
          <button
            onClick={handleIngresar}
            className="group relative w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white font-bold text-lg py-4 px-12 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-pink-500/25 border-2 border-white/20 backdrop-blur-sm"
          >
            <span className="mr-3 drop-shadow-md">INGRESAR</span>
            <ArrowRightIcon className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300 drop-shadow-md" />
            
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </button>
        </div>

        {/* Descripción adicional */}
        <div className="text-center mt-8">
          <p className="text-sm sm:text-base text-white/80 max-w-xs mx-auto drop-shadow-md">
            Sistema integral de gestión para tu negocio
          </p>
        </div>
      </div>

      {/* Footer con derechos */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-xs sm:text-sm text-white/60 drop-shadow-md backdrop-blur-sm bg-black/10 rounded-full px-4 py-2 inline-block border border-white/10">
          © {new Date().getFullYear()} - Todos los Derechos Reservados
        </p>
      </div>

      {/* Elementos decorativos adicionales */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Estrellas brillantes */}
        <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full opacity-60 animate-ping"></div>
        <div className="absolute top-32 right-20 w-1 h-1 bg-pink-400 rounded-full opacity-70 animate-ping delay-300"></div>
        <div className="absolute bottom-32 left-16 w-1 h-1 bg-cyan-400 rounded-full opacity-50 animate-ping delay-700"></div>
        <div className="absolute top-48 left-1/2 w-1 h-1 bg-yellow-400 rounded-full opacity-80 animate-ping delay-1000"></div>
        
        {/* Círculos decorativos adicionales */}
        <div className="absolute top-16 right-1/3 w-20 h-20 border border-white/10 rounded-full animate-spin" style={{animationDuration: '20s'}}></div>
        <div className="absolute bottom-16 left-1/4 w-16 h-16 border border-purple-400/20 rounded-full animate-spin" style={{animationDuration: '15s'}}></div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
