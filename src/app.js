const root=document.getElementById('app');
document.getElementById('year').textContent=new Date().getFullYear();
const live=typeof google!=='undefined'&&!!google.script?.run;
let survey,answers={},step=0,submission=null,busy=false,requestId=crypto.randomUUID();
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const demoNote=()=>live?'':'<div class="demo-note">Демо-режим: ответы не сохраняются, письма не отправляются.</div>';
function rpc(method,payload){
  return new Promise((resolve,reject)=>{
    if(!live){
      try{
        if(method==='getSurvey')resolve(publicSurvey(DEMO_SURVEY));
        else if(method==='submitSurvey')resolve({result:evaluate(DEMO_SURVEY,payload.answers)});
        else reject(new Error('Отправка писем доступна после публикации в Google Apps Script.'));
      }catch(error){reject(error);}return;
    }
    google.script.run.withSuccessHandler(resolve).withFailureHandler(error=>reject(new Error(error.message||'Не удалось связаться с сервером. Попробуйте ещё раз.')))[method](payload);
  });
}
function focusPage(){root.focus();window.scrollTo({top:0,behavior:'instant'});}
function intro(){
 root.innerHTML=demoNote()+`<section class="intro"><div class="intro-copy"><div class="eyebrow">Знакомство с собой</div><h1>Ваше питание.<br>Ваши привычки.<br><em>Ваш ритм.</em></h1><p>Узнайте чуть больше о своих пищевых привычках и найдите маленькие шаги, которые подойдут именно вам.</p><button class="button" id="start">Узнать свои привычки</button><div class="facts"><span>${survey.questions.length} вопросов</span><span>Около 2 минут</span><span>Без регистрации</span></div></div><div class="art" role="img" aria-label="Иллюстрация тарелки с овощами и крупой"><div class="plate"><div class="food leaf"></div><div class="food tomato"></div><div class="food grain"></div></div><div class="art-label top">Без строгих правил</div><div class="art-label">В своём темпе</div><div class="art-caption">Больше внимания к себе</div></div></section><section class="steps" aria-label="Как это работает"><div class="step"><span class="step-number">01</span><div><h2>Ответьте на вопросы</h2><p>О вашем обычном дне — без оценок и осуждения.</p></div></div><div class="step"><span class="step-number">02</span><div><h2>Узнайте свой результат</h2><p>Посмотрите, что уже помогает и что можно попробовать.</p></div></div><div class="step"><span class="step-number">03</span><div><h2>Сохраните идеи для себя</h2><p>Получите рекомендации на почту, если захотите.</p></div></div></section>`;
 document.getElementById('start').onclick=()=>{step=0;question();focusPage();};
}
function question(){
 const q=survey.questions[step],selected=answers[q.id]||[];
 root.innerHTML=demoNote()+`<div class="survey-layout"><aside class="sidebar"><div class="eyebrow">Ваши привычки</div><h2>Здесь можно<br>быть собой.</h2><p>Выбирайте то, что ближе к вашей жизни сейчас. Правильных ответов нет.</p><div class="side-leaf" aria-hidden="true">❧</div><p>Ответы можно изменить,<br>вернувшись на шаг назад.</p></aside><section class="question-box"><div class="progress-meta"><span>Вопрос ${step+1} из ${survey.questions.length}</span><span>${Math.round((step+1)/survey.questions.length*100)}%</span></div><div class="progress" role="progressbar" aria-label="Прогресс анкеты" aria-valuenow="${step+1}" aria-valuemin="0" aria-valuemax="${survey.questions.length}"><span style="width:${(step+1)/survey.questions.length*100}%"></span></div><h1 id="question-title">${escapeHtml(q.title)}</h1><p class="hint" id="hint">${escapeHtml(q.hint)} ${q.multiple?'Можно выбрать несколько.':'Выберите один вариант.'}</p><form id="question-form"><fieldset aria-labelledby="question-title" aria-describedby="hint">${q.options.map(o=>`<label class="option"><input type="${q.multiple?'checkbox':'radio'}" name="answer" value="${escapeHtml(o.id)}" ${selected.includes(o.id)?'checked':''}><span>${escapeHtml(o.label)}</span></label>`).join('')}</fieldset><div class="error" id="error" role="alert"></div><div class="nav"><button class="text-button" type="button" id="back">${step?'Назад':'На главную'}</button><button class="button" type="submit" id="next" ${selected.length?'':'disabled'}>${step===survey.questions.length-1?'Посмотреть результат':'Продолжить'}</button></div></form></section></div>`;
 const form=document.getElementById('question-form');
 form.onchange=event=>{
   if(busy)return;
   const inputs=[...form.querySelectorAll('input')];
   const option=q.options.find(o=>o.id===event.target.value);
   if(event.target.checked&&q.multiple){
     inputs.forEach(input=>{if(input!==event.target&&(option.exclusive||q.options.find(o=>o.id===input.value).exclusive))input.checked=false;});
   }
   answers[q.id]=inputs.filter(input=>input.checked).map(input=>input.value);
   document.getElementById('next').disabled=!answers[q.id].length;
 };
 document.getElementById('back').onclick=()=>{if(busy)return;if(step>0){step--;question();}else intro();focusPage();};
 form.onsubmit=async event=>{
   event.preventDefault();if(busy||!answers[q.id]?.length)return;
   if(step<survey.questions.length-1){step++;question();focusPage();return;}
   busy=true;form.querySelectorAll('input,button').forEach(el=>el.disabled=true);
   document.getElementById('next').textContent='Собираем результат…';document.getElementById('error').textContent='';
   try{submission=await rpc('submitSurvey',{id:requestId,version:survey.version,answers});resultPage();focusPage();}
   catch(error){document.getElementById('error').textContent=error.message;form.querySelectorAll('input,button').forEach(el=>el.disabled=false);document.getElementById('next').textContent='Попробовать ещё раз';}
   finally{busy=false;}
 };
}
function resultPage(){
 const result=submission.result;
 root.innerHTML=demoNote()+`<div class="result-wrap"><section class="result-top"><div class="result-badge" aria-hidden="true">✓</div><div class="eyebrow" style="justify-content:center">Ваш результат</div><h1>${escapeHtml(result.title)}</h1><p>${escapeHtml(result.description)}</p></section><section class="result-card"><h2>Маленькие шаги для вас</h2>${result.recommendations.map((r,i)=>`<div class="recommendation"><span aria-hidden="true">${i+1}</span><p>${escapeHtml(r)}</p></div>`).join('')}</section><section class="email-card"><h2>Пусть рекомендации будут под рукой</h2><p>Отправим ваш результат и идеи на почту одним письмом. Без подписки на рассылку.</p><form id="email-form"><label class="email-label" for="email">Ваш email</label><div class="email-row"><input id="email" name="email" type="email" maxlength="254" placeholder="you@example.com" autocomplete="email" required><button class="button" type="submit">Отправить на почту</button></div><label class="consent"><input id="consent" type="checkbox" required><span>Согласен на хранение email вместе с ответами и результатом в Google Sheets владельца анкеты и на получение одного письма с рекомендациями.</span></label><div id="email-status" role="status" aria-live="polite"></div></form></section><p class="disclaimer">Демонстрационная анкета для самоанализа. Результат не является медицинской оценкой или персональным планом питания.</p><button class="text-button restart" id="restart">Пройти ещё раз</button></div>`;
 document.getElementById('restart').onclick=()=>{if(busy)return;answers={};submission=null;requestId=crypto.randomUUID();intro();focusPage();};
 document.getElementById('email-form').onsubmit=async event=>{
   event.preventDefault();if(busy)return;
   const form=event.currentTarget,status=document.getElementById('email-status'),button=form.querySelector('button');
   if(!live){status.className='error';status.textContent='Это демо: письмо не отправлено. Отправка заработает после публикации в Google Apps Script.';return;}
   busy=true;button.disabled=true;button.textContent='Отправляем…';status.textContent='';
   try{
     await rpc('sendRecommendations',{id:submission.id,token:submission.token,email:document.getElementById('email').value,consent:document.getElementById('consent').checked});
     form.innerHTML='<p class="success" role="status">Письмо отправлено. Проверьте входящие и папку «Спам».</p>';
   }catch(error){status.className='error';status.textContent=error.message;button.disabled=false;button.textContent='Отправить на почту';}
   finally{busy=false;}
 };
}
async function boot(){
 root.innerHTML='<div class="loading" role="status">Готовим вашу анкету…</div>';
 try{survey=await rpc('getSurvey');intro();}catch(error){root.innerHTML=`<section class="result-card"><h1>Не удалось загрузить анкету</h1><p role="alert">${escapeHtml(error.message)}</p><button class="button" id="retry">Попробовать ещё раз</button></section>`;document.getElementById('retry').onclick=boot;}
}
boot();
