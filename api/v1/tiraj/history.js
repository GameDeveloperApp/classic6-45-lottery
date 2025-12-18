// api/v1/tiraj/history.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // В реальном проекте здесь запрос к базе данных
    const history = [
      {
        id: 1,
        winningNumbers: [7, 14, 21, 28, 35, 42],
        jackpot: 50000,
        drawTime: '2024-12-15T14:30:00Z'
      }
    ];

    return res.status(200).json({ history });
  } catch (error) {
    console.error('Error getting tiraj history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
