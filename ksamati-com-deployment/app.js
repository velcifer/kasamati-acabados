// 🚀 KSAMATI.COM - APLICACIÓN PRINCIPAL
const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🛡️ Seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(compression());

// 🌐 CORS para ksamati.com
app.use(cors({
  origin: ['https://ksamati.com', 'https://www.ksamati.com'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🔍 Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    domain: 'ksamati.com',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// 📱 Rutas API
app.use('/api/proyectos', require('./server/routes/proyectos'));
app.use('/api/ventas', require('./server/routes/ventas'));
app.use('/api/citas', require('./server/routes/citas'));
app.use('/api/chatbot', require('./server/routes/chatbot'));
app.use('/api/alertas', require('./server/routes/alertas'));

// 🎨 Servir archivos estáticos
app.use(express.static(__dirname, { maxAge: '1d' }));

// 🎯 React Router
app.get('*', (req, res) => {
  if (!req.url.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log('🎉 KSAMATI ejecutándose en ksamati.com');
  console.log(`🌐 Puerto: ${PORT}`);
});

module.exports = app;