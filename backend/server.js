
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка CORS для GitHub Pages
app.use(cors({
    origin: [
        'https://gamedeveloperapp.github.io',
        'http://localhost:8000',
        'https://telegram-web-app.com'
    ]
}));

app.use(express.json());

// Создаем папку data если её нет
const DATA_PATH = path.join(__dirname, 'data');
try {
    fs.mkdirSync(DATA_PATH, { recursive: true });
} catch (err) {}

// API эндпоинты
app.post('/api/buy-ticket', async (req, res) => {
    try {
        const { userId, numbers, tirajId, telegramData } = req.body;
        
        // Загружаем тиражи
        const tirajData = await loadJSON('tiraj.json');
        
        // Создаем новый тираж если нужно
        if (!tirajData.currentTiraj || tirajData.currentTiraj.id !== tirajId) {
            tirajData.currentTiraj = {
                id: tirajId,
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // +10 минут
                status: 'active',
                tickets: []
            };
        }
        
        // Создаем билет
        const ticketId = `T${Date.now().toString().slice(-9)}`;
        const formattedId = formatTicketId(ticketId);
        
        const ticket = {
            id: ticketId,
            userId,
            tirajId,
            numbers: numbers.sort((a, b) => a - b),
            purchaseTime: new Date().toISOString(),
            status: 'pending',
            formattedId,
            formattedTirajId: tirajId.toString().padStart(3, '0')
        };
        
        // Сохраняем в тираж
        tirajData.currentTiraj.tickets.push(ticketId);
        
        // Сохраняем в общую базу билетов
        const ticketsData = await loadJSON('tickets.json');
        ticketsData.tickets.push(ticket);
        ticketsData.lastId = ticketId;
        
        // Сохраняем пользователя
        const usersData = await loadJSON('users.json');
        let user = usersData.users.find(u => u.id === userId);
        if (!user) {
            user = {
                id: userId,
                telegramData,
                tickets: [ticketId],
                created: new Date().toISOString()
            };
            usersData.users.push(user);
        } else {
            user.tickets.push(ticketId);
        }
        
        // Сохраняем всё
        await saveJSON('tiraj.json', tirajData);
        await saveJSON('tickets.json', ticketsData);
        await saveJSON('users.json', usersData);
        
        res.json({
            success: true,
            ticket
        });
        
    } catch (error) {
        console.error('Error buying ticket:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/user-tickets/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const ticketsData = await loadJSON('tickets.json');
        
        const userTickets = ticketsData.tickets
            .filter(t => t.userId === userId)
            .sort((a, b) => new Date(b.purchaseTime) - new Date(a.purchaseTime));
        
        res.json(userTickets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🎰 Lottery backend running on port ${PORT}`);
});
