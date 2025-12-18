const { query } = require('../../lib/db');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'РњРµС‚РѕРґ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ' });
    }

    const { telegramUserId, numbers, tirajId } = req.body;

    // Р’Р°Р»РёРґР°С†РёСЏ РІС…РѕРґРЅС‹С… РґР°РЅРЅС‹С…
    if (!telegramUserId || !numbers || !Array.isArray(numbers)) {
      return res.status(400).json({
        success: false,
        error: 'РќРµРІРµСЂРЅС‹Рµ РґР°РЅРЅС‹Рµ Р·Р°РїСЂРѕСЃР°'
      });
    }

    if (numbers.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'РќСѓР¶РЅРѕ РІС‹Р±СЂР°С‚СЊ СЂРѕРІРЅРѕ 6 С‡РёСЃРµР»'
      });
    }

    // РџСЂРѕРІРµСЂСЏРµРј С‡С‚Рѕ РІСЃРµ С‡РёСЃР»Р° РІ РґРёР°РїР°Р·РѕРЅРµ 1-45
    const invalidNumbers = numbers.filter(n => n < 1 || n > 45 || !Number.isInteger(n));
    if (invalidNumbers.length > 0) {
      return res.status(400).json({
        success: false,
        error: `РќРµРІРµСЂРЅС‹Рµ С‡РёСЃР»Р°: ${invalidNumbers.join(', ')}. Р”РёР°РїР°Р·РѕРЅ: 1-45`
      });
    }

    // РџСЂРѕРІРµСЂСЏРµРј СѓРЅРёРєР°Р»СЊРЅРѕСЃС‚СЊ С‡РёСЃРµР»
    const uniqueNumbers = [...new Set(numbers)];
    if (uniqueNumbers.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Р§РёСЃР»Р° РґРѕР»Р¶РЅС‹ Р±С‹С‚СЊ СѓРЅРёРєР°Р»СЊРЅС‹РјРё'
      });
    }

    // РџСЂРѕРІРµСЂСЏРµРј СЃСѓС‰РµСЃС‚РІРѕРІР°РЅРёРµ С‚РёСЂР°Р¶Р°
    const tirajCheck = await query(
      'SELECT id, status, next_draw_time FROM tiraj WHERE id = $1',
      [tirajId]
    );

    if (tirajCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'РўРёСЂР°Р¶ РЅРµ РЅР°Р№РґРµРЅ'
      });
    }

    const tiraj = tirajCheck.rows[0];
    
    // РџСЂРѕРІРµСЂСЏРµРј, РЅРµ РЅР°С‡Р°Р»СЃСЏ Р»Рё СѓР¶Рµ С‚РёСЂР°Р¶
    if (tiraj.status === 'drawing') {
      return res.status(400).json({
        success: false,
        error: 'РџСЂРёРµРј СЃС‚Р°РІРѕРє Р·Р°РІРµСЂС€РµРЅ. РўРёСЂР°Р¶ СѓР¶Рµ РЅР°С‡Р°Р»СЃСЏ'
      });
    }

    // РџСЂРѕРІРµСЂСЏРµРј, РЅРµ Р·Р°РєРѕРЅС‡РёР»РѕСЃСЊ Р»Рё РІСЂРµРјСЏ РїСЂРёРµРјР° СЃС‚Р°РІРѕРє
    const now = new Date();
    const drawTime = new Date(tiraj.next_draw_time);
    if (now >= drawTime) {
      return res.status(400).json({
        success: false,
        error: 'Р’СЂРµРјСЏ РїСЂРёРµРјР° СЃС‚Р°РІРѕРє РёСЃС‚РµРєР»Рѕ'
      });
    }

    // РЎРѕСЂС‚РёСЂСѓРµРј С‡РёСЃР»Р° РґР»СЏ СѓРґРѕР±СЃС‚РІР°
    const sortedNumbers = [...numbers].sort((a, b) => a - b);

    // РЎРѕР·РґР°РµРј Р±РёР»РµС‚
    const ticketResult = await query(`
      INSERT INTO tickets 
      (tiraj_id, telegram_user_id, numbers, status) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, created_at
    `, [tirajId, telegramUserId, sortedNumbers, 'pending']);

    // РћР±РЅРѕРІР»СЏРµРј РґР¶РµРєРїРѕС‚ (+50 РѕС‚ СЃС‚РѕРёРјРѕСЃС‚Рё Р±РёР»РµС‚Р°)
    await query(`
      INSERT INTO jackpot (amount) 
      SELECT amount + 50 FROM jackpot ORDER BY id DESC LIMIT 1
    `);

    // РџРѕР»СѓС‡Р°РµРј РѕР±РЅРѕРІР»РµРЅРЅС‹Р№ РґР¶РµРєРїРѕС‚
    const jackpotResult = await query(
      'SELECT amount FROM jackpot ORDER BY id DESC LIMIT 1'
    );

    res.json({
      success: true,
      data: {
        ticketId: ticketResult.rows[0].id,
        purchaseTime: ticketResult.rows[0].created_at,
        tirajId,
        numbers: sortedNumbers,
        userId: telegramUserId,
        currentJackpot: parseFloat(jackpotResult.rows[0].amount)
      },
      message: 'Р‘РёР»РµС‚ СѓСЃРїРµС€РЅРѕ РєСѓРїР»РµРЅ'
    });

  } catch (error) {
    console.error('вќЊ РћС€РёР±РєР° РїРѕРєСѓРїРєРё Р±РёР»РµС‚Р°:', error);
    
    // РџСЂРѕРІРµСЂСЏРµРј РµСЃР»Рё СЌС‚Рѕ РѕС€РёР±РєР° СѓРЅРёРєР°Р»СЊРЅРѕСЃС‚Рё (РґСѓР±Р»РёРєР°С‚ Р±РёР»РµС‚Р°)
    if (error.code === '23505') { // PostgreSQL РєРѕРґ РѕС€РёР±РєРё unique violation
      return res.status(400).json({
        success: false,
        error: 'РўР°РєРѕР№ Р±РёР»РµС‚ СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Р’РЅСѓС‚СЂРµРЅРЅСЏСЏ РѕС€РёР±РєР° СЃРµСЂРІРµСЂР°',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

