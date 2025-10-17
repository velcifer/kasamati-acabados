# ✅ CHECKLIST DE DESPLIEGUE - BASE DE DATOS KSAMATI

## 📊 RESUMEN RÁPIDO

**Base de Datos:** `ksamati_proyectos`  
**Tablas:** 8 tablas  
**Procedimientos:** 2 procedimientos almacenados  
**Triggers:** 5 triggers automáticos  
**Estado:** ✅ LISTO PARA PRODUCCIÓN

---

## 🎯 DECISIÓN: ¿CREAR O NO LA BASE DE DATOS?

### ✅ **SÍ, CRÉALA SI:**
- ✓ Necesitas gestionar proyectos con cálculos automáticos
- ✓ Requieres auditoría completa de cambios
- ✓ Quieres sistema de cotizaciones inteligente
- ✓ Necesitas gestión de documentos y archivos
- ✓ Buscas escalabilidad y performance optimizado

### ❌ **NO LA CREES SI:**
- ✗ Solo necesitas un prototipo temporal
- ✗ No tienes acceso a MySQL
- ✗ Prefieres soluciones sin servidor (Firebase, etc)

---

## 🚀 GUÍA RÁPIDA DE INSTALACIÓN (3 MINUTOS)

### **Opción 1: Automática (Recomendada)**

```bash
# 1. Clonar/navegar al proyecto
cd project-acabados

# 2. Crear archivo .env
# Copia y pega esto en un nuevo archivo .env:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=TU_PASSWORD_AQUI
DB_NAME=ksamati_proyectos
DB_PORT=3306
PORT=5000
NODE_ENV=development

# 3. Instalar dependencias (si no lo has hecho)
npm install

# 4. Instalar base de datos completa
npm run setup-db-complete

# 5. Verificar instalación
npm run verify-db
```

### **Opción 2: Manual (Si prefieres control total)**

```sql
-- 1. Conectar a MySQL
mysql -u root -p

-- 2. Crear base de datos
CREATE DATABASE ksamati_proyectos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Salir de MySQL y ejecutar schema
exit;

-- 4. Cargar schema completo
mysql -u root -p ksamati_proyectos < server/database/ksamati_complete_schema.sql

-- 5. Verificar
mysql -u root -p ksamati_proyectos -e "SHOW TABLES;"
```

---

## 📋 CHECKLIST PASO A PASO

### **FASE 1: PREPARACIÓN** ⏱️ 2 minutos

- [ ] MySQL instalado y corriendo
- [ ] Credenciales de acceso disponibles
- [ ] Node.js instalado (v14+)
- [ ] Proyecto descargado/clonado
- [ ] Terminal/CMD abierto en carpeta del proyecto

### **FASE 2: CONFIGURACIÓN** ⏱️ 1 minuto

- [ ] Archivo `.env` creado en raíz del proyecto
- [ ] Variable `DB_HOST` configurada
- [ ] Variable `DB_USER` configurada  
- [ ] Variable `DB_PASSWORD` configurada
- [ ] Variable `DB_NAME` configurada (ksamati_proyectos)
- [ ] Variable `DB_PORT` configurada (3306)

### **FASE 3: INSTALACIÓN** ⏱️ 30 segundos

- [ ] Ejecutado `npm install` (si es necesario)
- [ ] Ejecutado `npm run setup-db-complete`
- [ ] Sin errores en consola
- [ ] Mensaje "✅ BD completa instalada" visible

### **FASE 4: VERIFICACIÓN** ⏱️ 1 minuto

- [ ] Ejecutado `npm run verify-db`
- [ ] 8 tablas confirmadas
- [ ] 2 procedimientos confirmados
- [ ] 5 triggers confirmados
- [ ] 3 proyectos de ejemplo creados
- [ ] 3 ventas de ejemplo creadas

### **FASE 5: PRUEBA** ⏱️ 2 minutos

- [ ] Servidor iniciado (`npm run dev`)
- [ ] API respondiendo en puerto 5000
- [ ] Endpoint `/api/health` accesible
- [ ] Frontend cargando correctamente
- [ ] Datos de ejemplo visibles

---

## 🗄️ ESTRUCTURA CREADA

Al completar la instalación tendrás:

### **Tablas (8)**
1. ✅ `proyectos` - Gestión de proyectos principal
2. ✅ `proyecto_detalles` - Información extendida
3. ✅ `proyecto_categorias` - 24 categorías por proyecto
4. ✅ `proyecto_documentos` - Documentos asociados
5. ✅ `archivos_adjuntos` - PDFs e imágenes
6. ✅ `ventas` - Gestión de ventas
7. ✅ `venta_cotizadores` - Cotizadores especializados
8. ✅ `proyecto_cambios` - Auditoría completa

