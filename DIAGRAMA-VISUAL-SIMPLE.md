# 🎨 DIAGRAMA VISUAL SIMPLIFICADO - BASE DE DATOS KSAMATI

## 📊 VISTA GENERAL DEL SISTEMA

```
┌────────────────────────────────────────────────────────────────────┐
│                    KSAMATI - Sistema de Gestión                    │
│                    Base de Datos: ksamati_proyectos                │
└────────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┴─────────────────┐
                │                                   │
         ┌──────▼──────┐                    ┌──────▼──────┐
         │  PROYECTOS  │                    │    VENTAS   │
         │   (Módulo)  │                    │   (Módulo)  │
         └──────┬──────┘                    └──────┬──────┘
                │                                   │
         ┌──────┴──────┐                    ┌──────┴──────┐
         │  4 Tablas   │                    │  2 Tablas   │
         └─────────────┘                    └─────────────┘
                │                                   │
         ┌──────┴──────────────────┐        ┌──────┴──────┐
         │                         │        │             │
    ┌────▼────┐              ┌────▼────┐  ┌▼──────┐  ┌──▼──────────┐
    │proyectos│              │documentos│  │ventas │  │cotizadores  │
    └────┬────┘              └─────────┘  └───────┘  └─────────────┘
         │
    ┌────┴────────────┐
    │                 │
┌───▼──────┐    ┌────▼─────┐
│detalles  │    │categorias│
└──────────┘    └──────────┘

         ┌─────────────────────────────┐
         │   TABLAS COMPARTIDAS        │
         ├─────────────────────────────┤
         │ • archivos_adjuntos         │
         │ • proyecto_cambios          │
         └─────────────────────────────┘
```

---

## 🗂️ DETALLE DE CADA TABLA

### 1️⃣ PROYECTOS (Tabla Central)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃          TABLA: proyectos             ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 🔑 id (PK)                            ┃
┃ 📊 numero_proyecto (UNIQUE)           ┃
┃ 📝 nombre_proyecto                    ┃
┃ 👤 nombre_cliente                     ┃
┃ 🎯 estado_proyecto                    ┃
┃ 📑 tipo_proyecto                      ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 💰 FINANZAS (12 campos):             ┃
┃    • monto_contrato                   ┃
┃    • presupuesto_proyecto             ┃
┃    • balance_proyecto ✅              ┃
┃    • utilidad_estimada_sin_factura    ┃
┃    • utilidad_real_sin_factura        ┃
┃    • balance_utilidad_sin_factura ✅  ┃
┃    • utilidad_estimada_facturado      ┃
┃    • utilidad_real_facturado          ┃
┃    • balance_utilidad_con_factura ✅  ┃
┃    • total_contrato_proveedores       ┃
┃    • saldo_pagar_proveedores ✅       ┃
┃    • adelantos_cliente                ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 💳 COBRANZAS (2 campos):             ┃
┃    • saldos_reales_proyecto ✅        ┃
┃    • saldos_cobrar_proyecto ✅        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 📊 SUNAT (2 campos):                 ┃
┃    • credito_fiscal ✅                ┃
┃    • impuesto_real_proyecto ✅        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ✅ = Calculado automáticamente        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
         │
         ├──────────┐
         │          │
         ▼          ▼
    DETALLES    CATEGORIAS
