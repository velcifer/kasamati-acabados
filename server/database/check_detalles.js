// 🔍 Verificar contenido de proyecto_detalles para el proyecto 6
const { executeQuery } = require('../config/database');

async function checkDetalles() {
  try {
    console.log('🔍 Verificando contenido de proyecto_detalles para proyecto 6...\n');
    
    const query = `
      SELECT 
        pd.*,
        p.numero_proyecto,
        p.nombre_proyecto,
        p.monto_contrato,
        p.presupuesto_proyecto
      FROM proyecto_detalles pd
      INNER JOIN proyectos p ON pd.proyecto_id = p.id
      WHERE p.id = 6
    `;
    
    const result = await executeQuery(query);
    
    if (result.rows.length === 0) {
      console.log('❌ No se encontró registro en proyecto_detalles para el proyecto 6');
      console.log('🔄 Creando registro...\n');
      
      // Crear registro
      const insertQuery = `
        INSERT INTO proyecto_detalles (
          proyecto_id, 
          descripcion_proyecto, 
          ubicacion_proyecto, 
          fecha_inicio, 
          fecha_estimada_fin,
          presupuesto_del_proyecto, 
          total_egresos_proyecto, 
          balance_del_presupuesto,
          igv_sunat, 
          credito_fiscal_estimado, 
          impuesto_estimado_del_proyecto,
          credito_fiscal_real, 
          impuesto_real_del_proyecto,
          saldo_x_cobrar, 
          balance_de_compras_del_proyecto, 
          observaciones_del_proyecto,
          fecha_1, fecha_2, fecha_3, fecha_4, fecha_5, fecha_6, fecha_7,
          fecha_8, fecha_9, fecha_10, fecha_11, fecha_12, fecha_13
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const proyectoQuery = `SELECT presupuesto_proyecto, saldos_cobrar_proyecto FROM proyectos WHERE id = 6`;
      const proyectoResult = await executeQuery(proyectoQuery);
      const proyecto = proyectoResult.rows[0];
      
      await executeQuery(insertQuery, [
        6, // proyecto_id
        null, // descripcion_proyecto
        null, // ubicacion_proyecto
        null, // fecha_inicio
        null, // fecha_estimada_fin
        parseFloat(proyecto.presupuesto_proyecto || 0), // presupuesto_del_proyecto
        0.00, // total_egresos_proyecto
        0.00, // balance_del_presupuesto
        18.00, // igv_sunat
        0.00, // credito_fiscal_estimado
        0.00, // impuesto_estimado_del_proyecto
        0.00, // credito_fiscal_real
        0.00, // impuesto_real_del_proyecto
        parseFloat(proyecto.saldos_cobrar_proyecto || 0), // saldo_x_cobrar
        0.00, // balance_de_compras_del_proyecto
        null, // observaciones_del_proyecto
        null, null, null, null, null, null, null, // fecha_1 a fecha_7
        null, null, null, null, null, null // fecha_8 a fecha_13
      ]);
      
      console.log('✅ Registro creado exitosamente\n');
    } else {
      const detalle = result.rows[0];
      console.log('📊 Contenido del registro en proyecto_detalles:');
      console.log(`   ID: ${detalle.id}`);
      console.log(`   Proyecto ID: ${detalle.proyecto_id}`);
      console.log(`   Descripción: ${detalle.descripcion_proyecto || 'NULL'}`);
      console.log(`   Ubicación: ${detalle.ubicacion_proyecto || 'NULL'}`);
      console.log(`   Fecha Inicio: ${detalle.fecha_inicio || 'NULL'}`);
      console.log(`   Fecha Estimada Fin: ${detalle.fecha_estimada_fin || 'NULL'}`);
      console.log(`   Presupuesto: ${detalle.presupuesto_del_proyecto || 0}`);
      console.log(`   Total Egresos: ${detalle.total_egresos_proyecto || 0}`);
      console.log(`   Balance Presupuesto: ${detalle.balance_del_presupuesto || 0}`);
      console.log(`   IGV SUNAT: ${detalle.igv_sunat || 0}`);
      console.log(`   Crédito Fiscal Estimado: ${detalle.credito_fiscal_estimado || 0}`);
      console.log(`   Impuesto Estimado: ${detalle.impuesto_estimado_del_proyecto || 0}`);
      console.log(`   Crédito Fiscal Real: ${detalle.credito_fiscal_real || 0}`);
      console.log(`   Impuesto Real: ${detalle.impuesto_real_del_proyecto || 0}`);
      console.log(`   Saldo X Cobrar: ${detalle.saldo_x_cobrar || 0}`);
      console.log(`   Balance Compras: ${detalle.balance_de_compras_del_proyecto || 0}`);
      console.log(`   Observaciones: ${detalle.observaciones_del_proyecto || 'NULL'}`);
      console.log('');
      console.log('✅ El registro existe. Los campos se actualizarán cuando guardes el proyecto desde la app.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDetalles();


