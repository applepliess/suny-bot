require('dotenv').config();
const Telegraf = require('telegraf').Telegraf;
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);

// ===== НАСТРОЙКИ =====
const USERNAME_LENGTH = 5;
const HOW_MANY = 5;
const CHANCE_READABLE = 0.4;
const MAX_GENERATIONS = 5;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const ADMIN_IDS = [123456789, 987654321]; // замените на свои ID

// ===== БУКВЫ ДЛЯ ГЕНЕРАЦИИ =====
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const VOWELS = 'aeiouy';
const ENDINGS = ['ex', 'ox', 'ix', 'ux', 'ax', 'ez', 'oz'];

// ===== РАБОТА С JSON-ФАЙЛОМ (лимиты и премиум) =====
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

// ===== ГЕНЕРАЦИЯ ИМЁН =====
function generateRandom() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
  let result = '';
  for (let i = 0; i < USERNAME_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateReadable() {
  const pattern = Math.random() < 0.5 ? 'CVCVC' : 'VCVCV';
  let result = '';
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === 'C') {
      result += CONSONANTS.charAt(Math.floor(Math.random() * CONSONANTS.length));
    } else {
      result += VOWELS.charAt(Math.floor(Math.random() * VOWELS.length));
    }
  }
  if (Math.random() < 0.3) {
    const ending = ENDINGS[Math.floor(Math.random() * ENDINGS.length)];
    result = result.slice(0, 3) + ending;
  }
  return result;
}

function generateUsernames(count) {
  const set = new Set();
  while (set.size < count) {
    let name;
    if (Math.random() < CHANCE_READABLE) {
      name = generateReadable();
    } else {
      name = generateRandom();
    }
    set.add(name);
  }
  return Array.from(set);
}

// ===== ЛИМИТЫ (с учётом премиум-статуса) =====
function checkAndUpdateUser(userId) {
  // Админы и премиум – без лимитов
  if (ADMIN_IDS.includes(userId)) return { allowed: true };
  if (data.users[userId]?.unlimited) return { allowed: true };

  const now = Date.now();
  let user = data.users[userId];
  if (!user || (now - user.lastTime) >= COOLDOWN_MS) {
    data.users[userId] = { count: 0, lastTime: now };
    saveData(data);
    return { allowed: true };
  }

  if (user.count < MAX_GENERATIONS) {
    user.count += 1;
    user.lastTime = now;
    saveData(data);
    return { allowed: true };
  }

  const nextReset = user.lastTime + COOLDOWN_MS;
  const remaining = nextReset - now;
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  const timeStr = `${hours}ч ${minutes}м ${seconds}с`;

  return {
    allowed: false,
    message: `⛔ Вы исчерпали лимит (${MAX_GENERATIONS} генераций в сутки).\nПовторите через ${timeStr}.\n\nИли купите бесконечную генерацию у @gokot за 15⭐️.`,
    showBuyButton: true
  };
}

// ===== ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ (БЕЗ ПРОВЕРКИ ПОДПИСКИ) =====
async function handleGenerate(ctx) {
  const userId = ctx.from.id;

  // Проверка лимитов
  const check = checkAndUpdateUser(userId);
  if (!check.allowed) {
    const buttons = [
      [{ text: '🎲 Сгенерировать ещё', callback_data: 'generate_more' }]
    ];
    if (check.showBuyButton) {
      buttons.push([{ text: '⭐️ Купить бесконечную генерацию', callback_data: 'buy_unlimited' }]);
    }
    await ctx.reply(check.message, { reply_markup: { inline_keyboard: buttons } });
    return;
  }

  // Генерация имён
  const names = generateUsernames(HOW_MANY);
  const reply = names.map(n => `@${n}`).join('\n');

  await ctx.reply(
    `✨ Вот ${HOW_MANY} случайных username:\n${reply}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎲 Сгенерировать ещё', callback_data: 'generate_more' }],
          [{ text: '📢 Подписаться на канал', url: 'https://t.me/SunyWorld_me' }],
          [{ text: '⭐️ Купить бесконечную генерацию', callback_data: 'buy_unlimited' }]
        ]
      }
    }
  );
}

// ===== ИНФОРМАЦИОННОЕ МЕНЮ ПОКУПКИ =====
async function showBuyInfo(ctx) {
  await ctx.answerCbQuery();
  await ctx.reply(
    `💎 Купить бесконечную генерацию можно у @gokot за 15 ⭐️.\n\nНапишите ему для оформления.`,
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
    `👋 Привет! Я генерирую 5-символьные username.\n` +
    `У вас есть ${MAX_GENERATIONS} генераций в сутки.\n\n` +
    `Подпишитесь на наш канал, чтобы быть в курсе (не обязательно для генерации).`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎲 Сгенерировать', callback_data: 'generate_more' }],
          [{ text: '📢 Подписаться на канал', url: 'https://t.me/SunyWorld_me' }],
          [{ text: '⭐️ Купить бесконечную генерацию', callback_data: 'buy_unlimited' }]
        ]
      }
    }
  );
});

bot.command('generate', async (ctx) => await handleGenerate(ctx));
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

bot.hears(/generate|сгенерировать/i, async (ctx) => await handleGenerate(ctx));

// ===== ДЕЙСТВИЯ КНОПОК =====
bot.action('generate_more', async (ctx) => {
  await ctx.answerCbQuery();
  await handleGenerate(ctx);
});

bot.action('buy_unlimited', async (ctx) => {
  await showBuyInfo(ctx);
});

bot.action('back_to_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('🔙 Возвращаемся в главное меню. Отправьте /start или /generate.');
});

// ===== ЗАПУСК =====
bot.launch()
  .then(() => console.log('✅ Бот запущен (без проверки подписки)'))
  .catch(err => console.error('❌ Ошибка:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
