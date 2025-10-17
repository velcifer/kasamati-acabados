# 🚀 DEPLOYMENT EN KSAMATI.COM

## 📁 ARCHIVOS PREPARADOS
Todos los archivos están listos en: ./ksamati-com-deployment/

## 🚀 PASOS PARA DEPLOYMENT

### 1. 📤 SUBIR ARCHIVOS
- Subir TODO el contenido de ./ksamati-com-deployment/ a public_html/ksamati/
- Mantener estructura de carpetas

### 2. ⚙️ CONFIGURAR NODE.JS
En cPanel → Node.js Selector:
- Application Root: public_html/ksamati
- Application URL: ksamati.com
- Startup File: app.js
- Node.js Version: 18.x+

### 3. 🔧 VARIABLES DE ENTORNO
Configurar en Node.js App:
```
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://ksamati.com
DB_HOST=ksamati.com
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=tu_nombre_bd
```

### 4. 🌐 HABILITAR REMOTE MYSQL
En cPanel → Remote MySQL → Add Host: %

### 5. 📦 INSTALAR DEPENDENCIAS
cd public_html/ksamati && npm install

### 6. 🚀 INICIAR APLICACIÓN
En Node.js Selector: Start App

### 7. ✅ VERIFICAR
Acceder a: https://ksamati.com/api/health

¡Tu aplicación KSAMATI estará en línea! 🎉