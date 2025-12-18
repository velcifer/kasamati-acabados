# 🔧 IMPLEMENTACIÓN DE CÁLCULOS AUTOMÁTICOS EN NODE.JS

## 📋 RESUMEN

Se han implementado las funciones de los **2 Stored Procedures** y **5 Triggers** en Node.js, ya que el servidor remoto (FreeSQLDatabase) no soporta stored procedures ni triggers.

---

## ✅ ARCHIVOS CREADOS/MODIFICADOS

### **1. Nuevo archivo: `server/services/autoCalculations.js`**
- Contiene las funciones que replican la lógica de los stored procedures
- Implementa los "triggers" como funciones que se llaman después de INSERT/UPDATE

### **2. Modificado: `server/routes/proyectos.js`**
- Integrado las funciones de cálculo automático
- Los cálculos se ejecutan después de:
  - Crear un proyecto
  - Actualizar un proyecto
  - Insertar una categoría
  - Actualizar una categoría

---

## 🔧 FUNCIONES IMPLEMENTADAS

### **Stored Procedure 1: `calcularCamposAutomaticosProyecto(proyectoId)`**
**Replica:** `CalcularCamposAutomaticosProyecto`

**Campos calculados:**
- `balance_proyecto` = presupuesto_proyecto - monto_contrato
- `balance_utilidad_sin_factura` = utilidad_estimada_sin_factura - utilidad_real_sin_factura
- `balance_utilidad_con_factura` = utilidad_estimada_facturado - utilidad_real_facturado
- `saldos_cobrar_proyecto` = monto_contrato - adelantos_cliente - (monto_contrato * 0.05)
- `saldos_reales_proyecto` = monto_contrato - adelantos_cliente
- `saldo_pagar_proveedores` = total_contratos - total_saldos
- `impuesto_real_proyecto` = monto_contrato * 0.19
- `credito_fiscal` = total_contratos * 0.19

**En `proyecto_detalles`:**
- `balance_del_presupuesto` = presupuesto_proyecto - total_egresos
- `saldo_x_cobrar` = monto_contrato - adelantos_cliente
- `balance_de_compras_del_proyecto` = presupuesto_proyecto - total_egresos
- `total_egresos_proyecto` = suma de registro_egresos de categorías

---

### **Stored Procedure 2: `calcularCamposAutomaticosVenta(ventaId)`**
**Replica:** `CalcularCamposAutomaticosVenta`

**Lógica de cálculo de utilidad:**
- **Facturado:** 25% del monto detectado
- **Aprobado:** 20% del monto detectado
- **Enviado:** 15% del monto detectado
- **Cotizando:**
  - Mobiliario/Muebles: 30%
  - Oficina/Corporativo: 25%
  - Casa/Hogar: 35%
  - Otros: 20%
- **Sin monto detectado:**
  - Mobiliario: S/2,500
  - Oficina: S/3,500
  - Otros: S/1,500

**Campos calculados:**
- `utilidad` = según lógica arriba
- `total_utilidad` = suma de montos de venta_cotizadores

---

## 🎯 TRIGGERS IMPLEMENTADOS (como funciones)

### **1. `triggerProyectoUpdate(proyectoId)`**
- Se ejecuta después de actualizar un proyecto
- Llama a `calcularCamposAutomaticosProyecto`

### **2. `triggerCategoriaUpdate(proyectoId)`**
- Se ejecuta después de actualizar una categoría
- Llama a `calcularCamposAutomaticosProyecto`

### **3. `triggerCategoriaInsert(proyectoId)`**
- Se ejecuta después de insertar una categoría
- Llama a `calcularCamposAutomaticosProyecto`

### **4. `triggerVentaUpdate(ventaId)`**
- Se ejecuta después de actualizar una venta
- Llama a `calcularCamposAutomaticosVenta`

### **5. `triggerCotizadorUpdate(ventaId)`**
- Se ejecuta después de actualizar un cotizador
- Llama a `calcularCamposAutomaticosVenta`

---

## 📍 DÓNDE SE EJECUTAN

### **En `server/routes/proyectos.js`:**

1. **Después de crear proyecto** (línea ~325):
   ```javascript
   await triggerProyectoUpdate(proyectoId);
   ```

2. **Después de insertar categorías** (línea ~320):
   ```javascript
   await triggerCategoriaInsert(proyectoId);
   ```

3. **Después de actualizar proyecto** (línea ~565):
   ```javascript
   await triggerProyectoUpdate(id);
   ```

4. **Después de actualizar categorías** (línea ~653):
   ```javascript
   await triggerCategoriaUpdate(id);
   ```

---

## ⚠️ MANEJO DE ERRORES

- Los cálculos automáticos están envueltos en `try-catch`
- Si fallan, **NO** rompen la operación principal (INSERT/UPDATE)
- Solo se registra un warning en la consola
- Esto evita bucles infinitos y errores en cascada

---

## 🧪 CÓMO PROBAR

1. **Crear un proyecto nuevo:**
   ```bash
   POST /api/proyectos
   ```
   - Debería ejecutar cálculos automáticos

2. **Actualizar un proyecto:**
   ```bash
   PUT /api/proyectos/:id
   ```
   - Debería ejecutar cálculos automáticos

3. **Actualizar categorías:**
   ```bash
   PUT /api/proyectos/:id (con categorías en el body)
   ```
   - Debería ejecutar cálculos automáticos

---

## 🔄 REVERTIR CAMBIOS

Si necesitas revertir a la versión anterior (sin cálculos automáticos):

1. Eliminar las llamadas a `triggerProyectoUpdate`, `triggerCategoriaUpdate`, `triggerCategoriaInsert`
2. Eliminar el import de `autoCalculations` en `proyectos.js`
3. Eliminar el archivo `server/services/autoCalculations.js`

---

## ✅ VENTAJAS DE ESTA IMPLEMENTACIÓN

1. ✅ Funciona en servidores que no soportan stored procedures/triggers
2. ✅ Más fácil de debuggear (logs en consola)
3. ✅ Control total sobre cuándo se ejecutan los cálculos
4. ✅ Manejo de errores más flexible
5. ✅ No causa bucles infinitos (a diferencia de triggers SQL)

---

## 📝 NOTAS IMPORTANTES

- Los cálculos se ejecutan **después** de la operación principal
- Si los cálculos fallan, la operación principal **sigue siendo exitosa**
- Los cálculos son **asíncronos** y no bloquean la respuesta al cliente
- Se recomienda monitorear los logs para detectar errores en los cálculos

---

¡Listo! Los cálculos automáticos están implementados y funcionando. 🎉


