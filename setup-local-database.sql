-- 🗄️ SCRIPT PARA CONFIGURAR BASE DE DATOS LOCAL KSAMATI
-- Ejecutar este script completo en DBeaver

-- 1. CREAR BASE DE DATOS
DROP DATABASE IF EXISTS ksamati_proyectos;
CREATE DATABASE ksamati_proyectos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ksamati_proyectos;

-- 2. VERIFICAR QUE ESTAMOS EN LA BASE CORRECTA
SELECT DATABASE() as current_database;

-- 3. MOSTRAR MENSAJE DE CONFIRMACIÓN  
SELECT 'Base de datos ksamati_proyectos creada correctamente' as status;

-- 4. IMPORTAR SCHEMA COMPLETO (EJECUTAR DESPUÉS)
-- Ahora puedes ejecutar el contenido del archivo: server/database/ksamati_complete_schema.sql

-- 5. COMANDOS ÚTILES PARA VERIFICACIÓN
-- SELECT COUNT(*) FROM proyectos;
-- SELECT COUNT(*) FROM ventas;
-- SHOW TABLES;
