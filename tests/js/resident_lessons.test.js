import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LESSONS,SOURCES,CONTENT_VERSION,validateLessons} from '../../viewer/lesson_content.js';
import {resolveScene} from '../../viewer/lesson_scene.js';

test('every resident step teaches a relationship, an observation and an explained question',()=>{
  assert.notEqual(CONTENT_VERSION,'2026-09-07.1','rewritten sequences need their own link version');
  assert.equal(LESSONS.length,14);
  for(const l of LESSONS){
    assert.equal(l.audience,'Neurosurgical residents');
    assert(['Regional anatomy','Reading the evidence','Network lectures'].includes(l.category));
    assert(l.goals.length>=2);
    for(const [i,s] of l.steps.entries()){
      const at=`${l.id} ${i+1}`;
      assert(s.observe?.length>35,`${at}: an actionable scene task`);
      assert(s.anatomy?.length>=2,`${at}: spatial/interpretive explanation`);
      assert(s.surgical?.length>50,`${at}: clinical reasoning`);
      assert(s.question?.length>20&&s.answer?.length>60,`${at}: explained retrieval question`);
      assert(s.sources.length&&s.sources.every(id=>SOURCES[id]),`${at}: sources`);
      assert(!/source rows|operating point|source digest|signed setting/i.test(s.text+' '+s.surgical),`${at}: learner prose, not implementation instructions`);
    }
  }
  assert.equal(validateLessons(),true);
});

test('resident observations reference installed scene targets without invented anatomy',()=>{
  const surface=JSON.parse(readFileSync(new URL('../../viewer/atlas/surface.json',import.meta.url)));
  for(const l of LESSONS)for(const s of l.steps)for(const side of ['L','R']){
    const scene=resolveScene(s,side);
    for(const r of scene.regions)assert(surface.sets.glasser.regions[r.hemi][r.id]);
    for(const target of s.targets||[]){
      assert(['parcel','deep','bundle'].includes(target.kind));
      assert(target.label&&target.id!==undefined);
      if(target.kind==='parcel')assert(scene.regions.some(r=>r.id===target.id),`${l.id}: target is in the authored scene`);
      if(target.kind==='deep')assert(scene.deepRegionIds.some(id=>id.startsWith(target.id+'-')),`${l.id}: deep target is visible`);
      if(target.kind==='bundle')assert([...scene.bundleIds,...scene.ghostIds].some(id=>id===target.id||id.startsWith(target.id+'_')),`${l.id}: bundle target is present`);
    }
  }
});
