require('dotenv').config();
const Telegraf = require('telegraf').Telegraf;
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);

// ===== НАСТРОЙКИ =====
const USERNAME_LENGTH = 5;
const HOW_MANY = 5;
const CHANCE_READABLE = 0.4;            // для обычной генерации

// Лимиты
const MAX_REGULAR = 5;   // обычная генерация – 5 раз в сутки
const MAX_BEAUTIFUL = 3; // красивая – 3 раза в сутки
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

// Админы (замените на свои ID)
const ADMIN_IDS = [123456789, 987654321];

// ===== БУКВЫ ДЛЯ КРАСИВЫХ ИМЁН =====
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const VOWELS = 'aeiouy';
// Словарные окончания и корни для реалистичности
const ROOTS = ['gok', 'dob', 'kiv', 'zep', 'ram', 'lun', 'sol', 'mir', 'tor', 'fel', 'kes', 'nix', 'vox', 'zax'];
const ENDINGS = ['ot', 'ex', 'ox', 'ix', 'ux', 'az', 'ez', 'oz', 'ar', 'er'];

// ===== РАБОТА С JSON =====
const DATA_FILE = 'data.json';

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE);
    return JSON.parse(raw);
  } catch {
    return { users: {} };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let data = loadData();

// ===== ГЕНЕРАЦИЯ СЛУЧАЙНОГО 5-ЗНАЧНОГО =====
function generateRandom() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
  let result = '';
  for (let i = 0; i < USERNAME_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ===== ГЕНЕРАЦИЯ ЧИТАЕМОГО (СЛОВАРНОГО) ИМЕНИ =====
function generateBeautiful() {
  // Берём корень + окончание, чтобы получить 5 букв
  const root = ROOTS[Math.floor(Math.random() * ROOTS.length)];
  let ending = ENDINGS[Math.floor(Math.random() * ENDINGS.length)];
  // Если корень + окончание > 5, обрезаем или подбираем
  let name = root + ending;
  if (name.length > USERNAME_LENGTH) {
    name = name.slice(0, USERNAME_LENGTH);
  } else if (name.length < USERNAME_LENGTH) {
    // Добавляем случайную гласную в середину
    const pos = Math.floor(name.length / 2);
    name = name.slice(0, pos) + VOWELS[Math.floor(Math.random() * VOWELS.length)] + name.slice(pos);
    name = name.slice(0, USERNAME_LENGTH);
  }
  return name;
}

// ===== ГЕНЕРАЦИЯ НАБОРА (обычная) =====
function generateRegular(count) {
  const set = new Set();
  while (set.size < count) {
    let name;
    if (Math.random() < CHANCE_READABLE) {
      name = generateBeautiful();
    } else {
      name = generateRandom();
    }
    set.add(name);
  }
  return Array.from(set);
}

// ===== ГЕНЕРАЦИЯ НАБОРА (только красивые) =====
function generateBeautifulSet(count) {
  const set = new Set();
  while (set.size < count) {
    const name = generateBeautiful();
    set.add(name);
  }
  return Array.from(set);
}

// ===== ПРОВЕРКА ЛИМИТОВ =====
function checkAndUpdateUser(userId, type) {
  // Админы и премиум – без лимитов
  if (ADMIN_IDS.includes(userId)) return { allowed: true };
  if (data.users[userId]?.unlimited) return { allowed: true };

  const now = Date.now();
  const user = data.users[userId] || {};
  const key = type === 'regular' ? 'regular' : 'beautiful';
  const max = type === 'regular' ? MAX_REGULAR : MAX_BEAUTIFUL;
  const lastKey = key + 'LastTime';
  const countKey = key + 'Count';

  // Если пользователь новый или прошло > 24ч – сбрасываем
  if (!user[lastKey] || (now - user[lastKey]) >= COOLDOWN_MS) {
    user[lastKey] = now;
    user[countKey] = 0;
    data.users[userId] = user;
    saveData(data);
    return { allowed: true };
  }

  if (user[countKey] < max) {
    user[countKey] += 1;
    user[lastKey] = now; // обновляем время последнего действия
    data.users[userId] = user;
    saveData(data);
    return { allowed: true };
  }

  // Лимит исчерпан
  const nextReset = user[lastKey] + COOLDOWN_MS;
  const remaining = nextReset - now;
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  const timeStr = `${hours}ч ${minutes}м ${seconds}с`;

  return {
    allowed: false,
    message: `⛔ Вы исчерпали суточный лимит (${max} раз).\nПовторите через ${timeStr}.`
  };
}

// ===== ОБЩАЯ ФУНКЦИЯ ГЕНЕРАЦИИ С АНИМАЦИЕЙ =====
async function generateWithAnimation(ctx, generatorFn, typeLabel, limit) {
  const userId = ctx.from.id;

  // Проверка лимитов
  const check = checkAndUpdateUser(userId, typeLabel);
  if (!check.allowed) {
    await ctx.reply(check.message);
    return;
  }

  // Анимация
  const statusMsg = await ctx.reply(`✨ Генерирую ${typeLabel} юзернеймы...`);

  const spinner = ['🌀', '🌟', '✨', '⭐', '🌙', '☀️', '💫', '⚡', '🎯', '🔥'];
  let spinIndex = 0;
  let elapsed = 0;
  const interval = 300; // мс

  // Обновляем сообщение с анимацией 10 раз
  for (let i = 0; i < 12; i++) {
    const icon = spinner[spinIndex % spinner.length];
    spinIndex++;
    await ctx.telegram.editMessageText(
      statusMsg.chat.id,
      statusMsg.message_id,
      null,
      `${icon} Генерирую ${typeLabel} имена...\n${'▰'.repeat(i % 5)}${'▱'.repeat(5 - (i % 5))}`
    ).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  // Генерируем имена
  const names = generatorFn(HOW_MANY);
  
  // Удаляем статусное сообщение
  await ctx.telegram.deleteMessage(statusMsg.chat.id, statusMsg.message_id).catch(() => {});

  // Финальный эффект (фейерверк)
  const effectMessages = [
    '🎉🔥 Вот они, забирайте! 🔥🎉',
    '✨💫 Идеальные имена для вас! 💫✨',
    '🏆 Топчик! Ловите! 🏆',
    '🌟 Ваши новые юзернеймы! 🌟'
  ];
  const randomEffect = effectMessages[Math.floor(Math.random() * effectMessages.length)];

  await ctx.reply(
    `🎊 ${randomEffect}\n\n` +
    names.map(n => `@${n}`).join('\n') +
    `\n\n💡 Осталось использований на сегодня: ${limit - 1}`
  );

  // Кнопки
  await ctx.reply(
    `Что дальше?`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎲 Ещё обычные', callback_data: 'generate_regular' }],
          [{ text: '✨ Ещё красивые', callback_data: 'generate_beautiful' }],
          [{ text: '📢 Канал', url: 'https://t.me/SunyWorld_me' }],
          [{ text: '⭐️ Купить безлимит', callback_data: 'buy_unlimited' }]
        ]
      }
    }
  );
}

