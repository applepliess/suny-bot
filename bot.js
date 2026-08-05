require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Настройки генерации
const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789_';
const USERNAME_LENGTH = 5;
const MAX_ATTEMPTS = 50;          // максимум попыток на один запрос
const DELAY_BETWEEN_CHECKS = 500; // задержка между проверками (мс)

// Генерация случайного username
function generateUsername() {
  let result = '';
  for (let i = 0; i < USERNAME_LENGTH; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

// Проверка занятости через t.me (статус 404 → свободен)require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);

// ===== НАСТРОЙКИ (меняйте под себя) =====
const USERNAME_LENGTH = 6;          // теперь 6 символов (можно 5, но шанс ниже)
const MAX_ATTEMPTS = 300;           // больше попыток
const DELAY_BETWEEN_CHECKS = 300;   // чуть быстрее (300 мс)
const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789_';

// ===== ГЕНЕРАЦИЯ =====
function generateUsername() {
  let result = '';
  for (let i = 0; i < USERNAME_LENGTH; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

// ===== ПРОВЕРКА ЧЕРЕЗ t.me =====
async function isUsernameTaken(username) {
  try {
    const url = `https://t.me/${username}`;
    const response = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 0,
      validateStatus: false,
    });
    // Если статус 404 – username свободен
    return response.status !== 404;
  } catch (error) {
    // При любой ошибке считаем занятым, чтобы не рисковать
    console.warn(`Ошибка при проверке ${username}: ${error.message}`);
    return true;
  }
}

// ===== ЗАДЕРЖКА =====
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== ОСНОВНАЯ ФУНКЦИЯ ПОИСКА =====
async function generateFreeUsername(ctx) {
  const statusMsg = await ctx.reply(
    `🔍 Ищу свободный username (${USERNAME_LENGTH} символов)...\nПроверено: 0 / ${MAX_ATTEMPTS}`
  );

  let attempts = 0;
  let checked = 0;

  while (attempts < MAX_ATTEMPTS) {
    const username = generateUsername();
    attempts++;
    checked++;

    const taken = await isUsernameTaken(username);

    // Обновляем сообщение с прогрессом (каждые 10 попыток, чтобы не спамить)
    if (checked % 10 === 0 || checked === MAX_ATTEMPTS) {
      await ctx.telegram.editMessageText(
        statusMsg.chat.id,
        statusMsg.message_id,
        null,
        `🔍 Ищу свободный username (${USERNAME_LENGTH} символов)...\nПроверено: ${checked} / ${MAX_ATTEMPTS}`
      ).catch(() => {}); // игнорируем ошибки обновления
    }

    if (!taken) {
      await ctx.telegram.editMessageText(
        statusMsg.chat.id,
        statusMsg.message_id,
        null,
        `✅ Найден свободный username:\n@${username}\n\nОн доступен для регистрации!`
      );
      return;
    }

    await sleep(DELAY_BETWEEN_CHECKS);
  }

  // Если не нашли за отведённое число попыток
  await ctx.telegram.editMessageText(
    statusMsg.chat.id,
    statusMsg.message_id,
    null,
    `❌ Не удалось найти свободный username за ${MAX_ATTEMPTS} попыток.\n` +
    `Попробуйте увеличить длину (сейчас ${USERNAME_LENGTH} символов) или запустите снова.`
  );
}

// ===== КОМАНДЫ =====
bot.start((ctx) => {
  ctx.reply(
    `👋 Привет! Я ищу свободные username длиной ${USERNAME_LENGTH} символов.\n` +
    'Отправь /generate или нажми кнопку ниже.',
    {
      reply_markup: {
        inline_keyboard: [[{ text: '🎲 Сгенерировать', callback_data: 'generate' }]],
      },
    }
  );
});

bot.command('generate', async (ctx) => {
  await generateFreeUsername(ctx);
});

bot.hears(/generate|сгенерировать/i, async (ctx) => {
  await generateFreeUsername(ctx);
});

bot.action('generate', async (ctx) => {
  await ctx.answerCbQuery();
  await generateFreeUsername(ctx);
});

// ===== ЗАПУСК =====
bot.launch()
  .then(() => console.log('✅ Бот запущен'))
  .catch(err => console.error('❌ Ошибка:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
async function isUsernameTaken(username) {
  try {
    const url = `https://t.me/${username}`;
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 0,
      validateStatus: false,
    });
    return response.status !== 404;
  } catch (error) {
    console.error(`Ошибка проверки ${username}:`, error.message);
    return true; // при ошибке считаем занятым
  }
}

// Вспомогательная задержка
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Основная функция поиска свободного username
async function generateFreeUsername(ctx) {
  const statusMsg = await ctx.reply('🔍 Ищу свободный username...');
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    const username = generateUsername();
    const taken = await isUsernameTaken(username);

    if (!taken) {
      await ctx.telegram.editMessageText(
        statusMsg.chat.id,
        statusMsg.message_id,
        null,
        `✅ Найден свободный username: @${username}\n\nОн доступен для регистрации!`
      );
      return;
    }

    attempts++;
    await sleep(DELAY_BETWEEN_CHECKS);
  }

  await ctx.telegram.editMessageText(
    statusMsg.chat.id,
    statusMsg.message_id,
    null,
    `❌ Не удалось найти свободный username за ${MAX_ATTEMPTS} попыток. Попробуйте позже.`
  );
}

// Команда /start – приветствие и кнопка
bot.start((ctx) => {
  ctx.reply(
    '👋 Привет! Я помогу найти свободный 5-символьный username в Telegram.\n' +
    'Отправь /generate или нажми на кнопку ниже, чтобы начать поиск.',
    {
      reply_markup: {
        inline_keyboard: [[{ text: '🎲 Сгенерировать', callback_data: 'generate' }]],
      },
    }
  );
});

// Команда /generate
bot.command('generate', async (ctx) => {
  await generateFreeUsername(ctx);
});

// Реакция на текстовые сообщения "generate" или "сгенерировать"
bot.hears(/generate|сгенерировать/i, async (ctx) => {
  await generateFreeUsername(ctx);
});

// Обработка нажатия на кнопку
bot.action('generate', async (ctx) => {
  await ctx.answerCbQuery();
  await generateFreeUsername(ctx);
});

// Запуск бота
bot.launch()
  .then(() => console.log('✅ Бот запущен'))
  .catch((err) => console.error('❌ Ошибка запуска:', err));

// Корректное завершение
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