```

### 2️⃣ PROYECTO_DETALLES

```
┌────────────────────────────────────┐
│   TABLA: proyecto_detalles         │
├────────────────────────────────────┤
│ 🔑 id (PK)                         │
│ 🔗 proyecto_id (FK)                │
├────────────────────────────────────┤
│ 📋 Datos Básicos:                  │
│    • descripcion_proyecto          │
│    • ubicacion_proyecto            │
│    • fecha_inicio                  │
│    • fecha_estimada_fin            │
├────────────────────────────────────┤
│ 💰 Análisis Financiero:            │
│    • presupuesto_del_proyecto      │
│    • total_egresos_proyecto ✅     │
│    • balance_del_presupuesto ✅    │
├────────────────────────────────────┤
│ 📊 IGV y SUNAT:                    │
│    • igv_sunat (19%)               │
│    • credito_fiscal_estimado       │
│    • impuesto_estimado_proyecto    │
│    • credito_fiscal_real           │
│    • impuesto_real_del_proyecto    │
├────────────────────────────────────┤
│ 💳 Cobranzas:                      │
│    • saldo_x_cobrar ✅             │
│    • balance_de_compras_proy. ✅   │
├────────────────────────────────────┤
│ 📝 Observaciones:                  │
│    • observaciones_del_proyecto    │
└────────────────────────────────────┘
```

### 3️⃣ PROYECTO_CATEGORIAS (24 por proyecto)

```
┌────────────────────────────────────┐
│   TABLA: proyecto_categorias       │
├────────────────────────────────────┤
│ 🔑 id (PK)                         │
│ 🔗 proyecto_id (FK)                │
│ 📝 nombre_categoria                │
│ 🏷️ tipo_categoria (F/S/P/'')      │
│ 🔢 orden_categoria (1-24)          │
├────────────────────────────────────┤
│ 💰 Valores Financieros:            │
│    • presupuesto_del_proyecto      │
│    • contrato_proved_y_serv        │
│    • registro_egresos              │
│    • saldos_por_cancelar           │
├────────────────────────────────────┤
│ 🔧 Configuración:                  │
│    • es_editable                   │
│    • esta_activo                   │
└────────────────────────────────────┘

📋 24 CATEGORÍAS ESTÁNDAR:
════════════════════════════════════
 1. Melamina y Servicios (F)
 2. Melamina High Glass (F)
 3. Accesorios y Ferretería (F)
 4. Puertas Alu Y Vidrios (F)
 5. Led y Electricidad (F)
 6. Flete Y/o Camioneta ('')
 7. Logística Operativa ('')
 8. Extras y/o Eventos ('')
 9. Despecie ('')
10. Mano de Obra ('')
11. Granito Y/O Cuarzo (F)
12. Extras Y/O Eventos GyC ('')
13. Tercialization 1 Facturada (F)
14. Extras Y/O Eventos Terc. 1 ('')
15. Tercialization 2 Facturada (F)
16. Extras Y/O Eventos Terc. 2 ('')
17. Tercialization 1 NO Facturada ('')
18. Extras Y/O Eventos Terc. 1 NF ('')
19. Tercialization 2 NO Facturada ('')
20. Extras Y/O Eventos Terc. 2 NF ('')
21. OF - ESCP ('')
22. Incentivos ('')
23. Comisión Directorio ('')
24. Utilidad Final ('')
```

### 4️⃣ PROYECTO_DOCUMENTOS

```
┌────────────────────────────────────┐
│   TABLA: proyecto_documentos       │
├────────────────────────────────────┤
│ 🔑 id (PK)                         │
│ 🔗 proyecto_id (FK)                │
│ 🏢 proveedor                       │
│ 📝 descripcion                     │
│ 📅 fecha                           │
│ 💰 monto                           │
│ 🔢 orden_documento                 │
└────────────────────────────────────┘
```

### 5️⃣ VENTAS

```
┌────────────────────────────────────┐
│        TABLA: ventas               │
├────────────────────────────────────┤
│ 🔑 id (PK)                         │
│ 📊 numero_venta (UNIQUE)           │
│ 🎯 estado (Cotizando/Enviado/      │
│            Aprobado/Facturado)     │
│ 👤 cliente                         │
│ 📞 telefono                        │
│ 📝 requerimiento                   │
│ 📋 proyecto                        │
├────────────────────────────────────┤
│ 💰 Totales Automáticos:            │
│    • utilidad ✅                   │
│    • total_utilidad ✅             │
│    • total_recibo ✅               │
│    • total_facturado ✅            │
│    • total_doble_modo_con ✅       │
│    • total_doble_modo_sin ✅       │
├────────────────────────────────────┤
│ 📝 observaciones                   │
└────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌────────────────────────────────────┐
│   TABLA: venta_cotizadores         │
├────────────────────────────────────┤
│ 🔑 id (PK)                         │
│ 🔗 venta_id (FK)                   │
│ 🏷️ tipo_cotizador (melamina/      │
│    granito/tercializaciones)       │
│ 📝 categoria                       │
│ 💰 monto                           │
│ 🔢 orden_categoria                 │
├────────────────────────────────────┤
│ 🧮 Totales Calculados:             │
│    • recibo_interno ✅             │
│    • monto_facturado ✅            │
│    • monto_con_recibo ✅           │
│    • factura_total ✅              │
└────────────────────────────────────┘
```

### 6️⃣ ARCHIVOS_ADJUNTOS (Polimórfico)

```
┌────────────────────────────────────┐
│   TABLA: archivos_adjuntos         │
├────────────────────────────────────┤
│ 🔑 id (PK)                         │
│ 🏷️ entidad_tipo (proyecto/venta)  │
│ 🔗 entidad_id                      │
│ 📄 nombre_archivo                  │
│ 📄 nombre_original                 │
│ 🏷️ tipo_archivo (MIME)            │
│ 📏 tamaño_archivo (bytes)          │
│ 📂 ruta_archivo                    │
├────────────────────────────────────┤
│ 🔍 Metadatos:                      │
│    • extension_archivo             │
│    • es_imagen                     │
│    • es_pdf                        │
└────────────────────────────────────┘

