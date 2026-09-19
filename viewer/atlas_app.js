import {createAtlasScene} from './atlas_scene.js';
import {atlasSelectionFromSearch,regionIdentity,resolveBundleId} from './atlas_data.js';
import {mountAnatomyLessons} from './anatomy_lesson_player.js';
import {resolveTeachingScene,focusTeachingTarget} from './anatomy_learning.js';
import {TEACHING_GUIDES} from './lesson_briefings.js';
import {resolveScene} from './lesson_scene.js';
import {DEFAULT_SCENE} from './lesson_content.js';
import {toggleBundle,MAX_BUNDLES,tintForIndex,tintCss,filterBundles,selectionCaption} from './bundle_picker.js';
import {YEO7,networkLabel,networkFromSearch,networkToSearchValue,networkSelection,rgbCss} from './atlas_networks.js';
import {anatomyCatalog,searchAnatomy,pathwayFamilies} from './atlas_catalog.js';
import {bundleLabel,bundleAliases} from './atlas_glossary.js';
import {caseReference} from './case_reference.js';
import {CASE_LESIONS,lesionScene,LESION_NOTE} from './case_lesions.js';
import {arterialSelection,arterialFromSearch,arterialToSearchValue,arterialLabel,ARTERIAL_NOTE} from './atlas_arterial.js';

const $=id=>document.getElementById(id),initial=atlasSelectionFromSearch(location.search);
// Read `net` before any syncURL() runs: a pick/clear rewrites the URL from scene state, which is still off at boot.
const initialNetwork=networkFromSearch(location.search);
const bootParams=new URLSearchParams(location.search);
let scene,player,profile=initial.profile,playing=false,currentStep=null,currentLesson=null,exploration=null,lastResolvedTrace=false;
// Ordered primary selection (pick order = tint order in the scene) and the ghost set that
// came with the current lesson step. Manual picks keep the ghosts unless a ghost is promoted.
let selectedBundles=[],currentGhosts=[];
// CONTEXT.md: never invent L or R. 'both' (or anything else) is null, not L.
const currentHemisphere=()=>{const v=$('atlasHemisphere').value;return v==='L'||v==='R'?v:null;};
let currentPick=null; // {hemi:'L'|'R'|'both',id} once a parcel has actually been picked
let currentDeep=null,catalog=[],exploring=false;
const option=(value,text)=>{const n=document.createElement('option');n.value=value;n.textContent=text;return n;};
function syncURL(){const p=new URLSearchParams(location.search);p.set('profile',profile);
  // During a lesson these keys retain Explore's settings. The lesson/step/phase
  // keys own the teaching view, so reload cannot mix two different scenes.
  if(currentLesson){history.replaceState(history.state,'',`${location.pathname}?${p}`);return;}
  p.set('hemi',$('atlasHemisphere').value);
  if(currentPick){p.set('area',String(currentPick.id));p.set('areaHemi',currentPick.hemi);}else{p.delete('area');p.delete('areaHemi');}
  if(currentDeep)p.set('deep',currentDeep.id);else p.delete('deep');
  const nv=scene?networkToSearchValue(scene.state.network):null;if(nv)p.set('net',nv);else p.delete('net');
  const av=scene?arterialToSearchValue(scene.state.arterial,scene.arterialRows):null;if(av)p.set('art',av);else p.delete('art');
  history.replaceState(history.state,'',`${location.pathname}?${p}`);}
function motionUI(){const canPlay=profile==='teaching'&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('tracePlay').disabled=!canPlay;$('tracePlay').textContent=playing&&canPlay?'Pause fibre animation':'Animate fibre paths';
  $('tracePlay').setAttribute('aria-pressed',String(playing&&canPlay));
  $('traceNote').textContent=profile==='presenter'?'Presenter · static reference anatomy.':!canPlay?'Reduced motion · static reference anatomy.':
    `${playing?'Animating':'Paused'} · fibre paths are illustrative: no direction or conduction speed is implied.`;
  scene?.setPlaying(playing&&canPlay);
}
function setProfile(value){profile=value==='presenter'?'presenter':'teaching';document.body.dataset.profile=profile;$('lessonProfile').value=profile;scene?.setProfile(profile);motionUI();syncURL();}
const VIEW_NAMES={superior:'superior view',anterior:'anterior view',posterior:'posterior view',inferior:'inferior view',medial:'medial view',free:'free view'};
function viewName(hemisphere,view){
  if(view==='left'||view==='right')return hemisphere==='both'||(hemisphere==='L')===(view==='left')?`${view} lateral view`:`${view} view`;
  return VIEW_NAMES[view]||`${view} view`;
}
function syncMedialLabel(){document.querySelector('[data-view="medial"]').textContent=$('atlasHemisphere').value==='R'?'Right medial':'Left medial';}
/** Show a picked parcel. hemi is 'L' | 'R' | 'both' — 'both' is the paired label lit in
 * both hemispheres and is what a 'follow' lesson step means under the Both control. */
