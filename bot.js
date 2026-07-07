const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot('8792137358:AAHMO9wKGVKvXgYsqOz5cSN43xdSpUzrknk', { 
    polling: true 
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, '💎 Нажми кнопку', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Купить за 1 ⭐', callback_data: 'buy' }]
            ]
        }
    });
});

bot.on('callback_query', async (query) => {
    if (query.data === 'buy') {
        try {
            await bot.sendInvoice(
                query.message.chat.id,
                'Test Kit',
                'Тестовый набор',
                JSON.stringify({ test: true }),
                undefined,
                'XTR',
                [{ label: 'Test', amount: 1 }],
                { start_parameter: 'test' }
            );
        } catch (e) {
            console.log('❌ Ошибка:', e.message);
            bot.sendMessage(query.message.chat.id, '❌ ' + e.message);
        }
        bot.answerCallbackQuery(query.id);
    }
});

bot.on('pre_checkout_query', (query) => {
    bot.answerPreCheckoutQuery(query.id, true);
});

bot.on('successful_payment', (msg) => {
    bot.sendMessage(msg.chat.id, '✅ Оплачено!');
});

console.log('✅ Бот запущен!');
