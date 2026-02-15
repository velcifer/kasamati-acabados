// 🗄️ CONFIGURACIÓN DE BASE DE DATOS MYSQL
const mysql = require('mysql2/promise');

// 📊 CONFIGURACIÓN DE CONEXIÓN
const dbConfig = {
  //  host: process.env.DB_HOST || 'localhost',
  //  user: process.env.DB_USER || 'root',
  //  password: process.env.DB_PASSWORD || 'Julio123#',
  //  database: process.env.DB_NAME || 'ksamti_proyectos',
  //  port: process.env.DB_PORT || 3306,

  host: process.env.DB_HOST || 'ballast.proxy.rlwy.net',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'SXQEOCvtQDZRPaMYQCueobuZAUsBIhxL',
  database: process.env.DB_NAME || 'railway',
  port: process.env.DB_PORT || 53369,

  // host: process.env.DB_HOST || '169.60.159.40',
  // user: process.env.DB_USER || 'eddyyvi1_super_admin',
  // password: process.env.DB_PASSWORD || '3DqAiEREKC!fiqD',
  // database: process.env.DB_NAME || 'eddyyv1_ksamati_proyectos',
  // port: process.env.DB_PORT || 3306,
  
  // 🔧 CONFIGURACIÓN DE POOL (mysql2 compatible)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  
  // 🚀 CONFIGURACIÓN ADICIONAL (solo opciones válidas para mysql2)
  connectTimeout: 60000,
  timezone: '+00:00',
  charset: 'utf8mb4'
};

// 🔗 POOL DE CONEXIONES
const pool = mysql.createPool(dbConfig);

// Simple cache para evitar llamadas repetidas muy seguidas a testConnection
let _lastTestAt = 0;
let _lastTestResult = null; // boolean
// TTL para cache de testConnection (ms). Aumentado para uso local: 60s
const TEST_CONNECTION_TTL = 60 * 1000;

// 🧪 FUNCIÓN PARA PROBAR CONEXIÓN
const testConnection = async () => {
  // Si la última prueba fue reciente (TTL), devolver el resultado cacheado
  try {
    const now = Date.now();
    if (_lastTestAt && (now - _lastTestAt) < TEST_CONNECTION_TTL && _lastTestResult !== null) {
      return _lastTestResult;
    }

    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL exitosa!');
    console.log(`📊 Base de datos: ${dbConfig.database}`);
    console.log(`🔗 Host: ${dbConfig.host}:${dbConfig.port}`);

    // Probar una consulta básica
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`🐬 MySQL versión: ${rows[0].version}`);

    connection.release();
    _lastTestAt = now;
    _lastTestResult = true;
    return true;
  } catch (error) {
    // Guardar resultado fallido en cache para evitar spam
    _lastTestAt = Date.now();
    _lastTestResult = false;
    console.error('❌ Error de conexión a MySQL:', error.message);
    return false;
  }
};

// Devuelve el estado cacheado de la conexión (no intenta conectar si está en cache)
const getCachedConnectionStatus = () => {
  return {
    connected: !!_lastTestResult,
    lastCheckedAt: _lastTestAt,
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database
  };
};

// 🔄 FUNCIÓN PARA EJECUTAR QUERIES CON RETRY
const executeQuery = async (query, params = []) => {
  let retries = 3;
  
  while (retries > 0) {
    try {
      const [rows, fields] = await pool.execute(query, params);
      return { rows, fields, success: true };
    } catch (error) {
      retries--;
      console.warn(`⚠️ Query falló, intentos restantes: ${retries}`, error.message);
      
      if (retries === 0) {
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// 🔧 FUNCIÓN PARA TRANSACCIONES
const executeTransaction = async (queries) => {
  const connection = await pool.getConnection();
  
  try {
    console.log(`   🔄 Iniciando transacción con ${queries.length} queries...`);
    await connection.beginTransaction();
    
    const results = [];
    for (let i = 0; i < queries.length; i++) {
      const { query, params } = queries[i];
      console.log(`   📝 Ejecutando query ${i + 1}/${queries.length}...`);
      console.log(`      Query: ${query.substring(0, 100)}...`);
      console.log(`      Params:`, params);
      try {
        const [rows] = await connection.execute(query, params || []);
        results.push(rows);
        console.log(`      ✅ Query ${i + 1} exitosa`);
      } catch (queryError) {
        console.error(`      ❌ Error en query ${i + 1}:`, queryError.message);
        console.error(`         Código:`, queryError.code);
        console.error(`         SQL State:`, queryError.sqlState);
        throw queryError; // Re-lanzar para que se haga rollback
      }
    }
    
    console.log(`   💾 Haciendo commit de la transacción...`);
    await connection.commit();
    console.log(`   ✅ Transacción completada exitosamente`);
    return { results, success: true };
  } catch (error) {
    console.error(`   ❌ Error en transacción, haciendo rollback...`);
    console.error(`      Mensaje:`, error.message);
    console.error(`      Código:`, error.code);
    console.error(`      SQL State:`, error.sqlState);
    await connection.rollback();
    throw new Error(`Transaction failed: ${error.message} (Code: ${error.code}, SQLState: ${error.sqlState})`);
  } finally {
    connection.release();
    console.log(`   🔓 Conexión liberada`);
  }
};

// 📊 FUNCIÓN PARA OBTENER ESTADÍSTICAS DE BD
const getDatabaseStats = async () => {
  try {
    const queries = [
      'SELECT COUNT(*) as total_proyectos FROM proyectos',
      'SELECT COUNT(*) as total_categorias FROM proyecto_categorias',
      'SELECT estado_proyecto, COUNT(*) as cantidad FROM proyectos GROUP BY estado_proyecto',
    ];
    
    const totalProyectos = await executeQuery(queries[0]);
    const totalCategorias = await executeQuery(queries[1]);
    const estadisticasEstado = await executeQuery(queries[2]);
    
    return {
      totalProyectos: totalProyectos.rows[0].total_proyectos,
      totalCategorias: totalCategorias.rows[0].total_categorias,
      estadisticasPorEstado: estadisticasEstado.rows
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
};

module.exports = {
  pool,
  testConnection,
  executeQuery,
  executeTransaction,
  getDatabaseStats,
  getCachedConnectionStatus,
  dbConfig
};