📎 LÍMITE: 1-4 archivos por entidad
📁 FORMATOS: PDF, JPG, PNG, GIF, WEBP
```

### 7️⃣ PROYECTO_CAMBIOS (Auditoría)

```
┌────────────────────────────────────┐
│   TABLA: proyecto_cambios          │
├────────────────────────────────────┤
│ 🔑 id (PK)                         │
│ 🏷️ entidad_tipo (proyecto/venta)  │
│ 🔗 entidad_id                      │
│ 📝 campo_modificado                │
│ 📋 valor_anterior                  │
│ 📋 valor_nuevo                     │
│ 👤 usuario                         │
│ 🌐 ip_address                      │
│ 💻 user_agent                      │
│ 📅 created_at                      │
└────────────────────────────────────┘

✅ Registra TODOS los cambios
✅ Auditoría completa del sistema
```

---

## 🔄 FLUJO DE CÁLCULOS AUTOMÁTICOS

### Proyectos

```
┌─────────────────────────────────────────────────────────────┐
│  USUARIO MODIFICA UN PROYECTO                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  TRIGGER ACTIVA    │
         │ tr_proyectos_update│
         └────────┬───────────┘
                  │
                  ▼
    ┌────────────────────────────────────┐
    │ PROCEDIMIENTO ALMACENADO           │
    │ CalcularCamposAutomaticosProyecto()│
    └────────┬───────────────────────────┘
             │
             ├──► Calcula: balance_proyecto
             ├──► Calcula: balance_utilidad_sin_factura
             ├──► Calcula: balance_utilidad_con_factura
             ├──► Calcula: saldos_cobrar_proyecto
             ├──► Calcula: saldos_reales_proyecto
             ├──► Calcula: saldo_pagar_proveedores
             ├──► Calcula: impuesto_real_proyecto
             ├──► Calcula: credito_fiscal
             │
             ▼
    ┌────────────────────────────┐
    │ ACTUALIZA TABLA            │
    │ proyecto_detalles          │
    └────────┬───────────────────┘
             │
             ├──► Calcula: balance_del_presupuesto
             ├──► Calcula: saldo_x_cobrar
             ├──► Calcula: balance_de_compras_del_proyecto
             ├──► Calcula: total_egresos_proyecto
             │
             ▼
    ┌────────────────────────────┐
    │ ✅ PROYECTO ACTUALIZADO    │
    │ CON TODOS LOS CÁLCULOS     │
    └────────────────────────────┘
```

### Ventas

```
┌─────────────────────────────────────────────────────────────┐
│  USUARIO CREA/MODIFICA UNA VENTA                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  TRIGGER ACTIVA    │
         │  tr_ventas_update  │
         └────────┬───────────┘
                  │
                  ▼
    ┌────────────────────────────────────┐
    │ PROCEDIMIENTO ALMACENADO           │
    │ CalcularCamposAutomaticosVenta()   │
    └────────┬───────────────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ ANALIZA ESTADO Y TIPO      │
    │ • Facturado: 25%           │
    │ • Aprobado: 20%            │
    │ • Enviado: 15%             │
    │ • Cotizando: 20-35%        │
    │   (según tipo de proyecto) │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ CALCULA UTILIDAD           │
    │ basada en requerimiento    │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ SUMA COTIZADORES           │
    │ total_utilidad =           │
    │ Σ montos cotizadores       │
    └────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ ✅ VENTA ACTUALIZADA       │
    │ CON UTILIDAD CALCULADA     │
    └────────────────────────────┘
