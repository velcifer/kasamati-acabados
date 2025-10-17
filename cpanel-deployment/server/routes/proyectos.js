// 🏗️ RUTAS API PARA PROYECTOS - KSAMATI
const express = require('express');
const router = express.Router();
const { executeQuery, executeTransaction } = require('../config/database');

// 📊 OBTENER TODOS LOS PROYECTOS (Para Excel Principal)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        numero_proyecto,
        nombre_proyecto,
        nombre_cliente,
        estado_proyecto,
        tipo_proyecto,
        monto_contrato,
        presupuesto_proyecto,
        balance_proyecto,
        utilidad_estimada_sin_factura,
        utilidad_real_sin_factura,
        balance_utilidad_sin_factura,
        utilidad_estimada_facturado,
        utilidad_real_facturado,
        balance_utilidad_con_factura,
        total_contrato_proveedores,
        saldo_pagar_proveedores,
        adelantos_cliente,
        saldos_reales_proyecto,
        saldos_cobrar_proyecto,
        credito_fiscal,
        impuesto_real_proyecto,
        created_at,
        updated_at
      FROM proyectos 
      ORDER BY numero_proyecto ASC
    `;
    
    const result = await executeQuery(query);
    
    // 💰 Formatear montos como $/XXX.XX
    const formattedProjects = result.rows.map(project => ({
      ...project,
      montoContrato: `$/${parseFloat(project.monto_contrato || 0).toFixed(2)}`,
      presupuestoProyecto: `$/${parseFloat(project.presupuesto_proyecto || 0).toFixed(2)}`,
      balanceProyecto: `$/${parseFloat(project.balance_proyecto || 0).toFixed(2)}`,
      utilidadEstimadaSinFactura: `$/${parseFloat(project.utilidad_estimada_sin_factura || 0).toFixed(2)}`,
      utilidadRealSinFactura: `$/${parseFloat(project.utilidad_real_sin_factura || 0).toFixed(2)}`,
      balanceUtilidadSinFactura: `$/${parseFloat(project.balance_utilidad_sin_factura || 0).toFixed(2)}`,
      utilidadEstimadaFacturado: `$/${parseFloat(project.utilidad_estimada_facturado || 0).toFixed(2)}`,
      utilidadRealFacturado: `$/${parseFloat(project.utilidad_real_facturado || 0).toFixed(2)}`,
      balanceUtilidadConFactura: `$/${parseFloat(project.balance_utilidad_con_factura || 0).toFixed(2)}`,
      totalContratoProveedores: `$/${parseFloat(project.total_contrato_proveedores || 0).toFixed(2)}`,
      saldoPagarProveedores: `$/${parseFloat(project.saldo_pagar_proveedores || 0).toFixed(2)}`,
      adelantosCliente: `$/${parseFloat(project.adelantos_cliente || 0).toFixed(2)}`,
      saldosRealesProyecto: `$/${parseFloat(project.saldos_reales_proyecto || 0).toFixed(2)}`,
      saldosCobrarProyecto: `$/${parseFloat(project.saldos_cobrar_proyecto || 0).toFixed(2)}`,
      creditoFiscal: `$/${parseFloat(project.credito_fiscal || 0).toFixed(2)}`,
      impuestoRealProyecto: `$/${parseFloat(project.impuesto_real_proyecto || 0).toFixed(2)}`
    }));

    res.json({
      success: true,
      data: formattedProjects,
      total: formattedProjects.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo proyectos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// 🔍 OBTENER PROYECTO POR ID CON DETALLES COMPLETOS
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener proyecto principal
    const proyectoQuery = `
      SELECT * FROM proyectos WHERE id = ?
    `;
    
    // Obtener detalles del proyecto
    const detalleQuery = `
      SELECT * FROM proyecto_detalles WHERE proyecto_id = ?
    `;
    
    // Obtener categorías del proyecto
    const categoriasQuery = `
      SELECT * FROM proyecto_categorias 
      WHERE proyecto_id = ? AND esta_activo = TRUE 
      ORDER BY orden_categoria ASC
    `;
    
    const [proyecto, detalle, categorias] = await Promise.all([
      executeQuery(proyectoQuery, [id]),
      executeQuery(detalleQuery, [id]),
      executeQuery(categoriasQuery, [id])
    ]);
    
    if (proyecto.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: {
        proyecto: proyecto.rows[0],
        detalle: detalle.rows[0] || {},
        categorias: categorias.rows
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo proyecto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ➕ CREAR NUEVO PROYECTO
router.post('/', async (req, res) => {
  try {
    const {
      nombreProyecto,
      nombreCliente,
      estadoProyecto = 'Ejecucion',
      tipoProyecto = 'Recibo',
      montoContrato = 0,
      presupuestoProyecto = 0,
      adelantosCliente = 0
    } = req.body;
    
    // Obtener siguiente número de proyecto
    const numeroQuery = `
      SELECT COALESCE(MAX(numero_proyecto), 0) + 1 as siguiente_numero 
      FROM proyectos
    `;
    const numeroResult = await executeQuery(numeroQuery);
    const numeroProyecto = numeroResult.rows[0].siguiente_numero;
    
    // 💰 Convertir montos (quitar formato $/XXX.XX)
    const parseAmount = (value) => {
      if (!value) return 0;
      const cleanValue = value.toString().replace(/[$/,\s]/g, '');
      return parseFloat(cleanValue) || 0;
    };
    
    const montoLimpio = parseAmount(montoContrato);
    const presupuestoLimpio = parseAmount(presupuestoProyecto);
    const adelantosLimpio = parseAmount(adelantosCliente);
    
    const queries = [
      // Insertar proyecto principal
      {
        query: `
          INSERT INTO proyectos (
            numero_proyecto, nombre_proyecto, nombre_cliente,
            estado_proyecto, tipo_proyecto, monto_contrato,
            presupuesto_proyecto, adelantos_cliente
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          numeroProyecto, nombreProyecto, nombreCliente,
          estadoProyecto, tipoProyecto, montoLimpio,
          presupuestoLimpio, adelantosLimpio
        ]
      }
    ];
    
    const result = await executeTransaction(queries);
    const proyectoId = result.results[0].insertId;
    
    // Crear detalle del proyecto
    await executeQuery(`
      INSERT INTO proyecto_detalles (proyecto_id, presupuesto_del_proyecto)
      VALUES (?, ?)
    `, [proyectoId, presupuestoLimpio]);
    
    // Crear categorías por defecto
    const categoriasDefecto = [
      { nombre: 'Melamina y Servicios', tipo: 'F', orden: 1 },
      { nombre: 'Led Y Electricidad', tipo: 'S', orden: 2 },
      { nombre: 'Accesorios y Ferretería', tipo: 'P', orden: 3 },
      { nombre: 'Puertas Alu Y Vidrios', tipo: 'F', orden: 4 },
      { nombre: 'Riele y/o Camioneta', tipo: 'S', orden: 5 },
      { nombre: 'Logística Operativa', tipo: 'S', orden: 6 }
    ];
    
    for (const cat of categoriasDefecto) {
      await executeQuery(`
        INSERT INTO proyecto_categorias 
        (proyecto_id, nombre_categoria, tipo_categoria, orden_categoria)
        VALUES (?, ?, ?, ?)
      `, [proyectoId, cat.nombre, cat.tipo, cat.orden]);
    }
    
    res.status(201).json({
      success: true,
      data: {
        id: proyectoId,
        numeroProyecto: numeroProyecto,
        message: 'Proyecto creado exitosamente'
      }
    });
    
  } catch (error) {
    console.error('❌ Error creando proyecto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// 🔄 ACTUALIZAR PROYECTO COMPLETO
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectData = req.body;
    
    // 💰 Función para limpiar montos
    const parseAmount = (value) => {
      if (!value) return 0;
      const cleanValue = value.toString().replace(/[$/,\s]/g, '');
      return parseFloat(cleanValue) || 0;
    };
    
    // Actualizar proyecto principal
    const updateProyectoQuery = `
      UPDATE proyectos SET
        nombre_proyecto = ?,
        nombre_cliente = ?,
        estado_proyecto = ?,
        tipo_proyecto = ?,
        monto_contrato = ?,
        presupuesto_proyecto = ?,
        utilidad_estimada_sin_factura = ?,
        utilidad_real_sin_factura = ?,
        utilidad_estimada_facturado = ?,
        utilidad_real_facturado = ?,
        adelantos_cliente = ?,
        credito_fiscal = ?,
        impuesto_real_proyecto = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery(updateProyectoQuery, [
      projectData.nombreProyecto,
      projectData.nombreCliente,
      projectData.estadoProyecto || projectData.estado,
      projectData.tipoProyecto || projectData.tipo,
      parseAmount(projectData.montoContrato),
      parseAmount(projectData.presupuestoProyecto || projectData.presupuestoDelProyecto),
      parseAmount(projectData.utilidadEstimadaSinFactura),
      parseAmount(projectData.utilidadRealSinFactura),
      parseAmount(projectData.utilidadEstimadaFacturado || projectData.utilidadEstimadaConFactura),
      parseAmount(projectData.utilidadRealFacturado || projectData.utilidadRealConFactura),
      parseAmount(projectData.adelantosCliente || projectData.adelantos),
      parseAmount(projectData.creditoFiscal || projectData.creditoFiscalReal),
      parseAmount(projectData.impuestoRealProyecto || projectData.impuestoRealDelProyecto),
      id
    ]);
    
    // Actualizar detalles del proyecto
    await executeQuery(`
      UPDATE proyecto_detalles SET
        observaciones_del_proyecto = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE proyecto_id = ?
    `, [
      projectData.observacionesDelProyecto,
      id
    ]);
    
    // 🧮 Ejecutar cálculos automáticos
    await executeQuery('CALL CalcularCamposAutomaticos(?)', [id]);
    
    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error actualizando proyecto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// 🗑️ ELIMINAR PROYECTOS
router.delete('/', async (req, res) => {
  try {
    const { ids } = req.body; // Array de IDs a eliminar
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs válidos'
      });
    }
    
    // Crear placeholders para la query IN
    const placeholders = ids.map(() => '?').join(',');
    const deleteQuery = `DELETE FROM proyectos WHERE id IN (${placeholders})`;
    
    const result = await executeQuery(deleteQuery, ids);
    
    res.json({
      success: true,
      message: `${result.rows.affectedRows} proyecto(s) eliminado(s) exitosamente`
    });
    
  } catch (error) {
    console.error('❌ Error eliminando proyectos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// 📊 ENDPOINT PARA ESTADÍSTICAS
router.get('/stats/dashboard', async (req, res) => {
  try {
    const queries = [
      'SELECT COUNT(*) as total FROM proyectos',
      'SELECT estado_proyecto, COUNT(*) as cantidad FROM proyectos GROUP BY estado_proyecto',
      'SELECT SUM(monto_contrato) as total_contratos FROM proyectos',
      'SELECT SUM(saldos_cobrar_proyecto) as total_por_cobrar FROM proyectos'
    ];
    
    const [total, porEstado, totalContratos, totalPorCobrar] = await Promise.all(
      queries.map(query => executeQuery(query))
    );
    
    res.json({
      success: true,
      data: {
        totalProyectos: total.rows[0].total,
        estadisticas: porEstado.rows,
        totalContratos: totalContratos.rows[0].total_contratos || 0,
        totalPorCobrar: totalPorCobrar.rows[0].total_por_cobrar || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;