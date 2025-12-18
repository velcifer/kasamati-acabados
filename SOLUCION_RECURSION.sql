-- ========================================
-- 🔧 SOLUCIÓN AL PROBLEMA DE RECURSIÓN INFINITA
-- ========================================
-- Problema: El stored procedure hace UPDATE en proyectos, lo cual
-- dispara el trigger tr_proyectos_update, que llama al SP otra vez -> bucle infinito
--
-- Solución: Modificar el trigger para que NO se ejecute si el SP ya está corriendo
-- ========================================

-- PASO 1: Eliminar el trigger actual
DROP TRIGGER IF EXISTS tr_proyectos_update;

-- PASO 2: Crear el trigger modificado que verifica si el SP ya está ejecutándose
DELIMITER //

CREATE TRIGGER tr_proyectos_update 
    AFTER UPDATE ON proyectos
    FOR EACH ROW
BEGIN
    -- Solo ejecutar el SP si NO está ya ejecutándose (evitar recursión)
    -- Usamos una variable de sesión para rastrear si el SP está activo
    IF @SP_CALCULANDO IS NULL OR @SP_CALCULANDO = 0 THEN
        SET @SP_CALCULANDO = 1;
        CALL CalcularCamposAutomaticosProyecto(NEW.id);
        SET @SP_CALCULANDO = 0;
    END IF;
END //

DELIMITER ;

-- PASO 3: Verificar que el stored procedure existe y está correcto
-- (Ya lo tienes actualizado, así que no necesitas cambiarlo)

-- ========================================
-- ✅ VERIFICACIÓN
-- ========================================
-- Ejecuta esto para verificar que el trigger está correcto:
-- SHOW TRIGGERS WHERE `Table` = 'proyectos';

