import {LESSONS,CONTENT_VERSION,SOURCES,REGIONS,sourceIdsForStep} from './lesson_content.js';
import {createLessonController,lessonSearch} from './lesson_state.js';
import {createLearningProgress,learningPhase,LEARNING_PHASES} from './anatomy_learning.js';
import {CURRICULUM,TEACHING_GUIDES} from './lesson_briefings.js';
import {createDissectionReference} from './dissection_references.js';

function el(tag,attrs={},text=''){
  const node=document.createElement(tag);
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
  if(text)node.textContent=text;return node;
}
const button=(text,id,action)=>{const node=el('button',{type:'button',id},text);node.addEventListener('click',action);return node;};
const list=items=>{const node=el('ul');for(const text of items)node.append(el('li',{},text));return node;};
const phaseFromSearch=search=>{const value=new URLSearchParams(search).get('phase');return ['brief','recap'].includes(value)?value:learningPhase(value);};

/** Anatomy's resident teaching experience is independent of the case viewer's
 * legacy lesson player. Callbacks expose only local reference display actions. */
export function mountAnatomyLessons(root,{onStep=()=>{},onInspect=()=>{},onRestore=()=>{},onExplore=()=>{},onMode=()=>{},onCompare=()=>{}}={}){
  let storage;try{storage=localStorage;}catch{/* Session-only progress still works. */}
  const progress=createLearningProgress(storage),revealed=new Set();
  let phase=phaseFromSearch(location.search),controller,lastScene='',lastReading='',focusHeading=false;
  const lessonNow=()=>LESSONS.find(l=>l.id===controller.state.lessonId);
  function sync(){
    const params=new URLSearchParams(lessonSearch(location.search,controller.state));
    if(controller.state.lessonId)params.set('phase',phase);else params.delete('phase');
    history.replaceState(history.state,'',`${location.pathname}${params.size?'?'+params:''}${location.hash}`);
  }
  function start(id,{resume=false}={}){
    const saved=resume?progress.get(id):null;
    phase=saved?.phase||'brief';focusHeading=true;
    // Restore emits once, so a resumed lesson never renders/saves step zero first.
    const params=new URLSearchParams();params.set('lesson',id);params.set('step',String(saved?.step||0));params.set('lessonVersion',CONTENT_VERSION);
    controller.restore(`?${params}`);
  }
  function goPhase(value){phase=value;focusHeading=true;render(controller.state);sync();}
  function goStep(index,requestedPhase='orient'){phase=requestedPhase;focusHeading=true;controller.move(index-controller.state.step);}
  function library(){phase='orient';focusHeading=true;controller.close();}
  function explore(){library();onExplore();onMode('explore');}
  function next(){const lesson=lessonNow(),state=controller.state;
    if(phase==='brief'){goPhase('orient');return;}
    const index=LEARNING_PHASES.indexOf(phase);
    if(index<2){goPhase(LEARNING_PHASES[index+1]);return;}
    if(state.step<lesson.steps.length-1)goStep(state.step+1);else goPhase('recap');
  }
  function previous(){
    const index=LEARNING_PHASES.indexOf(phase);
    if(phase==='recap')goPhase('explain');
    else if(index>0)goPhase(LEARNING_PHASES[index-1]);
    else if(controller.state.step>0)goStep(controller.state.step-1,'explain');else goPhase('brief');
  }
  function progressNote(){return el('p',{class:'learning-save-note'},progress.persistent?'Progress saved on this device · no account needed.':'Progress is available for this session; device storage is unavailable.');}
  function renderLibrary(state){
    onMode('library');lastScene='';onStep(null,null);
    root.append(el('p',{class:'lesson-kicker'},'THE HODOS COURSEBOOK'),el('h2',{id:'lessonCurrentTitle',tabindex:'-1'},'Choose a relationship to understand.'));
    if(state.error)root.append(el('p',{role:'status',class:'lesson-error'},state.error));
    const entry=el('div',{class:'library-entry'});
    if(progress.lastLesson){const lesson=LESSONS.find(l=>l.id===progress.lastLesson),saved=progress.get(lesson.id);
      const resume=button(`Resume · ${TEACHING_GUIDES[lesson.id].shortTitle}`,'lessonResume',()=>start(lesson.id,{resume:true}));
      resume.append(el('small',{},`Relationship ${saved.step+1} of ${lesson.steps.length} · ${saved.phase}`));entry.append(resume);
    }else entry.append(button('Start learning · Central region','lessonStart',()=>start('motor-cst')));
    entry.append(button('Explore anatomy','lessonExplore',explore));root.append(entry);
    const catalog=el('div',{class:'lesson-catalog'});
    let number=0;
    for(const group of CURRICULUM){const section=el('section',{'aria-label':group.title});
      const heading=el('div',{class:'curriculum-heading'});heading.append(el('h3',{},group.title),el('p',{},group.description));section.append(heading);
      for(const id of group.ids){const lesson=LESSONS.find(l=>l.id===id),guide=TEACHING_GUIDES[id],saved=progress.get(id);
        const row=button('',`lessonStart-${id}`,()=>start(id));row.className='curriculum-row';
        row.append(el('span',{class:'curriculum-number','aria-hidden':'true'},String(++number).padStart(2,'0')));
        const title=el('span',{class:'curriculum-name'},guide.shortTitle);title.append(el('small',{},`${lesson.steps.length} relationships · about ${lesson.minutes} min${saved?` · ${saved.reviewed?'reviewed':`${saved.visited.length} visited`}`:''}`));
        row.append(title,el('span',{'aria-hidden':'true'},'↗'));section.append(row);
      }catalog.append(section);
    }
    root.append(catalog,progressNote());
  }
  function appendReferences(body,step){
    const notes=el('details',{class:'lesson-reference-drawer'});notes.append(el('summary',{},'Sources & anatomy notes'));
    const sources=el('section',{class:'lesson-sources'}),ids=sourceIdsForStep(step);
    sources.append(el('h4',{},`Sources & limits (${ids.length})`),el('p',{class:'evidence-type'},step.evidenceClass.replaceAll('_',' ')));
    for(const id of ids){const source=SOURCES[id],row=el('div');
      row.append(el('a',{href:source.url,target:'_blank',rel:'noopener noreferrer'},`${id} · ${source.title}`),el('p',{},source.scope));sources.append(row);}
    if(!ids.length)sources.append(el('p',{},'Local display contract; no external biological claim.'));
    notes.append(sources);
    for(const id of step.regions){const region=REGIONS[id],card=el('details',{'data-region-card':id});
      card.append(el('summary',{},region.name),el('p',{},region.text));const links=el('small');
      for(const [index,sourceId] of region.sources.entries()){if(index)links.append(document.createTextNode(' · '));
        const source=SOURCES[sourceId];links.append(el('a',{href:source.url,target:'_blank',rel:'noopener noreferrer','aria-label':source.title},sourceId));}
      card.append(links);notes.append(card);
    }
    const teaching=el('details',{class:'lesson-notes'});teaching.append(el('summary',{},'Teaching notes'),el('p',{},step.notes));notes.append(teaching);
    body.append(notes);
  }
  function appendTargets(body,step){
    if(!step.targets?.length)return;
    const targets=el('div',{class:'lesson-targets','aria-label':'Compare structures in this relationship'});
    for(const [index,target] of step.targets.entries()){
      const control=button(target.label,`lessonTarget-${index}`,()=>{
        for(const sibling of targets.children)sibling.setAttribute('aria-pressed','false');control.setAttribute('aria-pressed','true');
        onInspect(target,step);
      });control.setAttribute('aria-pressed','false');targets.append(control);
    }body.append(targets);
  }
  function appendComparison(body,guide){
    if(!guide.comparison)return;
    const compare=el('details',{class:'network-comparison'});compare.append(el('summary',{},guide.comparison.title),el('p',{},guide.comparison.note));
    const controls=el('div',{class:'lesson-targets','aria-label':'Compare lecture models'});
    for(const [index,option] of guide.comparison.options.entries()){
      const control=button(option.label,`lectureCompare-${index}`,()=>{
        for(const sibling of controls.children)sibling.setAttribute('aria-pressed','false');control.setAttribute('aria-pressed','true');onCompare(guide.comparison,option);
      });control.setAttribute('aria-pressed','false');controls.append(control);
    }compare.append(controls);body.append(compare);
  }
  function render(state){
    const focusId=root.contains(document.activeElement)?document.activeElement.id:null;
    const readingId=`${state.lessonId}:${state.step}:${phase}`;
    const scrollTop=readingId===lastReading?root.querySelector('.lesson-scroll')?.scrollTop||0:0;
    root.replaceChildren();root.scrollLeft=0;
    const lesson=LESSONS.find(l=>l.id===state.lessonId);
    root.dataset.activeLesson=String(!!lesson);root.dataset.phase=phase;
    if(!lesson){renderLibrary(state);}
    else{
      const guide=TEACHING_GUIDES[lesson.id],step=lesson.steps[state.step];
      onMode(phase==='recap'?'recap':'lesson');
      const identity=`${lesson.id}:${state.step}`;
      if(identity!==lastScene){lastScene=identity;onStep(lesson,step);}
      if(LEARNING_PHASES.includes(phase))progress.visit(lesson.id,state.step,phase);
      const top=el('div',{class:'lesson-top'});top.append(button('← Lessons','lessonLibrary',library));
      const select=el('select',{id:'lessonSelect','aria-label':'Choose a guided lesson'});
      for(const item of LESSONS)select.append(el('option',{value:item.id},TEACHING_GUIDES[item.id].shortTitle));
      select.value=lesson.id;select.addEventListener('change',()=>start(select.value));top.append(select);root.append(top);
      const outline=el('details',{class:'lesson-outline'});
      outline.append(el('summary',{},`${phase==='recap'?'Lesson recap':`Relationship ${state.step+1} of ${lesson.steps.length}`} · ${guide.hemisphere==='L'?'left':'right'} reference`));
      const ordered=el('ol',{'aria-label':'Lesson relationships'});
      for(const [i,item] of lesson.steps.entries()){const li=el('li'),b=button(item.title,`lessonStep-${i}`,()=>goStep(i));
        b.setAttribute('aria-current',state.step===i?'step':'false');li.append(b);ordered.append(li);}
      outline.append(ordered);root.append(outline);
      if(!['brief','recap'].includes(phase)){
        const phases=el('nav',{class:'learning-phases','aria-label':'Teaching sequence'});
        for(const [i,p] of LEARNING_PHASES.entries()){const b=button(`${String(i+1).padStart(2,'0')} ${p[0].toUpperCase()+p.slice(1)}`,`phase-${p}`,()=>goPhase(p));
          b.setAttribute('aria-pressed',String(phase===p));phases.append(b);}root.append(phases);
      }
      const body=el('div',{class:'lesson-scroll'});root.append(body);
      const title=phase==='brief'?guide.shortTitle:phase==='recap'?'Explain the relationship.':step.title;
      body.append(el('p',{class:'lesson-kicker'},phase==='brief'?`${lesson.category} · ${lesson.minutes} minutes`:phase==='recap'?'TAKE IT INTO YOUR NEXT DISCUSSION':`${phase.toUpperCase()} · ${lesson.category}`),el('h2',{id:'lessonCurrentTitle',tabindex:'-1'},title));
      if(phase==='brief'){
        const brief=el('section',{class:'lesson-case','aria-label':'Opening case question'});brief.append(el('h3',{},'The question to carry with you'),el('p',{},guide.question));body.append(brief);
        body.append(el('p',{class:'lesson-lead'},lesson.summary),el('h3',{},'By the end, you should be able to'),list(lesson.goals));
        body.append(el('p',{class:'lesson-side-note'},`${guide.hemisphere==='L'?'Left':'Right'} hemisphere is the reference example. Lesson views are authored for this side; free exploration has separate controls.`));
      }else if(phase==='recap'){
        body.append(el('p',{class:'lesson-lead'},'Three relationships to keep. Revisit a scene, then explain the opening question in your own words.'));
        const takeaways=el('ol',{class:'recap-takeaways'});
        for(const point of guide.takeaways){const li=el('li');li.append(el('p',{},point.text),button(`Revisit relationship ${point.step+1}`,`recapStep-${point.step}`,()=>goStep(point.step,'compare')));takeaways.append(li);}body.append(takeaways);
        const challenge=el('section',{class:'lesson-check'});challenge.append(el('h3',{},'Return to the question'),el('p',{},guide.question));
        const answer=el('details',{id:'lessonAnswer'});answer.append(el('summary',{},'Review the explanation'),el('p',{},lesson.steps.at(-1).answer));challenge.append(answer);body.append(challenge);
        const record=progress.get(lesson.id);body.append(button(record?.reviewed?'Marked reviewed':'Mark reviewed','lessonReview',()=>{
          if(!progress.get(lesson.id))progress.visit(lesson.id,state.step,'explain');progress.review(lesson.id);render(state);
        }),progressNote());
        body.append(el('p',{class:'learning-save-note'},'Reviewed records your own review. It is not an assessment of competence.'));
        const nextGuide=TEACHING_GUIDES[guide.next];if(nextGuide)body.append(button(`Continue with ${nextGuide.shortTitle}`,'lessonNextTopic',()=>start(guide.next)));
        appendReferences(body,lesson.steps.at(-1));
      }else{
        const article=el('article',{id:'lessonCurrent','aria-labelledby':'lessonCurrentTitle'});
        if(phase==='orient'){
          article.append(el('p',{class:'lesson-lead'},step.text));
          const task=el('section',{class:'lesson-observe'});task.append(el('h3',{},'Find the relationship'),el('p',{},step.observe));appendTargets(task,step);article.append(task);
        }else if(phase==='compare'){
          const task=el('section',{class:'lesson-observe'});task.append(el('p',{},step.observe));appendTargets(task,step);article.append(task);
          const anatomy=el('section',{class:'lesson-anatomy'});anatomy.append(el('h3',{},'Read the neighbours'),list(step.anatomy));article.append(anatomy);
          appendComparison(article,guide);
          if(step.referencePlate)article.append(createDissectionReference(step.referencePlate));
        }else{
          const check=el('section',{class:'lesson-check'});check.append(el('h3',{},'Explain before revealing'),el('p',{},step.question));
          const answer=el('details',{id:'lessonAnswer'});answer.append(el('summary',{},'Reveal explanation'),el('p',{},step.answer));
          if(revealed.has(identity))answer.open=true;
          answer.addEventListener('toggle',()=>{if(answer.open)revealed.add(identity);else revealed.delete(identity);});check.append(answer);article.append(check);
          const surgical=el('section',{class:'lesson-surgical'});surgical.append(el('h3',{},'In a surgical discussion'),el('p',{},step.surgical));article.append(surgical);
        }
        body.append(article);
        const caseQuestion=el('details',{class:'lesson-case-reminder'});caseQuestion.append(el('summary',{},'The question for this lesson'),el('p',{},guide.question));body.append(caseQuestion);
        appendReferences(body,step);
      }
      body.append(el('p',{class:'lesson-version'},`Educational draft ${CONTENT_VERSION} · anatomical review pending`));body.scrollTop=scrollTop;
      const footer=el('div',{class:'lesson-controls'}),nav=el('div',{class:'lesson-nav'});
      if(phase==='recap')nav.append(button('Review final relationship','lessonPrev',previous),button('All lessons','lessonNext',library));
      else{
        const prev=button('Previous','lessonPrev',previous);prev.disabled=phase==='brief';
        const nextLabel=phase==='brief'?'Begin lesson →':phase==='orient'?'Compare →':phase==='compare'?'Explain →':state.step===lesson.steps.length-1?'Lesson recap →':'Next relationship →';
        nav.append(prev,button(nextLabel,'lessonNext',next));
      }footer.append(nav);
      const tools=el('div',{class:'lesson-tools'});tools.append(button('Restore lesson scene','lessonRestore',()=>{
        onRestore();for(const b of root.querySelectorAll('.lesson-targets button'))b.setAttribute('aria-pressed','false');
      }),button('Explore freely','lessonExplore',explore));footer.append(tools);root.append(footer);
    }
    lastReading=readingId;
    if(focusHeading){root.querySelector('#lessonCurrentTitle')?.focus({preventScroll:true});focusHeading=false;}
    else if(focusId)root.querySelector(`#${CSS.escape(focusId)}`)?.focus({preventScroll:true});
  }
  controller=createLessonController({search:location.search,onChange:state=>{sync();render(state);}});
  render(controller.state);sync();
  return {controller,library,explore,start,
    get phase(){return phase;},
    restore(search){phase=phaseFromSearch(search);controller.restore(search);},
    refresh({restoreView=false}={}){if(restoreView)lastScene='';render(controller.state);},dispose(){},
  };
}
