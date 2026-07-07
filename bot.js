require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// ========== ТВОИ ДАННЫЕ ==========
const BOT_TOKEN = '8792137358:AAHMO9wKGVKvXgYsqOz5cSN43xdSpUzrknk';
const ADMIN_ID = '8579640456';

// ========== КУРС: 1 ⭐ = 1 РУБЛЬ ==========
// Цены переведены из рублей в звезды

// ========== НАСТРОЙКА КИТОВ (PVP) ==========
const KITS = {
    pvp: {
        id: 'pvp',
        name: '⚔️ PvP Kit',
        price: 20,
        emoji: '⚔️',
        image: 'https://i.postimg.cc/nX3mkwWg/file-1.jpg'
    },
    pvp_plus: {
        id: 'pvp_plus',
        name: '🔥 PvP+ Kit',
        price: 35,
        emoji: '🔥',
        image: 'https://i.postimg.cc/HrvJ58cY/file-2.jpg'
    },
    pvp_plusplus: {
        id: 'pvp_plusplus',
        name: '💀 PvP++ Kit',
        price: 50,
        emoji: '💀',
        image: 'https://i.postimg.cc/CBkdWvvZ/file.jpg'
    }
};

// ========== НАСТРОЙКА ПРИВИЛЕГИЙ ==========
const PRIVILEGES = {
    dadmin: {
        id: 'dadmin',
        name: '👑 D.ADMIN',
        price: 649,
        oldPrice: 1299,
        discount: '-50%',
        emoji: '👑',
        features: [
            'Бонус: +5 000 Рилликов!',
            'Уникальный кит - /kit D.ADMIN',
            'Дополнительный Мега-Набор - /kit pluspro',
            'Префикс [D.ADMIN] в чате и табе'
        ]
    },
    pasxa: {
        id: 'pasxa',
        name: '🐣 PASXA',
        price: 499,
        oldPrice: 998,
        discount: '-50%',
        emoji: '🐣',
        features: [
            'Бонус: +4 000 Рилликов!',
            'Уникальный кит - /kit PASXA',
            'Домов для /sethome: 999+',
            'Префикс [PASXA] в чате и табе'
        ]
    },
    monster: {
        id: 'monster',
        name: '👹 MONSTER',
        price: 399,
        oldPrice: 798,
        discount: '-50%',
        emoji: '👹',
        features: [
            'Бонус: +3 000 Рилликов!',
            'Домов для /sethome: 999+',
            'Уникальный кит - /kit MONSTER',
            'Префикс [MONSTER] в чате и табе'
        ]
    },
    pegas: {
        id: 'pegas',
        name: '🐴 PEGAS',
        price: 200,
        oldPrice: 400,
        discount: '-50%',
        emoji: '🐴',
        features: [
            'Бонус: +2 000 Рилликов!',
            'Уникальный кит - /kit pegas',
            'Доступ к префиксам - /prefix',
            'Префикс [PEGAS] в чате и табе'
        ]
    },
    god: {
        id: 'god',
        name: '✨ GOD',
        price: 150,
        oldPrice: 300,
        discount: '-50%',
        emoji: '✨',
        features: [
            'Полное бессмертие на сервере (/god)',
            'Уникальный кит - /kit god',
            'Префикс [GOD] в чате и табе'
        ]
    },
    cobra: {
        id: 'cobra',
        name: '🐍 COBRA',
        price: 89,
        oldPrice: 178,
        discount: '-50%',
        emoji: '🐍',
        features: [
            'Уникальный кит - /kit cobra',
            'Домов для /sethome: 999+',
            'Префикс [COBRA] в чате и табе'
        ]
    },
    hydra: {
        id: 'hydra',
        name: '🐉 HYDRA',
        price: 59,
        oldPrice: 118,
        discount: '-50%',
        emoji: '🐉',
        features: [
            'Уникальный кит - /kit hydra',
            'Префикс [HYDRA] в чате и табе'
        ]
    },
    dhelper: {
        id: 'dhelper',
        name: '🛠️ D.HELPER',
        price: 54,
        oldPrice: 108,
        discount: '-50%',
        emoji: '🛠️',
        features: [
            'Уникальный кит - /kit dhelper',
            'Префикс [D.HELPER] в чате и табе'
        ]
    },
    tiger: {
        id: 'tiger',
        name: '🐯 TIGER',
        price: 45,
        oldPrice: 90,
        discount: '-50%',
        emoji: '🐯',
        features: [
            'Уникальный кит - /kit tiger',
            'Префикс [TIGER] в чате и табе'
        ]
    },
    bunny: {
        id: 'bunny',
        name: '🐰 BUNNY',
        price: 35,
        oldPrice: 70,
        discount: '-50%',
        emoji: '🐰',
        features: [
            'Уникальный кит - /kit bunny',
            'Префикс [BUNNY] в чате и табе'
        ]
    },
    bull: {
        id: 'bull',
        name: '🐂 BULL',
        price: 19,
        oldPrice: 38,
        discount: '-50%',
        emoji: '🐂',
        features: [
            'Уникальный кит - /kit bull',
            'Префикс [BULL] в чате и табе'
        ]
    }
};

