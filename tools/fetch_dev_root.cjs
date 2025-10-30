const http = require('http');

const url = 'http://localhost:8082/';

http.get(url, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('---BODY START---');
    console.log(data.slice(0, 1200));
    console.log('---BODY END---');
  });
}).on('error', (err) => {
  console.error('Request error:', err.message);
  process.exit(1);
});
