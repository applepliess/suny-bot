require('dotenv').config();
const Telegraf = require('telegraf').Telegraf;
const axios = require('axios');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);

// ===== НАСТРОЙКИ =====
const USERNAME_LENGTH = 6;            // теперь 6 символов
const HOW_MANY = 5;
const CHANCE_READABLE = 0.4;
const MAX_GENERATIONS = 5;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS_PER_GENERATION = 50; // больше попыток
const ADMIN_IDS = [123456789, 987654321]; // замените на свои ID

// ===== БУКВЫ ДЛЯ ГЕНЕРАЦИИ =====
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const VOWELS = 'aeiouy';
const ENDINGS = ['ex', 'ox', 'ix', 'ux', 'ax', 'ez', 'oz'];

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
  // Генерируем читаемое имя длиной 6 символов
  let result = '';
  if (Math.random() < 0.5) {
    // Схема CVCVCV (согласная-гласная-согласная-гласная-согласная-гласная)
    for (let i = 0; i < 6; i++) {
      if (i % 2 === 0) {
        result += CONSONANTS.charAt(Math.floor(Math.random() * CONSONANTS.length));
      } else {
        result += VOWELS.charAt(Math.floor(Math.random() * VOWELS.length));
      }
    }
  } else {
    // Схема CVCCVC (согласная-гласная-согласная-согласная-гласная-согласная)
    result += CONSONANTS.charAt(Math.floor(Math.random() * CONSONANTS.length));
    result += VOWELS.charAt(Math.floor(Math.random() * VOWELS.length));
    result += CONSONANTS.charAt(Math.floor(Math.random() * CONSONANTS.length));
    result += CONSONANTS.charAt(Math.floor(Math.random() * CONSONANTS.length));
    result += VOWELS.charAt(Math.floor(Math.random() * VOWELS.length));
    result += CONSONANTS.charAt(Math.floor(Math.random() * CONSONANTS.length));
  }
  // Иногда добавляем популярное окончание
  if (Math.random() < 0.3) {
    const ending = ENDINGS[Math.floor(Math.random() * ENDINGS.length)];
    result = result.slice(0, 4) + ending; // первые 4 + окончание из 2 = 6
  }
  return result;
}

function generateOne() {
  return Math.random() < CHANCE_READABLE ? generateReadable() : generateRandom();
}

// ===== ПРОВЕРКА ЗАНЯТОСТИ =====
async function isUsernameTaken(username) {
  try {
    const url = `https://t.me/${username}`;
    const response = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 0,
      validateStatus: false,
    });
    return response.status !== 404;
  } catch (error) {
    console.error(`Ошибка проверки ${username}:`, error.message);
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

// ===== ОСНОВНАЯ ГЕНЕРАЦИЯ С АНИМАЦИЕЙ =====
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

  // Статусное сообщение с анимацией
  const statusMsg = await ctx.reply('⏳ Генерирую и проверяю свободные username...');

  let found = [];
  let attempts = 0;
  const usedNames = new Set();
  const spinner = ['🔍', '🕵️', '🔎', '🧐', '⏳', '⚡', '✨'];
  let spinIndex = 0;

  while (found.length < HOW_MANY && attempts < MAX_ATTEMPTS_PER_GENERATION) {
    attempts++;
    let name = generateOne();
    if (usedNames.has(name)) continue;
    usedNames.add(name);

    const taken = await isUsernameTaken(name);
    if (!taken) {
      found.push(name);
    }

    // Анимация – обновляем сообщение каждые 2 попытки
    if (attempts % 2 === 0 || attempts === MAX_ATTEMPTS_PER_GENERATION) {
      const icon = spinner[spinIndex % spinner.length];
      spinIndex++;
      await ctx.telegram.editMessageText(
        statusMsg.chat.id,
        statusMsg.message_id,
        null,
        `${icon} Ищу свободные имена (${USERNAME_LENGTH} символов)...\nПроверено: ${attempts}, найдено: ${found.length}`
      ).catch(() => {});
    }
  }

  // Удаляем статусное сообщение
  await ctx.telegram.deleteMessage(statusMsg.chat.id, statusMsg.message_id).catch(() => {});

  // Формируем ответ
  let reply;
  if (found.length === 0) {
    reply = `😞 Не удалось найти ни одного свободного ${USERNAME_LENGTH}-символьного username.\n` +
            `Попробуйте ещё раз или измените длину (сейчас ${USERNAME_LENGTH}).\n` +
            `Все короткие имена могут быть заняты.`;
  } else {
    reply = `✨ Нашёл ${found.length} свободных username (${USERNAME_LENGTH} символов):\n` +
            found.map(n => `@${n}`).join('\n');
    if (found.length < HOW_MANY) {
      reply += `\n\n⚠️ Удалось найти только ${found.length} из ${HOW_MANY} (остальные заняты).`;
    }
  }

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
  .then(() => console.log('✅ Бот запущен (6 символов, анимация)'))
  .catch(err => console.error('❌ Ошибка:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
