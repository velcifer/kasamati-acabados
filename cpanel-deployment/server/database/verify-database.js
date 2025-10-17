#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

// 🔧 CONFIGURACIÓN DE LA BASE DE DATOS
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ksamati_proyectos',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  idleTimeout: 60000
};

async function verificarBaseDatos() {
  let connection;
  
  try {
    console.log('🔍 VERIFICANDO BASE DE DATOS KSAMATI...\n');
    
    // Conexión a la base de datos
    console.log('📡 Conectando a MySQL...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa\n');
    
    // Verificar que las tablas existen
    const tablas = [
      'proyectos',
      'proyecto_detalles', 
      'proyecto_categorias',
      'proyecto_documentos',
      'archivos_adjuntos',
      'ventas',
      'venta_cotizadores',
      'proyecto_cambios'
    ];
    
    console.log('📊 VERIFICANDO TABLAS:');
    for (const tabla of tablas) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tabla}`);
        console.log(`✅ ${tabla.padEnd(25)} - ${rows[0].count} registros`);
      } catch (error) {
        console.log(`❌ ${tabla.padEnd(25)} - ERROR: ${error.message}`);
      }
    }
    
    console.log('\n🔧 VERIFICANDO PROCEDIMIENTOS ALMACENADOS:');
    try {
      const [procedures] = await connection.execute(`
        SELECT ROUTINE_NAME 
        FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_SCHEMA = '${dbConfig.database}' 
        AND ROUTINE_TYPE = 'PROCEDURE'
      `);
      
      if (procedures.length > 0) {
        procedures.forEach(proc => {
          console.log(`✅ ${proc.ROUTINE_NAME}`);
        });
      } else {
        console.log('⚠️  No se encontraron procedimientos almacenados');
      }
    } catch (error) {
      console.log(`❌ Error verificando procedimientos: ${error.message}`);
    }
    
    console.log('\n🎯 VERIFICANDO TRIGGERS:');
    try {
      const [triggers] = await connection.execute(`
        SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
        FROM INFORMATION_SCHEMA.TRIGGERS 
        WHERE TRIGGER_SCHEMA = '${dbConfig.database}'
      `);
      
      if (triggers.length > 0) {
        triggers.forEach(trigger => {
          console.log(`✅ ${trigger.TRIGGER_NAME} (${trigger.EVENT_MANIPULATION} on ${trigger.EVENT_OBJECT_TABLE})`);
        });
      } else {
        console.log('⚠️  No se encontraron triggers');
      }
    } catch (error) {
      console.log(`❌ Error verificando triggers: ${error.message}`);
    }
    
    // Verificar datos de ejemplo
    console.log('\n📝 DATOS DE EJEMPLO:');
    try {
      const [proyectos] = await connection.execute('SELECT COUNT(*) as count FROM proyectos');
      const [ventas] = await connection.execute('SELECT COUNT(*) as count FROM ventas');
      const [categorias] = await connection.execute('SELECT COUNT(*) as count FROM proyecto_categorias');
      const [documentos] = await connection.execute('SELECT COUNT(*) as count FROM proyecto_documentos');
      
      console.log(`📋 Proyectos: ${proyectos[0].count}`);
      console.log(`💰 Ventas: ${ventas[0].count}`);
      console.log(`📦 Categorías: ${categorias[0].count}`);
      console.log(`📄 Documentos: ${documentos[0].count}`);
    } catch (error) {
      console.log(`❌ Error verificando datos: ${error.message}`);
    }
    
    // Probar cálculos automáticos si existe un proyecto
    console.log('\n🧮 PROBANDO CÁLCULOS AUTOMÁTICOS:');
    try {
      const [proyectos] = await connection.execute('SELECT id FROM proyectos LIMIT 1');
      if (proyectos.length > 0) {
        await connection.execute('CALL CalcularCamposAutomaticosProyecto(?)', [proyectos[0].id]);
        console.log('✅ Cálculos automáticos de proyectos funcionando');
      }
      
      const [ventas] = await connection.execute('SELECT id FROM ventas LIMIT 1');
      if (ventas.length > 0) {
        await connection.execute('CALL CalcularCamposAutomaticosVenta(?)', [ventas[0].id]);
        console.log('✅ Cálculos automáticos de ventas funcionando');
      }
    } catch (error) {
      console.log(`❌ Error probando cálculos: ${error.message}`);
    }
    
    console.log('\n🎉 VERIFICACIÓN COMPLETADA');
    console.log('📊 La base de datos KSAMATI está lista para usar');
    
  } catch (error) {
    console.error('❌ ERROR DE CONEXIÓN:', error.message);
    console.error('\n🔧 POSIBLES SOLUCIONES:');
    console.error('1. Verificar que MySQL esté ejecutándose');
    console.error('2. Verificar las credenciales en el archivo .env');
    console.error('3. Ejecutar el script de setup: npm run setup-db');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar verificación
verificarBaseDatos();

