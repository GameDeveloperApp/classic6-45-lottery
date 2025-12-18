const { query } = require('../../lib/db');

// Р“РµРЅРµСЂР°С†РёСЏ РІС‹РёРіСЂС‹С€РЅС‹С… С‡РёСЃРµР»
function generateWinningNumbers() {
  const numbers = [];
  while (numbers.length < 6) {
    const num = Math.floor(Math.random() * 45) + 1;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers.sort((a, b) => a - b);
}

// Р Р°СЃС‡РµС‚ РІС‹РёРіСЂС‹С€Р°
function calculateWinAmount(matchedCount, jackpot) {
  const prizes = {
    3: 100,
    4: 1000,
    5: 50000,
    6: jackpot // РІРµСЃСЊ РґР¶РµРєРїРѕС‚
  };
  return prizes[matchedCount] || 0;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'РњРµС‚РѕРґ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ' });
    }

    const { tirajId, winningNumbers: providedNumbers } = req.body;

    if (!tirajId) {
      return res.status(400).json({
        success: false,
        error: 'РќРµ СѓРєР°Р·Р°РЅ ID С‚РёСЂР°Р¶Р°'
      });
    }

    // РџСЂРѕРІРµСЂСЏРµРј СЃСѓС‰РµСЃС‚РІРѕРІР°РЅРёРµ С‚РёСЂР°Р¶Р°
    const tirajCheck = await query(
      'SELECT id, status, jackpot FROM tiraj WHERE id = $1',
      [tirajId]
    );

    if (tirajCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'РўРёСЂР°Р¶ РЅРµ РЅР°Р№РґРµРЅ'
      });
    }

    const tiraj = tirajCheck.rows[0];
    
    if (tiraj.status === 'finished') {
      return res.status(400).json({
        success: false,
        error: 'РўРёСЂР°Р¶ СѓР¶Рµ Р·Р°РІРµСЂС€РµРЅ'
      });
    }

    // РСЃРїРѕР»СЊР·СѓРµРј РїСЂРµРґРѕСЃС‚Р°РІР»РµРЅРЅС‹Рµ С‡РёСЃР»Р° РёР»Рё РіРµРЅРµСЂРёСЂСѓРµРј РЅРѕРІС‹Рµ
    const winningNumbers = providedNumbers && Array.isArray(providedNumbers) 
      ? providedNumbers.sort((a, b) => a - b)
      : generateWinningNumbers();

    // РћР±РЅРѕРІР»СЏРµРј С‚РёСЂР°Р¶
    await query(
      `UPDATE tiraj 
       SET status = 'finished', 
           winning_numbers = $1 
       WHERE id = $2`,
      [winningNumbers, tirajId]
    );

    // РќР°С…РѕРґРёРј РІСЃРµ Р±РёР»РµС‚С‹ СЌС‚РѕРіРѕ С‚РёСЂР°Р¶Р°
    const tickets = await query(
      'SELECT id, numbers, telegram_user_id FROM tickets WHERE tiraj_id = $1 AND status = $2',
      [tirajId, 'pending']
    );

    let jackpotWon = false;
    const results = [];

    // РџСЂРѕРІРµСЂСЏРµРј РєР°Р¶РґС‹Р№ Р±РёР»РµС‚
    for (const ticket of tickets.rows) {
      const matchedNumbers = ticket.numbers.filter(num => winningNumbers.includes(num));
      const matchedCount = matchedNumbers.length;
      
      let status = 'lose';
      let winAmount = 0;

      if (matchedCount >= 3) {
        status = 'win';
        winAmount = calculateWinAmount(matchedCount, parseFloat(tiraj.jackpot));
        
        if (matchedCount === 6) {
          jackpotWon = true;
        }
      }

      // РћР±РЅРѕРІР»СЏРµРј Р±РёР»РµС‚
      await query(
        `UPDATE tickets 
         SET status = $1, 
             win_amount = $2, 
             matched_numbers = $3 
         WHERE id = $4`,
        [status, winAmount, matchedNumbers, ticket.id]
      );

      results.push({
        ticketId: ticket.id,
        userId: ticket.telegram_user_id,
        matchedCount,
        winAmount,
        status
      });
    }

    // РћР±РЅРѕРІР»СЏРµРј РґР¶РµРєРїРѕС‚ РµСЃР»Рё РµРіРѕ РІС‹РёРіСЂР°Р»Рё
    if (jackpotWon) {
      // РЎР±СЂР°СЃС‹РІР°РµРј РґР¶РµРєРїРѕС‚ Рє РЅР°С‡Р°Р»СЊРЅРѕРјСѓ Р·РЅР°С‡РµРЅРёСЋ
      await query(
        'INSERT INTO jackpot (amount) VALUES (50000)'
      );
    } else {
      // РЈРІРµР»РёС‡РёРІР°РµРј РґР¶РµРєРїРѕС‚ РЅР° 50% РѕС‚ СЃС‚РѕРёРјРѕСЃС‚Рё РІСЃРµС… Р±РёР»РµС‚РѕРІ
      const ticketPrice = 100; // РЎС‚РѕРёРјРѕСЃС‚СЊ Р±РёР»РµС‚Р°
      const increment = tickets.rows.length * ticketPrice * 0.5;
      
      const currentJackpot = await query(
        'SELECT amount FROM jackpot ORDER BY id DESC LIMIT 1'
      );
      
      const newAmount = parseFloat(currentJackpot.rows[0].amount) + increment;
      
      await query(
        'INSERT INTO jackpot (amount) VALUES ($1)',
        [newAmount]
      );
    }

    // РЎРѕР·РґР°РµРј СЃР»РµРґСѓСЋС‰РёР№ С‚РёСЂР°Р¶
    const jackpotResult = await query(
      'SELECT amount FROM jackpot ORDER BY id DESC LIMIT 1'
    );
    
    const nextDrawTime = new Date(Date.now() + 10 * 60000); // +10 РјРёРЅСѓС‚
    
    const nextTiraj = await query(`
      INSERT INTO tiraj 
      (status, next_draw_time, jackpot, ticket_price) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id
    `, ['waiting', nextDrawTime, jackpotResult.rows[0].amount, 100]);

    res.json({
      success: true,
      data: {
        tirajId,
        winningNumbers,
        ticketsChecked: tickets.rows.length,
        winners: results.filter(r => r.status === 'win').length,
        jackpotWon,
        nextTirajId: nextTiraj.rows[0].id,
        nextDrawTime
      },
      results
    });

  } catch (error) {
    console.error('вќЊ РћС€РёР±РєР° Р·Р°РІРµСЂС€РµРЅРёСЏ С‚РёСЂР°Р¶Р°:', error);
    res.status(500).json({
      success: false,
      error: 'Р’РЅСѓС‚СЂРµРЅРЅСЏСЏ РѕС€РёР±РєР° СЃРµСЂРІРµСЂР°'
    });
  }
};