// ========== ХРАНИЛИЩЕ ПОКУПОК ==========
const userPurchases = {};

// ========== ИНИЦИАЛИЗАЦИЯ БОТА ==========
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Бот запущен!');
console.log(`👤 Админ: ${ADMIN_ID}`);
console.log(`📦 Китов: ${Object.keys(KITS).length}`);
console.log(`👑 Привилегий: ${Object.keys(PRIVILEGES).length}`);

// ========== ФУНКЦИЯ ФОРМАТИРОВАНИЯ ЦЕНЫ ==========
function formatPrice(price) {
    return `${price} ⭐`;
}

// ========== КОМАНДА /START ==========
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'Игрок';
    
    const text = `🌟 <b>Добро пожаловать, ${firstName}!</b>\n\n` +
        `💎 <b>Магазин PvP Китов и Привилегий</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⬇️ <b>Выбери раздел:</b>`;
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '⚔️ PvP Киты', callback_data: 'show_kits' }],
                [{ text: '👑 Привилегии', callback_data: 'show_privileges' }],
                [
                    { text: '💰 Баланс', callback_data: 'balance' },
                    { text: '⭐ Купить Stars', callback_data: 'buystars' }
                ],
                [
                    { text: '📊 Статистика', callback_data: 'stats' },
                    { text: '🆘 Помощь', callback_data: 'help' }
                ]
            ]
        }
    };
    
    bot.sendMessage(chatId, text, { 
        parse_mode: 'HTML',
        ...keyboard
    });
});

// ========== ПОКАЗ КИТОВ ==========
async function showKits(chatId) {
    let text = `⚔️ <b>PvP Киты</b>\n\n`;
    
    for (const [key, kit] of Object.entries(KITS)) {
        text += `${kit.emoji} <b>${kit.name}</b> — ${formatPrice(kit.price)}\n`;
    }
    
    text += `\n⬇️ <b>Выбери кит для покупки:</b>`;
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                ...Object.entries(KITS).map(([key, kit]) => [
                    { text: `${kit.emoji} ${kit.name} (${kit.price}⭐)`, callback_data: `buy_kit_${key}` }
                ]),
                [{ text: '⬅️ Назад в меню', callback_data: 'back_to_menu' }]
            ]
        }
    };
    
    await bot.sendMessage(chatId, text, { 
        parse_mode: 'HTML',
        ...keyboard
    });
}

