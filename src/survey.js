// Shared by the browser demo and the Apps Script server. No external dependencies.
const DEMO_SURVEY = {
  version: 'demo-1',
  questions: [
    {id:'rhythm', title:'Как обычно складывается ваш день?', hint:'Подумайте о привычной неделе, а не об идеальном дне.', multiple:false, options:[
      {id:'planned',label:'Обычно нахожу время спокойно поесть',score:2},
      {id:'mixed',label:'По-разному: иногда спокойно, иногда на бегу',score:1},
      {id:'rushed',label:'Часто откладываю еду из-за дел',score:0}]},
    {id:'choice',title:'Что помогает вам решить, что поесть?',hint:'Можно выбрать несколько вариантов.',multiple:true,options:[
      {id:'preference',label:'Мои вкусы и то, чего хочется сейчас',score:2},
      {id:'plan',label:'Продукты дома или небольшой план',score:2},
      {id:'time',label:'То, что получится найти быстрее всего',score:1},
      {id:'random',label:'Обычно выбираю в последний момент',score:0}]},
    {id:'attention',title:'Что чаще сопровождает ваш приём пищи?',hint:'Выберите вариант, который ближе всего к вашей повседневности.',multiple:false,options:[
      {id:'pause',label:'Перерыв, когда можно переключиться на еду',score:2},
      {id:'sometimes',label:'Иногда перерыв, иногда телефон или работа',score:1},
      {id:'screen',label:'Работа, переписка или лента в телефоне',score:0}]},
    {id:'shopping',title:'Как вы обычно покупаете продукты?',hint:'Здесь нет правильных и неправильных ответов.',multiple:false,options:[
      {id:'list',label:'Проверяю, что есть дома, и составляю список',score:2},
      {id:'rough',label:'Примерно представляю, что нужно',score:1},
      {id:'spontaneous',label:'Покупаю спонтанно, без плана',score:0}]},
    {id:'support',title:'Что уже помогает вам в повседневной жизни?',hint:'Отметьте всё подходящее или выберите последний вариант.',multiple:true,options:[
      {id:'easy',label:'Несколько простых любимых блюд',score:2},
      {id:'break',label:'Время для перерыва в расписании',score:2},
      {id:'company',label:'Совместные приёмы пищи с близкими',score:2},
      {id:'none',label:'Пока ищу подходящий мне подход',score:0,exclusive:true}]},
    {id:'change',title:'Насколько вам подходит ваш текущий ритм?',hint:'Остался последний вопрос.',multiple:false,options:[
      {id:'comfortable',label:'В целом мне удобно, хочется сохранить этот ритм',score:2},
      {id:'adjust',label:'Есть несколько вещей, которые хочется изменить',score:1},
      {id:'start',label:'Хочется начать с простых и понятных шагов',score:0}]}
  ],
  results:[
    {id:'start',min:0,max:39,title:'Начните с одной удобной привычки',description:'Сейчас еда часто подстраивается под дела. Можно поискать один небольшой шаг, который сделает ваш день удобнее.',recommendations:['Выберите один день и заранее решите, когда вам удобно сделать перерыв на еду.','Запишите два простых блюда, которые вам нравятся и которые легко приготовить.','В конце недели отметьте, что получилось удобно, и оставьте только подходящие вам идеи.']},
    {id:'balance',min:40,max:74,title:'Найдите свой комфортный ритм',description:'У вас уже есть опорные привычки. Небольшие изменения могут помочь сделать повседневный ритм более предсказуемым.',recommendations:['Выберите одну ситуацию, в которой вам чаще всего неудобно организовать еду, и придумайте запасной вариант.','Перед следующей покупкой проверьте продукты дома и составьте короткий список.','Попробуйте один приём пищи без рабочих задач и оцените, нравится ли вам такой перерыв.']},
    {id:'steady',min:75,max:100,title:'У вас уже есть удобная основа',description:'По вашим ответам, вы нашли несколько способов организовать питание в повседневной жизни. Сохраняйте то, что подходит именно вам.',recommendations:['Запишите, какие привычки делают ваш день проще, чтобы опираться на них в загруженные недели.','Оставьте место для гибкости: план может меняться вместе с вашими обстоятельствами.','Выберите одну новую идею для разнообразия — например, новое блюдо или совместный обед.']}
  ]
};
function validateSurvey(survey) {
  if (!survey || !survey.version || !Array.isArray(survey.questions) || !survey.questions.length || !Array.isArray(survey.results)) throw new Error('Анкета ещё не настроена.');
  const ids = new Set();
  survey.questions.forEach(q => {
    if (!q.id || ids.has(q.id) || !q.title || typeof q.multiple !== 'boolean' || !Array.isArray(q.options) || q.options.length < 2) throw new Error('Ошибка настройки вопросов.');
    ids.add(q.id);
    const options = new Set();
    q.options.forEach(o => {
      if (!o.id || options.has(o.id) || !o.label || !Number.isFinite(o.score) || o.score < 0 || o.score > 2) throw new Error('Ошибка настройки вариантов.');
      options.add(o.id);
    });
  });
  for(let score=0;score<=100;score++) {
    const matches=survey.results.filter(r=>Number.isInteger(r.min)&&Number.isInteger(r.max)&&score>=r.min&&score<=r.max);
    if(matches.length!==1 || !matches[0].title || !matches[0].description || !Array.isArray(matches[0].recommendations) || !matches[0].recommendations.length) throw new Error('Диапазоны результатов должны покрывать 0–100 без пересечений.');
  }
  return survey;
}
function publicSurvey(survey) {
  validateSurvey(survey);
  return {version:survey.version, questions:survey.questions.map(q=>({...q,options:q.options.map(({score,...option})=>option)}))};
}
function evaluate(survey, answers) {
  validateSurvey(survey);
  if(!answers || typeof answers!=='object' || Array.isArray(answers) || Object.keys(answers).length!==survey.questions.length) throw new Error('Ответьте на все вопросы.');
  let total=0;
  survey.questions.forEach(q=>{
    const selected=answers[q.id];
    if(!Array.isArray(selected)||!selected.length||new Set(selected).size!==selected.length||(!q.multiple&&selected.length!==1)) throw new Error('Проверьте ответы на вопросы.');
    const options=selected.map(id=>q.options.find(o=>o.id===id));
    if(options.some(o=>!o)|| (options.length>1&&options.some(o=>o.exclusive))) throw new Error('Недопустимое сочетание ответов.');
    total+=options.reduce((sum,o)=>sum+o.score,0)/options.length;
  });
  const score=Math.round(total/(survey.questions.length*2)*100);
  const result=survey.results.find(r=>score>=r.min&&score<=r.max);
  return {...result,score};
}
