/*
  database.js - helper limpio para KSAMATI
  - usa mysql2/promise
  - reutiliza pool en entornos serverless
  - exige vars en producción
*/

const mysql = require('mysql2/promise');

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  NODE_ENV,
} = process.env;

const isProduction = NODE_ENV === 'production';

function requireEnv(name, value) {
  if (isProduction && (!value || value === '')) {
    throw new Error(`Missing required env var ${name} in production`);
  }
}

requireEnv('DB_HOST', DB_HOST);
requireEnv('DB_PORT', DB_PORT);
requireEnv('DB_USER', DB_USER);
requireEnv('DB_PASSWORD', DB_PASSWORD);
requireEnv('DB_NAME', DB_NAME);

const poolConfig = {
  host: DB_HOST || '127.0.0.1',
  port: DB_PORT ? parseInt(DB_PORT, 10) : 3306,
  user: DB_USER || 'root',
  password: DB_PASSWORD || '',
  database: DB_NAME || 'ksamati',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
};

if (!global.__KSAMATI_DB_POOL) {
  global.__KSAMATI_DB_POOL = mysql.createPool(poolConfig);
}

const pool = global.__KSAMATI_DB_POOL;

async function executeQuery(sql, params = []) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(sql, params);
    return rows;
  } finally {
    conn.release();
  }
}

async function executeTransaction(callback) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch (e) {
      // ignore
    }
    throw err;
  } finally {
    conn.release();
  }
}

async function testConnection() {
  const info = {
    env: {
      host: !!DB_HOST,
      port: !!DB_PORT,
      user: !!DB_USER,
      database: !!DB_NAME,
    },
    connection: false,
    version: null,
    databaseStats: null,
  };

  try {
    const conn = await pool.getConnection();
    try {
      const [res] = await conn.query('SELECT VERSION() as version');
      info.connection = true;
      info.version = res && res[0] && res[0].version ? res[0].version : null;

      const [tables] = await conn.query("SHOW TABLES");
      info.databaseStats = { tables: Array.isArray(tables) ? tables.length : 0 };
    } finally {
      conn.release();
    }
  } catch (err) {
    info.error = err.message;
  }

  return info;
}

module.exports = {
  pool,
  executeQuery,
  executeTransaction,
  testConnection,
};
