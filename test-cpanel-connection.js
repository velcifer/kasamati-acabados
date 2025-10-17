// 🧪 SCRIPT PARA PROBAR CONEXIÓN A MYSQL DE CPANEL
// Ejecutar: node test-cpanel-connection.js

const mysql = require('mysql2/promise');

// 🔧 CONFIGURACIÓN DE CONEXIÓN A CPANEL
// ⚠️ CAMBIAR ESTOS VALORES POR LOS DATOS REALES DE TU CPANEL
const config = {
  // 🎯 CONFIGURACIÓN PARA EDISONS.XYZ
  host: 'edisons.xyz',  // Tu dominio principal
  
  // 📊 DATOS DE TU BASE DE DATOS
  user: 'eddyyri1_admind',                  // Usuario con prefijo cPanel
  password: 'TU_PASSWORD_ADMIND_AQUI',      // ⚠️ CAMBIAR POR TU PASSWORD REAL
  database: 'eddyyri1_ksamati_proyectos',   // Tu base de datos
  port: 3306,
  
  // ⚙️ CONFIGURACIONES ADICIONALES
  connectTimeout: 20000,
  acquireTimeout: 20000,
  timeout: 20000,
  charset: 'utf8mb4'
};

async function testConnection() {
  console.log('\n🧪 =====================================');
  console.log('   PROBANDO CONEXIÓN A CPANEL MYSQL');
  console.log('   =====================================\n');
  
  console.log('📡 Configuración de conexión:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Usuario: ${config.user}`);
  console.log(`   Base de datos: ${config.database}`);
  console.log(`   Puerto: ${config.port}\n`);
  
  try {
    console.log('🔄 Intentando conectar...');
    const connection = await mysql.createConnection(config);
    
    console.log('✅ ¡Conexión exitosa!');
    
    // 🧪 Probar consulta básica
    console.log('\n🔍 Probando consulta básica...');
    const [rows] = await connection.execute('SELECT VERSION() as version, NOW() as fecha');
    console.log(`🐬 MySQL Versión: ${rows[0].version}`);
    console.log(`📅 Fecha servidor: ${rows[0].fecha}`);
    
    // 🧪 Verificar tablas KSAMATI
    console.log('\n📊 Verificando tablas KSAMATI...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Tablas encontradas: ${tables.length}`);
    
    // Mostrar algunas tablas principales
    const mainTables = tables.filter(t => 
      Object.values(t)[0].includes('proyectos') || 
      Object.values(t)[0].includes('ventas')
    );
    
    if (mainTables.length > 0) {
      console.log('📋 Tablas principales:');
      mainTables.forEach(table => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
      
      // Probar consulta de datos
      try {
        const [proyectos] = await connection.execute('SELECT COUNT(*) as total FROM proyectos');
        console.log(`📈 Total proyectos: ${proyectos[0].total}`);
      } catch (e) {
        console.log('⚠️ No se pudieron contar proyectos (normal si está vacía)');
      }
    }
    
    await connection.end();
    
    console.log('\n🎉 =====================================');
    console.log('   ¡CONEXIÓN EXITOSA!');
    console.log('   Tu aplicación puede conectarse a cPanel');
    console.log('   =====================================\n');
    
  } catch (error) {
    console.error('\n❌ =====================================');
    console.error('   ERROR DE CONEXIÓN');
    console.error('   =====================================');
    console.error(`🚫 Mensaje: ${error.message}`);
    console.error(`🔍 Código: ${error.code}`);
    
    // Diagnósticos específicos
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 SOLUCIONES POSIBLES:');
      console.error('   1. Verificar que el HOST sea correcto');
      console.error('   2. Revisar Remote MySQL en cPanel');
      console.error('   3. El host podría ser:');
      console.error('      - localhost');
      console.error('      - tudominio.com');
      console.error('      - mysql.tudominio.com');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 SOLUCIONES POSIBLES:');
      console.error('   1. Verificar usuario y contraseña');
      console.error('   2. Verificar permisos del usuario en cPanel');
      console.error('   3. Habilitar acceso remoto en cPanel');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 SOLUCIONES POSIBLES:');
      console.error('   1. Verificar que Remote MySQL esté habilitado');
      console.error('   2. Agregar tu IP a Remote MySQL en cPanel');
      console.error('   3. Verificar firewall del hosting');
    }
    
    console.error('\n📞 Si necesitas ayuda, compárteme el error exacto.\n');
  }
}

// Ejecutar test
testConnection();
