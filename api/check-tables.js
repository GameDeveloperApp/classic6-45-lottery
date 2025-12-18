const { query } = require('./api/lib/db');

async function checkTables() {
  console.log('🔍 Проверяем структуру базы данных...\n');
  
  try {
    // 1. Проверяем таблицы
    const tables = await query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Таблицы в базе:');
    tables.rows.forEach(table => {
      console.log(`  📁 ${table.table_name} (${table.columns_count} колонок)`);
    });
    
    console.log('\n📊 Данные в таблицах:');
    
    // 2. Проверяем данные в tiraj
    const tirajData = await query('SELECT id, status, next_draw_time, jackpot FROM tiraj ORDER BY id');
    console.log('\n🎰 Тиражей:', tirajData.rows.length);
    tirajData.rows.forEach(row => {
      console.log(`  №${row.id}: ${row.status}, следующий: ${new Date(row.next_draw_time).toLocaleString()}, джекпот: ${row.jackpot}`);
    });
    
    // 3. Проверяем джекпот
    const jackpotData = await query('SELECT amount, last_updated FROM jackpot ORDER BY id DESC LIMIT 1');
    console.log('\n💰 Текущий джекпот:', jackpotData.rows[0]?.amount || 'нет данных');
    
    // 4. Проверяем билеты
    const ticketsData = await query('SELECT COUNT(*) as count FROM tickets');
    console.log('🎫 Всего билетов:', ticketsData.rows[0].count);
    
    console.log('\n✅ База данных готова к работе!');
    
  } catch (error) {
    console.error('❌ Ошибка проверки:', error.message);
  }
}

checkTables();
