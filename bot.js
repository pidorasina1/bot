const fs = require('fs');
const { Telegraf } = require('telegraf');

const BOT_TOKEN = '6960723690:AAFMObFjZ-b4whc0yGELYTqv7oOLEqyC0YY';
const DATA_FILE = 'debts.json';

// Загрузка сохраненных долгов из файла
const debts = loadDebts();

// Создаем экземпляр бота с указанием вашего токена
const bot = new Telegraf(BOT_TOKEN);

// Command handler for /start
bot.start((ctx) => {
    ctx.reply('Привет! Я бот для учета долгов. Используйте команды /dolg чтобы записать долг и /calculate чтобы посчитать долги и /reset чтобы обнулить все долги.');
});

// Command handler for /debt
bot.command('debt', (ctx) => {
    const userId = ctx.from.id;
    const debtor = (ctx.message.text.split(' ')[1] || '').toLowerCase();

    if (!['gordey', 'rodion'].includes(debtor)) {
        ctx.reply('Укажите, за кого вы хотите проверить задолженность /debt gordey или /debt rodion');
        return;
    }

    const debtorId = debtor === 'gordey' ? 1 : 2;
    const key = `${userId}-${debtorId}`;

    if (debts[key]) {
        ctx.reply(`Ваш текущий долг перед ${debtor}: ${debts[key]}`);
    } else {
        ctx.reply(`Ваш текущий долг перед ${debtor}.`);
    }
});

// Command handler for /record
bot.command('dolg', (ctx) => {
    const userId = ctx.from.id;
    const [debtor, amount] = ctx.message.text.split(' ').slice(1);

    try {
        if (!['gordey', 'rodion'].includes(debtor)) {
            ctx.reply('Выберите, на кого вы хотите записать долг: /dolg gordey [сколько] или /dolg rodion [сколько]');
            return;
        }

        const debtorId = debtor === 'gordey' ? 1 : 2;
        const key = `${userId}-${debtorId}`;

        debts[key] = (debts[key] || 0) + parseFloat(amount);

        // Save changes to the file
        saveDebts(debts);

        ctx.reply(`Зарегистрирован долг перед ${debtor}: ${amount}. Ваш текущий долг: ${debts[key]}`);
    } catch (error) {
        ctx.reply('Используйте команду в формате: /record [gordey/rodion] [amount]');
    }
});

// Command handler for /calculate
// Command handler for /calculate
bot.command('calculate', (ctx) => {
  let replyText = '';
  let totalGordey = 0;
  let totalRodion = 0;

  for (const [key, amount] of Object.entries(debts)) {
      const [userId, debtorId] = key.split('-');
      const debtor = debtorId === '1' ? 'Gordey' : 'Rodion';

      if (amount > 0) {
          replyText += ` долг ${debtor}: ${amount}\n`;
          if (debtor === 'Gordey') {
              totalGordey += amount;
          } else {
              totalRodion += amount;
          }
      } else if (amount < 0) {
          replyText += `${debtor} долг ${ctx.from.username}: ${-amount}\n`;
          if (debtor === 'Gordey') {
              totalGordey -= amount;
          } else {
              totalRodion -= amount;
          }
      }
  }

  const netDebt = totalRodion - totalGordey;
  if (netDebt > 0) {
      replyText += `\nРодион в долгу перед Гордеем: ${netDebt}`;
  } else if (netDebt < 0) {
      replyText += `\nГордей в долгу перед Родионом: ${-netDebt}`;
  } else {
      replyText += '\nНет задолженности между Гордеем и Родионом.';
  }

  // Send the response to the /calculate command
  ctx.reply(replyText || 'Никаких долгов.');
});

// Command handler for /reset
bot.command('reset', (ctx) => {
  // Reset all debts to zero
  Object.keys(debts).forEach((key) => {
      debts[key] = 0;
  });

  // Save changes to the file
  saveDebts(debts);

  ctx.reply('Все долги обнулены.');
});

// Command handler for /calculate
bot.command('calculate', (ctx) => {
  let replyText = '';
  let totalGordey = 0;
  let totalRodion = 0;

  for (const [key, amount] of Object.entries(debts)) {
      const [userId, debtorId] = key.split('-');
      const debtor = debtorId === '1' ? 'Gordey' : 'Rodion';

      if (amount > 0) {
          replyText += ` долг ${debtor}: ${amount}\n`;
          if (debtor === 'Gordey') {
              totalGordey += amount;
          } else {
              totalRodion += amount;
          }
      } else if (amount < 0) {
          replyText += `${debtor} долг ${ctx.from.username}: ${-amount}\n`;
          if (debtor === 'Gordey') {
              totalGordey -= amount;
          } else {
              totalRodion -= amount;
          }
      }
  }

  const netDebt = totalRodion - totalGordey;
  if (netDebt > 0) {
      replyText += `\nРодион в долгу перед Гордеем: ${netDebt}`;
  } else if (netDebt < 0) {
      replyText += `\nГордей в долгу перед Родионом: ${-netDebt}`;
  } else {
      replyText += '\nНет чистой задолженности между Гордеем и Родионом.';
  }

  // Send the response to the /calculate command
  ctx.reply(replyText || 'Никаких долгов.');
});



// Запуск бота
bot.launch()
    .then(() => console.log('Бот запущен'))
    .catch(err => console.error(`Ошибка запуска бота: ${err}`));

// Функция загрузки долгов из файла
function loadDebts() {
    try {
        const data = fs.readFileSync(DATA_FILE);
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

// Функция сохранения долгов в файл
function saveDebts(debts) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(debts, null, 2));
}
