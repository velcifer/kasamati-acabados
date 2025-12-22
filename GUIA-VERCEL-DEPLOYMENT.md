# 🚀 GUÍA DE DESPLIEGUE EN VERCEL - KSAMATI

## 📋 PROBLEMA IDENTIFICADO

Cuando despliegas en Vercel:
- ✅ El frontend funciona correctamente
- ❌ La base de datos no hace nada (no guarda, no actualiza, no elimina)
- ❌ No aparecen errores en la consola

## 🔍 CAUSAS POSIBLES

1. **Variables de entorno no configuradas en Vercel**
2. **Railway bloquea conexiones desde Vercel (restricciones de IP)**
3. **El frontend apunta a `localhost:5000` en lugar de la URL de Vercel**
4. **Timeouts de Vercel muy cortos**

## ✅ SOLUCIÓN PASO A PASO

### PASO 1: Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a **Settings** → **Environment Variables**
3. Agrega estas variables:

```
DB_HOST=ballast.proxy.rlwy.net
DB_PORT=53369
DB_USER=root
DB_PASSWORD=SXQEOCvtQDZRPaMYQCueobuZAUsBIhxL
DB_NAME=railway
NODE_ENV=production
REACT_APP_API_URL=https://tu-app.vercel.app/api
```

⚠️ **IMPORTANTE**: Reemplaza `https://tu-app.vercel.app` con la URL real de tu app en Vercel.

### PASO 2: Configurar Railway para Permitir Conexiones desde Vercel

1. Ve a tu proyecto en Railway Dashboard
2. Ve a **Settings** → **Network** o **Public Networking**
3. Asegúrate de que **Public Networking** esté habilitado
4. Si hay restricciones de IP, agrega las IPs de Vercel o permite todas (`0.0.0.0/0`)

### PASO 3: Verificar que el Frontend Use la URL Correcta

El archivo `client/src/services/api.js` debe usar:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

En producción, Vercel inyectará `REACT_APP_API_URL` automáticamente.

### PASO 4: Verificar la Configuración de Vercel

El archivo `vercel.json` debe estar configurado correctamente (ya lo actualicé).

### PASO 5: Re-desplegar en Vercel

1. Haz commit de los cambios:
   ```bash
   git add .
   git commit -m "Fix: Configuración para Vercel"
   git push
   ```

2. Vercel desplegará automáticamente

### PASO 6: Verificar que Funciona

1. Ve a tu app en Vercel: `https://tu-app.vercel.app`
2. Abre la consola del navegador (F12)
3. Intenta crear/editar un proyecto
4. Deberías ver logs como:
   ```
   🔄 Intentando sincronizar proyecto X con MySQL...
   ✅ API disponible. Sincronizando proyecto X...
   📤 Enviando datos a API PUT /api/proyectos/X
   ✅ Proyecto X sincronizado con MySQL exitosamente
   ```

## 🔧 VERIFICACIÓN ADICIONAL

### Verificar Health Check

Visita: `https://tu-app.vercel.app/api/health`

Deberías ver:
```json
{
  "status": "OK",
  "database": "Connected",
  "timestamp": "..."
}
```

Si `database` es `"Disconnected"`, el problema es la conexión a Railway.

### Verificar Logs en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a **Deployments** → Selecciona el último deployment
3. Ve a **Functions** → Selecciona `/api/proyectos`
4. Revisa los logs para ver errores

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### Problema: "Database query failed: ETIMEDOUT"
**Solución**: Railway está bloqueando la conexión. Verifica que Public Networking esté habilitado.

### Problema: "Failed to fetch"
**Solución**: El frontend está intentando conectarse a `localhost`. Verifica que `REACT_APP_API_URL` esté configurada en Vercel.

### Problema: "CORS error"
**Solución**: Verifica que el CORS en `server/index.js` incluya tu dominio de Vercel.

## 📝 CHECKLIST FINAL

- [ ] Variables de entorno configuradas en Vercel
- [ ] Railway tiene Public Networking habilitado
- [ ] `REACT_APP_API_URL` apunta a tu URL de Vercel
- [ ] `vercel.json` está configurado correctamente
- [ ] Health check responde con `database: "Connected"`
- [ ] Los logs en Vercel muestran conexiones exitosas

## 🆘 SI AÚN NO FUNCIONA

Comparte:
1. Los logs de Vercel (Functions → Logs)
2. La respuesta de `/api/health`
3. Los errores en la consola del navegador

