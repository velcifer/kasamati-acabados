// 🔄 RUTAS API PARA SINCRONIZACIÓN OFFLINE/ONLINE - KSAMATI
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { executeQuery, executeTransaction } = require('../config/database');

// Valores permitidos para estado_proyecto (coinciden con ENUM en la BD)
const ALLOWED_ESTADOS_SYNC = ['Ejecucion', 'Recibo', 'Completado'];

const sanitizeEstadoForSync = (value) => {
  if (value === undefined || value === null) return 'Ejecucion';
  const v = String(value).trim();
  if (ALLOWED_ESTADOS_SYNC.includes(v)) return v;
  console.warn(`⚠️ sync: estadoProyecto inválido recibido: "${v}". Se usará 'Ejecucion'.`);
  return 'Ejecucion';
};

// 🔧 Función helper para calcular hash MD5 de datos
const calculateHash = (data) => {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
};

// 🔧 Función helper para obtener datos del request
const getRequestInfo = (req) => ({
  userId: req.headers['x-user-id'] || req.body.userId || 'anonymous',
  deviceId: req.headers['x-device-id'] || req.body.deviceId || 'unknown',
  ip: req.ip || req.connection.remoteAddress,
  userAgent: req.headers['user-agent'] || 'unknown'
});

// 📊 ESTADO DE SINCRONIZACIÓN DEL DISPOSITIVO
router.get('/status/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const requestInfo = getRequestInfo(req);

    // Obtener estado del dispositivo
    const deviceQuery = `
      SELECT * FROM device_sync_status WHERE device_id = ?
    `;
    const deviceResult = await executeQuery(deviceQuery, [deviceId]);

    // Contar operaciones pendientes
    const pendingQuery = `
      SELECT COUNT(*) as pending_count FROM offline_queue
      WHERE device_id = ? AND retry_count < 3
    `;
    const pendingResult = await executeQuery(pendingQuery, [deviceId]);

    // Obtener último sync del servidor
    const lastSyncQuery = `
      SELECT MAX(last_modified) as last_server_sync FROM data_sync
    `;
    const lastSyncResult = await executeQuery(lastSyncQuery);

    res.json({
      success: true,
      data: {
        device: deviceResult.rows[0] || null,
        pendingOperations: pendingResult.rows[0]?.pending_count || 0,
        lastServerSync: lastSyncResult.rows[0]?.last_server_sync || null,
        serverTime: new Date().toISOString(),
        connection: 'online'
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estado de sincronización:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      connection: 'error'
    });
  }
});

// 🔄 SINCRONIZAR: Subir cambios locales y bajar cambios remotos
router.post('/sync/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { localChanges, lastSyncTimestamp } = req.body;
    const requestInfo = getRequestInfo(req);

    console.log(`🔄 Iniciando sincronización para dispositivo ${deviceId}`);

    // 1. Actualizar estado del dispositivo
    await executeQuery(`
      INSERT INTO device_sync_status (device_id, device_name, sync_status, last_ip, user_agent, updated_at)
      VALUES (?, ?, 'syncing', ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        sync_status = 'syncing',
        last_ip = VALUES(last_ip),
        user_agent = VALUES(user_agent),
        updated_at = NOW()
    `, [deviceId, requestInfo.deviceId, requestInfo.ip, requestInfo.userAgent]);

    // 2. Procesar cambios locales (subir)
    let uploadedChanges = 0;
    if (localChanges && Array.isArray(localChanges)) {
      for (const change of localChanges) {
        try {
          await processLocalChange(change, requestInfo);
          uploadedChanges++;
        } catch (error) {
          console.error('❌ Error procesando cambio local:', error);
          // Registrar error pero continuar
        }
      }
    }

    // 3. Obtener cambios remotos (bajar)
    const remoteChanges = await getRemoteChanges(lastSyncTimestamp, deviceId);

    // 4. Obtener conflictos pendientes
    const conflicts = await getPendingConflicts(deviceId);

    // 5. Actualizar estado del dispositivo
    await executeQuery(`
      UPDATE device_sync_status SET
        sync_status = 'online',
        last_sync = NOW(),
        pending_operations = 0,
        updated_at = NOW()
      WHERE device_id = ?
    `, [deviceId]);

    console.log(`✅ Sincronización completada para ${deviceId}: ${uploadedChanges} subidos, ${remoteChanges.length} bajados`);

    res.json({
      success: true,
      data: {
        uploadedChanges,
        remoteChanges,
        conflicts,
        serverTime: new Date().toISOString(),
        message: `Sincronización exitosa: ${uploadedChanges} cambios subidos, ${remoteChanges.length} cambios bajados`
      }
    });

  } catch (error) {
    console.error('❌ Error en sincronización:', error);

    // Actualizar estado de error
    try {
      await executeQuery(`
        UPDATE device_sync_status SET
          sync_status = 'offline',
          updated_at = NOW()
        WHERE device_id = ?
      `, [req.params.deviceId]);
    } catch (updateError) {
      console.error('❌ Error actualizando estado de error:', updateError);
    }

    res.status(500).json({
      success: false,
      error: 'Error en sincronización',
      message: error.message
    });
  }
});

