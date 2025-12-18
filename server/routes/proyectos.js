// 🏗️ RUTAS API PARA PROYECTOS - KSAMATI
const express = require('express');
const router = express.Router();
const { executeQuery, executeTransaction, dbConfig } = require('../config/database');

// Valores permitidos para el campo estado_proyecto en la base de datos
const ALLOWED_ESTADOS = ['Ejecucion', 'Recibo', 'Completado'];

// Normalizar/sanitizar el valor de estado_proyecto recibido desde el cliente
const sanitizeEstadoProyecto = (value) => {
  if (value === undefined || value === null) return 'Ejecucion';
  const v = String(value).trim();
  if (ALLOWED_ESTADOS.includes(v)) return v;
  console.warn(`⚠️ Estado_proyecto inválido recibido: "${v}". Se usará 'Ejecucion' por seguridad.`);
  return 'Ejecucion';
};

// Cache columns de proyecto_detalles para no romper si la tabla es diferente en el entorno actual
const detalleColumnCache = new Set();
const loadDetalleColumns = async () => {
  if (detalleColumnCache.size > 0) return detalleColumnCache;

  const result = await executeQuery(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'proyecto_detalles'
  `, [dbConfig.database]);

  result.rows.forEach(row => detalleColumnCache.add(row.COLUMN_NAME));
  return detalleColumnCache;
};


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
    
    // 🔄 Obtener categorías y detalles para todos los proyectos de una vez
    const projectIds = result.rows.map(p => p.id);
    let categoriasMap = {};
    let detallesMap = {};
    
    if (projectIds.length > 0) {
      // Obtener categorías
      const categoriasQuery = `
        SELECT proyecto_id, id, nombre_categoria, tipo_categoria, orden_categoria,
               presupuesto_del_proyecto, contrato_proved_y_serv, registro_egresos, saldos_por_cancelar
        FROM proyecto_categorias 
        WHERE proyecto_id IN (${projectIds.map(() => '?').join(',')}) AND esta_activo = TRUE
        ORDER BY proyecto_id, orden_categoria ASC
      `;
      const categoriasResult = await executeQuery(categoriasQuery, projectIds);
      
      // Agrupar categorías por proyecto_id
      categoriasResult.rows.forEach(cat => {
        if (!categoriasMap[cat.proyecto_id]) {
          categoriasMap[cat.proyecto_id] = [];
        }
        categoriasMap[cat.proyecto_id].push({
          id: cat.id,
          nombre: cat.nombre_categoria,
          tipo: cat.tipo_categoria || '',
          presupuestoDelProyecto: parseFloat(cat.presupuesto_del_proyecto || 0),
          contratoProvedYServ: parseFloat(cat.contrato_proved_y_serv || 0),
          registroEgresos: parseFloat(cat.registro_egresos || 0),
          saldosPorCancelar: parseFloat(cat.saldos_por_cancelar || 0)
        });
      });
      
      // Obtener detalles (proyecto_detalles) - Solo columnas que existen
      const detalleColumns = await loadDetalleColumns();
      // Columnas base que siempre deberían existir
      const baseColumns = [
        'proyecto_id', 'descripcion_proyecto', 'ubicacion_proyecto', 'fecha_inicio', 'fecha_estimada_fin',
        'presupuesto_del_proyecto', 'total_egresos_proyecto', 'balance_del_presupuesto',
        'igv_sunat', 'credito_fiscal_estimado', 'impuesto_estimado_del_proyecto',
        'credito_fiscal_real', 'impuesto_real_del_proyecto',
        'saldo_x_cobrar', 'balance_de_compras_del_proyecto', 'observaciones_del_proyecto'
      ];
      // Columnas de fechas adicionales (pueden no existir)
      const fechaColumns = ['fecha_1', 'fecha_2', 'fecha_3', 'fecha_4', 'fecha_5', 'fecha_6', 'fecha_7',
                           'fecha_8', 'fecha_9', 'fecha_10', 'fecha_11', 'fecha_12', 'fecha_13'];
      
      // Filtrar solo las columnas que existen
      const availableColumns = [
        ...baseColumns.filter(col => detalleColumns.has(col)),
        ...fechaColumns.filter(col => detalleColumns.has(col))
      ];
      
      const detallesQuery = `
        SELECT ${availableColumns.join(', ')}
        FROM proyecto_detalles 
        WHERE proyecto_id IN (${projectIds.map(() => '?').join(',')})
      `;
      const detallesResult = await executeQuery(detallesQuery, projectIds);
      
      // Agrupar detalles por proyecto_id
      detallesResult.rows.forEach(det => {
        detallesMap[det.proyecto_id] = {
          descripcionProyecto: det.descripcion_proyecto,
          ubicacionProyecto: det.ubicacion_proyecto,
          fechaInicio: det.fecha_inicio,
          fechaEstimadaFin: det.fecha_estimada_fin,
          presupuestoDelProyecto: parseFloat(det.presupuesto_del_proyecto || 0),
          totalEgresosProyecto: parseFloat(det.total_egresos_proyecto || 0),
          balanceDelPresupuesto: parseFloat(det.balance_del_presupuesto || 0),
          igvSunat: parseFloat(det.igv_sunat || 18.00),
          creditoFiscalEstimado: parseFloat(det.credito_fiscal_estimado || 0),
          impuestoEstimadoDelProyecto: parseFloat(det.impuesto_estimado_del_proyecto || 0),
          creditoFiscalReal: parseFloat(det.credito_fiscal_real || 0),
          impuestoRealDelProyecto: parseFloat(det.impuesto_real_del_proyecto || 0),
          saldoXCobrar: parseFloat(det.saldo_x_cobrar || 0),
          balanceDeComprasDelProyecto: parseFloat(det.balance_de_compras_del_proyecto || 0),
          observacionesDelProyecto: det.observaciones_del_proyecto || null,
          // Solo incluir fechas si existen en la BD (pueden no existir en BD remota)
          ...(det.fecha_1 !== undefined && { fecha1: det.fecha_1 }),
          ...(det.fecha_2 !== undefined && { fecha2: det.fecha_2 }),
          ...(det.fecha_3 !== undefined && { fecha3: det.fecha_3 }),
          ...(det.fecha_4 !== undefined && { fecha4: det.fecha_4 }),
          ...(det.fecha_5 !== undefined && { fecha5: det.fecha_5 }),
          ...(det.fecha_6 !== undefined && { fecha6: det.fecha_6 }),
          ...(det.fecha_7 !== undefined && { fecha7: det.fecha_7 }),
          ...(det.fecha_8 !== undefined && { fecha8: det.fecha_8 }),
          ...(det.fecha_9 !== undefined && { fecha9: det.fecha_9 }),
          ...(det.fecha_10 !== undefined && { fecha10: det.fecha_10 }),
          ...(det.fecha_11 !== undefined && { fecha11: det.fecha_11 }),
          ...(det.fecha_12 !== undefined && { fecha12: det.fecha_12 }),
          ...(det.fecha_13 !== undefined && { fecha13: det.fecha_13 })
        };
      });
    }
    
    // 💰 Formatear montos como $/XXX.XX y agregar categorías y detalles
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
      impuestoRealProyecto: `$/${parseFloat(project.impuesto_real_proyecto || 0).toFixed(2)}`,
      categorias: categoriasMap[project.id] || [], // ⚡ Incluir categorías del proyecto
      detalles: detallesMap[project.id] || null // ⚡ Incluir detalles del proyecto
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
    console.log('📥 POST /api/proyectos - Request recibida');
    console.log('   Body recibido:', JSON.stringify(req.body, null, 2));
    
    const {
      nombreProyecto,
      nombreCliente,
      estadoProyecto = 'Ejecucion',
      tipoProyecto = 'Recibo',
      montoContrato = 0,
      presupuestoProyecto = 0,
      adelantosCliente = 0
    } = req.body;
    
    console.log('   Datos parseados:', {
      nombreProyecto,
      nombreCliente,
      estadoProyecto,
      tipoProyecto,
      montoContrato,
      presupuestoProyecto,
      adelantosCliente
    });
    
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
          sanitizeEstadoProyecto(estadoProyecto), tipoProyecto, montoLimpio,
          presupuestoLimpio, adelantosLimpio
        ]
      }
    ];
    
    console.log('   ⏳ Ejecutando transacción para crear proyecto...');
    const result = await executeTransaction(queries);
    const proyectoId = result.results[0].insertId;
    console.log(`   ✅ Proyecto creado con ID: ${proyectoId}`);
    console.log(`   📊 Resultado completo:`, JSON.stringify(result, null, 2));
    
    // Verificar que realmente se guardó
    const verifyQuery = await executeQuery('SELECT * FROM proyectos WHERE id = ?', [proyectoId]);
    if (verifyQuery.rows && verifyQuery.rows.length > 0) {
      console.log(`   ✅ Verificación: Proyecto ${proyectoId} existe en BD`);
      console.log(`      Nombre: ${verifyQuery.rows[0].nombre_proyecto}`);
    } else {
      console.error(`   ❌ ERROR: Proyecto ${proyectoId} NO se encontró en BD después de crearlo`);
    }
    
    // Crear detalle del proyecto (valores base)
    const detalleDefaults = {
      proyecto_id: proyectoId,
      descripcion_proyecto: null,
      ubicacion_proyecto: null,
      presupuesto_del_proyecto: presupuestoLimpio,
      total_egresos_proyecto: 0.00,
      balance_del_presupuesto: 0.00,
      igv_sunat: 18.00,
      saldo_x_cobrar: 0.00,
      balance_de_compras_del_proyecto: 0.00,
      observaciones_del_proyecto: null
    };
    const detalleColumns = await loadDetalleColumns();
    const insertCols = Object.keys(detalleDefaults).filter(col => detalleColumns.has(col));
    if (insertCols.length > 0) {
      const placeholders = insertCols.map(() => '?').join(', ');
      const values = insertCols.map(col => detalleDefaults[col]);
      await executeQuery(`
        INSERT INTO proyecto_detalles (${insertCols.join(', ')})
        VALUES (${placeholders})
      `, values);
    }
    
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
    
    // Intentar ejecutar stored procedure, pero NO bloquear si falla
    try {
      console.log(`   🧮 Ejecutando stored procedure CalcularCamposAutomaticosProyecto(${proyectoId})...`);
      const spResult = await executeQuery('CALL CalcularCamposAutomaticosProyecto(?)', [proyectoId]);
      console.log(`✅ Stored procedure ejecutado exitosamente: CalcularCamposAutomaticosProyecto(${proyectoId})`);
      if (spResult && spResult.rows) {
        console.log(`   📊 Resultado SP:`, JSON.stringify(spResult.rows, null, 2));
      }
    } catch (error) {
      // ⚠️ IMPORTANTE: NO bloquear el guardado si el SP falla
      console.warn(`⚠️ Stored procedure falló (continuando de todas formas):`, error.message);
      console.warn(`   Código:`, error.code);
      console.warn(`   Esto puede ser normal si el SP no existe o hay incompatibilidad de versión MySQL`);
      console.warn(`   El proyecto se guardó correctamente, solo los cálculos automáticos no se ejecutaron`);
      // NO lanzar error - el proyecto ya está guardado
    }
    
    res.status(201).json({
      success: true,
      data: {
        id: proyectoId, // ⚠️ IMPORTANTE: Devolver el ID real de MySQL
        numeroProyecto: numeroProyecto,
        message: 'Proyecto creado exitosamente'
      }
    });
    console.log(`📤 Respuesta enviada al cliente: { success: true, data: { id: ${proyectoId}, numeroProyecto: ${numeroProyecto} } }`);
    
  } catch (error) {
    console.error('❌ Error creando proyecto:', error);
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// 🔄 ACTUALIZAR PROYECTO COMPLETO
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectData = req.body;
    
    console.log(`📥 PUT /api/proyectos/${id} - Request recibida`);
    console.log('   ID del proyecto:', id);
    console.log('   Body recibido (primeros 500 chars):', JSON.stringify(projectData).substring(0, 500));
    
    // ⚠️ VALIDAR QUE EL PROYECTO EXISTA ANTES DE ACTUALIZAR
    let proyectoId = parseInt(id);
    const proyectoExiste = await executeQuery('SELECT id FROM proyectos WHERE id = ?', [proyectoId]);
    if (!proyectoExiste.rows || proyectoExiste.rows.length === 0) {
      console.error(`❌ ERROR: Proyecto con ID ${proyectoId} NO EXISTE en la BD`);
      console.error(`   Intentando buscar por numero_proyecto...`);
      
      // Intentar buscar por numero_proyecto si viene en el body
      if (projectData.numeroProyecto) {
        const proyectoPorNumero = await executeQuery(
          'SELECT id FROM proyectos WHERE numero_proyecto = ?',
          [projectData.numeroProyecto]
        );
        if (proyectoPorNumero.rows && proyectoPorNumero.rows.length > 0) {
          proyectoId = proyectoPorNumero.rows[0].id;
          console.log(`   ✅ Proyecto encontrado por numero_proyecto ${projectData.numeroProyecto}: ID real es ${proyectoId}`);
        } else {
          // Si no se encuentra por numero_proyecto, buscar el último proyecto creado con ese nombre
          console.log(`   ⚠️ No se encontró por numero_proyecto, buscando por nombre...`);
          const proyectoPorNombre = await executeQuery(
            'SELECT id, numero_proyecto FROM proyectos WHERE nombre_proyecto = ? ORDER BY id DESC LIMIT 1',
            [projectData.nombreProyecto || '']
          );
          if (proyectoPorNombre.rows && proyectoPorNombre.rows.length > 0) {
            proyectoId = proyectoPorNombre.rows[0].id;
            console.log(`   ✅ Proyecto encontrado por nombre "${projectData.nombreProyecto}": ID real es ${proyectoId}, numero_proyecto es ${proyectoPorNombre.rows[0].numero_proyecto}`);
          } else {
            return res.status(404).json({
              success: false,
              error: 'Proyecto no encontrado',
              message: `No se encontró proyecto con ID ${id}, numero_proyecto ${projectData.numeroProyecto}, ni nombre "${projectData.nombreProyecto}"`
            });
          }
        }
      } else {
        // Intentar buscar por nombre si no hay numero_proyecto
        if (projectData.nombreProyecto) {
          console.log(`   ⚠️ No hay numero_proyecto, buscando por nombre "${projectData.nombreProyecto}"...`);
          const proyectoPorNombre = await executeQuery(
            'SELECT id, numero_proyecto FROM proyectos WHERE nombre_proyecto = ? ORDER BY id DESC LIMIT 1',
            [projectData.nombreProyecto]
          );
          if (proyectoPorNombre.rows && proyectoPorNombre.rows.length > 0) {
            proyectoId = proyectoPorNombre.rows[0].id;
            console.log(`   ✅ Proyecto encontrado por nombre: ID real es ${proyectoId}, numero_proyecto es ${proyectoPorNombre.rows[0].numero_proyecto}`);
          } else {
            return res.status(404).json({
              success: false,
              error: 'Proyecto no encontrado',
              message: `No se encontró proyecto con ID ${id} ni nombre "${projectData.nombreProyecto}"`
            });
          }
        } else {
          return res.status(404).json({
            success: false,
            error: 'Proyecto no encontrado',
            message: `No se encontró proyecto con ID ${id}`
          });
        }
      }
    } else {
      console.log(`   ✅ Proyecto ${proyectoId} existe en la BD`);
    }
    
    // 💰 Función para limpiar montos (maneja undefined/null)
    const parseAmount = (value) => {
      if (value === undefined || value === null || value === '') return 0;
      const cleanValue = value.toString().replace(/[$/,\s]/g, '');
      return parseFloat(cleanValue) || 0;
    };
    
    console.log('   ⏳ Ejecutando UPDATE en tabla proyectos...');
    
    // Actualizar proyecto principal (con TODOS los campos para evitar valores NULL)
    const updateProyectoQuery = `
      UPDATE proyectos SET
        nombre_proyecto = ?,
        nombre_cliente = ?,
        estado_proyecto = ?,
        tipo_proyecto = ?,
        monto_contrato = ?,
        presupuesto_proyecto = ?,
        balance_proyecto = ?,
        utilidad_estimada_sin_factura = ?,
        utilidad_real_sin_factura = ?,
        balance_utilidad_sin_factura = ?,
        utilidad_estimada_facturado = ?,
        utilidad_real_facturado = ?,
        balance_utilidad_con_factura = ?,
        adelantos_cliente = ?,
        credito_fiscal = ?,
        impuesto_real_proyecto = ?,
        total_contrato_proveedores = ?,
        saldo_pagar_proveedores = ?,
        saldos_cobrar_proyecto = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const updateResult = await executeQuery(updateProyectoQuery, [
      projectData.nombreProyecto || '',
      projectData.nombreCliente || '',
      sanitizeEstadoProyecto(projectData.estadoProyecto || projectData.estado || 'Ejecucion'),
      projectData.tipoProyecto || projectData.tipo || 'Recibo',
      parseAmount(projectData.montoContrato),
      parseAmount(projectData.presupuestoProyecto || projectData.presupuestoDelProyecto),
      parseAmount(projectData.balanceProyecto || projectData.balanceDeComprasDelProyecto),
      parseAmount(projectData.utilidadEstimadaSinFactura),
      parseAmount(projectData.utilidadRealSinFactura),
      parseAmount(projectData.balanceUtilidadSinFactura),
      parseAmount(projectData.utilidadEstimadaFacturado || projectData.utilidadEstimadaConFactura),
      parseAmount(projectData.utilidadRealFacturado || projectData.utilidadRealConFactura),
      parseAmount(projectData.balanceUtilidadConFactura),
      parseAmount(projectData.adelantosCliente || projectData.adelantos),
      parseAmount(projectData.creditoFiscal || projectData.creditoFiscalReal),
      parseAmount(projectData.impuestoRealProyecto || projectData.impuestoRealDelProyecto),
      parseAmount(projectData.totalContratoProveedores),
      parseAmount(projectData.saldoPagarProveedores),
      parseAmount(projectData.saldosCobrarProyecto),
      proyectoId
    ]);
    
    console.log(`   ✅ UPDATE ejecutado - Filas afectadas: ${updateResult.rows?.affectedRows || 0}`);
    
    // Verificar que realmente se actualizó
    if (updateResult.rows?.affectedRows === 0) {
      console.warn(`   ⚠️ ADVERTENCIA: UPDATE no afectó ninguna fila. Verificando si el proyecto existe...`);
      const verifyExists = await executeQuery('SELECT id FROM proyectos WHERE id = ?', [proyectoId]);
      if (verifyExists.rows && verifyExists.rows.length === 0) {
        console.error(`   ❌ ERROR: Proyecto ${proyectoId} NO EXISTE en la BD`);
      } else {
        console.log(`   ✅ Proyecto ${proyectoId} existe, pero UPDATE no afectó filas (posiblemente mismos valores)`);
      }
    } else {
      // Verificar que los cambios se guardaron
      const verifyUpdate = await executeQuery('SELECT nombre_proyecto, nombre_cliente FROM proyectos WHERE id = ?', [proyectoId]);
      if (verifyUpdate.rows && verifyUpdate.rows.length > 0) {
        console.log(`   ✅ Verificación: Proyecto ${proyectoId} actualizado en BD`);
        console.log(`      Nombre: ${verifyUpdate.rows[0].nombre_proyecto}`);
        console.log(`      Cliente: ${verifyUpdate.rows[0].nombre_cliente}`);
      }
    }
    
    // Actualizar detalles del proyecto (TODOS LOS CAMPOS según el esquema completo)
    // Verificar si existe el registro en proyecto_detalles, si no, crearlo
    const detalleExists = await executeQuery(`
      SELECT id FROM proyecto_detalles WHERE proyecto_id = ?
    `, [proyectoId]);
    
    // Helper para parsear fechas (acepta string o Date)
    const parseDate = (value) => {
      if (!value || value === '' || value === 'null' || value === 'NULL') return null;
      if (value instanceof Date) return value.toISOString().split('T')[0];
      if (typeof value === 'string') {
        // Intentar parsear diferentes formatos de fecha
        const dateStr = value.trim();
        if (dateStr === '' || dateStr === 'null' || dateStr === 'NULL') return null;
        return dateStr;
      }
      return null;
    };
    
    // Preparar valores para todas las columnas
    const valoresDetalle = {
      descripcion_proyecto: projectData.descripcionProyecto || null,
      ubicacion_proyecto: projectData.ubicacionProyecto || null,
      fecha_inicio: parseDate(projectData.fechaInicio),
      fecha_estimada_fin: parseDate(projectData.fechaEstimadaFin),
      presupuesto_del_proyecto: parseAmount(projectData.presupuestoDelProyecto || projectData.presupuestoProyecto || 0),
      total_egresos_proyecto: parseAmount(projectData.totalEgresosProyecto || 0),
      balance_del_presupuesto: parseAmount(projectData.balanceDelPresupuesto || 0),
      // ⚠️ igv_sunat es DECIMAL(5,2) - solo acepta porcentajes (18.00, 19.00, etc.), NO montos
      // Validar que sea un porcentaje válido (entre 0 y 100)
      igv_sunat: (() => {
        const igvValue = parseAmount(projectData.igvSunat) || 18.00;
        // Si el valor es mayor a 100, probablemente es un monto, no un porcentaje
        // En ese caso, usar el valor por defecto
        if (igvValue > 100) {
          console.warn(`⚠️ Valor de igv_sunat muy alto (${igvValue}), usando valor por defecto 18.00`);
          return 18.00;
        }
        return Math.min(Math.max(igvValue, 0), 100); // Asegurar que esté entre 0 y 100
      })(),
      credito_fiscal_estimado: parseAmount(projectData.creditoFiscalEstimado || 0),
      impuesto_estimado_del_proyecto: parseAmount(projectData.impuestoEstimadoDelProyecto || 0),
      credito_fiscal_real: parseAmount(projectData.creditoFiscalReal || 0),
      impuesto_real_del_proyecto: parseAmount(projectData.impuestoRealDelProyecto || 0),
      saldo_x_cobrar: parseAmount(projectData.saldoXCobrar || 0),
      balance_de_compras_del_proyecto: parseAmount(projectData.balanceDeComprasDelProyecto || 0),
      observaciones_del_proyecto: projectData.observacionesDelProyecto || null,
      // Fechas adicionales (fecha_1 a fecha_13)
      fecha_1: parseDate(projectData.fecha1 || projectData.fecha_1),
      fecha_2: parseDate(projectData.fecha2 || projectData.fecha_2),
      fecha_3: parseDate(projectData.fecha3 || projectData.fecha_3),
      fecha_4: parseDate(projectData.fecha4 || projectData.fecha_4),
      fecha_5: parseDate(projectData.fecha5 || projectData.fecha_5),
      fecha_6: parseDate(projectData.fecha6 || projectData.fecha_6),
      fecha_7: parseDate(projectData.fecha7 || projectData.fecha_7),
      fecha_8: parseDate(projectData.fecha8 || projectData.fecha_8),
      fecha_9: parseDate(projectData.fecha9 || projectData.fecha_9),
      fecha_10: parseDate(projectData.fecha10 || projectData.fecha_10),
      fecha_11: parseDate(projectData.fecha11 || projectData.fecha_11),
      fecha_12: parseDate(projectData.fecha12 || projectData.fecha_12),
      fecha_13: parseDate(projectData.fecha13 || projectData.fecha_13)
    };
    
    const detalleColumns = await loadDetalleColumns();
    const detalleEntries = Object.entries(valoresDetalle).filter(([col]) => detalleColumns.has(col));
    if (detalleEntries.length > 0) {
      const columns = detalleEntries.map(([col]) => col);
      const values = detalleEntries.map(([, value]) => value);
      if (detalleExists.rows.length === 0) {
        const insertCols = ['proyecto_id', ...columns].filter(col => detalleColumns.has(col));
        const insertValues = [proyectoId, ...values];
        const placeholders = insertCols.map(() => '?').join(', ');
        await executeQuery(`
          INSERT INTO proyecto_detalles (${insertCols.join(', ')})
          VALUES (${placeholders})
        `, insertValues);
      } else {
        const setClause = columns.map(col => `${col} = ?`).join(', ');
        await executeQuery(`
          UPDATE proyecto_detalles SET ${setClause}, updated_at = CURRENT_TIMESTAMP
          WHERE proyecto_id = ?
        `, [...values, proyectoId]);
      }
    }
    
    // 🔄 ACTUALIZAR CATEGORÍAS SI VIENEN EN LOS DATOS
    if (projectData.categorias && Array.isArray(projectData.categorias) && projectData.categorias.length > 0) {
      console.log(`💾 Actualizando ${projectData.categorias.length} categorías para proyecto ${proyectoId}`);
      
      for (const categoria of projectData.categorias) {
        // Buscar si la categoría ya existe por nombre o ID
        const categoriaId = categoria.id || categoria.categoriaId;
        const nombreCategoria = categoria.nombre || categoria.nombreCategoria || '';
        
        if (categoriaId) {
          // Actualizar categoría existente
          await executeQuery(`
            UPDATE proyecto_categorias SET
              nombre_categoria = ?,
              tipo_categoria = ?,
              presupuesto_del_proyecto = ?,
              contrato_proved_y_serv = ?,
              registro_egresos = ?,
              saldos_por_cancelar = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND proyecto_id = ?
          `, [
            nombreCategoria,
            categoria.tipo || categoria.tipoCategoria || '',
            parseAmount(categoria.presupuestoDelProyecto || categoria.presupuesto_del_proyecto || 0),
            parseAmount(categoria.contratoProvedYServ || categoria.contrato_proved_y_serv || 0),
            parseAmount(categoria.registroEgresos || categoria.registro_egresos || 0),
            parseAmount(categoria.saldosPorCancelar || categoria.saldos_por_cancelar || 0),
            categoriaId,
            proyectoId
          ]);
        } else if (nombreCategoria) {
          // Buscar por nombre si no hay ID
          const existingCat = await executeQuery(`
            SELECT id FROM proyecto_categorias 
            WHERE proyecto_id = ? AND nombre_categoria = ? AND esta_activo = TRUE
            LIMIT 1
          `, [proyectoId, nombreCategoria]);
          
          if (existingCat.rows.length > 0) {
            const catId = existingCat.rows[0].id;
            await executeQuery(`
              UPDATE proyecto_categorias SET
                tipo_categoria = ?,
                presupuesto_del_proyecto = ?,
                contrato_proved_y_serv = ?,
                registro_egresos = ?,
                saldos_por_cancelar = ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ? AND proyecto_id = ?
            `, [
              categoria.tipo || categoria.tipoCategoria || '',
              parseAmount(categoria.presupuestoDelProyecto || categoria.presupuesto_del_proyecto || 0),
              parseAmount(categoria.contratoProvedYServ || categoria.contrato_proved_y_serv || 0),
              parseAmount(categoria.registroEgresos || categoria.registro_egresos || 0),
              parseAmount(categoria.saldosPorCancelar || categoria.saldos_por_cancelar || 0),
              catId,
              proyectoId
            ]);
          }
        }
      }
      console.log(`✅ Categorías actualizadas para proyecto ${proyectoId}`);
    }
    
    // ⚠️ IMPORTANTE: NO llamar al stored procedure manualmente en UPDATE
    // El trigger tr_proyectos_update ya lo ejecuta automáticamente
    // Si lo llamamos manualmente, causará un bucle infinito (UPDATE -> trigger -> SP -> UPDATE -> trigger...)
    console.log(`   ℹ️  Stored procedure NO se llama manualmente en UPDATE`);
    console.log(`   ✅ El trigger 'tr_proyectos_update' ejecutará automáticamente CalcularCamposAutomaticosProyecto(${proyectoId})`);
    
    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error actualizando proyecto:', error);
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// 🗑️ ELIMINAR PROYECTOS
router.delete('/', async (req, res) => {
  try {
    console.log('📥 DELETE /api/proyectos - Request recibida');
    console.log('   Body recibido:', JSON.stringify(req.body, null, 2));
    
    const { ids } = req.body; // Array de IDs a eliminar
    
    console.log('   IDs a eliminar:', ids);
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de IDs válidos'
      });
    }
    
    // Crear placeholders para la query IN
    const placeholders = ids.map(() => '?').join(',');
    const deleteQuery = `DELETE FROM proyectos WHERE id IN (${placeholders})`;
    
    console.log('   ⏳ Ejecutando DELETE...');
    const result = await executeQuery(deleteQuery, ids);
    
    console.log(`   ✅ DELETE ejecutado - Filas afectadas: ${result.rows?.affectedRows || 0}`);
    
    res.json({
      success: true,
      message: `${result.rows?.affectedRows || 0} proyecto(s) eliminado(s) exitosamente`
    });
    
  } catch (error) {
    console.error('❌ Error eliminando proyectos:', error);
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
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