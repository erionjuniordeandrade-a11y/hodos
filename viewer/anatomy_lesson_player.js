import {LESSONS,CONTENT_VERSION,SOURCES,REGIONS,sourceIdsForStep} from './lesson_content.js';
import {createLessonController,lessonSearch,nextLabel} from './lesson_state.js';
import {createLearningProgress,createPostopReplay,LEARNING_PHASES,POSTOP_REPLAY_MAX} from './anatomy_learning.js';
import {matchTeachback,teachbackTerms,micTransition,MIC_IDLE} from './teachback.js';
import {CURRICULUM,TEACHING_GUIDES} from './lesson_briefings.js';
// Home page order is the teaching order: module numbers and the dropdown follow it.
const ORDERED_IDS=CURRICULUM.flatMap(group=>group.ids);
const moduleNumber=id=>String(ORDERED_IDS.indexOf(id)+1).padStart(2,'0');
import {createDissectionReference} from './dissection_references.js';

function el(tag,attrs={},text=''){
  const node=document.createElement(tag);
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
  if(text)node.textContent=text;return node;
}
const button=(text,id,action)=>{const node=el('button',{type:'button',id},text);node.addEventListener('click',action);return node;};
const list=items=>{const node=el('ul');for(const text of items)node.append(el('li',{},text));return node;};

/** Anatomy's resident teaching experience is independent of the case viewer's
 * legacy lesson player. Callbacks expose only local reference display actions. */
