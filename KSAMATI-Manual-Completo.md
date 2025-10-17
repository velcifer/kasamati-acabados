# 📊 KSAMATI - MANUAL COMPLETO DE BASE DE DATOS Y SCRIPTS

**Sistema de Gestión Completo con MySQL - Todas las funcionalidades implementadas**

---

## 🚀 SCRIPTS NPM DISPONIBLES

| Comando | Descripción | Cuándo usar |
|---------|-------------|-------------|
| `npm run dev` | Inicia aplicación completa (frontend + backend) | Desarrollo diario |
| `npm run server` | Solo servidor backend | Solo API |
| `npm run client` | Solo frontend React | Solo interfaz |
| `npm run build` | Compilar para producción | Deploy |
| `npm run start` | Iniciar producción | Servidor live |
| `npm install-all` | Instalar todas las dependencias | Primera vez |

## 🗄️ SCRIPTS DE BASE DE DATOS

| Script | Comando | Descripción | Resultado |
|--------|---------|-------------|-----------|
| **Setup Completo** | `npm run setup-db-complete` | 🎯 **RECOMENDADO** - Instala todo automáticamente | 8 tablas + procedimientos + triggers + datos |
| **Setup Interactivo** | `npm run setup-db` | Guía paso a paso con preguntas | Configuración personalizada |
| **Setup Producción** | `npm run setup-db-production` | Solo tablas esenciales para servidor | Tablas básicas sin datos de ejemplo |
| **Verificar BD** | `npm run verify-db` | Comprobar que todo funciona | Reporte completo del sistema |
| **Verificación Rápida** | `npm run check-db` | Solo conexión básica | OK/Error simple |

---

## 🏗️ ESTRUCTURA COMPLETA DE BASE DE DATOS

### 📋 TABLAS PRINCIPALES (8 tablas)

#### 1. **`proyectos`** - Tabla principal de proyectos
```sql
CREATE TABLE proyectos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_proyecto INT UNIQUE NOT NULL,
    nombre_proyecto VARCHAR(255) NOT NULL,
    nombre_cliente VARCHAR(255),
    estado_proyecto ENUM('Ejecucion', 'Recibo', 'Completado') DEFAULT 'Ejecucion',
    tipo_proyecto ENUM('Recibo', 'Contrato', 'Servicio') DEFAULT 'Recibo',
    telefono VARCHAR(50),
    
    -- 💰 ANÁLISIS FINANCIERO (12 campos calculados)
    monto_contrato DECIMAL(15,2) DEFAULT 0.00,
    presupuesto_proyecto DECIMAL(15,2) DEFAULT 0.00,
    balance_proyecto DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    utilidad_estimada_sin_factura DECIMAL(15,2) DEFAULT 0.00,
    utilidad_real_sin_factura DECIMAL(15,2) DEFAULT 0.00,
    balance_utilidad_sin_factura DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    utilidad_estimada_facturado DECIMAL(15,2) DEFAULT 0.00,
    utilidad_real_facturado DECIMAL(15,2) DEFAULT 0.00,
    balance_utilidad_con_factura DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    
    -- 💳 COBRANZAS Y SALDOS (con fórmulas automáticas)
    total_contrato_proveedores DECIMAL(15,2) DEFAULT 0.00,
    saldo_pagar_proveedores DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    adelantos_cliente DECIMAL(15,2) DEFAULT 0.00,
    saldos_reales_proyecto DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    saldos_cobrar_proyecto DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    
    -- 📊 IMPUESTOS Y SUNAT
    credito_fiscal DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    impuesto_real_proyecto DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. **`proyecto_detalles`** - Detalles extendidos
```sql
CREATE TABLE proyecto_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    presupuesto_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    total_egresos_proyecto DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    balance_del_presupuesto DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    observaciones_del_proyecto TEXT,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);
```

#### 3. **`proyecto_categorias`** - 24 categorías de proveedores
```sql
CREATE TABLE proyecto_categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    nombre_categoria VARCHAR(255) NOT NULL,
    tipo_categoria ENUM('F', 'S', 'P', '') DEFAULT 'F',
    orden_categoria INT DEFAULT 0,
    presupuesto_del_proyecto DECIMAL(15,2) DEFAULT 0.00,
    contrato_proved_y_serv DECIMAL(15,2) DEFAULT 0.00,
    registro_egresos DECIMAL(15,2) DEFAULT 0.00,
    saldos_por_cancelar DECIMAL(15,2) DEFAULT 0.00,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);
