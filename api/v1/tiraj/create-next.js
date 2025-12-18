// api/v1/tiraj/create-next.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { previousTirajId, jackpot } = req.body;

    if (!previousTirajId || !jackpot) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newTirajId = parseInt(previousTirajId) + 1;
    const now = new Date();
    const nextDrawTime = new Date(now.getTime() + 10 * 60000); // 10 минут

    const newTiraj = {
      id: newTirajId,
      status: 'waiting',
      nextDrawTime: nextDrawTime.toISOString(),
      drawDuration: 120, // 2 минуты в секундах
      jackpot: jackpot,
      ticketPrice: 100,
      created_at: new Date().toISOString()
    };

    // В реальном проекте здесь сохранение в базу данных
    console.log('Создан новый тираж:', newTiraj);

    return res.status(200).json(newTiraj);
  } catch (error) {
    console.error('Error creating next tiraj:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
