require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// ========== ТВОИ ДАННЫЕ ==========
const BOT_TOKEN = '8792137358:AAHMO9wKGVKvXgYsqOz5cSN43xdSpUzrknk';
const ADMIN_ID = '8579640456';

// ========== НАСТРОЙКА КИТОВ ==========
const KITS = {
    test: {
        id: 'test',
        name: '🧪 Test Kit',
        description: 'Проверка оплаты звездами',
        price: 1,
        emoji: '🧪',
        image: 'https://i.postimg.cc/nX3mkwWg/file-1.jpg'
    },
    pvp: {
        id: 'pvp',
        name: '⚔️ PvP Kit',
        description: 'Броня + AK-47 + M4 + 50.000$',
        price: 20,
        emoji: '⚔️',
        image: 'https://i.postimg.cc/nX3mkwWg/file-1.jpg'
    },
    pvp_plus: {
        id: 'pvp_plus',
        name: '🔥 PvP+ Kit',
        description: 'Броня + Миниган + Снайперка + 100.000$',
        price: 35,
        emoji: '🔥',
        image: 'https://i.postimg.cc/HrvJ58cY/file-2.jpg'
    },
    pvp_plusplus: {
        id: 'pvp_plusplus',
        name: '💀 PvP++ Kit',
        description: 'Броня + РПГ + Миниган + 250.000$ + Вип статус',
        price: 50,
        emoji: '💀',
        image: 'https://i.postimg.cc/CBkdWvvZ/file.jpg'
    }
};

// ========== ИНИЦИАЛИЗАЦИЯ БОТА (ВАЖНЫЕ НАСТРОЙКИ) ==========
const bot = new TelegramBot(BOT_TOKEN, { 
    polling: true
});

console.log('🤖 Бот запущен!');

// ========== КОМАНДА /START ==========
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'Игрок';
    
    const text = `🌟 <b>Добро пожаловать, ${firstName}!</b>\n\n` +
        `💎 <b>Магазин PvP Китов за Telegram Stars</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🧪 <b>ТЕСТОВЫЙ КИТ ЗА 1 ⭐!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📋 <b>Доступные наборы:</b>\n` +
        `🧪 Test Kit — 1 ⭐ (ТЕСТ!)\n` +
        `⚔️ PvP Kit — 20 ⭐\n` +
        `🔥 PvP+ Kit — 35 ⭐\n` +
        `💀 PvP++ Kit — 50 ⭐\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⬇️ <b>Нажми на кнопку чтобы купить</b>`;
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🧪 TEST (1⭐)', callback_data: 'buy_test' }],
                [{ text: '⚔️ PvP (20⭐)', callback_data: 'buy_pvp' }],
                [{ text: '🔥 PvP+ (35⭐)', callback_data: 'buy_pvp_plus' }],
                [{ text: '💀 PvP++ (50⭐)', callback_data: 'buy_pvp_plusplus' }]
            ]
        }
    };
    
    bot.sendMessage(chatId, text, { 
        parse_mode: 'HTML',
        ...keyboard
    });
});

// ========== ОБРАБОТЧИК КНОПОК ==========
bot.on('callback_query', async (callbackQuery) => {
    const action = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    
    if (action.startsWith('buy_')) {
        const kitKey = action.replace('buy_', '');
        const kit = KITS[kitKey];
        
        if (kit) {
            await createInvoice(chatId, userId, kit, kitKey);
        }
        
        await bot.answerCallbackQuery(callbackQuery.id);
    }
});

