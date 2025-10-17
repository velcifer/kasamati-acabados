-- 🗄️ KSAMATI PROJECT - MYSQL DATABASE SCHEMA
-- Estructura completa para persistencia de proyectos y Excel

CREATE DATABASE IF NOT EXISTS ksamti_proyectos;
USE ksamti_proyectos;

-- 📋 TABLA PRINCIPAL DE PROYECTOS (Equivalente al Excel Principal)
CREATE TABLE proyectos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_proyecto INT UNIQUE NOT NULL,
    nombre_proyecto VARCHAR(255) NOT NULL,
    nombre_cliente VARCHAR(255),
    estado_proyecto ENUM('Ejecucion', 'Recibo', 'Completado') DEFAULT 'Ejecucion',
    tipo_proyecto ENUM('Recibo', 'Contrato', 'Servicio') DEFAULT 'Recibo',
    
    -- 💰 ANÁLISIS FINANCIERO
    monto_contrato DECIMAL(15,2) DEFAULT 0.00,
    presupuesto_proyecto DECIMAL(15,2) DEFAULT 0.00,
    balance_proyecto DECIMAL(15,2) DEFAULT 0.00,
    utilidad_estimada_sin_factura DECIMAL(15,2) DEFAULT 0.00,
    utilidad_real_sin_factura DECIMAL(15,2) DEFAULT 0.00,
    balance_utilidad_sin_factura DECIMAL(15,2) DEFAULT 0.00,  -- CALCULADO
    utilidad_estimada_facturado DECIMAL(15,2) DEFAULT 0.00,
    utilidad_real_facturado DECIMAL(15,2) DEFAULT 0.00,
    balance_utilidad_con_factura DECIMAL(15,2) DEFAULT 0.00,  -- CALCULADO
    
    -- 💳 COBRANZAS Y SALDOS
    total_contrato_proveedores DECIMAL(15,2) DEFAULT 0.00,
    saldo_pagar_proveedores DECIMAL(15,2) DEFAULT 0.00,
    adelantos_cliente DECIMAL(15,2) DEFAULT 0.00,
    saldos_reales_proyecto DECIMAL(15,2) DEFAULT 0.00,
    saldos_cobrar_proyecto DECIMAL(15,2) DEFAULT 0.00,  -- CALCULADO
    
    -- 📊 SUNAT
    credito_fiscal DECIMAL(15,2) DEFAULT 0.00,
    impuesto_real_proyecto DECIMAL(15,2) DEFAULT 0.00,
    
    -- 📅 METADATOS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_numero_proyecto (numero_proyecto),
    INDEX idx_estado (estado_proyecto),
    INDEX idx_cliente (nombre_cliente)
);

-- 🏗️ TABLA DETALLE COMPLETO DE PROYECTOS
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
    total_egresos_proyecto DECIMAL(15,2) DEFAULT 0.00,
    balance_del_presupuesto DECIMAL(15,2) DEFAULT 0.00,  -- CALCULADO
    
    -- 📊 IGV Y SUNAT EXTENDIDO
    igv_sunat DECIMAL(5,2) DEFAULT 18.00,
    credito_fiscal_estimado DECIMAL(15,2) DEFAULT 0.00,
    impuesto_estimado_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    credito_fiscal_real DECIMAL(15,2) DEFAULT 0.00,
    impuesto_real_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    
    -- 💳 COBRANZAS EXTENDIDAS
    saldo_x_cobrar DECIMAL(15,2) DEFAULT 0.00,  -- CALCULADO
    balance_de_compras_del_proyecto DECIMAL(15,2) DEFAULT 0.00,  -- CALCULADO
    
    -- 📝 OBSERVACIONES
    observaciones_del_proyecto TEXT,
    
    -- 📅 FECHAS (13 campos de fecha como solicitado)
    fecha_1 DATE,
    fecha_2 DATE,
    fecha_3 DATE,
    fecha_4 DATE,
    fecha_5 DATE,
    fecha_6 DATE,
    fecha_7 DATE,
    fecha_8 DATE,
    fecha_9 DATE,
    fecha_10 DATE,
    fecha_11 DATE,
    fecha_12 DATE,
    fecha_13 DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    INDEX idx_proyecto_id (proyecto_id)
);

-- 📦 TABLA CATEGORÍAS DE PROVEEDORES
CREATE TABLE proyecto_categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    nombre_categoria VARCHAR(255) NOT NULL,
    tipo_categoria ENUM('F', 'S', 'P') DEFAULT 'F', -- F=Fijo, S=Servicio, P=Producto
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
    INDEX idx_proyecto_categoria (proyecto_id, orden_categoria)
);

-- 📊 TABLA PARA LOGS DE CAMBIOS (Auditoría)
CREATE TABLE proyecto_cambios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    campo_modificado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario VARCHAR(100) DEFAULT 'system',
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    INDEX idx_proyecto_cambio (proyecto_id, created_at)
);

-- 🔧 PROCEDIMIENTOS ALMACENADOS PARA CÁLCULOS AUTOMÁTICOS

DELIMITER //

