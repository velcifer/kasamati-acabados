const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// 🗄️ Importar configuración de base de datos
const { testConnection, getDatabaseStats } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de seguridad
app.use(helmet());
app.use(compression());

// Configuración CORS
// En Vercel, permitir el origen de Vercel y localhost para desarrollo
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      process.env.CORS_ORIGIN || '*'
    ].filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, Postman, etc.) o en desarrollo
    if (!origin || process.env.NODE_ENV === 'development' || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS: Origen no permitido: ${origin}. Permitidos:`, allowedOrigins);
      callback(null, true); // Permitir temporalmente para debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos en producción (solo si NO estamos en Vercel)
// En Vercel, los archivos estáticos se sirven directamente, no a través de Express
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.VERCEL_ENV) {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// 📊 Rutas API con verificación de BD
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    const stats = dbConnected ? await getDatabaseStats() : null;
    
    res.json({
      status: 'OK',
      message: 'Servidor KSAMATI funcionando correctamente',
      database: dbConnected ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString(),
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Error en servidor KSAMATI',
      database: 'Error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rutas para funcionalidades principales
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/proyectos', require('./routes/proyectos'));
app.use('/api/alertas', require('./routes/alertas'));
app.use('/api/citas', require('./routes/citas'));
app.use('/api/chatbot', require('./routes/chatbot'));

// 🔄 Rutas para sincronización offline/online
app.use('/api/sync', require('./routes/sync'));

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// ⚠️ Solo iniciar servidor si NO estamos en Vercel (serverless)
// Vercel maneja el servidor automáticamente
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor KSAMATI ejecutándose en puerto ${PORT}`);
    console.log(`📱 Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
