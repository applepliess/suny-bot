require('dotenv').config();
const Telegraf = require('telegraf').Telegraf;
const axios = require('axios');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);

// ===== НАСТРОЙКИ =====
const USERNAME_LENGTH = 6;          // теперь 6 символов (шанс найти свободный выше)
const HOW_MANY = 5;
const CHANCE_READABLE = 0.4;
const MAX_GENERATIONS = 5;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS_PER_GENERATION = 100; // больше попыток
const ADMIN_IDS = [123456789, 987654321];

// ===== БУКВЫ ДЛЯ ГЕНЕРАЦИИ =====
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const VOWELS = 'aeiouy';
const ENDINGS = ['ex', 'ox', 'ix', 'ux', 'ax', 'ez', 'oz'];

// ===== РАБОТА С JSON-ФАЙЛОМ =====
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

// ===== КЭШ ПРОВЕРЕННЫХ ИМЁН (за один сеанс) =====
const checkedCache = new Map();

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

function generateOne() {
  return Math.random() < CHANCE_READABLE ? generateReadable() : generateRandom();
}

// ===== ПРОВЕРКА ЗАНЯТОСТИ С КЭШЕМ =====
async function isUsernameTaken(username) {
  // Проверяем кэш
  if (checkedCache.has(username)) {
    return checkedCache.get(username);
  }

  try {
    const url = `https://t.me/${username}`;
    const response = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 0,
      validateStatus: false,
    });
    const taken = response.status !== 404;
    checkedCache.set(username, taken);
    return taken;
  } catch (error) {
    console.error(`Ошибка проверки ${username}:`, error.message);
    // При ошибке считаем занятым и кэшируем, чтобы не повторять
    checkedCache.set(username, true);
    return true;
  }
}

// ===== ЛИМИТЫ =====
function checkAndUpdateUser(userId) {
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

// ===== ОСНОВНАЯ ГЕНЕРАЦИЯ С АВТОПРОВЕРКОЙ =====
async function handleGenerate(ctx) {
  const userId = ctx.from.id;

  const check = checkAndUpdateUser(userId);
  if (!check.allowed) {
    const buttons = [
      [{ text: '🎲 Попробовать позже', callback_data: 'generate_more' }]
    ];
    if (check.showBuyButton) {
      buttons.push([{ text: '⭐️ Купить бесконечную генерацию', callback_data: 'buy_unlimited' }]);
    }
    await ctx.reply(check.message, { reply_markup: { inline_keyboard: buttons } });
    return;
  }

  const statusMsg = await ctx.reply('🔍 Генерирую и проверяю свободные username...');

  let found = [];
  let attempts = 0;
  const usedNames = new Set();

  while (found.length < HOW_MANY && attempts < MAX_ATTEMPTS_PER_GENERATION) {
    attempts++;
    let name = generateOne();
    if (usedNames.has(name)) continue;
    usedNames.add(name);

    const taken = await isUsernameTaken(name);
    if (!taken) {
      found.push(name);
    }

    if (attempts % 10 === 0 || attempts === MAX_ATTEMPTS_PER_GENERATION) {
      await ctx.telegram.editMessageText(
        statusMsg.chat.id,
        statusMsg.message_id,
        null,
        `🔍 Ищу свободные имена... (проверено ${attempts}, найдено ${found.length})`
      ).catch(() => {});
    }
  }

  // Формируем ответ
  let reply;
  if (found.length === 0) {
    reply = '😞 Не удалось найти ни одного свободного username длиной ' + USERNAME_LENGTH + '. Попробуйте ещё раз.';
  } else {
    reply = `✨ Нашёл ${found.length} свободных username:\n` + found.map(n => `@${n}`).join('\n');
    if (found.length < HOW_MANY) {
      reply += `\n\n⚠️ Удалось найти только ${found.length} из ${HOW_MANY} (остальные заняты).`;
    }
  }

  await ctx.telegram.deleteMessage(statusMsg.chat.id, statusMsg.message_id).catch(() => {});

  await ctx.reply(
    reply,
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
    `👋 Привет! Я генерирую ${USERNAME_LENGTH}-символьные username и сразу проверяю, свободны ли они.\n` +
    `У вас есть ${MAX_GENERATIONS} генераций в сутки.\n` +
    `Каждая генерация пытается найти ${HOW_MANY} свободных имён.`,
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
  .then(() => console.log('✅ Бот запущен (6 символов, автопроверка)'))
  .catch(err => console.error('❌ Ошибка:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