// ========== ПОКАЗ ПРИВИЛЕГИЙ ==========
async function showPrivileges(chatId) {
    let text = `👑 <b>Привилегии</b>\n\n`;
    text += `Все привилегии со скидкой 50%!\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    for (const [key, priv] of Object.entries(PRIVILEGES)) {
        text += `${priv.emoji} <b>${priv.name}</b>\n`;
        text += `   💰 ${formatPrice(priv.price)} (было ${formatPrice(priv.oldPrice)}) ${priv.discount}\n\n`;
    }
    
    text += `⬇️ <b>Выбери привилегию для подробностей:</b>`;
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                ...Object.entries(PRIVILEGES).map(([key, priv]) => [
                    { text: `${priv.emoji} ${priv.name} (${priv.price}⭐)`, callback_data: `show_priv_${key}` }
                ]),
                [{ text: '⬅️ Назад в меню', callback_data: 'back_to_menu' }]
            ]
        }
    };
    
    await bot.sendMessage(chatId, text, { 
        parse_mode: 'HTML',
        ...keyboard
    });
}

// ========== ПОКАЗ КОНКРЕТНОЙ ПРИВИЛЕГИИ ==========
async function showPrivilegeDetail(chatId, privKey) {
    const priv = PRIVILEGES[privKey];
    if (!priv) return;
    
    let text = `${priv.emoji} <b>${priv.name}</b>\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 <b>Цена:</b> ${formatPrice(priv.price)}\n`;
    text += `💰 <b>Старая цена:</b> ${formatPrice(priv.oldPrice)}\n`;
    text += `🎯 <b>Скидка:</b> ${priv.discount}\n\n`;
    text += `<b>📋 В комплекте:</b>\n`;
    
    for (const feature of priv.features) {
        text += `✅ ${feature}\n`;
    }
    
    text += `\n⬇️ <b>Нажми кнопку чтобы купить</b>`;
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: `💎 Купить за ${priv.price} ⭐`, callback_data: `buy_priv_${privKey}` }],
                [{ text: '⬅️ Назад к привилегиям', callback_data: 'show_privileges' }]
            ]
        }
    };
    
    await bot.sendMessage(chatId, text, { 
        parse_mode: 'HTML',
        ...keyboard
    });
}

// ========== ОБРАБОТЧИК КНОПОК ==========
bot.on('callback_query', async (callbackQuery) => {
    const action = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const messageId = callbackQuery.message.message_id;
    
    // Навигация
    if (action === 'back_to_menu') {
        try { await bot.deleteMessage(chatId, messageId); } catch (e) {}
        const firstName = callbackQuery.from.first_name || 'Игрок';
        const text = `🌟 <b>Добро пожаловать, ${firstName}!</b>\n\n` +
            `💎 <b>Магазин PvP Китов и Привилегий</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `⬇️ <b>Выбери раздел:</b>`;
        
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '⚔️ PvP Киты', callback_data: 'show_kits' }],
                    [{ text: '👑 Привилегии', callback_data: 'show_privileges' }],
                    [
                        { text: '💰 Баланс', callback_data: 'balance' },
                        { text: '⭐ Купить Stars', callback_data: 'buystars' }
                    ],
                    [
                        { text: '📊 Статистика', callback_data: 'stats' },
                        { text: '🆘 Помощь', callback_data: 'help' }
                    ]
                ]
            }
        };
        
        await bot.sendMessage(chatId, text, { parse_mode: 'HTML', ...keyboard });
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
    }
    
    if (action === 'show_kits') {
        try { await bot.deleteMessage(chatId, messageId); } catch (e) {}
        await showKits(chatId);
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
    }
    
    if (action === 'show_privileges') {
        try { await bot.deleteMessage(chatId, messageId); } catch (e) {}
        await showPrivileges(chatId);
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
    }
    
    if (action.startsWith('show_priv_')) {
        const privKey = action.replace('show_priv_', '');
        try { await bot.deleteMessage(chatId, messageId); } catch (e) {}
        await showPrivilegeDetail(chatId, privKey);
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
    }
    
    // Покупка
    if (action.startsWith('buy_kit_')) {
        const kitKey = action.replace('buy_kit_', '');
        const kit = KITS[kitKey];
        if (kit) {
            try { await bot.deleteMessage(chatId, messageId); } catch (e) {}
            await createInvoice(chatId, userId, kit, 'kit_' + kitKey);
        }
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
    }
    
    if (action.startsWith('buy_priv_')) {
        const privKey = action.replace('buy_priv_', '');
        const priv = PRIVILEGES[privKey];
        if (priv) {
            try { await bot.deleteMessage(chatId, messageId); } catch (e) {}
            await createInvoice(chatId, userId, priv, 'priv_' + privKey);
        }
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
    }
    
    // Баланс
    if (action === 'balance') {
        await bot.sendMessage(chatId,
            `💰 <b>Как узнать баланс звезд:</b>\n\n` +
            `1️⃣ Открой <b>Настройки</b> Telegram\n` +
            `2️⃣ Найди пункт <b>"Telegram Stars"</b>\n` +
            `3️⃣ Там ты увидишь свой баланс\n\n` +
            `⭐ <b>Как пополнить:</b>\n` +
            `• Нажми "Купить звезды"\n` +
            `• Выбери сумму\n` +
            `• Оплати через App Store/Google Play`,
            { parse_mode: 'HTML' }
        );
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
    }
    
    if (action === 'buystars') {
        await bot.sendMessage(chatId,
            `⭐ <b>Купить Telegram Stars</b>\n\n` +
            `Нажми на кнопку ниже, чтобы перейти в настройки:`,
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '⭐ Купить звезды', url: 'tg://settings/telegram_stars' }]
                    ]
                }
            }
        );
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
    }
    
    if (action === 'stats') {
        await showStats(chatId, userId);
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
    }
    
    if (action === 'help') {
        await bot.sendMessage(chatId,
            `🆘 <b>Помощь</b>\n\n` +
            `📌 <b>Команды:</b>\n` +
            `/start — Главное меню\n` +
            `/balance — Как узнать баланс звезд\n` +
            `/buystars — Купить звезды\n` +
            `/stats — Моя статистика\n` +
            `/help — Эта справка\n\n` +
            `💡 <b>Как купить:</b>\n` +
            `1️⃣ Напиши /start\n` +
            `2️⃣ Выбери "PvP Киты" или "Привилегии"\n` +
            `3️⃣ Нажми на нужный товар\n` +
            `4️⃣ Оплати звездами\n` +
            `5️⃣ Получи на сервере!\n\n` +
            `⚠️ <b>Важно:</b>\n` +
            `• Оплата работает ТОЛЬКО в мобильном Telegram\n` +
            `• Нужна версия Telegram 10.0+\n` +
            `• Stars должны быть доступны в регионе\n\n` +
            `📞 Если товар не пришел — напиши админу!`,
            { parse_mode: 'HTML' }
        );
        await bot.answerCallbackQuery(callbackQuery.id);
        return;
    }
});

