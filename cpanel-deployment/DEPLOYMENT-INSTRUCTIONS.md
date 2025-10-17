# 🚀 INSTRUCCIONES DE DEPLOYMENT - KSAMATI

## 📁 CONTENIDO PREPARADO

Los archivos en esta carpeta están listos para subir a tu servidor cPanel.

### Estructura de archivos:
```
cpanel-deployment/
├── server/                 # Backend Node.js
├── app.js                 # Archivo principal
├── package.json           # Dependencias
├── .env.example          # Variables de entorno (renombrar a .env)
├── index.html            # Frontend React
├── static/               # Archivos CSS, JS, imágenes
└── [otros archivos build]
```

## 🚀 PASOS DE DEPLOYMENT

### 1. 🗄️ CONFIGURAR MYSQL EN CPANEL
- Crear base de datos: `ksamati_proyectos`
- Crear usuario MySQL con todos los permisos
- Importar archivo: `server/database/ksamati_complete_schema.sql`

### 2. 📤 SUBIR ARCHIVOS
- Subir TODO el contenido de esta carpeta a `public_html/`
- Mantener la estructura de carpetas

### 3. 🔧 CONFIGURAR VARIABLES
- Renombrar `.env.example` a `.env`
- Editar `.env` con tus datos reales:
  ```
  DB_HOST=localhost
  DB_USER=tu_usuario_mysql
  DB_PASSWORD=tu_password_mysql
  DB_NAME=ksamati_proyectos
  CORS_ORIGIN=https://tu-dominio.com
  ```

### 4. ⚙️ CONFIGURAR NODE.JS EN CPANEL
- Ir a "Node.js Selector"
- Crear nueva aplicación:
  - Application Root: `public_html`
  - Application URL: tu dominio
  - Application Startup File: `app.js`
  - Node.js Version: 18.x o superior

### 5. 📦 INSTALAR DEPENDENCIAS
```bash
cd public_html
npm install
```

### 6. 🚀 INICIAR APLICACIÓN
- En Node.js Selector: Click "Start App"
- Verificar que esté "Running"

### 7. ✅ VERIFICAR FUNCIONAMIENTO
- Acceder a: https://tu-dominio.com
- Probar funcionalidades básicas

## 🔍 SOLUCIÓN DE PROBLEMAS

### Error de conexión MySQL:
```bash
node -e "require('./server/config/database').testConnection()"
```

### Verificar salud de la app:
```bash
curl https://tu-dominio.com/api/health
```

### Ver logs de errores:
```bash
tail -f ~/logs/tu-dominio_error.log
```

## 📞 CONTACTO
- Soporte: tu-email@dominio.com
- Documentación completa: DEPLOYMENT-GUIDE-CPANEL.md

¡Tu aplicación KSAMATI estará lista! 🎉