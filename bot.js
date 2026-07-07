const TelegramBot = require('node-telegram-bot-api');

// ТВОЙ ТОКЕН
const token = '8792137358:AAHMO9wKGVKvXgYsqOz5cSN43xdSpUzrknk';

// Создаем бота
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Бот запущен!');

// ========== КОМАНДА /START ==========
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, 
        '💎 <b>Добро пожаловать в магазин!</b>\n\n' +
        'Выбери набор для покупки:',
        {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🧪 Test Kit (1 ⭐)', callback_data: 'buy_test' }],
                    [{ text: '⚔️ PvP Kit (20 ⭐)', callback_data: 'buy_pvp' }],
                    [{ text: '🔥 PvP+ Kit (35 ⭐)', callback_data: 'buy_pvp_plus' }],
                    [{ text: '💀 PvP++ Kit (50 ⭐)', callback_data: 'buy_pvp_plusplus' }]
                ]
            }
        }
    );
});

// ========== ОБРАБОТКА КНОПОК ==========
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    
    if (data.startsWith('buy_')) {
        const kit = data.replace('buy_', '');
        
        // Цены и названия
        const kits = {
            test: { name: '🧪 Test Kit', price: 1 },
            pvp: { name: '⚔️ PvP Kit', price: 20 },
            pvp_plus: { name: '🔥 PvP+ Kit', price: 35 },
            pvp_plusplus: { name: '💀 PvP++ Kit', price: 50 }
        };
        
        const selectedKit = kits[kit];
        if (!selectedKit) return;
        
        try {
            console.log(`📦 Создаем счет для ${selectedKit.name} (${selectedKit.price} ⭐)`);
            
            // ⚠️ ВАЖНО: используем ТОЛЬКО эти параметры
            const invoice = {
                chat_id: chatId,
                title: selectedKit.name,
                description: `Покупка ${selectedKit.name} за звезды`,
                payload: JSON.stringify({
                    kit: kit,
                    user_id: userId,
                    time: Date.now()
                }),
                currency: 'XTR',
                prices: [
                    { label: selectedKit.name, amount: selectedKit.price }
                ],
                start_parameter: `buy_${kit}_${Date.now()}`
            };
            
            // Отправляем счет (БЕЗ provider_token!)
            await bot.sendInvoice(
                invoice.chat_id,
                invoice.title,
                invoice.description,
                invoice.payload,
                undefined, // ⭐ НЕТ provider_token!
                invoice.currency,
                invoice.prices,
                {
                    start_parameter: invoice.start_parameter
                }
            );
            
            console.log(`✅ Счет отправлен!`);
            
        } catch (error) {
            console.error('❌ ОШИБКА:', error.message);
            await bot.sendMessage(chatId, 
                `❌ Ошибка: ${error.message}\n\n` +
                `Проверь:\n` +
                `1. Версию Telegram (нужна 10.0+)\n` +
                `2. Доступность Stars в регионе\n` +
                `3. Используй мобильный Telegram`
            );
        }
        
        await bot.answerCallbackQuery(query.id);
    }
});

// ========== ПОДТВЕРЖДЕНИЕ ПЛАТЕЖА ==========
bot.on('pre_checkout_query', async (query) => {
    try {
        console.log(`💳 PreCheckout от ${query.from.username}`);
        await bot.answerPreCheckoutQuery(query.id, true, '✅ Оплата принята!');
        console.log(`✅ PreCheckout подтвержден`);
    } catch (error) {
        console.error('❌ PreCheckout ошибка:', error);
    }
});

// ========== УСПЕШНАЯ ОПЛАТА ==========
bot.on('successful_payment', (msg) => {
    const payment = msg.successful_payment;
    const username = msg.from.username || msg.from.first_name;
    
    console.log(`💎 УСПЕШНАЯ ОПЛАТА!`);
    console.log(`   Игрок: ${username}`);
    console.log(`   Сумма: ${payment.total_amount} ⭐`);
    console.log(`   ID: ${payment.telegram_payment_charge_id}`);
    
    // Разбираем payload
    try {
        const payload = JSON.parse(payment.payload);
        console.log(`   Кит: ${payload.kit}`);
    } catch (e) {}
    
    bot.sendMessage(msg.chat.id, 
        `✅ <b>Оплата прошла успешно!</b>\n\n` +
        `⭐ Списано: ${payment.total_amount} звезд\n` +
        `👤 Игрок: ${username}\n\n` +
        `🎮 <b>Набор выдан на сервер!</b>`,
        { parse_mode: 'HTML' }
    );
});

// ========== ЛОГИ ==========
bot.on('polling_error', (error) => {
    console.error('❌ Ошибка поллинга:', error);
});

console.log('✅ Бот готов!');
console.log('━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 ВАЖНО:');
console.log('1. Открой Telegram на ТЕЛЕФОНЕ');
console.log('2. Версия Telegram должна быть 10.0+');
console.log('3. Напиши /start');
console.log('4. Нажми на кнопку');