function readRegion(hemi,id,vertex=null){
  if(!['L','R','both'].includes(hemi))return clearPick();
  currentDeep=null;$('deepRegion').value='';scene.setDeepHighlight([]);
  if($('atlasHemisphere').value!=='both'&&$('atlasHemisphere').value!==hemi){
    $('atlasHemisphere').value=hemi;scene.setHemisphere(hemi);syncMedialLabel();
  }
  const region=regionIdentity(scene.surfaceMeta,hemi==='both'?'L':hemi,id);scene.select(hemi,id);
  currentPick={hemi,id};
  document.querySelector('.parcel-legend').hidden=id===0;
  $('pickedClass').textContent='Atlas parcel, HCP-MMP1';
  const sideWord=hemi==='L'?'Left':hemi==='R'?'Right':'Both';
  $('pickedName').textContent=`${sideWord} · ${id===0?'medial wall':`area ${region.code}`}`;
  $('pickedDescription').textContent=id===0?'Unlabelled medial wall in this atlas.':
    hemi==='both'
      ? `Area ${region.code} in both hemispheres · Group reference boundary. Individual function and tract endpoints require separate evidence.`
      : `Area ${region.code}, ${hemi==='L'?'left':'right'} hemisphere · HCP-MMP1 code ${region.raw}.${parcelNetworkNote(hemi,id)} Group reference boundary; individual function and tract endpoints require separate evidence.`;
  const paired=$('atlasPairedArea');
  paired.hidden=hemi!=='both';paired.value=`both:${id}`;paired.textContent=`Both · ${region.code}`;
  $('atlasArea').value=`${hemi}:${id}`;
  // Yeo-7 is a per-VERTEX label: report it only for an actual clicked vertex, never inferred
  // for a parcel (a parcel can straddle networks) and never for a lesson/URL pick.
  const nid=(vertex!=null&&hemi!=='both')?scene.networkAt(hemi,vertex):null;
  const aid=(vertex!=null&&hemi!=='both'&&scene.state.arterial?.mode!=='off')?scene.arterialAt(hemi,vertex):null;
  $('pickedNetwork').textContent=aid!=null?(aid===0?'Arterial atlas at this vertex: unlabelled':`Arterial atlas at this vertex: ${arterialLabel(scene.arterialRows,aid)} · group template, not an individual`)
    :nid==null?'':nid===0?'Yeo-7 at this vertex: medial wall (unlabelled)'
    :`Yeo-7 at this vertex: ${networkLabel(nid)} · group resting-state label, not an individual`;
  syncURL();
}
/** Majority Yeo-7 label across a parcel's vertices: a group expectation, shown with its share. */
function parcelNetworkNote(hemi,id){
  const summary=scene.parcelNetwork?.(hemi,id);if(!summary||!summary.id)return '';
  return ` Mostly ${networkLabel(summary.id)} in the Yeo-7 group atlas (${Math.round(summary.share*100)}% of its vertices).`;
}
/** Arterial-territory wash: select + legend + URL key. Exclusive with the Yeo-7 wash so one
 * colour on the cortex always means one thing. */
