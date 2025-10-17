-- EJECUTA ESTO EN TU MYSQL WORKBENCH O PHPMYADMIN

CREATE DATABASE IF NOT EXISTS ksamti_proyectos;
USE ksamti_proyectos;

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- DATOS DE EJEMPLO PARA PROBAR
INSERT INTO proyectos (numero_proyecto, nombre_proyecto, nombre_cliente, monto_contrato, presupuesto_proyecto) VALUES 
(1, 'Proyecto Alpha', 'Cliente Demo 1', 15000.00, 12000.00),
(2, 'Proyecto Beta', 'Cliente Demo 2', 25000.00, 22000.00);

SELECT 'Base de datos lista!' as mensaje;










