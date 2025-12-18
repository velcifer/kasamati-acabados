// 🔍 VERIFICACIÓN COMPLETA DE BASE DE DATOS
// Ejecutar: node verificar-bd-completo.js

require('dotenv').config();
const mysql = require('mysql2/promise');
const { dbConfig } = require('./server/config/database');

async function verificarBDCompleto() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFICACIÓN COMPLETA DE BASE DE DATOS');
  console.log('='.repeat(70));
  console.log('\n📊 CONFIGURACIÓN ACTUAL:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Puerto: ${dbConfig.port}`);
  console.log(`   Usuario: ${dbConfig.user}`);
  console.log(`   Base de datos: ${dbConfig.database}`);
  console.log(`   Password: ${dbConfig.password ? '***' + dbConfig.password.slice(-3) : 'No configurada'}`);
  console.log('\n' + '-'.repeat(70) + '\n');

  let connection = null;

  try {
    // 1. INTENTAR CONEXIÓN
    console.log('⏳ Paso 1: Intentando conectar al servidor...');
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      connectTimeout: 10000,
    });
    console.log('✅ Conexión al servidor MySQL exitosa!\n');

    // 2. VERIFICAR VERSIÓN DE MYSQL
    console.log('⏳ Paso 2: Verificando versión de MySQL...');
    const [versionRows] = await connection.execute('SELECT VERSION() as version, USER() as user, DATABASE() as current_db');
    console.log(`✅ MySQL versión: ${versionRows[0].version}`);
    console.log(`✅ Usuario actual: ${versionRows[0].user}`);
    console.log(`✅ Base de datos actual: ${versionRows[0].current_db || '(ninguna)'}\n`);

    // 3. VERIFICAR SI LA BASE DE DATOS EXISTE
    console.log('⏳ Paso 3: Verificando si la base de datos existe...');
    const [dbRows] = await connection.execute(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbConfig.database]
    );
    
    if (dbRows.length === 0) {
      console.log(`⚠️  La base de datos "${dbConfig.database}" NO existe en el servidor.\n`);
      console.log('📋 Bases de datos disponibles:');
      const [allDbs] = await connection.execute('SHOW DATABASES');
      allDbs.forEach(db => {
        console.log(`   - ${db.Database}`);
      });
      console.log('');
    } else {
      console.log(`✅ La base de datos "${dbConfig.database}" existe.\n`);
    }

    // 4. CONECTAR A LA BASE DE DATOS ESPECÍFICA
    console.log('⏳ Paso 4: Conectando a la base de datos específica...');
    await connection.changeUser({ database: dbConfig.database });
    console.log(`✅ Conectado a la base de datos "${dbConfig.database}"\n`);

    // 5. VERIFICAR TABLAS
    console.log('⏳ Paso 5: Verificando tablas en la base de datos...');
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('⚠️  No se encontraron tablas en la base de datos.\n');
    } else {
      console.log(`✅ Se encontraron ${tables.length} tabla(s):\n`);
      const tableNameKey = Object.keys(tables[0])[0];
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table[tableNameKey]}`);
      });
      console.log('');
    }

    // 6. VERIFICAR TABLAS ESPECÍFICAS DEL PROYECTO
    console.log('⏳ Paso 6: Verificando tablas principales del proyecto...');
    const tablasEsperadas = [
      'proyectos',
      'proyecto_categorias',
      'proyecto_detalles',
      'categorias',
      'ventas',
      'compras',
      'cobranzas',
      'pagos',
      'usuarios',
      'configuraciones',
      'auditoria',
      'proyecto_archivos'
    ];

    const [existingTables] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [dbConfig.database]
    );
    const nombresTablas = existingTables.map(t => t.TABLE_NAME);

    console.log('\n📊 Estado de las tablas esperadas:');
    tablasEsperadas.forEach(tabla => {
      const existe = nombresTablas.includes(tabla);
      console.log(`   ${existe ? '✅' : '❌'} ${tabla}`);
    });
    console.log('');

    // 7. VERIFICAR PERMISOS DEL USUARIO
    console.log('⏳ Paso 7: Verificando permisos del usuario...');
    const [grants] = await connection.execute('SHOW GRANTS');
    console.log('✅ Permisos del usuario:');
    grants.forEach((grant, index) => {
      console.log(`   ${index + 1}. ${grant[Object.keys(grant)[0]]}`);
    });
    console.log('');

    // 8. PRUEBA DE CONSULTA SIMPLE
    console.log('⏳ Paso 8: Ejecutando consulta de prueba...');
    try {
      const [testRows] = await connection.execute('SELECT COUNT(*) as total FROM proyectos');
      console.log(`✅ Consulta exitosa. Total de proyectos: ${testRows[0].total}\n`);
    } catch (error) {
      console.log(`⚠️  No se pudo ejecutar consulta de prueba: ${error.message}\n`);
    }

    // RESULTADO FINAL
    console.log('='.repeat(70));
    console.log('✅ VERIFICACIÓN COMPLETA: CONEXIÓN FUNCIONANDO CORRECTAMENTE');
    console.log('='.repeat(70));
    console.log('\n🎉 La base de datos está lista para usar.\n');

    await connection.end();
    return true;

  } catch (error) {
    console.log('\n' + '='.repeat(70));
    console.log('❌ ERROR EN LA VERIFICACIÓN');
    console.log('='.repeat(70));
    console.log(`\n   Código: ${error.code || 'N/A'}`);
    console.log(`   Mensaje: ${error.message}\n`);

    if (error.code === 'ENOTFOUND') {
      console.log('💡 DIAGNÓSTICO: El host no se encuentra.');
      console.log('   - Verifica que el servidor esté activo');
      console.log('   - Verifica que el nombre del host sea correcto');
      console.log('   - Verifica tu conexión a internet\n');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 DIAGNÓSTICO: Timeout de conexión.');
      console.log('   - El servidor no responde');
      console.log('   - Tu IP puede no estar autorizada (Remote MySQL)');
      console.log('   - El firewall puede estar bloqueando la conexión\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 DIAGNÓSTICO: Acceso denegado.');
      console.log('   - Verifica que el usuario y contraseña sean correctos');
      console.log('   - Verifica que el usuario tenga permisos para acceder desde tu IP\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 DIAGNÓSTICO: Base de datos no existe.');
      console.log('   - La base de datos especificada no existe en el servidor');
      console.log('   - Necesitas crearla primero en phpMyAdmin\n');
    } else {
      console.log('💡 Revisa la configuración en server/config/database.js\n');
    }

    if (connection) {
      await connection.end();
    }
    return false;
  }
}

verificarBDCompleto()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Error inesperado:', error);
    process.exit(1);
  });

