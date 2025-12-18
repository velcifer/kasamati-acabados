const https = require('https');
https.get('https://kasamati.vercel.app/api/health', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('HEADERS', JSON.stringify(res.headers));
    console.log('BODY', d);
  });
}).on('error', e => console.error('ERR', e.message));
