-- 🗄️ KSAMATI PROJECT - PRODUCTION DATABASE SETUP
-- Script simplificado para configuración en producción

CREATE DATABASE IF NOT EXISTS ksamati_proyectos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ksamati_proyectos;

-- Tabla principal de proyectos
CREATE TABLE proyectos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_proyecto INT UNIQUE NOT NULL,
    nombre_proyecto VARCHAR(255) NOT NULL,
    nombre_cliente VARCHAR(255),
    estado_proyecto ENUM('Ejecucion', 'Recibo', 'Completado') DEFAULT 'Ejecucion',
    tipo_proyecto ENUM('Recibo', 'Contrato', 'Servicio') DEFAULT 'Recibo',
    monto_contrato DECIMAL(15,2) DEFAULT 0.00,
    presupuesto_proyecto DECIMAL(15,2) DEFAULT 0.00,
    balance_proyecto DECIMAL(15,2) DEFAULT 0.00,
    utilidad_estimada_sin_factura DECIMAL(15,2) DEFAULT 0.00,
    utilidad_real_sin_factura DECIMAL(15,2) DEFAULT 0.00,
    balance_utilidad_sin_factura DECIMAL(15,2) DEFAULT 0.00,
    utilidad_estimada_facturado DECIMAL(15,2) DEFAULT 0.00,
    utilidad_real_facturado DECIMAL(15,2) DEFAULT 0.00,
    balance_utilidad_con_factura DECIMAL(15,2) DEFAULT 0.00,
    total_contrato_proveedores DECIMAL(15,2) DEFAULT 0.00,
    saldo_pagar_proveedores DECIMAL(15,2) DEFAULT 0.00,
    adelantos_cliente DECIMAL(15,2) DEFAULT 0.00,
    saldos_reales_proyecto DECIMAL(15,2) DEFAULT 0.00,
    saldos_cobrar_proyecto DECIMAL(15,2) DEFAULT 0.00,
    credito_fiscal DECIMAL(15,2) DEFAULT 0.00,
    impuesto_real_proyecto DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_numero_proyecto (numero_proyecto)
) ENGINE=InnoDB;

-- Tabla de detalles de proyectos
CREATE TABLE proyecto_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    presupuesto_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    total_egresos_proyecto DECIMAL(15,2) DEFAULT 0.00,
    balance_del_presupuesto DECIMAL(15,2) DEFAULT 0.00,
    observaciones_del_proyecto TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de categorías
CREATE TABLE proyecto_categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    nombre_categoria VARCHAR(255) NOT NULL,
    tipo_categoria ENUM('F', 'S', 'P', '') DEFAULT 'F',
    orden_categoria INT DEFAULT 0,
    presupuesto_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    contrato_proved_y_serv DECIMAL(15,2) DEFAULT 0.00,
    registro_egresos DECIMAL(15,2) DEFAULT 0.00,
    saldos_por_cancelar DECIMAL(15,2) DEFAULT 0.00,
    es_editable BOOLEAN DEFAULT TRUE,
    esta_activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de documentos del proyecto
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
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de archivos adjuntos
CREATE TABLE archivos_adjuntos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entidad_tipo ENUM('proyecto', 'venta') NOT NULL,
    entidad_id INT NOT NULL,
    nombre_archivo VARCHAR(500) NOT NULL,
    nombre_original VARCHAR(500) NOT NULL,
    tipo_archivo VARCHAR(100) NOT NULL,
    tamaño_archivo BIGINT NOT NULL,
    ruta_archivo VARCHAR(1000) NOT NULL,
    extension_archivo VARCHAR(10),
    es_imagen BOOLEAN DEFAULT FALSE,
    es_pdf BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entidad (entidad_tipo, entidad_id)
) ENGINE=InnoDB;

-- Tabla principal de ventas
CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_venta INT UNIQUE NOT NULL,
    estado ENUM('Cotizando', 'Enviado', 'Aprobado', 'Facturado') DEFAULT 'Cotizando',
    cliente VARCHAR(255),
    telefono VARCHAR(50),
    requerimiento TEXT,
    proyecto VARCHAR(255),
    utilidad DECIMAL(15,2) DEFAULT 0.00,
    total_utilidad DECIMAL(15,2) DEFAULT 0.00,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_numero_venta (numero_venta)
) ENGINE=InnoDB;

-- Tabla de cotizadores de ventas
CREATE TABLE venta_cotizadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    tipo_cotizador ENUM('melamina', 'granito', 'tercializaciones') NOT NULL,
    categoria VARCHAR(255) NOT NULL,
    monto DECIMAL(15,2) DEFAULT 0.00,
    observaciones TEXT,
    orden_categoria INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SELECT '✅ Base de datos de producción creada exitosamente!' as mensaje;

