// 🗄️ CONFIGURACIÓN DE BASE DE DATOS MYSQL
const mysql = require('mysql2/promise');

// 📊 CONFIGURACIÓN DE CONEXIÓN
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ksamti_proyectos',
  port: process.env.DB_PORT || 3306,
  
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
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [rows] = await connection.execute(query, params || []);
      results.push(rows);
    }
    
    await connection.commit();
    return { results, success: true };
  } catch (error) {
    await connection.rollback();
    throw new Error(`Transaction failed: ${error.message}`);
  } finally {
    connection.release();
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
    
    const [totalProyectos] = await executeQuery(queries[0]);
    const [totalCategorias] = await executeQuery(queries[1]); 
    const [estadisticasEstado] = await executeQuery(queries[2]);
    
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

