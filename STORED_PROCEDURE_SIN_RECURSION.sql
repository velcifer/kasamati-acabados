-- ========================================
-- 🔧 STORED PROCEDURE SIN RECURSIÓN INFINITA
-- ========================================
-- Este stored procedure evita la recursión deshabilitando temporalmente
-- el trigger tr_proyectos_update antes de hacer UPDATE
-- ========================================

DELIMITER //

DROP PROCEDURE IF EXISTS CalcularCamposAutomaticosProyecto //

CREATE PROCEDURE CalcularCamposAutomaticosProyecto(
    IN proyecto_id_param INT
)
BEGIN
    DECLARE monto_contrato_val DECIMAL(15,2) DEFAULT 0;
    DECLARE adelantos_val DECIMAL(15,2) DEFAULT 0;
    DECLARE util_est_sin_fact DECIMAL(15,2) DEFAULT 0;
    DECLARE util_real_sin_fact DECIMAL(15,2) DEFAULT 0;
    DECLARE util_est_con_fact DECIMAL(15,2) DEFAULT 0;
    DECLARE util_real_con_fact DECIMAL(15,2) DEFAULT 0;
    DECLARE presupuesto_val DECIMAL(15,2) DEFAULT 0;
    DECLARE total_egresos_val DECIMAL(15,2) DEFAULT 0;
    DECLARE total_contratos_val DECIMAL(15,2) DEFAULT 0;
    DECLARE total_saldos_val DECIMAL(15,2) DEFAULT 0;

    -- Obtener valores base del proyecto
    SELECT 
        monto_contrato,
        adelantos_cliente,
        utilidad_estimada_sin_factura,
        utilidad_real_sin_factura,
        utilidad_estimada_facturado,
        utilidad_real_facturado,
        presupuesto_proyecto
    INTO 
        monto_contrato_val,
        adelantos_val,
        util_est_sin_fact,
        util_real_sin_fact,
        util_est_con_fact,
        util_real_con_fact,
        presupuesto_val
    FROM proyectos
    WHERE id = proyecto_id_param;

    -- Calcular totales de categorías
    SELECT 
        COALESCE(SUM(registro_egresos), 0),
        COALESCE(SUM(contrato_proved_y_serv), 0),
        COALESCE(SUM(saldos_por_cancelar), 0)
    INTO 
        total_egresos_val,
        total_contratos_val,
        total_saldos_val
    FROM proyecto_categorias
    WHERE proyecto_id = proyecto_id_param
      AND esta_activo = 1;

    -- ⚠️ DESHABILITAR TEMPORALMENTE EL TRIGGER para evitar recursión
    SET @DISABLE_TRIGGER = 1;
    
    -- Actualizar tabla proyectos (esto NO disparará el trigger si está deshabilitado)
    UPDATE proyectos
    SET
        balance_proyecto = presupuesto_val - monto_contrato_val,
        balance_utilidad_sin_factura = util_est_sin_fact - util_real_sin_fact,
        balance_utilidad_con_factura = util_est_con_fact - util_real_con_fact,
        saldos_cobrar_proyecto = monto_contrato_val - adelantos_val - (monto_contrato_val * 0.05),
        saldos_reales_proyecto = monto_contrato_val - adelantos_val,
        saldo_pagar_proveedores = total_contratos_val - total_saldos_val,
        impuesto_real_proyecto = monto_contrato_val * 0.19,
        credito_fiscal = total_contratos_val * 0.19,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = proyecto_id_param;

    -- Actualizar tabla detalle
    UPDATE proyecto_detalles
    SET
        balance_del_presupuesto = presupuesto_val - total_egresos_val,
        saldo_x_cobrar = monto_contrato_val - adelantos_val,
        balance_de_compras_del_proyecto = presupuesto_val - total_egresos_val,
        total_egresos_proyecto = total_egresos_val,
        updated_at = CURRENT_TIMESTAMP
    WHERE proyecto_id = proyecto_id_param;

    -- ⚠️ REHABILITAR EL TRIGGER
    SET @DISABLE_TRIGGER = 0;

END //

DELIMITER ;

