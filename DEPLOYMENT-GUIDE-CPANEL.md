
# 🚀 GUÍA DE DEPLOYMENT KSAMATI EN CPANEL

## 📋 PASOS PREVIOS - PREPARACIÓN

### 1. 📦 Construcción del Frontend para Producción
```bash
cd client
npm run build
```

### 2. 🔧 Configuración de Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:
```env
# CONFIGURACIÓN DE PRODUCCIÓN CPANEL
NODE_ENV=production
PORT=3000

# BASE DE DATOS MYSQL (CAMBIAR POR TUS DATOS DE CPANEL)
DB_HOST=localhost
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=tu_nombre_base_datos
DB_PORT=3306

# CONFIGURACIÓN DE LA APP
APP_NAME=KSAMATI
APP_VERSION=1.0.0
CORS_ORIGIN=https://tu-dominio.com
```

---

## 🗄️ PARTE 1: CONFIGURACIÓN DE BASE DE DATOS MYSQL EN CPANEL

### Paso 1: Crear Base de Datos
1. **Acceder a cPanel** → **MySQL Database Wizard** o **MySQL Databases**
2. **Crear nueva base de datos:**
   - Nombre: `ksamati_proyectos` (o el que prefieras)
   - Click en "Create Database"

### Paso 2: Crear Usuario MySQL
1. **Crear nuevo usuario:**
   - Usuario: `ksamati_user` (o el que prefieras)
   - Password: (genera una contraseña segura)
   - Click en "Create User"

### Paso 3: Asignar Permisos
1. **Asignar usuario a la base de datos**
2. **Seleccionar TODOS los privilegios** (ALL PRIVILEGES)
3. Click en "Make Changes"

### Paso 4: Importar Esquema de Base de Datos
1. **Ir a phpMyAdmin** desde cPanel
2. **Seleccionar tu base de datos** creada
3. **Click en "Import"**
4. **Subir el archivo:** `server/database/ksamati_complete_schema.sql`
5. **Click en "Go"** para ejecutar

---

## 📁 PARTE 2: PREPARACIÓN Y SUBIDA DE ARCHIVOS

### Paso 5: Estructura de Archivos para cPanel
```
public_html/
├── server/              # Backend Node.js
│   ├── config/
│   ├── database/
│   ├── routes/
│   └── index.js
├── client/              # Solo archivos build
│   └── build/           # Contenido del build de React
├── package.json         # Dependencias del servidor
├── .env                 # Variables de entorno
└── app.js              # Archivo principal (crear)
```

### Paso 6: Crear Archivo Principal para cPanel
Crear `app.js` en la raíz:
```javascript
// app.js - Archivo principal para cPanel
const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');

// Cargar variables de entorno
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Comprimir respuestas
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Parsear JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rutas API
app.use('/api/proyectos', require('./server/routes/proyectos'));
app.use('/api/ventas', require('./server/routes/ventas'));
app.use('/api/citas', require('./server/routes/citas'));
app.use('/api/chatbot', require('./server/routes/chatbot'));
app.use('/api/alertas', require('./server/routes/alertas'));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'client/build')));

// Ruta catch-all para React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 KSAMATI ejecutándose en puerto ${PORT}`);
  console.log(`📱 Entorno: ${process.env.NODE_ENV}`);
  console.log(`🌐 URL: ${process.env.CORS_ORIGIN || 'localhost'}`);
});

module.exports = app;
```

### Paso 7: Actualizar package.json Principal
```json
{
  "name": "ksamati-production",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "setup-db": "node server/database/verify-database.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "compression": "^1.7.4",
    "helmet": "^7.1.0",
    "mysql2": "^3.14.4"
  }
}
```

---

## 🔧 PARTE 3: CONFIGURACIÓN EN CPANEL

### Paso 8: Subir Archivos
1. **Usar File Manager** o **FTP**
2. **Subir a public_html:**
   - Carpeta `server/` completa
   - Contenido de `client/build/` (no la carpeta build, solo su contenido)
   - Archivos `app.js`, `package.json`, `.env`

### Paso 9: Instalar Dependencias
1. **Terminal en cPanel** (si disponible) o **SSH:**
```bash
cd public_html
npm install
```

### Paso 10: Configurar Node.js en cPanel
1. **Ir a "Node.js Selector"** en cPanel
2. **Crear nueva aplicación:**
   - Node.js Version: 18.x o superior
   - Application root: `public_html`
   - Application URL: tu dominio
   - Application startup file: `app.js`
3. **Click en "Create"**

### Paso 11: Configurar Variables de Entorno en cPanel
1. **En Node.js App settings:**
   - `NODE_ENV=production`
   - `DB_HOST=localhost`
   - `DB_USER=tu_usuario_mysql`
   - `DB_PASSWORD=tu_password_mysql`  
   - `DB_NAME=tu_nombre_base_datos`
   - `CORS_ORIGIN=https://tu-dominio.com`

### Paso 12: Iniciar la Aplicación
1. **Click en "Start App"** en Node.js Selector
2. **Verificar que esté "Running"**

---

## ✅ PARTE 4: VERIFICACIÓN Y PRUEBAS

### Paso 13: Verificar Base de Datos
```bash
# En terminal de cPanel o SSH
cd public_html
node -e "require('./server/config/database').testConnection()"
```

### Paso 14: Probar la Aplicación
1. **Acceder a tu dominio:** `https://tu-dominio.com`
2. **Verificar que cargue el frontend**
3. **Probar funcionalidades básicas**

### Paso 15: Configurar SSL (Recomendado)
1. **En cPanel** → **SSL/TLS**
2. **Activar "Let's Encrypt"** gratuito
3. **Forzar HTTPS redirect**

---

## 🔍 RESOLUCIÓN DE PROBLEMAS COMUNES

### Error de Conexión MySQL
```bash
# Verificar configuración
node -e "console.log(process.env)"
```

### Error 500
```bash
# Ver logs
tail -f ~/logs/tu-dominio_error.log
```

### Aplicación no inicia
1. **Verificar Node.js version** (mínimo 16.x)
2. **Revisar permisos** de archivos
3. **Verificar sintaxis** en app.js

---

## 📞 NOTAS IMPORTANTES

1. **Backup:** Siempre hacer backup antes de hacer cambios
2. **Monitoreo:** Configurar monitoreo de la aplicación
3. **Actualizaciones:** Mantener dependencias actualizadas
4. **Seguridad:** Usar contraseñas fuertes para MySQL
5. **Performance:** Considerar usar CDN para archivos estáticos

---

## 🎯 CHECKLIST FINAL

- [ ] Base de datos MySQL creada e importada
- [ ] Usuario MySQL configurado con permisos
- [ ] Archivos subidos a public_html
- [ ] Dependencias instaladas
- [ ] Variables de entorno configuradas
- [ ] Aplicación Node.js iniciada
- [ ] SSL habilitado
- [ ] Aplicación funcionando correctamente

¡Tu aplicación KSAMATI estará lista! 🚀