function applyArterial(sel){
  const rows=scene.arterialRows,s=arterialSelection(sel?.mode,sel?.focus,rows);
  if(s.mode!=='off'&&scene.state.network.mode!=='off')applyNetworks(networkSelection('off'));
  scene.setArterial(s);
  const live=scene.state.arterial,sel_=$('atlasArterial'),legend=$('arterialLegend');
  sel_.value=live.mode==='off'?'off':live.mode==='all'?'all':String(live.focus);
  legend.hidden=live.mode==='off';
  for(const li of legend.children)li.classList.toggle('dim',live.mode==='focus'&&Number(li.dataset.id)!==live.focus);
  if(live.mode!=='off'){
    const readout=$('sceneNetwork');readout.hidden=false;
    readout.querySelector('span').textContent=live.mode==='all'?'Arterial territories · Liu 2023 group template':`${arterialLabel(rows,live.focus)} territory · Liu 2023 group template`;
    readout.querySelector('i').style.background=live.mode==='focus'?rgbCss(rows.find(r=>r.id===live.focus).rgb):`linear-gradient(90deg,${rows.map(r=>rgbCss(r.rgb)).join(',')})`;
    if(!currentPick&&!currentDeep){
      $('pickedClass').textContent='Vascular context, arterial atlas';
      $('pickedName').textContent=live.mode==='all'?'Four supply territories':`${arterialLabel(rows,live.focus)} territory`;
      $('pickedDescription').textContent=ARTERIAL_NOTE;
    }
  }else if(scene.state.network.mode==='off'){$('sceneNetwork').hidden=true;}
  syncURL();
}
/** Yeo-7 wash control: select + legend + URL key, one entry point (also used by lesson steps). */
function applyNetworks(sel){
  const s=networkSelection(sel?.mode,sel?.focus);
  if(s.mode!=='off'&&scene.state.arterial?.mode!=='off'){scene.setArterial(arterialSelection('off'));$('atlasArterial').value='off';$('arterialLegend').hidden=true;}
  scene.setNetworks(s);
  const live=scene.state.network;
  $('atlasNetworks').value=live.mode==='off'?'off':live.mode==='all'?'all':String(live.focus);
  const legend=$('networkLegend');legend.hidden=live.mode==='off';
  for(const li of legend.children)li.classList.toggle('dim',live.mode==='focus'&&Number(li.dataset.id)!==live.focus);
  const networkReadout=$('sceneNetwork');networkReadout.hidden=live.mode==='off';
  networkReadout.querySelector('span').textContent=live.mode==='all'?'Yeo-7 · all group networks':`${networkLabel(live.focus)} · Yeo-7 group`;
  networkReadout.querySelector('i').style.background=live.mode==='focus'?rgbCss(YEO7.find(n=>n.id===live.focus).rgb)
    :`linear-gradient(90deg,${YEO7.map(n=>rgbCss(n.rgb)).join(',')})`;
  if(!currentPick&&!currentDeep&&live.mode!=='off'){
    $('pickedClass').textContent='Network context, Yeo-7';
    $('pickedName').textContent=live.mode==='all'?'Seven cortical networks':networkLabel(live.focus);
    $('pickedDescription').textContent='Population cortical grouping. Select cortex to compare its HCP parcel identity; network colour does not show task activation.';
  }else if(!currentPick&&!currentDeep){
    $('pickedClass').textContent='Atlas parcel';$('pickedName').textContent='No parcel selected';
    $('pickedDescription').textContent='Select cortex to inspect its HCP-MMP1 label.';
  }
  syncURL();
}
/** No parcel asserted (S-5): nothing is lit and the readout does not name a side. */
function clearPick(){
  currentPick=null;currentDeep=null;scene.select(null);scene.setDeepHighlight([]);$('deepRegion').value='';
  document.querySelector('.parcel-legend').hidden=true;
  $('pickedClass').textContent='Atlas parcel';
  $('pickedName').textContent='No parcel selected';
  $('pickedDescription').textContent='Select cortex to inspect its HCP-MMP1 label.';
  $('pickedNetwork').textContent='';
  $('atlasArea').value='';syncURL();
}
function showDeep(entry,{reveal=true}={}){
  currentPick=null;currentDeep=entry;scene.select(null);scene.setDeep(true);scene.setDeepHighlight([entry.id]);
  document.querySelector('.parcel-legend').hidden=true;
  if(reveal)revealInterior();
  $('atlasArea').value='';$('deepRegion').value=entry.id;$('deepStructures').checked=true;$('pickedNetwork').textContent='';
  if($('atlasHemisphere').value!=='both'&&$('atlasHemisphere').value!==entry.hemisphere){
    $('atlasHemisphere').value=entry.hemisphere;scene.setHemisphere(entry.hemisphere);syncMedialLabel();
  }
  $('pickedClass').textContent='Atlas structure, Melbourne S1';
  $('pickedName').textContent=`${entry.hemisphere==='L'?'Left':'Right'} · ${entry.name}`;
  $('pickedDescription').textContent=entry.name==='Thalamus'?'Merged thalamic atlas territory. No specific relay nucleus or circuit is identified.':
    'Group reference surface. Its appearance does not establish a functional state or connection.';
  syncURL();
}
function revealInterior(){
  if(Number($('surfaceLevel').value)>=60){scene.setSurface(.15);$('surfaceLevel').value='15';}
}
/** Apply one or more bundles at once (v2 `bundles`+`ghost`); a single id keeps the exact
 * v1 pathway-summary text. Owns `selectedBundles` (pick order = tint order) and syncs the chips. */
function applyBundles(ids,ghostIds=[]){
  selectedBundles=[...new Set(ids)].slice(0,MAX_BUNDLES);currentGhosts=[...new Set(ghostIds)].filter(id=>!selectedBundles.includes(id));
  ids=selectedBundles;ghostIds=currentGhosts;
  scene.setBundles(ids,{ghost:ghostIds});
  syncPicker();
  if(!ids.length&&!ghostIds.length){
    $('pathwaySummary').textContent='Cortical reference · no pathway displayed';return;
  }
  const metaOf=id=>scene.tractMeta.bundles.find(x=>x.id===id);
  const ghostNote=ghostIds.length?`${ghostIds.length} ghosted for context`:'';
  let summary;
  if(ids.length===1){const b=metaOf(ids[0]);summary=b?`${bundleLabel(ids[0])} · ${b.lines} sampled atlas paths`:bundleLabel(ids[0]);}
  else if(ids.length){
    // Several primaries: one total, then the names in pick (= tint) order — the per-bundle
    // "220 sampled atlas paths" repeated N times was unreadable past three picks.
    const total=ids.reduce((n,id)=>n+(metaOf(id)?.lines||0),0);
    summary=`${ids.length} pathways with ${total.toLocaleString('en-GB')} sampled atlas paths · ${ids.map(bundleLabel).join(', ')}`;
  }
  // Ghost-only steps (no primary bundle) must not open with a dangling separator.
  $('pathwaySummary').textContent=summary
    ? summary+(ghostNote?` · ${ghostNote}`:'')
    : `Cortical reference · ${ghostNote}`;
}
function showBundle(id){applyBundles(id?[id]:[]);if(id)revealInterior();}
/** Candidate pathway ids for a lesson group: an explicit side, else the control's side,
 * else BOTH sides — never a defaulted L. */
