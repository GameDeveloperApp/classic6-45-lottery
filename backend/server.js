const express = require('express');
const cors = require('cors');
const { testConnection } = require('../api/lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Статический фронтенд
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/../index.html');
});

// Проксирование API запросов
app.use('/api', require('../api/index.js'));

// Проверка здоровья
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      api: 'running'
    }
  });
});

// Запуск сервера
app.listen(PORT, async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Откройте в браузере: http://localhost:${PORT}`);
  
  const connected = await testConnection();
  console.log(connected ? '✅ База данных подключена' : '❌ Ошибка подключения к БД');
  
  if (!connected && process.env.DATABASE_URL) {
    console.log('ℹ️  DATABASE_URL установлен:', process.env.DATABASE_URL.substring(0, 50) + '...');
  } else if (!connected) {
    console.log('⚠️  DATABASE_URL не установлен. Установите переменную окружения.');
  }
});
