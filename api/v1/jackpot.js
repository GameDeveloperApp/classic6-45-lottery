const { query } = require('../lib/db');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      // РџРѕР»СѓС‡РµРЅРёРµ С‚РµРєСѓС‰РµРіРѕ РґР¶РµРєРїРѕС‚Р°
      const result = await query(
        'SELECT amount, last_updated FROM jackpot ORDER BY id DESC LIMIT 1'
      );

      if (result.rows.length > 0) {
        res.json({
          success: true,
          data: result.rows[0]
        });
      } else {
        // РЎРѕР·РґР°РµРј РЅР°С‡Р°Р»СЊРЅС‹Р№ РґР¶РµРєРїРѕС‚ РµСЃР»Рё РµРіРѕ РЅРµС‚
        const newResult = await query(
          'INSERT INTO jackpot (amount) VALUES (50000) RETURNING amount, last_updated'
        );
        
        res.json({
          success: true,
          data: newResult.rows[0]
        });
      }

    } else if (req.method === 'POST') {
      // РћР±РЅРѕРІР»РµРЅРёРµ РґР¶РµРєРїРѕС‚Р° (РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РїСЂРё РїРѕРєСѓРїРєРµ Р±РёР»РµС‚Р°)
      const { amount } = req.body;
      
      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({
          success: false,
          error: 'РќРµРІРµСЂРЅР°СЏ СЃСѓРјРјР° РґР¶РµРєРїРѕС‚Р°'
        });
      }

      const result = await query(
        'INSERT INTO jackpot (amount) VALUES ($1) RETURNING amount, last_updated',
        [parseFloat(amount)]
      );

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Р”Р¶РµРєРїРѕС‚ РѕР±РЅРѕРІР»РµРЅ'
      });

    } else {
      res.status(405).json({
        success: false,
        error: 'РњРµС‚РѕРґ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ'
      });
    }

  } catch (error) {
    console.error('вќЊ РћС€РёР±РєР° СЂР°Р±РѕС‚С‹ СЃ РґР¶РµРєРїРѕС‚РѕРј:', error);
    res.status(500).json({
      success: false,
      error: 'Р’РЅСѓС‚СЂРµРЅРЅСЏСЏ РѕС€РёР±РєР° СЃРµСЂРІРµСЂР°',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

