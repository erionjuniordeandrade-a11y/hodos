import { LESSONS, CONTENT_VERSION } from './lesson_content.js';

/** A Reading is where the learner stands in a Lesson: one Step seen through one Lesson phase.
 * brief opens the Lesson, orient → compare → explain repeat for every Step, recap closes it.
 * The whole Reading state machine lives here; the player only renders it. */
export const READING_PHASES=Object.freeze(['brief','orient','compare','explain','recap']);
export const readingPhase=value=>READING_PHASES.includes(value)?value:'orient';

const INACTIVE=Object.freeze({status:'inactive',lessonId:null,step:0,phase:null,error:'',notice:''});

/** Where Next leads from a Reading. null: the Lesson is finished and Next closes it. */
export function nextReading({step,phase},stepCount){
  if(phase==='brief')return {step,phase:'orient'};
  if(phase==='orient')return {step,phase:'compare'};
  if(phase==='compare')return {step,phase:'explain'};
  if(phase==='explain')return step<stepCount-1?{step:step+1,phase:'orient'}:{step,phase:'recap'};
  return null;
}

/** Where Previous leads from a Reading; from the first orient it returns to the brief. */
export function previousReading({step,phase}){
  if(phase==='recap')return {step,phase:'explain'};
  if(phase==='explain')return {step,phase:'compare'};
  if(phase==='compare')return {step,phase:'orient'};
  return step>0?{step:step-1,phase:'explain'}:{step:0,phase:'brief'};
}

const NEXT_LABELS={brief:'Begin lesson',orient:'Compare',compare:'Explain',recap:'All lessons'};
/** The visible name of the Next action, so the button always says where it leads. */
export const nextLabel=({step,phase},stepCount)=>NEXT_LABELS[phase]??(step<stepCount-1?'Next relationship':'Lesson recap');

export function lessonStateFromSearch(search=''){
  const params=new URLSearchParams(search);
  const id=params.get('lesson');
  const lesson=LESSONS.find(l=>l.id===id);
  if(!id) return INACTIVE;
  if(!lesson) return Object.freeze({...INACTIVE,error:'That lesson is not installed.'});
  // `lessonVersion` is advisory: a shared or bookmarked link must survive a content
  // deploy. The requested lesson/step opens on the installed version with a one-line
  // notice; an out-of-range step clamps to the last relationship instead of restarting.
  const version=params.get('lessonVersion'),stale=!!version&&version!==lesson.version;
  const raw=Number(params.get('step')||0),last=lesson.steps.length-1;
  const step=Number.isInteger(raw) && raw>=0 && raw<=last ? raw : (stale&&Number.isInteger(raw)&&raw>last ? last : 0);
  const notice=stale?`This lesson was updated after this link was made (now ${lesson.version}). Showing the current version.`:'';
  // A link without a phase opens on the Step's orient, not on the brief.
  return Object.freeze({status:'paused',lessonId:id,step,phase:readingPhase(params.get('phase')),error:'',notice});
}

export function lessonSearch(search,state){
  const params=new URLSearchParams(search);
  for(const key of ['lesson','lessonVersion','step','phase','playing']) params.delete(key);
  if(state.lessonId){
    params.set('lesson',state.lessonId);params.set('lessonVersion',CONTENT_VERSION);params.set('step',String(state.step));
    if(state.phase)params.set('phase',state.phase);
  }
  const encoded=params.toString();return encoded?`?${encoded}`:'';
}

/** Every Reading change goes through one of these transitions. A stale-link notice belongs to
 * the Reading it opened on, so any transition retires it. */
export function createLessonController({search='',onChange=()=>{}}={}){
  let state=lessonStateFromSearch(search);
  const emit=next=>{state=Object.freeze(next);onChange(state);return state;};
  const lessonOf=id=>LESSONS.find(l=>l.id===id);
  const clamp=(lesson,step)=>Math.max(0,Math.min(lesson.steps.length-1,Number.isInteger(step)?step:0));
  const go=({step,phase})=>{const lesson=lessonOf(state.lessonId);if(!lesson)return state;
    return emit({...state,step:clamp(lesson,step),phase:readingPhase(phase),notice:''});};
  const close=()=>emit(INACTIVE);
  return {
    get state(){return state;},
    restore(search){return emit(lessonStateFromSearch(search));},
    /** Opens a Lesson in one emit, so a resumed Lesson never renders or saves Step zero first. */
    select(id,{step=0,phase='brief'}={}){const lesson=lessonOf(id);if(!lesson)throw new Error('Unknown lesson');
      return emit({status:'paused',lessonId:id,step:clamp(lesson,step),phase:readingPhase(phase),error:'',notice:''});},
    go,
    next(){const lesson=lessonOf(state.lessonId);if(!lesson)return state;const to=nextReading(state,lesson.steps.length);return to?go(to):close();},
    previous(){return state.lessonId?go(previousReading(state)):state;},
    close,
  };
}
