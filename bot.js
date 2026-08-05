require('dotenv').config();
const Telegraf = require('telegraf').Telegraf;
const axios = require('axios');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Настройки
const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789_';
const USERNAME_LENGTH = 6;          // можно поставить 5, но шанс ниже
const MAX_ATTEMPTS = 300;
const DELAY_BETWEEN_CHECKS = 300;

// Генерация
function generateUsername() {
  let result = '';
  for (let i = 0; i < USERNAME_LENGTH; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

// Проверка через t.me
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
    console.warn(`Ошибка проверки ${username}: ${error.message}`);
    return true;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Основная функция
async function generateFreeUsername(ctx) {
  const statusMsg = await ctx.reply(
    `🔍 Ищу свободный username (${USERNAME_LENGTH} символов)...\nПроверено: 0 / ${MAX_ATTEMPTS}`
  );

  let checked = 0;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const username = generateUsername();
    checked++;

    const taken = await isUsernameTaken(username);

    if (checked % 10 === 0 || checked === MAX_ATTEMPTS) {
      await ctx.telegram.editMessageText(
        statusMsg.chat.id,
        statusMsg.message_id,
        null,
        `🔍 Ищу свободный username (${USERNAME_LENGTH} символов)...\nПроверено: ${checked} / ${MAX_ATTEMPTS}`
      ).catch(() => {});
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

  await ctx.telegram.editMessageText(
    statusMsg.chat.id,
    statusMsg.message_id,
    null,
    `❌ Не удалось найти свободный username за ${MAX_ATTEMPTS} попыток.\n` +
    `Попробуйте увеличить длину (сейчас ${USERNAME_LENGTH} символов) или запустите снова.`
  );
}

// Команды
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

// Запуск
bot.launch()
  .then(() => console.log('✅ Бот запущен'))
  .catch(err => console.error('❌ Ошибка:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
