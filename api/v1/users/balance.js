// api/v1/users/balance.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    // В реальном проекте здесь проверка токена и получение баланса из БД
    const balance = 1000; // Пример баланса

    return res.status(200).json({ 
      balance: balance,
      currency: 'Telegram Stars'
    });
  } catch (error) {
    console.error('Error getting user balance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