### **Procedimientos Almacenados (2)**
1. ✅ `CalcularCamposAutomaticosProyecto()` - Cálculos de proyectos
2. ✅ `CalcularCamposAutomaticosVenta()` - Cálculos de ventas

### **Triggers (5)**
1. ✅ `tr_proyectos_update` - Actualiza al modificar proyecto
2. ✅ `tr_categorias_update` - Actualiza al modificar categoría
3. ✅ `tr_categorias_insert` - Actualiza al insertar categoría
4. ✅ `tr_ventas_update` - Actualiza al modificar venta
5. ✅ `tr_cotizadores_update` - Actualiza al modificar cotizador

### **Datos de Ejemplo (6 registros)**
- ✅ 3 proyectos demo con datos reales
- ✅ 3 ventas demo con cotizadores
- ✅ 72 categorías (24 por proyecto)
- ✅ 15 documentos asociados

---

## 🎛️ COMANDOS DISPONIBLES

```bash
# Instalación
npm run setup-db              # Instalación interactiva
npm run setup-db-complete     # Instalación automática completa
npm run setup-db-production   # Instalación para producción

# Verificación
npm run verify-db             # Verificación completa
npm run check-db              # Verificación rápida

# Desarrollo
npm run dev                   # Servidor + Frontend
npm run server                # Solo servidor
npm run client                # Solo frontend
```

---

## 🏭 DESPLIEGUE EN PRODUCCIÓN

### **Para cPanel / Hosting Compartido**

1. **Acceder a phpMyAdmin**
2. **Crear BD:** `ksamati_proyectos` (utf8mb4_unicode_ci)
3. **Importar:** `server/database/ksamati_complete_schema.sql`
4. **Configurar `.env`** con credenciales del hosting
5. **Subir proyecto** vía FTP o Git

### **Para VPS / Servidor Dedicado**

```bash
# 1. Conectar al servidor
ssh usuario@tu-servidor.com

# 2. Instalar MySQL
sudo apt install mysql-server

# 3. Configurar seguridad
sudo mysql_secure_installation

# 4. Crear usuario y BD
sudo mysql
CREATE USER 'ksamati'@'localhost' IDENTIFIED BY 'password_seguro';
CREATE DATABASE ksamati_proyectos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL ON ksamati_proyectos.* TO 'ksamati'@'localhost';
FLUSH PRIVILEGES;
exit;

# 5. Clonar proyecto
git clone [url-del-repo]
cd project-acabados

# 6. Instalar dependencias
npm install

# 7. Configurar .env
nano .env
# (pegar configuración)

# 8. Instalar BD
npm run setup-db-complete

# 9. Iniciar con PM2
npm install -g pm2
pm2 start server/index.js --name ksamati
pm2 save
pm2 startup
```

### **Para Docker**

```bash
# 1. Verificar docker-compose.yml existe
ls docker-compose.yml

# 2. Construir y levantar
docker-compose up -d

# 3. Verificar
docker-compose ps
docker-compose logs mysql
```

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### **Error: "Cannot connect to MySQL"**
```bash
# Verificar si MySQL está corriendo
sudo systemctl status mysql

# Si está parado, iniciar
sudo systemctl start mysql

# En Windows
net start MySQL80
```

### **Error: "Access denied"**
```sql
-- Resetear password de root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'nueva_password';
FLUSH PRIVILEGES;
```

### **Error: "Database already exists"**
```sql
-- Opción 1: Usar la existente
USE ksamati_proyectos;

-- Opción 2: Eliminar y recrear
DROP DATABASE ksamati_proyectos;
-- Luego ejecutar npm run setup-db-complete
```

### **Error: "Table already exists"**
```sql
-- Verificar qué tablas existen
SHOW TABLES;

-- Si están todas, solo verificar
npm run verify-db

-- Si faltan tablas, reinstalar
npm run setup-db-complete
```

### **No hay datos de ejemplo**
```sql
-- Verificar si existen
SELECT COUNT(*) FROM proyectos;

-- Si es 0, insertar manualmente ejecutando las líneas 446-558 de:
-- server/database/ksamati_complete_schema.sql
```

---

## 🔐 SEGURIDAD EN PRODUCCIÓN

### **Checklist de Seguridad**

