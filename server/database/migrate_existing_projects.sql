-- 🔄 SCRIPT DE MIGRACIÓN: Crear registros en proyecto_detalles para proyectos existentes
-- Este script crea registros en proyecto_detalles para todos los proyectos que no tienen uno
-- Ejecutar este script una vez para migrar proyectos existentes

USE ksamti_proyectos;

-- Crear registros en proyecto_detalles para proyectos que no tienen uno
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
)
SELECT 
    p.id AS proyecto_id,
    NULL AS descripcion_proyecto,
    NULL AS ubicacion_proyecto,
    NULL AS fecha_inicio,
    NULL AS fecha_estimada_fin,
    COALESCE(p.presupuesto_proyecto, 0.00) AS presupuesto_del_proyecto,
    0.00 AS total_egresos_proyecto,
    0.00 AS balance_del_presupuesto,
    18.00 AS igv_sunat,
    0.00 AS credito_fiscal_estimado,
    0.00 AS impuesto_estimado_del_proyecto,
    0.00 AS credito_fiscal_real,
    0.00 AS impuesto_real_del_proyecto,
    COALESCE(p.saldos_cobrar_proyecto, 0.00) AS saldo_x_cobrar,
    0.00 AS balance_de_compras_del_proyecto,
    NULL AS observaciones_del_proyecto,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, -- fecha_1 a fecha_7
    NULL, NULL, NULL, NULL, NULL, NULL -- fecha_8 a fecha_13
FROM proyectos p
LEFT JOIN proyecto_detalles pd ON p.id = pd.proyecto_id
WHERE pd.id IS NULL;

-- Mostrar resultados
SELECT 
    COUNT(*) AS proyectos_migrados,
    'Registros creados en proyecto_detalles para proyectos existentes' AS mensaje
FROM proyecto_detalles pd
INNER JOIN proyectos p ON pd.proyecto_id = p.id;

-- Verificar que todos los proyectos tienen registro en proyecto_detalles
SELECT 
    p.id,
    p.numero_proyecto,
    p.nombre_proyecto,
    CASE 
        WHEN pd.id IS NOT NULL THEN '✅ Tiene detalles'
        ELSE '❌ Sin detalles'
    END AS estado_detalles
FROM proyectos p
LEFT JOIN proyecto_detalles pd ON p.id = pd.proyecto_id
ORDER BY p.numero_proyecto;


