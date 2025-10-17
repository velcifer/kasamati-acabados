@echo off
echo ==========================================
echo 🗄️ KSAMATI - CONFIGURACION DE BASE DE DATOS
echo ==========================================

echo.
echo 📋 Este script te ayudara a configurar la base de datos MySQL
echo.

set /p DB_HOST="🔗 Host de MySQL (localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_USER="👤 Usuario de MySQL (root): "
if "%DB_USER%"=="" set DB_USER=root

set /p DB_PASSWORD="🔐 Contraseña de MySQL: "
if "%DB_PASSWORD%"=="" set DB_PASSWORD=

set /p DB_PORT="🚪 Puerto de MySQL (3306): "
if "%DB_PORT%"=="" set DB_PORT=3306

echo.
echo ⚙️ Configurando archivo .env...
echo DB_HOST=%DB_HOST% > server\.env
echo DB_USER=%DB_USER% >> server\.env
echo DB_PASSWORD=%DB_PASSWORD% >> server\.env
echo DB_NAME=ksamti_proyectos >> server\.env
echo DB_PORT=%DB_PORT% >> server\.env
echo PORT=5000 >> server\.env
echo NODE_ENV=development >> server\.env
echo FRONTEND_URL=http://localhost:3000 >> server\.env

echo.
echo 📦 Instalando dependencias del servidor...
cd server
call npm install
cd ..

echo.
echo 🗄️ Creando base de datos...
echo IMPORTANTE: Asegurate de que MySQL este ejecutandose
pause

mysql -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% -P%DB_PORT% < server/database/schema.sql

if %errorlevel% equ 0 (
    echo.
    echo ✅ ¡Base de datos configurada exitosamente!
    echo.
    echo 🚀 Para iniciar la aplicacion:
    echo    1. npm run dev
    echo.
    echo 🌐 La app estara disponible en:
    echo    - Frontend: http://localhost:3000
    echo    - Backend:  http://localhost:5000
    echo.
) else (
    echo.
    echo ❌ Error configurando la base de datos
    echo 📋 Verifica que:
    echo    - MySQL este ejecutandose
    echo    - Las credenciales sean correctas
    echo    - El usuario tenga permisos para crear bases de datos
    echo.
)

pause
