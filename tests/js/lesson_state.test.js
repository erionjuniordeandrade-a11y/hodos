import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS,SOURCES,CONTENT_VERSION,validateLessons} from '../../viewer/lesson_content.js';
import {lessonStateFromSearch,lessonSearch,createLessonController,nextReading,previousReading,nextLabel,READING_PHASES} from '../../viewer/lesson_state.js';
test('ten substantive drafts have resolved sources, notes and knowledge checks',()=>{
  assert.equal(LESSONS.length,20);assert.equal(validateLessons(),true);
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
  const c=createLessonController();c.select('motor-cst');
  const query=lessonSearch('?profile=presenter&test=1&playing=1',c.state);
  assert.match(query,/profile=presenter/);assert.doesNotMatch(query,/playing|case|result/);
  c.go({step:1,phase:'compare'});assert.equal(c.state.status,'paused');assert.equal(c.state.step,1);assert.equal(c.state.phase,'compare');
  c.go({step:-99,phase:'orient'});assert.equal(c.state.step,0);c.go({step:99,phase:'nonsense'});assert.equal(c.state.step,LESSONS.find(l=>l.id==='motor-cst').steps.length-1);assert.equal(c.state.phase,'orient');
  c.close();assert.equal(c.state.status,'inactive');assert.equal(c.state.phase,null);
});

test('a Reading walks brief, then orient, compare and explain per Step, then recap, and Next from recap closes the Lesson',()=>{
  const lesson=LESSONS.find(l=>l.id==='motor-cst'),n=lesson.steps.length,c=createLessonController();
  c.select(lesson.id);const walk=[`${c.state.step}:${c.state.phase}`];
  while(c.state.lessonId)walk.push(c.next().lessonId?`${c.state.step}:${c.state.phase}`:'closed');
  const expected=['0:brief',...Array.from({length:n},(_,i)=>[`${i}:orient`,`${i}:compare`,`${i}:explain`]).flat(),`${n-1}:recap`,'closed'];
  assert.deepEqual(walk,expected);
  // Previous retraces the same path back to the brief, which is its own floor.
  c.select(lesson.id,{step:n-1,phase:'recap'});const back=[];
  for(let i=0;i<expected.length;i++){back.push(`${c.state.step}:${c.state.phase}`);c.previous();}
  assert.deepEqual(back,expected.slice(0,-1).reverse().concat('0:brief'));
});

test('the transition table is total over every phase, and every Next label names where it leads',()=>{
  const n=4;
  for(const phase of READING_PHASES)for(const step of [0,1,n-1]){
    const to=nextReading({step,phase},n),from=previousReading({step,phase});
    assert.ok(to===null||READING_PHASES.includes(to.phase),`${phase} next`);assert.ok(READING_PHASES.includes(from.phase),`${phase} previous`);
    const label=nextLabel({step,phase},n);
    if(to===null)assert.equal(label,'All lessons');
    else if(to.phase==='recap')assert.equal(label,'Lesson recap');
    else if(to.step>step)assert.equal(label,'Next relationship');
    else assert.equal(label,{orient:'Begin lesson',compare:'Compare',explain:'Explain'}[to.phase]);
  }
  assert.deepEqual(previousReading({step:2,phase:'orient'}),{step:1,phase:'explain'});
  assert.deepEqual(previousReading({step:0,phase:'orient'}),{step:0,phase:'brief'});
});

test('a stale-link notice survives re-renders of its Reading but any transition retires it for good',()=>{
  const c=createLessonController({search:'?lesson=motor-cst&lessonVersion=old&step=2&phase=compare'});
  assert.equal(c.state.phase,'compare');assert.match(c.state.notice,/updated after this link/);
  c.previous();assert.equal(c.state.notice,'');c.next();
  assert.equal(c.state.phase,'compare');assert.equal(c.state.step,2);assert.equal(c.state.notice,'','returning to the opening Reading must not bring the notice back');
});

test('the URL carries the Reading: a link without a phase opens on orient, the library carries no phase',()=>{
  assert.equal(lessonStateFromSearch(`?lesson=motor-cst&lessonVersion=${CONTENT_VERSION}&step=1`).phase,'orient');
  assert.equal(lessonStateFromSearch(`?lesson=motor-cst&step=1&phase=recap`).phase,'recap');
  assert.equal(lessonStateFromSearch('?phase=recap').phase,null);
  const c=createLessonController();c.select('motor-cst',{step:2,phase:'explain'});
  const query=new URLSearchParams(lessonSearch('?profile=teaching&phase=old',c.state));
  assert.equal(query.get('phase'),'explain');assert.equal(query.get('step'),'2');assert.equal(query.get('profile'),'teaching');
  c.close();assert.equal(new URLSearchParams(lessonSearch('?profile=teaching&phase=old',c.state)).has('phase'),false);
});
