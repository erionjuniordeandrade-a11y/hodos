import {LESSONS,CONTENT_VERSION} from './lesson_content.js';
import {resolveScene} from './lesson_scene.js';
import {resolveBundleId} from './atlas_data.js';
import {TEACHING_GUIDES} from './lesson_briefings.js';

export const LEARNING_KEY='tractlab.anatomy.learning.v1';
export const LEARNING_PHASES=['orient','compare','explain'];
export const learningPhase=value=>LEARNING_PHASES.includes(value)?value:'orient';

/** Small, versioned device progress. Stores no answers, case data or scene state. */
export function createLearningProgress(storage){
  let records=Object.create(null),lastLesson=null,persistent=!!storage;
  try{
    const raw=storage?.getItem(LEARNING_KEY);
    const saved=raw&&raw.length<50000?JSON.parse(raw):null;
    // Progress is keyed by lesson id and validated against the installed step count, so a
    // wording or label deploy (new CONTENT_VERSION) does not erase a resident's record.
    if(typeof saved?.version==='string'&&saved.lessons&&typeof saved.lessons==='object'){
      for(const lesson of LESSONS){const r=saved.lessons[lesson.id];
        if(!r||!Number.isInteger(r.step)||r.step<0||r.step>=lesson.steps.length)continue;
        records[lesson.id]={step:r.step,phase:learningPhase(r.phase),
          visited:[...new Set((Array.isArray(r.visited)?r.visited:[]).slice(0,lesson.steps.length).filter(i=>Number.isInteger(i)&&i>=0&&i<lesson.steps.length))].sort((a,b)=>a-b),reviewed:r.reviewed===true};
      }
      if(records[saved.lastLesson])lastLesson=saved.lastLesson;
    }
  }catch{persistent=false;}
  function save(){
    try{if(!storage)throw Error('No storage');storage.setItem(LEARNING_KEY,JSON.stringify({version:CONTENT_VERSION,lastLesson,lessons:records}));persistent=true;}
    catch{persistent=false;}
  }
  const get=id=>records[id]?{...records[id],visited:[...records[id].visited]}:null;
  return {
    get,get lastLesson(){return lastLesson;},get persistent(){return persistent;},
    visit(id,step,phase){const lesson=LESSONS.find(l=>l.id===id);
      if(!lesson||!Number.isInteger(step)||step<0||step>=lesson.steps.length)throw Error('Invalid lesson progress');
      const previous=records[id];records[id]={step,phase:learningPhase(phase),visited:[...new Set([...(previous?.visited||[]),step])].sort((a,b)=>a-b),reviewed:previous?.reviewed===true};
      lastLesson=id;save();return get(id);
    },
    review(id){if(!records[id])return;records[id].reviewed=true;lastLesson=id;save();},
  };
}

/** A lecture owns its presentation. 'follow' resolves to its stated example side;
 * Explore's hemisphere/network settings are independently snapshotted by the app.
 * The shared scene grammar retains its original null/follow semantics elsewhere. */
export function resolveTeachingScene(lesson,step){
  const resolved=resolveScene(step,TEACHING_GUIDES[lesson.id].hemisphere);
  return {...resolved,network:resolved.network??{mode:'off',focus:null}};
}

/** Emphasis changes inside a lesson preserve every authored comparison object. */
export function focusTeachingTarget(resolved,target){
  const next={...resolved,regions:resolved.regions.map(r=>({...r})),bundleIds:[...resolved.bundleIds],ghostIds:[...resolved.ghostIds],deepRegionIds:[...resolved.deepRegionIds]};
  const sides=resolved.side?[resolved.side]:['L','R'];
  if(target.kind==='parcel'){
    const selected={id:target.id,hemi:resolved.side??'both'};
    next.regions=[selected,...next.regions.filter(r=>r.id!==selected.id||r.hemi!==selected.hemi)];
  }else if(target.kind==='deep'){
    const ids=sides.map(side=>`${target.id}-${side==='R'?'rh':'lh'}`);
    next.deep=true;next.deepRegionIds=[...new Set([...next.deepRegionIds,...ids])];next.deepFocusIds=ids;
  }else if(target.kind==='bundle'){
    next.bundleIds=[...new Set(sides.map(side=>resolveBundleId(target.id,side)))];
    next.ghostIds=[...new Set([...resolved.bundleIds,...resolved.ghostIds])].filter(id=>!next.bundleIds.includes(id));
    next.surface=Math.min(resolved.surface??.18,.18);
  }
  return next;
}
