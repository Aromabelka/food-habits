const SPREADSHEET_ID_ = '18UyMYLDH8G07v3bw1kXqEsq-uOS3tBursErZpWcYyx8';
const RESPONSE_HEADERS_ = ['id','created_at','answers_json','result_json','email','consented_at','email_status','email_attempted_at'];
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('Food Habits — ваш ритм питания').addMetaTag('viewport','width=device-width, initial-scale=1');
}
function book_(){return SpreadsheetApp.openById(SPREADSHEET_ID_);}
// Run manually in the editor. The trailing underscore blocks google.script.run access.
function setup_(){
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    const book=book_();
    const seed=(name,rows)=>{
      let sheet=book.getSheetByName(name);
      if(sheet && sheet.getLastRow()>0) return;
      if(!sheet) sheet=book.insertSheet(name);
      sheet.getRange(1,1,rows.length,rows[0].length).setValues(rows);
      sheet.setFrozenRows(1);sheet.getRange(1,1,1,rows[0].length).setFontWeight('bold');
    };
    seed('Questions',[['id','title','hint','multiple','options_json'],...DEMO_SURVEY.questions.map(q=>[q.id,q.title,q.hint,q.multiple,JSON.stringify(q.options)])]);
    seed('Results',[['id','min','max','title','description','recommendations_json'],...DEMO_SURVEY.results.map(r=>[r.id,r.min,r.max,r.title,r.description,JSON.stringify(r.recommendations)])]);
    seed('Responses',[RESPONSE_HEADERS_]);
    const props=PropertiesService.getScriptProperties();
    if(!props.getProperty('TOKEN_SECRET')) props.setProperty('TOKEN_SECRET',Utilities.getUuid()+Utilities.getUuid());
  } finally {lock.releaseLock();}
}
function sheet_(name){const s=book_().getSheetByName(name);if(!s)throw new Error('Анкета ещё не настроена.');return s;}
function readSurvey_(){
  const questions=sheet_('Questions').getDataRange().getValues().slice(1).filter(r=>r[0]).map(r=>({id:String(r[0]),title:String(r[1]),hint:String(r[2]),multiple:r[3]===true||String(r[3]).toLowerCase()==='true',options:JSON.parse(r[4])}));
  const results=sheet_('Results').getDataRange().getValues().slice(1).filter(r=>r[0]).map(r=>({id:String(r[0]),min:Number(r[1]),max:Number(r[2]),title:String(r[3]),description:String(r[4]),recommendations:JSON.parse(r[5])}));
  const version=Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify({questions,results})));
  return validateSurvey({version,questions,results});
}
function getSurvey(){return publicSurvey(readSurvey_());}
function token_(id){
  const secret=PropertiesService.getScriptProperties().getProperty('TOKEN_SECRET');
  if(!secret)throw new Error('Анкета ещё не настроена.');
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(id,secret));
}
function responseRow_(sheet,id){
  if(sheet.getLastRow()<2)return null;
  const match=sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).useRegularExpression(false).findNext();
  return match?{index:match.getRow(),values:sheet.getRange(match.getRow(),1,1,8).getValues()[0]}:null;
}
function submitSurvey(payload){
  if(!payload || typeof payload.id!=='string'||!/^[a-f0-9-]{36}$/i.test(payload.id)||JSON.stringify(payload).length>20000)throw new Error('Некорректный запрос.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    const sheet=sheet_('Responses');const existing=responseRow_(sheet,payload.id);
    if(existing){
      if(existing.values[2]!==JSON.stringify(payload.answers))throw new Error('Этот ответ уже сохранён. Начните анкету заново.');
      return {result:JSON.parse(existing.values[3]),id:payload.id,token:token_(payload.id)};
    }
    const survey=readSurvey_();
    if(payload.version!==survey.version)throw new Error('Вопросы обновились. Обновите страницу и пройдите анкету заново.');
    const result=evaluate(survey,payload.answers);
    const token=token_(payload.id);
    sheet.appendRow([payload.id,new Date().toISOString(),JSON.stringify(payload.answers),JSON.stringify(result),'','','','']);
    SpreadsheetApp.flush();
    return {result,id:payload.id,token};
  } finally {lock.releaseLock();}
}
function sendRecommendations(payload){
  if(!payload||typeof payload.id!=='string'||typeof payload.token!=='string'||payload.token!==token_(payload.id)||payload.consent!==true)throw new Error('Подтвердите согласие на отправку письма.');
  const email=String(payload.email||'').trim().toLowerCase();
  if(email.length>254||! /^[a-z0-9][a-z0-9.!#$%&'*+/=?^_`{|}~-]*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email))throw new Error('Проверьте email.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    const sheet=sheet_('Responses');const row=responseRow_(sheet,payload.id);
    if(!row)throw new Error('Результат не найден. Пройдите анкету заново.');
    if(Date.now()-Date.parse(row.values[1])>24*60*60*1000)throw new Error('Срок отправки истёк. Пройдите анкету заново.');
    if(row.values[6]==='sent')return {sent:true};
    if(row.values[6]==='pending')throw new Error('Запрос уже обработан, но статус доставки не подтверждён. Проверьте почту.');
    const rows=sheet.getDataRange().getValues().slice(1);
    const recent=rows.filter(r=>r[7]&&Date.now()-Date.parse(r[7])<86400000);
    if(recent.some(r=>r[4]===email))throw new Error('На этот адрес уже запрошено письмо за последние 24 часа.');
    if(recent.length>=50||MailApp.getRemainingDailyQuota()<1)throw new Error('Лимит отправки на сегодня исчерпан. Рекомендации доступны на экране.');
    const result=JSON.parse(row.values[3]);const now=new Date().toISOString();
    // Persist before sending. A lost acknowledgement must never cause duplicate email.
    sheet.getRange(row.index,5,1,4).setValues([[email,now,'pending',now]]);SpreadsheetApp.flush();
    try {
      MailApp.sendEmail({to:email,subject:'Ваш результат Food Habits',name:'Food Habits',body:result.title+'\n\n'+result.description+'\n\n'+result.recommendations.map((r,i)=>(i+1)+'. '+r).join('\n\n')+'\n\nЭто демонстрационная анкета о повседневных привычках, а не медицинская оценка. Вы получили это разовое письмо по запросу на сайте Food Habits.'});
      sheet.getRange(row.index,7).setValue('sent');SpreadsheetApp.flush();
    }catch(error){throw new Error('Не удалось подтвердить отправку. Проверьте почту; рекомендации остаются на экране.');}
    return {sent:true};
  } finally {lock.releaseLock();}
}
