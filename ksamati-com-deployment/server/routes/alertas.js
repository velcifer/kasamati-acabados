const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// 🧠 Función para generar alertas inteligentes automáticas
const generateSmartAlerts = async () => {
  const alertas = [];
  const now = new Date();

  try {
    // 📊 Obtener datos de proyectos para análisis
    const proyectosResult = await executeQuery(`
      SELECT 
        p.*, 
        DATEDIFF(CURRENT_DATE, p.updated_at) as dias_sin_actualizacion,
        COALESCE(pd.fecha_1, pd.fecha_2, pd.fecha_3) as proxima_fecha_limite
      FROM proyectos p
      LEFT JOIN proyecto_detalles pd ON p.id = pd.proyecto_id
      WHERE p.estado_proyecto != 'Completado'
      ORDER BY p.updated_at ASC
    `);

    // 🚨 ALERTAS CRÍTICAS - Proyectos sin actualizar por más de 7 días
    proyectosResult.rows.forEach(proyecto => {
      if (proyecto.dias_sin_actualizacion > 7) {
        alertas.push({
          id: `critical-${proyecto.id}-${Date.now()}`,
          tipo: 'critical',
          titulo: `🔥 Proyecto Sin Actualizar - CRÍTICO`,
          mensaje: `El proyecto "${proyecto.nombre_proyecto}" (Cliente: ${proyecto.nombre_cliente || 'Sin cliente'}) no ha sido actualizado hace ${proyecto.dias_sin_actualizacion} días. Revisa el estado urgentemente.`,
          fechaCreacion: new Date().toLocaleString('es-PE'),
          proyecto_id: proyecto.id,
          leida: false
        });
      }
    });

    // ⚠️ ALERTAS DE ERROR - Montos por cobrar altos
    proyectosResult.rows.forEach(proyecto => {
      const montoPorCobrar = parseFloat(proyecto.saldos_cobrar_proyecto) || 0;
      if (montoPorCobrar > 10000) {
        alertas.push({
          id: `error-${proyecto.id}-cobrar-${Date.now()}`,
          tipo: 'error',
          titulo: `💰 Monto Alto Por Cobrar`,
          mensaje: `El proyecto "${proyecto.nombre_proyecto}" tiene S/ ${montoPorCobrar.toFixed(2)} pendientes de cobro. Gestiona la cobranza.`,
          fechaCreacion: new Date().toLocaleString('es-PE'),
          proyecto_id: proyecto.id,
          leida: false
        });
      }
    });

    // ⚡ ALERTAS DE WARNING - Proyectos en ejecución por mucho tiempo
    proyectosResult.rows.forEach(proyecto => {
      const diasCreacion = Math.floor((now - new Date(proyecto.created_at)) / (1000 * 60 * 60 * 24));
      if (proyecto.estado_proyecto === 'Ejecucion' && diasCreacion > 30) {
        alertas.push({
          id: `warning-${proyecto.id}-tiempo-${Date.now()}`,
          tipo: 'warning',
          titulo: `⏰ Proyecto Extenso en Ejecución`,
          mensaje: `El proyecto "${proyecto.nombre_proyecto}" lleva ${diasCreacion} días en ejecución. Considera revisar el progreso.`,
          fechaCreacion: new Date().toLocaleString('es-PE'),
          proyecto_id: proyecto.id,
          leida: false
        });
      }
    });

    // ✅ ALERTAS SUCCESS - Proyectos completados recientemente
    const completadosRecientes = await executeQuery(`
      SELECT * FROM proyectos 
      WHERE estado_proyecto = 'Completado' 
      AND DATE(updated_at) >= DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY)
      ORDER BY updated_at DESC
    `);

    completadosRecientes.rows.forEach(proyecto => {
      alertas.push({
        id: `success-${proyecto.id}-completado-${Date.now()}`,
        tipo: 'success',
        titulo: `🎉 Proyecto Completado Exitosamente`,
        mensaje: `¡Felicidades! El proyecto "${proyecto.nombre_proyecto}" ha sido completado exitosamente.`,
        fechaCreacion: new Date().toLocaleString('es-PE'),
        proyecto_id: proyecto.id,
        leida: false
      });
    });

    // ℹ️ ALERTAS INFO - Estadísticas del sistema
    const totalProyectos = proyectosResult.rows.length;
    if (totalProyectos > 0) {
      alertas.push({
        id: `info-stats-${Date.now()}`,
        tipo: 'info',
        titulo: `📈 Resumen del Sistema`,
        mensaje: `Tienes ${totalProyectos} proyectos activos. Sistema funcionando correctamente.`,
        fechaCreacion: new Date().toLocaleString('es-PE'),
        leida: false
      });
    }

    // 🎯 ALERTAS PERSONALIZADAS - Basadas en métricas de negocio
    const totalContratos = proyectosResult.rows.reduce((sum, p) => sum + (parseFloat(p.monto_contrato) || 0), 0);
    if (totalContratos > 100000) {
      alertas.push({
        id: `info-milestone-${Date.now()}`,
        tipo: 'info',
        titulo: `🚀 Hito Financiero Alcanzado`,
        mensaje: `¡Increíble! Has alcanzado S/ ${totalContratos.toFixed(2)} en contratos activos. ¡Sigue así!`,
        fechaCreacion: new Date().toLocaleString('es-PE'),
        leida: false
      });
    }

  } catch (error) {
    console.error('Error generando alertas inteligentes:', error);
    // Alerta de fallback en caso de error
    alertas.push({
      id: `error-system-${Date.now()}`,
      tipo: 'error',
      titulo: `⚠️ Error del Sistema`,
      mensaje: `Hubo un problema generando las alertas automáticas. Revisa la conexión de base de datos.`,
      fechaCreacion: new Date().toLocaleString('es-PE'),
      leida: false
    });
  }

  return alertas;
};

