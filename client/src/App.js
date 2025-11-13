import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import WelcomeScreen from './components/WelcomeScreen';
import HomeScreen from './components/HomeScreen';
import GestorVentas from './components/modules/GestorVentas';
import GestorProyectos from './components/modules/GestorProyectos';
import ExcelGridSimple from './components/modules/ExcelGridSimple';
import Alertas from './components/modules/Alertas';
import AgendarCitas from './components/modules/AgendarCitas';
import Chatbot from './components/modules/Chatbot';
import FloatingChatbot from './components/FloatingChatbot';
import PublicLanding from './components/PublicLanding';
import { Navigate } from 'react-router-dom';

function AppContent() {
  const location = useLocation();
  
  // 🚫 Rutas donde NO se muestra el chatbot flotante
  const routesWithoutChatbot = ['/', '/proyectos'];
  const shouldShowChatbot = !routesWithoutChatbot.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
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
      
      {/* 🤖 Chatbot flotante - Oculto en vista crear proyecto */}
      {shouldShowChatbot && <FloatingChatbot />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
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
