// test-db.js
const db = require('./api/lib/db');

async function test() {
  console.log('🔍 Тестируем подключение к БД...');
  
  const connected = await db.testConnection();
  if (!connected) {
    console.error('❌ Нет подключения к БД');
    return;
  }
  
  console.log('✅ Подключение к БД установлено');
  
  // Инициализируем базу
  await db.initDatabase();
  
  // Проверим тиражи
  const tirajResult = await db.query('SELECT * FROM tiraj ORDER BY id DESC LIMIT 1');
  console.log('🎰 Текущий тираж:', tirajResult.rows[0]);
  
  // Проверим джекпот
  const jackpotResult = await db.query('SELECT * FROM jackpot ORDER BY id DESC LIMIT 1');
  console.log('💰 Джекпот:', jackpotResult.rows[0]);
}

test().catch(console.error);