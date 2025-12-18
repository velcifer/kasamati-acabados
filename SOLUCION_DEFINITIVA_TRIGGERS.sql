-- ========================================
-- 🔧 SOLUCIÓN DEFINITIVA: TRIGGERS SIN RECURSIÓN
-- ========================================
-- Ejecuta este script DESPUÉS de ejecutar SOLUCION_URGENTE_BUCLE.sql
-- Esto recreará los triggers con protección contra recursión
-- ========================================

-- Asegurarse de que los triggers antiguos estén eliminados
DROP TRIGGER IF EXISTS tr_proyectos_update;
DROP TRIGGER IF EXISTS tr_categorias_update;
DROP TRIGGER IF EXISTS tr_categorias_insert;

DELIMITER //

-- ========================================
-- TRIGGER 1: tr_proyectos_update (CON PROTECCIÓN ANTI-RECURSIÓN)
-- ========================================
CREATE TRIGGER tr_proyectos_update 
    AFTER UPDATE ON proyectos
    FOR EACH ROW
BEGIN
    -- Solo ejecutar si NO estamos en medio de un cálculo automático
    -- Esto evita el bucle infinito
    IF @calculando_campos_automaticos IS NULL OR @calculando_campos_automaticos = 0 THEN
        SET @calculando_campos_automaticos = 1;
        CALL CalcularCamposAutomaticosProyecto(NEW.id);
        SET @calculando_campos_automaticos = 0;
    END IF;
END //

-- ========================================
-- TRIGGER 2: tr_categorias_update (CON PROTECCIÓN ANTI-RECURSIÓN)
-- ========================================
CREATE TRIGGER tr_categorias_update
    AFTER UPDATE ON proyecto_categorias
    FOR EACH ROW
BEGIN
    -- Solo ejecutar si NO estamos en medio de un cálculo automático
    IF @calculando_campos_automaticos IS NULL OR @calculando_campos_automaticos = 0 THEN
        SET @calculando_campos_automaticos = 1;
        CALL CalcularCamposAutomaticosProyecto(NEW.proyecto_id);
        SET @calculando_campos_automaticos = 0;
    END IF;
END //

-- ========================================
-- TRIGGER 3: tr_categorias_insert (CON PROTECCIÓN ANTI-RECURSIÓN)
-- ========================================
CREATE TRIGGER tr_categorias_insert
    AFTER INSERT ON proyecto_categorias
    FOR EACH ROW
BEGIN
    -- Solo ejecutar si NO estamos en medio de un cálculo automático
    IF @calculando_campos_automaticos IS NULL OR @calculando_campos_automaticos = 0 THEN
        SET @calculando_campos_automaticos = 1;
        CALL CalcularCamposAutomaticosProyecto(NEW.proyecto_id);
        SET @calculando_campos_automaticos = 0;
    END IF;
END //

DELIMITER ;

-- Verificar que los triggers se crearon correctamente
SELECT '✅ Triggers recreados con protección anti-recursión' as mensaje;
SHOW TRIGGERS WHERE `Table` IN ('proyectos', 'proyecto_categorias');

-- ========================================
-- ✅ AHORA LOS TRIGGERS:
-- ========================================
-- ✅ Se ejecutarán automáticamente cuando actualices proyectos/categorías
-- ✅ NO causarán bucles infinitos
-- ✅ Los cálculos automáticos funcionarán correctamente
-- ========================================

