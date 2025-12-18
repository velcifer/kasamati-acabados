-- ========================================
-- 🗄️ KSAMATI PROJECT - ESQUEMA COMPLETO DE BASE DE DATOS
-- ========================================
-- Nombre de la Base de Datos: ksamati_proyectos
-- Motor: MySQL 5.7+ / MySQL 8.0+
-- Charset: utf8mb4
-- Collation: utf8mb4_unicode_ci
-- ========================================

-- ========================================
-- 📊 CREAR BASE DE DATOS
-- ========================================
CREATE DATABASE IF NOT EXISTS ksamati_proyectos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ksamati_proyectos;

-- ========================================
-- 📋 TABLA 1: proyectos
-- ========================================
CREATE TABLE proyectos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_proyecto INT UNIQUE NOT NULL,
    nombre_proyecto VARCHAR(255) NOT NULL,
    nombre_cliente VARCHAR(255),
    estado_proyecto ENUM('Ejecucion', 'Recibo', 'Completado') DEFAULT 'Ejecucion',
    tipo_proyecto ENUM('Recibo', 'Contrato', 'Servicio') DEFAULT 'Recibo',
    telefono VARCHAR(50),
    
    -- 💰 ANÁLISIS FINANCIERO (12 campos calculados como en Excel)
    monto_contrato DECIMAL(15,2) DEFAULT 0.00,
    presupuesto_proyecto DECIMAL(15,2) DEFAULT 0.00,
    balance_proyecto DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    utilidad_estimada_sin_factura DECIMAL(15,2) DEFAULT 0.00,
    utilidad_real_sin_factura DECIMAL(15,2) DEFAULT 0.00,
    balance_utilidad_sin_factura DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    utilidad_estimada_facturado DECIMAL(15,2) DEFAULT 0.00,
    utilidad_real_facturado DECIMAL(15,2) DEFAULT 0.00,
    balance_utilidad_con_factura DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    
    -- 💳 COBRANZAS Y SALDOS (con fórmulas automáticas)
    total_contrato_proveedores DECIMAL(15,2) DEFAULT 0.00,
    saldo_pagar_proveedores DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    adelantos_cliente DECIMAL(15,2) DEFAULT 0.00,
    saldos_reales_proyecto DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    saldos_cobrar_proyecto DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    
    -- 📊 IMPUESTOS Y SUNAT
    credito_fiscal DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    impuesto_real_proyecto DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    
    -- 📅 METADATOS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_numero_proyecto (numero_proyecto),
    INDEX idx_estado (estado_proyecto),
    INDEX idx_cliente (nombre_cliente),
    INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 📋 TABLA 2: proyecto_detalles
