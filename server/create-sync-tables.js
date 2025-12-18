// 🔄 Script para crear tablas de sincronización faltantes
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createSyncTables() {
  let connection;
  
  try {
    // Conectar a MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ksamti_proyectos',
      multipleStatements: true
    });

    console.log('✅ Conectado a MySQL');
    console.log(`📊 Base de datos: ${process.env.DB_NAME || 'ksamti_proyectos'}`);

    // Leer el script SQL
    const sqlPath = path.join(__dirname, 'database', 'create_sync_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Ejecutar el script
    console.log('🔄 Creando tablas de sincronización...');
    await connection.query(sql);

    // Verificar que se crearon
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME IN ('data_sync', 'offline_queue', 'sync_conflicts', 'device_sync_status')
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME || 'ksamti_proyectos']);

    console.log('\n✅ Tablas creadas exitosamente:');
    tables.forEach(table => {
      console.log(`   ✓ ${table.TABLE_NAME}`);
    });

    console.log('\n🎉 ¡Listo! Las tablas de sincronización están creadas.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Verifica tus credenciales en server/.env');
      console.error('   Asegúrate de que DB_PASSWORD tenga el valor correcto.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createSyncTables();



