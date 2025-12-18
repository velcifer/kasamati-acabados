-- ========================================
-- 🚨 SOLUCIÓN URGENTE: DETENER BUCLE INFINITO
-- ========================================
-- Ejecuta este script INMEDIATAMENTE en MySQL Workbench
-- para detener el bucle infinito
-- ========================================

-- PASO 1: Eliminar los triggers que causan el bucle
DROP TRIGGER IF EXISTS tr_proyectos_update;
DROP TRIGGER IF EXISTS tr_categorias_update;
DROP TRIGGER IF EXISTS tr_categorias_insert;

-- PASO 2: Verificar que se eliminaron
SELECT '✅ Triggers eliminados - Bucle detenido' as mensaje;

-- PASO 3: Mostrar triggers restantes (deberían estar solo los de ventas)
SHOW TRIGGERS;

-- ========================================
-- ✅ DESPUÉS DE EJECUTAR ESTO:
-- ========================================
-- 1. El bucle infinito se detendrá inmediatamente
-- 2. Los proyectos se podrán actualizar sin problemas
-- 3. Los cálculos automáticos NO se ejecutarán (pero puedes llamarlos manualmente si necesitas)
-- ========================================

