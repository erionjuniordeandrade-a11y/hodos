// Pure resolution of a lesson step's declarative scene into concrete atlas
// scene actions. No DOM access, no import from atlas_scene.js: this module is
// unit-testable in isolation and owns exactly one job — turning a step's
// declarative scene (v1: side,bundle,region,deep,surface,view,trace; v2 adds
// bundles,ghost,regions,camera,durationSec,deepRegions) plus "what is the
// hemisphere control set to right now" into the values the viewer applies.
//
// v2 fields supersede their v1 counterpart when present, but v1 fields keep
// their exact v1 meaning and every field the module already returned keeps
// its exact shape — existing callers and existing lesson content see no change.
import {BUNDLE_FAMILIES,MIDLINE_BUNDLE_FAMILIES,resolveBundleId} from './atlas_data.js';
import {networkFromScene} from './atlas_networks.js';

export const DEFAULT_DURATION_SEC=20;

// CONTEXT.md laterality: never invent L or R. A 'follow' step under the "Both
// hemispheres" control resolves to side null — bundles, regions and deep structures
// then paint BOTH sides and the readout says "Both", instead of silently choosing L.
function resolveSide(sceneSide,currentHemisphere){
  if(sceneSide==='L'||sceneSide==='R')return sceneSide;
  if(currentHemisphere==='L'||currentHemisphere==='R')return currentHemisphere;
  return null;
}

function resolveRegionHemi(hemi,side){
  if(hemi!=='follow')return hemi;
  return side??'both';
}

/** Resolve a list of scene-grammar bundle families to concrete ids for one side.
 * Throws on an unknown family so a lesson author gets an immediate, specific error. */
function resolveFamilies(families,side){
  return (families||[]).flatMap(family=>{
    if(!BUNDLE_FAMILIES.includes(family))throw new Error(`Unknown bundle family: ${family}`);
    if(MIDLINE_BUNDLE_FAMILIES.includes(family))return [family];
    return side?[resolveBundleId(family,side)]:[resolveBundleId(family,'L'),resolveBundleId(family,'R')];
  });
}

/**
 * @param {{scene:object}} step - a lesson step carrying a declarative `scene`.
 * @param {'L'|'R'|'both'|string} currentHemisphere - the hemisphere control's current value.
 * @returns {{side:'L'|'R'|null,
 *   bundleId:string|null, bundleIds:string[], ghostIds:string[],
 *   region:{hemi:'L'|'R',id:number}|null, regions:{hemi:'L'|'R',id:number}[],
 *   deep:boolean, surface:number|null, view:'left'|'right'|'top'|'medial'|null, trace:boolean,
 *   camera:{view:string,zoom:number,tweenMs:number}|null,
 *   durationSec:number, deepRegionIds:string[],
 *   network:{mode:'off'|'all'|'focus',focus:number|null}|null}}  — null = step says nothing about networks
 */
export function resolveScene(step,currentHemisphere){
  const scene=step?.scene;
  if(!scene) throw new Error('Step has no declarative scene');
  const side=resolveSide(scene.side,currentHemisphere);

  // v1 single bundle, unchanged; v2 `bundles` (a family list) supersedes it when present.
  const bundleId=scene.bundle&&side?`${scene.bundle}_${side}`:null;
  const bundleIds=Array.isArray(scene.bundles)&&scene.bundles.length
    ? resolveFamilies(scene.bundles,side)
    : (scene.bundle?(side?[bundleId]:[`${scene.bundle}_L`,`${scene.bundle}_R`]):[]);
  const ghostIds=resolveFamilies(scene.ghost,side);

  // v1 single region, unchanged; v2 `regions` (first = focus) supersedes it when present.
  const region=scene.region?{id:scene.region.id,hemi:resolveRegionHemi(scene.region.hemi,side)}:null;
  const regions=Array.isArray(scene.regions)&&scene.regions.length
    ? scene.regions.map(r=>({id:r.id,hemi:resolveRegionHemi(r.hemi,side)}))
    : (region?[region]:[]);

  let view=null;
  if(scene.view==='follow')view=side===null?'superior':(side==='R'?'right':'left');
  else if(scene.view)view=scene.view;

  // v2 camera flight; supersedes `view` at the call site (lesson_scene never decides that —
  // it just resolves both so the caller can prefer `camera` when present).
  let camera=null;
  if(scene.camera){
    const camView=scene.camera.view==='follow'?(side===null?'superior':(side==='R'?'right':'left')):scene.camera.view;
    camera={view:camView,zoom:scene.camera.zoom??1,tweenMs:scene.camera.tweenMs??900};
  }

  const durationSec=typeof scene.durationSec==='number'&&scene.durationSec>0?scene.durationSec:DEFAULT_DURATION_SEC;
  const deepRegionIds=(Array.isArray(scene.deepRegions)?scene.deepRegions:[]).flatMap(id=>/-(lh|rh)$/.test(id)?[id]:side?[`${id}-${side==='R'?'rh':'lh'}`]:[`${id}-lh`,`${id}-rh`]);

  // v3: optional Yeo-7 wash. Undefined/null = leave the viewer's network state alone;
  // 'off' | 'all' | a code such as 'SMN' is explicit. Unknown codes throw at resolve time.
  const network=scene.network==null?null:networkFromScene(scene.network);

  return {side,bundleId,bundleIds,ghostIds,region,regions,
    deep:!!scene.deep,surface:scene.surface==null?null:scene.surface,view,trace:!!scene.trace,
    camera,durationSec,deepRegionIds,network};
}
