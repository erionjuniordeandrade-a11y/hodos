// Yeo-7 resting-state networks on the reference cortex (Yeo et al. 2011,
// J Neurophysiol 106:1125, PMID 21653723 — esummary-verified 2026-09-09).
// Pure contracts: names, canonical colours, URL/scene keys. No DOM, no three.js.
//
// Honesty: these are GROUP clusters of intrinsic functional connectivity from
// 1,000 healthy adults, sampled per vertex on the fs_LR 32k surface. A network
// label here is a population expectation; it is not a function measured in
// any patient and it is never registered to a case in this viewer.

export const YEO7_SET='yeo7';

/** id → {code, name, aliases, rgb (canonical Yeo 2011 colour table, 0–255)} */
export const YEO7=Object.freeze([
  Object.freeze({id:1,code:'VIS',name:'Visual',aliases:[],rgb:[120,18,134]}),
  Object.freeze({id:2,code:'SMN',name:'Somatomotor',aliases:['sensorimotor'],rgb:[70,130,180]}),
  Object.freeze({id:3,code:'DAN',name:'Dorsal attention',aliases:['DAN'],rgb:[0,118,14]}),
  Object.freeze({id:4,code:'VAN',name:'Ventral attention',aliases:['salience','VAN','cingulo-opercular'],rgb:[196,58,250]}),
  Object.freeze({id:5,code:'LIM',name:'Limbic',aliases:[],rgb:[220,248,164]}),
  Object.freeze({id:6,code:'FPN',name:'Frontoparietal control',aliases:['control','executive'],rgb:[230,148,34]}),
  Object.freeze({id:7,code:'DMN',name:'Default mode',aliases:['DMN','default'],rgb:[205,62,78]}),
]);

export const NETWORK_MODES=Object.freeze(['off','all','focus']);
const BY_ID=new Map(YEO7.map(n=>[n.id,n]));
const BY_CODE=new Map(YEO7.map(n=>[n.code,n]));

export function networkById(id){return BY_ID.get(Number(id))||null;}
export function networkByCode(code){return BY_CODE.get(String(code||'').toUpperCase())||null;}

/** Display label: "Ventral attention · salience" when a common alias exists. */
export function networkLabel(id){
  const n=networkById(id);if(!n)return '';
  // Show one alias only when it adds a word the name does not already contain ('default' does not).
  const alias=n.aliases.find(a=>a!==n.code&&!n.name.toLowerCase().includes(a.toLowerCase()));
  return alias?`${n.name} · ${alias}`:n.name;
}

export const rgbCss=rgb=>`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
export const rgbUnit=rgb=>rgb.map(v=>v/255);

/** Per-vertex colour table indexed by label id (0 = medial wall → neutral cortex blue). */
export function paletteUnit(){
  const table=[[0.30,0.64,0.87]];
  for(const n of YEO7)table[n.id]=rgbUnit(n.rgb);
  return table;
}

/** Selection state: {mode:'off'|'all'|'focus', focus:id|null}. */
export function networkSelection(mode,focus=null){
  if(mode==='focus'){const n=networkById(focus);return n?{mode:'focus',focus:n.id}:{mode:'off',focus:null};}
  return {mode:mode==='all'?'all':'off',focus:null};
}

/** URL key `net`: absent/off → off, 'all' → all, '1'..'7' or a code → focus. */
export function networkFromSearch(search){
  const v=new URLSearchParams(String(search||'').replace(/^\?/,'')).get('net');
  if(!v||v==='off')return networkSelection('off');
  if(v==='all')return networkSelection('all');
  const n=networkById(v)||networkByCode(v);
  return n?networkSelection('focus',n.id):networkSelection('off');
}
export function networkToSearchValue(sel){
  if(!sel||sel.mode==='off')return null;
  return sel.mode==='all'?'all':String(sel.focus);
}

/** Scene-grammar value → selection. null/undefined → off; 'all'; a code like 'SMN'. Unknown throws. */
export function networkFromScene(value){
  if(value==null||value==='off')return networkSelection('off');
  if(value==='all')return networkSelection('all');
  const n=networkByCode(value);
  if(!n)throw new Error(`Unknown network code: ${value}`);
  return networkSelection('focus',n.id);
}
