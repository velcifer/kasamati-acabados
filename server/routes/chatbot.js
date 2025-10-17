const express = require('express');
const router = express.Router();

// GET /api/chatbot - Obtener conversaciones del chatbot
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Módulo de Chatbot',
    data: {
      conversacionesActivas: [],
      historialConversaciones: [],
      estadisticas: {
        totalMensajes: 0,
        conversacionesHoy: 0,
        tiempoPromedioRespuesta: 0
      }
    }
  });
});

// POST /api/chatbot/mensaje - Enviar mensaje al chatbot
router.post('/mensaje', (req, res) => {
  const { mensaje, usuarioId } = req.body;
  
  // Respuestas básicas del chatbot
  const respuestasBasicas = [
    "¡Hola! ¿En qué puedo ayudarte hoy?",
    "Estoy aquí para asistirte con información sobre nuestros servicios.",
    "¿Necesitas ayuda con algún proyecto específico?",
    "Te puedo ayudar con información sobre ventas, proyectos y citas.",
    "¿Hay algo más en lo que pueda asistirte?"
  ];
  
  const respuestaAleatoria = respuestasBasicas[Math.floor(Math.random() * respuestasBasicas.length)];
  
  res.json({
    success: true,
    message: 'Mensaje procesado',
    data: {
      mensajeUsuario: mensaje,
      respuestaBot: respuestaAleatoria,
      timestamp: new Date().toISOString(),
      usuarioId
    }
  });
});

module.exports = router;

