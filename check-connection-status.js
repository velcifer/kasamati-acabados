// 🔍 VERIFICAR ESTADO DE CONEXIÓN ACTUAL
const fs = require('fs');
const path = require('path');

console.log('\n🔍 ======================================');
console.log('   VERIFICANDO ESTADO DE CONEXIÓN');
console.log('   ======================================\n');

// 1. Verificar si existe archivo .env
console.log('📄 Verificando archivos de configuración...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ Archivo .env encontrado');
    
    // Leer contenido del .env (sin mostrar passwords)
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    console.log('📋 Variables configuradas:');
    lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && key.includes('PASSWORD')) {
            console.log(`   ${key.trim()}=****** (oculto por seguridad)`);
        } else if (key) {
            console.log(`   ${key.trim()}=${value || '(vacío)'}`);
        }
    });
} else {
    console.log('❌ Archivo .env NO encontrado');
    console.log('   → Necesitas crear el archivo .env para configurar la conexión');
}

console.log('\n🔧 Estado actual detectado:');

// 2. Verificar configuración de base de datos
try {
    // Cargar variables de entorno si existen
    if (fs.existsSync(envPath)) {
        require('dotenv').config();
    }
    
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD ? '***configurado***' : '(no configurado)',
        database: process.env.DB_NAME || 'ksamti_proyectos',
        port: process.env.DB_PORT || 3306
    };
    
    console.log('📊 Configuración de BD que usará la app:');
    Object.entries(dbConfig).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
    });
    
    // 3. Intentar conexión
    console.log('\n🧪 Probando conexión...');
    
    const mysql = require('mysql2/promise');
    
    const testConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ksamti_proyectos',
        port: process.env.DB_PORT || 3306,
        connectTimeout: 5000
    };
    
    mysql.createConnection(testConfig)
        .then(connection => {
            console.log('✅ ¡CONEXIÓN EXITOSA!');
            console.log('   Tu aplicación SÍ puede conectarse a la base de datos');
            return connection.end();
        })
        .catch(error => {
            console.log('❌ ERROR DE CONEXIÓN:');
            console.log(`   Código: ${error.code}`);
            console.log(`   Mensaje: ${error.message}`);
            
            // Diagnósticos
            if (error.code === 'ENOTFOUND') {
                console.log('\n💡 PROBLEMA: No se encuentra el servidor MySQL');
                console.log('   → Verifica que DB_HOST sea correcto');
                console.log('   → Si es remoto, verifica Remote MySQL en cPanel');
            } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                console.log('\n💡 PROBLEMA: Usuario o contraseña incorrectos');
                console.log('   → Verifica DB_USER y DB_PASSWORD en .env');
            } else if (error.code === 'ETIMEDOUT') {
                console.log('\n💡 PROBLEMA: Conexión bloqueada o timeout');
                console.log('   → Verifica Remote MySQL en cPanel');
                console.log('   → Verifica firewall del hosting');
            } else if (error.code === 'ER_BAD_DB_ERROR') {
                console.log('\n💡 PROBLEMA: Base de datos no existe');
                console.log('   → Verifica que DB_NAME sea correcto');
            }
        });
        
} catch (error) {
    console.log('❌ Error al verificar configuración:', error.message);
}

// 4. Recomendaciones
console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS:');
console.log('   1. Si no tienes .env: Crea el archivo con configuración');
console.log('   2. Si tienes errores: Revisa las credenciales');
console.log('   3. Si todo está bien: Reinicia la aplicación');
console.log('\n======================================\n');
