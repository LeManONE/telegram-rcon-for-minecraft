require('dotenv').config();
const { Telegraf } = require('telegraf');
const Rcon = require('rcon-client').Rcon;

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.RCON_HOST || !process.env.RCON_PASSWORD) {
  console.error('❌ Ошибка: Не хватает TELEGRAM_BOT_TOKEN, RCON_HOST или RCON_PASSWORD в .env!');
  process.exit(1);
}

async function sendRconCommand(command) {
  const rcon = new Rcon({
    host: process.env.RCON_HOST,
    port: process.env.RCON_PORT || 25575,
    password: process.env.RCON_PASSWORD,
    timeout: 5000 // 1000 - 1 секунда, это проверка, лучше не меняйте пж
  });

  try {
    await rcon.connect();
    const response = await rcon.send(command);
    return response || "✅ Команда выполнена (сервер не вернул ответ).";
  } catch (error) {
    console.error('RCON Error:', error);
    return `❌ Ошибка RCON: ${error.message}`;
  } finally {
    await rcon.end().catch(() => {});
  }
}

bot.command('start', (ctx) => {
  ctx.reply('🎮 **Minecraft RCON Bot**\n\n' +
    'Просто отправь мне команду, и я передам её на сервер!\n' +
    'Примеры:\n' +
    '- `list` — список игроков онлайн\n' +
});

bot.on('text', async (ctx) => {
  const command = ctx.message.text.trim();

  if (command.startsWith('/') && !command.startsWith('/cmd')) return;

  const cleanCommand = command.replace(/^\/cmd\s*/, '');

  if (!cleanCommand) {
    return ctx.reply('❌ Пустая команда!');
  }

  try {
    const response = await sendRconCommand(cleanCommand);
    ctx.reply(`📤 **Команда:** \`${cleanCommand}\`\n📥 **Ответ сервера:**\n\`\`\`\n${response}\n\`\`\``);
  } catch (error) {
    ctx.reply(`❌ Ошибка: ${error.message}`);
  }
});

bot.launch()
  .then(() => console.log('🤖 Бот запущен и готов к работе!'))
  .catch(err => console.error('🚨 Ошибка запуска бота:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));