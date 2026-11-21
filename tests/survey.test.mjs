import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context=vm.createContext({});
vm.runInContext(readFileSync(new URL('../src/survey.js',import.meta.url),'utf8')+';globalThis.api={DEMO_SURVEY,evaluate,publicSurvey,validateSurvey};',context);
const {DEMO_SURVEY:survey,evaluate,publicSurvey,validateSurvey}=context.api;
const answers=score=>Object.fromEntries(survey.questions.map(q=>[q.id,[q.options.find(o=>o.score===score).id]]));
test('minimum, middle and maximum results',()=>{
 for(const [points,id,score] of [[0,'start',0],[1,'balance',58],[2,'steady',100]]){
  const a=points===1?Object.fromEntries(survey.questions.map(q=>[q.id,[q.options.find(o=>o.score===1)?.id||q.options[0].id]])):answers(points);
  const result=evaluate(survey,a);assert.equal(result.id,id);assert.equal(result.score,score);
 }
});
test('multi-select uses average, not the count of options',()=>{
 const a=answers(2);a.choice=['preference','plan'];assert.equal(evaluate(survey,a).score,100);
 a.choice=['preference','random'];assert.equal(evaluate(survey,a).score,92);
});
test('missing, unknown, duplicate and incompatible answers rejected',()=>{
 for(const mutate of [a=>delete a.rhythm,a=>a.rhythm=[],a=>a.rhythm=['fake'],a=>a.rhythm=['planned','mixed'],a=>a.choice=['plan','plan'],a=>a.support=['none','easy'],a=>a.extra=['x']]){
  const a=answers(2);mutate(a);assert.throws(()=>evaluate(survey,a));
 }
});
test('public survey excludes scores and recommendations',()=>{
 const p=publicSurvey(survey);assert.equal(p.results,undefined);assert.equal(p.questions[0].options[0].score,undefined);
});
test('overlapping results, missing ranges, duplicate IDs and invalid scores rejected',()=>{
 for(const mutate of [s=>s.results[0].max=50,s=>s.results[0].min=1,s=>s.questions[1].id=s.questions[0].id,s=>s.questions[0].options[0].score=99]){
  const s=JSON.parse(JSON.stringify(survey));mutate(s);assert.throws(()=>validateSurvey(s));
 }
});