// ========== ФУНКЦИЯ СТАТИСТИКИ ==========
async function showStats(chatId, userId) {
    if (!userPurchases[userId]) {
        await bot.sendMessage(chatId,
            `📊 <b>Твоя статистика</b>\n\n` +
            `У тебя пока нет покупок.\n` +
            `Купи свой первый товар! 🚀`,
            { parse_mode: 'HTML' }
        );
        return;
    }
    
    const data = userPurchases[userId];
    let purchasesText = '';
    
    data.purchases.forEach((p, index) => {
        purchasesText += `${index + 1}. ${p.name} — ${p.amount} ⭐\n`;
    });
    
    await bot.sendMessage(chatId,
        `📊 <b>Твоя статистика</b>\n\n` +
        `⭐ Всего потрачено: ${data.totalSpent} звезд\n` +
        `📦 Покупок: ${data.purchases.length}\n\n` +
        `<b>История покупок:</b>\n${purchasesText || 'Нет покупок'}`,
        { parse_mode: 'HTML' }
    );
}

// ========== СОЗДАНИЕ СЧЕТА ==========
async function createInvoice(chatId, userId, item, itemKey) {
    try {
        await bot.sendInvoice(
            chatId,
            item.name,
            `Покупка ${item.name}`,
            JSON.stringify({
                item: itemKey,
                userId: userId,
                time: Date.now()
            }),
            undefined,
            'XTR',
            [{ label: item.name, amount: item.price }],
            {
                start_parameter: 'buy_' + itemKey + '_' + Date.now()
            }
        );
        
        console.log(`💰 Счет создан: ${item.name} (${item.price} ⭐) для ${userId}`);
        
    } catch (error) {
        console.error('❌ Ошибка создания счета:', error.message);
        
        let errorMsg = '❌ Ошибка создания платежа.\n\n';
        
        if (error.message && error.message.includes('XTR')) {
            errorMsg += '⚠️ Проблема с Telegram Stars.\n';
            errorMsg += '1. Обнови Telegram до 10.0+\n';
            errorMsg += '2. Проверь доступность Stars в регионе\n';
            errorMsg += '3. Используй мобильный Telegram';
        } else {
            errorMsg += `Ошибка: ${error.message || 'Неизвестная ошибка'}`;
        }
        
        await bot.sendMessage(chatId, errorMsg);
    }
}

