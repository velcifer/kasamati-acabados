require('dotenv').config();
const mysql = require('mysql2/promise');
const { dbConfig } = require('./server/config/database');

(async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 DIAGNÓSTICO COMPLETO DE GUARDADO EN BD REMOTA');
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

  try {
    // 1. Verificar versión MySQL
    const [version] = await connection.execute('SELECT VERSION() as version');
    console.log(`🐬 MySQL versión: ${version[0].version}\n`);

    // 2. Verificar que existe la tabla proyectos
    console.log('📋 VERIFICANDO TABLA proyectos:');
    console.log('-'.repeat(70));
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'proyectos'
    `, [dbConfig.database]);
    
    if (tables.length === 0) {
      console.log('   ❌ ERROR: La tabla proyectos NO existe');
      await connection.end();
      process.exit(1);
    } else {
      console.log('   ✅ Tabla proyectos existe');
    }

    // 3. Verificar stored procedure
    console.log('\n🔧 VERIFICANDO STORED PROCEDURE:');
    console.log('-'.repeat(70));
    const [procs] = await connection.execute(`
      SELECT ROUTINE_NAME, ROUTINE_DEFINITION
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = ? 
        AND ROUTINE_TYPE = 'PROCEDURE'
        AND ROUTINE_NAME = 'CalcularCamposAutomaticosProyecto'
    `, [dbConfig.database]);
    
    if (procs.length === 0) {
      console.log('   ❌ ERROR: El stored procedure NO existe');
    } else {
      console.log('   ✅ Stored procedure existe');
    }

    // 4. Probar INSERT directo (sin stored procedure)
    console.log('\n🧪 PROBANDO INSERT DIRECTO (sin stored procedure):');
    console.log('-'.repeat(70));
    try {
      const [insertResult] = await connection.execute(`
        INSERT INTO proyectos (
          numero_proyecto, nombre_proyecto, nombre_cliente,
          estado_proyecto, tipo_proyecto, monto_contrato,
          presupuesto_proyecto, adelantos_cliente
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        9999, // numero_proyecto de prueba
        'PROYECTO TEST DIAGNOSTICO',
        'CLIENTE TEST',
        'Ejecucion',
        'Recibo',
        10000.00,
        12000.00,
        2000.00
      ]);
      
      const testId = insertResult.insertId;
      console.log(`   ✅ INSERT exitoso - ID creado: ${testId}`);
      
      // Verificar que se guardó
      const [verify] = await connection.execute(
        'SELECT * FROM proyectos WHERE id = ?',
        [testId]
      );
      
      if (verify.length > 0) {
        console.log(`   ✅ Verificación: Proyecto ${testId} existe en BD`);
        console.log(`      Nombre: ${verify[0].nombre_proyecto}`);
      } else {
        console.log(`   ❌ ERROR: Proyecto ${testId} NO se encontró después de crearlo`);
      }
      
      // Probar stored procedure manualmente
      console.log('\n🧪 PROBANDO STORED PROCEDURE MANUALMENTE:');
      console.log('-'.repeat(70));
      try {
        const [spResult] = await connection.execute(
          'CALL CalcularCamposAutomaticosProyecto(?)',
          [testId]
        );
        console.log(`   ✅ Stored procedure ejecutado exitosamente`);
        console.log(`   📊 Resultado:`, JSON.stringify(spResult, null, 2));
        
        // Verificar que los campos se calcularon
        const [afterSP] = await connection.execute(
          'SELECT balance_proyecto, saldos_cobrar_proyecto FROM proyectos WHERE id = ?',
          [testId]
        );
        if (afterSP.length > 0) {
          console.log(`   ✅ Campos calculados:`);
          console.log(`      balance_proyecto: ${afterSP[0].balance_proyecto}`);
          console.log(`      saldos_cobrar_proyecto: ${afterSP[0].saldos_cobrar_proyecto}`);
        }
      } catch (spError) {
        console.error(`   ❌ ERROR ejecutando stored procedure:`);
        console.error(`      Mensaje: ${spError.message}`);
        console.error(`      Código: ${spError.code}`);
        console.error(`      SQL State: ${spError.sqlState}`);
        console.error(`      Stack: ${spError.stack}`);
      }
      
      // Limpiar - eliminar proyecto de prueba
      await connection.execute('DELETE FROM proyectos WHERE id = ?', [testId]);
      console.log(`\n   🧹 Proyecto de prueba eliminado`);
      
    } catch (insertError) {
      console.error(`   ❌ ERROR en INSERT:`);
      console.error(`      Mensaje: ${insertError.message}`);
      console.error(`      Código: ${insertError.code}`);
      console.error(`      SQL State: ${insertError.sqlState}`);
      console.error(`      Stack: ${insertError.stack}`);
    }

    // 5. Verificar triggers
    console.log('\n🎯 VERIFICANDO TRIGGERS:');
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
        console.log(`   ${index + 1}. ${trigger.TRIGGER_NAME} (${trigger.EVENT_MANIPULATION} on ${trigger.EVENT_OBJECT_TABLE})`);
      });
    }

    await connection.end();
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Diagnóstico completado');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error general:', error.message);
    console.error('Stack:', error.stack);
    await connection.end();
    process.exit(1);
  }
})().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});

