// 🔍 VALIDAR CONEXIÓN A BASE DE DATOS REMOTA
// Ejecutar: node test-remote-connection.js

require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuración actual de database.js (servidor remoto)
const dbConfig = {
  host: process.env.DB_HOST || 'sql10.freesqldatabase.com',
  user: process.env.DB_USER || 'sql10811701',
  password: process.env.DB_PASSWORD || 'CgENXm4dud',
  database: process.env.DB_NAME || 'sql10811701',
  port: process.env.DB_PORT || 3306,
  connectTimeout: 15000, // 15 segundos
  timezone: '+00:00',
  charset: 'utf8mb4'
};

async function testRemoteConnection() {
  console.log('🔍 VALIDANDO CONEXIÓN A BASE DE DATOS REMOTA\n');
  console.log('='.repeat(70));
  console.log('📊 CONFIGURACIÓN DE CONEXIÓN REMOTA:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Puerto: ${dbConfig.port}`);
  console.log(`   Usuario: ${dbConfig.user}`);
  console.log(`   Base de datos: ${dbConfig.database}`);
  console.log(`   Password: ${'*'.repeat(dbConfig.password.length)}`);
  console.log('='.repeat(70));
  console.log('');

  let connection;
  
  try {
    console.log('⏳ Intentando conectar al servidor remoto...');
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ ¡CONEXIÓN EXITOSA AL SERVIDOR REMOTO!\n');

    // 1. Verificar información del servidor
    console.log('📊 INFORMACIÓN DEL SERVIDOR REMOTO:');
    console.log('-'.repeat(70));
    
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    console.log(`   MySQL Versión: ${versionRows[0].version}`);
    
    const [dbInfo] = await connection.execute('SELECT DATABASE() as db');
    console.log(`   Base de datos conectada: ${dbInfo[0].db}`);
    
    const [userInfo] = await connection.execute('SELECT USER() as user');
    console.log(`   Usuario conectado: ${userInfo[0].user}`);
    console.log('');

    // 2. Verificar que la base de datos existe y tiene tablas
    console.log('📋 VERIFICANDO TABLAS EN LA BASE DE DATOS REMOTA:');
    console.log('-'.repeat(70));
    
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, 
             ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS SIZE_MB
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);

    if (tables.length === 0) {
      console.log('   ⚠️  No se encontraron tablas en la base de datos');
      console.log('   💡 La base de datos existe pero está vacía');
    } else {
      console.log(`   ✅ Se encontraron ${tables.length} tablas:\n`);
      tables.forEach((table, index) => {
        const rows = table.TABLE_ROWS || 0;
        const size = table.SIZE_MB || 0;
        const status = rows > 0 ? '📊' : '📭';
        console.log(`   ${status} ${String(index + 1).padStart(2, ' ')}. ${table.TABLE_NAME.padEnd(35)} - ${rows.toLocaleString()} registros (${size} MB)`);
      });
    }
    console.log('');

    // 3. Verificar stored procedures
    console.log('🔧 VERIFICANDO STORED PROCEDURES:');
    console.log('-'.repeat(70));
    const [procedures] = await connection.execute(`
      SELECT ROUTINE_NAME 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
      ORDER BY ROUTINE_NAME
    `, [dbConfig.database]);

    if (procedures.length === 0) {
      console.log('   ⚠️  No se encontraron stored procedures');
    } else {
      console.log(`   ✅ Se encontraron ${procedures.length} stored procedures:\n`);
      procedures.forEach((proc, index) => {
        console.log(`   ${String(index + 1).padStart(2, ' ')}. ${proc.ROUTINE_NAME}`);
      });
    }
    console.log('');

    // 4. Verificar triggers
    console.log('🎯 VERIFICANDO TRIGGERS:');
    console.log('-'.repeat(70));
    const [triggers] = await connection.execute(`
      SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
      FROM INFORMATION_SCHEMA.TRIGGERS 
      WHERE TRIGGER_SCHEMA = ?
      ORDER BY TRIGGER_NAME
    `, [dbConfig.database]);

    if (triggers.length === 0) {
      console.log('   ⚠️  No se encontraron triggers');
    } else {
      console.log(`   ✅ Se encontraron ${triggers.length} triggers:\n`);
      triggers.forEach((trigger, index) => {
        console.log(`   ${String(index + 1).padStart(2, ' ')}. ${trigger.TRIGGER_NAME} (${trigger.EVENT_MANIPULATION} on ${trigger.EVENT_OBJECT_TABLE})`);
      });
    }
    console.log('');

    // 5. Probar consultas en tablas principales
    console.log('🧪 PROBANDO CONSULTAS EN TABLAS PRINCIPALES:');
    console.log('-'.repeat(70));
    
    const tablasPrincipales = ['proyectos', 'ventas', 'proyecto_categorias'];
    
    for (const tabla of tablasPrincipales) {
      try {
        const [result] = await connection.execute(`SELECT COUNT(*) as total FROM ${tabla}`);
        console.log(`   ✅ Tabla '${tabla}': ${result[0].total.toLocaleString()} registros`);
      } catch (err) {
        if (err.code === 'ER_NO_SUCH_TABLE') {
          console.log(`   ❌ Tabla '${tabla}': No existe`);
        } else {
          console.log(`   ⚠️  Tabla '${tabla}': ${err.message}`);
        }
      }
    }
    console.log('');

    // 6. Verificar latencia de conexión
    console.log('⏱️  PRUEBA DE LATENCIA:');
    console.log('-'.repeat(70));
    const startTime = Date.now();
    await connection.execute('SELECT 1');
    const latency = Date.now() - startTime;
    console.log(`   Tiempo de respuesta: ${latency}ms`);
    
    if (latency < 100) {
      console.log('   ✅ Latencia excelente (< 100ms)');
    } else if (latency < 500) {
      console.log('   ✅ Latencia buena (< 500ms)');
    } else if (latency < 1000) {
      console.log('   ⚠️  Latencia aceptable (< 1s)');
    } else {
      console.log('   ⚠️  Latencia alta (> 1s)');
    }
    console.log('');

    // 7. Verificar permisos del usuario
    console.log('🔐 VERIFICANDO PERMISOS DEL USUARIO:');
    console.log('-'.repeat(70));
    try {
      const [grants] = await connection.execute(`SHOW GRANTS`);
      console.log(`   Permisos del usuario:\n`);
      grants.forEach((grant, index) => {
        console.log(`   ${String(index + 1).padStart(2, ' ')}. ${grant[Object.keys(grant)[0]]}`);
      });
    } catch (err) {
      console.log(`   ⚠️  No se pudieron obtener los permisos: ${err.message}`);
    }
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ VALIDACIÓN COMPLETA - CONEXIÓN REMOTA FUNCIONANDO CORRECTAMENTE');
    console.log('='.repeat(70));
    console.log('\n🎉 La base de datos remota está activa y accesible.\n');

    await connection.end();
    return true;

  } catch (error) {
    console.log('');
    console.log('='.repeat(70));
    console.log('❌ ERROR DE CONEXIÓN AL SERVIDOR REMOTO');
    console.log('='.repeat(70));
    console.log(`   Código de error: ${error.code}`);
    console.log(`   Mensaje: ${error.message}`);
    console.log('');

    // Mensajes de ayuda según el tipo de error
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 PROBLEMA: Conexión rechazada');
      console.log('   Posibles causas:');
      console.log('   1. El servidor MySQL no está corriendo');
      console.log('   2. El puerto 3306 está bloqueado por firewall');
      console.log('   3. El host/IP es incorrecto');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 PROBLEMA: Acceso denegado');
      console.log('   Posibles causas:');
      console.log('   1. Usuario o contraseña incorrectos');
      console.log('   2. El usuario no tiene permisos para conectarse desde tu IP');
      console.log('   3. Remote MySQL no está habilitado en cPanel');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 PROBLEMA: Base de datos no existe');
      console.log('   Solución: Crea la base de datos en cPanel MySQL Databases');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 PROBLEMA: Timeout de conexión');
      console.log('   Posibles causas:');
      console.log('   1. El servidor no responde (puede estar caído)');
      console.log('   2. Tu IP no está autorizada en Remote MySQL');
      console.log('   3. Problemas de red o firewall');
      console.log('   4. El servidor está sobrecargado');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 PROBLEMA: Host no encontrado');
      console.log('   Solución: Verifica que el host/IP sea correcto');
    } else {
      console.log('💡 PROBLEMA: Error desconocido');
      console.log('   Revisa la configuración en server/config/database.js');
    }

    console.log('');
    console.log('='.repeat(70));
    
    if (connection) {
      await connection.end();
    }
    return false;
  }
}

// Ejecutar la validación
testRemoteConnection()
  .then(success => {
    if (success) {
      console.log('✅ La conexión remota está funcionando correctamente.');
      process.exit(0);
    } else {
      console.log('❌ La conexión remota falló. Revisa los errores arriba.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Error inesperado:', error);
    process.exit(1);
  });

