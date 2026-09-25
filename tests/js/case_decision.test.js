import test from 'node:test';
import assert from 'node:assert/strict';
import {CASES,CASE_VERSION,validateDecision} from '../../viewer/case_content.js';
import {CASE_KEY,BASE_STAGES,createCaseStore,stagesFor} from '../../viewer/case_state.js';

const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
const sources=[{id:'a',title:'Source A',url:'https://pubmed.ncbi.nlm.nih.gov/1/',scope:'x'},{id:'b',title:'Source B',url:'https://pubmed.ncbi.nlm.nih.gov/2/',scope:'y'}];
const option=(id,sourceIds=['a'])=>({id,label:`Option ${id}`,rationale:`Why ${id}`,sourceIds});
const fixture=(id,options)=>({id,sources,...(options?{decision:{question:'What next?',options}}:{})});
const plain=fixture('fx-plain'),three=fixture('fx-three',[option('x'),option('y',[]),option('z',['a','b'])]),four=fixture('fx-four',[option('p'),option('q',[]),option('r'),option('s',['b'])]);
const cases=[plain,three,four];

test('validator accepts no decision, 2–4 options and empty source lists',()=>{
 assert.equal(validateDecision(plain),true);
 assert.equal(validateDecision(fixture('two',[option('x'),option('y',[])])),true);
 assert.equal(validateDecision(three),true);assert.equal(validateDecision(four),true);
 for(const c of CASES)assert.equal(validateDecision(c),true,c.id);
});
test('validator rejects foreign sources, repeated ids and out-of-range option counts',()=>{
 assert.throws(()=>validateDecision(fixture('foreign',[option('x',['not-here']),option('y')])),/not in this case's sources/);
 assert.throws(()=>validateDecision(fixture('dup',[option('x'),option('x')])),/repeats/);
 assert.throws(()=>validateDecision(fixture('one',[option('x')])),/2–4 options/);
 assert.throws(()=>validateDecision(fixture('five',['a','b','c','d','e'].map(id=>option(id)))),/2–4 options/);
 assert.throws(()=>validateDecision(fixture('none',[])),/2–4 options/);
 assert.throws(()=>validateDecision({id:'noq',sources,decision:{question:'',options:[option('x'),option('y')]}}),/question/);
 assert.throws(()=>validateDecision(fixture('nolist',[option('x'),{...option('y'),sourceIds:undefined}])),/must be a list/);
 assert.throws(()=>validateDecision(fixture('norat',[option('x'),{...option('y'),rationale:' '}])),/label and a rationale/);
});
test('stage list inserts Decide only for cases with a decision',()=>{
 assert.deepEqual(BASE_STAGES,['Case','Interpret','Explore','Reconsider','Respond','Debrief']);
 assert.deepEqual(stagesFor(plain),BASE_STAGES);
 assert.deepEqual(stagesFor(three),['Case','Interpret','Explore','Reconsider','Decide','Respond','Debrief']);
 const store=createCaseStore(memory(),{cases});
 assert.equal(store.stages('fx-plain').length,6);assert.equal(store.stages('fx-four').length,7);
 // Installed cases without a decision keep exactly the current six stages.
 const live=createCaseStore(memory());
 for(const c of CASES)assert.equal(live.stages(c.id).length,c.decision?7:6,c.id);
 assert.ok(CASES.every(c=>c.decision),'every live case carries a reviewed decision');
});
test('saved state for a case without a decision restores unchanged',()=>{
 const storage=memory(),id='fx-plain';
 const legacy={stage:4,maxStage:5,initial:'i',revision:'r',response:'resp',mode:'spoken',spokenDone:true,reviewOnly:false,ratings:{0:'addressed',3:'revisit'}};
 storage.setItem(CASE_KEY,JSON.stringify({version:CASE_VERSION,records:{[id]:legacy}}));
 const r=createCaseStore(storage,{cases}).get(id);
 assert.equal(r.stage,4);assert.equal(r.maxStage,5);assert.equal(r.initial,'i');assert.equal(r.revision,'r');assert.equal(r.response,'resp');
 assert.equal(r.mode,'spoken');assert.equal(r.spokenDone,true);assert.deepEqual(r.ratings,{0:'addressed',3:'revisit'});assert.equal(r.decision,null);
 // Stage 6 does not exist for a six-stage case.
 const s=createCaseStore(memory(),{cases});s.update(id,{stage:6});assert.equal(s.get(id).stage,0);
});
test('legacy six-stage saved state migrates when the case gains a decision',()=>{
 const storage=memory();
 storage.setItem(CASE_KEY,JSON.stringify({version:CASE_VERSION,records:{
  'fx-three':{stage:4,maxStage:5,response:'kept',initial:'kept-too'}, // Respond, Debrief reached
  'fx-four':{stage:3,maxStage:3},                                      // Reconsider: before the insertion point
 }}));
 const store=createCaseStore(storage,{cases}),stages=store.stages('fx-three');
 const a=store.get('fx-three');assert.equal(stages[a.stage],'Respond');assert.equal(stages[a.maxStage],'Debrief');assert.equal(a.response,'kept');assert.equal(a.initial,'kept-too');
 const b=store.get('fx-four');assert.equal(b.stage,3);assert.equal(b.maxStage,3);
 // Once saved under the new layout, indices are not shifted again.
 store.remember('fx-three',true);const again=createCaseStore(storage,{cases}).get('fx-three');
 assert.equal(again.stage,5);assert.equal(again.maxStage,6);assert.equal(JSON.parse(storage.getItem(CASE_KEY)).records['fx-three'].stages,7);
 // A seven-stage record read back after the decision is removed falls back without overflowing.
 const drop=memory();drop.setItem(CASE_KEY,JSON.stringify({version:CASE_VERSION,records:{'fx-plain':{stages:7,stage:4,maxStage:6}}}));
 const c=createCaseStore(drop,{cases}).get('fx-plain');assert.equal(BASE_STAGES[c.stage],'Reconsider');assert.equal(BASE_STAGES[c.maxStage],'Debrief');
});
test('a committed choice persists, is locked for the attempt and clears on reset',()=>{
 const storage=memory(),store=createCaseStore(storage,{cases});
 store.remember('fx-four',true);
 store.decide('fx-four','q','2026-09-25T10:00:00.000Z');
 assert.deepEqual(store.get('fx-four').decision,{optionId:'q',at:'2026-09-25T10:00:00.000Z'});
 store.decide('fx-four','p');assert.equal(store.get('fx-four').decision.optionId,'q');
 const saved=JSON.parse(storage.getItem(CASE_KEY));assert.equal(saved.version,CASE_VERSION);assert.deepEqual(saved.records['fx-four'].decision,{optionId:'q',at:'2026-09-25T10:00:00.000Z'});
 assert.deepEqual(createCaseStore(storage,{cases}).get('fx-four').decision,{optionId:'q',at:'2026-09-25T10:00:00.000Z'});
 // Unknown options and cases without a decision cannot hold one.
 store.update('fx-three',{decision:{optionId:'nope',at:'t'}});assert.equal(store.get('fx-three').decision,null);
 store.update('fx-plain',{decision:{optionId:'x',at:'t'}});assert.equal(store.get('fx-plain').decision,null);
 store.clear('fx-four');assert.equal(store.get('fx-four').decision,null);assert.equal(storage.getItem(CASE_KEY),null);
 store.decide('fx-four','p','t2');assert.equal(store.get('fx-four').decision.optionId,'p');
});
