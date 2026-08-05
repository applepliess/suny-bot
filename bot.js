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

// Проверка занятости через t.me (статус 404 → свободен)
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
