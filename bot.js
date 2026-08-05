require('dotenv').config();
const Telegraf = require('telegraf').Telegraf;

const bot = new Telegraf(process.env.BOT_TOKEN);

// ===== НАСТРОЙКИ =====
const USERNAME_LENGTH = 5;
const HOW_MANY = 5;              // сколько вариантов выдавать за раз
const CHANCE_READABLE = 0.4;     // 40% что сгенерируется красивое имя

// ===== БУКВЫ ДЛЯ КРАСИВЫХ ИМЁН =====
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const VOWELS = 'aeiouy';
// Популярные окончания (дополнительные 2 буквы, чтобы получилось 5)
const ENDINGS = ['ex', 'ox', 'ix', 'ux', 'ax', 'ez', 'oz'];

// ===== ГЕНЕРАЦИЯ СЛУЧАЙНОГО НАБОРА (старый способ) =====
function generateRandom() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
  let result = '';
  for (let i = 0; i < USERNAME_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ===== ГЕНЕРАЦИЯ ЧИТАЕМОГО ИМЕНИ (CVCVC) =====
function generateReadable() {
  // Случайно выбираем структуру:
  const pattern = Math.random() < 0.5 ? 'CVCVC' : 'VCVCV';
  let result = '';
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === 'C') {
      result += CONSONANTS.charAt(Math.floor(Math.random() * CONSONANTS.length));
    } else {
      result += VOWELS.charAt(Math.floor(Math.random() * VOWELS.length));
    }
  }
  // Иногда добавляем популярное окончание, меняя последние 2 буквы
  if (Math.random() < 0.3) {
    const ending = ENDINGS[Math.floor(Math.random() * ENDINGS.length)];
    result = result.slice(0, 3) + ending; // первые 3 + окончание из 2 букв
  }
  return result;
}

// ===== ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ НАБОРА =====
function generateUsernames(count) {
  const set = new Set();
  while (set.size < count) {
    let name;
    // С вероятностью CHANCE_READABLE генерируем красивое имя
    if (Math.random() < CHANCE_READABLE) {
      name = generateReadable();
    } else {
      name = generateRandom();
    }
    set.add(name);
  }
  return Array.from(set);
}

// ===== КОМАНДЫ БОТА =====
bot.start((ctx) => {
  ctx.reply(
    `👋 Привет! Я генерирую 5-символьные username, включая красивые (например @gokot).\n` +
    `Отправь /generate или нажми кнопку, чтобы получить ${HOW_MANY} вариантов.`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: '🎲 Сгенерировать', callback_data: 'generate' }]],
      },
    }
  );
});

bot.command('generate', async (ctx) => {
  const names = generateUsernames(HOW_MANY);
  const reply = names.map(n => `@${n}`).join('\n');
  await ctx.reply(`✨ Вот ${HOW_MANY} случайных username:\n${reply}`);
});

bot.hears(/generate|сгенерировать/i, async (ctx) => {
  const names = generateUsernames(HOW_MANY);
  const reply = names.map(n => `@${n}`).join('\n');
  await ctx.reply(`✨ Вот ${HOW_MANY} случайных username:\n${reply}`);
});

bot.action('generate', async (ctx) => {
  await ctx.answerCbQuery();
  const names = generateUsernames(HOW_MANY);
  const reply = names.map(n => `@${n}`).join('\n');
  await ctx.reply(`✨ Вот ${HOW_MANY} случайных username:\n${reply}`);
});

// ===== ЗАПУСК =====
bot.launch()
  .then(() => console.log('✅ Бот запущен (с красивыми именами)'))
  .catch(err => console.error('❌ Ошибка:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
