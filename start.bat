@echo off
title KSAMATI - Sistema de Gestion Empresarial

echo.
echo 🚀 Iniciando KSAMATI - Sistema de Gestion Empresarial
echo ==================================================

:: Verificar si Node.js esta instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no esta instalado. Por favor instala Node.js 16 o superior.
    pause
    exit /b 1
)

:: Mostrar version de Node.js
echo ✅ Node.js instalado
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo    Version: %NODE_VERSION%

:: Verificar si las dependencias estan instaladas
if not exist "node_modules" (
    echo.
    echo 📦 Instalando dependencias del servidor...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Error instalando dependencias del servidor
        pause
        exit /b 1
    )
)

if not exist "client\node_modules" (
    echo.
    echo 📦 Instalando dependencias del cliente...
    cd client
    call npm install
    cd ..
    if %errorlevel% neq 0 (
        echo ❌ Error instalando dependencias del cliente
        pause
        exit /b 1
    )
)

:: Crear archivo .env si no existe
if not exist ".env" (
    echo.
    echo 📝 Creando archivo de configuracion .env...
    (
    echo NODE_ENV=development
    echo PORT=5000
    echo CORS_ORIGIN=http://localhost:3000
    echo APP_NAME=KSAMATI
    echo APP_VERSION=1.0.0
    ) > .env
    echo ✅ Archivo .env creado con configuracion por defecto
)

echo.
echo 🎯 Iniciando aplicacion en modo desarrollo...
echo    Backend: http://localhost:5000
echo    Frontend: http://localhost:3000
echo.
echo 📊 Para detener la aplicacion presiona Ctrl+C
echo.

:: Iniciar la aplicacion
call npm run dev

pause
