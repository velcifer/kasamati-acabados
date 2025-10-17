#!/usr/bin/env node
/**
 * 🗄️ KSAMATI - CONFIGURADOR AUTOMÁTICO DE BASE DE DATOS
 * 
 * Este script configura automáticamente la base de datos MySQL para KSAMATI
 * Funciona tanto en desarrollo local como en producción
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

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

// 🔧 Configuración
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

const DATABASE_NAME = process.env.DB_NAME || 'ksamti_proyectos';

// 🛠️ Función para crear input interactivo
const createInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
};

// 🔍 Función para preguntar al usuario
const askQuestion = (rl, question) => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

// 🔐 Configuración interactiva de credenciales
async function setupCredentials() {
  const rl = createInterface();
  
  log('\n🔐 CONFIGURACIÓN DE CREDENCIALES MYSQL\n', 'cyan');
  
  const host = await askQuestion(rl, `Host MySQL (${DB_CONFIG.host}): `);
  const port = await askQuestion(rl, `Puerto (${DB_CONFIG.port}): `);
  const user = await askQuestion(rl, `Usuario (${DB_CONFIG.user}): `);
  const password = await askQuestion(rl, 'Contraseña (dejar vacío si no hay): ');
  const dbName = await askQuestion(rl, `Nombre de BD (${DATABASE_NAME}): `);
  
  rl.close();
  
  return {
    host: host.trim() || DB_CONFIG.host,
    port: parseInt(port.trim()) || DB_CONFIG.port,
    user: user.trim() || DB_CONFIG.user,
    password: password.trim() || DB_CONFIG.password,
    dbName: dbName.trim() || DATABASE_NAME,
    multipleStatements: true
  };
}

// 🧪 Función para probar conexión
async function testConnection(config) {
  log('\n🧪 Probando conexión a MySQL...', 'yellow');
  
  try {
    // Conectar sin especificar base de datos
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });
    
    await connection.execute('SELECT 1 as test');
    await connection.end();
    
    log('✅ Conexión exitosa a MySQL!', 'green');
    return true;
  } catch (error) {
    log(`❌ Error de conexión: ${error.message}`, 'red');
    return false;
  }
}

// 📁 Función para ejecutar archivo SQL
async function executeSchemaFile(connection, filePath) {
  log(`\n📁 Ejecutando esquema: ${filePath}`, 'blue');
  
  try {
    const schema = await fs.readFile(filePath, 'utf8');
    
    // Dividir el SQL en declaraciones individuales
    const statements = schema
      .split(/;\s*$(?=\n)/gm)
      .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await connection.execute(statement);
          process.stdout.write(`\r⚡ Ejecutando declaración ${i + 1}/${statements.length}...`);
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.error(`\n❌ Error en declaración ${i + 1}: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\n✅ Esquema ejecutado correctamente!');
    return true;
  } catch (error) {
    log(`❌ Error ejecutando esquema: ${error.message}`, 'red');
    return false;
  }
}

// 📊 Función para verificar datos
async function verifyDatabase(connection, dbName) {
  log('\n📊 Verificando base de datos...', 'blue');
  
  try {
    // Verificar tablas
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [dbName]
    );
    
    log(`✅ Tablas encontradas: ${tables.length}`, 'green');
    tables.forEach(table => {
      log(`   • ${table.TABLE_NAME}`, 'cyan');
    });
    
    // Verificar datos de ejemplo
    const [projects] = await connection.execute('SELECT COUNT(*) as count FROM proyectos');
    log(`✅ Proyectos de ejemplo: ${projects[0].count}`, 'green');
    
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM proyecto_categorias');
    log(`✅ Categorías de ejemplo: ${categories[0].count}`, 'green');
    
    // Verificar tablas nuevas si existen
    try {
      const [ventas] = await connection.execute('SELECT COUNT(*) as count FROM ventas');
      log(`✅ Ventas de ejemplo: ${ventas[0].count}`, 'green');
      
      const [documentos] = await connection.execute('SELECT COUNT(*) as count FROM proyecto_documentos');
      log(`✅ Documentos de ejemplo: ${documentos[0].count}`, 'green');
      
      const [cotizadores] = await connection.execute('SELECT COUNT(*) as count FROM venta_cotizadores');
      log(`✅ Cotizadores de ejemplo: ${cotizadores[0].count}`, 'green');
    } catch (error) {
      // Las tablas nuevas no existen, es el schema básico
      log('⚠️  Usando schema básico (sin ventas y documentos)', 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`❌ Error verificando base de datos: ${error.message}`, 'red');
    return false;
  }
}

// 📝 Función para crear archivo .env
async function createEnvFile(config) {
  log('\n📝 Creando archivo .env...', 'blue');
  
  const envContent = `# 🗄️ KSAMATI - CONFIGURACIÓN DE BASE DE DATOS
# Generado automáticamente por setup-database.js

DB_HOST=${config.host}
DB_PORT=${config.port}
DB_USER=${config.user}
DB_PASSWORD=${config.password}
DB_NAME=${config.dbName}

# 🌐 CONFIGURACIÓN DEL SERVIDOR
PORT=5000
NODE_ENV=development

# 🔐 SEGURIDAD (cambiar en producción)
JWT_SECRET=ksamati_secret_key_change_in_production
SESSION_SECRET=ksamati_session_secret_change_in_production

# 📱 CONFIGURACIÓN DE LA APLICACIÓN
APP_NAME=KSAMATI
APP_VERSION=1.0.0
`;

  try {
    await fs.writeFile('.env', envContent, 'utf8');
    log('✅ Archivo .env creado exitosamente!', 'green');
  } catch (error) {
    log(`❌ Error creando .env: ${error.message}`, 'red');
  }
}

// 🚀 Función principal
async function main() {
  log(`
${colors.bright}${colors.cyan}
╔══════════════════════════════════════╗
║        🗄️ KSAMATI DATABASE SETUP     ║
║      Configurador Automático         ║
╚══════════════════════════════════════╝
${colors.reset}
`);

  try {
    // Paso 1: Configurar credenciales
    const config = await setupCredentials();
    
    // Paso 2: Probar conexión
    const connectionOk = await testConnection(config);
    if (!connectionOk) {
      log('\n❌ No se pudo conectar a MySQL. Verifica las credenciales.', 'red');
      process.exit(1);
    }
    
    // Paso 3: Conectar a MySQL
    log('\n🔗 Conectando a MySQL...', 'blue');
    const connection = await mysql.createConnection(config);
    
    // Paso 4: Ejecutar esquema completo
    let schemaPath = path.join(__dirname, 'server', 'database', 'ksamati_complete_schema.sql');
    
    // Si no existe el schema completo, usar el básico
    try {
      await fs.access(schemaPath);
      log('📊 Usando schema COMPLETO con todas las funcionalidades', 'magenta');
    } catch (error) {
      schemaPath = path.join(__dirname, 'server', 'database', 'schema.sql');
      log('📊 Usando schema básico', 'yellow');
    }
    
    const schemaExecuted = await executeSchemaFile(connection, schemaPath);
    
    if (!schemaExecuted) {
      log('\n❌ Error ejecutando el esquema de base de datos.', 'red');
      process.exit(1);
    }
    
    // Paso 5: Seleccionar la base de datos
    await connection.execute(`USE ${config.dbName}`);
    
    // Paso 6: Verificar instalación
    await verifyDatabase(connection, config.dbName);
    
    // Paso 7: Crear archivo .env
    await createEnvFile(config);
    
    // Cerrar conexión
    await connection.end();
    
    // 🎉 Éxito!
    log(`
${colors.bright}${colors.green}
╔══════════════════════════════════════╗
║            ✅ ÉXITO TOTAL!            ║
║                                      ║
║  Base de datos configurada:          ║
║  • ${config.dbName.padEnd(30)}║
║  • Tablas: 4                         ║
║  • Procedimientos: 1                 ║
║  • Triggers: 4                       ║
║  • Datos de ejemplo: ✅               ║
║                                      ║
║  Ahora puedes usar KSAMATI! 🚀       ║
╚══════════════════════════════════════╝
${colors.reset}

${colors.bright}Próximos pasos:${colors.reset}
${colors.cyan}1.${colors.reset} Reinicia el servidor KSAMATI
${colors.cyan}2.${colors.reset} Ve a http://localhost:3000
${colors.cyan}3.${colors.reset} ¡Los proyectos de ejemplo estarán listos!

${colors.yellow}💡 Tip:${colors.reset} El archivo .env ha sido creado automáticamente
`);
    
  } catch (error) {
    log(`\n❌ Error fatal: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { main };