```

#### 4. **`proyecto_documentos`** - NUEVA: Documentos del proyecto
```sql
CREATE TABLE proyecto_documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    proveedor VARCHAR(255),
    descripcion TEXT,
    fecha DATE,
    monto DECIMAL(15,2) DEFAULT 0.00,
    orden_documento INT DEFAULT 0,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);
```

#### 5. **`archivos_adjuntos`** - NUEVA: Sistema de archivos (1-4 máximo)
```sql
CREATE TABLE archivos_adjuntos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entidad_tipo ENUM('proyecto', 'venta') NOT NULL,
    entidad_id INT NOT NULL,
    nombre_archivo VARCHAR(500) NOT NULL,
    nombre_original VARCHAR(500) NOT NULL,
    tipo_archivo VARCHAR(100) NOT NULL, -- MIME type
    tamaño_archivo BIGINT NOT NULL,
    ruta_archivo VARCHAR(1000) NOT NULL,
    es_imagen BOOLEAN DEFAULT FALSE,
    es_pdf BOOLEAN DEFAULT FALSE
);
```

#### 6. **`ventas`** - NUEVA: Gestión completa de ventas
```sql
CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_venta INT UNIQUE NOT NULL,
    estado ENUM('Cotizando', 'Enviado', 'Aprobado', 'Facturado') DEFAULT 'Cotizando',
    cliente VARCHAR(255),
    telefono VARCHAR(50),
    requerimiento TEXT,
    proyecto VARCHAR(255),
    utilidad DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO INTELIGENTEMENTE
    total_utilidad DECIMAL(15,2) DEFAULT 0.00, -- CALCULADO
    observaciones TEXT
);
```

#### 7. **`venta_cotizadores`** - NUEVA: Cotizadores por venta
```sql
CREATE TABLE venta_cotizadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    tipo_cotizador ENUM('melamina', 'granito', 'tercializaciones') NOT NULL,
    categoria VARCHAR(255) NOT NULL,
    monto DECIMAL(15,2) DEFAULT 0.00,
    observaciones TEXT,
    orden_categoria INT DEFAULT 0,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);
```

#### 8. **`proyecto_cambios`** - Sistema de auditoría
```sql
CREATE TABLE proyecto_cambios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entidad_tipo ENUM('proyecto', 'venta') NOT NULL,
    entidad_id INT NOT NULL,
    campo_modificado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🧮 PROCEDIMIENTOS ALMACENADOS (2 procedimientos)

### 1. **`CalcularCamposAutomaticosProyecto`**
Recalcula automáticamente los 12 campos financieros de proyectos:
- Balance del proyecto
- Balances de utilidad (con/sin factura)
- Saldos por cobrar y pagar
- Impuestos (19% IGV)
- Crédito fiscal

### 2. **`CalcularCamposAutomaticosVenta`**
Calcula inteligentemente la utilidad de ventas según:
- **Estado**: Facturado (25%), Aprobado (20%), Enviado (15%)
- **Tipo**: Mobiliario (30%), Oficinas (25%), Casas (35%)
- **Detección automática** de montos en el texto

---

## ⚡ TRIGGERS AUTOMÁTICOS (6+ triggers)

