#!/usr/bin/env node

// 🚀 SCRIPT AUTOMATIZADO PARA PREPARAR DEPLOYMENT EN CPANEL
// Este script prepara todos los archivos necesarios para subir a cPanel

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('\n🚀 =====================================');
console.log('   PREPARANDO DEPLOYMENT PARA CPANEL');
console.log('   =====================================\n');

// 📁 Crear directorio de deployment
const deployDir = './cpanel-deployment';

console.log('📁 Creando directorio de deployment...');
if (fs.existsSync(deployDir)) {
  console.log('   ⚠️ Directorio existe, limpiando...');
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });
console.log('   ✅ Directorio creado: ' + deployDir);

// 📦 Paso 1: Build del cliente
console.log('\n📦 Paso 1: Construyendo frontend React...');
exec('cd client && npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('   ❌ Error en build:', error.message);
    return;
  }
  
  console.log('   ✅ Build completado');
  
  // 📂 Paso 2: Copiar archivos del servidor
  console.log('\n📂 Paso 2: Copiando archivos del servidor...');
  copyDirectory('./server', path.join(deployDir, 'server'));
  console.log('   ✅ Servidor copiado');
  
  // 📄 Paso 3: Copiar archivos build del cliente
  console.log('\n📄 Paso 3: Copiando build del frontend...');
  const clientBuildPath = './client/build';
  if (fs.existsSync(clientBuildPath)) {
    copyDirectory(clientBuildPath, deployDir, true); // Copiar contenido, no la carpeta
    console.log('   ✅ Frontend copiado');
  } else {
    console.log('   ❌ No existe build del cliente. Ejecuta: cd client && npm run build');
  }
  
  // 📝 Paso 4: Copiar archivos de configuración
  console.log('\n📝 Paso 4: Preparando archivos de configuración...');
  
  // Copiar app.js principal
  fs.copyFileSync('./app.js', path.join(deployDir, 'app.js'));
  
  // Copiar package.json de producción
  fs.copyFileSync('./package.production.json', path.join(deployDir, 'package.json'));
  
  // Crear archivo .env ejemplo
  fs.copyFileSync('./env.example.production', path.join(deployDir, '.env.example'));
  
  console.log('   ✅ Archivos de configuración preparados');
  
  // 📋 Paso 5: Crear instrucciones de deployment
  createDeploymentInstructions(deployDir);
  
  // 🎯 Finalizar
  console.log('\n🎯 =====================================');
  console.log('   PREPARACIÓN COMPLETADA');
  console.log('   =====================================');
  console.log(`📁 Archivos listos en: ${deployDir}/`);
  console.log('📋 Lee las instrucciones en: DEPLOYMENT-INSTRUCTIONS.md');
  console.log('\n🚀 Próximos pasos:');
  console.log('   1. Configura MySQL en cPanel');
  console.log('   2. Sube los archivos de la carpeta cpanel-deployment/');
  console.log('   3. Configura variables de entorno');
  console.log('   4. Inicia la aplicación Node.js');
  console.log('\n✅ ¡Todo listo para deployment!\n');
});

// 📂 Función para copiar directorios
function copyDirectory(src, dest, copyContents = false) {
  if (!fs.existsSync(src)) {
    console.log(`   ⚠️ No existe: ${src}`);
    return;
  }
  
  if (copyContents) {
    // Copiar solo el contenido, no la carpeta
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
    // Copiar toda la carpeta
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

// 📋 Crear instrucciones específicas de deployment
function createDeploymentInstructions(deployDir) {
  const instructions = `# 🚀 INSTRUCCIONES DE DEPLOYMENT - KSAMATI

## 📁 CONTENIDO PREPARADO

Los archivos en esta carpeta están listos para subir a tu servidor cPanel.

### Estructura de archivos:
\`\`\`
cpanel-deployment/
├── server/                 # Backend Node.js
├── app.js                 # Archivo principal
├── package.json           # Dependencias
├── .env.example          # Variables de entorno (renombrar a .env)
├── index.html            # Frontend React
├── static/               # Archivos CSS, JS, imágenes
└── [otros archivos build]
\`\`\`

## 🚀 PASOS DE DEPLOYMENT

### 1. 🗄️ CONFIGURAR MYSQL EN CPANEL
- Crear base de datos: \`ksamati_proyectos\`
- Crear usuario MySQL con todos los permisos
- Importar archivo: \`server/database/ksamati_complete_schema.sql\`

### 2. 📤 SUBIR ARCHIVOS
- Subir TODO el contenido de esta carpeta a \`public_html/\`
- Mantener la estructura de carpetas

### 3. 🔧 CONFIGURAR VARIABLES
- Renombrar \`.env.example\` a \`.env\`
- Editar \`.env\` con tus datos reales:
  \`\`\`
  DB_HOST=localhost
  DB_USER=tu_usuario_mysql
  DB_PASSWORD=tu_password_mysql
  DB_NAME=ksamati_proyectos
  CORS_ORIGIN=https://tu-dominio.com
  \`\`\`

### 4. ⚙️ CONFIGURAR NODE.JS EN CPANEL
- Ir a "Node.js Selector"
- Crear nueva aplicación:
  - Application Root: \`public_html\`
  - Application URL: tu dominio
  - Application Startup File: \`app.js\`
  - Node.js Version: 18.x o superior

### 5. 📦 INSTALAR DEPENDENCIAS
\`\`\`bash
cd public_html
npm install
\`\`\`

### 6. 🚀 INICIAR APLICACIÓN
- En Node.js Selector: Click "Start App"
- Verificar que esté "Running"

### 7. ✅ VERIFICAR FUNCIONAMIENTO
- Acceder a: https://tu-dominio.com
- Probar funcionalidades básicas

## 🔍 SOLUCIÓN DE PROBLEMAS

### Error de conexión MySQL:
\`\`\`bash
node -e "require('./server/config/database').testConnection()"
\`\`\`

### Verificar salud de la app:
\`\`\`bash
curl https://tu-dominio.com/api/health
\`\`\`

### Ver logs de errores:
\`\`\`bash
tail -f ~/logs/tu-dominio_error.log
\`\`\`

## 📞 CONTACTO
- Soporte: tu-email@dominio.com
- Documentación completa: DEPLOYMENT-GUIDE-CPANEL.md

¡Tu aplicación KSAMATI estará lista! 🎉`;

  fs.writeFileSync(path.join(deployDir, 'DEPLOYMENT-INSTRUCTIONS.md'), instructions);
  console.log('   ✅ Instrucciones creadas: DEPLOYMENT-INSTRUCTIONS.md');
}
