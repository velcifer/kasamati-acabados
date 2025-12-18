require('dotenv').config();
const mysql = require('mysql2/promise');
const { dbConfig } = require('./server/config/database');

(async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFICANDO STORED PROCEDURES Y TRIGGERS EN BD REMOTA');
  console.log('='.repeat(70));
  console.log(`\n📊 Configuración:`);
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Puerto: ${dbConfig.port}`);
  console.log(`   Base de datos: ${dbConfig.database}`);
  console.log(`   Usuario: ${dbConfig.user}\n`);

  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database
  });

  // Verificar versión de MySQL
  const [version] = await connection.execute('SELECT VERSION() as version');
  console.log(`🐬 MySQL versión: ${version[0].version}\n`);

  // Verificar stored procedures
  console.log('📋 STORED PROCEDURES:');
  console.log('-'.repeat(70));
  const [procedures] = await connection.execute(`
    SELECT ROUTINE_NAME, ROUTINE_DEFINITION 
    FROM INFORMATION_SCHEMA.ROUTINES 
    WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
    ORDER BY ROUTINE_NAME
  `, [dbConfig.database]);

  if (procedures.length === 0) {
    console.log('   ❌ NO se encontraron stored procedures');
  } else {
    console.log(`   ✅ Se encontraron ${procedures.length} stored procedures:\n`);
    procedures.forEach((proc, index) => {
      console.log(`   ${index + 1}. ${proc.ROUTINE_NAME}`);
      // Verificar si tiene definición (puede estar NULL en algunas versiones)
      if (proc.ROUTINE_DEFINITION) {
        console.log(`      Definición: ${proc.ROUTINE_DEFINITION.substring(0, 100)}...`);
      }
    });
  }

  // Verificar triggers
  console.log('\n🎯 TRIGGERS:');
  console.log('-'.repeat(70));
  const [triggers] = await connection.execute(`
    SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_STATEMENT
    FROM INFORMATION_SCHEMA.TRIGGERS 
    WHERE TRIGGER_SCHEMA = ?
    ORDER BY TRIGGER_NAME
  `, [dbConfig.database]);

  if (triggers.length === 0) {
    console.log('   ❌ NO se encontraron triggers');
  } else {
    console.log(`   ✅ Se encontraron ${triggers.length} triggers:\n`);
    triggers.forEach((trigger, index) => {
      console.log(`   ${index + 1}. ${trigger.TRIGGER_NAME}`);
      console.log(`      Evento: ${trigger.EVENT_MANIPULATION} on ${trigger.EVENT_OBJECT_TABLE}`);
      if (trigger.ACTION_STATEMENT) {
        const action = trigger.ACTION_STATEMENT.substring(0, 150);
        console.log(`      Acción: ${action}...`);
      }
    });
  }

  // Probar ejecutar un stored procedure manualmente
  console.log('\n🧪 PROBANDO EJECUCIÓN DE STORED PROCEDURE:');
  console.log('-'.repeat(70));
  try {
    // Primero crear un proyecto de prueba si no existe
    const [testProj] = await connection.execute(`
      SELECT id FROM proyectos ORDER BY id DESC LIMIT 1
    `);
    
    if (testProj.length > 0) {
      const testId = testProj[0].id;
      console.log(`   Probando con proyecto ID: ${testId}`);
      const [spResult] = await connection.execute('CALL CalcularCamposAutomaticosProyecto(?)', [testId]);
      console.log(`   ✅ Stored procedure ejecutado exitosamente`);
      console.log(`   📊 Resultado:`, JSON.stringify(spResult, null, 2));
    } else {
      console.log(`   ⚠️  No hay proyectos en la BD para probar el stored procedure`);
    }
  } catch (error) {
    console.error(`   ❌ Error ejecutando stored procedure:`, error.message);
    console.error(`   Código:`, error.code);
    console.error(`   SQL State:`, error.sqlState);
  }

  await connection.end();
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Verificación completada');
  console.log('='.repeat(70) + '\n');
  
})().catch(err => {
  console.error('\n❌ Error:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

