import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS,CONTENT_VERSION} from '../../viewer/lesson_content.js';
import {createLearningProgress,createPostopReplay,resolveTeachingScene,focusTeachingTarget,learningPhase,LEARNING_KEY,POSTOP_REPLAY_KEY,POSTOP_REPLAY_MAX} from '../../viewer/anatomy_learning.js';
import {TEACHING_GUIDES} from '../../viewer/lesson_briefings.js';

const store=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
test('local resume retains the exact reviewed step and phase without claiming mastery',()=>{
  const storage=store(),p=createLearningProgress(storage);
  p.visit('motor-cst',4,'compare');p.visit('motor-cst',1,'explain');
  const again=createLearningProgress(storage);
  assert.equal(again.lastLesson,'motor-cst');
  assert.deepEqual(again.get('motor-cst'),{step:1,phase:'explain',visited:[1,4],reviewed:false});
  again.review('motor-cst');assert.equal(again.get('motor-cst').reviewed,true);
  assert.doesNotMatch(storage.getItem(LEARNING_KEY),/master|patient|case|answer|camera/);
});
test('progress survives a content version bump but rejects unknown lessons and corrupt or out-of-range records',()=>{
  const storage=store();
  for(const value of ['{broken','null',JSON.stringify({lastLesson:'motor-cst',lessons:{'motor-cst':{step:3}}})]){
    storage.setItem(LEARNING_KEY,value);assert.equal(createLearningProgress(storage).lastLesson,null);
  }
  storage.setItem(LEARNING_KEY,JSON.stringify({version:'2026-09-10.4',lastLesson:'motor-cst',lessons:{'motor-cst':{step:3,phase:'compare',visited:[0,3]}}}));
  assert.deepEqual(createLearningProgress(storage).get('motor-cst'),{step:3,phase:'compare',visited:[0,3],reviewed:false});
  storage.setItem(LEARNING_KEY,JSON.stringify({version:CONTENT_VERSION,lastLesson:'unknown',lessons:{
    unknown:{step:0},'motor-cst':{step:99,phase:'recap',visited:[0,99,-1,'2'],reviewed:true}}}));
  assert.equal(createLearningProgress(storage).get('motor-cst'),null);
  const p=createLearningProgress(storage);assert.throws(()=>p.visit('motor-cst',-1,'orient'));
  assert.throws(()=>p.visit('not-installed',0,'orient'));
});
test('storage denial leaves a working session and reports no persistent save',()=>{
  const p=createLearningProgress({getItem(){throw Error('denied');},setItem(){throw Error('quota');}});
  p.visit('optic-radiation',2,'compare');assert.equal(p.get('optic-radiation').step,2);assert.equal(p.persistent,false);
  assert.equal(learningPhase('invalid'),'orient');assert.equal(learningPhase('explain'),'explain');
});
test('every mounted lecture has a case question and three source-grounded takeaways',()=>{
  assert.deepEqual(Object.keys(TEACHING_GUIDES).sort(),LESSONS.map(l=>l.id).sort());
  for(const lesson of LESSONS){const guide=TEACHING_GUIDES[lesson.id];
    assert.ok(guide.question.length>30);assert.ok(guide.takeaways.length===3);
    assert.ok(['L','R'].includes(guide.hemisphere));
    for(const point of guide.takeaways){assert.ok(point.text.length>30);assert.ok(lesson.steps[point.step]);}
  }
});
test('authored lessons have explicit sides and do not inherit an unrelated network wash',()=>{
  const motor=LESSONS.find(l=>l.id==='motor-cst'),attention=LESSONS.find(l=>l.id==='attention-networks');
  const medial=resolveTeachingScene(motor,motor.steps[1]);
  assert.equal(medial.side,'L');assert.equal(medial.camera.view,'medial');assert.deepEqual(medial.network,{mode:'off',focus:null});
  assert.deepEqual(resolveTeachingScene(attention,attention.steps[0]).network,{mode:'focus',focus:3});
  assert.equal(resolveTeachingScene(attention,attention.steps[1]).side,'R');
});
test('inspecting cortical, deep and bundle targets retains the authored neighbours',()=>{
  const motor=LESSONS.find(l=>l.id==='motor-cst');
  const medial=resolveTeachingScene(motor,motor.steps[1]),copy=structuredClone(medial);
  const parcel=focusTeachingTarget(medial,{kind:'parcel',id:44});
  assert.equal(parcel.regions[0].id,44);assert.deepEqual(new Set(parcel.regions.map(r=>r.id)),new Set(medial.regions.map(r=>r.id)));
  assert.deepEqual(medial,copy);
  const capsule=resolveTeachingScene(motor,motor.steps[4]);
  const deep=focusTeachingTarget(capsule,{kind:'deep',id:'THA'});
  assert.deepEqual(deep.deepRegionIds,capsule.deepRegionIds);assert.deepEqual(deep.deepFocusIds,['THA-lh']);
  const bundle=focusTeachingTarget(capsule,{kind:'bundle',id:'CBT'});
  assert.deepEqual(new Set([...bundle.bundleIds,...bundle.ghostIds]),new Set([...capsule.bundleIds,...capsule.ghostIds]));
  assert.deepEqual(bundle.regions,capsule.regions);assert.deepEqual(bundle.bundleIds,['CBT_L']);
});
test('teach-back stores only a timestamp and missing term ids, and survives a reload',()=>{
  const storage=store(),p=createLearningProgress(storage);
  assert.equal(p.teachback('motor-cst',['thalamus-medial']),null,'no record, no teach-back');
  p.visit('motor-cst',9,'explain');
  const saved=p.teachback('motor-cst',['thalamus-medial','level-cerebellar']);
  assert.deepEqual(saved.missingIds,['thalamus-medial','level-cerebellar']);
  assert.ok(Number.isFinite(Date.parse(saved.at)));
  const raw=storage.getItem(LEARNING_KEY);
  assert.deepEqual(Object.keys(JSON.parse(raw).lessons['motor-cst'].teachback).sort(),['at','missingIds']);
  assert.doesNotMatch(raw,/transcript|text|patient/);
  const again=createLearningProgress(storage);
  assert.deepEqual(again.get('motor-cst').teachback,saved);
  again.visit('motor-cst',3,'compare');assert.deepEqual(again.get('motor-cst').teachback,saved,'a later visit keeps the record');
  again.get('motor-cst').teachback.missingIds.push('mutated');assert.deepEqual(again.get('motor-cst').teachback,saved,'get() returns a copy');
  assert.deepEqual(p.teachback('motor-cst',[]).missingIds,[]);
  assert.throws(()=>p.teachback('motor-cst',['Not An Id']));assert.throws(()=>p.teachback('motor-cst','thalamus'));
});
test('malformed teach-back records are dropped on restore without losing the lesson record',()=>{
  const storage=store();
  for(const teachback of [{at:'not a date',missingIds:[]},{at:'2026-09-25T00:00:00.000Z',missingIds:'thalamus'},
    {at:'2026-09-25T00:00:00.000Z',missingIds:[1]},{missingIds:[]},'x',{at:'2026-09-25T00:00:00.000Z',missingIds:['ok','<script>']},
    {at:'2026-09-25T00:00:00.000Z',missingIds:Array.from({length:65},(_,i)=>`t${i}`)}]){
    storage.setItem(LEARNING_KEY,JSON.stringify({version:CONTENT_VERSION,lastLesson:'motor-cst',lessons:{'motor-cst':{step:2,phase:'compare',visited:[2],teachback}}}));
    assert.deepEqual(createLearningProgress(storage).get('motor-cst'),{step:2,phase:'compare',visited:[2],reviewed:false},JSON.stringify(teachback));
  }
  storage.setItem(LEARNING_KEY,JSON.stringify({version:CONTENT_VERSION,lastLesson:'motor-cst',lessons:{'motor-cst':{step:2,phase:'compare',visited:[2],
    teachback:{at:'2026-09-25T00:00:00.000Z',missingIds:['level-cerebellar'],transcript:'should vanish'}}}}));
  assert.deepEqual(createLearningProgress(storage).get('motor-cst').teachback,{at:'2026-09-25T00:00:00.000Z',missingIds:['level-cerebellar']});
});
test('post-op replay notes stay on the device, cap at 2000 characters, clear, and drop malformed entries',()=>{
  const storage=store(),r=createPostopReplay(storage);
  assert.equal(r.get('motor-cst'),null);
  const long='x'.repeat(POSTOP_REPLAY_MAX+500);
  assert.equal(r.save('motor-cst',long).text.length,POSTOP_REPLAY_MAX);
  const stored=JSON.parse(storage.getItem(POSTOP_REPLAY_KEY));
  assert.deepEqual(Object.keys(stored),['motor-cst']);assert.equal(stored['motor-cst'].text.length,POSTOP_REPLAY_MAX);
  assert.ok(Number.isFinite(Date.parse(stored['motor-cst'].at)));
  assert.equal(createPostopReplay(storage).get('motor-cst').text.length,POSTOP_REPLAY_MAX);
  r.save('optic-radiation','Confirmed the lateral relationship.');r.clear('motor-cst');
  assert.equal(createPostopReplay(storage).get('motor-cst'),null);
  assert.equal(createPostopReplay(storage).get('optic-radiation').text,'Confirmed the lateral relationship.');
  assert.equal(r.save('optic-radiation','   '),null,'blank note clears');assert.equal(r.get('optic-radiation'),null);
  assert.throws(()=>r.save('not-installed','text'));
  storage.setItem(POSTOP_REPLAY_KEY,JSON.stringify({unknown:{at:'2026-09-25T00:00:00.000Z',text:'a'},'motor-cst':{at:'bad',text:'a'},
    'optic-radiation':{at:'2026-09-25T00:00:00.000Z',text:42},'internal-capsule':{at:'2026-09-25T00:00:00.000Z',text:'y'.repeat(3000)}}));
  const restored=createPostopReplay(storage);
  assert.equal(restored.get('unknown'),null);assert.equal(restored.get('motor-cst'),null);assert.equal(restored.get('optic-radiation'),null);
  assert.equal(restored.get('internal-capsule')?.text.length,POSTOP_REPLAY_MAX);
  storage.setItem(POSTOP_REPLAY_KEY,'{broken');assert.equal(createPostopReplay(storage).get('motor-cst'),null);
  const denied=createPostopReplay({getItem(){throw Error('denied');},setItem(){throw Error('quota');}});
  denied.save('motor-cst','note');assert.equal(denied.persistent,false);
  assert.equal(createPostopReplay(undefined).persistent,false);
});
