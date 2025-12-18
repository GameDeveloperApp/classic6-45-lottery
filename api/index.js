
# Проверьте содержимое api/index.js
cat api/index.js

# Если нужно, обновите его:
cat > api/index.js << 'EOF'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const handlers = {
  'v1/test': require('./v1/test.js'),
  'v1/health': require('./v1/health.js'),
  'v1/jackpot': require('./v1/jackpot.js'),
  'v1/jackpot/update': require('./v1/jackpot/update.js'),
  'v1/users/balance': require('./v1/users/balance.js'),
  'v1/tiraj/current': require('./v1/tiraj/current.js'),
  'v1/tiraj/finish': require('./v1/tiraj/finish.js'),
  'v1/tiraj/create-next': require('./v1/tiraj/create-next.js'),
  'v1/tiraj/history': require('./v1/tiraj/history.js'),
  'v1/tiraj/start': require('./v1/tiraj/start.js'),
  'v1/tickets/buy': require('./v1/tickets/buy.js')
};

export default async function handler(req, res) {
  // Извлекаем путь из URL
  const path = req.url.replace('/api/', '').replace(/\/$/, '');
  
  console.log(`📨 Запрос: ${req.method} ${req.url} -> ${path}`);
  
  // Находим соответствующий обработчик
  const routeHandler = handlers[path];
  
  if (routeHandler) {
    try {
      // Для ES модулей вызываем default, для CommonJS - сам модуль
      if (typeof routeHandler === 'object' && routeHandler.default) {
        return await routeHandler.default(req, res);
      } else if (typeof routeHandler === 'function') {
        return await routeHandler(req, res);
      } else {
        throw new Error('Invalid handler');
      }
    } catch (error) {
      console.error(`❌ Ошибка в обработчике ${path}:`, error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } else {
    console.log(`❌ Эндпоинт не найден: ${path}`);
    console.log('Доступные эндпоинты:', Object.keys(handlers));
    res.status(404).json({ error: 'Endpoint not found' });
  }
}
EOF
