import {CASES,CASE_VERSION} from './case_content.js';
export const CASE_KEY='hodos.caseConference.v1';
const ids=new Set(CASES.map(c=>c.id));
const blank=()=>({stage:0,maxStage:0,initial:'',revision:'',response:'',mode:'written',spokenDone:false,reviewOnly:false,ratings:{}});
function clean(input={}){
 const r=blank();
 for(const k of ['initial','revision','response'])if(typeof input[k]==='string')r[k]=input[k].slice(0,10000);
 for(const k of ['stage','maxStage'])if(Number.isInteger(input[k])&&input[k]>=0&&input[k]<=5)r[k]=input[k];
 r.maxStage=input.reviewOnly===true?r.maxStage:Math.max(r.stage,r.maxStage);r.mode=input.mode==='spoken'?'spoken':'written';
 r.spokenDone=input.spokenDone===true;r.reviewOnly=input.reviewOnly===true;
 for(let i=0;i<4;i++)if(['addressed','partly','revisit'].includes(input.ratings?.[i]))r.ratings[i]=input.ratings[i];
 return r;
}
export function createCaseStore(storage){
 const records=new Map(),remembered=new Set();let blocked=false,notice='',saveOK=true;
 try{
  const raw=storage?.getItem(CASE_KEY);
  if(raw){const data=raw.length<=200000?JSON.parse(raw):null;
   if(data?.version!==CASE_VERSION||!data.records||typeof data.records!=='object'){blocked=true;notice='Saved case drafts belong to another version or cannot be read. They have not been changed. Clear saved case drafts to start saving this version.';}
   else for(const [id,r] of Object.entries(data.records))if(ids.has(id)&&r&&typeof r==='object'){records.set(id,clean(r));remembered.add(id);}
  }
 }catch{saveOK=false;notice='Device storage is unavailable or unreadable. Work can continue in this session.';blocked=true;}
 function check(id){if(!ids.has(id))throw Error('Unknown case');}
 function get(id){check(id);return clean(records.get(id));}
 function save(){
  if(blocked)return false;
  try{if(!storage)throw Error('Unavailable');
   if(!remembered.size)storage.removeItem(CASE_KEY);
   else storage.setItem(CASE_KEY,JSON.stringify({version:CASE_VERSION,records:Object.fromEntries([...remembered].map(id=>[id,get(id)]))}));
   saveOK=true;return true;
  }catch{saveOK=false;notice='Could not save on this device. Your current text remains in this session; download it before leaving.';return false;}
 }
 return {
  get,get notice(){return notice;},
  update(id,patch){records.set(id,clean({...get(id),...patch}));if(remembered.has(id))save();return get(id);},
  remember(id,enabled){check(id);if(enabled){if(blocked)return false;remembered.add(id);}else remembered.delete(id);return save();},
  persistent(id){return remembered.has(id)&&saveOK&&!blocked;},
  clear(id){check(id);records.delete(id);remembered.delete(id);return save();},
  clearSaved(){try{if(!storage)throw Error('Unavailable');storage.removeItem(CASE_KEY);remembered.clear();blocked=false;saveOK=true;notice='';return true;}catch{saveOK=false;notice='Could not clear device storage. Your session can continue without saving.';return false;}},
 };
}
