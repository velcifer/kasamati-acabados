// 🚀 KSAMATI - APLICACIÓN PRINCIPAL PARA CPANEL
// Archivo de entrada optimizado para hosting compartido

const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');

// Cargar variables de entorno
require('dotenv').config();

// Importar configuración de base de datos
const { testConnection } = require('./server/config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// 🛡️ MIDDLEWARES DE SEGURIDAD
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 🗜️ COMPRIMIR RESPUESTAS
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

// 🌐 CONFIGURAR CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 📝 PARSEAR DATOS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📊 LOGGING MIDDLEWARE
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// 🔍 RUTA DE SALUD
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    app: 'KSAMATI',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// 📱 RUTAS DE LA API
try {
  app.use('/api/proyectos', require('./server/routes/proyectos'));
  app.use('/api/ventas', require('./server/routes/ventas'));
  app.use('/api/citas', require('./server/routes/citas'));
  app.use('/api/chatbot', require('./server/routes/chatbot'));
  app.use('/api/alertas', require('./server/routes/alertas'));
  
  console.log('✅ Rutas de API cargadas correctamente');
} catch (error) {
  console.error('❌ Error cargando rutas de API:', error.message);
}

// 🎨 SERVIR ARCHIVOS ESTÁTICOS DEL FRONTEND
// En cPanel, los archivos del build de React estarán en la raíz de public_html
app.use(express.static(path.join(__dirname), {
  maxAge: '1d',
  etag: false
}));

// 🎯 RUTA CATCH-ALL PARA REACT ROUTER
// Esto permite que las rutas de React funcionen correctamente
app.get('*', (req, res, next) => {
  // No redirigir las rutas de API
  if (req.url.startsWith('/api/')) {
    return next();
  }
  
  // Servir index.html para todas las demás rutas
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      console.error('Error sirviendo index.html:', err);
      res.status(404).send('Página no encontrada');
    }
  });
});

// 🚨 MANEJO GLOBAL DE ERRORES
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err);
  
  const errorResponse = {
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString()
  };
  
  // En desarrollo, mostrar más detalles del error
  if (process.env.NODE_ENV === 'development') {
    errorResponse.message = err.message;
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// 🔄 MANEJO DE RUTAS NO ENCONTRADAS
app.use((req, res) => {
  console.warn(`[404] Ruta no encontrada: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 🚀 INICIAR SERVIDOR
const server = app.listen(PORT, async () => {
  console.log('\n🚀 ===================================');
  console.log('   KSAMATI - SISTEMA EMPRESARIAL');
  console.log('   ===================================');
  console.log(`📡 Servidor: http://localhost:${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'production'}`);
  console.log(`📅 Iniciado: ${new Date().toLocaleString()}`);
  
  // 🔍 PROBAR CONEXIÓN A BASE DE DATOS
  console.log('\n🔗 Probando conexión a base de datos...');
  const dbConnected = await testConnection();
  
  if (dbConnected) {
    console.log('✅ Base de datos conectada correctamente');
  } else {
    console.log('⚠️ Warning: No se pudo conectar a la base de datos');
    console.log('   La aplicación funcionará con funcionalidad limitada');
  }
  
  console.log('\n🎯 Aplicación lista para usar!');
  console.log('===============================\n');
});

// 🛑 MANEJO GRACEFUL DE SHUTDOWN
process.on('SIGTERM', () => {
  console.log('\n🛑 Recibido SIGTERM, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Recibido SIGINT, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// 💥 MANEJO DE ERRORES NO CAPTURADOS
process.on('uncaughtException', (err) => {
  console.error('💥 Error no capturado:', err);
  console.error('🛑 Cerrando aplicación...');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesa rechazada no manejada:', reason);
  console.error('🔍 En promesa:', promise);
});

module.exports = app;
