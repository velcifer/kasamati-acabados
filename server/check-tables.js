// 🔍 Script para verificar qué tablas faltan en tu base de datos
require('dotenv').config();
const mysql = require('mysql2/promise');

// Lista de todas las tablas que deberían existir según el esquema completo
const TABLAS_ESPERADAS = [
  'proyectos',
  'proyecto_detalles',
  'proyecto_categorias',
  'proyecto_documentos',
  'archivos_adjuntos',
  'ventas',
  'venta_cotizadores',
  'proyecto_cambios',
  'data_sync',              // ⚠️ Tabla de sincronización
  'offline_queue',          // ⚠️ Tabla de sincronización
  'sync_conflicts',         // ⚠️ Tabla de sincronización
  'device_sync_status'      // ⚠️ Tabla de sincronización (la que está causando el error)
];

async function checkTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ksamti_proyectos'
    });

    console.log('🔍 Verificando tablas en la base de datos...\n');
    console.log(`📊 Base de datos: ${process.env.DB_NAME || 'ksamti_proyectos'}\n`);

    // Obtener todas las tablas existentes
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME || 'ksamti_proyectos']);

    const tablasExistentes = tables.map(t => t.TABLE_NAME.toLowerCase());
    
    console.log('📋 TABLAS QUE TIENES EN TU BASE DE DATOS:');
    console.log('=' .repeat(50));
    tablasExistentes.forEach(tabla => {
      console.log(`   ✓ ${tabla}`);
    });
    
    console.log(`\n   Total: ${tablasExistentes.length} tablas\n`);

    // Comparar con las esperadas
    console.log('🔍 COMPARACIÓN CON EL ESQUEMA COMPLETO:');
    console.log('=' .repeat(50));
    
    const tablasFaltantes = [];
    const tablasExtra = [];
    
    TABLAS_ESPERADAS.forEach(tabla => {
      if (tablasExistentes.includes(tabla.toLowerCase())) {
        console.log(`   ✅ ${tabla}`);
      } else {
        console.log(`   ❌ ${tabla} - FALTA`);
        tablasFaltantes.push(tabla);
      }
    });

    // Verificar si hay tablas extra (que no están en el esquema)
    tablasExistentes.forEach(tabla => {
      if (!TABLAS_ESPERADAS.some(t => t.toLowerCase() === tabla)) {
        tablasExtra.push(tabla);
      }
    });

    console.log('\n📊 RESUMEN:');
    console.log('=' .repeat(50));
    console.log(`   ✅ Tablas correctas: ${TABLAS_ESPERADAS.length - tablasFaltantes.length}/${TABLAS_ESPERADAS.length}`);
    console.log(`   ❌ Tablas faltantes: ${tablasFaltantes.length}`);
    
    if (tablasFaltantes.length > 0) {
      console.log('\n⚠️  TABLAS QUE FALTAN:');
      tablasFaltantes.forEach(tabla => {
        const esSync = ['data_sync', 'offline_queue', 'sync_conflicts', 'device_sync_status'].includes(tabla);
        console.log(`   ${esSync ? '🔄' : '📋'} ${tabla}${esSync ? ' (Sincronización)' : ''}`);
      });
      
      console.log('\n💡 SOLUCIÓN:');
      console.log('   Ejecuta el script SQL: server/database/create_sync_tables.sql');
      console.log('   O copia y pega el SQL en MySQL Workbench');
    }

    if (tablasExtra.length > 0) {
      console.log('\n📌 TABLAS EXTRA (no están en el esquema pero existen):');
      tablasExtra.forEach(tabla => {
        console.log(`   ℹ️  ${tabla}`);
      });
    }

    if (tablasFaltantes.length === 0) {
      console.log('\n🎉 ¡Perfecto! Tienes todas las tablas necesarias.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Verifica tus credenciales en server/.env');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTables();