function candidateIds(group,side){
  const fam=group==='or'?'OR':group.toUpperCase();const s=side||currentHemisphere();
  return s?[`${fam}_${s}`]:[`${fam}_L`,`${fam}_R`];
}
/** Reflect the selection on the chips: pressed state, tint swatch in pick order, count, limit. */
function syncPicker(){
  const full=selectedBundles.length>=MAX_BUNDLES;
  for(const chip of document.querySelectorAll('#pathwayGroups .bundle-chip')){
    const i=selectedBundles.indexOf(chip.dataset.bundle),on=i>=0;
    chip.setAttribute('aria-pressed',String(on));chip.style.setProperty('--chip',on?tintCss(tintForIndex(i)):'');
    chip.disabled=!on&&full;
    chip.title=on?'Click to remove':full?`Limit of ${MAX_BUNDLES} pathways reached`:'Click to add';
  }
  $('pathwayCount').textContent=selectionCaption(selectedBundles.length);
  $('pathwayClear').disabled=!selectedBundles.length;
  const status=$('pathwayStatus');status.replaceChildren(document.createTextNode(full?`${MAX_BUNDLES} of ${MAX_BUNDLES} pathways displayed. Remove a pathway to add another.`
    :`${selectedBundles.length} of ${MAX_BUNDLES} pathways displayed. Select L or R to add a side.`));
  syncFilterChip();
  const activeId=document.activeElement?.id;
  const selected=$('selectedPathways');selected.replaceChildren();
  for(const id of selectedBundles){const b=document.createElement('button');b.type='button';b.id=`remove-${id}`;
    b.textContent=`${bundleLabel(id)} ×`;b.setAttribute('aria-label',`Remove ${bundleLabel(id)}`);
    b.addEventListener('click',()=>togglePathway(id));selected.append(b);}
  if(activeId?.startsWith('remove-'))(document.getElementById(activeId)||selected.firstElementChild||$('pathwayFilter')).focus({preventScroll:true});
  if(catalog.length)applyPathwayFilter();
}
/** The Layers list mirrors the Find box: say so, with a way out. Never re-enters the filter. */
function syncFilterChip(){
  const q=$('pathwayFilter').value.trim(),status=$('pathwayStatus');let chip=$('pathwayFilterClear');
  if(!q){chip?.remove();return;}
  if(!chip){chip=document.createElement('button');chip.type='button';chip.id='pathwayFilterClear';chip.className='filter-chip';
    chip.addEventListener('click',()=>{$('pathwayFilter').value='';applyPathwayFilter();});status.append(document.createTextNode(' '),chip);}
  chip.textContent=`Filtered by “${q}” ×`;chip.setAttribute('aria-label',`Show all pathways (remove the filter “${q}”)`);
}
/** Manual chip click: toggle in the ordered set. A ghosted bundle that gets picked is promoted. */
function togglePathway(id){
  pauseForExploration();
  const next=toggleBundle(selectedBundles,id);
  if(next===selectedBundles)return; // limit refused the add; syncPicker already disabled the chip
  applyBundles(next,currentGhosts.filter(g=>g!==id));
  if(next.includes(id))revealInterior();
}
function applyPathwayFilter(){
  const q=$('pathwayFilter').value;
  const focusedResult=$('anatomyResults').contains(document.activeElement)?document.activeElement.id:null;
  for(const group of document.querySelectorAll('#pathwayGroups .picker-group')){
    const chips=[...group.querySelectorAll('.bundle-chip')];
    const keep=new Set(filterBundles(chips.map(c=>({id:c.dataset.bundle,label:c.dataset.label})),q,b=>b.label).map(b=>b.id));
    let any=false;for(const c of chips){c.hidden=!keep.has(c.dataset.bundle);any=any||!c.hidden;}
    for(const row of group.querySelectorAll('.pathway-row'))row.hidden=![...row.querySelectorAll('.bundle-chip')].some(c=>!c.hidden);
    group.hidden=!any;
  }
  const results=$('anatomyResults');results.replaceChildren();results.hidden=!q.trim();
  $('clearAnatomySearch').disabled=!q;
  syncFilterChip();
  if(!q.trim()){$('anatomySearchStatus').textContent='Search by name or atlas code, for example V1, thalamus or arcuate.';return;}
  const matches=searchAnatomy(catalog,q);
  $('anatomySearchStatus').textContent=matches.length?`${matches.length} anatomy matches${matches.length>40?' · first 40 shown; refine your search':''}.`
    :'No anatomy matches. Try a parcel code, pathway name or deep structure.';
  for(const kind of ['Cortical parcels','Deep structures','Reference pathways']){
    const group=matches.slice(0,40).filter(e=>e.kind===kind);if(!group.length)continue;
    const section=document.createElement('div'),heading=document.createElement('h3');heading.textContent=kind;section.append(heading);
    for(const entry of group){const b=document.createElement('button');b.type='button';b.textContent=entry.label;
      b.id=`anatomy-${kind.split(' ')[0]}-${entry.hemi||''}-${entry.id}`;
      if(kind==='Reference pathways'){const on=selectedBundles.includes(entry.id);b.setAttribute('aria-pressed',String(on));
        b.disabled=!on&&selectedBundles.length>=MAX_BUNDLES;b.textContent=`${on?'✓ ':''}${entry.label}`;}
      b.addEventListener('click',()=>{pauseForExploration();
        if(kind==='Cortical parcels')readRegion(entry.hemi,entry.id);
        else if(kind==='Deep structures')showDeep(scene.subMeta.structures.find(d=>d.id===entry.id));
        else togglePathway(entry.id);
        // The result is now on the atlas; the popover must not keep covering it.
        closeSearch({refocus:false});$('atlasCanvas').querySelector('canvas')?.focus({preventScroll:true});
      });section.append(b);}
    results.append(section);
  }
  if(focusedResult)document.getElementById(focusedResult)?.focus({preventScroll:true});
}
/** Apply a resolved scene (from resolveScene) to the live atlas: bundles+ghost, the region
 * set (first = focus, rest = secondary highlight), deep structures, surface and camera. */