-- ========================================
CREATE TABLE proyecto_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    
    -- 📋 DATOS BÁSICOS EXTENDIDOS
    descripcion_proyecto TEXT,
    ubicacion_proyecto VARCHAR(255),
    fecha_inicio DATE,
    fecha_estimada_fin DATE,
    
    -- 💰 ANÁLISIS FINANCIERO EXTENDIDO
    presupuesto_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    total_egresos_proyecto DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    balance_del_presupuesto DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    
    -- 📊 IGV Y SUNAT DETALLADO
    igv_sunat DECIMAL(5,2) DEFAULT 19.00, -- Actualizado a 19%
    credito_fiscal_estimado DECIMAL(15,2) DEFAULT 0.00,
    impuesto_estimado_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    credito_fiscal_real DECIMAL(15,2) DEFAULT 0.00,
    impuesto_real_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    
    -- 💳 COBRANZAS DETALLADAS
    saldo_x_cobrar DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    balance_de_compras_del_proyecto DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    
    -- 📝 OBSERVACIONES
    observaciones_del_proyecto TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    INDEX idx_proyecto_id (proyecto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 📋 TABLA 3: proyecto_categorias
-- ========================================
CREATE TABLE proyecto_categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    nombre_categoria VARCHAR(255) NOT NULL,
    tipo_categoria ENUM('F', 'S', 'P', '') DEFAULT 'F', -- F=Facturado, S=Servicio, P=Producto, ''=Sin tipo
    orden_categoria INT DEFAULT 0,
    
    -- 💰 VALORES FINANCIEROS POR CATEGORÍA
    presupuesto_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    contrato_proved_y_serv DECIMAL(15,2) DEFAULT 0.00,
    registro_egresos DECIMAL(15,2) DEFAULT 0.00,
    saldos_por_cancelar DECIMAL(15,2) DEFAULT 0.00,
    
    -- 🔧 CONFIGURACIÓN
    es_editable BOOLEAN DEFAULT TRUE,
    esta_activo BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    INDEX idx_proyecto_categoria (proyecto_id, orden_categoria),
    INDEX idx_tipo (tipo_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 📋 TABLA 4: proyecto_documentos
-- ========================================
CREATE TABLE proyecto_documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    proveedor VARCHAR(255),
    descripcion TEXT,
    fecha DATE,
    monto DECIMAL(15,2) DEFAULT 0.00,
    orden_documento INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    INDEX idx_proyecto_documento (proyecto_id, orden_documento),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 📋 TABLA 5: archivos_adjuntos
-- ========================================
CREATE TABLE archivos_adjuntos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entidad_tipo ENUM('proyecto', 'venta') NOT NULL, -- Para qué entidad es el archivo
    entidad_id INT NOT NULL, -- ID del proyecto o venta
    nombre_archivo VARCHAR(500) NOT NULL,
    nombre_original VARCHAR(500) NOT NULL,
    tipo_archivo VARCHAR(100) NOT NULL, -- MIME type
    tamaño_archivo BIGINT NOT NULL, -- en bytes
    ruta_archivo VARCHAR(1000) NOT NULL, -- ruta en el servidor
    
    -- 🔍 METADATOS ADICIONALES
    extension_archivo VARCHAR(10),
    es_imagen BOOLEAN DEFAULT FALSE,
    es_pdf BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_entidad (entidad_tipo, entidad_id),
    INDEX idx_tipo (tipo_archivo),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 📋 TABLA 6: ventas
-- ========================================
CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_venta INT UNIQUE NOT NULL,
    estado ENUM('Cotizando', 'Enviado', 'Aprobado', 'Facturado') DEFAULT 'Cotizando',
    cliente VARCHAR(255),
    telefono VARCHAR(50),
    requerimiento TEXT,
    proyecto VARCHAR(255),
    
    -- 💰 TOTALES PRINCIPALES (calculados automáticamente)
    utilidad DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    total_utilidad DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    total_recibo DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    total_facturado DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    total_doble_modo_con DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    total_doble_modo_sin DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    
    -- 📝 OBSERVACIONES Y ARCHIVOS
    observaciones TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_numero_venta (numero_venta),
    INDEX idx_estado (estado),
    INDEX idx_cliente (cliente),
    INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 📋 TABLA 7: venta_cotizadores
-- ========================================
CREATE TABLE venta_cotizadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    tipo_cotizador ENUM('melamina', 'granito', 'tercializaciones') NOT NULL,
    categoria VARCHAR(255) NOT NULL,
    monto DECIMAL(15,2) DEFAULT 0.00,
    observaciones TEXT,
    orden_categoria INT DEFAULT 0,
    es_editable BOOLEAN DEFAULT TRUE,
    
    -- 🧮 TOTALES POR COTIZADOR (calculados)
    recibo_interno DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    monto_facturado DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    monto_con_recibo DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    factura_total DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    INDEX idx_venta_cotizador (venta_id, tipo_cotizador),
    INDEX idx_orden (orden_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 📋 TABLA 8: proyecto_cambios
-- ========================================
CREATE TABLE proyecto_cambios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entidad_tipo ENUM('proyecto', 'venta') NOT NULL,
    entidad_id INT NOT NULL,
    campo_modificado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario VARCHAR(100) DEFAULT 'system',
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_entidad_cambio (entidad_tipo, entidad_id, created_at),
    INDEX idx_campo (campo_modificado),
    INDEX idx_usuario (usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 📋 TABLA 9: data_sync
-- ========================================
CREATE TABLE data_sync (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entidad_tipo ENUM('proyecto', 'venta', 'categoria', 'cotizador') NOT NULL,
    entidad_id INT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    hash_md5 VARCHAR(32) NOT NULL,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_id VARCHAR(100) DEFAULT 'system',
    device_id VARCHAR(100) DEFAULT 'unknown',
    sync_status ENUM('synced', 'pending', 'conflict') DEFAULT 'synced',

    INDEX idx_entidad (entidad_tipo, entidad_id),
    INDEX idx_version (version),
    INDEX idx_sync_status (sync_status),
    INDEX idx_last_modified (last_modified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 📋 TABLA 10: offline_queue
-- ========================================
CREATE TABLE offline_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operation_type ENUM('create', 'update', 'delete') NOT NULL,
    entidad_tipo ENUM('proyecto', 'venta', 'categoria', 'cotizador') NOT NULL,
    entidad_id INT,
    data_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retry_count INT DEFAULT 0,
    last_retry TIMESTAMP NULL,
    error_message TEXT,
    priority INT DEFAULT 1, -- 1=normal, 2=alta, 3=crítica
    user_id VARCHAR(100) DEFAULT 'system',
    device_id VARCHAR(100) DEFAULT 'unknown',

    INDEX idx_operation (operation_type),
    INDEX idx_entidad (entidad_tipo, entidad_id),
    INDEX idx_created (created_at),
    INDEX idx_priority (priority DESC, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 📋 TABLA 11: sync_conflicts
-- ========================================
CREATE TABLE sync_conflicts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entidad_tipo ENUM('proyecto', 'venta', 'categoria', 'cotizador') NOT NULL,
    entidad_id INT NOT NULL,
    local_version INT NOT NULL,
    remote_version INT NOT NULL,
    local_data JSON,
    remote_data JSON,
    conflict_type ENUM('data_conflict', 'delete_conflict', 'create_conflict') NOT NULL,
    resolution_status ENUM('pending', 'resolved', 'discarded') DEFAULT 'pending',
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_entidad (entidad_tipo, entidad_id),
    INDEX idx_status (resolution_status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 📋 TABLA 12: device_sync_status
-- ========================================
CREATE TABLE device_sync_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL UNIQUE,
    device_name VARCHAR(255),
    last_sync TIMESTAMP NULL,
    sync_status ENUM('online', 'offline', 'syncing') DEFAULT 'offline',
    pending_operations INT DEFAULT 0,
    last_ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_device (device_id),
    INDEX idx_status (sync_status),
    INDEX idx_last_sync (last_sync)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 🔧 PROCEDIMIENTOS ALMACENADOS (STORED PROCEDURES)
-- ========================================

DELIMITER //

-- ========================================
-- 📋 STORED PROCEDURE 1: CalcularCamposAutomaticosProyecto
-- ========================================
-- Descripción: Recalcula todos los campos automáticos de un proyecto
-- Parámetros: proyecto_id_param (INT) - ID del proyecto
-- ========================================
CREATE PROCEDURE CalcularCamposAutomaticosProyecto(IN proyecto_id_param INT)
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
        monto_contrato, adelantos_cliente,
        utilidad_estimada_sin_factura, utilidad_real_sin_factura,
        utilidad_estimada_facturado, utilidad_real_facturado,
        presupuesto_proyecto
    INTO 
        monto_contrato_val, adelantos_val,
        util_est_sin_fact, util_real_sin_fact,
        util_est_con_fact, util_real_con_fact,
        presupuesto_val
    FROM proyectos WHERE id = proyecto_id_param;
    
    -- Calcular totales de categorías
    SELECT 
        COALESCE(SUM(registro_egresos), 0),
        COALESCE(SUM(contrato_proved_y_serv), 0),
        COALESCE(SUM(saldos_por_cancelar), 0)
    INTO total_egresos_val, total_contratos_val, total_saldos_val
    FROM proyecto_categorias 
    WHERE proyecto_id = proyecto_id_param AND esta_activo = TRUE;
    
    -- 🧮 FÓRMULAS AUTOMÁTICAS (12 campos calculados)
    UPDATE proyectos SET
        -- Balance y utilidades
        balance_proyecto = presupuesto_val - monto_contrato_val,
        balance_utilidad_sin_factura = util_est_sin_fact - util_real_sin_fact,
        balance_utilidad_con_factura = util_est_con_fact - util_real_con_fact,
        
        -- Saldos y cobranzas
        saldos_cobrar_proyecto = monto_contrato_val - adelantos_val - (monto_contrato_val * 0.05),
        saldos_reales_proyecto = monto_contrato_val - adelantos_val,
        saldo_pagar_proveedores = total_contratos_val - total_saldos_val,
        
        -- Impuestos (19% IGV)
        impuesto_real_proyecto = monto_contrato_val * 0.19,
        credito_fiscal = total_contratos_val * 0.19,
        
        updated_at = CURRENT_TIMESTAMP
    WHERE id = proyecto_id_param;
    
    -- Actualizar campos calculados en tabla detalle
    UPDATE proyecto_detalles SET
        balance_del_presupuesto = presupuesto_val - total_egresos_val,
        saldo_x_cobrar = monto_contrato_val - adelantos_val,
        balance_de_compras_del_proyecto = presupuesto_val - total_egresos_val,
        total_egresos_proyecto = total_egresos_val,
        updated_at = CURRENT_TIMESTAMP
    WHERE proyecto_id = proyecto_id_param;
END //

-- ========================================
-- 📋 STORED PROCEDURE 2: CalcularCamposAutomaticosVenta
-- ========================================
-- Descripción: Recalcula todos los campos automáticos de una venta
-- Parámetros: venta_id_param (INT) - ID de la venta
-- ========================================
CREATE PROCEDURE CalcularCamposAutomaticosVenta(IN venta_id_param INT)
BEGIN
    DECLARE estado_val VARCHAR(50);
    DECLARE requerimiento_val TEXT;
    DECLARE proyecto_val VARCHAR(255);
    DECLARE utilidad_calculada DECIMAL(15,2) DEFAULT 0;
    DECLARE monto_base DECIMAL(15,2) DEFAULT 0;
    
    -- Obtener datos básicos de la venta
    SELECT estado, requerimiento, proyecto
    INTO estado_val, requerimiento_val, proyecto_val
    FROM ventas WHERE id = venta_id_param;
    
    -- 🧮 CÁLCULO INTELIGENTE DE UTILIDAD (como en el frontend)
    
    -- Detectar montos en el texto
    SET monto_base = COALESCE(
        CAST(REGEXP_REPLACE(
            REGEXP_SUBSTR(CONCAT(requerimiento_val, ' ', proyecto_val), '[0-9,]+'),
            '[^0-9.]', ''
        ) AS DECIMAL(15,2)), 
        0
    );
    
    -- Calcular utilidad según estado y tipo
    CASE 
        WHEN estado_val = 'Facturado' THEN
            SET utilidad_calculada = monto_base * 0.25; -- 25%
        WHEN estado_val = 'Aprobado' THEN
            SET utilidad_calculada = monto_base * 0.20; -- 20%
        WHEN estado_val = 'Enviado' THEN
            SET utilidad_calculada = monto_base * 0.15; -- 15%
        WHEN estado_val = 'Cotizando' THEN
            CASE
                WHEN requerimiento_val LIKE '%mobiliario%' OR requerimiento_val LIKE '%muebles%' THEN
                    SET utilidad_calculada = monto_base * 0.30; -- 30%
                WHEN requerimiento_val LIKE '%oficina%' OR requerimiento_val LIKE '%corporativo%' THEN
                    SET utilidad_calculada = monto_base * 0.25; -- 25%
                WHEN requerimiento_val LIKE '%casa%' OR requerimiento_val LIKE '%hogar%' THEN
                    SET utilidad_calculada = monto_base * 0.35; -- 35%
                ELSE
                    SET utilidad_calculada = monto_base * 0.20; -- 20% por defecto
            END CASE;
        ELSE
            SET utilidad_calculada = 1500; -- Utilidad base
    END CASE;
    
    -- Si no se detectó monto, usar valores por defecto según tipo
    IF monto_base = 0 THEN
        CASE
            WHEN requerimiento_val LIKE '%mobiliario%' THEN
                SET utilidad_calculada = 2500; -- Utilidad promedio mobiliario
            WHEN requerimiento_val LIKE '%oficina%' THEN
                SET utilidad_calculada = 3500; -- Utilidad promedio oficinas
            ELSE
                SET utilidad_calculada = 1500; -- Utilidad base
        END CASE;
    END IF;
    
    -- Actualizar la venta con utilidad calculada
    UPDATE ventas SET
        utilidad = utilidad_calculada,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = venta_id_param;
    
    -- Recalcular totales de cotizadores si existen
    UPDATE ventas SET
        total_utilidad = (
            SELECT COALESCE(SUM(monto), 0) 
            FROM venta_cotizadores 
            WHERE venta_id = venta_id_param
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = venta_id_param;
END //

DELIMITER ;

-- ========================================
-- 🎯 TRIGGERS PARA CÁLCULOS AUTOMÁTICOS
-- ========================================

DELIMITER //

-- ========================================
-- 📋 TRIGGER 1: tr_proyectos_update
-- ========================================
-- Descripción: Se ejecuta después de actualizar un proyecto
-- Acción: Llama al procedimiento CalcularCamposAutomaticosProyecto
-- ========================================
CREATE TRIGGER tr_proyectos_update 
    AFTER UPDATE ON proyectos
    FOR EACH ROW
BEGIN
    CALL CalcularCamposAutomaticosProyecto(NEW.id);
END //

-- ========================================
-- 📋 TRIGGER 2: tr_categorias_update
-- ========================================
-- Descripción: Se ejecuta después de actualizar una categoría
-- Acción: Llama al procedimiento CalcularCamposAutomaticosProyecto
-- ========================================
CREATE TRIGGER tr_categorias_update
    AFTER UPDATE ON proyecto_categorias
    FOR EACH ROW
BEGIN
    CALL CalcularCamposAutomaticosProyecto(NEW.proyecto_id);
END //

-- ========================================
-- 📋 TRIGGER 3: tr_categorias_insert
-- ========================================
-- Descripción: Se ejecuta después de insertar una categoría
-- Acción: Llama al procedimiento CalcularCamposAutomaticosProyecto
-- ========================================
CREATE TRIGGER tr_categorias_insert
    AFTER INSERT ON proyecto_categorias
    FOR EACH ROW
BEGIN
    CALL CalcularCamposAutomaticosProyecto(NEW.proyecto_id);
END //

-- ========================================
-- 📋 TRIGGER 4: tr_ventas_update
-- ========================================
-- Descripción: Se ejecuta después de actualizar una venta
-- Acción: Llama al procedimiento CalcularCamposAutomaticosVenta
-- ========================================
CREATE TRIGGER tr_ventas_update
    AFTER UPDATE ON ventas
    FOR EACH ROW
BEGIN
    CALL CalcularCamposAutomaticosVenta(NEW.id);
END //

-- ========================================
-- 📋 TRIGGER 5: tr_cotizadores_update
-- ========================================
-- Descripción: Se ejecuta después de actualizar un cotizador
-- Acción: Llama al procedimiento CalcularCamposAutomaticosVenta
-- ========================================
CREATE TRIGGER tr_cotizadores_update
    AFTER UPDATE ON venta_cotizadores
    FOR EACH ROW
BEGIN
    CALL CalcularCamposAutomaticosVenta(NEW.venta_id);
END //

DELIMITER ;

-- ========================================
-- 📊 RESUMEN COMPLETO DE LA BASE DE DATOS
-- ========================================

-- Nombre de la Base de Datos: ksamati_proyectos

-- Total de Tablas: 12
-- 1. proyectos
-- 2. proyecto_detalles
-- 3. proyecto_categorias
-- 4. proyecto_documentos
-- 5. archivos_adjuntos
-- 6. ventas
-- 7. venta_cotizadores
-- 8. proyecto_cambios
-- 9. data_sync
-- 10. offline_queue
-- 11. sync_conflicts
-- 12. device_sync_status

-- Total de Stored Procedures: 2
-- 1. CalcularCamposAutomaticosProyecto
-- 2. CalcularCamposAutomaticosVenta

-- Total de Triggers: 5
-- 1. tr_proyectos_update
-- 2. tr_categorias_update
-- 3. tr_categorias_insert
-- 4. tr_ventas_update
-- 5. tr_cotizadores_update

-- ========================================
-- ✅ FIN DEL ESQUEMA COMPLETO
-- ========================================

