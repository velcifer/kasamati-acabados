-- 🗄️ KSAMATI - SETUP SIMPLE PARA PRODUCCIÓN
-- Ejecutar este archivo directamente en tu gestor MySQL

-- 🔧 CREAR BASE DE DATOS
CREATE DATABASE IF NOT EXISTS ksamti_proyectos 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 🔗 USAR BASE DE DATOS
USE ksamti_proyectos;

-- 📋 TABLA PRINCIPAL DE PROYECTOS
CREATE TABLE IF NOT EXISTS proyectos (
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
    balance_utilidad_sin_factura DECIMAL(15,2) DEFAULT 0.00,
    utilidad_estimada_facturado DECIMAL(15,2) DEFAULT 0.00,
    utilidad_real_facturado DECIMAL(15,2) DEFAULT 0.00,
    balance_utilidad_con_factura DECIMAL(15,2) DEFAULT 0.00,
    
    -- 💳 COBRANZAS Y SALDOS
    total_contrato_proveedores DECIMAL(15,2) DEFAULT 0.00,
    saldo_pagar_proveedores DECIMAL(15,2) DEFAULT 0.00,
    adelantos_cliente DECIMAL(15,2) DEFAULT 0.00,
    saldos_reales_proyecto DECIMAL(15,2) DEFAULT 0.00,
    saldos_cobrar_proyecto DECIMAL(15,2) DEFAULT 0.00,
    
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

-- 🏗️ TABLA DETALLE COMPLETO
CREATE TABLE IF NOT EXISTS proyecto_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    descripcion_proyecto TEXT,
    ubicacion_proyecto VARCHAR(255),
    fecha_inicio DATE,
    fecha_estimada_fin DATE,
    presupuesto_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    total_egresos_proyecto DECIMAL(15,2) DEFAULT 0.00,
    balance_del_presupuesto DECIMAL(15,2) DEFAULT 0.00,
    igv_sunat DECIMAL(5,2) DEFAULT 18.00,
    credito_fiscal_estimado DECIMAL(15,2) DEFAULT 0.00,
    impuesto_estimado_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    credito_fiscal_real DECIMAL(15,2) DEFAULT 0.00,
    impuesto_real_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    saldo_x_cobrar DECIMAL(15,2) DEFAULT 0.00,
    balance_de_compras_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    observaciones_del_proyecto TEXT,
    
    -- 📅 FECHAS
    fecha_1 DATE, fecha_2 DATE, fecha_3 DATE, fecha_4 DATE,
    fecha_5 DATE, fecha_6 DATE, fecha_7 DATE, fecha_8 DATE,
    fecha_9 DATE, fecha_10 DATE, fecha_11 DATE, fecha_12 DATE, fecha_13 DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    INDEX idx_proyecto_id (proyecto_id)
);

-- 📦 TABLA CATEGORÍAS
CREATE TABLE IF NOT EXISTS proyecto_categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    nombre_categoria VARCHAR(255) NOT NULL,
    tipo_categoria ENUM('F', 'S', 'P') DEFAULT 'F',
    orden_categoria INT DEFAULT 0,
    presupuesto_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    contrato_proved_y_serv DECIMAL(15,2) DEFAULT 0.00,
    registro_egresos DECIMAL(15,2) DEFAULT 0.00,
    saldos_por_cancelar DECIMAL(15,2) DEFAULT 0.00,
    es_editable BOOLEAN DEFAULT TRUE,
    esta_activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    INDEX idx_proyecto_categoria (proyecto_id, orden_categoria)
);

-- 📊 TABLA LOGS DE CAMBIOS
CREATE TABLE IF NOT EXISTS proyecto_cambios (
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

-- ✅ BASE DE DATOS LISTA PARA PRODUCCIÓN
SELECT 'Base de datos KSAMATI configurada exitosamente para producción!' as mensaje;










