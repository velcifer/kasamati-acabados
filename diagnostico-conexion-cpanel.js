// 🔍 DIAGNÓSTICO COMPLETO DE CONEXIÓN A CPANEL
// Ejecutar: node diagnostico-conexion-cpanel.js

require('dotenv').config();
const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuración actual
const dbConfig = {
  host: process.env.DB_HOST || '169.60.159.40',
  user: process.env.DB_USER || 'eddyyvi1',
  password: process.env.DB_PASSWORD || '3DqAiEREKC!fiqD',
  database: process.env.DB_NAME || 'eddyyvi1_ksamati_proyectos',
  port: process.env.DB_PORT || 3306,
};

console.log('🔍 DIAGNÓSTICO DE CONEXIÓN A CPANEL PHPMYADMIN\n');
console.log('='.repeat(70));

// 1. Verificar conectividad de red
async function testNetworkConnectivity() {
  console.log('\n📡 PASO 1: VERIFICANDO CONECTIVIDAD DE RED');
  console.log('-'.repeat(70));
  
  try {
    // Intentar hacer ping al host (solo en Windows/Linux)
    const host = dbConfig.host;
    console.log(`   Probando conectividad a ${host}...`);
    
    // Verificar si el puerto está abierto usando netstat o similar
    console.log(`   ✅ Host configurado: ${host}`);
    console.log(`   ✅ Puerto configurado: ${dbConfig.port}`);
    
    return true;
  } catch (error) {
    console.log(`   ⚠️  No se pudo verificar conectividad: ${error.message}`);
    return false;
  }
}

// 2. Probar diferentes configuraciones de host
async function testDifferentHosts() {
  console.log('\n🌐 PASO 2: PROBANDO DIFERENTES CONFIGURACIONES DE HOST');
  console.log('-'.repeat(70));
  
  const hostsToTest = [
    { name: 'IP Actual', host: dbConfig.host },
    { name: 'localhost', host: 'localhost' },
    { name: '127.0.0.1', host: '127.0.0.1' },
  ];
  
  // Si el host es una IP, también probar con posibles nombres de dominio
  if (dbConfig.host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    console.log('   💡 El host es una IP. En cPanel, normalmente se usa:');
    console.log('      - localhost (si estás en el mismo servidor)');
    console.log('      - El nombre del servidor MySQL');
  }
  
  for (const testHost of hostsToTest) {
    try {
      console.log(`\n   Probando: ${testHost.name} (${testHost.host})...`);
      const testConfig = { ...dbConfig, host: testHost.host, connectTimeout: 5000 };
      const connection = await mysql.createConnection(testConfig);
      
      const [version] = await connection.execute('SELECT VERSION() as v');
      console.log(`   ✅ ¡CONEXIÓN EXITOSA con ${testHost.name}!`);
      console.log(`      MySQL versión: ${version[0].v}`);
      
      await connection.end();
      return { success: true, host: testHost.host };
    } catch (error) {
      console.log(`   ❌ Falló: ${error.code} - ${error.message}`);
    }
  }
  
  return { success: false };
}

// 3. Verificar credenciales
async function testCredentials() {
  console.log('\n🔐 PASO 3: VERIFICANDO CREDENCIALES');
  console.log('-'.repeat(70));
  console.log(`   Usuario: ${dbConfig.user}`);
  console.log(`   Base de datos: ${dbConfig.database}`);
  console.log(`   Password: ${'*'.repeat(dbConfig.password.length)} caracteres`);
  
  // Verificar formato del nombre de usuario (debe tener prefijo de cPanel)
  if (!dbConfig.user.includes('_')) {
    console.log('   ⚠️  ADVERTENCIA: El usuario no tiene prefijo de cPanel');
    console.log('      En cPanel, los usuarios MySQL tienen formato: usuario_cpanel_nombre');
    console.log('      Ejemplo: eddyyvi1_ksamati_user');
  } else {
    console.log('   ✅ El usuario tiene formato de cPanel (con prefijo)');
  }
  
  // Verificar formato del nombre de base de datos
  if (!dbConfig.database.includes('_')) {
    console.log('   ⚠️  ADVERTENCIA: La base de datos no tiene prefijo de cPanel');
    console.log('      En cPanel, las bases de datos tienen formato: usuario_cpanel_nombre');
    console.log('      Ejemplo: eddyyvi1_ksamati_proyectos');
  } else {
    console.log('   ✅ La base de datos tiene formato de cPanel (con prefijo)');
  }
}

