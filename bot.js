const TelegramBot = require('node-telegram-bot-api');

// ========== ТВОИ ДАННЫЕ ==========
const BOT_TOKEN = '8792137358:AAHMO9wKGVKvXgYsqOz5cSN43xdSpUzrknk';
const ADMIN_ID = '8579640456'; // ID админа для уведомлений

// ========== НАСТРОЙКА КИТОВ ==========
const KITS = {
    pvp: {
        id: 'pvp',
        name: '⚔️ PvP Kit',
        price: 20,
        emoji: '⚔️'
    },
    pvp_plus: {
        id: 'pvp_plus',
        name: '🔥 PvP+ Kit',
        price: 35,
        emoji: '🔥'
    },
    pvp_plusplus: {
        id: 'pvp_plusplus',
        name: '💀 PvP++ Kit',
        price: 50,
        emoji: '💀'
    }
};

// ========== НАСТРОЙКА ПРИВИЛЕГИЙ ==========
const PRIVILEGES = {
    dadmin: {
        id: 'dadmin',
        name: '👑 D.ADMIN',
        price: 649,
        oldPrice: 1298,
        discount: '🔥 СКИДКА 50%!',
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
        discount: '🔥 СКИДКА 50%!',
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
        discount: '🔥 СКИДКА 50%!',
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
        discount: '🔥 СКИДКА 50%!',
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
        discount: '🔥 СКИДКА 50%!',
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
        discount: '🔥 СКИДКА 50%!',
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
        discount: '🔥 СКИДКА 50%!',
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
        discount: '🔥 СКИДКА 50%!',
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
        discount: '🔥 СКИДКА 50%!',
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
        discount: '🔥 СКИДКА 50%!',
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
        discount: '🔥 СКИДКА 50%!',
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

// ========== КОМАНДА /START ==========
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'Игрок';
    
    const text = `🌟 <b>Добро пожаловать, ${firstName}!</b>\n\n` +
        `💎 <b>Магазин PvP Китов и Привилегий</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🔥 <b>СКИДКА 50% НА ВСЕ ПРИВИЛЕГИИ!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⬇️ <b>Выбери раздел:</b>`;
    
    bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: '⚔️ PvP Киты', callback_data: 'show_kits' }],
                [{ text: '👑 Привилегии 🔥-50%', callback_data: 'show_privileges' }],
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
    });
});

// ========== ПОКАЗ КИТОВ ==========
function showKits(chatId) {
    let text = `⚔️ <b>PvP Киты</b>\n\n`;
    
    for (const [key, kit] of Object.entries(KITS)) {
        text += `${kit.emoji} <b>${kit.name}</b> — ${kit.price} ⭐\n`;
    }
    
    text += `\n⬇️ <b>Выбери кит для покупки:</b>`;
    
    const buttons = Object.entries(KITS).map(([key, kit]) => [
        { text: `${kit.emoji} ${kit.name} (${kit.price}⭐)`, callback_data: `buy_kit_${key}` }
    ]);
    buttons.push([{ text: '⬅️ Назад в меню', callback_data: 'menu' }]);
    
    bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: buttons
        }
    });
}

