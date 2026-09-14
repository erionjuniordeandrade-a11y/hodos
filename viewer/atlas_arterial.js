// Arterial territories on the reference cortex (Liu CF, Hsu J, Xu X, Kim G, et al.
// Digital 3D Brain MRI Arterial Territories Atlas. Sci Data 2023;10:74.
// PMID 36739282 — esummary-verified 2026-09-14). CC BY-SA 4.0.
// Pure contracts: set name, canonical colours, URL key, selection state. No DOM, no three.js.
//
// Honesty: this is a GROUP template of supply territories in MNI space, sampled per
// vertex on the fs_LR 32k surface by nearest labelled voxel. A territory here is a
// population expectation of vascular supply; it is not an angiogram, it does not show
// perforators, variants, collaterals or borderzone physiology, and it is never
// registered to a case in this viewer.

export const ARTERIAL_SET='arterial2';

/** Canonical colours by territory code (level 2 of the atlas: four supply domains). */
const RGB=Object.freeze({ACA:[233,196,106],MCA:[214,93,77],PCA:[98,132,196],VB:[121,168,120]});
const FALLBACK=[[160,160,160],[233,196,106],[214,93,77],[98,132,196],[121,168,120],[190,120,190]];
const NAMES=Object.freeze({ACA:'Anterior cerebral',MCA:'Middle cerebral',PCA:'Posterior cerebral',VB:'Vertebrobasilar'});

/** Territory table from the installed surface.json set: [{id,code,name,rgb}], id order of the L table.
 * Throws if the two hemisphere tables disagree, so a mismatched build cannot render silently. */
export function arterialTable(surfaceMeta){
  const set=surfaceMeta?.sets?.[ARTERIAL_SET];if(!set)return [];
  const L=set.regions?.L||{},R=set.regions?.R||{};
  const rows=Object.entries(L).map(([id,raw])=>[Number(id),String(raw)]).filter(([id])=>id>0).sort((a,b)=>a[0]-b[0]);
  for(const [id,raw] of rows)if(String(R[id])!==raw)throw new Error(`Arterial tables differ at id ${id}`);
  return rows.map(([id,raw])=>{const code=raw.replace(/_ROI$/,'').toUpperCase();
    return Object.freeze({id,code,name:NAMES[code]||raw,rgb:RGB[code]||FALLBACK[id]||FALLBACK[0]});});
}

export const ARTERIAL_MODES=Object.freeze(['off','all','focus']);

/** Per-vertex colour table indexed by label id (0 = unlabelled → neutral cortex blue). */
export function arterialPaletteUnit(table){
  const t=[[0.30,0.64,0.87]];
  for(const r of table)t[r.id]=r.rgb.map(v=>v/255);
  return t;
}

/** Selection state: {mode:'off'|'all'|'focus', focus:id|null}. */
export function arterialSelection(mode,focus=null,table=[]){
  if(mode==='focus'){const r=table.find(r=>r.id===Number(focus));return r?{mode:'focus',focus:r.id}:{mode:'off',focus:null};}
  return {mode:mode==='all'?'all':'off',focus:null};
}

/** URL key `art`: absent/off → off, 'all' → all, an id or a code → focus. */
export function arterialFromSearch(search,table){
  const v=new URLSearchParams(String(search||'').replace(/^\?/,'')).get('art');
  if(!v||v==='off')return arterialSelection('off');
  if(v==='all')return arterialSelection('all');
  const r=table.find(r=>String(r.id)===v||r.code===v.toUpperCase());
  return r?arterialSelection('focus',r.id,table):arterialSelection('off');
}
export function arterialToSearchValue(sel,table){
  if(!sel||sel.mode==='off')return null;
  if(sel.mode==='all')return 'all';
  return table.find(r=>r.id===sel.focus)?.code||null;
}
export function arterialLabel(table,id){const r=table.find(r=>r.id===Number(id));return r?`${r.name} · ${r.code}`:'';}
export const ARTERIAL_NOTE='Group supply-territory template (Liu et al. 2023). Not an angiogram; perforators, variants and borderzones are not shown.';
