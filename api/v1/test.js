const { query, testConnection } = require('../lib/db');

module.exports = async (req, res) => {
  try {
    // Проверка подключения
    const dbConnected = await testConnection();

    // Получаем статистику
    const [tirajStats, ticketsStats, jackpotStats] = await Promise.all([
      query('SELECT COUNT(*) as count, MIN(created_at) as first, MAX(created_at) as last FROM tiraj'),
      query('SELECT COUNT(*) as count FROM tickets'),
      query('SELECT amount, last_updated FROM jackpot ORDER BY id DESC LIMIT 1')
    ]);

    res.json({
      success: true,
      message: 'Lottery API работает!',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        tables: {
          tiraj: parseInt(tirajStats.rows[0].count),
          tickets: parseInt(ticketsStats.rows[0].count),
          jackpot: parseFloat(jackpotStats.rows[0]?.amount || 0)
        }
      },
      endpoints: {
        'GET /api/v1/test': 'Тестовый эндпоинт',
        'GET /api/v1/health': 'Проверка здоровья',
        'GET /api/v1/tiraj/current': 'Текущий тираж',
        'GET /api/v1/jackpot': 'Текущий джекпот',
        'POST /api/v1/tickets/buy': 'Купить билет',
        'POST /api/v1/tiraj/finish': 'Завершить тираж'
      }
    });

  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};