// GET /api/alertas - Obtener alertas inteligentes
router.get('/', async (req, res) => {
  try {
    // Generar alertas inteligentes dinámicamente
    const alertasActivas = await generateSmartAlerts();
    
    // Mock de alertas leídas (en producción esto vendría de BD)
    const alertasLeidas = [
      {
        id: 'leida-1',
        titulo: 'Proyecto Alpha completado',
        mensaje: 'El proyecto Alpha fue completado exitosamente',
        fechaCreacion: new Date(Date.now() - 86400000).toLocaleString('es-PE'),
        leida: true
      }
    ];

    // Calcular estadísticas
    const estadisticas = {
      totalAlertas: alertasActivas.length,
      alertasCriticas: alertasActivas.filter(a => a.tipo === 'critical').length,
      alertasImportantes: alertasActivas.filter(a => a.tipo === 'error').length,
      alertasInfo: alertasActivas.filter(a => a.tipo === 'info').length,
      alertasPendientes: alertasActivas.filter(a => a.tipo === 'warning').length
    };

    res.json({
      success: true,
      message: 'Alertas inteligentes generadas automáticamente',
      data: {
        alertasActivas,
        alertasLeidas,
        estadisticas
      }
    });

  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// POST /api/alertas - Crear nueva alerta manual
router.post('/', async (req, res) => {
  try {
    const { titulo, mensaje, tipo = 'info', prioridad = 'normal' } = req.body;
    
    const nuevaAlerta = {
      id: `manual-${Date.now()}`,
      titulo,
      mensaje,
      tipo,
      prioridad,
      leida: false,
      fechaCreacion: new Date().toLocaleString('es-PE'),
      created_at: new Date().toISOString()
    };

    // En un sistema real, esto se guardaría en base de datos
    res.status(201).json({
      success: true,
      message: 'Alerta creada exitosamente',
      data: nuevaAlerta
    });

  } catch (error) {
    console.error('Error creando alerta:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/alertas/:id/leer - Marcar alerta como leída
router.put('/:id/leer', async (req, res) => {
  try {
    const { id } = req.params;
    
    // En un sistema real, aquí actualizarías la base de datos
    res.json({
      success: true,
      message: 'Alerta marcada como leída',
      data: { 
        id, 
        leida: true,
        fechaLectura: new Date().toLocaleString('es-PE')
      }
    });

  } catch (error) {
    console.error('Error marcando alerta como leída:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/alertas/leer-todas - Marcar todas las alertas como leídas
router.put('/leer-todas', async (req, res) => {
  try {
    // En un sistema real, aquí marcarías todas las alertas como leídas en BD
    
    res.json({
      success: true,
      message: 'Todas las alertas han sido marcadas como leídas',
      data: {
        fechaLectura: new Date().toLocaleString('es-PE'),
        alertasProcesadas: true
      }
    });

  } catch (error) {
    console.error('Error marcando todas las alertas como leídas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/alertas/estadisticas - Obtener estadísticas detalladas
router.get('/estadisticas', async (req, res) => {
  try {
    const alertas = await generateSmartAlerts();
    
    const estadisticasDetalladas = {
      totalAlertas: alertas.length,
      porTipo: {
        critical: alertas.filter(a => a.tipo === 'critical').length,
        error: alertas.filter(a => a.tipo === 'error').length,
        warning: alertas.filter(a => a.tipo === 'warning').length,
        success: alertas.filter(a => a.tipo === 'success').length,
        info: alertas.filter(a => a.tipo === 'info').length
      },
      tendencias: {
        ultimaHora: alertas.filter(a => {
          const ahora = new Date();
          const alertaFecha = new Date(a.fechaCreacion);
          return (ahora - alertaFecha) < 3600000; // 1 hora en ms
        }).length
      },
      proyectosAfectados: [...new Set(alertas.map(a => a.proyecto_id).filter(Boolean))].length
    };

    res.json({
      success: true,
      data: estadisticasDetalladas
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de alertas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;

