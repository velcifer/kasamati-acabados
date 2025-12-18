// 🔍 SCRIPT DE VERIFICACIÓN DE CONEXIÓN A CPANEL PHPMYADMIN
// Ejecutar con: node test-cpanel-connection.js

require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuración de conexión (igual que en database.js)
const dbConfig = {
  host: process.env.DB_HOST || '169.60.159.40',
  user: process.env.DB_USER || 'eddyyvi1',
  password: process.env.DB_PASSWORD || '3DqAiEREKC!fiqD',
  database: process.env.DB_NAME || 'eddyyvi1_ksamati_proyectos',
  port: process.env.DB_PORT || 3306,
  connectTimeout: 10000, // 10 segundos
  timezone: '+00:00',
  charset: 'utf8mb4'
};

async function testConnection() {
  let connection;
  
  console.log('🔍 VERIFICANDO CONEXIÓN A CPANEL PHPMYADMIN...\n');
  console.log('='.repeat(60));
  console.log('📊 CONFIGURACIÓN DE CONEXIÓN:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Puerto: ${dbConfig.port}`);
  console.log(`   Usuario: ${dbConfig.user}`);
  console.log(`   Base de datos: ${dbConfig.database}`);
  console.log(`   Password: ${'*'.repeat(dbConfig.password.length)}`);
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Intentar conectar
    console.log('⏳ Intentando conectar...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ ¡CONEXIÓN EXITOSA!\n');
    
    // 1. Verificar versión de MySQL
    console.log('📊 INFORMACIÓN DEL SERVIDOR:');
    console.log('-'.repeat(60));
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    console.log(`   MySQL Versión: ${versionRows[0].version}`);
    
    const [dbInfo] = await connection.execute('SELECT DATABASE() as db');
    console.log(`   Base de datos actual: ${dbInfo[0].db}`);
    console.log('');
    
    // 2. Verificar que la base de datos existe y tiene tablas
    console.log('📋 VERIFICANDO TABLAS EN LA BASE DE DATOS:');
    console.log('-'.repeat(60));
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);

    if (tables.length === 0) {
      console.log('   ⚠️  No se encontraron tablas en la base de datos');
      console.log('   💡 La base de datos existe pero está vacía');
      console.log('   💡 Ejecuta el script COMPLETE_DATABASE_SCHEMA_CPANEL.sql en phpMyAdmin');
    } else {
      console.log(`   ✅ Se encontraron ${tables.length} tablas:\n`);
      tables.forEach((table, index) => {
        const rows = table.TABLE_ROWS || 0;
        const sizeKB = ((table.DATA_LENGTH || 0) + (table.INDEX_LENGTH || 0)) / 1024;
        const status = rows > 0 ? '📊' : '📭';
        console.log(`   ${status} ${String(index + 1).padStart(2, ' ')}. ${table.TABLE_NAME.padEnd(30)} - ${rows} registros (${sizeKB.toFixed(2)} KB)`);
      });
    }
    console.log('');

    // 3. Verificar stored procedures
    console.log('🔧 VERIFICANDO STORED PROCEDURES:');
    console.log('-'.repeat(60));
    const [procedures] = await connection.execute(`
      SELECT ROUTINE_NAME 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
      ORDER BY ROUTINE_NAME
    `, [dbConfig.database]);

    if (procedures.length === 0) {
      console.log('   ⚠️  No se encontraron stored procedures');
      console.log('   💡 Ejecuta el script COMPLETE_DATABASE_SCHEMA_CPANEL.sql en phpMyAdmin');
    } else {
      console.log(`   ✅ Se encontraron ${procedures.length} stored procedures:\n`);
      procedures.forEach((proc, index) => {
        console.log(`   ${String(index + 1).padStart(2, ' ')}. ${proc.ROUTINE_NAME}`);
      });
    }
    console.log('');

    // 4. Verificar triggers
    console.log('🎯 VERIFICANDO TRIGGERS:');
    console.log('-'.repeat(60));
    const [triggers] = await connection.execute(`
      SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
      FROM INFORMATION_SCHEMA.TRIGGERS 
      WHERE TRIGGER_SCHEMA = ?
      ORDER BY TRIGGER_NAME
    `, [dbConfig.database]);
    
    if (triggers.length === 0) {
      console.log('   ⚠️  No se encontraron triggers');
      console.log('   💡 Ejecuta el script COMPLETE_DATABASE_SCHEMA_CPANEL.sql en phpMyAdmin');
    } else {
      console.log(`   ✅ Se encontraron ${triggers.length} triggers:\n`);
      triggers.forEach((trigger, index) => {
        console.log(`   ${String(index + 1).padStart(2, ' ')}. ${trigger.TRIGGER_NAME} (${trigger.EVENT_MANIPULATION} on ${trigger.EVENT_OBJECT_TABLE})`);
      });
    }
    console.log('');
      
    // 5. Probar una consulta simple en una tabla principal
    console.log('🧪 PROBANDO CONSULTAS:');
    console.log('-'.repeat(60));
    
    // Probar tabla proyectos
      try {
        const [proyectos] = await connection.execute('SELECT COUNT(*) as total FROM proyectos');
      console.log(`   ✅ Tabla 'proyectos': ${proyectos[0].total} registros`);
    } catch (err) {
      console.log(`   ❌ Tabla 'proyectos': ${err.message}`);
    }

    // Probar tabla ventas
    try {
      const [ventas] = await connection.execute('SELECT COUNT(*) as total FROM ventas');
      console.log(`   ✅ Tabla 'ventas': ${ventas[0].total} registros`);
    } catch (err) {
      console.log(`   ❌ Tabla 'ventas': ${err.message}`);
    }

    // Probar tabla proyecto_categorias
    try {
      const [categorias] = await connection.execute('SELECT COUNT(*) as total FROM proyecto_categorias');
      console.log(`   ✅ Tabla 'proyecto_categorias': ${categorias[0].total} registros`);
    } catch (err) {
      console.log(`   ❌ Tabla 'proyecto_categorias': ${err.message}`);
      }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ VERIFICACIÓN COMPLETA - CONEXIÓN FUNCIONANDO CORRECTAMENTE');
    console.log('='.repeat(60));
    
    await connection.end();
    return true;
    
  } catch (error) {
    console.log('');
    console.log('='.repeat(60));
    console.log('❌ ERROR DE CONEXIÓN');
    console.log('='.repeat(60));
    console.log(`   Código de error: ${error.code}`);
    console.log(`   Mensaje: ${error.message}`);
    console.log('');
    
    // Mensajes de ayuda según el tipo de error
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 SOLUCIÓN:');
      console.log('   - Verifica que el servidor MySQL esté corriendo');
      console.log('   - Verifica que el puerto 3306 esté abierto');
      console.log('   - Verifica que el host sea correcto');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 SOLUCIÓN:');
      console.log('   - Verifica el usuario y contraseña en database.js');
      console.log('   - Asegúrate de que el usuario tenga permisos en cPanel');
      console.log('   - Verifica que el usuario tenga acceso desde tu IP');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 SOLUCIÓN:');
      console.log('   - La base de datos no existe');
      console.log('   - Crea la base de datos en cPanel MySQL Databases');
      console.log('   - O verifica el nombre de la base de datos');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 SOLUCIÓN:');
      console.log('   - El servidor no responde (timeout)');
      console.log('   - Verifica que el host sea correcto');
      console.log('   - Verifica tu conexión a internet');
      console.log('   - El servidor puede estar bloqueando tu IP');
    } else {
      console.log('💡 SOLUCIÓN:');
      console.log('   - Revisa la configuración en server/config/database.js');
      console.log('   - Verifica las credenciales en cPanel');
      console.log('   - Contacta al soporte de tu hosting si persiste');
    }
    
    console.log('');
    console.log('='.repeat(60));
    
    if (connection) {
      await connection.end();
    }
    return false;
  }
}

// Ejecutar la verificación
testConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 ¡La conexión a cPanel phpMyAdmin está funcionando correctamente!');
      process.exit(0);
    } else {
      console.log('\n⚠️  La conexión falló. Revisa los errores arriba.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Error inesperado:', error);
    process.exit(1);
  });
