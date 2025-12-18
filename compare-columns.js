// 🔍 COMPARAR COLUMNAS ENTRE ESQUEMA LOCAL Y SERVIDOR REMOTO
require('dotenv').config();
const mysql = require('mysql2/promise');
const { dbConfig } = require('./server/config/database');

// Columnas esperadas según el esquema local
const esquemaLocal = {
  proyectos: [
    'id', 'numero_proyecto', 'nombre_proyecto', 'nombre_cliente', 'estado_proyecto', 'tipo_proyecto', 'telefono',
    'monto_contrato', 'presupuesto_proyecto', 'balance_proyecto', 'utilidad_estimada_sin_factura', 
    'utilidad_real_sin_factura', 'balance_utilidad_sin_factura', 'utilidad_estimada_facturado', 
    'utilidad_real_facturado', 'balance_utilidad_con_factura', 'total_contrato_proveedores', 
    'saldo_pagar_proveedores', 'adelantos_cliente', 'saldos_reales_proyecto', 'saldos_cobrar_proyecto',
    'credito_fiscal', 'impuesto_real_proyecto', 'created_at', 'updated_at'
  ],
  proyecto_detalles: [
    'id', 'proyecto_id', 'descripcion_proyecto', 'ubicacion_proyecto', 'fecha_inicio', 'fecha_estimada_fin',
    'presupuesto_del_proyecto', 'total_egresos_proyecto', 'balance_del_presupuesto', 'igv_sunat',
    'credito_fiscal_estimado', 'impuesto_estimado_del_proyecto', 'credito_fiscal_real', 
    'impuesto_real_del_proyecto', 'saldo_x_cobrar', 'balance_de_compras_del_proyecto', 
    'observaciones_del_proyecto', 'created_at', 'updated_at'
  ]
};

async function compareColumns() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 COMPARACIÓN DE COLUMNAS: LOCAL vs SERVIDOR REMOTO');
    console.log('='.repeat(70));
    
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database
    });

    for (const tableName of Object.keys(esquemaLocal)) {
      console.log(`\n📊 TABLA: ${tableName}`);
      console.log('-'.repeat(70));
      
      // Obtener columnas del servidor remoto
      const [columns] = await connection.execute(`SHOW COLUMNS FROM \`${tableName}\``);
      const columnasRemotas = columns.map(col => col.Field);
      
      // Columnas esperadas según esquema local
      const columnasLocales = esquemaLocal[tableName];
      
      console.log(`\n✅ Columnas en servidor remoto (${columnasRemotas.length}):`);
      console.log('   ' + columnasRemotas.join(', '));
      
      console.log(`\n📋 Columnas esperadas según esquema local (${columnasLocales.length}):`);
      console.log('   ' + columnasLocales.join(', '));
      
      // Encontrar diferencias
      const faltantesEnRemoto = columnasLocales.filter(col => !columnasRemotas.includes(col));
      const extrasEnRemoto = columnasRemotas.filter(col => !columnasLocales.includes(col));
      
      if (faltantesEnRemoto.length > 0) {
        console.log(`\n❌ COLUMNAS QUE FALTAN EN EL SERVIDOR REMOTO (${faltantesEnRemoto.length}):`);
        faltantesEnRemoto.forEach(col => console.log(`   - ${col}`));
      } else {
        console.log(`\n✅ Todas las columnas del esquema local están en el servidor remoto`);
      }
      
      if (extrasEnRemoto.length > 0) {
        console.log(`\n⚠️  COLUMNAS EXTRA EN EL SERVIDOR REMOTO (${extrasEnRemoto.length}):`);
        extrasEnRemoto.forEach(col => console.log(`   - ${col}`));
      }
    }

    await connection.end();
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Comparación completada');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

compareColumns();

