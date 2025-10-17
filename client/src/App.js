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

function AppContent() {
  const location = useLocation();
  
  // 🚫 Rutas donde NO se muestra el chatbot flotante
  const routesWithoutChatbot = ['/', '/proyectos'];
  const shouldShowChatbot = !routesWithoutChatbot.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/inicio" element={<HomeScreen />} />
        <Route path="/ventas" element={<GestorVentas />} />
        <Route path="/proyectos" element={<ExcelGridSimple />} />
        <Route path="/proyectos-dashboard" element={<GestorProyectos />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/citas" element={<AgendarCitas />} />
        <Route path="/chatbot" element={<Chatbot />} />
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

export default App;
