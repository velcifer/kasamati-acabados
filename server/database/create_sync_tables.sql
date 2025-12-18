-- 🔄 CREAR TABLAS DE SINCRONIZACIÓN PARA KSAMATI
-- Ejecuta este script en MySQL Workbench si falta la tabla device_sync_status

USE ksamti_proyectos;

-- ========================================
-- 📊 TABLA DE VERSIONES DE DATOS SINCRONIZADOS
-- ========================================
CREATE TABLE IF NOT EXISTS data_sync (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entidad_tipo ENUM('proyecto', 'venta', 'categoria', 'cotizador') NOT NULL,
    entidad_id INT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    hash_md5 VARCHAR(32) NOT NULL,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_id VARCHAR(100) DEFAULT 'system',
    device_id VARCHAR(100) DEFAULT 'unknown',
    sync_status ENUM('synced', 'pending', 'conflict') DEFAULT 'synced',

    UNIQUE KEY unique_entity_version (entidad_tipo, entidad_id, version),
    INDEX idx_entidad (entidad_tipo, entidad_id),
    INDEX idx_version (version),
    INDEX idx_sync_status (sync_status),
    INDEX idx_last_modified (last_modified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 📋 TABLA DE OPERACIONES OFFLINE PENDIENTES
-- ========================================
CREATE TABLE IF NOT EXISTS offline_queue (
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
    INDEX idx_priority (priority DESC, created_at),
    INDEX idx_device (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- ⚖️ TABLA DE RESOLUCIÓN DE CONFLICTOS
-- ========================================
CREATE TABLE IF NOT EXISTS sync_conflicts (
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
-- 📊 TABLA DE ESTADO DE SINCRONIZACIÓN POR DISPOSITIVO
-- ========================================
CREATE TABLE IF NOT EXISTS device_sync_status (
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

-- ✅ Verificar que las tablas se crearon correctamente
SELECT '✅ Tablas de sincronización creadas exitosamente!' as mensaje;
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'ksamti_proyectos' 
  AND TABLE_NAME IN ('data_sync', 'offline_queue', 'sync_conflicts', 'device_sync_status')
ORDER BY TABLE_NAME;



