-- 🔧 CORREGIR TRIGGERS PARA EVITAR RECURSIÓN INFINITA
-- Este script deshabilita temporalmente los triggers problemáticos

-- Deshabilitar el trigger que causa recursión
DROP TRIGGER IF EXISTS tr_proyectos_update;

-- Crear un nuevo trigger que evite recursión usando una variable de sesión
DELIMITER //
CREATE TRIGGER tr_proyectos_update 
    AFTER UPDATE ON proyectos
    FOR EACH ROW
BEGIN
    -- Solo ejecutar si no estamos en medio de un cálculo automático
    -- Usar una variable de sesión para evitar recursión
    IF @calculando_campos_automaticos IS NULL THEN
        SET @calculando_campos_automaticos = 1;
        CALL CalcularCamposAutomaticosProyecto(NEW.id);
        SET @calculando_campos_automaticos = NULL;
    END IF;
END //
DELIMITER ;

-- También corregir los triggers de categorías
DROP TRIGGER IF EXISTS tr_categorias_update;
DROP TRIGGER IF EXISTS tr_categorias_insert;

DELIMITER //
CREATE TRIGGER tr_categorias_update
    AFTER UPDATE ON proyecto_categorias
    FOR EACH ROW
BEGIN
    IF @calculando_campos_automaticos IS NULL THEN
        SET @calculando_campos_automaticos = 1;
        CALL CalcularCamposAutomaticosProyecto(NEW.proyecto_id);
        SET @calculando_campos_automaticos = NULL;
    END IF;
END //

CREATE TRIGGER tr_categorias_insert
    AFTER INSERT ON proyecto_categorias
    FOR EACH ROW
BEGIN
    IF @calculando_campos_automaticos IS NULL THEN
        SET @calculando_campos_automaticos = 1;
        CALL CalcularCamposAutomaticosProyecto(NEW.proyecto_id);
        SET @calculando_campos_automaticos = NULL;
    END IF;
END //
DELIMITER ;

SELECT '✅ Triggers corregidos para evitar recursión infinita' as mensaje;


