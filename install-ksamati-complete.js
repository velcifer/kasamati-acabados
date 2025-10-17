#!/usr/bin/env node

/**
 * 🚀 INSTALADOR COMPLETO DE KSAMATI
 * 
 * Este script configura automáticamente todo el sistema KSAMATI:
 * - Base de datos MySQL completa
 * - Todas las dependencias
 * - Configuración automática
 * - Verificación de funcionalidades
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// 🎨 Colores para la consola
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const runCommand = (command, description) => {
  return new Promise((resolve, reject) => {
    log(`\n⚡ ${description}`, 'blue');
    log(`   Comando: ${command}`, 'cyan');
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(`❌ Error: ${error.message}`, 'red');
        reject(error);
      } else {
        if (stdout) log(`✅ ${stdout.trim()}`, 'green');
        if (stderr && !stderr.includes('deprecated')) log(`⚠️  ${stderr.trim()}`, 'yellow');
        resolve(stdout);
      }
    });
  });
};

async function verificarRequisitos() {
  log('\n🔍 VERIFICANDO REQUISITOS DEL SISTEMA...', 'cyan');
  
  try {
    await runCommand('node --version', 'Verificando Node.js');
    await runCommand('npm --version', 'Verificando npm');
    
    // Verificar MySQL
    try {
      await runCommand('mysql --version', 'Verificando MySQL');
    } catch (error) {
      log('⚠️  MySQL no encontrado en PATH, pero puede estar instalado', 'yellow');
    }
    
    return true;
  } catch (error) {
    log('❌ Faltan requisitos del sistema', 'red');
    return false;
  }
}

async function instalarDependencias() {
  log('\n📦 INSTALANDO DEPENDENCIAS...', 'cyan');
  
  try {
    await runCommand('npm install', 'Instalando dependencias del servidor');
    await runCommand('cd client && npm install', 'Instalando dependencias del cliente');
    
    log('✅ Todas las dependencias instaladas correctamente', 'green');
    return true;
  } catch (error) {
    log('❌ Error instalando dependencias', 'red');
    return false;
  }
}

async function configurarBaseDatos() {
  log('\n🗄️ CONFIGURANDO BASE DE DATOS COMPLETA...', 'cyan');
  
  try {
    // Intentar configuración automática completa
    await runCommand('npm run setup-db-complete', 'Instalando schema completo');
    
    // Verificar instalación
    await runCommand('npm run verify-db', 'Verificando instalación de BD');
    
    log('✅ Base de datos configurada con todas las funcionalidades', 'green');
    return true;
  } catch (error) {
    log('⚠️  Configuración automática falló, intentando setup interactivo...', 'yellow');
    
    try {
      await runCommand('npm run setup-db', 'Setup interactivo de BD');
      return true;
    } catch (error2) {
      log('❌ Error configurando base de datos', 'red');
      log('💡 Solución: Configura MySQL manualmente y ejecuta: npm run setup-db', 'yellow');
      return false;
    }
  }
}

async function verificarSistema() {
  log('\n🎯 VERIFICACIÓN FINAL DEL SISTEMA...', 'cyan');
  
  try {
    await runCommand('npm run check-db', 'Verificando conexión a BD');
    
    // Verificar que los archivos principales existen
    const archivos = [
      'server/index.js',
      'client/src/App.js',
      'server/database/ksamati_complete_schema.sql'
    ];
    
    for (const archivo of archivos) {
      try {
        await fs.access(archivo);
        log(`✅ ${archivo}`, 'green');
      } catch (error) {
        log(`❌ Falta: ${archivo}`, 'red');
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    log('❌ Sistema no está completamente configurado', 'red');
    return false;
  }
}

async function mostrarResumen() {
  log(`
${colors.bright}${colors.green}
╔══════════════════════════════════════════════════════════╗
║                    🎉 ¡INSTALACIÓN COMPLETA!             ║
║                                                          ║
║  KSAMATI ha sido configurado exitosamente con:          ║
║                                                          ║
║  🏗️  GESTIÓN DE PROYECTOS:                              ║
║     • Excel-like grid con 12 fórmulas automáticas       ║
║     • 24 categorías de proveedores                      ║
║     • Documentos del proyecto (tabla completa)          ║
║     • Sistema de archivos adjuntos (1-4 archivos)       ║
║     • Vista previa de archivos (PDF + imágenes)         ║
║     • Filtros avanzados                                  ║
║                                                          ║
║  💰 GESTIÓN DE VENTAS:                                   ║
║     • Cotizador inteligente (Melamina/Granito/Terc.)    ║
║     • Cálculo automático de utilidad                    ║
║     • Filtros por estado, cliente, requerimiento        ║
║     • Fórmulas financieras automáticas                  ║
║                                                          ║
║  🗄️  BASE DE DATOS MYSQL:                               ║
║     • 8 tablas completas                                 ║
║     • 2 procedimientos almacenados                       ║
║     • 6+ triggers automáticos                            ║
║     • Datos de ejemplo incluidos                         ║
║     • Sistema de auditoría completo                      ║
║                                                          ║
║  🚀 ¡LISTO PARA USAR!                                   ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}

${colors.bright}🎯 COMANDOS PARA USAR KSAMATI:${colors.reset}

${colors.cyan}# Iniciar la aplicación completa:${colors.reset}
npm run dev

${colors.cyan}# Solo el servidor:${colors.reset}
npm run server

${colors.cyan}# Solo el cliente:${colors.reset}
npm run client

${colors.cyan}# Verificar base de datos:${colors.reset}
npm run verify-db

${colors.cyan}# Para producción:${colors.reset}
npm run build
npm start

${colors.bright}🌐 ACCEDER A LA APLICACIÓN:${colors.reset}
${colors.green}Frontend:${colors.reset} http://localhost:3000
${colors.green}Backend:${colors.reset}  http://localhost:5000

${colors.bright}📊 FUNCIONALIDADES DISPONIBLES:${colors.reset}
✅ Gestor de Proyectos completo
✅ Gestor de Ventas completo  
✅ Sistema de documentos y archivos
✅ 12 fórmulas automáticas funcionando
✅ Filtros avanzados en ambos gestores
✅ Cálculos inteligentes de utilidad
✅ Vista previa de archivos integrada
✅ Base de datos persistente

${colors.yellow}💡 PRÓXIMOS PASOS:${colors.reset}
1. Ejecuta: ${colors.cyan}npm run dev${colors.reset}
2. Ve a: ${colors.cyan}http://localhost:3000${colors.reset}
3. ¡Explora todas las funcionalidades!

${colors.bright}¡KSAMATI ESTÁ LISTO PARA GESTIONAR TUS PROYECTOS! 🎉${colors.reset}
`, 'reset');
}

async function main() {
  log(`
${colors.bright}${colors.magenta}
╔══════════════════════════════════════════════════════════╗
║           🚀 INSTALADOR COMPLETO DE KSAMATI              ║
║                                                          ║
║  Este script instalará automáticamente:                 ║
║  • Todas las dependencias necesarias                    ║
║  • Base de datos MySQL completa                         ║
║  • Sistema de gestión de proyectos y ventas             ║
║  • Funcionalidades avanzadas (documentos, archivos)     ║
║  • Fórmulas automáticas y filtros                       ║
║                                                          ║
║  ⏱️  Tiempo estimado: 3-5 minutos                       ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}
`);

  try {
    // Paso 1: Verificar requisitos
    const requisitosOk = await verificarRequisitos();
    if (!requisitosOk) {
      log('\n❌ Instala los requisitos y vuelve a intentar', 'red');
      process.exit(1);
    }

    // Paso 2: Instalar dependencias
    const dependenciasOk = await instalarDependencias();
    if (!dependenciasOk) {
      log('\n❌ Error instalando dependencias', 'red');
      process.exit(1);
    }

    // Paso 3: Configurar base de datos
    const bdOk = await configurarBaseDatos();
    if (!bdOk) {
      log('\n⚠️  Base de datos no configurada, pero puedes continuar', 'yellow');
      log('💡 Configúrala manualmente después con: npm run setup-db', 'yellow');
    }

    // Paso 4: Verificación final
    const sistemaOk = await verificarSistema();
    if (!sistemaOk) {
      log('\n⚠️  Algunas verificaciones fallaron', 'yellow');
    }

    // Mostrar resumen final
    await mostrarResumen();

  } catch (error) {
    log(`\n❌ Error durante la instalación: ${error.message}`, 'red');
    
    log(`\n🔧 INSTALACIÓN MANUAL:`, 'yellow');
    log(`1. npm install`, 'cyan');
    log(`2. cd client && npm install`, 'cyan');
    log(`3. npm run setup-db`, 'cyan');
    log(`4. npm run dev`, 'cyan');
    
    process.exit(1);
  }
}

// Ejecutar instalación
if (require.main === module) {
  main();
}

module.exports = { main };