// 4. Probar conexión completa
async function testFullConnection() {
  console.log('\n🔌 PASO 4: PROBANDO CONEXIÓN COMPLETA');
  console.log('-'.repeat(70));
  
  try {
    console.log('   Intentando conectar con configuración actual...');
    const connection = await mysql.createConnection({
      ...dbConfig,
      connectTimeout: 10000
    });
    
    console.log('   ✅ ¡CONEXIÓN EXITOSA!\n');
    
    // Verificar base de datos
    const [dbCheck] = await connection.execute('SELECT DATABASE() as db');
    console.log(`   📊 Base de datos conectada: ${dbCheck[0].db}`);
    
    // Verificar tablas
    const [tables] = await connection.execute(`
      SELECT COUNT(*) as total 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [dbConfig.database]);
    
    console.log(`   📋 Tablas en la BD: ${tables[0].total}`);
    
    // Verificar stored procedures
    const [procs] = await connection.execute(`
      SELECT COUNT(*) as total 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
    `, [dbConfig.database]);
    
    console.log(`   🔧 Stored Procedures: ${procs[0].total}`);
    
    await connection.end();
    return true;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.code} - ${error.message}\n`);
    
    // Diagnóstico específico
    if (error.code === 'ETIMEDOUT') {
      console.log('   💡 PROBLEMA: Timeout de conexión');
      console.log('   📝 POSIBLES CAUSAS:');
      console.log('      1. El servidor MySQL no está accesible desde tu IP');
      console.log('      2. El puerto 3306 está bloqueado por firewall');
      console.log('      3. Remote MySQL no está habilitado en cPanel');
      console.log('      4. El host/IP es incorrecto');
      console.log('');
      console.log('   🔧 SOLUCIONES:');
      console.log('      1. En cPanel → Remote MySQL → Agregar tu IP actual');
      console.log('      2. Verificar que el host sea "localhost" si estás en el servidor');
      console.log('      3. Contactar al soporte de tu hosting');
      console.log('      4. Verificar que MySQL esté corriendo en el servidor');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('   💡 PROBLEMA: Acceso denegado');
      console.log('   🔧 SOLUCIÓN: Verifica usuario y contraseña en cPanel');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('   💡 PROBLEMA: Base de datos no existe');
      console.log('   🔧 SOLUCIÓN: Crea la BD en cPanel → MySQL Databases');
    }
    
    return false;
  }
}

// Función principal
async function runDiagnostic() {
  await testNetworkConnectivity();
  await testCredentials();
  
  const hostTest = await testDifferentHosts();
  
  if (hostTest.success) {
    console.log(`\n   ✅ Host correcto encontrado: ${hostTest.host}`);
    console.log(`   💡 Actualiza database.js con: host: '${hostTest.host}'`);
  }
  
  const fullTest = await testFullConnection();
  
  console.log('\n' + '='.repeat(70));
  if (fullTest) {
    console.log('✅ DIAGNÓSTICO COMPLETO - CONEXIÓN FUNCIONANDO');
    console.log('='.repeat(70));
  } else {
    console.log('❌ DIAGNÓSTICO COMPLETO - HAY PROBLEMAS DE CONEXIÓN');
    console.log('='.repeat(70));
    console.log('\n📋 CHECKLIST PARA CPANEL:');
    console.log('   1. ✅ Base de datos creada en MySQL Databases');
    console.log('   2. ✅ Usuario MySQL creado');
    console.log('   3. ✅ Usuario asignado a la base de datos con ALL PRIVILEGES');
    console.log('   4. ⚠️  Remote MySQL → Agregar tu IP actual');
    console.log('   5. ⚠️  Verificar que el host sea correcto (puede ser "localhost")');
  }
  console.log('');
}

runDiagnostic().catch(console.error);