// 📤 SUBIR OPERACIONES OFFLINE PENDIENTES
router.post('/upload/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { operations } = req.body;
    const requestInfo = getRequestInfo(req);

    console.log(`📤 Subiendo ${operations.length} operaciones offline para ${deviceId}`);

    let processed = 0;
    let errors = [];

    for (const operation of operations) {
      try {
        await processLocalChange(operation, requestInfo);
        processed++;
      } catch (error) {
        console.error('❌ Error procesando operación offline:', error);
        errors.push({
          operation: operation.id,
          error: error.message
        });
      }
    }

    // Limpiar operaciones procesadas de la cola
    if (processed > 0) {
      await executeQuery(`
        DELETE FROM offline_queue
        WHERE device_id = ? AND id IN (
          SELECT id FROM (
            SELECT id FROM offline_queue
            WHERE device_id = ?
            ORDER BY created_at ASC
            LIMIT ?
          ) temp
        )
      `, [deviceId, deviceId, processed]);
    }

    res.json({
      success: true,
      data: {
        processed,
        errors,
        message: `${processed} operaciones procesadas, ${errors.length} errores`
      }
    });

  } catch (error) {
    console.error('❌ Error subiendo operaciones offline:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// 📥 BAJAR CAMBIOS REMOTOS
router.get('/download/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { since } = req.query;

    const remoteChanges = await getRemoteChanges(since, deviceId);

    res.json({
      success: true,
      data: remoteChanges,
      total: remoteChanges.length
    });

  } catch (error) {
    console.error('❌ Error descargando cambios remotos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ⚖️ RESOLVER CONFLICTOS
router.post('/resolve-conflict/:conflictId', async (req, res) => {
  try {
    const { conflictId } = req.params;
    const { resolution, selectedData } = req.body;
    const requestInfo = getRequestInfo(req);

    // Obtener conflicto
    const conflictQuery = `
      SELECT * FROM sync_conflicts WHERE id = ?
    `;
    const conflictResult = await executeQuery(conflictQuery, [conflictId]);

    if (conflictResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conflicto no encontrado'
      });
    }

    const conflict = conflictResult.rows[0];

    // Aplicar resolución
    if (resolution === 'local') {
      // Usar datos locales
      await applyResolution(conflict, selectedData || conflict.local_data, requestInfo);
    } else if (resolution === 'remote') {
      // Usar datos remotos
      await applyResolution(conflict, selectedData || conflict.remote_data, requestInfo);
    } else if (resolution === 'merge' && selectedData) {
      // Usar datos fusionados
      await applyResolution(conflict, selectedData, requestInfo);
    }

    // Marcar conflicto como resuelto
    await executeQuery(`
      UPDATE sync_conflicts SET
        resolution_status = 'resolved',
        resolved_by = ?,
        resolved_at = NOW()
      WHERE id = ?
    `, [requestInfo.userId, conflictId]);

    res.json({
      success: true,
      message: 'Conflicto resuelto exitosamente'
    });

  } catch (error) {
    console.error('❌ Error resolviendo conflicto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// 🧹 LIMPIAR DATOS ANTIGUOS DE SINCRONIZACIÓN
router.delete('/cleanup/:days', async (req, res) => {
  try {
    const { days } = req.params;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    // Eliminar operaciones offline antiguas
    const deleteOldQueue = await executeQuery(`
      DELETE FROM offline_queue WHERE created_at < ?
    `, [cutoffDate]);

    // Eliminar conflictos resueltos antiguos
    const deleteOldConflicts = await executeQuery(`
      DELETE FROM sync_conflicts
      WHERE resolution_status = 'resolved' AND created_at < ?
    `, [cutoffDate]);

    // Eliminar versiones antiguas de data_sync (mantener solo las últimas 10 por entidad)
    const deleteOldVersions = await executeQuery(`
      DELETE ds FROM data_sync ds
      INNER JOIN (
        SELECT entidad_tipo, entidad_id, MAX(version) as max_version
        FROM data_sync
        GROUP BY entidad_tipo, entidad_id
      ) latest ON ds.entidad_tipo = latest.entidad_tipo
        AND ds.entidad_id = latest.entidad_id
        AND ds.version < latest.max_version - 10
    `);

    res.json({
      success: true,
      data: {
        deletedQueue: deleteOldQueue.rows.affectedRows || 0,
        deletedConflicts: deleteOldConflicts.rows.affectedRows || 0,
        deletedVersions: deleteOldVersions.rows.affectedRows || 0,
        message: 'Limpieza completada'
      }
    });

  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// 🔧 FUNCIONES HELPER

// Procesar un cambio local
async function processLocalChange(change, requestInfo) {
  const { operation, entityType, entityId, data } = change;

  // Calcular hash y versión
  const dataHash = calculateHash(data);
  const version = await getNextVersion(entityType, entityId);

  // Actualizar tabla de versiones
  await executeQuery(`
    INSERT INTO data_sync (entidad_tipo, entidad_id, version, hash_md5, user_id, device_id, sync_status)
    VALUES (?, ?, ?, ?, ?, ?, 'synced')
    ON DUPLICATE KEY UPDATE
      version = VALUES(version),
      hash_md5 = VALUES(hash_md5),
      last_modified = NOW(),
      user_id = VALUES(user_id),
      device_id = VALUES(device_id),
      sync_status = 'synced'
  `, [entityType, entityId, version, dataHash, requestInfo.userId, requestInfo.deviceId]);

  // Procesar la operación específica
  switch (entityType) {
    case 'proyecto':
      await processProjectOperation(operation, entityId, data);
      break;
    case 'venta':
      await processSaleOperation(operation, entityId, data);
      break;
    case 'categoria':
      await processCategoryOperation(operation, entityId, data);
      break;
    case 'cotizador':
      await processQuotationOperation(operation, entityId, data);
      break;
  }
}

// Obtener cambios remotos desde timestamp
async function getRemoteChanges(since, deviceId) {
  let query = `
    SELECT ds.*, p.nombre_proyecto, v.numero_venta
    FROM data_sync ds
    LEFT JOIN proyectos p ON ds.entidad_tipo = 'proyecto' AND ds.entidad_id = p.id
    LEFT JOIN ventas v ON ds.entidad_tipo = 'venta' AND ds.entidad_id = v.id
    WHERE ds.sync_status = 'synced'
  `;

  const params = [];

  if (since) {
    query += ' AND ds.last_modified > ?';
    params.push(new Date(since));
  }

  query += ' ORDER BY ds.last_modified ASC LIMIT 1000';

  const result = await executeQuery(query, params);

  // Obtener datos completos para cada cambio
  const changes = [];
  for (const sync of result.rows) {
    const fullData = await getEntityData(sync.entidad_tipo, sync.entidad_id);
    if (fullData) {
      changes.push({
        entityType: sync.entidad_tipo,
        entityId: sync.entidad_id,
        version: sync.version,
        data: fullData,
        hash: sync.hash_md5,
        lastModified: sync.last_modified,
        userId: sync.user_id,
        deviceId: sync.device_id
      });
    }
  }

  return changes;
}

// Obtener conflictos pendientes
async function getPendingConflicts(deviceId) {
  const query = `
    SELECT * FROM sync_conflicts
    WHERE resolution_status = 'pending'
    ORDER BY created_at DESC
    LIMIT 50
  `;

  const result = await executeQuery(query);
  return result.rows;
}

// Obtener datos completos de una entidad
async function getEntityData(entityType, entityId) {
  try {
    switch (entityType) {
      case 'proyecto':
        const projectQuery = `
          SELECT p.*, pd.*, GROUP_CONCAT(pc.nombre_categoria) as categorias
          FROM proyectos p
          LEFT JOIN proyecto_detalles pd ON p.id = pd.proyecto_id
          LEFT JOIN proyecto_categorias pc ON p.id = pc.proyecto_id
          WHERE p.id = ?
          GROUP BY p.id
        `;
        const projectResult = await executeQuery(projectQuery, [entityId]);
        return projectResult.rows[0];

      case 'venta':
        const saleQuery = `
          SELECT v.*, GROUP_CONCAT(vc.categoria) as cotizadores
          FROM ventas v
          LEFT JOIN venta_cotizadores vc ON v.id = vc.venta_id
          WHERE v.id = ?
          GROUP BY v.id
        `;
        const saleResult = await executeQuery(saleQuery, [entityId]);
        return saleResult.rows[0];

      default:
        return null;
    }
  } catch (error) {
    console.error('❌ Error obteniendo datos de entidad:', error);
    return null;
  }
}

// Procesar operaciones específicas por entidad
async function processProjectOperation(operation, projectId, data) {
  switch (operation) {
    case 'create':
    case 'update':
      // Actualizar proyecto (usando la lógica existente)
      await executeQuery(`
        UPDATE proyectos SET
          nombre_proyecto = ?, nombre_cliente = ?, estado_proyecto = ?,
          tipo_proyecto = ?, monto_contrato = ?, presupuesto_proyecto = ?,
          utilidad_estimada_sin_factura = ?, utilidad_real_sin_factura = ?,
          utilidad_estimada_facturado = ?, utilidad_real_facturado = ?,
          adelantos_cliente = ?, credito_fiscal = ?, impuesto_real_proyecto = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
  data.nombreProyecto, data.nombreCliente, sanitizeEstadoForSync(data.estadoProyecto || 'Ejecucion'),
        data.tipoProyecto || 'Recibo', parseFloat(data.montoContrato || 0),
        parseFloat(data.presupuestoProyecto || 0), parseFloat(data.utilidadEstimadaSinFactura || 0),
        parseFloat(data.utilidadRealSinFactura || 0), parseFloat(data.utilidadEstimadaFacturado || 0),
        parseFloat(data.utilidadRealFacturado || 0), parseFloat(data.adelantosCliente || 0),
        parseFloat(data.creditoFiscal || 0), parseFloat(data.impuestoRealProyecto || 0),
        projectId
      ]);
      break;

    case 'delete':
      await executeQuery('DELETE FROM proyectos WHERE id = ?', [projectId]);
      break;
  }
}

async function processSaleOperation(operation, saleId, data) {
  // Similar para ventas
  switch (operation) {
    case 'create':
    case 'update':
      await executeQuery(`
        UPDATE ventas SET
          numero_venta = ?, estado = ?, cliente = ?, telefono = ?,
          requerimiento = ?, proyecto = ?, utilidad = ?, observaciones = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        data.numeroVenta, data.estado || 'Cotizando', data.cliente, data.telefono,
        data.requerimiento, data.proyecto, parseFloat(data.utilidad || 0), data.observaciones,
        saleId
      ]);
      break;

    case 'delete':
      await executeQuery('DELETE FROM ventas WHERE id = ?', [saleId]);
      break;
  }
}

async function processCategoryOperation(operation, categoryId, data) {
  // Para categorías
  switch (operation) {
    case 'create':
    case 'update':
      await executeQuery(`
        UPDATE proyecto_categorias SET
          nombre_categoria = ?, tipo_categoria = ?, orden_categoria = ?,
          presupuesto_del_proyecto = ?, contrato_proved_y_serv = ?,
          registro_egresos = ?, saldos_por_cancelar = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        data.nombreCategoria, data.tipoCategoria || 'F', data.ordenCategoria || 0,
        parseFloat(data.presupuestoDelProyecto || 0), parseFloat(data.contratoProvedYServ || 0),
        parseFloat(data.registroEgresos || 0), parseFloat(data.saldosPorCancelar || 0),
        categoryId
      ]);
      break;

    case 'delete':
      await executeQuery('DELETE FROM proyecto_categorias WHERE id = ?', [categoryId]);
      break;
  }
}

async function processQuotationOperation(operation, quotationId, data) {
  // Para cotizadores
  switch (operation) {
    case 'create':
    case 'update':
      await executeQuery(`
        UPDATE venta_cotizadores SET
          tipo_cotizador = ?, categoria = ?, monto = ?, observaciones = ?,
          orden_categoria = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        data.tipoCotizador, data.categoria, parseFloat(data.monto || 0),
        data.observaciones, data.ordenCategoria || 0, quotationId
      ]);
      break;

    case 'delete':
      await executeQuery('DELETE FROM venta_cotizadores WHERE id = ?', [quotationId]);
      break;
  }
}

// Obtener siguiente versión para una entidad
async function getNextVersion(entityType, entityId) {
  const query = `
    SELECT COALESCE(MAX(version), 0) + 1 as next_version
    FROM data_sync
    WHERE entidad_tipo = ? AND entidad_id = ?
  `;
  const result = await executeQuery(query, [entityType, entityId]);
  return result.rows[0].next_version;
}

// Aplicar resolución de conflicto
async function applyResolution(conflict, resolvedData, requestInfo) {
  const { entidad_tipo, entidad_id } = conflict;

  // Actualizar la entidad con los datos resueltos
  switch (entidad_tipo) {
    case 'proyecto':
      await processProjectOperation('update', entidad_id, resolvedData);
      break;
    case 'venta':
      await processSaleOperation('update', entidad_id, resolvedData);
      break;
    case 'categoria':
      await processCategoryOperation('update', entidad_id, resolvedData);
      break;
    case 'cotizador':
      await processQuotationOperation('update', entidad_id, resolvedData);
      break;
  }

  // Actualizar versión y hash
  const dataHash = calculateHash(resolvedData);
  const version = await getNextVersion(entidad_tipo, entidad_id);

  await executeQuery(`
    INSERT INTO data_sync (entidad_tipo, entidad_id, version, hash_md5, user_id, device_id, sync_status)
    VALUES (?, ?, ?, ?, ?, ?, 'synced')
    ON DUPLICATE KEY UPDATE
      version = VALUES(version),
      hash_md5 = VALUES(hash_md5),
      last_modified = NOW(),
      user_id = VALUES(user_id),
      device_id = VALUES(device_id),
      sync_status = 'synced'
  `, [entidad_tipo, entidad_id, version, dataHash, requestInfo.userId, requestInfo.deviceId]);
}

module.exports = router;


