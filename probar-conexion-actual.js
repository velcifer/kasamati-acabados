// 🔍 PROBAR CONEXIÓN ACTUAL DE database.js
// Ejecutar: node probar-conexion-actual.js

require('dotenv').config();
const { testConnection, dbConfig } = require('./server/config/database');

async function probarConexion() {
  console.log('🔍 PROBANDO CONEXIÓN ACTUAL\n');
  console.log('='.repeat(70));
  console.log('📊 CONFIGURACIÓN ACTUAL:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Puerto: ${dbConfig.port}`);
  console.log(`   Usuario: ${dbConfig.user}`);
  console.log(`   Base de datos: ${dbConfig.database}`);
  console.log('='.repeat(70));
  console.log('');

  try {
    console.log('⏳ Probando conexión...');
    const conectado = await testConnection();
    
    if (conectado) {
      console.log('\n' + '='.repeat(70));
      console.log('✅ ¡CONEXIÓN EXITOSA!');
      console.log('='.repeat(70));
      console.log(`\n🎉 La conexión está ACTIVA y funcionando correctamente.\n`);
      return true;
    } else {
      console.log('\n' + '='.repeat(70));
      console.log('❌ CONEXIÓN FALLIDA');
      console.log('='.repeat(70));
      console.log(`\n⚠️  No se pudo conectar al servidor.\n`);
      return false;
    }
  } catch (error) {
    console.log('\n' + '='.repeat(70));
    console.log('❌ ERROR DE CONEXIÓN');
    console.log('='.repeat(70));
    console.log(`\n   Código: ${error.code || 'N/A'}`);
    console.log(`   Mensaje: ${error.message}\n`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 El host no se encuentra. Verifica que el servidor esté activo.');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 Timeout. El servidor no responde o tu IP no está autorizada.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Acceso denegado. Verifica usuario y contraseña.');
    }
    
    console.log('');
    return false;
  }
}

probarConexion()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Error inesperado:', error);
    process.exit(1);
  });


