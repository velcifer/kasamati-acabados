// 🔍 VERIFICAR CONEXIÓN ACTUAL DE LA APLICACIÓN
// Ejecutar: node verificar-conexion-actual.js

require('dotenv').config();
const { testConnection, dbConfig } = require('./server/config/database');

async function verificarConexion() {
  console.log('🔍 VERIFICANDO CONEXIÓN ACTUAL DE LA APLICACIÓN\n');
  console.log('='.repeat(70));
  console.log('📊 CONFIGURACIÓN ACTUAL EN database.js:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Puerto: ${dbConfig.port}`);
  console.log(`   Usuario: ${dbConfig.user}`);
  console.log(`   Base de datos: ${dbConfig.database}`);
  console.log(`   Password: ${'*'.repeat(dbConfig.password.length)}`);
  console.log('='.repeat(70));
  console.log('');

  // Verificar si usa variables de entorno
  if (process.env.DB_HOST) {
    console.log('📝 Usando variables de entorno (.env):');
    console.log(`   DB_HOST: ${process.env.DB_HOST}`);
    console.log(`   DB_USER: ${process.env.DB_USER}`);
    console.log(`   DB_NAME: ${process.env.DB_NAME || 'no definida'}`);
    console.log('');
  } else {
    console.log('📝 Usando valores por defecto de database.js');
    console.log('');
  }

  // Probar conexión
  console.log('⏳ Probando conexión...\n');
  
  try {
    const conectado = await testConnection();
    
    if (conectado) {
      console.log('='.repeat(70));
      console.log('✅ ¡CONEXIÓN EXITOSA AL SERVIDOR REMOTO!');
      console.log('='.repeat(70));
      console.log(`\n🎉 La aplicación está conectada a:`);
      console.log(`   Host: ${dbConfig.host}`);
      console.log(`   Base de datos: ${dbConfig.database}`);
      console.log(`\n✅ Estado: ACTIVA Y FUNCIONANDO\n`);
      return true;
    } else {
      console.log('='.repeat(70));
      console.log('❌ CONEXIÓN FALLIDA');
      console.log('='.repeat(70));
      return false;
    }
  } catch (error) {
    console.log('='.repeat(70));
    console.log('❌ ERROR DE CONEXIÓN');
    console.log('='.repeat(70));
    console.log(`   Error: ${error.message}`);
    console.log(`   Código: ${error.code || 'N/A'}`);
    console.log('');
    return false;
  }
}

verificarConexion()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Error inesperado:', error);
    process.exit(1);
  });


