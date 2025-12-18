// Минимальный рабочий API
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    return res.json({
      success: true,
      message: '🎰 Lottery API работает!',
      mongoUri: process.env.MONGODB_URI ? 'Настроен' : 'Отсутствует',
      timestamp: new Date().toISOString(),
      endpoints: [
        'GET / - эта страница',
        'POST /buy-ticket - купить билет',
        'GET /user-tickets/:userId - билеты пользователя'
      ]
    });
  }
  
  return res.status(404).json({ error: 'Not found' });
}
