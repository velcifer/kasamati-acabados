-- 🗄️ KSAMATI PROJECT - COMPLETE MySQL DATABASE SCHEMA
-- Estructura completa actualizada con todas las funcionalidades nuevas
-- Incluye: Proyectos, Ventas, Documentos, Archivos, Fórmulas Automáticas

-- ========================================
-- 📊 CREAR BASE DE DATOS
-- ========================================
CREATE DATABASE IF NOT EXISTS ksamati_proyectos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ksamati_proyectos;

-- ========================================
-- 📋 TABLA PRINCIPAL DE PROYECTOS
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
-- 🏗️ TABLA DETALLE COMPLETO DE PROYECTOS
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
-- 📦 TABLA CATEGORÍAS DE PROVEEDORES (24 categorías como en Excel)
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
-- 📄 TABLA DOCUMENTOS DEL PROYECTO (NUEVA)
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
-- 📎 TABLA ARCHIVOS ADJUNTOS (NUEVA)
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
-- 💰 TABLA PRINCIPAL DE VENTAS (NUEVA)
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
-- 🧮 TABLA COTIZADORES DE VENTAS (NUEVA)
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
-- 📊 TABLA PARA LOGS DE CAMBIOS (AUDITORÍA)
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
-- 🔧 PROCEDIMIENTOS ALMACENADOS PARA CÁLCULOS AUTOMÁTICOS
-- ========================================

DELIMITER //

-- 🧮 Procedimiento para recalcular campos automáticos de PROYECTOS
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

-- 💰 Procedimiento para recalcular campos automáticos de VENTAS
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

-- Triggers para PROYECTOS
DELIMITER //
CREATE TRIGGER tr_proyectos_update 
    AFTER UPDATE ON proyectos
    FOR EACH ROW
BEGIN
    CALL CalcularCamposAutomaticosProyecto(NEW.id);
END //

CREATE TRIGGER tr_categorias_update
    AFTER UPDATE ON proyecto_categorias
    FOR EACH ROW
BEGIN
    CALL CalcularCamposAutomaticosProyecto(NEW.proyecto_id);
END //

CREATE TRIGGER tr_categorias_insert
    AFTER INSERT ON proyecto_categorias
    FOR EACH ROW
BEGIN
    CALL CalcularCamposAutomaticosProyecto(NEW.proyecto_id);
END //

-- Triggers para VENTAS
CREATE TRIGGER tr_ventas_update
    AFTER UPDATE ON ventas
    FOR EACH ROW
BEGIN
    CALL CalcularCamposAutomaticosVenta(NEW.id);
END //

CREATE TRIGGER tr_cotizadores_update
    AFTER UPDATE ON venta_cotizadores
    FOR EACH ROW
BEGIN
    CALL CalcularCamposAutomaticosVenta(NEW.venta_id);
END //

DELIMITER ;

-- ========================================
-- 📝 INSERTAR DATOS DE EJEMPLO PARA DESARROLLO
-- ========================================

-- Proyectos de ejemplo
INSERT INTO proyectos (
    numero_proyecto, nombre_proyecto, nombre_cliente, 
    monto_contrato, presupuesto_proyecto, adelantos_cliente,
    utilidad_estimada_sin_factura, utilidad_real_sin_factura,
    utilidad_estimada_facturado, utilidad_real_facturado
) VALUES 
(1, 'Oficina Corporativa ABC', 'ABC Corp', 25000.00, 22000.00, 8000.00, 5000.00, 4500.00, 4200.00, 4000.00),
(2, 'Casa Residencial XYZ', 'Familia Pérez', 18000.00, 16000.00, 6000.00, 3600.00, 3200.00, 3000.00, 2800.00),
(3, 'Mobiliario Restaurante DEF', 'Restaurant DEF', 12000.00, 11000.00, 4000.00, 2400.00, 2200.00, 2000.00, 1900.00);

-- Crear detalles para cada proyecto
INSERT INTO proyecto_detalles (proyecto_id, presupuesto_del_proyecto, observaciones_del_proyecto)
SELECT id, presupuesto_proyecto, CONCAT('Observaciones detalladas para ', nombre_proyecto)
FROM proyectos;

-- Crear categorías estándar para cada proyecto (24 categorías como en Excel)
INSERT INTO proyecto_categorias (proyecto_id, nombre_categoria, tipo_categoria, orden_categoria, presupuesto_del_proyecto, contrato_proved_y_serv, registro_egresos, saldos_por_cancelar)
SELECT 
    p.id, 
    cat.nombre,
    cat.tipo,
    cat.orden,
    ROUND(RAND() * 3000 + 1000, 2),
    ROUND(RAND() * 2800 + 900, 2), 
    ROUND(RAND() * 2500 + 800, 2),
    ROUND(RAND() * 500 + 100, 2)