// ===== ХЕНДЛЕРЫ ГЕНЕРАЦИИ =====
async function handleRegular(ctx) {
  await generateWithAnimation(ctx, generateRegular, 'обычные', MAX_REGULAR);
}

async function handleBeautiful(ctx) {
  await generateWithAnimation(ctx, generateBeautifulSet, 'красивые', MAX_BEAUTIFUL);
}

// ===== ИНФОРМАЦИЯ О ПОКУПКЕ =====
async function showBuyInfo(ctx) {
  await ctx.answerCbQuery();
  await ctx.reply(
    `💎 Купить бесконечную генерацию (снятие всех лимитов) можно у @gokot за 15 ⭐️.\n\nНапишите ему для оформления.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✉️ Написать @gokot', url: 'https://t.me/gokot' }],
          [{ text: '🔙 Назад', callback_data: 'back_to_menu' }]
        ]
      }
    }
  );
}

// ===== КОМАНДЫ =====
bot.start((ctx) => {
  ctx.reply(
    `👋 Привет! Я генерирую крутые 5-символьные username.\n\n` +
    `📌 Обычная генерация – 5 раз в сутки (смесь красивых и рандомных).\n` +
    `✨ Красивые юзернеймы – 3 раза в сутки (только словарные, как @gokot).\n\n` +
    `Выбери, что хочешь получить:`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎲 Обычные', callback_data: 'generate_regular' }],
          [{ text: '✨ Красивые', callback_data: 'generate_beautiful' }],
          [{ text: '📢 Канал', url: 'https://t.me/SunyWorld_me' }],
          [{ text: '⭐️ Купить безлимит', callback_data: 'buy_unlimited' }]
        ]
      }
    }
  );
});

bot.command('generate', async (ctx) => await handleRegular(ctx));
bot.command('beautiful', async (ctx) => await handleBeautiful(ctx));
bot.command('buy', async (ctx) => {
  await ctx.reply(
    `💎 Купить бесконечную генерацию можно у @gokot за 15 ⭐️.\n\nНапишите ему.`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✉️ Написать @gokot', url: 'https://t.me/gokot' }]
        ]
      }
    }
  );
});
bot.command('admingokot', async (ctx) => {
  if (ADMIN_IDS.includes(ctx.from.id)) {
    await ctx.reply('✅ Админ-режим активирован.');
  } else {
    await ctx.reply('❌ Нет прав.');
  }
});

// ===== ДЕЙСТВИЯ КНОПОК =====
bot.action('generate_regular', async (ctx) => {
  await ctx.answerCbQuery();
  await handleRegular(ctx);
});

bot.action('generate_beautiful', async (ctx) => {
  await ctx.answerCbQuery();
  await handleBeautiful(ctx);
});

bot.action('buy_unlimited', async (ctx) => {
  await showBuyInfo(ctx);
});

bot.action('back_to_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('🔙 Возвращаемся в главное меню. Отправьте /start.');
});

// ===== ЗАПУСК =====
bot.launch()
  .then(() => console.log('✅ Бот запущен (5-значные, две вкладки, анимация)'))
  .catch(err => console.error('❌ Ошибка:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
