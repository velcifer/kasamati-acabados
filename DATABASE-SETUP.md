# 🗄️ CONFIGURACIÓN DE BASE DE DATOS - KSAMATI

Esta guía te ayudará a configurar la base de datos MySQL tanto en **desarrollo local** como en **producción**.

## 📋 Requisitos Previos

- **MySQL 5.7+** o **MySQL 8.0+** instalado
- **Node.js** con acceso a `mysql2`
- Credenciales de MySQL (usuario y contraseña)

---

## 🚀 DESARROLLO LOCAL - Configuración Automática

### Opción 1: Script Interactivo (Recomendado)

```bash
# Instalar dependencias primero
npm install

# Ejecutar configuración automática
npm run setup-db
```

El script te pedirá:
- Host MySQL (localhost)
- Puerto (3306)
- Usuario (root)
- Contraseña
- Nombre de base de datos (ksamti_proyectos)

**¿Qué hace el script?**
- ✅ Crea la base de datos automáticamente
- ✅ Ejecuta todas las tablas y estructuras
- ✅ Inserta datos de ejemplo (3 proyectos demo)
- ✅ Crea archivo `.env` con tu configuración
- ✅ Configura triggers y procedimientos almacenados

### Opción 2: Manual con Gestor MySQL

1. **Abre tu gestor favorito** (MySQL Workbench, phpMyAdmin, HeidiSQL, etc.)

2. **Ejecuta el archivo SQL:**
   ```sql
   -- Cargar y ejecutar: database-setup.sql
   ```

3. **Configura variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=tu_usuario
   DB_PASSWORD=tu_contraseña
   DB_NAME=ksamti_proyectos
   ```

---

## 🏭 PRODUCCIÓN - Deploy en Servidor

### Para Hosting Compartido (cPanel, Plesk, etc.)

1. **Accede a phpMyAdmin o tu gestor de BD**

2. **Crea la base de datos:**
   ```sql
   CREATE DATABASE ksamti_proyectos;
   ```

3. **Ejecuta el setup:**
   - Carga el archivo `database-setup.sql`
   - Ejecuta todo el contenido

4. **Configura variables de entorno:**
   ```env
   DB_HOST=localhost  # o tu host específico
   DB_PORT=3306
   DB_USER=tu_usuario_hosting
   DB_PASSWORD=tu_contraseña_hosting
   DB_NAME=ksamti_proyectos
   NODE_ENV=production
   ```

### Para VPS/Servidor Dedicado

1. **Conecta a tu servidor:**
   ```bash
   ssh tu-usuario@tu-servidor.com
   ```

2. **Instala MySQL si no está:**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install mysql-server

   # CentOS/RHEL
   sudo yum install mysql-server
   ```

3. **Configura MySQL:**
   ```bash
   sudo mysql_secure_installation
   ```

4. **Crea usuario para la aplicación:**
   ```sql
   CREATE USER 'ksamati_user'@'localhost' IDENTIFIED BY 'password_seguro';
   CREATE DATABASE ksamti_proyectos;
   GRANT ALL PRIVILEGES ON ksamti_proyectos.* TO 'ksamati_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

5. **Ejecuta el schema:**
   ```bash
   mysql -u ksamati_user -p ksamti_proyectos < database-setup.sql
   ```

### Para Docker/Contenedores

1. **docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     mysql:
       image: mysql:8.0
       environment:
         MYSQL_DATABASE: ksamti_proyectos
         MYSQL_USER: ksamati_user
         MYSQL_PASSWORD: password_seguro
         MYSQL_ROOT_PASSWORD: root_password
       volumes:
         - ./database-setup.sql:/docker-entrypoint-initdb.d/database-setup.sql
         - mysql_data:/var/lib/mysql
       ports:
         - "3306:3306"
   
   volumes:
     mysql_data:
   ```

2. **Levantar contenedor:**
   ```bash
   docker-compose up -d
   ```

---

## 🧪 Verificación

### Comprobar conexión:
```bash
npm run check-db
```

### Verificar en MySQL:
```sql
USE ksamti_proyectos;
SHOW TABLES;
SELECT COUNT(*) FROM proyectos;
SELECT COUNT(*) FROM proyecto_categorias;
```

**Resultado esperado:**
```
✅ 4 tablas creadas
✅ 3 proyectos de ejemplo
✅ 18 categorías de ejemplo
✅ 1 procedimiento almacenado
✅ 4 triggers configurados
```

---

## 📊 Estructura de la Base de Datos

### Tablas Principales:

| Tabla | Descripción | Registros |
|-------|-------------|-----------|
| `proyectos` | **Excel principal** - datos de proyectos | 3 ejemplos |
| `proyecto_detalles` | **Pestañas individuales** - datos extendidos | 3 ejemplos |
| `proyecto_categorias` | **Categorías de proveedores** (24 tipos) | 18 ejemplos |
| `proyecto_cambios` | **Log de auditoría** - todos los cambios | Vacía |

### Características Avanzadas:

- ⚡ **Triggers automáticos** - Cálculos en tiempo real
- 🔧 **Procedimientos almacenados** - Lógica de negocio en BD
- 📊 **Campos calculados** - Balance, utilidades, saldos
- 🔒 **Auditoría completa** - Log de todos los cambios
- 🏗️ **Relaciones FK** - Integridad referencial

---

## 🚨 Resolución de Problemas

### Error: "Access denied for user"
```bash
# Verificar credenciales
mysql -u tu_usuario -p

# Si no funciona, crear nuevo usuario:
sudo mysql
CREATE USER 'nuevo_usuario'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON ksamti_proyectos.* TO 'nuevo_usuario'@'localhost';
```

### Error: "Database doesn't exist"
```sql
-- Crear manualmente
CREATE DATABASE ksamti_proyectos 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

### Error: "Table doesn't exist"
```bash
# Re-ejecutar setup
npm run setup-db
```

### Error: "Connection refused"
```bash
# Verificar si MySQL está corriendo
sudo systemctl status mysql

# Iniciar si está parado
sudo systemctl start mysql
```

---

## 📱 Datos de Ejemplo

Una vez configurado, tendrás **3 proyectos de ejemplo** con:

- **Proyecto Alpha** - Cliente Demo 1 ($15,000)
- **Proyecto Beta** - Cliente Demo 2 ($25,000) 
- **Proyecto Gamma** - Cliente Demo 3 ($8,000)

Cada proyecto incluye:
- ✅ 6 categorías de proveedores
- ✅ Datos financieros completos
- ✅ Campos calculados funcionando
- ✅ Listo para editar y probar

---

## 🔐 Seguridad en Producción

1. **Cambia contraseñas por defecto**
2. **Usa usuarios específicos (no root)**
3. **Configura SSL/TLS para conexiones**
4. **Habilita logs de auditoría**
5. **Configura backups automáticos**
6. **Restricción por IP si es posible**

---

## 💾 Backup y Restauración

### Crear backup:
```bash
mysqldump -u usuario -p ksamti_proyectos > ksamati_backup.sql
```

### Restaurar backup:
```bash
mysql -u usuario -p ksamti_proyectos < ksamati_backup.sql
```

---

## 📞 Soporte

Si tienes problemas:

1. ✅ Verifica que MySQL esté instalado y corriendo
2. ✅ Comprueba credenciales en `.env`
3. ✅ Ejecuta `npm run check-db`
4. ✅ Revisa logs del servidor
5. ❓ Contacta al equipo de desarrollo

**¡La base de datos es el corazón de KSAMATI! Una vez configurada, todo funcionará perfectamente.** 🚀










