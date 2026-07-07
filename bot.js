// Запусти этот код и напиши боту /test
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot('8792137358:AAHMO9wKGVKvXgYsqOz5cSN43xdSpUzrknk', { polling: true });

bot.onText(/\/test/, (msg) => {
    bot.sendMessage(msg.chat.id, 
        '🔍 <b>Проверка Telegram Stars</b>\n\n' +
        '1️⃣ Открой НАСТРОЙКИ Telegram\n' +
        '2️⃣ Найди пункт "Telegram Stars"\n' +
        '3️⃣ Если его нет — Stars НЕ ДОСТУПНЫ\n' +
        '4️⃣ Если есть — напиши /start',
        { parse_mode: 'HTML' }
    );
});

console.log('✅ Напиши боту /test');