// ========== ПОДТВЕРЖДЕНИЕ ПЛАТЕЖА ==========
bot.on('pre_checkout_query', async (query) => {
    try {
        console.log(`💳 PreCheckout от ${query.from.username}`);
        await bot.answerPreCheckoutQuery(query.id, true, '✅ Оплата принята!');
        console.log(`✅ PreCheckout подтвержден`);
    } catch (error) {
        console.error('❌ PreCheckout ошибка:', error);
        try {
            await bot.answerPreCheckoutQuery(query.id, false, '❌ Ошибка оплаты');
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
        const payload = JSON.parse(payment.payload);
        const itemKey = payload.item;
        
        // Ищем товар в китах или привилегиях
        let item = null;
        let itemType = '';
        
        if (itemKey.startsWith('kit_')) {
            const kitId = itemKey.replace('kit_', '');
            item = KITS[kitId];
            itemType = 'Кит';
        } else if (itemKey.startsWith('priv_')) {
            const privId = itemKey.replace('priv_', '');
            item = PRIVILEGES[privId];
            itemType = 'Привилегия';
        }
        
        if (!item) {
            await bot.sendMessage(chatId, '❌ Ошибка: неизвестный товар');
            return;
        }
        
        if (!userPurchases[userId]) {
            userPurchases[userId] = {
                totalSpent: 0,
                purchases: []
            };
        }
        
        userPurchases[userId].totalSpent += payment.total_amount;
        userPurchases[userId].purchases.push({
            name: item.name,
            amount: payment.total_amount,
            time: new Date().toISOString()
        });
        
        await bot.sendMessage(chatId,
            `✅ <b>Оплата прошла успешно!</b>\n\n` +
            `📦 ${item.emoji} ${item.name}\n` +
            `📋 Тип: ${itemType}\n` +
            `⭐ Списано: ${payment.total_amount} звезд\n` +
            `👤 Игрок: ${username}\n\n` +
            `🎮 <b>Товар выдан на сервер!</b>\n` +
            `🆔 Платеж: ${payment.telegram_payment_charge_id.slice(0, 10)}...`,
            { parse_mode: 'HTML' }
        );
        
        await bot.sendMessage(ADMIN_ID,
            `✅ <b>НОВАЯ ПОКУПКА!</b>\n\n` +
            `👤 Игрок: ${username} (ID: ${userId})\n` +
            `📦 Товар: ${item.name}\n` +
            `📋 Тип: ${itemType}\n` +
            `⭐ Цена: ${payment.total_amount} звезд\n` +
            `🆔 Платеж: ${payment.telegram_payment_charge_id}\n` +
            `📅 Время: ${new Date().toLocaleString()}`,
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

// ========== КОМАНДЫ (для обратной совместимости) ==========
bot.onText(/\/balance/, (msg) => {
    bot.sendMessage(msg.chat.id,
        `💰 <b>Как узнать баланс звезд:</b>\n\n` +
        `1️⃣ Открой <b>Настройки</b> Telegram\n` +
        `2️⃣ Найди пункт <b>"Telegram Stars"</b>\n` +
        `3️⃣ Там ты увидишь свой баланс`,
        { parse_mode: 'HTML' }
    );
});

bot.onText(/\/buystars/, (msg) => {
    bot.sendMessage(msg.chat.id,
        `⭐ <b>Купить Telegram Stars</b>\n\n` +
        `Нажми на кнопку ниже:`,
        {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '⭐ Купить звезды', url: 'tg://settings/telegram_stars' }]
                ]
            }
        }
    );
});

bot.onText(/\/stats/, (msg) => {
    showStats(msg.chat.id, msg.from.id);
});

bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id,
        `🆘 <b>Помощь</b>\n\n` +
        `/start — Главное меню\n` +
        `/balance — Баланс звезд\n` +
        `/buystars — Купить звезды\n` +
        `/stats — Моя статистика\n` +
        `/help — Эта справка`,
        { parse_mode: 'HTML' }
    );
});

// ========== ЛОГИ ==========
bot.on('polling_error', (error) => {
    console.error('❌ Ошибка поллинга:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Необработанная ошибка:', error);
});

console.log('✅ Бот готов!');
console.log('━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 Доступные разделы:');
console.log('   ⚔️ PvP Киты');
console.log('   👑 Привилегии');
console.log('━━━━━━━━━━━━━━━━━━━━━');
console.log('💡 ВАЖНО:');
console.log('1. Оплата работает ТОЛЬКО в мобильном Telegram');
console.log('2. Версия Telegram должна быть 10.0+');
console.log('3. Stars должны быть доступны в регионе');
console.log('4. Курс: 1 ⭐ = 1 РУБЛЬ');
