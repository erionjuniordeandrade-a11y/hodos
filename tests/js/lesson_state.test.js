import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS,SOURCES,CONTENT_VERSION,validateLessons} from '../../viewer/lesson_content.js';
import {lessonStateFromSearch,lessonSearch,createLessonController} from '../../viewer/lesson_state.js';
test('ten substantive drafts have resolved sources, notes and knowledge checks',()=>{
  assert.equal(LESSONS.length,14);assert.equal(validateLessons(),true);
  for(const l of LESSONS){assert.equal(l.reviewStatus,'draft');assert.ok(l.steps.length>=4);
    assert.ok(l.steps.some(s=>s.question && s.answer));
    for(const s of l.steps){if(!s.question)assert.ok(s.text.length>80);assert.ok(s.notes.length>40);}}
  assert.equal(SOURCES.S11.evidenceClass,'conceptual_model');
  assert.equal(SOURCES.S12.evidenceClass,'experimental_anatomy');
  assert.equal(LESSONS.find(l=>l.id==='interoception').referenceOnly,true);
});
test('reload is always paused; stale link versions open the current content with a notice',()=>{
  assert.equal(lessonStateFromSearch('?teaching=1').status,'inactive');
  const state=lessonStateFromSearch(`?profile=teaching&lesson=motor-cst&lessonVersion=${CONTENT_VERSION}&step=2&playing=1`);
  assert.equal(state.status,'paused');assert.equal(state.step,2);
  const stale=lessonStateFromSearch('?lesson=motor-cst&lessonVersion=old&step=3');
  assert.equal(stale.status,'paused');assert.equal(stale.step,3);assert.match(stale.notice,/updated after this link/);
  assert.equal(lessonStateFromSearch('?lesson=motor-cst&lessonVersion=old&step=999').step,LESSONS.find(l=>l.id==='motor-cst').steps.length-1);
  assert.equal(lessonStateFromSearch(`?lesson=motor-cst&lessonVersion=${CONTENT_VERSION}&step=999`).step,0);
  assert.equal(state.notice,'');
  assert.equal(lessonStateFromSearch('?lesson=unknown').lessonId,null);
});
test('player controls change only lesson state and serialize no autoplay or case state',()=>{
  const c=createLessonController();c.select('motor-cst');c.play();
  const query=lessonSearch('?profile=presenter&test=1',c.state);
  assert.match(query,/profile=presenter/);assert.doesNotMatch(query,/playing|case|result/);
  c.move(1);assert.equal(c.state.status,'paused');assert.equal(c.state.step,1);
  c.move(-99);assert.equal(c.state.step,0);c.move(99);assert.equal(c.state.step,LESSONS.find(l=>l.id==='motor-cst').steps.length-1);
  c.close();assert.equal(c.state.status,'inactive');
});