export function mountAnatomyLessons(root,{onStep=()=>{},onInspect=()=>{},onRestore=()=>{},onExplore=()=>{},onMode=()=>{},onCompare=()=>{},readOnlyProgress=false}={}){
  let storage;if(!readOnlyProgress)try{storage=localStorage;}catch{/* Session-only progress still works. */}
  const progress=createLearningProgress(storage),postop=createPostopReplay(storage),revealed=new Set();
  let controller,lastScene='',lastReading='',focusHeading=false;
  // Teach-back UI state is in memory only; the transcript lives in the textarea and is never kept.
  // `mic` is the microphone state; showMic projects it onto whichever panel is mounted.
  let explainOpen=false,recognition=null,mic=MIC_IDLE,showMic=()=>{};
  function micEvent(event){mic=micTransition(mic,event);showMic();}
  function stopListening(){if(!recognition)return;const active=recognition;recognition=null;try{active.abort();}catch{/* already stopped */}micEvent({type:'stop'});}
  function sync(){history.replaceState(history.state,'',`${location.pathname}${lessonSearch(location.search,controller.state)}${location.hash}`);}
  function start(id,{resume=false}={}){
    const saved=resume?progress.get(id):null;
    focusHeading=true;explainOpen=false;
    controller.select(id,{step:saved?.step||0,phase:saved?.phase||'brief'});
  }
  // Phone: stage and nav are sticky, so bring the heading just under the stage.
  function alignHeadingUnderStage(heading){
    if(!matchMedia('(max-width:760px)').matches)return;
    const stageBottom=document.querySelector('.atlas-stage')?.getBoundingClientRect().bottom??0;
    const delta=heading.getBoundingClientRect().top-stageBottom-16;
    if(Math.abs(delta)>4)window.scrollBy(0,delta);
  }
  // Every Reading change is a controller transition (lesson_state.js); the heading takes focus after each.
  function goStep(step,phase='orient'){focusHeading=true;controller.go({step,phase});}
  const goPhase=phase=>goStep(controller.state.step,phase);
  function library(){focusHeading=true;controller.close();}
  function explore(){library();onExplore();onMode('explore');}
  function next(){focusHeading=true;controller.next();}
  function previous(){focusHeading=true;controller.previous();}
  function progressNote(){return el('p',{class:'learning-save-note'},readOnlyProgress?'Case reference: lesson progress is session-only; your saved lessons are unchanged.':progress.persistent?'Progress saved on this device · no account needed.':'Progress is available for this session; device storage is unavailable.');}
  function renderLibrary(state){
    onMode('library');lastScene='';onStep(null,null);
    root.append(el('h2',{id:'lessonCurrentTitle',tabindex:'-1'},'Choose a relationship to understand.'));
    if(state.error)root.append(el('p',{role:'status',class:'lesson-error'},state.error));
    const entry=el('div',{class:'library-entry'});
    if(progress.lastLesson){const lesson=LESSONS.find(l=>l.id===progress.lastLesson),saved=progress.get(lesson.id);
      const resume=button(`Resume lesson ${moduleNumber(lesson.id)}`,'lessonResume',()=>start(lesson.id,{resume:true}));
      resume.append(el('small',{},`relationship ${saved.step+1} of ${lesson.steps.length}`));entry.append(resume);
    }else entry.append(button(`Begin lesson ${moduleNumber(ORDERED_IDS[0])}`,'lessonStart',()=>start(ORDERED_IDS[0])));
    entry.append(button('Explore','lessonExplore',explore));root.append(entry);
    const catalog=el('div',{class:'lesson-catalog'});
    let number=0;
    for(const group of CURRICULUM){const section=el('section',{'aria-label':group.title});
      const heading=el('div',{class:'curriculum-heading'});heading.append(el('h3',{},group.title),el('p',{},group.description));section.append(heading);
      for(const id of group.ids){const lesson=LESSONS.find(l=>l.id===id),guide=TEACHING_GUIDES[id],saved=progress.get(id);
        const row=button('',`lessonStart-${id}`,()=>start(id));row.className='curriculum-row';
        row.append(el('span',{class:'curriculum-number','aria-hidden':'true'},String(++number).padStart(2,'0')));
        const title=el('span',{class:'curriculum-name'},guide.shortTitle);title.append(el('small',{},`${lesson.steps.length} relationships, about ${lesson.minutes} min${saved?`, ${saved.reviewed?'reviewed':`${saved.visited.length} visited`}`:''}`));
        row.append(title);section.append(row);
      }catalog.append(section);
    }
    root.append(catalog,progressNote());
  }
  function teachbackResult(lesson,guide,record){
    const out=el('div',{id:'teachbackResult',role:'status','aria-live':'polite'});
    if(!record?.teachback)return out;
    const missing=teachbackTerms(guide.takeaways).filter(term=>record.teachback.missingIds.includes(term.id));
    const when=new Date(record.teachback.at).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
    if(!missing.length){out.append(el('p',{class:'teachback-none'},`Last explanation (${when}): every listed relationship was named.`));return out;}
    out.append(el('p',{},`Last explanation (${when}): not yet named`));
    const items=el('ul',{class:'teachback-missing'});
    for(const [index,term] of missing.entries()){const li=el('li');
      li.append(el('span',{},term.label),button(`Go to relationship ${term.step+1}`,`teachbackStep-${index}`,()=>goStep(term.step,'compare')));items.append(li);}
    out.append(items);return out;
  }
  /** Explain it: typed box, plus a microphone only where the browser offers speech recognition.
   * Only the missing relationships are shown; no score, no grade. Hidden when no terms exist. */
  function appendTeachback(body,lesson,guide,state){
    if(!teachbackTerms(guide.takeaways).length)return;
    const section=el('section',{class:'lesson-teachback','aria-label':'Explain it'});
    const toggle=button('Explain it','teachbackOpen',()=>{explainOpen=!explainOpen;if(!explainOpen)stopListening();panel.hidden=!explainOpen;toggle.setAttribute('aria-expanded',String(explainOpen));if(explainOpen)text.focus();});
    toggle.setAttribute('aria-expanded',String(explainOpen));toggle.setAttribute('aria-controls','teachbackPanel');
    section.append(el('h3',{},'Explain it in your own words'),el('p',{},'Explain the three relationships aloud or in writing. You will see only what was not yet named.'),toggle);
    const panel=el('form',{id:'teachbackPanel',class:'teachback-panel'});panel.hidden=!explainOpen;
    const text=el('textarea',{id:'teachbackText',rows:'6','aria-label':'Your explanation',autocomplete:'off',spellcheck:'true'});
    const lang=el('select',{id:'teachbackLang','aria-label':'Explanation language'});
    lang.append(el('option',{value:'en-US'},'English'),el('option',{value:'pt-BR'},'Português (Brasil)'));
    const controls=el('div',{class:'teachback-controls'});controls.append(lang);
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    const note=el('p',{class:'learning-save-note',id:'teachbackMicStatus',role:'status'});
    let micButton=null;
    showMic=()=>{note.textContent=mic.note;if(!micButton)return;
      micButton.textContent=mic.status==='listening'?'Stop':'Speak';micButton.setAttribute('aria-pressed',String(mic.status==='listening'));};
    if(Recognition){
      micButton=button('Speak','teachbackMic',()=>{
        if(recognition){stopListening();return;}
        let active;
        try{active=new Recognition();}catch{micEvent({type:'unavailable'});return;}
        active.lang=lang.value;active.continuous=true;active.interimResults=false;
        active.onresult=event=>{if(recognition!==active)return;
          let heard='';for(let i=event.resultIndex;i<event.results.length;i++)if(event.results[i].isFinal)heard+=event.results[i][0].transcript;
          if(heard.trim())text.value=`${text.value}${text.value&&!/\s$/.test(text.value)?' ':''}${heard.trim()}`;};
        active.onerror=event=>{if(recognition===active)micEvent({type:'error',error:event.error});};
        active.onend=()=>{if(recognition===active){recognition=null;micEvent({type:'end'});}};
        recognition=active;micEvent({type:'start'});
        try{active.start();}catch{recognition=null;micEvent({type:'failed'});}
      });controls.append(micButton);
      panel.append(text,controls,el('p',{class:'learning-save-note teachback-disclosure'},'Chrome may send audio to Google for recognition; typing keeps everything on this device.'),note);
    }else panel.append(text,controls,note);
    showMic();
    const submit=el('button',{type:'submit',id:'teachbackCheck'},'Show what is missing');panel.append(submit);
    const result=teachbackResult(lesson,guide,progress.get(lesson.id));
    panel.addEventListener('submit',event=>{event.preventDefault();stopListening();
      if(!text.value.trim()){micEvent({type:'empty'});return;}
      const {missing}=matchTeachback(text.value,guide.takeaways);
      if(!progress.get(lesson.id))progress.visit(lesson.id,state.step,'explain');
      progress.teachback(lesson.id,missing.map(m=>m.termId));
      text.value='';micEvent({type:'stop'});
      result.replaceWith(teachbackResult(lesson,guide,progress.get(lesson.id)));
    });
    section.append(panel,result);body.append(section);
  }
  /** Revisit after a case: one local free-text note per lesson; nothing leaves the device. */
  function appendPostopReplay(body,lesson){
    const box=el('details',{class:'postop-replay',id:'postopReplay'});box.append(el('summary',{},'Revisit after a case'));
    const saved=postop.get(lesson.id);
    const text=el('textarea',{id:'postopReplayText',rows:'5',maxlength:String(POSTOP_REPLAY_MAX),'aria-describedby':'postopReplayWarning',autocomplete:'off'});
    text.value=saved?.text||'';
    const label=el('label',{for:'postopReplayText'},'What did the operation confirm or contradict?');
    const status=el('p',{class:'learning-save-note',role:'status',id:'postopReplayStatus'},saved?`Saved on this device ${new Date(saved.at).toLocaleDateString()}.`:'');
    const actions=el('div',{class:'teachback-controls'});
    actions.append(button('Save note','postopReplaySave',()=>{const note=postop.save(lesson.id,text.value);
      status.textContent=!postop.persistent?'Device storage is unavailable; the note was not saved.':note?'Saved on this device.':'Note cleared.';}),
    button('Clear','postopReplayClear',()=>{postop.clear(lesson.id);text.value='';status.textContent=postop.persistent?'Note cleared.':'Device storage is unavailable.';}));
    box.append(label,text,el('p',{class:'learning-save-note postop-warning',id:'postopReplayWarning'},'Do not enter patient names, dates, record numbers or any identifier. Stored only on this device.'),actions,status);
    body.append(box);
  }
  function appendReferences(body,step){
    const notes=el('details',{class:'lesson-reference-drawer'});notes.append(el('summary',{},'Sources & anatomy notes'));
    const sources=el('section',{class:'lesson-sources'}),ids=sourceIdsForStep(step);
    sources.append(el('h4',{},`Sources & limits (${ids.length})`),el('p',{class:'evidence-type'},step.evidenceClass.replaceAll('_',' ')));
    for(const id of ids){const source=SOURCES[id],row=el('div');
      row.append(el('a',{href:source.url,target:'_blank',rel:'noopener noreferrer'},`${id} · ${source.title.replaceAll(' · ',', ')}`),el('p',{},source.scope));sources.append(row);}
    if(!ids.length)sources.append(el('p',{},'Local display contract; no external biological claim.'));
    notes.append(sources);
    for(const id of step.regions){const region=REGIONS[id],card=el('details',{'data-region-card':id});
      card.append(el('summary',{},region.name),el('p',{},region.text));const links=el('small');
      for(const [index,sourceId] of region.sources.entries()){if(index)links.append(document.createTextNode(', '));
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
    stopListening();mic=MIC_IDLE;showMic=()=>{};
    const {phase}=state;
    const focusId=root.contains(document.activeElement)?document.activeElement.id:null;
    const readingId=`${state.lessonId}:${state.step}:${phase}`;
    const scrollTop=readingId===lastReading?root.querySelector('.lesson-scroll')?.scrollTop||0:0;
    root.replaceChildren();root.scrollLeft=0;
    const lesson=LESSONS.find(l=>l.id===state.lessonId);
    // data-phase and data-step expose the Reading to agents and CSS; both are absent in the library.
    root.dataset.activeLesson=String(!!lesson);
    if(lesson){root.dataset.phase=phase;root.dataset.step=String(state.step);}else{delete root.dataset.phase;delete root.dataset.step;}
    if(!lesson){renderLibrary(state);}
    else{
      const guide=TEACHING_GUIDES[lesson.id],step=lesson.steps[state.step];
      onMode(phase==='recap'?'recap':'lesson');
      const identity=`${lesson.id}:${state.step}`;
      if(identity!==lastScene){lastScene=identity;onStep(lesson,step);}
      if(LEARNING_PHASES.includes(phase))progress.visit(lesson.id,state.step,phase);
      const top=el('div',{class:'lesson-top'});top.append(button('← Lessons','lessonLibrary',library));
      const select=el('select',{id:'lessonSelect','aria-label':'Choose a guided lesson'});
      for(const id of ORDERED_IDS)select.append(el('option',{value:id},`${moduleNumber(id)} · ${TEACHING_GUIDES[id].shortTitle}`));
      select.value=lesson.id;select.addEventListener('change',()=>start(select.value));top.append(select);root.append(top);
      const outline=el('details',{class:'lesson-outline'});
      outline.append(el('summary',{},`${phase==='recap'?'Lesson recap':`Relationship ${state.step+1} of ${lesson.steps.length}`}, ${guide.hemisphere==='L'?'left':'right'} reference`));
      const ordered=el('ol',{'aria-label':'Lesson relationships'});
      for(const [i,item] of lesson.steps.entries()){const li=el('li'),b=button(item.title,`lessonStep-${i}`,()=>goStep(i));
        b.setAttribute('aria-current',state.step===i?'step':'false');li.append(b);ordered.append(li);}
      outline.append(ordered);root.append(outline);
      if(!['brief','recap'].includes(phase)){
        const phases=el('nav',{class:'learning-phases','aria-label':'Teaching sequence'});
        for(const p of LEARNING_PHASES){const b=button(p[0].toUpperCase()+p.slice(1),`phase-${p}`,()=>goPhase(p));
          b.setAttribute('aria-pressed',String(phase===p));phases.append(b);}root.append(phases);
      }
      const body=el('div',{class:'lesson-scroll'});root.append(body);
      const title=phase==='brief'?guide.shortTitle:phase==='recap'?'Explain the relationship.':step.title;
      if(state.notice)body.append(el('p',{class:'lesson-notice',role:'status'},state.notice));
      const kicker=phase==='brief'?`${lesson.category}, about ${lesson.minutes} minutes`:phase==='recap'?'Take it into your next discussion':'';
      if(kicker)body.append(el('p',{class:'lesson-kicker'},kicker));
      body.append(el('h2',{id:'lessonCurrentTitle',tabindex:'-1'},title));
      if(phase==='brief'){
        const brief=el('section',{class:'lesson-case','aria-label':'Opening case question'});brief.append(el('h3',{},'The question to carry with you'),el('p',{},guide.question));body.append(brief);
        body.append(el('p',{class:'lesson-lead'},lesson.summary),el('h3',{},'By the end, you should be able to'),list(lesson.goals));
        body.append(el('p',{class:'lesson-side-note'},`${guide.hemisphere==='L'?'Left':'Right'} hemisphere is the reference example. Lesson views are authored for this side; free exploration has separate controls.`));
      }else if(phase==='recap'){
        body.append(el('p',{class:'lesson-lead'},'Three relationships to keep. Revisit a scene, then explain the opening question in your own words.'));
        const takeaways=el('ol',{class:'recap-takeaways'});
        for(const point of guide.takeaways){const li=el('li');li.append(el('p',{},point.text),button(`Revisit relationship ${point.step+1}`,`recapStep-${point.step}`,()=>goStep(point.step,'compare')));takeaways.append(li);}body.append(takeaways);
        appendTeachback(body,lesson,guide,state);
        const challenge=el('section',{class:'lesson-check'});challenge.append(el('h3',{},'Return to the question'),el('p',{},guide.question));
        const answer=el('details',{id:'lessonAnswer'});answer.append(el('summary',{},'Review the explanation'),el('p',{},lesson.steps.at(-1).answer));challenge.append(answer);body.append(challenge);
        const record=progress.get(lesson.id);body.append(button(record?.reviewed?'Marked reviewed':'Mark reviewed','lessonReview',()=>{
          if(!progress.get(lesson.id))progress.visit(lesson.id,state.step,'explain');progress.review(lesson.id);render(state);
        }),progressNote());
        body.append(el('p',{class:'learning-save-note'},'Reviewed records your own review. It is not an assessment of competence.'));
        const nextId=ORDERED_IDS[ORDERED_IDS.indexOf(lesson.id)+1],nextGuide=TEACHING_GUIDES[nextId];if(nextGuide)body.append(button(`Continue with ${nextGuide.shortTitle}`,'lessonNextTopic',()=>start(nextId)));
        appendPostopReplay(body,lesson);
        appendReferences(body,lesson.steps.at(-1));
      }else{
        const article=el('article',{id:'lessonCurrent','aria-labelledby':'lessonCurrentTitle'});
        if(phase==='orient'){
          article.append(el('p',{class:'lesson-lead'},step.text));
          const task=el('section',{class:'lesson-observe'});task.append(el('h3',{},'Locate the structures'),el('p',{},step.targets?.length?'Select each structure to light it on the atlas, then rotate until you can name what lies in front, behind and beneath it.':'Rotate the atlas until you can name what lies in front, behind and beneath the displayed structures.'));appendTargets(task,step);article.append(task);
        }else if(phase==='compare'){
          const task=el('section',{class:'lesson-observe'});task.append(el('h3',{},'Compare'),el('p',{},step.observe));appendTargets(task,step);article.append(task);
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
      if(phase==='brief')body.append(el('p',{class:'lesson-version'},`Educational draft ${CONTENT_VERSION}, anatomical review pending.`));body.scrollTop=scrollTop;
      const footer=el('div',{class:'lesson-controls'}),nav=el('div',{class:'lesson-nav'});
      if(phase==='recap'){
        // With a next lesson, the pinned primary continues to it; #lessonNext still closes the lesson.
        const nextId=ORDERED_IDS[ORDERED_IDS.indexOf(lesson.id)+1],nextGuide=TEACHING_GUIDES[nextId];
        const finish=button(nextLabel(state,lesson.steps.length),'lessonNext',next);
        if(nextGuide)nav.append(finish,button(`Continue: ${nextGuide.shortTitle}`,'lessonContinueTopic',()=>start(nextId)));
        else nav.append(button('Final relationship','lessonPrev',previous),finish);
      }
      else{
        const prev=button('Previous','lessonPrev',previous);prev.hidden=phase==='brief';
        nav.append(prev,button(nextLabel(state,lesson.steps.length),'lessonNext',next));
      }footer.append(nav);
      const tools=el('div',{class:'lesson-tools'});tools.append(button('Restore scene','lessonRestore',()=>{
        onRestore();for(const b of root.querySelectorAll('.lesson-targets button'))b.setAttribute('aria-pressed','false');
      }),button('Explore freely','lessonExplore',explore));footer.append(tools);root.append(footer);
    }
    lastReading=readingId;
    if(focusHeading){
      const heading=root.querySelector('#lessonCurrentTitle');
      // Phone: stage and nav are sticky, so bring the new heading just under the stage.
      if(heading)alignHeadingUnderStage(heading);
      heading?.focus({preventScroll:true});focusHeading=false;
    }else if(focusId)root.querySelector(`#${CSS.escape(focusId)}`)?.focus({preventScroll:true});
  }
  controller=createLessonController({search:location.search,onChange:state=>{sync();render(state);}});
  render(controller.state);sync();
  // A fresh phone entry (landing CTA, lesson link) opens with the step text under the stage, not under the header.
  if(controller.state.lessonId&&window.scrollY===0){const heading=root.querySelector('#lessonCurrentTitle');if(heading)requestAnimationFrame(()=>alignHeadingUnderStage(heading));}
  return {controller,library,explore,start,
    get phase(){return controller.state.phase;},
    restore(search){controller.restore(search);},
    refresh({restoreView=false}={}){if(restoreView)lastScene='';render(controller.state);},dispose(){},
  };
}
