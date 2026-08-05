require('dotenv').config();
const Telegraf = require('telegraf').Telegraf;

const bot = new Telegraf(process.env.BOT_TOKEN);

// ===== НАСТРОЙКИ =====
const USERNAME_LENGTH = 5;
const HOW_MANY = 5;
const CHANCE_READABLE = 0.4;
const MAX_GENERATIONS = 5;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 часа

// ID канала (можно использовать @username)
const CHANNEL_ID = '@SunyWorld_me'; // или числовой ID, если знаете

// Админы (укажите свои числовые Telegram ID)
const ADMIN_IDS = [8579640456, 8579640456]; // замените на свои

// ===== БУКВЫ ДЛЯ КРАСИВЫХ ИМЁН =====
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const VOWELS = 'aeiouy';
const ENDINGS = ['ex', 'ox', 'ix', 'ux', 'ax', 'ez', 'oz'];

// ===== ХРАНИЛИЩЕ СОСТОЯНИЙ ПОЛЬЗОВАТЕЛЕЙ =====
const userState = new Map();

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

// ===== ПРОВЕРКА ПОДПИСКИ =====
async function checkSubscription(ctx) {
  const userId = ctx.from.id;

  // Админы могут генерировать без подписки
  if (ADMIN_IDS.includes(userId)) return true;

  try {
    const chatMember = await ctx.telegram.getChatMember(CHANNEL_ID, userId);
    const status = chatMember.status;
    // Если пользователь участник, администратор или создатель – подписан
    return ['member', 'administrator', 'creator'].includes(status);
  } catch (error) {
    console.error('Ошибка проверки подписки:', error.message);
    // Если бот не может проверить (не добавлен в канал) – пропускаем проверку
    // В продакшене лучше вернуть false и попросить добавить бота
    return false;
  }
}

// ===== ЛИМИТЫ ПОЛЬЗОВАТЕЛЯ =====
function checkAndUpdateUser(userId) {
  if (ADMIN_IDS.includes(userId)) {
    return { allowed: true };
  }

  const now = Date.now();
  const state = userState.get(userId);

  if (!state || (now - state.lastTime) >= COOLDOWN_MS) {
    userState.set(userId, { count: 0, lastTime: now });
    return { allowed: true };
  }

  if (state.count < MAX_GENERATIONS) {
    state.count += 1;
    state.lastTime = now;
    userState.set(userId, state);
    return { allowed: true };
  }

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

// ===== ОСНОВНАЯ ФУНКЦИЯ ГЕНЕРАЦИИ =====
async function handleGenerate(ctx) {
  const userId = ctx.from.id;

  // 1. Проверка подписки
  const isSubscribed = await checkSubscription(ctx);
  if (!isSubscribed) {
    await ctx.reply(
      `❌ Для использования бота подпишитесь на наш канал:\n${CHANNEL_ID}\n\nПосле подписки нажмите кнопку «Проверить» ниже.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📢 Подписаться', url: 'https://t.me/SunyWorld_me' }],
            [{ text: '✅ Проверить подписку', callback_data: 'check_sub' }]
          ]
        }
      }
    );
    return;
  }

  // 2. Проверка лимитов
  const check = checkAndUpdateUser(userId);
  if (!check.allowed) {
    await ctx.reply(check.message);
    return;
  }

  // 3. Генерация
  const names = generateUsernames(HOW_MANY);
  const reply = names.map(n => `@${n}`).join('\n');

  await ctx.reply(
    `✨ Вот ${HOW_MANY} случайных username:\n${reply}`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎲 Сгенерировать ещё', callback_data: 'generate_more' }]
        ]
      }
    }
  );
}

// ===== КОМАНДЫ И ХЕНДЛЕРЫ =====
bot.start(async (ctx) => {
  // При старте сразу проверяем подписку
  const isSubscribed = await checkSubscription(ctx);
  if (!isSubscribed) {
    await ctx.reply(
      `👋 Привет! Для начала работы подпишись на канал:\n${CHANNEL_ID}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📢 Подписаться', url: 'https://t.me/SunyWorld_me' }],
            [{ text: '✅ Проверить подписку', callback_data: 'check_sub' }]
          ]
        }
      }
    );
    return;
  }

  ctx.reply(
    `👋 Привет! Я генерирую 5-символьные username.\n` +
    `У вас есть ${MAX_GENERATIONS} генераций в сутки.\n` +
    `Отправь /generate или нажми кнопку ниже.`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: '🎲 Сгенерировать', callback_data: 'generate_more' }]],
      },
    }
  );
});

bot.command('generate', async (ctx) => {
  await handleGenerate(ctx);
});

bot.command('admingokot', async (ctx) => {
  if (ADMIN_IDS.includes(ctx.from.id)) {
    await ctx.reply('✅ Админ-режим активирован. Вы можете генерировать без лимита и без подписки.');
  } else {
    await ctx.reply('❌ У вас нет прав администратора.');
  }
});

bot.hears(/generate|сгенерировать/i, async (ctx) => {
  await handleGenerate(ctx);
});

// Обработка кнопки "Проверить подписку"
bot.action('check_sub', async (ctx) => {
  await ctx.answerCbQuery();
  const isSubscribed = await checkSubscription(ctx);
  if (isSubscribed) {
    await ctx.reply('✅ Подписка подтверждена! Теперь вы можете генерировать username.');
    // Можно сразу предложить сгенерировать
    await handleGenerate(ctx);
  } else {
    await ctx.reply(
      '❌ Вы всё ещё не подписаны. Пожалуйста, подпишитесь на канал и нажмите «Проверить» снова.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📢 Подписаться', url: 'https://t.me/SunyWorld_me' }],
            [{ text: '✅ Проверить подписку', callback_data: 'check_sub' }]
          ]
        }
      }
    );
  }
});

// Кнопка "Сгенерировать ещё"
bot.action('generate_more', async (ctx) => {
  await ctx.answerCbQuery();
  await handleGenerate(ctx);
});

// ===== ЗАПУСК =====
bot.launch()
  .then(() => console.log('✅ Бот запущен (с подпиской и лимитами)'))
  .catch(err => console.error('❌ Ошибка:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
