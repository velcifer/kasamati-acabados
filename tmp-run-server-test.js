// Temp helper to start the app and call /api/db-test
const app = require('./server/index');
const http = require('http');

const PORT = 5001;

const server = app.listen(PORT, async () => {
  console.log('Test server listening on', PORT);

  try {
    const res = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${PORT}/api/db-test`, (r) => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => resolve({ status: r.statusCode, body: d }));
      }).on('error', reject);
    });

    console.log('STATUS', res.status);
    console.log(res.body);
  } catch (e) {
    console.error('ERR', e && e.message);
  } finally {
    server.close();
  }
});
