require('dotenv').config();
const { dbConfig, testConnection } = require('./server/config/database');

(async () => {
  console.log('\n🔍 VERIFICANDO CONEXIÓN A BD REMOTA\n');
  console.log('Configuración:');
  console.log(`  Host: ${dbConfig.host}`);
  console.log(`  Puerto: ${dbConfig.port}`);
  console.log(`  Base de datos: ${dbConfig.database}`);
  console.log(`  Usuario: ${dbConfig.user}\n`);
  
  const connected = await testConnection();
  console.log(`\n${connected ? '✅ CONEXIÓN OK' : '❌ CONEXIÓN FALLIDA'}\n`);
  
  if (connected) {
    const { executeQuery } = require('./server/config/database');
    const result = await executeQuery('SELECT COUNT(*) as total FROM proyectos');
    console.log(`📊 Total de proyectos en BD: ${result.rows[0].total}`);
  }
  
  process.exit(connected ? 0 : 1);
})().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});

