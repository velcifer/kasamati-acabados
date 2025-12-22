// 🗄️ CONFIGURACIÓN DE BASE DE DATOS MYSQL
const mysql = require('mysql2/promise');

// 📊 CONFIGURACIÓN DE CONEXIÓN
const dbConfig = {
   /*host: process.env.DB_HOST || 'localhost',
   user: process.env.DB_USER || 'root',
   password: process.env.DB_PASSWORD || 'Julio123#',
   database: process.env.DB_NAME || 'ksamti_proyectos',
   port: process.env.DB_PORT || 3306,*/

  host: process.env.DB_HOST || 'ballast.proxy.rlwy.net',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'SXQEOCvtQDZRPaMYQCueobuZAUsBIhxL',
  database: process.env.DB_NAME || 'railway',
  port: process.env.DB_PORT || 53369,


  
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
console.log('DB config (env):', {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER ? '***' : undefined,
  DB_NAME: process.env.DB_NAME
});
console.log('DB config (final):', { host: dbConfig.host, port: dbConfig.port, database: dbConfig.database });

// Reusar pool en entornos serverless/funciones para evitar crear múltiples pools
if (!global.__mysqlPool) {
  global.__mysqlPool = mysql.createPool(dbConfig);
}
const pool = global.__mysqlPool;

// 🧪 FUNCIÓN PARA PROBAR CONEXIÓN
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL exitosa!');
    console.log(`📊 Base de datos: ${dbConfig.database}`);
    console.log(`🔗 Host: ${dbConfig.host}:${dbConfig.port}`);
    
    // Probar una consulta básica
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`🐬 MySQL versión: ${rows[0].version}`);
    
    connection.release();
    return true;
  } catch (error) {
  console.error('❌ Error de conexión a MySQL:', error.message);
  console.error('   Código de error:', error.code);
  console.error('   Stack:', error.stack);
    return false;
  }
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
  dbConfig
};

