const root=document.getElementById('app');
document.getElementById('year').textContent=new Date().getFullYear();
const native=typeof google!=='undefined'&&!!google.script?.run;
let survey=SURVEY,answers={},step=0,result=null,busy=false,requestId=crypto.randomUUID(),bridgeReady=false,bridgeWindow=null,bridgeUnavailable=false;
const pending=new Map();
const bridgeChannel=crypto.randomUUID();
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const connected=()=>native||bridgeReady;
function rpc(method,payload){
  return new Promise((resolve,reject)=>{
    if(native){google.script.run.withSuccessHandler(resolve).withFailureHandler(e=>reject(new Error(e.message)))[method](payload);return;}
    if(!bridgeReady){reject(new Error('Сервис подписки пока недоступен. Попробуйте позже.'));return;}
    const id=crypto.randomUUID();
    const timeout=setTimeout(()=>{pending.delete(id);reject(new Error('Сервис не ответил вовремя. Попробуйте ещё раз: повторная заявка не создаст второе письмо.'));},45000);
    pending.set(id,{resolve,reject,timeout});
    bridgeWindow.postMessage({type:'food-habits-request',channel:bridgeChannel,id,method,payload},bridgeOrigin);
  });
}
let bridgeOrigin='';
window.addEventListener('message',event=>{
  if(bridgeReady&&event.source!==bridgeWindow)return;
  const trusted=event.origin==='https://script.google.com'||/^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/.test(event.origin)||event.origin==='https://script.googleusercontent.com';
  if(!trusted)return;
  const message=event.data;
  if(message?.channel!==bridgeChannel)return;
  if(message?.type==='food-habits-ready'){
    bridgeOrigin=event.origin;bridgeWindow=event.source;bridgeReady=true;
    const status=document.getElementById('connection');if(status)status.textContent='';
    const button=document.getElementById('subscribe');if(button)button.disabled=false;
    rpc('getSurvey').then(value=>{if(step===0&&!Object.keys(answers).length)survey=value;}).catch(()=>{});
  }
  if(message?.type!=='food-habits-response')return;
  const request=pending.get(message.id);if(!request)return;
  clearTimeout(request.timeout);pending.delete(message.id);
  if(message.error)request.reject(new Error(message.error));else request.resolve(message.value);
});
function connect(){
  if(native){rpc('getSurvey').then(value=>survey=value).catch(()=>{});return;}
  if(!APP_CONFIG.backendUrl)return;
  const frame=document.createElement('iframe');frame.hidden=true;frame.title='Сервис подписки';frame.src=APP_CONFIG.backendUrl+'?bridge=1&channel='+bridgeChannel;document.body.append(frame);
  setTimeout(()=>{if(!bridgeReady){bridgeUnavailable=true;const status=document.getElementById('connection');if(status)status.textContent='Сервис подписки сейчас недоступен. Попробуйте позже — ваша рекомендация остаётся на экране.';}},15000);
}
function focusPage(){root.focus();window.scrollTo({top:0,behavior:'instant'});}
function intro(){
 root.innerHTML=`<section class="intro"><div class="intro-copy"><div class="eyebrow">Пищевые привычки · Елена Вилиткевич</div><h1>С какой<br><em>привычки</em><br>начать?</h1><p>Несколько коротких вопросов помогут присмотреться к вашему питанию и выбрать один небольшой шаг на ближайшую неделю.</p><p>Вспомните последние 7 дней и выбирайте то, что ближе к вашей обычной жизни. Здесь нет правильных или неправильных ответов.</p><button class="button" id="start">Начать</button><div class="facts"><span>7–8 вопросов</span><span>2–3 минуты</span><span>Без регистрации</span></div></div><div class="art" role="img" aria-label="Иллюстрация тарелки с овощами и крупой"><div class="plate"><div class="food leaf"></div><div class="food tomato"></div><div class="food grain"></div></div><div class="art-label top">Без строгих правил</div><div class="art-label">Один небольшой шаг</div><div class="art-caption">Больше внимания к себе</div></div></section><p class="disclaimer">Анкета для взрослых помогает выбрать привычку и не заменяет индивидуальную оценку питания.</p>`;
 document.getElementById('start').onclick=()=>{step=0;question();focusPage();};
}
function question(){
 const list=activeQuestions(answers,survey),q=list[step],selected=answers[q.id];
 root.innerHTML=`<div class="survey-layout"><aside class="sidebar"><div class="eyebrow">Ваши привычки</div><h2>Здесь можно<br>быть собой.</h2><p>Вспомните последние 7 дней. Ничего взвешивать и считать до грамма не нужно.</p><div class="side-leaf" aria-hidden="true">❧</div><p>Вы можете вернуться назад и изменить ответ.</p></aside><section class="question-box"><div class="progress-meta"><span id="progress-label">Вопрос ${step+1} из ${list.length}</span><span id="progress-percent">${Math.round((step+1)/list.length*100)}%</span></div><div class="progress" role="progressbar" aria-label="Прогресс анкеты" aria-valuenow="${step+1}" aria-valuemin="0" aria-valuemax="${list.length}"><span style="width:${(step+1)/list.length*100}%"></span></div><h1 id="question-title">${escapeHtml(q.title)}</h1><p class="hint" id="hint">${escapeHtml(q.hint)}</p><form id="question-form"><fieldset aria-labelledby="question-title" aria-describedby="hint">${q.options.map(o=>`<label class="option"><input type="radio" name="answer" value="${o.id}" ${selected===o.id?'checked':''}><span>${escapeHtml(o.label)}</span></label>`).join('')}</fieldset><div class="error" id="error" role="alert"></div><div class="nav"><button class="text-button" type="button" id="back">${step?'Назад':'На главную'}</button><button class="button" type="submit" id="next" ${selected?'':'disabled'}>${step===list.length-1?'Посмотреть рекомендацию':'Далее'}</button></div></form></section></div>`;
 const form=document.getElementById('question-form');
 form.onchange=event=>{
   answers[q.id]=event.target.value;
   if(q.id==='Q1'&&event.target.value!=='NO_BREAKFAST')delete answers.Q1A;
   document.getElementById('next').disabled=false;
   const count=activeQuestions(answers,survey).length,percent=Math.round((step+1)/count*100);
   document.getElementById('progress-label').textContent=`Вопрос ${step+1} из ${count}`;
   document.getElementById('progress-percent').textContent=percent+'%';
   const bar=root.querySelector('[role="progressbar"]');bar.setAttribute('aria-valuemax',count);bar.firstElementChild.style.width=percent+'%';
 };
 document.getElementById('back').onclick=()=>{if(step>0){step--;question();}else intro();focusPage();};
 form.onsubmit=event=>{
   event.preventDefault();if(!answers[q.id])return;
   if(step<activeQuestions(answers,survey).length-1){step++;question();focusPage();return;}
   try{result=evaluate(answers);resultPage();focusPage();}catch(error){document.getElementById('error').textContent=error.message;}
 };
}
function resultPage(){
 root.innerHTML=`<div class="result-wrap"><section class="result-top"><div class="result-badge" aria-hidden="true">✓</div><div class="eyebrow" style="justify-content:center">С этого можно начать</div><h1>${escapeHtml(result.title)}</h1><p>${escapeHtml(result.description)}</p></section><section class="result-card"><h2>Ваш шаг на ближайшую неделю</h2><p>${escapeHtml(result.action)}</p>${result.note?`<p class="hint">${escapeHtml(result.note)}</p>`:''}</section><section class="email-card"><h2>Хотите получать письма от Елены?</h2><p>Оставьте имя и email — Елена Вилиткевич будет делиться советами по питанию и новостями. Отписаться можно в любой момент.</p><form id="email-form"><label class="email-label" for="name">Ваше имя</label><input class="contact-input" id="name" name="name" maxlength="80" autocomplete="given-name" required><label class="email-label" for="email">Ваш email</label><input class="contact-input" id="email" name="email" type="email" maxlength="254" placeholder="you@example.com" autocomplete="email" required><label class="consent"><input id="consent" type="checkbox" required><span>${escapeHtml(CONSENT_TEXT)}</span></label><details class="privacy"><summary>Как используются данные</summary><p>При запросе подписки имя, email, ответы анкеты, результат и ваше согласие сохраняются в закрытой Google-таблице проекта Елены Вилиткевич. Адрес используется для подтверждения подписки и, после подтверждения, для писем Елены. Ответы без заявки остаются только в памяти этой страницы. Ссылка для отмены заявки и отписки есть в письме подтверждения.</p></details>${APP_CONFIG.privacyUrl?`<p><a href="${escapeHtml(APP_CONFIG.privacyUrl)}" target="_blank" rel="noopener">Политика конфиденциальности</a></p>`:''}<p id="connection" role="status">${connected()?'':bridgeUnavailable?'Сервис подписки сейчас недоступен. Попробуйте позже.':'Подключаем сервис подписки…'}</p><button class="button" type="submit" id="subscribe" ${connected()?'':'disabled'}>Подписаться</button><div id="email-status" role="status" aria-live="polite"></div></form></section><p class="disclaimer">Анкета помогает выбрать привычку и не заменяет индивидуальную оценку питания. Результат доступен без подписки.</p><button class="text-button restart" id="restart">Пройти ещё раз</button></div>`;
 if(!native&&!APP_CONFIG.backendUrl)document.getElementById('connection').textContent='Подписка пока не подключена. Рекомендация уже доступна полностью.';
 document.getElementById('restart').onclick=()=>{if(busy)return;answers={};result=null;requestId=crypto.randomUUID();intro();focusPage();};
 document.getElementById('email-form').onsubmit=async event=>{
   event.preventDefault();if(busy)return;
   const form=event.currentTarget,status=document.getElementById('email-status'),button=document.getElementById('subscribe');
   const name=document.getElementById('name').value.trim();if(!name){document.getElementById('name').setCustomValidity('Введите имя.');document.getElementById('name').reportValidity();return;}
   busy=true;button.disabled=true;button.textContent='Сохраняем…';status.textContent='';
   try{
     const response=await rpc('requestSubscription',{id:requestId,version:QUESTIONNAIRE_VERSION,answers,name,email:document.getElementById('email').value,consent:document.getElementById('consent').checked,consent_version:CONSENT_VERSION});
     const messages={confirmation_sent:'Проверьте почту: мы отправили письмо для подтверждения подписки.',saved_pending:'Имя и email сохранены. Отправку письма подтверждения пока не удалось подтвердить. Если письмо придёт, перейдите по ссылке; до подтверждения адрес не включается в рассылку.',already_confirmed:'Вы уже подписаны на письма Елены. Спасибо!'};
     if(!messages[response.status])throw new Error('Не удалось подтвердить сохранение. Попробуйте ещё раз.');
     form.innerHTML=`<p class="success" role="status">${messages[response.status]}</p>`;
   }catch(error){status.className='error';status.textContent=error.message;button.disabled=false;button.textContent='Попробовать ещё раз';}
   finally{busy=false;}
 };
 document.getElementById('name').oninput=event=>event.target.setCustomValidity('');
}
intro();connect();