function applySceneEffects(resolved,{authored=false,keepCamera=false}={}){
  applyBundles(resolved.bundleIds,resolved.ghostIds);
  if(resolved.regions.length){
    readRegion(resolved.regions[0].hemi,resolved.regions[0].id);
    scene.highlight(resolved.regions.slice(1));
  }else{
    clearPick();
  }
  scene.setDeep(resolved.deep);$('deepStructures').checked=resolved.deep;
  scene.setDeepHighlight(resolved.deepRegionIds,{focus:resolved.deepFocusIds||[]});
  if(resolved.surface!=null){scene.setSurface(resolved.surface);$('surfaceLevel').value=String(Math.round(resolved.surface*100));}
  if(resolved.network)applyNetworks(resolved.network);
  if(resolved.lesion)scene.setLesion(resolved.lesion);
  if(!keepCamera){
    if(resolved.camera)scene.flyTo(authored?resolved.camera:{...resolved.camera,zoom:1,focus:true});
    else if(resolved.view)scene.setView(resolved.view==='top'?'superior':resolved.view);
  }
}
function applyStep(lesson,step,{authored=false}={}){
  if(lesson&&!currentLesson&&!exploration)exploration=scene.snapshot();
  currentStep=step;currentLesson=lesson;if(!step){lastResolvedTrace=false;$('lessonSceneStatus').hidden=true;restoreExploration({retain:true});return;}
  exploring=false;$('explorationStatus').hidden=true;
  const resolved=resolveTeachingScene(lesson,step);
  const hemisphere=resolved.side??'both';$('atlasHemisphere').value=hemisphere;scene.setHemisphere(hemisphere);syncMedialLabel();
  applySceneEffects(resolved,{authored});
  if(!resolved.regions.length&&resolved.bundleIds.length&&resolved.network.mode==='off'){
    $('pickedClass').textContent='Pathway reference';
    $('pickedName').textContent=resolved.bundleIds.length===1?bundleLabel(resolved.bundleIds[0]):`${resolved.bundleIds.length} pathways in comparison`;
  }
  lastResolvedTrace=resolved.trace;playing=lastResolvedTrace;motionUI();
  $('lessonSceneStatus').hidden=false;$('lessonSceneStatus').textContent='Lesson view, focus and neighbours';
}
function inspectLessonTarget(target){
  if(!currentLesson||!currentStep)return;
  const authored=resolveTeachingScene(currentLesson,currentStep);
  const focused=focusTeachingTarget(authored,target);
  exploring=false;$('explorationStatus').hidden=true;
  scene.setHemisphere(authored.side??'both');$('atlasHemisphere').value=authored.side??'both';syncMedialLabel();
  applySceneEffects(focused,{keepCamera:true});
  if(target.kind==='deep'||target.kind==='bundle'){
    $('pickedClass').textContent=target.kind==='deep'?'Deep structure':'Pathway';
    $('pickedName').textContent=target.label||target.id;
  }
  $('lessonSceneStatus').hidden=false;$('lessonSceneStatus').textContent=`Comparing ${target.label||target.id}, neighbours retained`;
  playing=false;motionUI();
}
function compareLecture(comparison,option){
  if(!currentLesson)return;
  const side=TEACHING_GUIDES[currentLesson.id].hemisphere;
  scene.setHemisphere(side);$('atlasHemisphere').value=side;syncMedialLabel();
  const resolved=resolveScene({scene:{...currentStep.scene,side,regions:option.regions||[],deep:false,deepRegions:[],network:option.network||'off',
    bundles:option.bundles||[],ghost:option.ghost||[],surface:option.network ? .8 : .14,camera:{view:comparison.view,tweenMs:0}}},side);
  applySceneEffects(resolved,{authored:true});
  $('pickedClass').textContent='Lecture comparison';$('pickedName').textContent=option.label;$('pickedDescription').textContent=comparison.note;
  $('explorationStatus').hidden=true;$('lessonSceneStatus').hidden=false;$('lessonSceneStatus').textContent=`Lecture comparison · ${option.label}. Restore returns to this relationship.`;
}
function pauseForExploration(){
  if(player?.controller.state.status==='playing')player.controller.pause();
  playing=false;motionUI();
  exploring=true;$('explorationStatus').hidden=!currentLesson;
  $('lessonSceneStatus').hidden=true;
  $('explorationStatus').textContent='Free inspection. Restore scene returns to the authored relationship.';
}
function restoreExploration({retain=false}={}){
  if(!exploration)return;scene.restore(exploration);
  $('atlasHemisphere').value=exploration.hemisphere;$('surfaceLevel').value=String(exploration.surface*100);
  $('deepStructures').checked=exploration.deepVisible;if(exploration.selected)readRegion(exploration.selected.hemi,exploration.selected.id);else clearPick();
  if(!exploration.selected&&exploration.deepHighlight?.length===1){
    const d=scene.subMeta.structures.find(d=>d.id===exploration.deepHighlight[0]);if(d)showDeep(d,{reveal:false});
  }
  scene.highlight(exploration.highlighted||[]);scene.setDeepHighlight(exploration.deepHighlight||[]);scene.setDeep(exploration.deepVisible);
  applyNetworks(exploration.network);
  applyBundles(exploration.bundles||[],exploration.ghostBundles||[]);playing=false;motionUI();if(!retain)exploration=null;
  exploring=false;$('explorationStatus').hidden=true;syncMedialLabel();
}
function setMode(mode){
  // Capture before the library changes the canvas aspect ratio and auto-framing.
  if(mode==='library'&&document.body.dataset.mode==='explore'&&!exploration&&scene)exploration=scene.snapshot();
  const wasExplore=document.body.dataset.mode==='explore';
  document.body.dataset.mode=mode;document.body.dataset.expanded='false';$('expandAnatomy').setAttribute('aria-pressed','false');$('expandAnatomy').textContent='Expand';
  if(mode==='explore')$('anatomyDrawer').open=true;else if(wasExplore)$('anatomyDrawer').open=false;
  $('atlasWorkspace').dataset.lessonHidden=String(mode==='explore');$('toggleLesson').setAttribute('aria-expanded',String(mode!=='explore'));
  $('learnHome').setAttribute('aria-current',mode==='explore'?'false':'page');$('toggleLesson').setAttribute('aria-current',mode==='explore'?'page':'false');
}
setMode('library');
$('learnHome').addEventListener('click',()=>player?.library());
$('toggleLesson').addEventListener('click',()=>player?.explore());
$('lessonProfile').addEventListener('change',()=>setProfile($('lessonProfile').value));
function closeSearch({refocus=true}={}){
  if($('anatomySearch').hidden)return;
  $('anatomySearch').hidden=true;$('openAnatomySearch').setAttribute('aria-expanded','false');
  if(refocus)$('openAnatomySearch').focus();
}
$('openAnatomySearch').addEventListener('click',()=>{const open=$('anatomySearch').hidden;
  if(open){$('anatomySearch').hidden=false;$('openAnatomySearch').setAttribute('aria-expanded','true');$('pathwayFilter').focus();}
  else closeSearch();});