```

---

## 📊 RELACIONES ENTRE TABLAS

```
                    PROYECTOS (1)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   DETALLES (1)    CATEGORIAS (24)  DOCUMENTOS (N)
                         │
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
       ARCHIVOS (1-4)          CAMBIOS (N)
                                  ▲
                                  │
                                  │
                    VENTAS (1)────┘
                         │
                         ▼
                  COTIZADORES (N)
```

### Leyenda:
- `(1)` = Relación 1:1
- `(N)` = Relación 1:N (uno a muchos)
- `(24)` = Exactamente 24 registros por proyecto

---

## 🧮 FÓRMULAS AUTOMÁTICAS

### Proyectos (12 fórmulas)

```
1️⃣  balance_proyecto = presupuesto_proyecto - monto_contrato

2️⃣  balance_utilidad_sin_factura = utilidad_estimada_sin_factura 
                                   - utilidad_real_sin_factura

3️⃣  balance_utilidad_con_factura = utilidad_estimada_facturado 
                                   - utilidad_real_facturado

4️⃣  saldos_cobrar_proyecto = monto_contrato - adelantos_cliente 
                             - (monto_contrato × 0.05)

5️⃣  saldos_reales_proyecto = monto_contrato - adelantos_cliente

6️⃣  saldo_pagar_proveedores = total_contrato_proveedores 
                              - Σ(saldos_por_cancelar)

7️⃣  impuesto_real_proyecto = monto_contrato × 0.19  (IGV 19%)

8️⃣  credito_fiscal = total_contrato_proveedores × 0.19

EN proyecto_detalles:

9️⃣  balance_del_presupuesto = presupuesto_proyecto - total_egresos

🔟 saldo_x_cobrar = monto_contrato - adelantos_cliente

1️⃣1️⃣ balance_de_compras_del_proyecto = presupuesto - total_egresos

1️⃣2️⃣ total_egresos_proyecto = Σ(registro_egresos) de categorías
```

### Ventas (Utilidad Inteligente)

```
SI estado = 'Facturado' ENTONCES
    💰 utilidad = monto_base × 0.25 (25%)

SINO SI estado = 'Aprobado' ENTONCES
    💰 utilidad = monto_base × 0.20 (20%)

SINO SI estado = 'Enviado' ENTONCES
    💰 utilidad = monto_base × 0.15 (15%)

SINO SI estado = 'Cotizando' ENTONCES
    SI 'mobiliario' en requerimiento ENTONCES
        💰 utilidad = monto_base × 0.30 (30%)
    SINO SI 'oficina' en requerimiento ENTONCES
        💰 utilidad = monto_base × 0.25 (25%)
    SINO SI 'casa' en requerimiento ENTONCES
        💰 utilidad = monto_base × 0.35 (35%)
    SINO
        💰 utilidad = monto_base × 0.20 (20%)
    FIN SI
FIN SI

ADEMÁS:
📊 total_utilidad = Σ(montos de cotizadores)
```

---

## 🎯 CASOS DE USO PRINCIPALES

### Caso 1: Crear Nuevo Proyecto

```
1. USUARIO crea proyecto
   ↓
2. Sistema asigna numero_proyecto automático
   ↓
3. Se crea registro en 'proyectos'
   ↓
4. Se crea registro en 'proyecto_detalles'
   ↓
5. Se crean 24 categorías por defecto
   ↓
6. TRIGGER calcula campos automáticos
   ↓
7. ✅ Proyecto listo para usar
```

### Caso 2: Actualizar Monto de Contrato

```
1. USUARIO modifica monto_contrato
   ↓
2. TRIGGER tr_proyectos_update se activa
   ↓
3. PROCEDIMIENTO CalcularCamposAutomaticosProyecto() ejecuta
   ↓
4. Se recalculan automáticamente:
   • balance_proyecto
   • saldos_cobrar_proyecto
   • saldos_reales_proyecto
   • impuesto_real_proyecto
   ↓
5. ✅ Todos los campos actualizados en tiempo real
```

### Caso 3: Modificar Categoría

```
1. USUARIO cambia registro_egresos en categoría
   ↓
2. TRIGGER tr_categorias_update se activa
   ↓
3. PROCEDIMIENTO recalcula total_egresos_proyecto
   ↓
