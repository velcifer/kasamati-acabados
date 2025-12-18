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
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-dominio.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor KSAMATI ejecutándose en puerto ${PORT}`);
  console.log(`📱 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
