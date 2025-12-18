// api/v1/jackpot/update.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount } = req.body;

    if (!amount && amount !== 0) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // В реальном проекте здесь обновление в базе данных
    console.log('Джекпот обновлен:', amount);

    return res.status(200).json({ 
      success: true, 
      amount: amount,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating jackpot:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
