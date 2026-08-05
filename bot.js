require('dotenv').config();
const Telegraf = require('telegraf').Telegraf;

const bot = new Telegraf(process.env.BOT_TOKEN);

// Настройки
const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789_';
const USERNAME_LENGTH = 5;
const HOW_MANY = 5; // количество вариантов за раз

// Генерация одного username
function generateUsername() {
  let result = '';
  for (let i = 0; i < USERNAME_LENGTH; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

// Генерация нескольких уникальных (по возможности)
function generateUsernames(count) {
  const set = new Set();
  while (set.size < count) {
    set.add(generateUsername());
  }
  return Array.from(set);
}

// Команда /start
bot.start((ctx) => {
  ctx.reply(
    `👋 Привет! Я генерирую случайные 5-символьные username.\n` +
    `Отправь /generate или нажми кнопку, чтобы получить ${HOW_MANY} вариантов.`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: '🎲 Сгенерировать', callback_data: 'generate' }]],
      },
    }
  );
});

// Команда /generate
bot.command('generate', async (ctx) => {
  const names = generateUsernames(HOW_MANY);
  const reply = names.map(n => `@${n}`).join('\n');
  await ctx.reply(`✨ Вот ${HOW_MANY} случайных username:\n${reply}`);
});

// Обработка текстовых команд
bot.hears(/generate|сгенерировать/i, async (ctx) => {
  const names = generateUsernames(HOW_MANY);
  const reply = names.map(n => `@${n}`).join('\n');
  await ctx.reply(`✨ Вот ${HOW_MANY} случайных username:\n${reply}`);
});

// Нажатие на кнопку
bot.action('generate', async (ctx) => {
  await ctx.answerCbQuery();
  const names = generateUsernames(HOW_MANY);
  const reply = names.map(n => `@${n}`).join('\n');
  await ctx.reply(`✨ Вот ${HOW_MANY} случайных username:\n${reply}`);
});

// Запуск
bot.launch()
  .then(() => console.log('✅ Бот запущен (генератор без проверки)'))
  .catch(err => console.error('❌ Ошибка:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