-- Procedimiento para recalcular campos automáticos de un proyecto
CREATE PROCEDURE CalcularCamposAutomaticos(IN proyecto_id_param INT)
BEGIN
    DECLARE monto_contrato_val DECIMAL(15,2) DEFAULT 0;
    DECLARE adelantos_val DECIMAL(15,2) DEFAULT 0;
    DECLARE util_est_sin_fact DECIMAL(15,2) DEFAULT 0;
    DECLARE util_real_sin_fact DECIMAL(15,2) DEFAULT 0;
    DECLARE util_est_con_fact DECIMAL(15,2) DEFAULT 0;
    DECLARE util_real_con_fact DECIMAL(15,2) DEFAULT 0;
    DECLARE presupuesto_val DECIMAL(15,2) DEFAULT 0;
    DECLARE total_egresos_val DECIMAL(15,2) DEFAULT 0;
    
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
    
    -- Calcular total de egresos de categorías
    SELECT COALESCE(SUM(registro_egresos), 0) 
    INTO total_egresos_val
    FROM proyecto_categorias 
    WHERE proyecto_id = proyecto_id_param AND esta_activo = TRUE;
    
    -- Actualizar campos calculados en tabla principal
    UPDATE proyectos SET
        balance_utilidad_sin_factura = util_est_sin_fact - util_real_sin_fact,
        balance_utilidad_con_factura = util_est_con_fact - util_real_con_fact,
        saldos_cobrar_proyecto = monto_contrato_val - adelantos_val,
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

DELIMITER ;

-- 🎯 TRIGGERS PARA CÁLCULOS AUTOMÁTICOS

-- Trigger para recalcular al actualizar proyecto principal
DELIMITER //
CREATE TRIGGER tr_proyectos_update 
    AFTER UPDATE ON proyectos
    FOR EACH ROW
BEGIN
    CALL CalcularCamposAutomaticos(NEW.id);
END //
DELIMITER ;

-- Trigger para recalcular al modificar categorías
DELIMITER //
CREATE TRIGGER tr_categorias_update
    AFTER UPDATE ON proyecto_categorias
    FOR EACH ROW
BEGIN
    CALL CalcularCamposAutomaticos(NEW.proyecto_id);
END //

CREATE TRIGGER tr_categorias_insert
    AFTER INSERT ON proyecto_categorias
    FOR EACH ROW
BEGIN
    CALL CalcularCamposAutomaticos(NEW.proyecto_id);
END //

CREATE TRIGGER tr_categorias_delete
    AFTER DELETE ON proyecto_categorias
    FOR EACH ROW
BEGIN
    CALL CalcularCamposAutomaticos(OLD.proyecto_id);
END //
DELIMITER ;

-- 📝 DATOS DE EJEMPLO PARA DESARROLLO
INSERT INTO proyectos (
    numero_proyecto, nombre_proyecto, nombre_cliente, 
    monto_contrato, presupuesto_proyecto, adelantos_cliente,
    utilidad_estimada_sin_factura, utilidad_real_sin_factura
) VALUES 
(1, 'Proyecto Alpha', 'Cliente Demo 1', 15000.00, 12000.00, 5000.00, 2500.00, 2200.00),
(2, 'Proyecto Beta', 'Cliente Demo 2', 25000.00, 22000.00, 10000.00, 4200.00, 3800.00),
(3, 'Proyecto Gamma', 'Cliente Demo 3', 8000.00, 7500.00, 3000.00, 1200.00, 1100.00);

-- Crear detalles para los proyectos de ejemplo
INSERT INTO proyecto_detalles (proyecto_id, presupuesto_del_proyecto, observaciones_del_proyecto)
SELECT id, presupuesto_proyecto, CONCAT('Observaciones para ', nombre_proyecto)
FROM proyectos;

-- Crear categorías ejemplo para cada proyecto
INSERT INTO proyecto_categorias (proyecto_id, nombre_categoria, tipo_categoria, orden_categoria, presupuesto_del_proyecto, contrato_proved_y_serv, registro_egresos, saldos_por_cancelar)
SELECT 
    p.id, 
    cat.nombre,
    cat.tipo,
    cat.orden,
    ROUND(RAND() * 5000, 2),
    ROUND(RAND() * 4500, 2), 
    ROUND(RAND() * 4000, 2),
    ROUND(RAND() * 1000, 2)
FROM proyectos p
CROSS JOIN (
    SELECT 'Melamina y Servicios' as nombre, 'F' as tipo, 1 as orden
    UNION SELECT 'Led Y Electricidad', 'S', 2
    UNION SELECT 'Accesorios y Ferretería', 'P', 3
    UNION SELECT 'Puertas Alu Y Vidrios', 'F', 4
    UNION SELECT 'Riele y/o Camioneta', 'S', 5
    UNION SELECT 'Logística Operativa', 'S', 6
) cat;

-- Ejecutar cálculos iniciales
CALL CalcularCamposAutomaticos(1);
CALL CalcularCamposAutomaticos(2);
CALL CalcularCamposAutomaticos(3);

SELECT '✅ Base de datos KSAMATI creada exitosamente!' as mensaje;