FROM proyectos p
CROSS JOIN (
    SELECT 'Melamina y Servicios' as nombre, 'F' as tipo, 1 as orden
    UNION SELECT 'Melamina High Glass', 'F', 2
    UNION SELECT 'Accesorios y Ferretería', 'F', 3
    UNION SELECT 'Puertas Alu Y Vidrios', 'F', 4
    UNION SELECT 'Led y Electricidad', 'F', 5
    UNION SELECT 'Flete Y/o Camioneta', '', 6
    UNION SELECT 'Logística Operativa', '', 7
    UNION SELECT 'Extras y/o Eventos', '', 8
    UNION SELECT 'Despecie', '', 9
    UNION SELECT 'Mano de Obra', '', 10
    UNION SELECT 'Granito Y/O Cuarzo', 'F', 11
    UNION SELECT 'Extras Y/O Eventos GyC', '', 12
    UNION SELECT 'Tercialization 1 Facturada', 'F', 13
    UNION SELECT 'Extras Y/O Eventos Terc. 1', '', 14
    UNION SELECT 'Tercialization 2 Facturada', 'F', 15
    UNION SELECT 'Extras Y/O Eventos Terc. 2', '', 16
    UNION SELECT 'Tercialization 1 NO Facturada', '', 17
    UNION SELECT 'Extras Y/O Eventos Terc. 1 NF', '', 18
    UNION SELECT 'Tercialization 2 NO Facturada', '', 19
    UNION SELECT 'Extras Y/O Eventos Terc. 2 NF', '', 20
    UNION SELECT 'OF - ESCP', '', 21
    UNION SELECT 'Incentivos', '', 22
    UNION SELECT 'Comisión Directorio', '', 23
    UNION SELECT 'Utilidad Final', '', 24
) cat;

-- Crear documentos de ejemplo para cada proyecto
INSERT INTO proyecto_documentos (proyecto_id, proveedor, descripcion, fecha, monto, orden_documento)
SELECT 
    p.id,
    CONCAT('Proveedor ', CHAR(65 + (p.id % 3))),
    CONCAT('Documento ', CHAR(49 + (doc_order.orden % 5)), ' para ', p.nombre_proyecto),
    DATE_SUB(CURDATE(), INTERVAL (RAND() * 30) DAY),
    ROUND(RAND() * 2000 + 500, 2),
    doc_order.orden
FROM proyectos p
CROSS JOIN (
    SELECT 1 as orden
    UNION SELECT 2
    UNION SELECT 3
    UNION SELECT 4
    UNION SELECT 5
) doc_order;

-- Ventas de ejemplo
INSERT INTO ventas (
    numero_venta, estado, cliente, telefono, requerimiento, proyecto
) VALUES 
(1, 'Cotizando', 'Cliente Alpha', '999123456', 'Mobiliario de oficina ejecutiva completa', 'Venta 1'),
(2, 'Aprobado', 'Cliente Beta', '999654321', 'Muebles de cocina integral para casa', 'Venta 2'),
(3, 'Facturado', 'Cliente Gamma', '999789012', 'Oficina corporativa moderna', 'Venta 3');

-- Crear cotizadores para cada venta
INSERT INTO venta_cotizadores (venta_id, tipo_cotizador, categoria, monto, orden_categoria)
SELECT 
    v.id,
    cot.tipo,
    cot.categoria,
    ROUND(RAND() * 1500 + 500, 2),
    cot.orden
FROM ventas v
CROSS JOIN (
    -- Cotizador Melamina
    SELECT 'melamina' as tipo, 'MELAMINA Y SERVICIOS' as categoria, 1 as orden
    UNION SELECT 'melamina', 'MELAMINA HIGH GLOSS', 2
    UNION SELECT 'melamina', 'ACCESORIOS Y FERRETERIA', 3
    UNION SELECT 'melamina', 'PUERTAS ALU Y VIDRIOS', 4
    UNION SELECT 'melamina', 'LED Y ELECTRICIDAD', 5
    UNION SELECT 'melamina', 'UTILIDAD', 14
    -- Cotizador Granito
    UNION SELECT 'granito', 'GRANITO Y/O CUARZO', 1
    UNION SELECT 'granito', 'UTILIDAD', 2
    -- Cotizador Tercializaciones
    UNION SELECT 'tercializaciones', 'TERCIALIZACION 1 FACT.', 1
    UNION SELECT 'tercializaciones', 'UTILIDAD', 2
) cot;

-- Ejecutar cálculos iniciales
CALL CalcularCamposAutomaticosProyecto(1);
CALL CalcularCamposAutomaticosProyecto(2);
CALL CalcularCamposAutomaticosProyecto(3);

CALL CalcularCamposAutomaticosVenta(1);
CALL CalcularCamposAutomaticosVenta(2);
CALL CalcularCamposAutomaticosVenta(3);

-- ========================================
-- ✅ VERIFICACIÓN FINAL
-- ========================================

SELECT 
    '✅ BASE DE DATOS KSAMATI CREADA EXITOSAMENTE!' as mensaje,
    COUNT(*) as total_proyectos
FROM proyectos;

SELECT 
    '📊 RESUMEN DE TABLAS CREADAS:' as titulo,
    'proyectos, proyecto_detalles, proyecto_categorias, proyecto_documentos, archivos_adjuntos, ventas, venta_cotizadores, proyecto_cambios' as tablas_creadas;

SELECT 
    '🔧 PROCEDIMIENTOS Y TRIGGERS INSTALADOS:' as titulo,
    'CalcularCamposAutomaticosProyecto, CalcularCamposAutomaticosVenta + triggers automáticos' as funcionalidades;

-- Mostrar estadísticas finales
SELECT 
    (SELECT COUNT(*) FROM proyectos) as total_proyectos,
    (SELECT COUNT(*) FROM ventas) as total_ventas,
    (SELECT COUNT(*) FROM proyecto_categorias) as total_categorias,
    (SELECT COUNT(*) FROM proyecto_documentos) as total_documentos,
    (SELECT COUNT(*) FROM venta_cotizadores) as total_cotizadores;

