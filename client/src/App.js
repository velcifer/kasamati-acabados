import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

// ⚡ Carga inmediata solo de componentes críticos
import WelcomeScreen from './components/WelcomeScreen';

// 🚀 Lazy loading también de componentes que usan servicios pesados
const FloatingChatbot = lazy(() => import('./components/FloatingChatbot'));
const SyncIndicator = lazy(() => import('./components/SyncIndicator'));

// 🚀 Lazy loading de componentes pesados (se cargan solo cuando se necesitan)
const HomeScreen = lazy(() => import('./components/HomeScreen'));
const GestorVentas = lazy(() => import('./components/modules/GestorVentas'));
const GestorProyectos = lazy(() => import('./components/modules/GestorProyectos'));
const ExcelGridSimple = lazy(() => import('./components/modules/ExcelGridSimple'));
const Alertas = lazy(() => import('./components/modules/Alertas'));
const AgendarCitas = lazy(() => import('./components/modules/AgendarCitas'));
const Chatbot = lazy(() => import('./components/modules/Chatbot'));
const PublicLanding = lazy(() => import('./components/PublicLanding'));

function AppContent() {
  const location = useLocation();
  
  // 🚫 Rutas donde NO se muestra el chatbot flotante
  const routesWithoutChatbot = ['/', '/inicio', '/proyectos', '/ventas'];
  const shouldShowChatbot = !routesWithoutChatbot.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white text-lg">Cargando...</div>
        </div>
      }>
        <Routes>
          {/* Ruta pública de demostración */}
          <Route path="/public" element={<PublicLanding />} />
          <Route path="/" element={<WelcomeScreen />} />
          {/* Rutas protegidas: envolvemos en RequireAuth sencillo */}
          <Route path="/inicio" element={<RequireAuth><HomeScreen /></RequireAuth>} />
          <Route path="/ventas" element={<RequireAuth><GestorVentas /></RequireAuth>} />
          <Route path="/proyectos" element={<RequireAuth><ExcelGridSimple /></RequireAuth>} />
          <Route path="/proyectos-dashboard" element={<RequireAuth><GestorProyectos /></RequireAuth>} />
          <Route path="/alertas" element={<RequireAuth><Alertas /></RequireAuth>} />
          <Route path="/citas" element={<RequireAuth><AgendarCitas /></RequireAuth>} />
          <Route path="/chatbot" element={<RequireAuth><Chatbot /></RequireAuth>} />
        </Routes>
      </Suspense>
      
      {/* 🤖 Chatbot flotante - Oculto en vista crear proyecto */}
      {shouldShowChatbot && (
        <Suspense fallback={null}>
          <FloatingChatbot />
        </Suspense>
      )}

      {/* 🔄 Indicador de sincronización - Mostrar en rutas protegidas */}
      {location.pathname !== '/' && (
        <Suspense fallback={null}>
          <SyncIndicator />
        </Suspense>
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

// Wrapper mínimo para proteger rutas
function RequireAuth({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) {
    // Si no hay usuario, redirigir a la landing pública o login
    return <Navigate to="/" replace />;
  }
  return children;
}

export default App;
