/** Original educational drafts derived from the reviewed audit source pack.
 * Reference photographs retain separate source identity from atlas geometry.
 * No patient images or functional coordinates are supplied by the lessons.
 * A source supports only its stated claim, modality and population.
 */
import {BUNDLE_FAMILIES,SUBCORTEX_IDS} from './atlas_data.js';
import {REFERENCE_SOURCES,REGIONS} from './lesson_references.js';
import {networkFromScene} from './atlas_networks.js';
export {REGIONS} from './lesson_references.js';
import {RESIDENT_LESSONS,RESIDENT_SOURCES} from './lessons/resident-anatomy.js';
import {NETWORK_LECTURES,NETWORK_SOURCES} from './lessons/network-lectures.js';
import {DISSECTION_PLATES} from './dissection_references.js';
export const CONTENT_VERSION='2026-09-11.1';
export const EVIDENCE_CLASSES=Object.freeze(['atlas','reconstruction','association',
  'schematic','recovery_overlay','functional_measurement','model_metric',
  'experimental_anatomy','conceptual_model']);

export const SOURCES=Object.freeze({...REFERENCE_SOURCES,...RESIDENT_SOURCES,...NETWORK_SOURCES});

// Cards can introduce a source not cited in the main prose. Both routes must be
// reachable in the player's Sources & limits section.
export function sourceIdsForStep(step,regions=REGIONS){
  return [...new Set([...step.sources,...step.regions.flatMap(id=>regions[id].sources)])];
}

// Declarative per-step scene state. 'follow' means: use the current hemisphere
// control (L, R or both). A fixed 'L'/'R' means the lesson's
// evidence is side-specific and must not silently track the control.
//
// SCENE GRAMMAR v2 adds: bundles (family list, supersedes `bundle`), ghost (dimmed
// context families), regions (list, first = focus, supersedes `region`), camera
// (flight, supersedes `view`), durationSec (per-step auto-advance pace) and
// deepRegions (subcortex highlight subset). Every v1 lesson leaves these at their
// default below, so resolveScene's v1 behaviour is unchanged.
export const DEFAULT_SCENE=Object.freeze({side:'follow',bundle:null,region:null,
  deep:false,surface:null,view:null,trace:false,
  bundles:Object.freeze([]),ghost:Object.freeze([]),regions:Object.freeze([]),
  camera:null,durationSec:null,deepRegions:Object.freeze([]),network:null});

export const LESSONS=Object.freeze([...RESIDENT_LESSONS,...NETWORK_LECTURES].map(l=>({...l,version:CONTENT_VERSION,
  steps:l.steps.map(s=>({...s,scene:{...DEFAULT_SCENE,...s.scene}}))})));

const SCENE_SIDES=Object.freeze(['follow','L','R']);
const SCENE_BUNDLES=Object.freeze([null,'CST','FAT','OR','AF']);
const SCENE_VIEWS=Object.freeze([null,'follow','left','right','top','medial']);
const SCENE_REGION_HEMIS=Object.freeze(['follow','L','R']);
const SCENE_CAMERA_VIEWS=Object.freeze(['left','right','superior','anterior','posterior','medial','follow']);

function validRegionEntry(r){
  return r && typeof r==='object' && Number.isInteger(r.id) && r.id>=0 && SCENE_REGION_HEMIS.includes(r.hemi);
}

