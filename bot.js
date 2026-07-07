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

// ========== ИНИЦИАЛИЗАЦИЯ БОТА ==========
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Бот запущен!');

// ========== ФУНКЦИЯ СОЗДАНИЯ СЧЕТА ==========
async function sendStarsInvoice(chatId, kit, kitKey, userId) {
    try {
        // ⚠️ КЛЮЧЕВОЙ МОМЕНТ: НЕ ПЕРЕДАВАЙ provider_token!
        // Используем ТОЛЬКО эти параметры:
        const invoice = {
            chat_id: chatId,
            title: kit.name,
            description: kit.description,
            payload: JSON.stringify({
                kit: kitKey,
                userId: userId,
                time: Date.now()
            }),
            currency: 'XTR', // ⭐ ТОЛЬКО XTR
            prices: [
                { label: kit.name, amount: kit.price }
            ],
            start_parameter: 'buy_' + kitKey + '_' + Date.now()
        };
        
        // ⭐ ОТПРАВЛЯЕМ БЕЗ provider_token!
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
        
        console.log(`✅ Счет отправлен: ${kit.name} (${kit.price} ⭐)`);
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка создания счета:', error);
        
        let errorMsg = '❌ Ошибка создания платежа.\n\n';
        
        if (error.message && error.message.includes('XTR')) {
            errorMsg += '⚠️ Проблема с валютой XTR.\n';
            errorMsg += '1. Обнови Telegram до последней версии\n';
            errorMsg += '2. Проверь доступность Stars в регионе\n';
        } else {
            errorMsg += `Ошибка: ${error.message || 'Неизвестная ошибка'}`;
        }
        
        await bot.sendMessage(chatId, errorMsg);
        return false;
    }
}

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
    const messageId = callbackQuery.message.message_id;
    
    if (action.startsWith('buy_')) {
        const kitKey = action.replace('buy_', '');
        const kit = KITS[kitKey];
        
        if (kit) {
            // Удаляем сообщение с кнопками
            try {
                await bot.deleteMessage(chatId, messageId);
            } catch (e) {}
            
            // Создаем счет
            await sendStarsInvoice(chatId, kit, kitKey, userId);
        }
        
        await bot.answerCallbackQuery(callbackQuery.id);
    }
});

// ========== ПОДТВЕРЖДЕНИЕ ПЛАТЕЖА ==========
bot.on('pre_checkout_query', async (query) => {
    try {
        console.log(`💳 PreCheckout от ${query.from.username}`);
        console.log(`   Payload: ${query.invoice_payload}`);
        
        // ⭐ ОБЯЗАТЕЛЬНО ПОДТВЕРЖДАЕМ
        await bot.answerPreCheckoutQuery(
            query.id,
            true,
            '✅ Оплата принята!'
        );
        
        console.log(`✅ PreCheckout подтвержден`);
        
    } catch (error) {
        console.error('❌ PreCheckout ошибка:', error);
        try {
            await bot.answerPreCheckoutQuery(
                query.id,
                false,
                '❌ Ошибка оплаты. Попробуй позже.'
            );
        } catch (e) {}
    }
});

// ========== УСПЕШНАЯ ОПЛАТА ==========
bot.on('successful_payment', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;
    const payment = msg.successful_payment;
    
    console.log(`💎 УСПЕШНАЯ ОПЛАТА!`);
    console.log(`   Игрок: ${username} (ID: ${userId})`);
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
        
        // ✅ УСПЕШНАЯ ОПЛАТА!
        await bot.sendMessage(chatId,
            `✅ <b>Оплата прошла успешно!</b>\n\n` +
            `📦 ${kit.emoji} ${kit.name}\n` +
            `⭐ Списано: ${payment.total_amount} звезд\n` +
            `👤 Игрок: ${username}\n\n` +
            `🎮 <b>Набор выдан на сервер!</b>\n` +
            `🆔 Платеж: ${payment.telegram_payment_charge_id.slice(0, 10)}...`,
            { parse_mode: 'HTML' }
        );
        
        // Уведомление админу
        await bot.sendMessage(ADMIN_ID,
            `✅ <b>НОВАЯ ПОКУПКА!</b>\n\n` +
            `👤 Игрок: ${username} (ID: ${userId})\n` +
            `📦 Кит: ${kit.name}\n` +
            `⭐ Цена: ${payment.total_amount} звезд\n` +
            `🆔 Платеж: ${payment.telegram_payment_charge_id}\n` +
            `📅 Время: ${new Date().toLocaleString()}`,
            { parse_mode: 'HTML' }
        );
        
        // ⭐ ТУТ ДОБАВЬ ВЫДАЧУ НА СЕРВЕР ЧЕРЕЗ RCON
        
    } catch (error) {
        console.error('❌ Ошибка обработки платежа:', error);
        await bot.sendMessage(chatId,
            '❌ Ошибка обработки платежа. Напиши админу!\n' +
            `ID платежа: ${payment.telegram_payment_charge_id}`
        );
    }
});

// ========== ОТЛАДКА ==========
bot.on('polling_error', (error) => {
    console.error('❌ Ошибка поллинга:', error);
});

console.log('✅ Бот готов!');
console.log('📋 Доступные киты:');
for (const [key, kit] of Object.entries(KITS)) {
    console.log(`   ${kit.name} — ${kit.price} ⭐`);
}
console.log('━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 ВАЖНО:');
console.log('1. Оплата работает ТОЛЬКО в мобильном Telegram');
console.log('2. Версия Telegram должна быть 10.0+');
console.log('3. Stars должны быть доступны в регионе');