| Trigger | Tabla | Evento | Función |
|---------|-------|--------|---------|
| `tr_proyectos_update` | proyectos | UPDATE | Recalcula fórmulas al modificar proyecto |
| `tr_categorias_update` | proyecto_categorias | UPDATE | Recalcula totales al modificar categoría |
| `tr_categorias_insert` | proyecto_categorias | INSERT | Recalcula al agregar categoría |
| `tr_ventas_update` | ventas | UPDATE | Recalcula utilidad al modificar venta |
| `tr_cotizadores_update` | venta_cotizadores | UPDATE | Recalcula totales de cotizadores |
| `tr_categorias_delete` | proyecto_categorias | DELETE | Recalcula al eliminar categoría |

---

## 🎯 FÓRMULAS AUTOMÁTICAS IMPLEMENTADAS

### 📊 **12 Fórmulas en Proyectos:**
1. `balance_proyecto = presupuesto_proyecto - monto_contrato`
2. `balance_utilidad_sin_factura = util_estimada_sin - util_real_sin`
3. `balance_utilidad_con_factura = util_estimada_con - util_real_con`
4. `saldos_cobrar_proyecto = monto_contrato - adelantos - (monto * 0.05)`
5. `saldos_reales_proyecto = monto_contrato - adelantos`
6. `saldo_pagar_proveedores = total_contratos - saldos_cancelar`
7. `impuesto_real_proyecto = monto_contrato * 0.19`
8. `credito_fiscal = total_contratos_proveedores * 0.19`
9. `balance_del_presupuesto = presupuesto - total_egresos`
10. `saldo_x_cobrar = monto_contrato - adelantos`
11. `balance_de_compras = presupuesto - egresos`
12. `total_egresos_proyecto = SUM(registro_egresos)`

### 💰 **Fórmulas Inteligentes en Ventas:**
- **Facturado**: `utilidad = monto_base * 0.25` (25%)
- **Aprobado**: `utilidad = monto_base * 0.20` (20%)
- **Enviado**: `utilidad = monto_base * 0.15` (15%)
- **Cotizando por tipo**:
  - Mobiliario: 30%
  - Oficinas: 25%
  - Casas: 35%
  - Default: 20%

---

## 🔧 CONFIGURACIÓN DE VARIABLES DE ENTORNO

**Archivo `.env` (crear en la raíz):**
```env
# 🗄️ BASE DE DATOS
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=ksamati_proyectos

# 🌐 SERVIDOR
PORT=5000
NODE_ENV=development

# 🔐 SEGURIDAD
JWT_SECRET=ksamati_secret_key
SESSION_SECRET=ksamati_session_secret
```

---

## 📁 ARCHIVOS DE BASE DE DATOS CREADOS

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| `ksamati_complete_schema.sql` | `server/database/` | 🎯 **PRINCIPAL** - Schema completo con todo |
| `setup-production.sql` | `server/database/` | Solo tablas para producción |
| `verify-database.js` | `server/database/` | Script de verificación completa |
| `schema.sql` | `server/database/` | Schema básico original |
| `README.md` | `server/database/` | Documentación completa |

---

## 🚀 PASOS DE INSTALACIÓN COMPLETA

### **Método 1: Automático (Recomendado)**
```bash
# 1. Crear archivo .env con credenciales MySQL
# 2. Ejecutar:
npm run setup-db-complete

# 3. Verificar:
npm run verify-db

# 4. Iniciar aplicación:
npm run dev
```

### **Método 2: Gestor MySQL**
```bash
# 1. Abrir phpMyAdmin/MySQL Workbench
# 2. Importar: server/database/ksamati_complete_schema.sql  
# 3. Iniciar aplicación:
npm run dev
```

### **Método 3: Manual**
```sql
-- En tu gestor MySQL:
source server/database/ksamati_complete_schema.sql;
```

---

## 🌐 PUERTOS Y ACCESO

| Servicio | Puerto | URL | Descripción |
|----------|--------|-----|-------------|
| **Frontend React** | 3000 | http://localhost:3000 | Interfaz principal |
| **Backend API** | 5000 | http://localhost:5000 | Servidor Node.js |
| **MySQL** | 3306 | localhost:3306 | Base de datos |

---

