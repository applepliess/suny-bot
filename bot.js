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
    const messageId = callbackQuery.message.message_id;
    
    if (action.startsWith('buy_')) {
        const kitKey = action.replace('buy_', '');
        const kit = KITS[kitKey];
        
        if (kit) {
            // Удаляем сообщение с кнопками
            try {
                await bot.deleteMessage(chatId, messageId);
            } catch (e) {}
            
            await createInvoice(chatId, userId, kit, kitKey);
        }
        
        await bot.answerCallbackQuery(callbackQuery.id);
    }
});

// ========== СОЗДАНИЕ СЧЕТА (ОПЛАТА ЗВЕЗДАМИ) ==========
async function createInvoice(chatId, userId, kit, kitKey) {
    try {
        console.log(`💰 Создание счета для ${kit.name} (${kit.price} ⭐)`);
        
        // ⭐ КЛЮЧЕВОЙ МОМЕНТ: правильный формат для Stars
        const invoiceParams = {
            chat_id: chatId,
            title: kit.name,
            description: kit.description,
            payload: JSON.stringify({
                kit: kitKey,
                userId: userId,
                time: Date.now()
            }),
            provider_token: '', // ⭐ ОБЯЗАТЕЛЬНО ПУСТО!
            currency: 'XTR',    // ⭐ ТОЛЬКО XTR для Stars
            prices: [
                { 
                    label: kit.name, 
                    amount: kit.price
                }
            ],
            start_parameter: 'buy_' + kitKey + '_' + Date.now(),
            photo_url: kit.image,
            photo_size: 100,
            photo_width: 100,
            photo_height: 100,
            need_name: false,
            need_phone_number: false,
            need_email: false,
            need_shipping_address: false,
            is_flexible: false
        };
        
        // Отправляем счет
        await bot.sendInvoice(
            invoiceParams.chat_id,
            invoiceParams.title,
            invoiceParams.description,
            invoiceParams.payload,
            invoiceParams.provider_token,
            invoiceParams.currency,
            invoiceParams.prices,
            {
                start_parameter: invoiceParams.start_parameter,
                photo_url: invoiceParams.photo_url,
                photo_size: invoiceParams.photo_size,
                photo_width: invoiceParams.photo_width,
                photo_height: invoiceParams.photo_height,
                need_name: invoiceParams.need_name,
                need_phone_number: invoiceParams.need_phone_number,
                need_email: invoiceParams.need_email,
                need_shipping_address: invoiceParams.need_shipping_address,
                is_flexible: invoiceParams.is_flexible
            }
        );
        
        console.log(`✅ Счет отправлен: ${kit.name}`);
        
    } catch (error) {
        console.error('❌ Ошибка создания счета:', error);
        
        let errorMessage = '❌ Ошибка создания платежа.\n\n';
        
        if (error.message && error.message.includes('XTR')) {
            errorMessage += '⚠️ Проблема с валютой XTR.\n';
            errorMessage += '1. Обнови Telegram до последней версии\n';
            errorMessage += '2. Проверь доступность Stars в регионе\n';
            errorMessage += '3. Попробуй перезапустить бота';
        } else if (error.message && error.message.includes('timeout')) {
            errorMessage += '⏰ Таймаут соединения. Попробуй еще раз.';
        } else {
            errorMessage += `Ошибка: ${error.message || 'Неизвестная ошибка'}`;
        }
        
        await bot.sendMessage(chatId, errorMessage);
        
        // Отправляем админу
        await bot.sendMessage(ADMIN_ID, 
            `❌ ОШИБКА СОЗДАНИЯ СЧЕТА\n\n` +
            `Кит: ${kit.name}\n` +
            `Пользователь: ${userId}\n` +
            `Ошибка: ${error.message}`
        );
    }
}

// ========== ПОДТВЕРЖДЕНИЕ ПЛАТЕЖА ==========
bot.on('pre_checkout_query', async (query) => {
    try {
        console.log(`💳 PreCheckout от ${query.from.username}`);
        console.log(`   Payload: ${query.invoice_payload}`);
        console.log(`   ID: ${query.id}`);
        
        // ⭐ ВСЕГДА ПОДТВЕРЖДАЕМ
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
        } catch (e) {
            console.error('❌ Не удалось ответить на PreCheckout:', e);
        }
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
    console.log(`   Payload: ${payment.payload}`);
    
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
            `🎮 <b>Набор выдан на сервер!</b>`,
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
        
        // ⭐ ТУТ МОЖНО ДОБАВИТЬ ВЫДАЧУ НА СЕРВЕР
        
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

bot.on('error', (error) => {
    console.error('❌ Ошибка бота:', error);
});

console.log('✅ Бот готов!');
console.log('📋 Доступные киты:');
for (const [key, kit] of Object.entries(KITS)) {
    console.log(`   ${kit.name} — ${kit.price} ⭐`);
}
console.log('━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 Чтобы оплатить звездами:');
console.log('   1. Напиши /start');
console.log('   2. Нажми на кит');
console.log('   3. Оплати через Telegram');
