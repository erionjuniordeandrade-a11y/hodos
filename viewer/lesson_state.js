import { LESSONS, CONTENT_VERSION } from './lesson_content.js';

export function lessonStateFromSearch(search=''){
  const params=new URLSearchParams(search);
  const id=params.get('lesson');
  const lesson=LESSONS.find(l=>l.id===id);
  if(!id) return Object.freeze({status:'inactive',lessonId:null,step:0,error:'',notice:''});
  if(!lesson) return Object.freeze({status:'inactive',lessonId:null,step:0,error:'That lesson is not installed.',notice:''});
  // `lessonVersion` is advisory: a shared or bookmarked link must survive a content
  // deploy. The requested lesson/step opens on the installed version with a one-line
  // notice; an out-of-range step clamps to the last relationship instead of restarting.
  const version=params.get('lessonVersion'),stale=!!version&&version!==lesson.version;
  const raw=Number(params.get('step')||0),last=lesson.steps.length-1;
  const step=Number.isInteger(raw) && raw>=0 && raw<=last ? raw : (stale&&Number.isInteger(raw)&&raw>last ? last : 0);
  const notice=stale?`This lesson was updated after this link was made (now ${lesson.version}). Showing the current version.`:'';
  return Object.freeze({status:'paused',lessonId:id,step,error:'',notice});
}

export function lessonSearch(search,state){
  const params=new URLSearchParams(search);
  for(const key of ['lesson','lessonVersion','step','playing']) params.delete(key);
  if(state.lessonId){
    params.set('lesson',state.lessonId);params.set('lessonVersion',CONTENT_VERSION);params.set('step',String(state.step));
  }
  const encoded=params.toString();return encoded?`?${encoded}`:'';
}

export function createLessonController({search='',onChange=()=>{}}={}){
  let state=lessonStateFromSearch(search);
  const emit=next=>{state=Object.freeze(next);onChange(state);return state;};
  return {
    get state(){return state;},
    restore(search){return emit(lessonStateFromSearch(search));},
    select(id){const lesson=LESSONS.find(l=>l.id===id);if(!lesson)throw new Error('Unknown lesson');
      return emit({status:'paused',lessonId:id,step:0,error:'',notice:''});},
    move(delta){if(!state.lessonId)return state;const lesson=LESSONS.find(l=>l.id===state.lessonId);
      return emit({...state,step:Math.max(0,Math.min(lesson.steps.length-1,state.step+delta)),status:'paused',notice:''});},
    play(){return state.lessonId?emit({...state,status:'playing'}):state;},
    pause(){return state.lessonId?emit({...state,status:'paused'}):state;},
    close(){return emit({status:'inactive',lessonId:null,step:0,error:'',notice:''});},
  };
}
