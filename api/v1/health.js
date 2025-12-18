const { query } = require('../lib/db');

module.exports = async (req, res) => {
  try {
    // РџСЂРѕРІРµСЂСЏРµРј РїРѕРґРєР»СЋС‡РµРЅРёРµ
    await query('SELECT 1');
    
    res.json({
      status: 'healthy',
      service: 'Classic 6/45 Lottery API',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });

  } catch (error) {
    console.error('вќЊ Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
