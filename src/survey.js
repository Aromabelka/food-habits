const QUESTIONNAIRE_VERSION = "2.1";
const SCORING_VERSION = "2.1";
const CONSENT_VERSION = "2026-11-21";
const CONSENT_TEXT = "Хочу получать от Елены Вилиткевич письма с советами по питанию, новостями и предложениями консультаций и программ. Я могу отписаться в любой момент.";
const SURVEY = {
  "version": "2.1",
  "questions": [
    {
      "id": "Q1",
      "title": "Как часто за последнюю неделю в вашем завтраке было что-то белковое?",
      "hint": "Например, яйца, творог, скир, рыба, птица, тофу или бобовые как часть блюда. Немного молока в кофе не считаем. Если в отдельные дни пропускаете завтрак, учитывайте первый приём пищи в эти дни",
      "options": [
        {
          "id": "OFTEN",
          "label": "Почти каждый день — 5–7 дней",
          "score": 0
        },
        {
          "id": "SOMETIMES",
          "label": "Иногда — 3–4 дня",
          "score": 1
        },
        {
          "id": "RARE",
          "label": "Редко или совсем не было — 0–2 дня",
          "score": 2
        },
        {
          "id": "NO_BREAKFAST",
          "label": "Я обычно не завтракаю",
          "score": null
        },
        {
          "id": "UNKNOWN",
          "label": "Трудно сказать",
          "score": null
        }
      ]
    },
    {
      "id": "Q1A",
      "title": "А в первом приёме пищи за день как часто бывает что-то белковое?",
      "hint": "Неважно, во сколько вы едите. Вспомните те же последние 7 дней",
      "options": [
        {
          "id": "OFTEN",
          "label": "Почти каждый день — 5–7 дней",
          "score": 0
        },
        {
          "id": "SOMETIMES",
          "label": "Иногда — 3–4 дня",
          "score": 1
        },
        {
          "id": "RARE",
          "label": "Редко или совсем не было — 0–2 дня",
          "score": 2
        },
        {
          "id": "UNKNOWN",
          "label": "Трудно сказать",
          "score": null
        }
      ]
    },
    {
      "id": "Q2",
      "title": "Сколько порций овощей обычно получается съесть за день?",
      "hint": "Порция — примерно овощ размером с ваш кулак или две сложенные горстью ладони нарезанных овощей либо салата. Подойдут сырые, приготовленные и замороженные. Картофель здесь не считаем",
      "options": [
        {
          "id": "NONE",
          "label": "Обычно ни одной",
          "score": 2
        },
        {
          "id": "ONE",
          "label": "Обычно одну",
          "score": 1
        },
        {
          "id": "TWO_PLUS",
          "label": "Две или больше",
          "score": 0
        },
        {
          "id": "UNKNOWN",
          "label": "Трудно сказать",
          "score": null
        }
      ]
    },
    {
      "id": "Q3",
      "title": "Как часто за последнюю неделю вы ели фрукты или ягоды?",
      "hint": "Например, целый фрукт или порцию ягод. Сок здесь не считаем",
      "options": [
        {
          "id": "OFTEN",
          "label": "Почти каждый день — 5–7 дней",
          "score": 0
        },
        {
          "id": "SOMETIMES",
          "label": "Иногда — 3–4 дня",
          "score": 1
        },
        {
          "id": "RARE",
          "label": "Редко или совсем не было — 0–2 дня",
          "score": 2
        },
        {
          "id": "UNKNOWN",
          "label": "Трудно сказать",
          "score": null
        }
      ]
    },
    {
      "id": "Q4",
      "title": "Сколько разных овощей, фруктов, ягод и видов зелени было в вашем меню за неделю?",
      "hint": "Яблоко, огурец, морковь, брокколи и петрушка — уже пять. Один продукт считаем один раз, даже если ели его ежедневно. Разные сорта яблок — один продукт. Достаточно примерной оценки",
      "options": [
        {
          "id": "FEW",
          "label": "0–2 вида",
          "score": 2
        },
        {
          "id": "SOME",
          "label": "3–4 вида",
          "score": 1
        },
        {
          "id": "MANY",
          "label": "5 видов или больше",
          "score": 0
        },
        {
          "id": "UNKNOWN",
          "label": "Трудно сказать",
          "score": null
        }
      ]
    },
    {
      "id": "Q5",
      "title": "Сколько всего напитков у вас обычно получается выпить за день?",
      "hint": "Считаем воду, чай, кофе, молоко и другие безалкогольные напитки. Один стакан здесь — 250 мл. Суп в этот вопрос не входит",
      "options": [
        {
          "id": "LOW",
          "label": "Меньше 1 литра — меньше 4 стаканов",
          "score": 2
        },
        {
          "id": "MEDIUM",
          "label": "От 1 до менее 1,5 литра — 4–5 стаканов",
          "score": 1
        },
        {
          "id": "HIGH",
          "label": "1,5 литра или больше — от 6 стаканов",
          "score": 0
        },
        {
          "id": "UNKNOWN",
          "label": "Трудно сказать",
          "score": null
        }
      ]
    },
    {
      "id": "Q6",
      "title": "Бывает, что за делами вы забываете попить на несколько часов?",
      "hint": "Вспомните последнюю неделю",
      "options": [
        {
          "id": "OFTEN",
          "label": "Почти каждый день — 5–7 дней",
          "score": 2
        },
        {
          "id": "SOMETIMES",
          "label": "Иногда — 3–4 дня",
          "score": 1
        },
        {
          "id": "RARE",
          "label": "Редко или никогда — 0–2 дня",
          "score": 0
        },
        {
          "id": "UNKNOWN",
          "label": "Не замечал(а), трудно сказать",
          "score": null
        }
      ]
    },
    {
      "id": "Q7",
      "title": "Когда замечаете, что хочется пить, обычно удаётся попить?",
      "hint": "Выберите наиболее близкий ответ.",
      "options": [
        {
          "id": "SOON",
          "label": "Да, обычно пью вскоре после этого",
          "score": 0
        },
        {
          "id": "DELAY_SOMETIMES",
          "label": "Иногда откладываю, иногда пью сразу",
          "score": 1
        },
        {
          "id": "DELAY_OFTEN",
          "label": "Часто откладываю надолго",
          "score": 2
        },
        {
          "id": "UNKNOWN",
          "label": "Мне трудно заметить жажду или оценить это",
          "score": null
        }
      ]
    }
  ]
};
function activeQuestions(answers, survey = SURVEY) {
  return survey.questions.filter(q => q.id !== 'Q1A' || answers.Q1 === 'NO_BREAKFAST');
}
function validateAnswers(answers, survey = SURVEY) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) throw new Error('Ответьте на все вопросы.');
  const questions = activeQuestions(answers, survey);
  const allowed = new Set(questions.map(q => q.id));
  for (const key of Object.keys(answers)) {
    if (!allowed.has(key) && !(key === 'Q1A' && answers[key] === null)) throw new Error('Недопустимый ответ в скрытом вопросе.');
  }
  const normalized = {};
  questions.forEach(q => {
    if (!q.options.some(o => o.id === answers[q.id])) throw new Error('Проверьте ответы на все вопросы.');
    normalized[q.id] = answers[q.id];
  });
  if (!allowed.has('Q1A')) normalized.Q1A = null;
  return normalized;
}
function evaluate(answers, survey = SURVEY) {
  const a = validateAnswers(answers, survey);
  const score = id => survey.questions.find(q => q.id === id).options.find(o => o.id === a[id]).score;
  const first = a.Q1 === 'NO_BREAKFAST';
  const P = score(first ? 'Q1A' : 'Q1');
  const plants = ['Q4','Q2','Q3'].map(id => ({id, score:score(id)})).filter(x => x.score !== null);
  const V = plants.length ? Math.max(...plants.map(x => x.score)) : null;
  const amount = score('Q5');
  const W = amount === null ? null : amount === 0 ? 0 : amount === 2 && (score('Q6') === 2 || score('Q7') === 2) ? 2 : 1;
  const scores = {P,V,W};
  const candidates = ['P','V','W'].filter(id => scores[id] !== null && scores[id] > 0);
  const max = candidates.length ? Math.max(...candidates.map(id => scores[id])) : null;
  const tied = candidates.filter(id => scores[id] === max);
  const code = tied[0] || 'P';
  const mode = candidates.length ? 'priority' : P === 0 ? 'support' : 'orientation';
  const meal = first ? 'первом приёме пищи' : 'завтраке';
  let title, description, action, observation, note = '';
  if (code === 'P') {
    title = first ? 'Немного больше внимания первому приёму пищи' : 'Немного больше внимания завтраку';
    observation = `P_${mode}_${first ? 'first_meal' : 'breakfast'}_${P}`;
    if (mode === 'support') {
      title = 'Сохраните привычку, которая уже есть';
      description = `По вашим ответам, белковые продукты уже регулярно бывают в ${meal}.`;
      action = `На ближайшей неделе продолжайте включать белковые продукты в ${first ? 'первый приём пищи за день' : 'завтрак'}. Понаблюдайте за сытостью после еды. Увеличивать порцию белка только из-за результата анкеты не нужно.`;
    } else if (mode === 'orientation') {
      title = 'Немного больше внимания первому приёму пищи';
      description = 'По ответам пока трудно уверенно выбрать, чему уделить внимание в первую очередь. Предлагаем начать с первого приёма пищи.';
      action = 'На ближайшей неделе обратите внимание, едите ли вы что-то белковое во время первого приёма пищи за день. Если обычно нет, попробуйте добавить белковый продукт к привычной еде. Понаблюдайте за сытостью и самочувствием после еды.';
    } else {
      description = `Судя по ответам, белковые продукты бывают в вашем ${meal} ${P === 2 ? 'нечасто' : 'не каждый день'}.`;
      action = first
        ? 'Попробуйте в течение ближайшей недели добавлять белковый продукт к первому приёму пищи за день. Заранее решите, какой продукт добавите к привычной еде. Понаблюдайте, как долго сохраняется сытость и когда хочется поесть снова.'
        : 'Попробуйте в течение ближайшей недели добавлять белковый продукт к привычному завтраку. С вечера решите, какой продукт добавите, чтобы утром было проще. Менять весь завтрак не нужно. Понаблюдайте, как вы чувствуете себя до обеда: надолго ли хватает сытости и когда хочется перекусить.';
    }
  } else if (code === 'V') {
    title = 'Больше растительной еды в привычном меню';
    observation = plants.find(x => x.score === V).id;
    const texts = {
      Q2:['Судя по ответам, овощей в вашем обычном дне пока немного.','Попробуйте на ближайшей неделе добавлять одну порцию овощей к привычному обеду. Выберите овощи, которые вам нравятся и которые удобно приготовить.'],
      Q3:['Судя по ответам, фрукты и ягоды появляются в вашем меню не каждый день.','Попробуйте на ближайшей неделе добавлять фрукт или порцию ягод к одному из привычных приёмов пищи.'],
      Q4:['Судя по ответам, в вашем меню часто повторяется один и тот же набор овощей, фруктов и зелени.','В ближайшую покупку включите один овощ, фрукт или вид зелени, которого давно не было в вашем меню. Попробуйте добавить выбранный продукт к знакомому блюду.']
    };
    [description, action] = texts[observation];
  } else {
    title = 'Вода под рукой';
    observation = score('Q6') > 0 ? 'Q6' : score('Q7') > 0 ? 'Q7' : 'Q5';
    description = {Q6:'Судя по ответам, за делами вы иногда забываете попить.',Q7:'Вы замечаете жажду, но не всегда получается сразу попить.',Q5:'По вашей оценке, в течение дня получается выпить немного напитков.'}[observation];
    action = 'Попробуйте на ближайшей неделе держать воду там, где проводите больше всего времени. Например, утром поставьте стакан или бутылку с водой на рабочий стол. Пусть вода будет под рукой, чтобы можно было попить, как только почувствуете жажду.';
    note = 'Если врач рекомендовал ограничивать жидкость, придерживайтесь его рекомендаций.';
  }
  return {questionnaire_version:QUESTIONNAIRE_VERSION,scoring_version:SCORING_VERSION,result_code:code,result_mode:mode,scores,tie_resolved:tied.length > 1,breakfast_context:first?'first_meal':'breakfast',observation_key:observation,title,description,action,note};
}