function validateScene(scene,lessonId){
  if(!scene || typeof scene!=='object') throw new Error(`Missing scene in ${lessonId}`);
  if(!SCENE_SIDES.includes(scene.side)) throw new Error(`Invalid scene side in ${lessonId}`);
  if(!SCENE_BUNDLES.includes(scene.bundle)) throw new Error(`Invalid scene bundle in ${lessonId}`);
  if(!SCENE_VIEWS.includes(scene.view)) throw new Error(`Invalid scene view in ${lessonId}`);
  if(typeof scene.deep!=='boolean') throw new Error(`Invalid scene deep flag in ${lessonId}`);
  if(typeof scene.trace!=='boolean') throw new Error(`Invalid scene trace flag in ${lessonId}`);
  if(scene.surface!==null && (typeof scene.surface!=='number' || Number.isNaN(scene.surface) || scene.surface<0 || scene.surface>1))
    throw new Error(`Invalid scene surface range in ${lessonId}`);
  if(scene.region!==null){
    if(typeof scene.region!=='object' || !Number.isInteger(scene.region.id) || scene.region.id<0 ||
      !SCENE_REGION_HEMIS.includes(scene.region.hemi)) throw new Error(`Invalid scene region in ${lessonId}`);
  }
  if(scene.network!=null)networkFromScene(scene.network);
  // SCENE GRAMMAR v2
  if(!Array.isArray(scene.bundles) || scene.bundles.some(f=>!BUNDLE_FAMILIES.includes(f)))
    throw new Error(`Invalid scene bundles in ${lessonId}`);
  if(!Array.isArray(scene.ghost) || scene.ghost.some(f=>!BUNDLE_FAMILIES.includes(f)))
    throw new Error(`Invalid scene ghost in ${lessonId}`);
  if(!Array.isArray(scene.regions) || scene.regions.some(r=>!validRegionEntry(r)))
    throw new Error(`Invalid scene regions in ${lessonId}`);
  if(scene.camera!==null){
    const c=scene.camera;
    if(typeof c!=='object' || !SCENE_CAMERA_VIEWS.includes(c.view) ||
      (c.zoom!=null && (typeof c.zoom!=='number' || Number.isNaN(c.zoom) || c.zoom<=0)) ||
      (c.tweenMs!=null && (typeof c.tweenMs!=='number' || Number.isNaN(c.tweenMs) || c.tweenMs<0)))
      throw new Error(`Invalid scene camera in ${lessonId}`);
  }
  if(scene.durationSec!==null && (typeof scene.durationSec!=='number' || Number.isNaN(scene.durationSec) || scene.durationSec<=0))
    throw new Error(`Invalid scene durationSec in ${lessonId}`);
  if(!Array.isArray(scene.deepRegions) || scene.deepRegions.some(id=>!SUBCORTEX_IDS.includes(id)&&!SUBCORTEX_IDS.includes(`${id}-lh`)))
    throw new Error(`Invalid scene deepRegions in ${lessonId}`);
}

export function validateLessons(lessons=LESSONS,{sources=SOURCES,regions=REGIONS}={}){
  const ids=new Set(),usedSources=new Set(),usedRegions=new Set(),papers=new Set();
  for(const [id,s] of Object.entries(sources)){
    if(s.id!==id||!s.title||!s.scope||!EVIDENCE_CLASSES.includes(s.evidenceClass))
      throw new Error(`Invalid source ${id}`);
    if(s.url){
      const url=new URL(s.url);
      if(url.protocol!=='https:')throw new Error(`Invalid source URL ${id}`);
      const paper=url.href.toLowerCase().replace(/\/$/,'');
      if(papers.has(paper))throw new Error(`Duplicate source ${id}`);
      papers.add(paper);
    }
  }
  for(const [id,r] of Object.entries(regions)){
    if(!r.name||!r.text||!EVIDENCE_CLASSES.includes(r.evidenceClass)||!Array.isArray(r.sources)||!r.sources.length)
      throw new Error(`Invalid region card ${id}`);
    if(r.sources.some(source=>!sources[source]))throw new Error(`Unresolved source in region card ${id}`);
  }
  for(const l of lessons){
    if(ids.has(l.id)||!l.version||l.reviewStatus!=='draft'||!l.steps.length)throw new Error('Invalid lesson identity or review state');
    ids.add(l.id);
    for(const s of l.steps){
      if(s.referencePlate!=null&&!Object.hasOwn(DISSECTION_PLATES,s.referencePlate))throw new Error(`Unknown dissection reference in ${l.id}`);
      if(!s.title||!s.text||!s.notes||!EVIDENCE_CLASSES.includes(s.evidenceClass)||
        !Array.isArray(s.sources)||!Array.isArray(s.regions))throw new Error(`Invalid step in ${l.id}`);
      if(s.sources.some(id=>!sources[id])||s.regions.some(id=>!regions[id]))throw new Error(`Unresolved reference in ${l.id}`);
      s.regions.forEach(id=>usedRegions.add(id));
      sourceIdsForStep(s,regions).forEach(id=>usedSources.add(id));
      validateScene(s.scene,l.id);
    }
  }
  for(const id of Object.keys(regions))if(!usedRegions.has(id))throw new Error(`Unreferenced region ${id}`);
  for(const id of Object.keys(sources))if(!usedSources.has(id))throw new Error(`Unreferenced source ${id}`);
  return true;
}
validateLessons();
