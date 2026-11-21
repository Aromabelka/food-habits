import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash,createHmac,randomUUID} from 'node:crypto';
function fixture(){
 const sheets=new Map(),properties=new Map(),mail=[];let releases=0;
 class Sheet {
  constructor(){this.rows=[];}
  getLastRow(){return this.rows.length;}
  setFrozenRows(){}
  getDataRange(){return {getValues:()=>this.rows.map(r=>[...r])};}
  appendRow(row){this.rows.push(row);}
  getRange(row,col,height=1,width=1){
   const range={getValues:()=>Array.from({length:height},(_,r)=>Array.from({length:width},(_,c)=>this.rows[row+r-1]?.[col+c-1]??'')),setValues:values=>{values.forEach((cells,r)=>cells.forEach((value,c)=>{this.rows[row+r-1]??=[];this.rows[row+r-1][col+c-1]=value;}));return range;},setValue:value=>range.setValues([[value]]),setFontWeight:()=>range,createTextFinder:id=>{
    const finder={matchEntireCell:()=>finder,useRegularExpression:()=>finder,findNext:()=>{const i=this.rows.findIndex((r,i)=>i>=row-1&&r[col-1]===id);return i<0?null:{getRow:()=>i+1};}};return finder;
   }};return range;
  }
 }
 const book={getSheetByName:name=>sheets.get(name),insertSheet:name=>{const sheet=new Sheet();sheets.set(name,sheet);return sheet;}};
 const context=vm.createContext({SpreadsheetApp:{openById:()=>book,flush(){}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){releases++;}})},PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties.get(key),setProperty:(key,value)=>properties.set(key,value)})},Utilities:{getUuid:randomUUID,base64EncodeWebSafe:bytes=>Buffer.from(bytes).toString('base64url'),computeDigest:(_,value)=>createHash('sha256').update(value).digest(),DigestAlgorithm:{SHA_256:'sha256'},computeHmacSha256Signature:(id,secret)=>createHmac('sha256',secret).update(id).digest()},MailApp:{getRemainingDailyQuota:()=>100,sendEmail:message=>mail.push(message)}});
 vm.runInContext(readFileSync(new URL('../src/survey.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8'),context);
 context.setup_();
 const survey=context.getSurvey();
 const payload={id:randomUUID(),version:survey.version,answers:Object.fromEntries(survey.questions.map(q=>[q.id,[q.options[0].id]]))};
 return {context,sheets,mail,payload,releases:()=>releases};
}
test('setup preserves existing data; anonymous submission is idempotent',()=>{
 const f=fixture();f.context.setup_();assert.equal(f.sheets.get('Questions').getLastRow(),7);
 const a=f.context.submitSurvey(f.payload),b=f.context.submitSurvey(f.payload);
 assert.equal(a.token,b.token);assert.equal(a.result.score,100);assert.equal(f.sheets.get('Responses').getLastRow(),2);assert.ok(f.releases()>=4);
});
test('stale survey and modified duplicate rejected without writing',()=>{
 const f=fixture();assert.throws(()=>f.context.submitSurvey({...f.payload,version:'stale'}));assert.equal(f.sheets.get('Responses').getLastRow(),1);
 f.context.submitSurvey(f.payload);assert.throws(()=>f.context.submitSurvey({...f.payload,answers:{}}));
});
test('email requires consent and valid token; replay sends only once',()=>{
 const f=fixture(),receipt=f.context.submitSurvey(f.payload),request={...receipt,email:'test@example.com',consent:true};
 assert.throws(()=>f.context.sendRecommendations({...request,token:'fake'}));
 assert.throws(()=>f.context.sendRecommendations({...request,consent:false}));
 assert.throws(()=>f.context.sendRecommendations({...request,email:'=formula@example.com'}));
 f.context.sendRecommendations(request);f.context.sendRecommendations(request);assert.equal(f.mail.length,1);assert.equal(f.sheets.get('Responses').rows[1][6],'sent');
});
test('same address cannot consume multiple sends in 24 hours',()=>{
 const f=fixture();const first=f.context.submitSurvey(f.payload);f.context.sendRecommendations({...first,email:'test@example.com',consent:true});
 const second=f.context.submitSurvey({...f.payload,id:randomUUID()});assert.throws(()=>f.context.sendRecommendations({...second,email:'TEST@example.com',consent:true}));assert.equal(f.mail.length,1);
});
test('uncertain email delivery is recorded and never blindly retried',()=>{
 const f=fixture(),receipt=f.context.submitSurvey(f.payload);f.context.MailApp.sendEmail=()=>{throw new Error('connection lost');};
 const request={...receipt,email:'test@example.com',consent:true};assert.throws(()=>f.context.sendRecommendations(request));assert.equal(f.sheets.get('Responses').rows[1][6],'pending');assert.throws(()=>f.context.sendRecommendations(request));
});
test('expired result and exhausted quota prevent delivery',()=>{
 const f=fixture(),receipt=f.context.submitSurvey(f.payload),request={...receipt,email:'test@example.com',consent:true};
 f.context.MailApp.getRemainingDailyQuota=()=>0;assert.throws(()=>f.context.sendRecommendations(request));
 f.context.MailApp.getRemainingDailyQuota=()=>100;f.sheets.get('Responses').rows[1][1]='2020-01-01T00:00:00Z';assert.throws(()=>f.context.sendRecommendations(request));assert.equal(f.mail.length,0);
});
