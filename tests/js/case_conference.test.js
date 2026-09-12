import test from 'node:test';
import assert from 'node:assert/strict';
import {CASES,CASE_VERSION} from '../../viewer/case_content.js';
import {CASE_KEY,createCaseStore} from '../../viewer/case_state.js';
import {LESSONS} from '../../viewer/lesson_content.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
test('review does not unlock practice stages or remain sticky when practice resumes',()=>{
 const store=createCaseStore(memory()),id=CASES[0].id;
 store.update(id,{stage:5,reviewOnly:true});assert.equal(store.get(id).maxStage,0);
 store.update(id,{stage:0,reviewOnly:false});assert.equal(store.get(id).reviewOnly,false);assert.equal(store.get(id).maxStage,0);
});
test('three fictional cases reference installed lessons and evidence',()=>{
 assert.equal(CASES.length,3);assert.equal(new Set(CASES.map(c=>c.id)).size,3);
 for(const c of CASES){assert.ok(c.fictional);assert.equal(c.rubric.length,4);assert.ok(c.finding);assert.ok(c.debrief.length>=3);
  for(const r of c.references){const l=LESSONS.find(l=>l.id===r.lesson);assert.ok(l,r.lesson);assert.ok(l.steps[r.step]);}
  for(const s of c.sources)assert.match(s.url,/^https:\/\/(pubmed\.ncbi\.nlm\.nih\.gov|doi\.org)\//);
 }
});
test('drafts are memory-only until opted in and never touch lesson progress',()=>{
 const storage=memory();storage.setItem('tractlab.anatomy.learning.v1','original');const store=createCaseStore(storage),id=CASES[0].id;
 store.update(id,{response:'draft',mode:'spoken',stage:4});assert.equal(storage.getItem(CASE_KEY),null);
 store.remember(id,true);assert.equal(store.persistent(id),true);assert.equal(createCaseStore(storage).get(id).response,'draft');
 assert.equal(storage.getItem('tractlab.anatomy.learning.v1'),'original');store.remember(id,false);assert.equal(storage.getItem(CASE_KEY),null);assert.equal(store.get(id).response,'draft');
});
test('reject incompatible records without merging or deleting them silently',()=>{
 const storage=memory(),id=CASES[0].id;storage.setItem(CASE_KEY,JSON.stringify({version:'older',records:{[id]:{response:'old'}}}));
 const store=createCaseStore(storage);assert.equal(store.get(id).response,'');assert.ok(store.notice);assert.match(storage.getItem(CASE_KEY),/older/);
 assert.equal(store.remember(id,true),false);store.clearSaved();assert.equal(store.remember(id,true),true);
});
test('storage denial stays usable and cannot claim saved',()=>{
 const store=createCaseStore({getItem(){throw Error('denied');},setItem(){throw Error('denied');},removeItem(){throw Error('denied');}}),id=CASES[0].id;
 store.update(id,{initial:'still here'});assert.equal(store.remember(id,true),false);assert.equal(store.persistent(id),false);assert.equal(store.get(id).initial,'still here');
});
test('invalid ids, stages, input sizes and non-text fields cannot enter saved records',()=>{
 const storage=memory(),store=createCaseStore(storage),id=CASES[0].id;
 assert.throws(()=>store.get('unknown'));store.update(id,{stage:99,response:'x'.repeat(12000),blob:'secret',mode:'other'});
 assert.equal(store.get(id).stage,0);assert.equal(store.get(id).mode,'written');assert.equal(store.get(id).response.length,10000);
 store.remember(id,true);assert.equal(JSON.parse(storage.getItem(CASE_KEY)).version,CASE_VERSION);assert.ok(!storage.getItem(CASE_KEY).includes('secret'));
 store.clear(id);assert.equal(store.get(id).response,'');assert.equal(storage.getItem(CASE_KEY),null);
});