## 🔥 FUNCIONALIDADES IMPLEMENTADAS

### 🏗️ **GESTOR DE PROYECTOS**
✅ **Excel-like grid** con 12 fórmulas automáticas  
✅ **24 categorías de proveedores** por proyecto  
✅ **Tabla de documentos** (proveedor/descripción/fecha/monto)  
✅ **Sistema de archivos** (1-4 archivos: PDF, imágenes)  
✅ **Vista previa integrada** de archivos  
✅ **Filtros avanzados** por proyecto, cliente, estado, tipo  
✅ **Cálculos automáticos** en tiempo real  
✅ **Pestañas dinámicas** por proyecto  

### 💰 **GESTOR DE VENTAS**
✅ **Cotizador inteligente** (Melamina, Granito, Tercializaciones)  
✅ **Cálculo automático de utilidad** basado en estado y tipo  
✅ **14 categorías por cotizador** Melamina  
✅ **Filtros avanzados** por estado, cliente, requerimiento  
✅ **Fórmulas financieras automáticas**  
✅ **Sistema de pestañas** por venta  

### 📊 **CARACTERÍSTICAS TÉCNICAS**
✅ **Base de datos persistente** (sin pérdida de datos)  
✅ **Triggers automáticos** para cálculos en tiempo real  
✅ **Procedimientos almacenados** optimizados  
✅ **Sistema de auditoría** completo  
✅ **API RESTful** completa  
✅ **Interfaz responsive** (móvil + desktop)  

---

## 🚨 SOLUCIÓN DE PROBLEMAS COMUNES

### **Error: "Puerto 5000 en uso"**
```bash
# Windows:
netstat -ano | findstr :5000
taskkill /PID [número_del_proceso] /F

# O cambiar puerto en .env:
PORT=5001
```

### **Error: "Puerto 3000 en uso"**
```bash
# Cerrar proceso en puerto 3000
# O usar otro puerto:
PORT=3001 npm run client
```

### **Error: "Cannot connect to MySQL"**
```bash
# 1. Verificar MySQL ejecutándose
# 2. Verificar credenciales en .env
# 3. Ejecutar:
npm run check-db
```

### **Error: "Table doesn't exist"**
```bash
# Ejecutar setup completo:
npm run setup-db-complete
```

### **Error: "Procedure doesn't exist"**
```bash
# Schema incompleto, ejecutar:
npm run setup-db-complete
npm run verify-db
```

---

## ✅ LISTA DE VERIFICACIÓN FINAL

- [ ] **MySQL instalado** y ejecutándose
- [ ] **Archivo .env** creado con credenciales correctas
- [ ] **Script ejecutado**: `npm run setup-db-complete`
- [ ] **Verificación exitosa**: `npm run verify-db`
- [ ] **Puertos libres**: 3000 y 5000
- [ ] **Aplicación iniciada**: `npm run dev`
- [ ] **Frontend accesible**: http://localhost:3000
- [ ] **Backend respondiendo**: http://localhost:5000

---

## 🎉 RESULTADO FINAL

**Al completar todos los pasos tendrás:**

🎯 **Sistema completo** de gestión de proyectos y ventas  
📊 **12 fórmulas automáticas** funcionando en tiempo real  
📄 **Sistema de documentos** y archivos adjuntos completo  
🔍 **Filtros avanzados** en ambos gestores  
🧮 **Cálculos inteligentes** de utilidad automáticos  
🔒 **Auditoría completa** de todos los cambios  
📱 **Interfaz responsive** para todos los dispositivos  
🗄️ **Persistencia total** en base de datos MySQL  
⚡ **Rendimiento optimizado** con triggers y procedimientos  

**¡EL SISTEMA KSAMATI ESTÁ COMPLETO Y LISTO PARA PRODUCCIÓN! 🚀**

---

*Documento generado automáticamente para el sistema KSAMATI v1.0*  
*Fecha: Enero 2025*  
*Incluye todas las funcionalidades implementadas*










