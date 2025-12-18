// api/v1/tiraj/current.js - Обновленная версия
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // В реальном проекте здесь запрос к базе данных
    const now = new Date();
    const nextDrawTime = new Date(now.getTime() + 9 * 60000 + 59 * 1000); // 9:59 минут

    const currentTiraj = {
      id: 1,
      status: 'waiting',
      nextDrawTime: nextDrawTime.toISOString(),
      drawDuration: 120,
      jackpot: 50000,
      ticketPrice: 100
    };

    return res.status(200).json(currentTiraj);
  } catch (error) {
    console.error('Error getting current tiraj:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
