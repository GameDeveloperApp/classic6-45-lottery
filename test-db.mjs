// server.js
import { createServer } from 'http';
import { parse } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const handlers = {
  '/api/v1/test': require('./api/v1/test.js'),
  '/api/v1/health': require('./api/v1/health.js'),
  '/api/v1/jackpot': require('./api/v1/jackpot.js'),
  '/api/v1/tiraj/current': require('./api/v1/tiraj/current.js'),
  '/api/v1/tiraj/finish': require('./api/v1/tiraj/finish.js'),
  '/api/v1/tickets/buy': require('./api/v1/tickets/buy.js')
};

const server = createServer(async (req, res) => {
  const parsedUrl = parse(req.url, true);
  const path = parsedUrl.pathname;
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const handler = handlers[path];
  
  if (handler) {
    try {
      // Подготавливаем request объект
      const body = await new Promise((resolve) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data ? JSON.parse(data) : {}));
      });
      
      const request = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: body
      };
      
      // Подготавливаем response объект
      const response = {
        status: (code) => {
          res.statusCode = code;
          return response;
        },
        json: (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return response;
        }
      };
      
      await handler(request, response);
      
    } catch (error) {
      console.error('❌ Ошибка обработки:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log('📌 Доступные эндпоинты:');
  Object.keys(handlers).forEach(endpoint => {
    console.log(`  ${endpoint}`);
  });
});