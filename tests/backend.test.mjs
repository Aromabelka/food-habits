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
 const context=vm.createContext({SpreadsheetApp:{openById:()=>book,flush(){}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){releases++;}})},PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties.get(key),setProperty:(key,value)=>properties.set(key,value)})},Utilities:{getUuid:randomUUID,base64EncodeWebSafe:bytes=>Buffer.from(bytes).toString('base64url'),computeDigest:(_,value)=>createHash('sha256').update(value).digest(),DigestAlgorithm:{SHA_256:'sha256'},computeHmacSha256Signature:(id,secret)=>createHmac('sha256',secret).update(id).digest()},ScriptApp:{getService:()=>({getUrl:()=> 'https://script.google.com/macros/s/test/exec'})},HtmlService:{createHtmlOutput:text=>({text})},MailApp:{getRemainingDailyQuota:()=>100,sendEmail:message=>mail.push(message)}});
 vm.runInContext(readFileSync(new URL('../src/survey.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../apps-script/Code.gs',import.meta.url),'utf8'),context);
 context.setup_();
 const survey=context.getSurvey();
 const payload={id:randomUUID(),version:survey.version,answers:{Q1:'OFTEN',Q2:'TWO_PLUS',Q3:'OFTEN',Q4:'MANY',Q5:'HIGH',Q6:'RARE',Q7:'SOON'},name:'Ирина',email:'Ira+quiz@EXAMPLE.COM',consent:true,consent_version:'2026-11-21'};
 return {context,sheets,mail,payload,releases:()=>releases};
}
test('stores contact and consent; duplicate request never sends twice',()=>{
 const f=fixture();assert.equal(f.context.requestSubscription(f.payload).status,'confirmation_sent');
 f.context.requestSubscription(f.payload);assert.equal(f.mail.length,1);
 const row=f.sheets.get('Subscribers').rows[1];assert.equal(row[2],'Ирина');assert.equal(row[3],'Ira+quiz@example.com');assert.equal(row[4],'pending');assert.ok(row[6].includes('Елены'));
 assert.equal(JSON.parse(row[11]).result_mode,'support');
});
test('validates consent, name, email, version and answers before writing',()=>{
 for(const change of [{consent:false},{name:' '},{name:'x'.repeat(81)},{email:'bad'},{version:'1'},{answers:{}},{consent_version:'old'}]){
  const f=fixture();assert.throws(()=>f.context.requestSubscription({...f.payload,...change}));assert.equal(f.sheets.get('Subscribers').getLastRow(),1);
 }
});
test('protects spreadsheet formulas and recomputes result',()=>{
 const f=fixture();f.context.requestSubscription({...f.payload,name:'=1+1',result_code:'W'});
 const row=f.sheets.get('Subscribers').rows[1];assert.equal(row[2],"'=1+1");assert.equal(JSON.parse(row[11]).result_code,'P');
});
test('mail failures and quota limits still preserve contacts without claiming email sent',()=>{
 for(const failure of ['quota','send']){
  const f=fixture();if(failure==='quota')f.context.MailApp.getRemainingDailyQuota=()=>0;else f.context.MailApp.sendEmail=()=>{throw new Error('timeout');};
  assert.equal(f.context.requestSubscription(f.payload).status,'saved_pending');assert.equal(f.sheets.get('Subscribers').getLastRow(),2);
  assert.equal(f.context.requestSubscription(f.payload).status,'saved_pending');
 }
});
test('confirmation requires signed POST; unsubscribe cancels all matching contacts',()=>{
 const f=fixture();f.context.requestSubscription(f.payload);
 const id=f.payload.id,token=f.context.sign_('confirm:'+id);
 assert.ok(f.context.doPost({parameter:{action:'confirm',id,token:'fake'}}).text.includes('недействительна'));
 f.context.doPost({parameter:{action:'confirm',id,token}});assert.equal(f.sheets.get('Subscribers').rows[1][4],'confirmed');
 f.context.doPost({parameter:{action:'unsubscribe',id,token:f.context.sign_('unsubscribe:'+id)}});assert.equal(f.sheets.get('Subscribers').rows[1][4],'unsubscribed');
 f.context.doPost({parameter:{action:'confirm',id,token}});assert.equal(f.sheets.get('Subscribers').rows[1][4],'unsubscribed');
});
test('new opt-in never silently restores an unsubscribed contact',()=>{
 const f=fixture();f.context.requestSubscription(f.payload);f.sheets.get('Subscribers').rows[1][4]='unsubscribed';
 f.context.requestSubscription({...f.payload,id:randomUUID()});assert.equal(f.sheets.get('Subscribers').rows[2][4],'pending');assert.equal(f.mail.length,1);
});
