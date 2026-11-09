import {CASES,CASE_VERSION} from './case_content.js';
export const CASE_KEY='hodos.caseConference.v1';
export const BASE_STAGES=Object.freeze(['Case','Interpret','Explore','Reconsider','Respond','Debrief']);
const DECIDE_AT=BASE_STAGES.indexOf('Respond');
// Cases with a decision gain a 'Decide' stage between Reconsider and Respond; others keep the six stages.
export function stagesFor(c){return c?.decision?[...BASE_STAGES.slice(0,DECIDE_AT),'Decide',...BASE_STAGES.slice(DECIDE_AT)]:[...BASE_STAGES];}
// Saved indices carry the stage count they were written under (records without one predate the
// Decide stage and used six). Remap them onto the case's current stage list without shifting
// anything before the insertion point.
function remapStage(i,from,to){
 if(from===to)return i;
 if(to>from)return i>=DECIDE_AT?i+1:i;          // 6 -> 7: Respond/Debrief move one right
 return i>DECIDE_AT?i-1:i===DECIDE_AT?DECIDE_AT-1:i; // 7 -> 6: Decide falls back to Reconsider
}
// The one position rule for a case; part is a hash segment. 'review' shows the last Stage and never raises
// maxStage. A Stage number is clamped to maxStage unless reach (the learner pressed Continue or a Stage button).
// Anything else resumes at maxStage.
export function caseRoute(record,stages,part,{reach=false}={}){
 const last=stages.length-1,n=Number(part),valid=Number.isInteger(n)&&n>=0&&n<=last;
 if(part==='review')return {stage:last,maxStage:record.maxStage,reviewOnly:true};
 const maxStage=reach&&valid?Math.max(n,record.maxStage):record.maxStage;
 return {stage:valid?Math.min(n,maxStage):maxStage,maxStage,reviewOnly:false};
}
// One history navigation is one decision. The entry index is history.state.at; a fragment entry the browser just
// pushed has none and sits after the shown one. 'shown' (a paired hashchange, or history.go returning) and
// 'refused' (the paired event of a cancelled navigation) need nothing; 'new' needs a route decision.
export function historyEntry(shown,refused,hash,state){
 const entry={hash,at:Number.isInteger(state?.at)?state.at:shown.at+1};
 return {entry,kind:hash===shown.hash&&entry.at===shown.at?'shown':refused&&hash===refused.hash&&entry.at===refused.at?'refused':'new'};
}
const blank=n=>({stage:0,maxStage:0,stages:n,initial:'',revision:'',response:'',mode:'written',spokenDone:false,reviewOnly:false,ratings:{},decision:null});
function cleaner(c){
 const n=stagesFor(c).length,optionIds=new Set(c?.decision?.options.map(o=>o.id)||[]);
 return (input={})=>{
  const r=blank(n),from=input.stages===6||input.stages===7?input.stages:BASE_STAGES.length;
  for(const k of ['initial','revision','response'])if(typeof input[k]==='string')r[k]=input[k].slice(0,10000);
  for(const k of ['stage','maxStage'])if(Number.isInteger(input[k])&&input[k]>=0&&input[k]<from){const v=remapStage(input[k],from,n);if(v<n)r[k]=v;}
  r.maxStage=input.reviewOnly===true?r.maxStage:Math.max(r.stage,r.maxStage);r.mode=input.mode==='spoken'?'spoken':'written';
  r.spokenDone=input.spokenDone===true;r.reviewOnly=input.reviewOnly===true;
  for(let i=0;i<4;i++)if(['addressed','partly','revisit'].includes(input.ratings?.[i]))r.ratings[i]=input.ratings[i];
  const d=input.decision;
  if(d&&typeof d==='object'&&optionIds.has(d.optionId)&&typeof d.at==='string'&&d.at.length<=40)r.decision={optionId:d.optionId,at:d.at};
  return r;
 };
}
export function createCaseStore(storage,{cases=CASES}={}){
 const byId=new Map(cases.map(c=>[c.id,c])),cleaners=new Map(cases.map(c=>[c.id,cleaner(c)]));
 const records=new Map(),remembered=new Set();let blocked=false,notice='',saveOK=true;
 try{
  const raw=storage?.getItem(CASE_KEY);
  if(raw){const data=raw.length<=200000?JSON.parse(raw):null;
   if(data?.version!==CASE_VERSION||!data.records||typeof data.records!=='object'){blocked=true;notice='Saved case drafts belong to another version or cannot be read. They have not been changed. Clear saved case drafts to start saving this version.';}
   else for(const [id,r] of Object.entries(data.records))if(byId.has(id)&&r&&typeof r==='object'){records.set(id,cleaners.get(id)(r));remembered.add(id);}
  }
 }catch{saveOK=false;notice='Device storage is unavailable or unreadable. Work can continue in this session.';blocked=true;}
 function check(id){if(!byId.has(id))throw Error('Unknown case');}
 function get(id){check(id);return cleaners.get(id)(records.get(id));}
 function save(){
  if(blocked)return false;
  try{if(!storage)throw Error('Unavailable');
   if(!remembered.size)storage.removeItem(CASE_KEY);
   else storage.setItem(CASE_KEY,JSON.stringify({version:CASE_VERSION,records:Object.fromEntries([...remembered].map(id=>[id,get(id)]))}));
   saveOK=true;return true;
  }catch{saveOK=false;notice='Could not save on this device. Your current text remains in this session; download it before leaving.';return false;}
 }
 function write(id,input){records.set(id,cleaners.get(id)(input));if(remembered.has(id))save();return get(id);}
 return {
  get,get notice(){return notice;},
  stages(id){check(id);return stagesFor(byId.get(id));},
  // Position (stage, maxStage, reviewOnly) changes only through move(); update drops it, so leaving review cannot unlock Stages.
  update(id,{stage,maxStage,reviewOnly,...fields}){return write(id,{...get(id),...fields});},
  move(id,part,options){const r=get(id);return write(id,{...r,...caseRoute(r,stagesFor(byId.get(id)),part,options)});},
  // A committed decision is locked for the attempt; only clear(id) (Reset this case) removes it.
  decide(id,optionId,at=new Date().toISOString()){if(get(id).decision)return get(id);return this.update(id,{decision:{optionId,at}});},
  remember(id,enabled){check(id);if(enabled){if(blocked)return false;remembered.add(id);}else remembered.delete(id);return save();},
  persistent(id){return remembered.has(id)&&saveOK&&!blocked;},
  clear(id){check(id);records.delete(id);remembered.delete(id);return save();},
  clearSaved(){try{if(!storage)throw Error('Unavailable');storage.removeItem(CASE_KEY);remembered.clear();blocked=false;saveOK=true;notice='';return true;}catch{saveOK=false;notice='Could not clear device storage. Your session can continue without saving.';return false;}},
 };
}