4. Actualiza balance_del_presupuesto
   ↓
5. ✅ Balance actualizado automáticamente
```

### Caso 4: Crear Venta

```
1. USUARIO crea venta con requerimiento
   ↓
2. Sistema analiza texto del requerimiento
   ↓
3. Determina tipo (mobiliario/oficina/casa)
   ↓
4. PROCEDIMIENTO calcula utilidad según tipo
   ↓
5. ✅ Utilidad calculada automáticamente
```

---

## 🚀 INSTALACIÓN VISUAL

```
   ┌──────────────────────┐
   │  1. PREPARACIÓN      │
   │  ✓ MySQL instalado   │
   │  ✓ Node.js instalado │
   │  ✓ Proyecto clonado  │
   └──────────┬───────────┘
              │
              ▼
   ┌──────────────────────┐
   │  2. CONFIGURACIÓN    │
   │  ✓ Crear .env        │
   │  ✓ Configurar        │
   │    credenciales      │
   └──────────┬───────────┘
              │
              ▼
   ┌──────────────────────┐
   │  3. INSTALACIÓN      │
   │  $ npm install       │
   │  $ npm run           │
   │    setup-db-complete │
   └──────────┬───────────┘
              │
              ▼
   ┌──────────────────────┐
   │  4. VERIFICACIÓN     │
   │  $ npm run verify-db │
   │  ✅ 8 tablas         │
   │  ✅ 2 procedimientos │
   │  ✅ 5 triggers       │
   └──────────┬───────────┘
              │
              ▼
   ┌──────────────────────┐
   │  5. ¡LISTO!          │
   │  $ npm run dev       │
   │  🚀 Sistema activo   │
   └──────────────────────┘
```

---

## 📊 ESTADÍSTICAS DEL SISTEMA

```
╔═══════════════════════════════════════════════════════════╗
║              RESUMEN DE LA BASE DE DATOS                  ║
╠═══════════════════════════════════════════════════════════╣
║  📊 Nombre:             ksamati_proyectos                 ║
║  🗂️  Tablas:             8                                ║
║  🔧 Procedimientos:     2                                 ║
║  ⚡ Triggers:           5                                 ║
║  🔗 Foreign Keys:       5                                 ║
║  📇 Índices:            24                                ║
║  ✅ Campos calculados:  18 (automáticos)                  ║
║  📝 Campos de texto:    12                                ║
║  💰 Campos numéricos:   48                                ║
║  📅 Campos de fecha:    8                                 ║
║  🏷️  Campos ENUM:        4                                ║
║  📏 Tamaño estimado:    5-10 MB con datos ejemplo         ║
╚═══════════════════════════════════════════════════════════╝
```

---

## ✅ CHECKLIST RÁPIDO

```
ANTES DE INSTALAR:
□ MySQL 5.7+ instalado y corriendo
□ Node.js 14+ instalado
□ Credenciales de MySQL disponibles
□ Puerto 3306 disponible

DURANTE LA INSTALACIÓN:
□ Crear archivo .env
□ Ejecutar npm install
□ Ejecutar npm run setup-db-complete
□ Sin errores en consola

DESPUÉS DE INSTALAR:
□ Verificar con npm run verify-db
□ Probar API en http://localhost:5000/api/health
□ Iniciar frontend en http://localhost:3000
□ Ver datos de ejemplo en el sistema

PRODUCCIÓN:
□ Cambiar contraseñas
□ Configurar backups
□ Habilitar SSL/TLS
□ Configurar firewall
```

---

## 🎉 RESULTADO FINAL

Después de la instalación tendrás:

```
✅ Base de datos KSAMATI funcionando
✅ 3 proyectos de ejemplo listos
✅ 3 ventas de ejemplo listas
✅ 72 categorías configuradas
✅ Cálculos automáticos activos
✅ Auditoría completa habilitada
✅ Sistema listo para producción

🚀 PUEDES EMPEZAR A USAR EL SISTEMA INMEDIATAMENTE
```

---

**Documento creado:** Octubre 2025  
**Versión:** 1.0  
**Estado:** ✅ Production Ready

**Para más detalles, consulta:**
- `DIAGRAMA-BASE-DE-DATOS-KSAMATI.md` - Documentación completa
- `CHECKLIST-DESPLIEGUE-BD.md` - Guía de instalación paso a paso