// ========== ПОКАЗ ПРИВИЛЕГИЙ ==========
function showPrivileges(chatId) {
    let text = `👑 <b>Привилегии</b>\n\n`;
    text += `🔥 <b>СКИДКА 50% НА ВСЕ!</b>\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    for (const [key, priv] of Object.entries(PRIVILEGES)) {
        text += `${priv.emoji} <b>${priv.name}</b>\n`;
        text += `   💰 ${priv.price} ⭐ (было ${priv.oldPrice} ⭐)\n`;
        text += `   🎯 ${priv.discount}\n\n`;
    }
    
    text += `⬇️ <b>Выбери привилегию для подробностей:</b>`;
    
    const buttons = Object.entries(PRIVILEGES).map(([key, priv]) => [
        { text: `${priv.emoji} ${priv.name} (${priv.price}⭐)`, callback_data: `show_priv_${key}` }
    ]);
    buttons.push([{ text: '⬅️ Назад в меню', callback_data: 'menu' }]);
    
    bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: buttons
        }
    });
}

// ========== ПОКАЗ КОНКРЕТНОЙ ПРИВИЛЕГИИ ==========
function showPrivilegeDetail(chatId, privKey) {
    const priv = PRIVILEGES[privKey];
    if (!priv) return;
    
    let text = `${priv.emoji} <b>${priv.name}</b>\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 <b>Цена со скидкой:</b> ${priv.price} ⭐\n`;
    text += `💰 <b>Старая цена:</b> ${priv.oldPrice} ⭐\n`;
    text += `🎯 <b>Скидка:</b> ${priv.discount}\n\n`;
    text += `<b>📋 В комплекте:</b>\n`;
    
    for (const feature of priv.features) {
        text += `✅ ${feature}\n`;
    }
    
    text += `\n⬇️ <b>Нажми кнопку чтобы купить</b>`;
    
    bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: `💎 Купить за ${priv.price} ⭐`, callback_data: `buy_priv_${privKey}` }],
                [{ text: '⬅️ Назад к привилегиям', callback_data: 'show_privileges' }]
            ]
        }
    });
}

// ========== ОБРАБОТЧИК КНОПОК ==========
bot.on('callback_query', async (query) => {
    const action = query.data;
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    
    // Навигация
    if (action === 'menu') {
        const firstName = query.from.first_name || 'Игрок';
        const text = `🌟 <b>Добро пожаловать, ${firstName}!</b>\n\n` +
            `💎 <b>Магазин PvP Китов и Привилегий</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `🔥 <b>СКИДКА 50% НА ВСЕ ПРИВИЛЕГИИ!</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `⬇️ <b>Выбери раздел:</b>`;
        
        bot.sendMessage(chatId, text, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '⚔️ PvP Киты', callback_data: 'show_kits' }],
                    [{ text: '👑 Привилегии 🔥-50%', callback_data: 'show_privileges' }],
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
        });
        bot.answerCallbackQuery(query.id);
        return;
    }
    
    if (action === 'show_kits') {
        showKits(chatId);
        bot.answerCallbackQuery(query.id);
        return;
    }
    
    if (action === 'show_privileges') {
        showPrivileges(chatId);
        bot.answerCallbackQuery(query.id);
        return;
    }
    
    if (action.startsWith('show_priv_')) {
        const privKey = action.replace('show_priv_', '');
        showPrivilegeDetail(chatId, privKey);
        bot.answerCallbackQuery(query.id);
        return;
    }
    
    // ========== ПОКУПКА КИТОВ ==========
    if (action.startsWith('buy_kit_')) {
        const kitKey = action.replace('buy_kit_', '');
        const kit = KITS[kitKey];
        if (!kit) return;
        
        try {
            await bot.sendInvoice(
                chatId,
                kit.name,
                `Покупка ${kit.name}`,
                JSON.stringify({ 
                    item: 'kit_' + kitKey,
                    userId: userId,
                    time: Date.now()
                }),
                undefined,
                'XTR',
                [{ label: kit.name, amount: kit.price }],
                { start_parameter: 'kit_' + kitKey + '_' + Date.now() }
            );
            console.log(`💰 Счет создан: ${kit.name} (${kit.price} ⭐)`);
        } catch (e) {
            console.log('❌ Ошибка:', e.message);
            bot.sendMessage(chatId, '❌ Ошибка: ' + e.message);
        }
        bot.answerCallbackQuery(query.id);
        return;
    }
    
    // ========== ПОКУПКА ПРИВИЛЕГИЙ ==========
    if (action.startsWith('buy_priv_')) {
        const privKey = action.replace('buy_priv_', '');
        const priv = PRIVILEGES[privKey];
        if (!priv) return;
        
        try {
            await bot.sendInvoice(
                chatId,
                priv.name,
                `Покупка ${priv.name} со скидкой 50%`,
                JSON.stringify({ 
                    item: 'priv_' + privKey,
                    userId: userId,
                    time: Date.now()
                }),
                undefined,
                'XTR',
                [{ label: priv.name, amount: priv.price }],
                { start_parameter: 'priv_' + privKey + '_' + Date.now() }
            );
            console.log(`💰 Счет создан: ${priv.name} (${priv.price} ⭐)`);
        } catch (e) {
            console.log('❌ Ошибка:', e.message);
            bot.sendMessage(chatId, '❌ Ошибка: ' + e.message);
        }
        bot.answerCallbackQuery(query.id);
        return;
    }
    
    // Баланс
    if (action === 'balance') {
        bot.sendMessage(chatId,
            `💰 <b>Как узнать баланс звезд:</b>\n\n` +
            `1️⃣ Открой <b>Настройки</b> Telegram\n` +
            `2️⃣ Найди пункт <b>"Telegram Stars"</b>\n` +
            `3️⃣ Там ты увидишь свой баланс`,
            { parse_mode: 'HTML' }
        );
        bot.answerCallbackQuery(query.id);
        return;
    }
    
    if (action === 'buystars') {
        bot.sendMessage(chatId,
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
        bot.answerCallbackQuery(query.id);
        return;
    }
    
    if (action === 'stats') {
        if (!userPurchases[userId]) {
            bot.sendMessage(chatId,
                `📊 <b>Твоя статистика</b>\n\n` +
                `У тебя пока нет покупок.\n` +
                `Купи свой первый товар! 🚀`,
                { parse_mode: 'HTML' }
            );
        } else {
            const data = userPurchases[userId];
            let purchasesText = '';
            data.purchases.forEach((p, index) => {
                purchasesText += `${index + 1}. ${p.name} — ${p.amount} ⭐\n`;
            });
            
            bot.sendMessage(chatId,
                `📊 <b>Твоя статистика</b>\n\n` +
                `⭐ Всего потрачено: ${data.totalSpent} звезд\n` +
                `📦 Покупок: ${data.purchases.length}\n\n` +
                `<b>История покупок:</b>\n${purchasesText}`,
                { parse_mode: 'HTML' }
            );
        }
        bot.answerCallbackQuery(query.id);
        return;
    }
    
    if (action === 'help') {
        bot.sendMessage(chatId,
            `🆘 <b>Помощь</b>\n\n` +
            `📌 <b>Команды:</b>\n` +
            `/start — Главное меню\n\n` +
            `💡 <b>Как купить:</b>\n` +
            `1️⃣ Напиши /start\n` +
            `2️⃣ Выбери товар\n` +
            `3️⃣ Оплати звездами\n` +
            `4️⃣ Получи на сервере!\n\n` +
            `🔥 <b>СКИДКА 50% НА ВСЕ ПРИВИЛЕГИИ!</b>\n\n` +
            `⚠️ <b>Важно:</b>\n` +
            `• Оплата работает ТОЛЬКО в мобильном Telegram\n` +
            `• Нужна версия Telegram 10.0+\n` +
            `• Stars должны быть доступны в регионе\n\n` +
            `📞 По всем вопросам: @gokot`,
            { parse_mode: 'HTML' }
        );
        bot.answerCallbackQuery(query.id);
        return;
    }
});

// ========== ПОДТВЕРЖДЕНИЕ ПЛАТЕЖА ==========
bot.on('pre_checkout_query', (query) => {
    try {
        bot.answerPreCheckoutQuery(query.id, true);
        console.log(`✅ PreCheckout: ${query.from.username}`);
    } catch (e) {
        console.log('❌ PreCheckout ошибка:', e.message);
    }
});

// ========== УСПЕШНАЯ ОПЛАТА ==========
bot.on('successful_payment', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;
    const firstName = msg.from.first_name || 'Игрок';
    const payment = msg.successful_payment;
    
    console.log(`💎 УСПЕШНАЯ ОПЛАТА!`);
    console.log(`   Игрок: ${username}`);
    console.log(`   Сумма: ${payment.total_amount} ⭐`);
    
    try {
        const payload = JSON.parse(payment.payload);
        const itemKey = payload.item;
        
        // Ищем товар
        let item = null;
        let itemType = '';
        let discountText = '';
        
        if (itemKey.startsWith('kit_')) {
            const kitId = itemKey.replace('kit_', '');
            item = KITS[kitId];
            itemType = 'Кит';
        } else if (itemKey.startsWith('priv_')) {
            const privId = itemKey.replace('priv_', '');
            item = PRIVILEGES[privId];
            itemType = 'Привилегия';
            if (item.discount) {
                discountText = ` (со скидкой 50%)`;
            }
        }
        
        if (!item) {
            bot.sendMessage(chatId, '❌ Ошибка: неизвестный товар');
            return;
        }
        
        // Сохраняем покупку
        if (!userPurchases[userId]) {
            userPurchases[userId] = {
                totalSpent: 0,
                purchases: []
            };
        }
        userPurchases[userId].totalSpent += payment.total_amount;
        userPurchases[userId].purchases.push({
            name: item.name,
            amount: payment.total_amount
        });
        
        // ========== УВЕДОМЛЕНИЕ АДМИНИСТРАТОРУ ==========
        const adminText = 
            `✅ <b>НОВАЯ ПОКУПКА!</b>\n\n` +
            `👤 <b>Игрок:</b> ${firstName} (@${username || 'нет юзернейма'})\n` +
            `🆔 <b>ID:</b> ${userId}\n` +
            `📦 <b>Товар:</b> ${item.emoji} ${item.name}${discountText}\n` +
            `📋 <b>Тип:</b> ${itemType}\n` +
            `⭐ <b>Цена:</b> ${payment.total_amount} звезд\n` +
            `🆔 <b>Платеж:</b> ${payment.telegram_payment_charge_id}\n` +
            `📅 <b>Время:</b> ${new Date().toLocaleString()}\n\n` +
            `👤 <b>Связь с игроком:</b> @${username || 'нет юзернейма'}`;
        
        // Отправляем админу с упоминанием @gokot
        bot.sendMessage(ADMIN_ID, 
            `@gokot\n\n${adminText}`, 
            { parse_mode: 'HTML' }
        );
        
        // ========== УВЕДОМЛЕНИЕ ПОКУПАТЕЛЮ ==========
        const userText = 
            `✅ <b>Оплата прошла успешно!</b>\n\n` +
            `📦 ${item.emoji} ${item.name}\n` +
            `⭐ Списано: ${payment.total_amount} звезд\n` +
            `👤 Игрок: ${firstName}\n\n` +
            `🎮 <b>Товар выдан на сервер!</b>\n\n` +
            `📞 По вопросам: @gokot`;
        
        bot.sendMessage(chatId, userText, { parse_mode: 'HTML' });
        
    } catch (e) {
        console.log('❌ Ошибка обработки:', e.message);
        bot.sendMessage(chatId, '❌ Ошибка обработки платежа. Напиши @gokot');
    }
});

// ========== ЛОГИ ==========
bot.on('polling_error', (error) => {
    console.error('❌ Ошибка поллинга:', error);
});

console.log('✅ Бот готов!');
console.log('━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 Доступные разделы:');
console.log('   ⚔️ PvP Киты');
console.log('   👑 Привилегии 🔥-50%');
console.log('━━━━━━━━━━━━━━━━━━━━━');
console.log('🔥 СКИДКА 50% НА ВСЕ ПРИВИЛЕГИИ!');
console.log('📞 Уведомления админу: @gokot');
