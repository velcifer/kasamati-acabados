// 🔍 VERIFICAR CONFIGURACIÓN ACTUAL DEL USUARIO
// Ejecutar: node verificar-usuario-actual.js

require('dotenv').config();
const mysql = require('mysql2/promise');

// Leer la configuración actual de database.js
const dbConfig = {
  host: process.env.DB_HOST || '169.60.159.40',
  user: process.env.DB_USER || 'eddyyvi1_super_admin',  // ✅ Usuario actualizado
  password: process.env.DB_PASSWORD || '3DqAiEREKC!fiqD',
  database: process.env.DB_NAME || 'eddyyvi1_ksamati_proyectos',
  port: process.env.DB_PORT || 3306,
  connectTimeout: 10000,
  timezone: '+00:00',
  charset: 'utf8mb4'
};

async function verificarUsuario() {
  console.log('🔍 VERIFICANDO CONFIGURACIÓN DEL USUARIO\n');
  console.log('='.repeat(70));
  console.log('📊 CONFIGURACIÓN ACTUAL:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Usuario: ${dbConfig.user}`);
  console.log(`   Base de datos: ${dbConfig.database}`);
  console.log(`   Puerto: ${dbConfig.port}`);
  console.log('='.repeat(70));
  console.log('');

  // Verificar formato del usuario
  console.log('✅ VALIDACIÓN DEL FORMATO DEL USUARIO:');
  console.log('-'.repeat(70));
  
  if (dbConfig.user.includes('_')) {
    const parts = dbConfig.user.split('_');
    console.log(`   ✅ Formato correcto: ${parts[0]}_${parts.slice(1).join('_')}`);
    console.log(`   ✅ Prefijo cPanel: ${parts[0]}`);
    console.log(`   ✅ Nombre usuario: ${parts.slice(1).join('_')}`);
  } else {
    console.log(`   ❌ Formato incorrecto: El usuario debe tener formato usuario_cpanel_nombre`);
  }
  
  console.log('');

  // Verificar formato de la base de datos
  console.log('✅ VALIDACIÓN DEL FORMATO DE LA BASE DE DATOS:');
  console.log('-'.repeat(70));
  
  if (dbConfig.database.includes('_')) {
    const parts = dbConfig.database.split('_');
    console.log(`   ✅ Formato correcto: ${parts[0]}_${parts.slice(1).join('_')}`);
    console.log(`   ✅ Prefijo cPanel: ${parts[0]}`);
    console.log(`   ✅ Nombre BD: ${parts.slice(1).join('_')}`);
  } else {
    console.log(`   ❌ Formato incorrecto`);
  }
  
  console.log('');

  // Verificar que el prefijo coincida
  const userPrefix = dbConfig.user.split('_')[0];
  const dbPrefix = dbConfig.database.split('_')[0];
  
  console.log('✅ VALIDACIÓN DE CONSISTENCIA:');
  console.log('-'.repeat(70));
  
  if (userPrefix === dbPrefix) {
    console.log(`   ✅ Los prefijos coinciden: ${userPrefix}`);
    console.log(`   ✅ El usuario y la BD pertenecen al mismo cPanel`);
  } else {
    console.log(`   ⚠️  Los prefijos NO coinciden:`);
    console.log(`      Usuario: ${userPrefix}`);
    console.log(`      Base de datos: ${dbPrefix}`);
  }
  
  console.log('');

  // Probar conexión
  console.log('🔌 PROBANDO CONEXIÓN CON LA CONFIGURACIÓN ACTUAL:');
  console.log('-'.repeat(70));
  
  const hostsToTest = [
    { name: 'IP Actual', host: dbConfig.host },
    { name: 'localhost', host: 'localhost' },
  ];

  let conexionExitosa = false;
  
  for (const testHost of hostsToTest) {
    try {
      console.log(`\n   Probando con host: ${testHost.name} (${testHost.host})...`);
      const testConfig = { ...dbConfig, host: testHost.host, connectTimeout: 10000 };
      const connection = await mysql.createConnection(testConfig);
      
      console.log(`   ✅ ¡CONEXIÓN EXITOSA con ${testHost.name}!`);
      
      // Verificar información del servidor
      const [version] = await connection.execute('SELECT VERSION() as v, DATABASE() as db, USER() as user');
      console.log(`   📊 MySQL Versión: ${version[0].v}`);
      console.log(`   📊 Base de datos: ${version[0].db}`);
      console.log(`   📊 Usuario conectado: ${version[0].user}`);
      
      // Verificar tablas
      const [tables] = await connection.execute(`
        SELECT COUNT(*) as total 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = ?
      `, [dbConfig.database]);
      
      console.log(`   📋 Tablas en la BD: ${tables[0].total}`);
      
      // Verificar stored procedures
      const [procs] = await connection.execute(`
        SELECT COUNT(*) as total 
        FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
      `, [dbConfig.database]);
      
      console.log(`   🔧 Stored Procedures: ${procs[0].total}`);
      
      await connection.end();
      conexionExitosa = true;
      
      console.log('\n   💡 RECOMENDACIÓN:');
      console.log(`      Actualiza database.js con: host: '${testHost.host}'`);
      
      break;
      
    } catch (error) {
      console.log(`   ❌ Falló: ${error.code} - ${error.message}`);
      
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log(`   💡 El usuario o contraseña pueden ser incorrectos`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   💡 El servidor no responde (posible problema de Remote MySQL)`);
      }
    }
  }
  
  console.log('');
  console.log('='.repeat(70));
  
  if (conexionExitosa) {
    console.log('✅ VERIFICACIÓN COMPLETA - USUARIO CONFIGURADO CORRECTAMENTE');
    console.log('='.repeat(70));
    console.log('\n🎉 ¡El usuario está bien configurado y la conexión funciona!');
  } else {
    console.log('❌ VERIFICACIÓN COMPLETA - HAY PROBLEMAS DE CONEXIÓN');
    console.log('='.repeat(70));
    console.log('\n⚠️  El formato del usuario es correcto, pero la conexión falla.');
    console.log('   Posibles causas:');
    console.log('   1. Remote MySQL no está habilitado en cPanel');
    console.log('   2. El usuario o contraseña son incorrectos');
    console.log('   3. El usuario no tiene permisos en la base de datos');
    console.log('   4. El host es incorrecto');
  }
  console.log('');
}

verificarUsuario().catch(console.error);


