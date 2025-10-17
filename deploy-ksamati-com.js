#!/usr/bin/env node

// 🚀 DEPLOYMENT AUTOMÁTICO PARA KSAMATI.COM
// Este script prepara todo para deployar en ksamati.com

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('\n🚀 =====================================');
console.log('   DEPLOYMENT KSAMATI.COM');
console.log('   =====================================\n');

// 📁 Crear directorio específico para ksamati.com
const deployDir = './ksamati-com-deployment';

console.log('📁 Preparando deployment para ksamati.com...');
if (fs.existsSync(deployDir)) {
  console.log('   ⚠️ Directorio existe, limpiando...');
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });
console.log('   ✅ Directorio creado: ' + deployDir);

// 📦 Build del cliente
console.log('\n📦 Construyendo frontend para producción...');
exec('cd client && npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('   ❌ Error en build:', error.message);
    return;
  }
  
  console.log('   ✅ Build completado exitosamente');
  
  // 📂 Copiar archivos del servidor
  console.log('\n📂 Copiando backend...');
  copyDirectory('./server', path.join(deployDir, 'server'));
  console.log('   ✅ Backend copiado');
  
  // 📄 Copiar build del frontend
  console.log('\n📄 Copiando frontend optimizado...');
  const clientBuildPath = './client/build';
  if (fs.existsSync(clientBuildPath)) {
    copyDirectory(clientBuildPath, deployDir, true);
    console.log('   ✅ Frontend copiado');
  } else {
    console.log('   ❌ No existe build del cliente');
  }
  
  // 📝 Crear archivos específicos para ksamati.com
  console.log('\n📝 Creando configuración para ksamati.com...');
  
  // app.js optimizado para ksamati.com
  const appJsContent = `// 🚀 KSAMATI.COM - APLICACIÓN PRINCIPAL
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
  console.log(\`🌐 Puerto: \${PORT}\`);
});

module.exports = app;`;

  fs.writeFileSync(path.join(deployDir, 'app.js'), appJsContent);
  
  // package.json para producción
  const packageJson = {
    name: "ksamati-production",
    version: "1.0.0",
    description: "KSAMATI - Sistema empresarial en ksamati.com",
    main: "app.js",
    scripts: {
      start: "node app.js",
      health: "curl https://ksamati.com/api/health"
    },
    dependencies: {
      express: "^4.18.2",
      cors: "^2.8.5",
      dotenv: "^16.3.1",
      compression: "^1.7.4",
      helmet: "^7.1.0",
      mysql2: "^3.14.4"
    },
    engines: {
      node: ">=16.0.0"
    }
  };
  
  fs.writeFileSync(path.join(deployDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  
  // Archivo .env de ejemplo para ksamati.com
  const envExample = `# 🌐 CONFIGURACIÓN KSAMATI.COM
# Renombrar a .env y configurar valores reales

NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://ksamati.com

# MySQL - Configurar con datos reales de cPanel
DB_HOST=ksamati.com
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=tu_nombre_bd
DB_PORT=3306

APP_NAME=KSAMATI
APP_VERSION=1.0.0`;

  fs.writeFileSync(path.join(deployDir, '.env.example'), envExample);
  
  // Instrucciones específicas para ksamati.com
  const instructions = `# 🚀 DEPLOYMENT EN KSAMATI.COM

## 📁 ARCHIVOS PREPARADOS
Todos los archivos están listos en: ${deployDir}/

## 🚀 PASOS PARA DEPLOYMENT

### 1. 📤 SUBIR ARCHIVOS
- Subir TODO el contenido de ${deployDir}/ a public_html/ksamati/
- Mantener estructura de carpetas

### 2. ⚙️ CONFIGURAR NODE.JS
En cPanel → Node.js Selector:
- Application Root: public_html/ksamati
- Application URL: ksamati.com
- Startup File: app.js
- Node.js Version: 18.x+

### 3. 🔧 VARIABLES DE ENTORNO
Configurar en Node.js App:
\`\`\`
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://ksamati.com
DB_HOST=ksamati.com
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=tu_nombre_bd
\`\`\`

### 4. 🌐 HABILITAR REMOTE MYSQL
En cPanel → Remote MySQL → Add Host: %

### 5. 📦 INSTALAR DEPENDENCIAS
cd public_html/ksamati && npm install

### 6. 🚀 INICIAR APLICACIÓN
En Node.js Selector: Start App

### 7. ✅ VERIFICAR
Acceder a: https://ksamati.com/api/health

¡Tu aplicación KSAMATI estará en línea! 🎉`;

  fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT-KSAMATI-COM.md'), instructions);
  
  console.log('   ✅ Configuración para ksamati.com creada');
  console.log('   ✅ Instrucciones generadas');
  
  // 🎯 Finalizar
  console.log('\n🎉 =====================================');
  console.log('   DEPLOYMENT PREPARADO PARA KSAMATI.COM');
  console.log('   =====================================');
  console.log(`📁 Archivos: ${deployDir}/`);
  console.log('📋 Instrucciones: DEPLOYMENT-KSAMATI-COM.md');
  console.log('🌐 Dominio: https://ksamati.com');
  console.log('\n🚀 Próximos pasos:');
  console.log('   1. Configurar datos MySQL en .env');
  console.log('   2. Subir archivos a cPanel');
  console.log('   3. Configurar Node.js');
  console.log('   4. ¡Lanzar ksamati.com!');
  console.log('\n✨ ¡Tu sistema KSAMATI estará en línea!\n');
});

function copyDirectory(src, dest, copyContents = false) {
  if (!fs.existsSync(src)) return;
  
  if (copyContents) {
    const items = fs.readdirSync(src);
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  } else {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }
}
