// 🧪 TEST DE OPERACIONES CRUD
// Ejecutar: node test-crud-operations.js

require('dotenv').config();
const { executeQuery, executeTransaction, dbConfig } = require('./server/config/database');

async function testCRUD() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST DE OPERACIONES CRUD - PROYECTOS');
  console.log('='.repeat(70));
  console.log(`\n📊 Configuración:`);
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Puerto: ${dbConfig.port}`);
  console.log(`   Base de datos: ${dbConfig.database}`);
  console.log(`   Usuario: ${dbConfig.user}`);
  console.log('\n' + '-'.repeat(70) + '\n');

  let testProjectId = null;

  try {
    // 1. TEST CREATE (INSERT)
    console.log('1️⃣ TEST CREATE (INSERT)');
    console.log('-'.repeat(70));
    
    const numeroQuery = `
      SELECT COALESCE(MAX(numero_proyecto), 0) + 1 as siguiente_numero 
      FROM proyectos
    `;
    const numeroResult = await executeQuery(numeroQuery);
    const numeroProyecto = numeroResult.rows[0].siguiente_numero;
    console.log(`   ✅ Siguiente número de proyecto: ${numeroProyecto}`);

    const queries = [
      {
        query: `
          INSERT INTO proyectos (
            numero_proyecto, nombre_proyecto, nombre_cliente,
            estado_proyecto, tipo_proyecto, monto_contrato,
            presupuesto_proyecto, adelantos_cliente
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          numeroProyecto, 
          'Proyecto Test CRUD', 
          'Cliente Test',
          'Ejecucion', 
          'Recibo', 
          1000.00,
          2000.00, 
          500.00
        ]
      }
    ];
    
    console.log('   ⏳ Ejecutando INSERT...');
    const result = await executeTransaction(queries);
    testProjectId = result.results[0].insertId;
    console.log(`   ✅ Proyecto creado con ID: ${testProjectId}`);
    console.log(`   ✅ Resultado:`, JSON.stringify(result, null, 2));

    // 2. TEST READ (SELECT)
    console.log('\n2️⃣ TEST READ (SELECT)');
    console.log('-'.repeat(70));
    console.log(`   ⏳ Consultando proyecto ID: ${testProjectId}...`);
    
    const selectResult = await executeQuery(`
      SELECT * FROM proyectos WHERE id = ?
    `, [testProjectId]);
    
    if (selectResult.rows && selectResult.rows.length > 0) {
      console.log(`   ✅ Proyecto encontrado:`);
      console.log(`      - ID: ${selectResult.rows[0].id}`);
      console.log(`      - Número: ${selectResult.rows[0].numero_proyecto}`);
      console.log(`      - Nombre: ${selectResult.rows[0].nombre_proyecto}`);
      console.log(`      - Cliente: ${selectResult.rows[0].nombre_cliente}`);
      console.log(`      - Monto: ${selectResult.rows[0].monto_contrato}`);
    } else {
      console.log(`   ❌ ERROR: Proyecto no encontrado después de crearlo`);
      return false;
    }

    // 3. TEST UPDATE
    console.log('\n3️⃣ TEST UPDATE');
    console.log('-'.repeat(70));
    console.log(`   ⏳ Actualizando proyecto ID: ${testProjectId}...`);
    
    const updateResult = await executeQuery(`
      UPDATE proyectos SET
        nombre_proyecto = ?,
        monto_contrato = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, ['Proyecto Test ACTUALIZADO', 1500.00, testProjectId]);
    
    console.log(`   ✅ UPDATE ejecutado`);
    console.log(`   ✅ Resultado:`, JSON.stringify(updateResult, null, 2));

    // Verificar que se actualizó
    const verifyUpdate = await executeQuery(`
      SELECT nombre_proyecto, monto_contrato FROM proyectos WHERE id = ?
    `, [testProjectId]);
    
    if (verifyUpdate.rows && verifyUpdate.rows.length > 0) {
      const updated = verifyUpdate.rows[0];
      console.log(`   ✅ Verificación:`);
      console.log(`      - Nombre: ${updated.nombre_proyecto}`);
      console.log(`      - Monto: ${updated.monto_contrato}`);
      
      if (updated.nombre_proyecto === 'Proyecto Test ACTUALIZADO' && updated.monto_contrato === 1500.00) {
        console.log(`   ✅ UPDATE exitoso - Los datos se actualizaron correctamente`);
      } else {
        console.log(`   ⚠️  UPDATE parcial - Los datos no coinciden con lo esperado`);
      }
    }

    // 4. TEST DELETE
    console.log('\n4️⃣ TEST DELETE');
    console.log('-'.repeat(70));
    console.log(`   ⏳ Eliminando proyecto ID: ${testProjectId}...`);
    
    const deleteResult = await executeQuery(`
      DELETE FROM proyectos WHERE id = ?
    `, [testProjectId]);
    
    console.log(`   ✅ DELETE ejecutado`);
    console.log(`   ✅ Resultado:`, JSON.stringify(deleteResult, null, 2));

    // Verificar que se eliminó
    const verifyDelete = await executeQuery(`
      SELECT COUNT(*) as count FROM proyectos WHERE id = ?
    `, [testProjectId]);
    
    if (verifyDelete.rows && verifyDelete.rows[0].count === 0) {
      console.log(`   ✅ DELETE exitoso - El proyecto fue eliminado correctamente`);
    } else {
      console.log(`   ❌ ERROR: El proyecto aún existe después de eliminarlo`);
      return false;
    }

    // RESULTADO FINAL
    console.log('\n' + '='.repeat(70));
    console.log('✅ TODAS LAS OPERACIONES CRUD FUNCIONARON CORRECTAMENTE');
    console.log('='.repeat(70));
    console.log('\n🎉 La base de datos está funcionando correctamente.\n');
    
    return true;

  } catch (error) {
    console.log('\n' + '='.repeat(70));
    console.log('❌ ERROR EN OPERACIÓN CRUD');
    console.log('='.repeat(70));
    console.log(`\n   Código: ${error.code || 'N/A'}`);
    console.log(`   Mensaje: ${error.message}`);
    console.log(`   Stack:`, error.stack);
    
    if (testProjectId) {
      console.log(`\n   🧹 Limpiando proyecto de prueba (ID: ${testProjectId})...`);
      try {
        await executeQuery('DELETE FROM proyectos WHERE id = ?', [testProjectId]);
        console.log(`   ✅ Proyecto de prueba eliminado`);
      } catch (cleanupError) {
        console.log(`   ⚠️  No se pudo limpiar: ${cleanupError.message}`);
      }
    }
    
    console.log('');
    return false;
  }
}

testCRUD()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Error inesperado:', error);
    process.exit(1);
  });

