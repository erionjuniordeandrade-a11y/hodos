import {MIPS_TARGET,MIPS_BUNDLES,parseMipsState,mipsQuery,corridorsForState,reflectionText} from './mips_content.js';

const $=id=>document.getElementById(id);
const phaseOrder=['orient','compare','explain'];
let state=parseMipsState(location.search),scene=null,error=null,leaving=false,currentView=null;
addEventListener('pagehide',event=>{
  if(!event.persisted){leaving=true;scene?.dispose();scene=null;}
});
const testMode=new URLSearchParams(location.search).has('test');
function render(){
  document.querySelectorAll('[data-phase]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.phase===state.phase)));
  document.querySelectorAll('[data-panel]').forEach(panel=>panel.hidden=panel.dataset.panel!==state.phase);
  document.querySelectorAll('[data-corridor]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.corridor===state.corridor)));
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===(scene?currentView:state.view))));
  $('corridorControls').disabled=state.phase==='orient';
  $('corridorWidth').value=state.width;
  $('reflection').hidden=state.phase!=='explain';
  $('nextPhase').hidden=state.phase==='explain';
  $('nextPhase').textContent=state.phase==='orient'?'Compare corridors':'Explain trade-offs';
  if(scene)scene.setCorridors(corridorsForState(state));
}
function change(patch,{focus=false}={}){
  const oldPhase=state.phase;
  state={...state,...patch};
  const query=mipsQuery(state)+(testMode?'&test=1':'');
  history[oldPhase!==state.phase?'pushState':'replaceState'](null,'',query);
  render();
  if(patch.view&&scene)scene.flyTo({view:state.view,tweenMs:350});
  if(focus)$(`${state.phase}Title`).focus({preventScroll:true});
}
document.querySelectorAll('[data-phase]').forEach(b=>b.addEventListener('click',()=>change({phase:b.dataset.phase})));
document.querySelectorAll('[data-corridor]').forEach(b=>b.addEventListener('click',()=>change({corridor:b.dataset.corridor})));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>change({view:b.dataset.view})));
$('corridorWidth').addEventListener('change',event=>change({width:event.target.value}));
$('nextPhase').addEventListener('click',()=>change({phase:phaseOrder[phaseOrder.indexOf(state.phase)+1]},{focus:true}));
addEventListener('popstate',()=>{state=parseMipsState(location.search);render();scene?.flyTo({view:state.view,tweenMs:0});});
$('reasoningNote').addEventListener('input',()=>{$('downloadNote').disabled=!$('reasoningNote').value.trim();});
$('downloadNote').addEventListener('click',()=>{
  const url=URL.createObjectURL(new Blob([reflectionText($('reasoningNote').value,state)],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='hodos-corridor-reflection.txt';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('retryScene').addEventListener('click',()=>location.reload());
render();
try{
  // The exercise needs the corridor API. Separate this dependency from a renderer
  // cached by an earlier visit to the atlas during a Pages deployment transition.
  const {createAtlasScene}=await import('./atlas_scene.js?v=mips-20260919-1');
  scene=await createAtlasScene($('atlasCanvas'),{
    onStatus(message,detail){$('sceneStatus').textContent=message;$('sceneStatus').hidden=!!detail?.ready;},
    onView({view}){
      currentView=view;
      const named={left:'Lateral view',superior:'Superior view',anterior:'Anterior view'};
      $('viewStatus').textContent=named[view]||'Free rotation';
      document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
    },
  });
  if(leaving){scene.dispose();scene=null;}
  else{
  scene.setHemisphere('L');scene.setSurface(.16);scene.setDeep(false);
  scene.setBundles([...MIPS_BUNDLES]);scene.setProfile('presenter');scene.setPlaying(false);
  scene.setLesion(MIPS_TARGET);render();scene.flyTo({view:state.view,tweenMs:0});
  }
}catch(cause){
  scene?.dispose();scene=null;
  error=String(cause?.message||cause);
  $('sceneStatus').hidden=false;
  $('sceneStatus').textContent='The 3D atlas could not load. Retry it, or continue with the prompts and evidence below.';
  $('retryScene').hidden=false;
}
if(testMode)Object.defineProperty(window,'__mipsTest',{get:()=>({ready:!!scene,error,state:{...state},scene:scene?.state??null})});
