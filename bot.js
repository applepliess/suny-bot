const TelegramBot = require('node-telegram-bot-api');

// ТВОЙ ТОКЕН
const TOKEN = '8792137358:AAHMO9wKGVKvXgYsqOz5cSN43xdSpUzrknk';

const bot = new TelegramBot(TOKEN, { polling: true });

console.log('🧪 Тестовый бот запущен!');

// Команда /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, 
        '🧪 <b>Тест оплаты звездами</b>\n\n' +
        'Нажми на кнопку ниже чтобы создать счет на 1 звезду',
        {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💎 Купить за 1 ⭐', callback_data: 'buy' }]
                ]
            }
        }
    );
});

// Обработка кнопки
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    
    if (query.data === 'buy') {
        try {
            console.log('📦 Создаем счет...');
            
            // ⭐ САМЫЙ ПРОСТОЙ СПОСОБ
            await bot.sendInvoice(
                chatId,                          // chat_id
                '🧪 Test Kit',                   // title
                'Тестовый набор за 1 звезду',    // description
                'test_payload_' + Date.now(),    // payload
                undefined,                       // ⭐ НЕТ provider_token!
                'XTR',                           // ⭐ XTR = Stars
                [{ label: 'Test Kit', amount: 1 }], // price = 1
                {
                    start_parameter: 'test_' + Date.now()
                }
            );
            
            console.log('✅ Счет отправлен!');
            
        } catch (error) {
            console.error('❌ ОШИБКА:', error.message);
            bot.sendMessage(chatId, '❌ Ошибка: ' + error.message);
        }
        
        await bot.answerCallbackQuery(query.id);
    }
});

// PreCheckout
bot.on('pre_checkout_query', async (query) => {
    try {
        await bot.answerPreCheckoutQuery(query.id, true, '✅ OK');
        console.log('✅ PreCheckout OK');
    } catch (error) {
        console.error('❌ PreCheckout error:', error.message);
    }
});

// Успешная оплата
bot.on('successful_payment', (msg) => {
    console.log('💎 УСПЕШНАЯ ОПЛАТА!');
    console.log('   Игрок:', msg.from.username);
    console.log('   Сумма:', msg.successful_payment.total_amount, '⭐');
    
    bot.sendMessage(msg.chat.id, '✅ Оплата прошла успешно! 🎉');
});

console.log('✅ Готово! Напиши /start');
