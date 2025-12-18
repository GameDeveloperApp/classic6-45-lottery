-- Включим расширение для UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Таблица тиражей
CREATE TABLE IF NOT EXISTS tiraj (
    id SERIAL PRIMARY KEY,
    status VARCHAR(20) DEFAULT 'waiting',
    next_draw_time TIMESTAMP WITH TIME ZONE NOT NULL,
    draw_duration INTEGER DEFAULT 120,
    jackpot DECIMAL(15,2) DEFAULT 50000,
    ticket_price DECIMAL(10,2) DEFAULT 100,
    winning_numbers INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица билетов
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tiraj_id INTEGER REFERENCES tiraj(id) ON DELETE CASCADE,
    telegram_user_id BIGINT,
    numbers INTEGER[] NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    win_amount DECIMAL(15,2) DEFAULT 0,
    matched_numbers INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица джекпота
CREATE TABLE IF NOT EXISTS jackpot (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(15,2) DEFAULT 50000,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_tiraj_status ON tiraj(status);
CREATE INDEX IF NOT EXISTS idx_tiraj_next_draw ON tiraj(next_draw_time);
CREATE INDEX IF NOT EXISTS idx_tickets_tiraj ON tickets(tiraj_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- Начальные данные
INSERT INTO jackpot (amount) VALUES (50000) ON CONFLICT DO NOTHING;

INSERT INTO tiraj (status, next_draw_time, jackpot, ticket_price) 
VALUES ('waiting', NOW() + INTERVAL '10 minutes', 50000, 100)
ON CONFLICT DO NOTHING;

-- Проверяем создание
SELECT '✅ Таблицы созданы:' as message;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

