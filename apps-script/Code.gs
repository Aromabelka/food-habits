const SPREADSHEET_ID_ = '18UyMYLDH8G07v3bw1kXqEsq-uOS3tBursErZpWcYyx8';
const CONTACT_HEADERS_ = ['request_id','requested_at','name','email','marketing_status','consent_text_version','consent_text','confirmed_at','unsubscribed_at','mail_status','answers_json','result_json'];
function book_(){return SpreadsheetApp.openById(SPREADSHEET_ID_);}
function setup_(){
  const book=book_();
  if(!book.getSheetByName('Subscribers')) {
    const s=book.insertSheet('Subscribers');s.appendRow(CONTACT_HEADERS_);s.setFrozenRows(1);
  }
  if(!book.getSheetByName('QuestionsV2')) {
    const s=book.insertSheet('QuestionsV2');s.appendRow(['id','title','hint','options_json']);
    SURVEY.questions.forEach(q=>s.appendRow([q.id,q.title,q.hint,JSON.stringify(q.options)]));s.setFrozenRows(1);
  }
  const p=PropertiesService.getScriptProperties();
  if(!p.getProperty('TOKEN_SECRET'))p.setProperty('TOKEN_SECRET',Utilities.getUuid()+Utilities.getUuid());
}
function getSurvey(){
  const sheet=book_().getSheetByName('QuestionsV2');
  if(!sheet)return SURVEY;
  // Editable wording, stable answer codes and scoring remain versioned in source.
  const rows=sheet.getDataRange().getValues().slice(1);
  return {version:SURVEY.version,questions:SURVEY.questions.map(q=>{
    const row=rows.find(r=>r[0]===q.id);if(!row)return q;
    const labels=JSON.parse(row[3]);
    return {...q,title:String(row[1]),hint:String(row[2]),options:q.options.map(o=>({...o,label:labels.find(x=>x.id===o.id)?.label||o.label}))};
  })};
}
function sign_(value){return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(value,PropertiesService.getScriptProperties().getProperty('TOKEN_SECRET')));}
function decodeCell_(value){return String(value).replace(/^'(?=[=+\-@\t\r\n])/,'');}
function safeCell_(value){return /^[=+\-@\t\r\n]/.test(value)?"'"+value:value;}
function normalizeContact_(payload){
  if(!payload||typeof payload.name!=='string'||typeof payload.email!=='string'||payload.consent!==true||payload.consent_version!==CONSENT_VERSION)throw new Error('Заполните имя, email и подтвердите согласие.');
  const name=payload.name.trim(),raw=payload.email.trim();
  if(!name||Array.from(name).length>80||/[\r\n\x00-\x1f]/.test(name))throw new Error('Имя должно содержать от 1 до 80 символов.');
  if(raw.length>254||! /^[^\s@<>\x00-\x1f]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/.test(raw))throw new Error('Проверьте email.');
  const at=raw.lastIndexOf('@');return {name,email:raw.slice(0,at)+'@'+raw.slice(at+1).toLowerCase()};
}
function requestSubscription(payload){
  const contact=normalizeContact_(payload);
  if(!/^[0-9a-f-]{36}$/i.test(payload.id||'')||payload.version!==QUESTIONNAIRE_VERSION||JSON.stringify(payload).length>15000)throw new Error('Обновите страницу и попробуйте снова.');
  const answers=validateAnswers(payload.answers),result=evaluate(answers);
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    setup_();const sheet=book_().getSheetByName('Subscribers');const rows=sheet.getDataRange().getValues().slice(1);
    const duplicate=rows.find(r=>r[0]===payload.id);
    if(duplicate){
      if(decodeCell_(duplicate[3])!==contact.email||decodeCell_(duplicate[2])!==contact.name)throw new Error('Запрос уже сохранён. Обновите страницу для нового запроса.');
      return receipt_(duplicate[9]);
    }
    const previous=rows.filter(r=>decodeCell_(r[3]).toLowerCase()===contact.email.toLowerCase());
    const recent=previous.find(r=>Date.now()-Date.parse(r[1])<86400000);
    // Always save an explicit opt-in. Do not automatically re-activate unsubscribed contacts.
    const confirmed=previous.some(r=>r[4]==='confirmed')&&!previous.some(r=>r[4]==='unsubscribed');
    const daily=rows.filter(r=>Date.now()-Date.parse(r[1])<86400000&&r[9]!=='not_sent').length;
    const canSend=!confirmed&&!recent&&daily<50&&MailApp.getRemainingDailyQuota()>0;
    const now=new Date().toISOString();
    const status=confirmed?'confirmed':'pending';
    sheet.appendRow([payload.id,now,safeCell_(contact.name),safeCell_(contact.email),status,CONSENT_VERSION,CONSENT_TEXT,confirmed?now:'','','not_sent',JSON.stringify(answers),JSON.stringify(result)]);
    const row=sheet.getLastRow();SpreadsheetApp.flush();
    if(confirmed)return {status:'already_confirmed'};
    if(!canSend)return receipt_('not_sent');
    const base=ScriptApp.getService().getUrl();
    const confirm=base+'?action=confirm&id='+payload.id+'&token='+encodeURIComponent(sign_('confirm:'+payload.id));
    const unsubscribe=base+'?action=unsubscribe&id='+payload.id+'&token='+encodeURIComponent(sign_('unsubscribe:'+payload.id));
    sheet.getRange(row,10).setValue('unknown');SpreadsheetApp.flush();
    try {
      MailApp.sendEmail({to:contact.email,name:'Елена Вилиткевич',subject:'Подтвердите подписку на письма Елены',body:'Здравствуйте, '+contact.name+'!\n\nВы попросили подписать вас на письма Елены Вилиткевич. Подтвердите подписку по ссылке:\n'+confirm+'\n\nЕсли вы не оставляли заявку, проигнорируйте письмо.\nОтменить заявку или подписку: '+unsubscribe});
      sheet.getRange(row,10).setValue('sent');SpreadsheetApp.flush();return receipt_('sent');
    }catch(error){return receipt_('unknown');}
  }finally{lock.releaseLock();}
}
function receipt_(status){return {status:status==='sent'?'confirmation_sent':'saved_pending'};}
function escape_(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function doGet(e){
  const p=e&&e.parameter||{};
  if(p.action==='confirm'||p.action==='unsubscribe'){
    const valid=/^[0-9a-f-]{36}$/i.test(p.id||'')&&p.token===sign_(p.action+':'+p.id);
    const title=p.action==='confirm'?'Подтвердить подписку':'Отписаться от писем';
    return HtmlService.createHtmlOutput(valid?'<html lang="ru"><meta name="viewport" content="width=device-width"><body style="font:18px sans-serif;padding:40px"><h1>'+title+'</h1><form method="post" target="_top" action="'+escape_(ScriptApp.getService().getUrl())+'">'+['action','id','token'].map(k=>'<input type="hidden" name="'+k+'" value="'+escape_(p[k])+'">').join('')+'<button style="padding:16px">'+title+'</button></form></body></html>':'Ссылка недействительна.');
  }
  if(p.bridge==='1'){
    const template=HtmlService.createTemplateFromFile('Bridge');template.channel=/^[a-f0-9-]{36}$/i.test(p.channel||'')?p.channel:'';
    return template.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('С какой привычки начать?').addMetaTag('viewport','width=device-width, initial-scale=1');
}
function doPost(e){
  const p=e&&e.parameter||{};
  if(!['confirm','unsubscribe'].includes(p.action)||!/^[0-9a-f-]{36}$/i.test(p.id||'')||p.token!==sign_(p.action+':'+p.id))return HtmlService.createHtmlOutput('Ссылка недействительна.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const sheet=book_().getSheetByName('Subscribers'),rows=sheet.getDataRange().getValues();
    const index=rows.findIndex(r=>r[0]===p.id);if(index<1)return HtmlService.createHtmlOutput('Заявка не найдена.');
    const row=rows[index];
    if(p.action==='confirm'){
      if(row[4]==='unsubscribed'||Date.now()-Date.parse(row[1])>7*86400000)return HtmlService.createHtmlOutput('Ссылка истекла или заявка отменена. Оставьте новую заявку в анкете.');
      sheet.getRange(index+1,5).setValue('confirmed');sheet.getRange(index+1,8).setValue(new Date().toISOString());
    }else{
      rows.forEach((r,i)=>{if(i&&String(r[3]).toLowerCase()===String(row[3]).toLowerCase()){sheet.getRange(i+1,5).setValue('unsubscribed');sheet.getRange(i+1,9).setValue(new Date().toISOString());}});
    }
    return HtmlService.createHtmlOutput(p.action==='confirm'?'Подписка подтверждена. Спасибо!':'Вы отписались от писем Елены.');
  }finally{lock.releaseLock();}
}
