# 🔧 GUÍA: CÓMO HABILITAR REMOTE MYSQL EN CPANEL

## 📍 UBICACIÓN EN CPANEL

Remote MySQL se encuentra en la sección de **"Bases de datos"** o **"Databases"** de cPanel.

---

## 🚀 PASOS DETALLADOS

### **PASO 1: Acceder a cPanel**
1. Inicia sesión en tu cuenta de cPanel
2. Usa las credenciales que te proporcionó tu hosting

### **PASO 2: Buscar la sección "Bases de datos"**
En el panel principal de cPanel, busca una de estas secciones:

**Opción A: Si tu cPanel está en ESPAÑOL:**
- Busca la sección **"Bases de datos"** o **"DATABASES"**
- Dentro de esta sección, busca **"MySQL Remoto"** o **"Remote MySQL"**

**Opción B: Si tu cPanel está en INGLÉS:**
- Busca la sección **"Databases"**
- Dentro de esta sección, busca **"Remote MySQL"**

**💡 TIP:** También puedes usar la barra de búsqueda en la parte superior de cPanel y escribir "Remote MySQL" o "MySQL Remoto"

### **PASO 3: Ubicación exacta**
La opción "Remote MySQL" generalmente aparece como:
- Un ícono con el nombre **"Remote MySQL"**
- O como **"Acceso remoto MySQL"** (en español)
- Está en la misma sección donde están:
  - MySQL Databases
  - phpMyAdmin
  - MySQL Database Wizard

### **PASO 4: Agregar tu IP**
Una vez dentro de "Remote MySQL" o "MySQL Remoto":

1. **Verás un formulario con estos campos:**
   - **"Host (% comodín permitido)"** o **"Access Host"** (campo de texto)
   - **"Comentario"** o **"Comment"** (opcional, para identificar la IP)
   - Botón **"Añadir host"** o **"Add Host"**

2. **Obtén tu IP actual:**
   - Visita: https://whatismyipaddress.com/
   - O busca en Google: "cuál es mi ip"
   - Copia tu IP (ejemplo: `123.45.67.89`)

3. **Agrega tu IP:**
   - En el campo **"Host"**, pega tu IP (ejemplo: `123.45.67.89`)
   - Opcionalmente, agrega un comentario como "Mi IP de desarrollo"
   - Haz clic en **"Añadir host"** o **"Add Host"**

4. **Alternativa rápida (menos seguro pero funciona para pruebas):**
   - En el campo **"Host"**, escribe: `%`
   - Esto permite conexiones desde cualquier IP
   - ⚠️ **Nota:** Solo úsalo para desarrollo/pruebas, no en producción

### **PASO 5: Verificar**
Después de agregar tu IP, deberías verla en la lista de "Access Hosts" o "Hosts de acceso".

---

## 📸 UBICACIÓN VISUAL (Referencia)

```
┌─────────────────────────────────────────┐
│  CPANEL - Panel Principal                │
├─────────────────────────────────────────┤
│                                           │
│  📊 BASES DE DATOS (DATABASES)          │
│  ┌─────────────────────────────────────┐ │
│  │  📁 MySQL Databases                 │ │
│  │  📁 phpMyAdmin                      │ │
│  │  📁 Remote MySQL  ← AQUÍ            │ │
│  │  📁 MySQL Database Wizard           │ │
│  └─────────────────────────────────────┘ │
│                                           │
└───────────────────────────────────────────┘
```

---

## 🔍 SI NO ENCUENTRAS "REMOTE MYSQL"

Si no encuentras la opción "Remote MySQL", puede ser porque:

1. **Tu hosting no lo permite:**
   - Algunos hostings compartidos deshabilitan Remote MySQL por seguridad
   - Contacta al soporte de tu hosting para habilitarlo

2. **Está en otra ubicación:**
   - Busca en la barra de búsqueda de cPanel: escribe "Remote MySQL"
   - O busca "MySQL" y revisa todas las opciones

3. **Tu plan de hosting no lo incluye:**
   - Algunos planes básicos no permiten conexiones remotas
   - Verifica con tu hosting si tu plan lo permite

---

## 🎯 CONFIGURACIÓN RECOMENDADA

### **Para Desarrollo/Pruebas:**
```
Access Host: %
```
Esto permite conexiones desde cualquier IP (menos seguro, pero funciona para pruebas).

### **Para Producción:**
```
Access Host: TU_IP_ACTUAL
```
Ejemplo: `123.45.67.89`

### **Múltiples IPs:**
Puedes agregar varias IPs, una por línea o separadas por comas (depende de tu versión de cPanel).

---

## ✅ DESPUÉS DE HABILITAR REMOTE MYSQL

1. **Espera unos minutos** para que los cambios se apliquen (generalmente es inmediato, pero a veces tarda 1-2 minutos)

2. **Prueba la conexión** ejecutando:
   ```bash
   node verificar-usuario-actual.js
   ```

3. **Si sigue sin funcionar:**
   - Verifica que agregaste la IP correcta
   - Intenta agregar `%` para permitir todas las IPs (solo para pruebas)
   - Contacta al soporte de tu hosting

---

## 🆘 ALTERNATIVA: USAR LOCALHOST

Si Remote MySQL no está disponible o no funciona, y tu aplicación está en el mismo servidor que la base de datos:

1. **Cambia el host en `database.js`:**
   ```javascript
   host: process.env.DB_HOST || 'localhost',
   ```

2. **Asegúrate de que el usuario tenga permisos para localhost:**
   - En cPanel → MySQL Databases
   - Verifica que el usuario tenga permisos ALL PRIVILEGES

---

## 📞 CONTACTO CON SOPORTE

Si necesitas ayuda adicional, contacta al soporte de tu hosting y menciona:

- **"Necesito habilitar Remote MySQL para conexiones externas"**
- **"Quiero agregar mi IP a la lista de Access Hosts"**
- **"Mi aplicación necesita conectarse remotamente a MySQL"**

---

## 🔐 SEGURIDAD

**IMPORTANTE:**
- Solo agrega IPs de confianza
- Evita usar `%` en producción si es posible
- Considera usar un túnel SSH o VPN para mayor seguridad
- Cambia las contraseñas regularmente

---

## ✅ CHECKLIST

- [ ] Accedí a cPanel
- [ ] Encontré la sección "Bases de datos" / "Databases"
- [ ] Encontré "Remote MySQL"
- [ ] Obtuve mi IP actual
- [ ] Agregué mi IP (o `%`) a Access Hosts
- [ ] Verifiqué que apareció en la lista
- [ ] Esperé unos minutos para que se apliquen los cambios
- [ ] Probé la conexión con el script de verificación

---

¡Listo! Una vez que hayas completado estos pasos, tu aplicación debería poder conectarse a la base de datos MySQL en cPanel.