$('openAtlasTools').addEventListener('click',()=>{const docked=document.body.dataset.mode==='explore';$('anatomyDrawer').open=docked?true:!$('anatomyDrawer').open;if(docked)$('atlasArea').focus({preventScroll:false});});
$('anatomyDrawer').addEventListener('toggle',()=>{$('openAtlasTools').setAttribute('aria-expanded',String($('anatomyDrawer').open));});
document.querySelector('.skip-link').addEventListener('click',()=>{$('anatomyDrawer').open=true;$('atlasControls').focus();});
const viewMenu=document.querySelector('.atlas-view-menu');
document.addEventListener('pointerdown',event=>{if(viewMenu.open&&!viewMenu.contains(event.target))viewMenu.open=false;});
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;
  if(viewMenu.open){viewMenu.open=false;viewMenu.querySelector('summary').focus();}
  else if(!$('anatomySearch').hidden)closeSearch();
  else if($('anatomyDrawer').open&&document.body.dataset.mode!=='explore'){$('anatomyDrawer').open=false;$('openAtlasTools').focus();}
});
$('expandAnatomy').addEventListener('click',()=>{const open=document.body.dataset.expanded!=='true';document.body.dataset.expanded=String(open);
  $('expandAnatomy').setAttribute('aria-pressed',String(open));$('expandAnatomy').textContent=open?'Back to lesson':'Expand';});
$('tracePlay').addEventListener('click',()=>{playing=!playing;motionUI();});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',motionUI);
$('atlasFit').addEventListener('click',()=>{scene?.setView(scene.state.view);});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{
  if(b.dataset.view==='medial'&&$('atlasHemisphere').value==='both'){
    $('atlasHemisphere').value='L';scene?.setHemisphere('L');if(currentPick)readRegion('L',currentPick.id);syncURL();}
  scene?.setView(b.dataset.view);
  b.closest('details').open=false;
}));

