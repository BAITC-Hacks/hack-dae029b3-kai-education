const fs = require('node:fs');
const path = require('node:path');

// Первое совпавшее правило определяет категорию и черновик ответа.
const rules = [
  {
    pattern: /очеред|холодн.*ед|ед.*холодн/,
    category: 'жалоба',
    reply: 'Сожалеем, что посещение столовой оставило неприятное впечатление. Уточните, пожалуйста, дату, время и корпус, чтобы можно было разобраться с очередью и температурой еды.',
  },
  {
    pattern: /пропал|не работает|нет (?:интернета|связи)|перебо/,
    category: 'жалоба',
    reply: 'Сожалеем о проблемах со связью. Уточните, пожалуйста, аудиторию и время сбоя, а также возникает ли проблема на других устройствах. Эти сведения помогут технической поддержке.',
  },
  {
    pattern: /справк/,
    category: 'справка',
    reply: 'Чтобы получить справку о месте учёбы, уточните порядок её оформления в учебной части или деканате. Укажите, нужна ли вам бумажная или электронная справка.',
  },
  {
    pattern: /консультац/,
    category: 'другое',
    reply: 'Подскажите, пожалуйста, по какому предмету и к какому преподавателю вы хотите записаться на консультацию завтра. Доступное время нужно согласовать с преподавателем.',
  },
  {
    pattern: /парковк/,
    category: 'другое',
    reply: 'Уточните, пожалуйста, какой корпус вы планируете посетить. Расположение гостевой парковки и условия въезда можно узнать у администрации или охраны корпуса.',
  },
];

function classify(message) {
  const normalized = message.toLowerCase().replace(/ё/g, 'е');
  const rule = rules.find(({ pattern }) => pattern.test(normalized));
  return rule
    ? { category: rule.category, reply: rule.reply }
    : { category: 'другое', reply: 'Уточните, пожалуйста, детали вашего вопроса, чтобы мы могли помочь.' };
}

function main() {
  const messages = fs.readFileSync(path.join(__dirname, 'messages.txt'), 'utf8')
    .split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  messages.forEach((message, index) => {
    const { category, reply } = classify(message);
    console.log(`${index + 1}) ${message}\nКатегория: ${category}\nЧерновик ответа: ${reply}\n`);
  });
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Не удалось обработать обращения: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { classify };
