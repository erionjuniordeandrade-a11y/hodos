import {CASES,CASE_VERSION} from './case_content.js';
import {createCaseStore} from './case_state.js';
import {createCaseAudio} from './case_audio.js';
import {CASE_IMAGES,IMAGE_CAPTION} from './case_images.js';

const $=id=>document.getElementById(id),main=$('caseMain');
let storage;try{storage=localStorage;}catch{}
const store=createCaseStore(storage),stages=['Case','Interpret','Explore','Reconsider','Respond','Debrief'];
let active=null,audio=null,audioURL=null,referenceTrigger=null,currentHash='';
const el=(tag,attrs={},text='')=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(text)n.textContent=text;return n;};
const p=(text,cls='')=>el('p',cls?{class:cls}:{},text);
const button=(text,fn,attrs={})=>{const n=el('button',{type:'button',...attrs},text);n.addEventListener('click',fn);return n;};
const list=items=>{const n=el('ul');for(const t of items)n.append(el('li',{},t));return n;};
function busy(){return ['requesting','recording','stopping'].includes(audio?.state.status);}
function cleanupAudio(){audio?.dispose();audio=null;if(audioURL)URL.revokeObjectURL(audioURL);audioURL=null;}
function canMove(){if(!busy())return true;if(!confirm('Stop recording and continue? The current recording will be discarded.'))return false;cleanupAudio();if(active)initAudio();return true;}
function initAudio(){audio=createCaseAudio({onChange:s=>{if(active&&['ready','requesting'].includes(s.status))store.update(active.id,{spokenDone:s.status==='ready'});renderAudio();}});}
function navigate(id='',stage=0,{review=false}={}){
 if(!canMove())return;
 if(id!==active?.id){cleanupAudio();active=CASES.find(c=>c.id===id)||null;if(active)initAudio();}
 if(active){const r=store.get(active.id);store.update(active.id,{stage,maxStage:review?r.maxStage:Math.max(stage,r.maxStage),reviewOnly:review});}
 currentHash=active?`#${active.id}/${review?'review':stage}`:'';history.pushState(null,'',`${location.pathname}${location.search}${currentHash}`);render(true);
}
function route(){
 const [id,part]=location.hash.slice(1).split('/'),c=CASES.find(c=>c.id===id);
 if(!canMove()){history.replaceState(null,'',`${location.pathname}${location.search}${currentHash}`);return;}
 if(c?.id!==active?.id){cleanupAudio();active=c||null;if(active)initAudio();}
 if(active){const r=store.get(active.id),review=part==='review';const requested=Number(part),stage=review?5:Number.isInteger(requested)&&requested>=0&&requested<=5?Math.min(requested,r.maxStage):r.maxStage;store.update(active.id,{stage,reviewOnly:review});currentHash=`#${active.id}/${review?'review':stage}`;history.replaceState(null,'',`${location.pathname}${location.search}${currentHash}`);}
 else currentHash='';render(true);
}
function sourceLink(c,id){const s=c.sources.find(s=>s.id===id);return s?el('a',{href:s.url,target:'_blank',rel:'noopener noreferrer',class:'source-link'},s.title):document.createTextNode('');}
function diagram(c){
 const f=el('figure'),ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 560 330');svg.setAttribute('role','img');svg.setAttribute('aria-label',c.diagram.description);
 function shape(tag,attrs){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);svg.append(n);return n;}
 shape('path',{d:'M78 207 C45 167 81 98 133 78 C183 37 298 30 392 77 C468 112 502 192 462 237 C427 277 365 284 312 259 C273 286 215 268 185 249 C134 254 97 239 78 207 Z',fill:'#252e33',stroke:'#72858c','stroke-width':2});
 shape('ellipse',{cx:c.diagram.cx,cy:c.diagram.cy,rx:55,ry:38,fill:'#9be1f033',stroke:'#9be1f0','stroke-width':2,'stroke-dasharray':'5 5'});
 const t=shape('text',{x:30,y:312,fill:'#b6c0c5','font-size':15});t.textContent='Anterior';const t2=shape('text',{x:455,y:312,fill:'#b6c0c5','font-size':15});t2.textContent='Posterior';
 f.append(svg,el('figcaption',{},`Schematic fictional lesion. ${c.diagram.view}. Not to scale; no individual anatomy or safe margin is represented.`));return f;
}
function caseImage(c){
 const data=CASE_IMAGES[c.id],figure=el('figure',{class:'case-mri'});
 if(!data?.length){figure.append(p('No illustration is installed for this case. The written case and schematic remain available.'));return figure;}
 for(const image of data){
  const panel=el('div',{class:'case-mri-panel'}),img=el('img',{src:image.src,alt:image.alt,width:1254,height:1254,decoding:'async',loading:'lazy'});
  img.addEventListener('error',()=>{img.hidden=true;panel.prepend(p(`${image.sequence} illustration unavailable. The written case and schematic remain available.`));});
  panel.append(el('p',{class:'case-mri-label'},image.sequence),img,el('a',{href:image.src,target:'_blank',rel:'noopener'},`Open full-size ${image.sequence}`));figure.append(panel);
 }
 figure.append(el('figcaption',{},IMAGE_CAPTION));return figure;
}
function openReference(ref,trigger){
 if(!canMove())return;referenceTrigger=trigger;
 $('referenceTitle').textContent=ref.label;
 const frame=el('iframe',{title:`Reference atlas: ${ref.label}`,src:`./atlas.html?caseReference=1&lesson=${encodeURIComponent(ref.lesson)}&step=${ref.step}&phase=orient&profile=teaching`,allow:'microphone \'none\'; camera \'none\''});
 $('referenceFrame').replaceChildren(frame);$('referenceDialog').showModal();$('closeReference').focus();
}
function closeReference(){if($('referenceDialog').open)$('referenceDialog').close();$('referenceFrame').replaceChildren();referenceTrigger?.focus();}
$('closeReference').addEventListener('click',closeReference);
$('referenceDialog').addEventListener('cancel',e=>{e.preventDefault();closeReference();});
$('referenceDialog').addEventListener('close',()=>$('referenceFrame').replaceChildren());
window.addEventListener('message',event=>{
 if(event.origin===location.origin&&event.source===$('referenceFrame').querySelector('iframe')?.contentWindow&&event.data?.type==='hodos:close-reference')closeReference();
});
function referenceButtons(c){const box=el('div',{class:'reference-links'});for(const ref of c.references){const b=button(ref.label,()=>openReference(ref,b));box.append(b);}return box;}
function draftField(container,id,label,key,placeholder){
 container.append(el('label',{for:id,class:'field-label'},label));const field=el('textarea',{id,maxlength:10000,placeholder},store.get(active.id)[key]);
 field.addEventListener('input',()=>{store.update(active.id,{[key]:field.value});updateSaveStatus();});container.append(field);
}
function updateSaveStatus(){const n=$('saveStatus');if(n&&active)n.textContent=store.persistent(active.id)?'Text and self-assessment saved on this device. Audio is never saved here.':store.notice||'Session only. Download your text before leaving, or choose device saving.';const cb=$('rememberCase');if(cb&&active)cb.checked=store.persistent(active.id);}
function download(blob,name){const url=URL.createObjectURL(blob),a=el('a',{href:url,download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function exportText(){const r=store.get(active.id);download(new Blob([`${active.title}\nFictional teaching case | ${CASE_VERSION}\n\nInitial interpretation\n${r.initial}\n\nAfter the finding\n${r.revision}\n\nWritten response\n${r.response}\n\nResponse modality: ${r.mode}\nAudio is downloaded separately.\n\nSelf-assessment\n${active.rubric.map((v,i)=>`${v.title}: ${r.ratings[i]||'not assessed'}`).join('\n')}\n`],{type:'text/plain'}),`hodos-${active.id}-response.txt`);}
function saveTools(body){
 const label=el('label',{class:'save-label',for:'rememberCase'}),cb=el('input',{type:'checkbox',id:'rememberCase'});cb.checked=store.persistent(active.id);
 cb.addEventListener('change',()=>{store.remember(active.id,cb.checked);updateSaveStatus();});label.append(cb,document.createTextNode('Save this case’s text on this device'));
 body.append(label,el('p',{id:'saveStatus',class:'save-status',role:'status'}));
 const tools=el('div',{class:'session-tools'});tools.append(button('Download text',exportText),button('Reset this case',()=>{if(confirm('Clear this case’s responses and self-assessment? Other cases and atlas lessons will remain.')){cleanupAudio();store.clear(active.id);initAudio();navigate(active.id,0);}}));
 if(store.notice)tools.append(button('Clear saved drafts',()=>{if(confirm('Clear all saved Case Conference drafts? Atlas lesson progress will remain.')){store.clearSaved();updateSaveStatus();}}));body.append(tools);updateSaveStatus();
}
function renderAudio(){
 const box=$('audioPanel');if(!box||!audio)return;box.replaceChildren();const s=audio.state;
 box.append(p('Record locally, or rehearse aloud without recording. Audio stays in this tab until you change cases or leave; download it if you want to keep it.','muted'));
 const controls=el('div',{class:'audio-controls'});
 controls.append(button(s.blob?'Record again':'Record response',()=>{if(!s.blob||confirm('Replace the current recording?'))audio.start().catch(()=>{/* The module reports the error through onChange. */});}));
 controls.firstChild.disabled=busy();
 const stop=button('Stop recording',()=>audio.stop());stop.disabled=s.status!=='recording';controls.append(stop);
 if(s.blob){controls.append(button('Download audio',()=>download(s.blob,`hodos-${active.id}-response.${s.blob.type.includes('mp4')?'m4a':'webm'}`)),button('Discard audio',()=>{audio.discard();store.update(active.id,{spokenDone:false});}));}
 box.append(controls,el('p',{class:'status',role:'status'},s.error||({idle:'Microphone off.',requesting:'Waiting for microphone permission…',recording:'Recording locally. Stop whenever you are ready.',stopping:'Finishing recording…',ready:'Recording ready. Replay it before comparing your reasoning.'}[s.status]||'Microphone unavailable. You can write or rehearse aloud.')));
 if(audioURL){URL.revokeObjectURL(audioURL);audioURL=null;}
 if(s.blob){audioURL=URL.createObjectURL(s.blob);box.append(el('audio',{controls:'',src:audioURL,'aria-label':'Your recorded response'}));}
 const label=el('label',{class:'save-label'}),cb=el('input',{type:'checkbox'});cb.checked=store.get(active.id).spokenDone;cb.addEventListener('change',()=>store.update(active.id,{spokenDone:cb.checked}));label.append(cb,document.createTextNode('I have rehearsed my response aloud'));box.append(label);
}
function respond(body){
 const r=store.get(active.id);body.append(p('Explain your interpretation, the key relationships, what the new finding changes, and what remains uncertain. Aim for about a minute aloud or a concise written response. There is no countdown.','prompt'));
 const choices=el('div',{class:'response-choice','aria-label':'Response format'});for(const [mode,title] of [['written','Write'],['spoken','Speak']])choices.append(button(title,()=>{if(canMove()){store.update(active.id,{mode});render(true);}},{'aria-pressed':String(r.mode===mode)}));body.append(choices);
 if(r.mode==='written')draftField(body,'finalResponse','Your conference response','response','Make your reasoning explicit.');
 else{body.append(el('div',{id:'audioPanel'}));renderAudio();}
}
function debrief(body){
 const r=store.get(active.id),practiced=r.initial.trim()&&r.revision.trim()&&(r.mode==='spoken'?r.spokenDone:r.response.trim());
 body.append(p(practiced&&!r.reviewOnly?'Practice response completed. Compare your reasoning below.':'Review mode. You can read the debrief without completing a practice response.','status'));
 body.append(p('Draft teaching debrief. Source-linked and awaiting independent clinical review; not an individualized recommendation.','draft-note'));
 const mine=el('details');mine.append(el('summary',{},'Your interpretation and response'),p(r.initial||'No initial interpretation entered.','response-copy'),p(r.revision||'No reconsideration entered.','response-copy'),p(r.response||'No written final response entered.','response-copy'));
 if(r.mode==='spoken')mine.append(p(audio?.state.blob?'Use your local recording below to compare.':'No replayable audio is available in this session. Any saved spoken-practice check is a self-report.'));
 body.append(mine);if(r.mode==='spoken'){body.append(el('div',{id:'audioPanel'}));renderAudio();}
 for(const b of active.debrief){const section=el('section',{class:'debrief-block'});section.append(el('h3',{},b.title),p(b.text));for(const id of b.sourceIds)section.append(sourceLink(active,id));body.append(section);}
 body.append(el('h2',{},'Assess your reasoning'),p('Use these prompts to identify what to revisit. This is self-assessment, not a score of clinical competence.','muted'));
 active.rubric.forEach((item,i)=>{const row=el('div',{class:'rubric-row'}),copy=el('div'),select=el('select',{id:`rubric-${i}`});copy.append(el('label',{for:`rubric-${i}`},item.title),p(item.prompt));for(const [value,label] of [['','Choose…'],['addressed','Addressed'],['partly','Partly addressed'],['revisit','Revisit']])select.append(el('option',{value},label));select.value=r.ratings[i]||'';select.addEventListener('change',()=>{store.update(active.id,{ratings:{...store.get(active.id).ratings,[i]:select.value}});updateSaveStatus();});row.append(copy,select);body.append(row);});
 const sources=el('details',{class:'sources'});sources.append(el('summary',{},'Evidence and study limits'));const ul=el('ul');for(const s of active.sources){const li=el('li');li.append(sourceLink(active,s.id),p(s.scope));ul.append(li);}sources.append(ul);body.append(sources);
 body.append(el('h3',{},'Revisit a relationship'),referenceButtons(active));
}
function render(focus=false){
 main.replaceChildren();
 if(!active){
  const intro=el('section',{class:'catalog-intro'});intro.append(el('h1',{tabindex:'-1'},'Bring your reasoning to the conference.'),p('Four staged glioma cases for senior neurosurgical residents. Interpret the findings, explore the relationships, then defend what you think and what you still need to know.'),p('About ten minutes per case. Speak or write. No account or automated grading.','muted'),p('Fictional teaching pilot. Schematics are not patient imaging. Debriefs are drafts awaiting independent clinical review.','draft-note'));main.append(intro);
  const catalogue=el('div',{class:'case-list'});for(const c of CASES){const r=store.get(c.id),row=el('article',{class:'case-row'}),copy=el('div'),actions=el('div',{class:'row-actions'});copy.append(p(c.location),el('h2',{},c.title),p(c.summary));actions.append(button(r.maxStage?'Continue case':'Begin case',()=>navigate(c.id,r.reviewOnly?r.maxStage:r.stage),{class:'primary'}),button('Review debrief',()=>navigate(c.id,5,{review:true}),{class:'text-button'}));row.append(el('span',{class:'case-number'},c.number),copy,actions);catalogue.append(row);}main.append(catalogue);
 }else{
  const r=store.get(active.id),top=el('div',{class:'case-top'});top.append(button('All cases',()=>navigate(),{class:'text-button'}),p(`Fictional teaching case ${active.number} · Senior level`));main.append(top);
  const nav=el('ol',{class:'stage-nav','aria-label':'Case stages'});stages.forEach((name,i)=>{const li=el('li'),b=button('',()=>navigate(active.id,i));b.append(el('span',{},String(i+1).padStart(2,'0')),document.createTextNode(name));if(i===r.stage)b.setAttribute('aria-current','step');b.disabled=i>r.maxStage;li.append(b);nav.append(li);});main.append(nav);
  const work=el('div',{class:'case-workbench'}),aside=el('aside',{class:'case-aside','aria-label':'Case context'}),body=el('section',{class:'stage-body'});
  const schematic=el('details',{class:'schematic'});schematic.open=!CASE_IMAGES[active.id]&&matchMedia('(min-width:851px)').matches;schematic.append(el('summary',{},'Schematic location'),diagram(active));
  const panels=[];
  if(CASE_IMAGES[active.id]){const imaging=el('details',{class:'case-imaging'});imaging.open=r.stage===0||matchMedia('(min-width:851px)').matches;imaging.append(el('summary',{},'Fictional MRI-style illustrations'),caseImage(active));panels.push(imaging);}
  aside.append(p(active.location,'location'),el('h1',{class:'case-name'},active.title),...panels,schematic);const context=el('details');context.append(el('summary',{},'Case context'),p(active.vignette),p(active.diagram.description));aside.append(context,p('Fictional scenario. Reference relationships, not individual anatomy.','draft-note'),referenceButtons(active));work.append(aside,body);main.append(work);
  body.append(p(`Stage ${r.stage+1} of 6`,'stage-index'),el('h2',{id:'stageTitle',tabindex:'-1'},['Read the case','State your interpretation','Explore the relationships','Consider the new finding','Prepare your response','Compare your reasoning'][r.stage]));
  if(r.stage===0){body.append(p(active.vignette,'lead'));const cols=el('div',{class:'fact-columns'});for(const [title,items] of [['What is supplied',active.known],['What remains unknown',active.unknown]]){const c=el('section');c.append(el('h3',{},title),list(items));cols.append(c);}body.append(cols,p('The exercise asks you to explain relationships and uncertainty. It does not ask you to choose a surgical margin.','draft-note'));}
  if(r.stage===1){body.append(p(active.prompt,'prompt'));draftField(body,'initialResponse','Your initial interpretation','initial','State your interpretation and one important uncertainty.');}
  if(r.stage===2){body.append(list(active.explore),referenceButtons(active),p('Open a reference, inspect the anatomy, then close it to return here. These views use session-only lesson progress.','muted'));}
  if(r.stage===3){body.append(p(active.finding.text,'finding'),p(active.finding.prompt,'prompt'));const prev=el('details');prev.append(el('summary',{},'Your initial interpretation'),p(r.initial||'No initial interpretation was entered.','response-copy'));body.append(prev);draftField(body,'revisedResponse','What changes, or remains defensible?','revision','You may revise or defend your interpretation. Explain why.');}
  if(r.stage===4)respond(body);
  if(r.stage===5)debrief(body);
  saveTools(body);
  const actions=el('div',{class:'stage-actions'}),back=button('Previous',()=>navigate(active.id,r.stage-1));back.disabled=r.stage===0||r.reviewOnly;actions.append(back);if(r.reviewOnly)actions.append(button('Practice this case',()=>navigate(active.id,r.maxStage),{class:'primary'}));
  actions.append(r.stage<5?button(r.stage===4?'View debrief':'Continue',()=>navigate(active.id,r.stage+1),{class:'primary'}):button('Return to cases',()=>navigate(),{class:'primary'}));body.append(actions);
 }
 if(focus)(document.getElementById('stageTitle')||main.querySelector('h1'))?.focus({preventScroll:true});
}
window.addEventListener('popstate',route);window.addEventListener('hashchange',route);
window.addEventListener('pagehide',()=>{cleanupAudio();closeReference();});
window.addEventListener('pageshow',e=>{if(e.persisted&&active){initAudio();render();}});
window.addEventListener('beforeunload',e=>{if(busy()){e.preventDefault();e.returnValue='';}});
document.addEventListener('click',e=>{const a=e.target.closest?.('a');if(a&&!a.hasAttribute('download')&&!a.target&&busy()){if(!canMove())e.preventDefault();}});
route();
