-- 🚨 URGENTE: DESHABILITAR TRIGGERS QUE CAUSAN BUCLE INFINITO
-- Ejecutar este script INMEDIATAMENTE para detener el bucle

-- Deshabilitar TODOS los triggers problemáticos
DROP TRIGGER IF EXISTS tr_proyectos_update;
DROP TRIGGER IF EXISTS tr_categorias_update;
DROP TRIGGER IF EXISTS tr_categorias_insert;
DROP TRIGGER IF EXISTS tr_ventas_update;
DROP TRIGGER IF EXISTS tr_cotizadores_update;

-- Verificar que se eliminaron
SELECT '✅ Triggers eliminados exitosamente' as mensaje;

-- Mostrar triggers restantes (debería estar vacío)
SHOW TRIGGERS;


