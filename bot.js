require('dotenv').config();
const Telegraf = require('telegraf').Telegraf;

const bot = new Telegraf(process.env.BOT_TOKEN);

// ===== НАСТРОЙКИ =====
const USERNAME_LENGTH = 5;
const HOW_MANY = 5;
const CHANCE_READABLE = 0.4;

// Лимиты
const MAX_GENERATIONS = 5;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 часа

// Админы (укажите свои числовые Telegram ID)
const ADMIN_IDS = [8579640456, 8579640456]; // замените на свои

// ===== БУКВЫ ДЛЯ КРАСИВЫХ ИМЁН =====
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const VOWELS = 'aeiouy';
const ENDINGS = ['ex', 'ox', 'ix', 'ux', 'ax', 'ez', 'oz'];

// ===== ХРАНИЛИЩЕ СОСТОЯНИЙ ПОЛЬЗОВАТЕЛЕЙ =====
// Ключ – userId, значение – { count, lastTime }
const userState = new Map();

// ===== ГЕНЕРАЦИЯ СЛУЧАЙНОГО НАБОРА =====
function generateRandom() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
  let result = '';
  for (let i = 0; i < USERNAME_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ===== ГЕНЕРАЦИЯ ЧИТАЕМОГО ИМЕНИ =====
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

// ===== ГЕНЕРАЦИЯ НАБОРА ИМЁН =====
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

// ===== ПРОВЕРКА И ОБНОВЛЕНИЕ СОСТОЯНИЯ ПОЛЬЗОВАТЕЛЯ =====
function checkAndUpdateUser(userId) {
  // Админы – всегда могут генерировать
  if (ADMIN_IDS.includes(userId)) {
    return { allowed: true };
  }

  const now = Date.now();
  const state = userState.get(userId);

  // Если пользователь новый или прошло больше 24 часов – сбрасываем
  if (!state || (now - state.lastTime) >= COOLDOWN_MS) {
    userState.set(userId, { count: 0, lastTime: now });
    return { allowed: true };
  }

  // Если лимит ещё не исчерпан
  if (state.count < MAX_GENERATIONS) {
    state.count += 1;
    state.lastTime = now; // обновляем время последнего действия (опционально)
    userState.set(userId, state);
    return { allowed: true };
  }

  // Лимит исчерпан – вычисляем время до разблокировки
  const nextReset = state.lastTime + COOLDOWN_MS;
  const remaining = nextReset - now;
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  const timeStr = `${hours}ч ${minutes}м ${seconds}с`;

  return {
    allowed: false,
    message: `⛔ Вы исчерпали лимит (${MAX_GENERATIONS} генераций в сутки).\nПовторите через ${timeStr}.`
  };
}

// ===== ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ (вызывается из команд / кнопок) =====
async function handleGenerate(ctx) {
  const userId = ctx.from.id;

  const check = checkAndUpdateUser(userId);
  if (!check.allowed) {
    await ctx.reply(check.message);
    return;
  }

  const names = generateUsernames(HOW_MANY);
  const reply = names.map(n => `@${n}`).join('\n');

  // Кнопка "Сгенерировать ещё"
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎲 Сгенерировать ещё', callback_data: 'generate_more' }]
      ]
    }
  };

  await ctx.reply(
    `✨ Вот ${HOW_MANY} случайных username:\n${reply}`,
    keyboard
  );
}

// ===== КОМАНДЫ =====
bot.start((ctx) => {
  ctx.reply(
    `👋 Привет! Я генерирую 5-символьные username, включая красивые.\n` +
    `У вас есть ${MAX_GENERATIONS} генераций в сутки.\n` +
    `Отправь /generate или нажми кнопку ниже.`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: '🎲 Сгенерировать', callback_data: 'generate_more' }]],
      },
    }
  );
});

// Команда /generate
bot.command('generate', async (ctx) => {
  await handleGenerate(ctx);
});

// Команда /admingokot – просто подтверждение (админы и так могут генерировать без ограничений)
bot.command('admingokot', async (ctx) => {
  if (ADMIN_IDS.includes(ctx.from.id)) {
    await ctx.reply('✅ Админ-режим активирован. Вы можете генерировать без лимита.');
  } else {
    await ctx.reply('❌ У вас нет прав администратора.');
  }
});

// Обработка текстовых команд (хеары)
bot.hears(/generate|сгенерировать/i, async (ctx) => {
  await handleGenerate(ctx);
});

// Обработка нажатия на кнопку "Сгенерировать ещё"
bot.action('generate_more', async (ctx) => {
  await ctx.answerCbQuery(); // убираем "часики"
  await handleGenerate(ctx);
});

// ===== ЗАПУСК =====
bot.launch()
  .then(() => console.log('✅ Бот запущен (с лимитами и админами)'))
  .catch(err => console.error('❌ Ошибка:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
