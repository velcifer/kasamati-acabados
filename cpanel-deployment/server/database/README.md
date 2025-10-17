# 🗄️ KSAMATI - Base de Datos MySQL

Esta carpeta contiene todos los archivos necesarios para configurar la base de datos MySQL de KSAMATI con **todas las funcionalidades completas**.

## 📋 ¿Qué incluye el sistema completo?

### 🏗️ **Gestión de Proyectos**
- ✅ **Excel-like grid** con 12 fórmulas automáticas
- ✅ **Categorías de proveedores** (24 categorías como en Excel)
- ✅ **Documentos del proyecto** (tabla con proveedor/descripción/fecha/monto)
- ✅ **Archivos adjuntos** (PDF, imágenes: 1-4 archivos máximo)
- ✅ **Vista previa de archivos** integrada
- ✅ **Filtros avanzados** por proyecto, cliente, estado, tipo

### 💰 **Gestión de Ventas**
- ✅ **Cotizador inteligente** (Melamina, Granito, Tercializaciones)
- ✅ **Cálculo automático de utilidad** basado en estado y tipo de proyecto
- ✅ **Filtros avanzados** por estado, cliente, requerimiento
- ✅ **Fórmulas financieras automáticas**

### 🧮 **Sistema de Cálculos Automáticos**
- ✅ **12 campos calculados** en proyectos
- ✅ **Procedimientos almacenados** para fórmulas
- ✅ **Triggers automáticos** que actualizan en tiempo real
- ✅ **Auditoría completa** de cambios

## 📁 Archivos disponibles

| Archivo | Descripción | Uso recomendado |
|---------|-------------|-----------------|
| `ksamati_complete_schema.sql` | 🎯 **Schema COMPLETO** con todas las funcionalidades | **Desarrollo y producción** |
| `setup-production.sql` | 📦 Schema simplificado para servidores | Solo para producción básica |
| `verify-database.js` | 🔍 Script de verificación completa | Comprobar instalación |
| `schema.sql` | 📄 Schema básico original | Compatibilidad legacy |

## 🚀 Scripts de NPM disponibles

### **Configuración inicial** (recomendado)
```bash
npm run setup-db
```
Script interactivo que te guía paso a paso para configurar todo.

### **Instalación rápida completa**
```bash
npm run setup-db-complete
```
Instala directamente el schema completo con todas las funcionalidades.

### **Instalación para producción**
```bash
npm run setup-db-production
```
Instala solo las tablas esenciales para producción.

### **Verificar instalación**
```bash
npm run verify-db
```
Verifica que todo esté funcionando correctamente.

### **Verificación rápida**
```bash
npm run check-db
```
Comprueba conexión básica a la base de datos.

## 🔧 Configuración manual

### **1. Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=ksamati_proyectos
```

### **2. Ejecutar schema completo manualmente**

```sql
-- En tu gestor MySQL favorito (phpMyAdmin, MySQL Workbench, etc.)
source server/database/ksamati_complete_schema.sql
```

### **3. Verificar instalación**

```bash
npm run verify-db
```

## 📊 Estructura de la base de datos

### **Tablas principales**
- `proyectos` - Información principal de proyectos
- `proyecto_detalles` - Detalles extendidos de proyectos
- `proyecto_categorias` - 24 categorías de proveedores por proyecto
- `proyecto_documentos` - Documentos del proyecto (NUEVO)
- `archivos_adjuntos` - Sistema de archivos (NUEVO)
- `ventas` - Gestión de ventas (NUEVO)
- `venta_cotizadores` - Cotizadores por venta (NUEVO)
- `proyecto_cambios` - Auditoría de cambios

### **Procedimientos almacenados**
- `CalcularCamposAutomaticosProyecto()` - Recalcula los 12 campos automáticos
- `CalcularCamposAutomaticosVenta()` - Calcula utilidad inteligente de ventas

### **Triggers automáticos**
- Actualización automática al modificar proyectos
- Actualización automática al modificar categorías
- Actualización automática al modificar ventas
- Actualización automática al modificar cotizadores

## 🎯 Funcionalidades especiales

### **Fórmulas automáticas en proyectos (12 campos)**
1. `balance_proyecto` = presupuesto_proyecto - monto_contrato
2. `balance_utilidad_sin_factura` = utilidad_estimada_sin_factura - utilidad_real_sin_factura
3. `balance_utilidad_con_factura` = utilidad_estimada_facturado - utilidad_real_facturado
4. `saldos_cobrar_proyecto` = monto_contrato - adelantos_cliente - (monto_contrato * 0.05)
5. `saldos_reales_proyecto` = monto_contrato - adelantos_cliente
6. `saldo_pagar_proveedores` = total_contrato_proveedores - saldo_pagar_proveedores
7. `impuesto_real_proyecto` = monto_contrato * 0.19
8. `credito_fiscal` = total_contrato_proveedores * 0.19
9. Y más...

### **Cálculo inteligente de utilidad en ventas**
- **Facturado**: 25% del monto base
- **Aprobado**: 20% del monto base  
- **Enviado**: 15% del monto base
- **Cotizando**:
  - Mobiliario: 30%
  - Oficinas: 25%
  - Casas: 35%
  - Por defecto: 20%

### **Sistema de archivos adjuntos**
- Límite: 1-4 archivos por proyecto/venta
- Formatos: PDF, JPG, PNG, GIF, WEBP
- Vista previa integrada
- Gestión automática de metadatos

## 🚨 Troubleshooting

### **Error: "Cannot connect to MySQL"**
```bash
# Verifica que MySQL esté ejecutándose
sudo service mysql start  # Linux
brew services start mysql  # Mac
```

### **Error: "Table doesn't exist"**
```bash
# Ejecuta el setup completo
npm run setup-db-complete
```

### **Error: "Access denied"**
```bash
# Verifica credenciales en .env
# O ejecuta setup interactivo
npm run setup-db
```

### **Error: "Procedure doesn't exist"**
```bash
# El schema no se instaló completamente
npm run setup-db-complete
npm run verify-db
```

## ✅ Lista de verificación final

- [ ] MySQL instalado y ejecutándose
- [ ] Archivo `.env` configurado
- [ ] Script ejecutado: `npm run setup-db-complete`
- [ ] Verificación exitosa: `npm run verify-db`
- [ ] Aplicación conecta: `npm run check-db`
- [ ] Frontend funcionando: `npm run dev`

## 🎉 ¡Listo para producción!

Una vez completados todos los pasos, tendrás:

✅ **Sistema completo** con gestión de proyectos y ventas  
✅ **12 fórmulas automáticas** funcionando en tiempo real  
✅ **Sistema de documentos** y archivos adjuntos  
✅ **Filtros avanzados** en ambos gestores  
✅ **Cálculos inteligentes** de utilidad  
✅ **Auditoría completa** de cambios  
✅ **Datos de ejemplo** para probar inmediatamente  

**¡El sistema KSAMATI está listo para usar! 🚀**

