import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS,CONTENT_VERSION} from '../../viewer/lesson_content.js';
import {createLearningProgress,resolveTeachingScene,focusTeachingTarget,learningPhase,LEARNING_KEY} from '../../viewer/anatomy_learning.js';
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
test('progress rejects stale versions, unknown lessons and corrupt or out-of-range records',()=>{
  const storage=store();
  for(const value of ['{broken','null',JSON.stringify({version:'old',lastLesson:'motor-cst',lessons:{'motor-cst':{step:3}}})]){
    storage.setItem(LEARNING_KEY,value);assert.equal(createLearningProgress(storage).lastLesson,null);
  }
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
