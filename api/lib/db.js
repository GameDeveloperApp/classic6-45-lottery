const { Pool } = require('pg');

// Ваш Render PostgreSQL URL
const RENDER_DB_URL = 'postgresql://lottery_db_nd60_user:Z2TibJndEXSQ8HbKqmDFicXjrGMu5VWc@dpg-d524urvgi27c73b81h10-a.frankfurt-postgres.render.com/lottery_db_nd60';

let pool = null;

function getPool() {
  if (!pool) {
    // Используем переменную окружения или фиксированный URL
    const connectionString = process.env.DATABASE_URL || RENDER_DB_URL;
    
    console.log('🔗 Подключаемся к PostgreSQL...');
    console.log('📡 Host:', connectionString.split('@')[1]?.split('/')[0] || 'unknown');
    
    pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false,
        require: true
      },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('connect', () => {
      console.log('✅ Подключение к PostgreSQL установлено');
    });

    pool.on('error', (err) => {
      console.error('❌ Ошибка PostgreSQL:', err.message);
    });
  }
  
  return pool;
}

module.exports = {
  query: async (text, params) => {
    const poolInstance = getPool();
    try {
      return await poolInstance.query(text, params);
    } catch (error) {
      console.error('❌ Ошибка запроса:', error.message);
      console.error('📝 Запрос:', text.substring(0, 200));
      throw error;
    }
  },

  testConnection: async () => {
    try {
      const poolInstance = getPool();
      const result = await poolInstance.query('SELECT NOW() as time');
      console.log('✅ PostgreSQL подключен. Время сервера:', result.rows[0].time);
      return true;
    } catch (error) {
      console.error('❌ Ошибка подключения:', error.message);
      return false;
    }
  },

  initDatabase: async () => {
    try {
      const poolInstance = getPool();
      
      // Создаем таблицы
      await poolInstance.query(`
        CREATE TABLE IF NOT EXISTS tiraj (
          id SERIAL PRIMARY KEY,
          status VARCHAR(20) DEFAULT 'waiting',
          next_draw_time TIMESTAMP WITH TIME ZONE NOT NULL,
          draw_duration INTEGER DEFAULT 120,
          jackpot DECIMAL(15,2) DEFAULT 50000,
          ticket_price DECIMAL(10,2) DEFAULT 100,
          winning_numbers INTEGER[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await poolInstance.query(`
        CREATE TABLE IF NOT EXISTS tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tiraj_id INTEGER REFERENCES tiraj(id) ON DELETE CASCADE,
          telegram_user_id BIGINT,
          numbers INTEGER[] NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          win_amount DECIMAL(15,2) DEFAULT 0,
          matched_numbers INTEGER[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await poolInstance.query(`
        CREATE TABLE IF NOT EXISTS jackpot (
          id SERIAL PRIMARY KEY,
          amount DECIMAL(15,2) DEFAULT 50000,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Начальные данные
      await poolInstance.query(`
        INSERT INTO jackpot (amount) 
        SELECT 50000 
        WHERE NOT EXISTS (SELECT 1 FROM jackpot)
      `);

      await poolInstance.query(`
        INSERT INTO tiraj (status, next_draw_time, jackpot, ticket_price) 
        SELECT 'waiting', NOW() + INTERVAL '10 minutes', 50000, 100
        WHERE NOT EXISTS (SELECT 1 FROM tiraj WHERE status IN ('waiting', 'drawing'))
      `);

      console.log('✅ База данных инициализирована');
      return true;
    } catch (error) {
      console.error('❌ Ошибка инициализации:', error.message);
      return false;
    }
  }
};