- [ ] Contraseña fuerte (min 12 caracteres)
- [ ] Usuario específico (NO usar root)
- [ ] Firewall configurado (solo puerto 3306 si es necesario)
- [ ] SSL/TLS habilitado
- [ ] Backups automáticos configurados
- [ ] `.env` en `.gitignore`
- [ ] Permisos de archivos correctos (chmod 600 .env)
- [ ] Logs de auditoría activados

### **Crear Backup Automático**

```bash
# Crear script de backup
nano /home/tu-usuario/backup-ksamati.sh

# Contenido del script:
#!/bin/bash
FECHA=$(date +%Y%m%d_%H%M%S)
mysqldump -u ksamati -p'password' ksamati_proyectos > /backups/ksamati_$FECHA.sql
# Eliminar backups de más de 30 días
find /backups/ -name "ksamati_*.sql" -mtime +30 -delete

# Hacer ejecutable
chmod +x /home/tu-usuario/backup-ksamati.sh

# Agregar a crontab (diario a las 2 AM)
crontab -e
0 2 * * * /home/tu-usuario/backup-ksamati.sh
```

---

## 📊 ESTADÍSTICAS ESPERADAS

Después de la instalación completa:

| Métrica | Valor Esperado |
|---------|----------------|
| **Tablas creadas** | 8 |
| **Procedimientos** | 2 |
| **Triggers** | 5 |
| **Proyectos ejemplo** | 3 |
| **Ventas ejemplo** | 3 |
| **Categorías** | 72 (24×3) |
| **Documentos** | 15 (5×3) |
| **Tamaño BD** | ~5-10 MB |

---

## ✅ VERIFICACIÓN FINAL

### **Test Rápido (30 segundos)**

```bash
# 1. Verificar BD
npm run check-db
# Debe mostrar: "✅ Base de datos OK"

# 2. Iniciar servidor
npm run server
# Debe mostrar: "🚀 Servidor KSAMATI ejecutándose en puerto 5000"

# 3. Probar API
# Abrir en navegador: http://localhost:5000/api/health
# Debe mostrar JSON con status: "OK" y database: "Connected"

# 4. Probar frontend
npm run client
# Debe abrir en: http://localhost:3000
```

### **Test Completo (2 minutos)**

```sql
-- 1. Conectar a MySQL
mysql -u root -p ksamati_proyectos

-- 2. Verificar tablas
SHOW TABLES;
-- Debe mostrar 8 tablas

-- 3. Verificar datos
SELECT COUNT(*) FROM proyectos;
-- Debe mostrar: 3

-- 4. Verificar procedimientos
SHOW PROCEDURE STATUS WHERE Db = 'ksamati_proyectos';
-- Debe mostrar: 2 procedimientos

-- 5. Probar cálculo automático
CALL CalcularCamposAutomaticosProyecto(1);
SELECT balance_proyecto FROM proyectos WHERE id = 1;
-- Debe mostrar un valor calculado

-- 6. Verificar triggers
SHOW TRIGGERS;
-- Debe mostrar: 5 triggers
```

---

## 🎉 ¡LISTO PARA USAR!

Si completaste todos los checkboxes y las verificaciones pasan, tu base de datos está:

✅ **Instalada correctamente**  
✅ **Optimizada y funcionando**  
✅ **Con datos de ejemplo**  
✅ **Lista para producción**  
✅ **Con cálculos automáticos activos**  
✅ **Con auditoría completa**  

### **Próximos Pasos:**

1. ✨ Iniciar servidor: `npm run dev`
2. 🚀 Probar en navegador: `http://localhost:3000`
3. 📊 Explorar datos de ejemplo
4. 🎨 Personalizar según necesidades
5. 🏭 Desplegar en producción cuando esté listo

---

## 📚 RECURSOS ADICIONALES

- **Documentación completa:** `DIAGRAMA-BASE-DE-DATOS-KSAMATI.md`
- **Schema completo:** `server/database/ksamati_complete_schema.sql`
- **Guía de despliegue:** `DEPLOYMENT-GUIDE-CPANEL.md`
- **README principal:** `README.md`

---

## 📞 ¿NECESITAS AYUDA?

1. ✅ Revisa el diagrama completo en `DIAGRAMA-BASE-DE-DATOS-KSAMATI.md`
2. ✅ Ejecuta `npm run verify-db` para diagnóstico automático
3. ✅ Verifica logs de MySQL: `sudo tail -f /var/log/mysql/error.log`
4. ✅ Consulta la sección de Troubleshooting en este documento

---

**Creado:** Octubre 2025  
**Versión:** 1.0  
**Estado:** ✅ Production Ready

**¡Éxito con tu despliegue! 🚀**


