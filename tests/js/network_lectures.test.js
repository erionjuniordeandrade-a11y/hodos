import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS} from '../../viewer/lesson_content.js';
import {resolveScene} from '../../viewer/lesson_scene.js';
import {lessonStateFromSearch,lessonSearch} from '../../viewer/lesson_state.js';

const requested=['attention-networks','language-networks','default-mode-network','salience-network'];
test('four requested network lectures have complete resident journeys and deep links',()=>{
  for(const id of requested){
    const lecture=LESSONS.find(l=>l.id===id);
    assert(lecture,`Missing ${id}`);
    assert.equal(lecture.category,'Network lectures');
    assert(lecture.steps.length>=6);
    assert(lecture.goals.length>=3);
    for(const [step,s] of lecture.steps.entries()){
      assert(s.observe&&s.anatomy.length>=2&&s.question&&s.answer&&s.surgical&&s.sources.length);
      const query=lessonSearch('',{status:'paused',lessonId:id,step,error:''});
      const state=lessonStateFromSearch(query);
      assert.equal(state.lessonId,id);assert.equal(state.step,step);assert.equal(state.status,'paused');
      for(const side of ['L','R','both']){
        const scene=resolveScene(s,side);
        assert(scene.network,'Every lecture step declares its network display state');
        assert(scene.bundleIds.length+scene.ghostIds.length<=12);
      }
    }
  }
});

test('network teaching uses installed masks without inventing a language or salience parcellation',()=>{
  const attention=LESSONS.find(l=>l.id==='attention-networks');
  const language=LESSONS.find(l=>l.id==='language-networks');
  const dmn=LESSONS.find(l=>l.id==='default-mode-network');
  const salience=LESSONS.find(l=>l.id==='salience-network');
  assert(attention&&language&&dmn&&salience);
  assert(attention.steps.some(s=>s.scene.network==='DAN'));
  assert(attention.steps.some(s=>s.scene.network==='VAN'));
  assert(dmn.steps.some(s=>s.scene.network==='DMN'));
  assert(language.steps.every(s=>s.scene.network==='off'));
  assert(salience.steps.some(s=>s.scene.network==='VAN'));
  assert.match(salience.steps.map(s=>[s.text,...s.anatomy,s.answer].join(' ')).join(' '),/cingulo-opercular/);
  assert(LESSONS.filter(l=>!requested.includes(l.id)).every(l=>l.steps.every(s=>s.scene.network===null)),'Regional and evidence lessons leave the learner’s network wash alone');
});