// ========== СОЗДАНИЕ СЧЕТА (ОПЛАТА ЗВЕЗДАМИ) ==========
async function createInvoice(chatId, userId, kit, kitKey) {
    try {
        console.log(`💰 Создание счета для ${kit.name} (${kit.price} ⭐)`);
        
        // ⭐ ВАЖНО: Для Stars используется валюта XTR
        const invoicePayload = {
            chat_id: chatId,
            title: kit.name,
            description: kit.description,
            payload: JSON.stringify({
                kit: kitKey,
                userId: userId,
                time: Date.now()
            }),
            provider_token: '', // ⭐ ОБЯЗАТЕЛЬНО ПУСТО!
            currency: 'XTR',    // ⭐ XTR = Telegram Stars
            prices: [
                { 
                    label: kit.name, 
                    amount: kit.price  // Количество звезд
                }
            ],
            start_parameter: 'buy_' + kitKey
        };
        
        // Отправляем счет
        const result = await bot.sendInvoice(
            invoicePayload.chat_id,
            invoicePayload.title,
            invoicePayload.description,
            invoicePayload.payload,
            invoicePayload.provider_token,
            invoicePayload.currency,
            invoicePayload.prices,
            {
                start_parameter: invoicePayload.start_parameter
            }
        );
        
        console.log(`✅ Счет отправлен: ${kit.name}`);
        
    } catch (error) {
        console.error('❌ Ошибка создания счета:', error);
        
        let errorMessage = '❌ Ошибка создания платежа.\n';
        
        if (error.message.includes('XTR')) {
            errorMessage += '⚠️ Валюта XTR не поддерживается.\n';
            errorMessage += 'Обнови Telegram до последней версии!';
        } else {
            errorMessage += `Ошибка: ${error.message}`;
        }
        
        await bot.sendMessage(chatId, errorMessage);
    }
}

// ========== ПОДТВЕРЖДЕНИЕ ПЛАТЕЖА ==========
bot.on('pre_checkout_query', async (query) => {
    try {
        console.log(`💳 PreCheckout от ${query.from.username}`);
        
        // Обязательно подтверждаем
        await bot.answerPreCheckoutQuery(
            query.id, 
            true, 
            '✅ Оплата принята!'
        );
        
        console.log(`✅ PreCheckout подтвержден`);
        
    } catch (error) {
        console.error('❌ PreCheckout ошибка:', error);
        await bot.answerPreCheckoutQuery(
            query.id, 
            false, 
            '❌ Ошибка оплаты'
        );
    }
});

// ========== УСПЕШНАЯ ОПЛАТА ==========
bot.on('successful_payment', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;
    const payment = msg.successful_payment;
    
    console.log(`💎 УСПЕШНАЯ ОПЛАТА!`);
    console.log(`   Игрок: ${username}`);
    console.log(`   Сумма: ${payment.total_amount} ⭐`);
    console.log(`   ID: ${payment.telegram_payment_charge_id}`);
    
    try {
        // Разбираем payload
        const payload = JSON.parse(payment.payload);
        const kitKey = payload.kit;
        const kit = KITS[kitKey];
        
        if (!kit) {
            await bot.sendMessage(chatId, '❌ Ошибка: неизвестный кит');
            return;
        }
        
        // ✅ ОПЛАТА ПРОШЛА УСПЕШНО!
        await bot.sendMessage(chatId, 
            `✅ <b>Оплата прошла успешно!</b>\n\n` +
            `📦 ${kit.emoji} ${kit.name}\n` +
            `⭐ Списано: ${payment.total_amount} звезд\n` +
            `👤 Игрок: ${username}\n\n` +
            `🎮 <b>Набор выдан на сервер!</b>`,
            { parse_mode: 'HTML' }
        );
        
        // Уведомление админу
        await bot.sendMessage(ADMIN_ID, 
            `✅ <b>НОВАЯ ПОКУПКА!</b>\n\n` +
            `👤 Игрок: ${username} (ID: ${userId})\n` +
            `📦 Кит: ${kit.name}\n` +
            `⭐ Цена: ${payment.total_amount} звезд\n` +
            `🆔 Платеж: ${payment.telegram_payment_charge_id}`,
            { parse_mode: 'HTML' }
        );
        
    } catch (error) {
        console.error('❌ Ошибка обработки платежа:', error);
        await bot.sendMessage(chatId, 
            '❌ Ошибка обработки платежа. Напиши админу!\n' +
            `ID платежа: ${payment.telegram_payment_charge_id}`
        );
    }
});

// ========== ЛОГИРОВАНИЕ ==========
bot.on('polling_error', (error) => {
    console.error('❌ Ошибка поллинга:', error);
});

console.log('✅ Бот готов!');
console.log('📋 Доступные киты:');
for (const [key, kit] of Object.entries(KITS)) {
    console.log(`   ${kit.name} — ${kit.price} ⭐`);
}
console.log('━━━━━━━━━━━━━━━━━━━━━');