try{
  scene=await createAtlasScene($('atlasCanvas'),{onStatus:(text,{ready=false}={})=>{const status=$('atlasLoading');status.textContent=text;status.hidden=ready;},
    onHover:pick=>{const tip=$('atlasHover');tip.hidden=!pick;if(!pick)return;
      tip.textContent=pick.deep?`${pick.deep.name} · ${pick.deep.hemisphere==='L'?'left':'right'}`
        :`${regionIdentity(scene.surfaceMeta,pick.hemi,pick.id).code}, ${pick.hemi==='L'?'left':'right'} · click to select`;},
    onPick:pick=>{
      if(currentLesson){inspectLessonTarget(pick.deep?{kind:'deep',id:pick.deep.id.replace(/-(lh|rh)$/,''),label:pick.deep.name}:{kind:'parcel',id:pick.id,label:regionIdentity(scene.surfaceMeta,pick.hemi,pick.id).code});}
      else{pick.deep?showDeep(pick.deep):readRegion(pick.hemi,pick.id,pick.vertex);}
    },onInteraction:()=>{playing=false;motionUI();},
    onView:({hemisphere,view})=>{$('sceneOrientation').textContent=`${hemisphere==='both'?'Both hemispheres':hemisphere==='L'?'Left hemisphere':'Right hemisphere'}, ${viewName(hemisphere,view)}`;}});
  $('atlasLoading').hidden=true;
  const area=$('atlasArea');area.replaceChildren(option('','Choose an area…'));
  const paired=option('','Both hemispheres');paired.id='atlasPairedArea';paired.hidden=true;area.append(paired);
  for(const h of ['L','R']){const group=document.createElement('optgroup');group.label=h==='L'?'Left hemisphere':'Right hemisphere';
    for(const id of Object.keys(scene.surfaceMeta.sets.glasser.regions[h]).sort((a,b)=>regionIdentity(scene.surfaceMeta,h,Number(a)).code.localeCompare(regionIdentity(scene.surfaceMeta,h,Number(b)).code,undefined,{numeric:true}))){
      const r=regionIdentity(scene.surfaceMeta,h,Number(id));group.append(option(`${h}:${id}`,`${h} · ${r.code}`));}
    area.append(group);}area.disabled=false;
  area.addEventListener('change',()=>{if(!area.value)return;const [h,id]=area.value.split(':');
    pauseForExploration();
    if($('atlasHemisphere').value!=='both'){$('atlasHemisphere').value=h;scene.setHemisphere(h);}readRegion(h,Number(id));});
  // Yeo-7 networks: options + legend from the pure table; disabled when the set is absent.
  const netSel=$('atlasNetworks'),legend=$('networkLegend');
  if(scene.hasNetworks()){
    netSel.append(option('all','Yeo-7 · all networks'));
    for(const n of YEO7){netSel.append(option(String(n.id),networkLabel(n.id)));
      const li=document.createElement('li');li.dataset.id=String(n.id);
      const sw=document.createElement('i');sw.style.background=rgbCss(n.rgb);li.append(sw,document.createTextNode(networkLabel(n.id)));legend.append(li);}
    netSel.disabled=false;
    netSel.addEventListener('change',()=>{pauseForExploration();
      const v=netSel.value;applyNetworks(v==='off'?networkSelection('off'):v==='all'?networkSelection('all'):networkSelection('focus',Number(v)));});
  }
  // Arterial territories: options + legend from the installed table; disabled when the set is absent.
  const artSel=$('atlasArterial'),artLegend=$('arterialLegend');
  if(scene.hasArterial()){
    artSel.append(option('all','All four territories'));
    for(const r of scene.arterialRows){artSel.append(option(String(r.id),arterialLabel(scene.arterialRows,r.id)));
      const li=document.createElement('li');li.dataset.id=String(r.id);
      const sw=document.createElement('i');sw.style.background=rgbCss(r.rgb);li.append(sw,document.createTextNode(arterialLabel(scene.arterialRows,r.id)));artLegend.append(li);}
    artSel.disabled=false;
    artSel.addEventListener('change',()=>{pauseForExploration();
      const v=artSel.value;applyArterial(v==='off'?arterialSelection('off'):v==='all'?arterialSelection('all'):arterialSelection('focus',Number(v),scene.arterialRows));});
  }
  $('atlasHemisphere').value=initial.hemi;scene.setHemisphere(initial.hemi);syncMedialLabel();
  $('atlasHemisphere').addEventListener('change',()=>{
    const h=$('atlasHemisphere').value;scene.setHemisphere(h);
    pauseForExploration();
    if(currentPick)readRegion(h,currentPick.id);
    else if(currentDeep&&h!=='both'){
      const mirrored=scene.subMeta.structures.find(d=>d.name===currentDeep.name&&d.hemisphere===h);
      if(mirrored)showDeep(mirrored);
    }
    if(h!=='both')scene.setView(h==='L'?'left':'right');
    if(currentStep&&['L','R'].includes(currentStep.scene.side)){
      $('explorationStatus').hidden=false;
      $('explorationStatus').textContent=`Exploring ${h==='both'?'both hemispheres':h==='L'?'the left hemisphere':'the right hemisphere'} · this lesson's evidence is ${currentStep.scene.side==='L'?'left':'right'}-sided.`;
    }
    syncMedialLabel();syncURL();});
  // Multi-bundle chip picker, grouped by the atlas manifest's own `group` field (Association/
  // Cerebellum/Commissural/Cranial nerve/Projection) so every shipped bundle is reachable. No
  // separate "brainstem" bucket exists in the shipped metadata (CBT/DRTT/RST/ML are Projection).
  const groups=$('pathwayGroups');groups.replaceChildren();
  const pathwayGroups=new Map();
  for(const family of pathwayFamilies(scene.tractMeta.bundles,bundleLabel)){
    if(!pathwayGroups.has(family.group)){const g=document.createElement('div');g.className='picker-group';
      const title=document.createElement('h3');title.textContent=family.group;g.append(title);pathwayGroups.set(family.group,g);groups.append(g);}
    const row=document.createElement('div');row.className='pathway-row';const name=document.createElement('span');name.textContent=family.label;row.append(name);
    for(const b of family.bundles){
    const chip=document.createElement('button');chip.type='button';chip.className='bundle-chip';chip.dataset.bundle=b.id;
    chip.dataset.label=bundleLabel(b.id);chip.setAttribute('aria-pressed','false');chip.setAttribute('aria-label',bundleLabel(b.id));
    const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');chip.append(dot,document.createTextNode(/_[LR]$/.test(b.id)?b.id.slice(-1):'Show'));
    chip.addEventListener('click',()=>togglePathway(b.id));row.append(chip);
    }pathwayGroups.get(family.group).append(row);
  }
  catalog=anatomyCatalog(scene.surfaceMeta,scene.tractMeta,scene.subMeta,bundleLabel,bundleAliases);
  $('pathwayFilter').disabled=false;$('pathwayFilter').addEventListener('input',applyPathwayFilter);
  $('clearAnatomySearch').addEventListener('click',()=>{$('pathwayFilter').value='';applyPathwayFilter();$('pathwayFilter').focus();});applyPathwayFilter();
  $('pathwayClear').addEventListener('click',()=>{pauseForExploration();applyBundles([],currentGhosts);});
  $('surfaceLevel').addEventListener('input',()=>{pauseForExploration();scene.setSurface(Number($('surfaceLevel').value)/100);});
  $('deepStructures').addEventListener('change',()=>{pauseForExploration();const show=$('deepStructures').checked;
    if(!show&&currentDeep)clearPick();scene.setDeep(show);if(show)revealInterior();});
  const sub=scene.subMeta;
  for(const d of sub.structures)$('deepRegion').append(option(d.id,`${d.hemisphere} · ${d.name}`));
  $('deepRegion').addEventListener('change',()=>{const entry=sub.structures.find(d=>d.id===$('deepRegion').value);if(!entry)return;
    pauseForExploration();
    $('deepStructures').checked=true;scene.setDeep(true);showDeep(entry);});
  const requestedH=new URLSearchParams(location.search).get('areaHemi');
  // S-5: no pick is asserted at boot unless the URL names one; nothing pre-fills "Left · area 4".
  if(new URLSearchParams(location.search).has('area')){
    readRegion(['L','R','both'].includes(requestedH)?requestedH:initial.hemi,initial.area);
  }else clearPick();
  applyNetworks(initialNetwork);
  // Read the boot-time query: applyNetworks above already rewrote location.search without `art`.
  if(scene.hasArterial()){const a=arterialFromSearch(bootParams.toString(),scene.arterialRows);if(a.mode!=='off')applyArterial(a);}
  applyBundles([]);scene.setSurface(.8);setProfile(profile);
  const deepFromUrl=scene.subMeta.structures.find(d=>d.id===bootParams.get('deep'));if(deepFromUrl)showDeep(deepFromUrl);
  player=mountAnatomyLessons($('lessonPanel'),{
    readOnlyProgress:caseReference,
    onStep:applyStep,onMode:setMode,onInspect:inspectLessonTarget,onCompare:compareLecture,
    onRestore:()=>applyStep(currentLesson,currentStep),onExplore:restoreExploration,
  });
  scene.setProfile(profile);motionUI();
  // Case Conference reference: `?case=<id>` places that case's fictional lesion marker and its
  // authored focus set. Nothing is persisted; the marker is illustrative (case_lesions.js).
  const caseLesion=CASE_LESIONS[bootParams.get('case')];
  if(caseLesion&&!bootParams.has('lesson')){
    $('atlasHemisphere').value=caseLesion.side;scene.setHemisphere(caseLesion.side);syncMedialLabel();
    applySceneEffects(resolveScene({scene:{...DEFAULT_SCENE,...lesionScene(caseLesion)}},caseLesion.side),{authored:true});
    $('lessonSceneStatus').hidden=false;$('lessonSceneStatus').textContent=`Fictional lesion marker · ${caseLesion.label}. ${LESION_NOTE}`;
  }
  window.addEventListener('popstate',()=>{const s=atlasSelectionFromSearch(location.search),netFromUrl=networkFromSearch(location.search);
    const search=location.search,q=new URLSearchParams(search),ah=q.get('areaHemi');
    profile=s.profile;document.body.dataset.profile=profile;scene.setProfile(profile);$('atlasHemisphere').value=s.hemi;scene.setHemisphere(s.hemi);
    // Clear the current lesson before rebuilding the Explore snapshot from the URL.
    currentLesson=null;currentStep=null;exploration=null;
    if(q.has('area')&&['L','R','both'].includes(ah)){
      readRegion(ah,s.area);
    }else clearPick();
    const d=scene.subMeta.structures.find(d=>d.id===q.get('deep'));if(d)showDeep(d);
    applyNetworks(netFromUrl);player.restore(search);player.refresh({restoreView:true});syncMedialLabel();motionUI();});
  if(new URLSearchParams(location.search).has('test'))Object.defineProperty(window,'__atlasTest',{get:()=>({...scene.state,lesson:player.controller.state,
    // Test-only: inject a v2 declarative scene directly, bypassing lesson content, so Playwright
    // can exercise SCENE GRAMMAR v2 (bundles/ghost/regions/camera/deepRegions) in isolation.
    applyScene:sceneInput=>applySceneEffects(resolveScene({scene:{...DEFAULT_SCENE,...sceneInput}},currentHemisphere()),{authored:true}),
    togglePathway,selectedBundles:[...selectedBundles],learningPhase:player.phase})});
  window.addEventListener('pagehide',()=>{scene.dispose();player.dispose();},{once:true});
}catch(error){
  $('atlasLoading').hidden=false;$('atlasLoading').textContent=`Reference atlas unavailable: ${error.message}. Reload to retry.`;
  $('tracePlay').disabled=true;console.error(error);
}
