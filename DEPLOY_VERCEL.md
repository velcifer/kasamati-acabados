Despliegue en Vercel — KSAMATI

Resumen
-------
Este documento recoge pasos exactos para desplegar la aplicación en Vercel y asegurar que el backend (API) se conecta correctamente a la base de datos remota (Railway u otro proveedor).

Requisitos previos
------------------
- Proyecto conectado a un repositorio (GitHub/GitLab) vinculado a Vercel.
- Credenciales/host de la base de datos remoto (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME).
- Acceso al panel de Vercel para configurar Environment Variables.

Archivos relevantes
-------------------
- `server/index.js` — Express app (exportada por `api/index.js` para Vercel).
- `api/index.js` — entry point para funciones serverless en Vercel (exporta la app Express).
- `vercel.json` — configuraciones de build y rutas (redirige `/api/*` a `api/index.js`).
- `server/config/database.js` — helper DB (reusa pool, expone `testConnection()`).
- `tmp-run-server-test.js` — script local para probar `/api/db-test`.

Variables de entorno (añadir en Vercel, scope: Production)
-----------------------------------------------------------
Nombre exacto → Valor ejemplo
- DB_HOST = db-host.railway.app
- DB_PORT = 3306
- DB_USER = mi_usuario
- DB_PASSWORD = mi_contraseña_supersecreta
- DB_NAME = nombre_bd
- NODE_ENV = production
- (Opcional) CORS_ORIGIN = https://<tu-app>.vercel.app

Pasos de despliegue
-------------------
1) Push a la rama principal (`main`) o haz deploy desde el panel de Vercel.
2) En Vercel → Project → Settings → Environment Variables, añade las env vars de arriba (Production).
3) Trigger: Vercel detectará el push y ejecutará los builds definidos en `vercel.json`. Si usas la UI, pulsa Deploy.

Comprobaciones post-deploy
--------------------------
- Abre:
  - `https://<tu-proyecto>.vercel.app/api/db-test`  (endpoint diagnóstico; devuelve `testConnection()` detallado).
  - `https://<tu-proyecto>.vercel.app/api/health` (health general).

Respuestas esperadas
- OK: JSON con `ok: true` y `info` conteniendo `connection: true` y `version`.
- Error: JSON con `ok: false` o `database: 'Disconnected'` en `/api/health`.

Comandos útiles (PowerShell)
---------------------------
# probar localmente el endpoint de diagnóstico (usa defaults de desarrollo)
$env:NODE_ENV='development'
node tmp-run-server-test.js

# llamada rápida desde PowerShell (si ya tienes servidor en localhost:5000)
Invoke-RestMethod http://localhost:5000/api/db-test | ConvertTo-Json -Depth 5

CLI Vercel (opcional)
----------------------
# instalar CLI
npm i -g vercel
# ver logs del último deployment (requiere login/vercel link)
vercel logs <deployment-url> --token $VERCEL_TOKEN

Mensajes de log que buscaremos en Vercel
---------------------------------------
- [/api/db-test] ejecutando testConnection()
- [/api/db-test] resultado testConnection: {...}
- [/api/db-test] error: <mensaje>
- Missing required env var <NAME>
- Access denied for user '<user>'@'<host>'
- connect ECONNREFUSED / ETIMEDOUT

Problemas comunes y acciones
---------------------------
1) Missing required env var
   - Acción: Añadir la variable faltante en Vercel (Production).
2) Access denied
   - Acción: revisa DB_USER / DB_PASSWORD / DB_NAME.
3) Host no accesible / timeout
   - Motivo frecuente: la base de datos está protegida por allowlist o no acepta conexiones públicas.
   - Acciones:
     - Revisar configuración en Railway: permitir conexiones externas desde Vercel.
     - Opción recomendada si hay restricciones: desplegar backend en Railway y hacer que el cliente apunte al backend en Railway.
4) Problemas por conexiones simultáneas en serverless
   - La implementación reusa pool global para mitigar problemas, pero para producción con carga sostenida, despliega backend en servicio persistente (Railway/Render).

Si algo falla: qué compartir aquí
--------------------------------
- Salida exacta de `https://<tu-proyecto>.vercel.app/api/db-test` (JSON o mensaje de error).
- Extracto de logs de Vercel donde aparezcan las líneas mencionadas arriba.

Siguiente ayuda que puedo ofrecer
--------------------------------
- Ayudarte a revisar la salida de `/api/db-test` después del deploy.
- Si Vercel no puede alcanzar la DB, te guío para desplegar el backend en Railway y cambiar el frontend para apuntar al backend nuevo.

Notas finales
------------
- El código del repo ya incluye `api/index.js` y `vercel.json` configurado para ejecutar la app como serverless function. Solo falta configurar las env vars en Vercel y comprobar la conectividad de la BD.
- Si quieres, puedo preparar también un `README-deploy-railway.md` con pasos para mover el backend a Railway.
