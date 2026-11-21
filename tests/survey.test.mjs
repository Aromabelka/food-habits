import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context=vm.createContext({});
vm.runInContext(readFileSync(new URL('../src/survey.js',import.meta.url),'utf8')+';globalThis.api={SURVEY,evaluate,activeQuestions,validateAnswers};',context);
const {SURVEY,evaluate,activeQuestions,validateAnswers}=context.api;
const good=()=>({Q1:'OFTEN',Q2:'TWO_PLUS',Q3:'OFTEN',Q4:'MANY',Q5:'HIGH',Q6:'RARE',Q7:'SOON'});
const unknown=()=>Object.fromEntries(Object.keys(good()).map(id=>[id,'UNKNOWN']));
test('seven or eight questions; inactive follow-up is rejected',()=>{
 assert.equal(activeQuestions(good()).length,7);assert.equal(activeQuestions({...good(),Q1:'NO_BREAKFAST'}).length,8);
 assert.throws(()=>evaluate({...good(),Q1:'NO_BREAKFAST'}));
 assert.throws(()=>evaluate({...good(),Q1A:'RARE'}));
 assert.equal(evaluate({...good(),Q1:'NO_BREAKFAST',Q1A:'RARE'}).breakfast_context,'first_meal');
});
test('support and orientation make no invented deficiency claim',()=>{
 assert.equal(evaluate(good()).result_mode,'support');assert.equal(evaluate(unknown()).result_mode,'orientation');
 assert.match(evaluate(good()).title,/Сохраните/);
});
test('single known plant answer yields relevant observation and action',()=>{
 const r=evaluate({...unknown(),Q2:'NONE'});assert.equal(r.result_code,'V');assert.equal(r.observation_key,'Q2');assert.match(r.action,/порцию овощей/);
 for(const [id,answer,word] of [['Q3','RARE','фрукт'],['Q4','FEW','покупку']])assert.ok(evaluate({...unknown(),[id]:answer}).action.includes(word));
});
test('water needs amount and strong context for high priority',()=>{
 assert.equal(evaluate({...good(),Q5:'UNKNOWN',Q6:'OFTEN',Q7:'DELAY_OFTEN'}).scores.W,null);
 assert.equal(evaluate({...good(),Q6:'OFTEN',Q7:'DELAY_OFTEN'}).scores.W,0);
 assert.equal(evaluate({...good(),Q5:'LOW',Q6:'UNKNOWN',Q7:'UNKNOWN'}).scores.W,1);
 assert.equal(evaluate({...good(),Q5:'LOW',Q6:'OFTEN'}).scores.W,2);
});
test('ties are deterministic: P then V then W; plant observation Q4 first',()=>{
 let r=evaluate({...good(),Q1:'RARE',Q2:'NONE',Q5:'LOW',Q6:'OFTEN'});assert.equal(r.result_code,'P');assert.equal(r.tie_resolved,true);
 r=evaluate({...good(),Q2:'NONE',Q4:'FEW',Q5:'LOW',Q6:'OFTEN'});assert.equal(r.result_code,'V');assert.equal(r.observation_key,'Q4');
});
test('missing answers and invalid codes never become unknown',()=>{
 for(const a of [{...good(),Q2:undefined},{...good(),Q2:'INVALID'},{...good(),Q2:0},{...good(),extra:'x'}])assert.throws(()=>validateAnswers(a));
});
test('all valid combinations give exactly one result; unknown never increases a score',()=>{
 const lists=SURVEY.questions.filter(q=>q.id!=='Q1A').map(q=>q.options.map(o=>o.id));
 let count=0;
 function walk(i,a){
  if(i===7){
   const follow=a.Q1==='NO_BREAKFAST'?['OFTEN','SOMETIMES','RARE','UNKNOWN']:[null];
   for(const q1a of follow){const r=evaluate({...a,Q1A:q1a});assert.ok(['P','V','W'].includes(r.result_code));assert.ok(r.title&&r.action);count++;}return;
  }
  const id='Q'+(i+1);for(const value of lists[i])walk(i+1,{...a,[id]:value});
 }
 walk(0,{});assert.equal(count,32768);
});
