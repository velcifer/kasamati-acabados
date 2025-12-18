const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'ballast.proxy.rlwy.net',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 53369,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'SXQEOCvtQDZRPaMYQCueobuZAUsBIhxL',
      database: process.env.DB_NAME || 'railway',
      connectTimeout: 30000,
      // Si el servidor requiere SSL, descomenta la siguiente línea
      // ssl: { rejectUnauthorized: false }
    });

    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log('✅ Conexión OK — MySQL version:', rows[0].version);
    await connection.end();
  } catch (err) {
    console.error('❌ Error conectando desde test-db.js:');
    console.error(err);
    process.exit(1);
  }
})();
