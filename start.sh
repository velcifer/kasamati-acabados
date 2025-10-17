#!/bin/bash

# Script de inicio para KSAMATI
echo "🚀 Iniciando KSAMATI - Sistema de Gestión Empresarial"
echo "=================================================="

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 16 o superior."
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ $MAJOR_VERSION -lt 16 ]; then
    echo "⚠️  Se recomienda Node.js 16 o superior. Versión actual: $NODE_VERSION"
fi

echo "✅ Node.js versión: $NODE_VERSION"

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del servidor..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Instalando dependencias del cliente..."
    cd client && npm install && cd ..
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo de configuración .env..."
    cat > .env << EOF
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
APP_NAME=KSAMATI
APP_VERSION=1.0.0
EOF
    echo "✅ Archivo .env creado con configuración por defecto"
fi

# Verificar puertos disponibles
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  El puerto 5000 está en uso. El servidor puede no iniciar correctamente."
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  El puerto 3000 está en uso. El cliente puede no iniciar correctamente."
fi

echo ""
echo "🎯 Iniciando aplicación en modo desarrollo..."
echo "   Backend: http://localhost:5000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "📊 Para detener la aplicación presiona Ctrl+C"
echo ""

# Iniciar la aplicación
npm run dev
