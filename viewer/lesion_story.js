// Lesion lab v2: the story composer (contract section 7, amended by the reviewer's section 7
// update). Pure and DOM-free: it takes the same per-bundle rows the evidence panel uses and
// returns runs the caller renders as DOM, plus plain-text sentences. Every prose fragment is a
// literal slice of TEMPLATES; the only free text on the page is a verbatim quote object from
// lesion_model.js's evidenceFor/namedDeficits.
//
// Reviewer correction (2026-09-27), applied here instead of the original section 7 text:
// DRTT_L and DRTT_R each have three applying claims, but every one carries a site or the
// bilateral condition, so headlines() drops all three and namedDeficits() is empty for a
// DRTT-only lesion. The old rules would then say "No quoted evidence for any bundle it cuts",
// which is false: there IS quoted evidence, it just only holds for a named site or a bilateral
// lesion. Sentence 4 is now the first match of named / qualified / otherSide / noneQuoted, and
// topUnquoted is a conditional addendum right after it, not a fifth alternative.
import {evidenceFor as defaultEvidenceFor, headlines} from './lesion_model.js';
import {bundleLabel} from './atlas_glossary.js';

// Every "text" run the composer emits is a literal fragment of one of these templates, split
// around its {slot} markers. Sentence case; no em or en dash; at most one middle dot per line
// (none of these need one).
export const TEMPLATES=Object.freeze({
  lead:'A {r} mm sphere here cuts {B} and {S} of {T} sampled streamlines.',
  top:'Most cut: {bundle1}, {c1} of {t1}.',
  next1:'Then {bundle2}.',
  next2:'Then {bundle2} and {bundle3}.',
  named:'The quoted notes name {list} for the bundles it cuts.',
  qualified:'The quoted notes for the bundles it cuts hold only for a named site or a bilateral lesion. They are listed under Quotes and sources.',
  otherSide:'No quoted evidence for a {hemi} hemisphere lesion of the bundles it cuts.',
  noneQuoted:'No quoted evidence for any bundle it cuts.',
  topUnquoted:'{bundle1}: no quoted evidence.',
  margin:'The {m} mm margin reaches {k} more sampled streamlines.',
  marginSingular:'The {m} mm margin reaches {k} more sampled streamline.',
  marginNone:'The {m} mm margin reaches no further streamline.',
  ends:'Lit ends mark where each cut streamline starts and stops.',
  empty:'No sampled streamline passes through the sphere here. Move it into the white matter.',
  emptyMargin:'No sampled streamline passes through the sphere; {k} run within the {m} mm margin.',
});

const fmt=n=>n.toLocaleString('en-US');
const numberRun=n=>({type:'number',text:fmt(n)});
const textRun=text=>({type:'text',text});
const bundleShortName=id=>bundleLabel(id).replace(/ · (left|right)$/,'');
const caseFirst=(text,capitalize)=>text?capitalize?text[0].toUpperCase()+text.slice(1):text[0].toLowerCase()+text.slice(1):text;
const bundleRun=(id,group,{capitalize=false}={})=>({type:'bundle',text:caseFirst(bundleShortName(id),capitalize),id,group});
const deficitRun=entry=>({type:'deficit',text:entry.object,id:entry.bundles[0]});
const moreRun=n=>({type:'more',text:`${n} more`});

// Splits a template on {slot} markers; each literal segment becomes its own text run (so every
// text run really is a fragment of TEMPLATES), and each slot is replaced by the run (or run
// array) supplied.
function fromTemplate(key,slots){
  const template=TEMPLATES[key];
  const runs=[];
  let last=0;
  for(const m of template.matchAll(/\{(\w+)\}/g)){
    if(m.index>last)runs.push(textRun(template.slice(last,m.index)));
    const slot=slots[m[1]];
    if(slot===undefined)throw new Error(`composeStory: missing slot {${m[1]}} for template "${key}"`);
    for(const r of Array.isArray(slot)?slot:[slot])runs.push(typeof r==='string'?textRun(r):r);
    last=m.index+m[0].length;
  }
  if(last<template.length)runs.push(textRun(template.slice(last)));
  return runs;
}

// "d1" | "d1 and d2" | "d1, d2 and d3" | "d1, d2, d3 and {N more}" (the trailing "and " is its
// own text run; the chip's own text is just "N more", not "and N more").
function namedListRuns(named){
  const d=named.map(deficitRun);
  if(d.length<=1)return d;
  if(d.length===2)return [d[0],textRun(' and '),d[1]];
  if(d.length===3)return [d[0],textRun(', '),d[1],textRun(' and '),d[2]];
  return [d[0],textRun(', '),d[1],textRun(', '),d[2],textRun(' and '),moreRun(named.length-3)];
}

// The same reduction as lesion_model.js's namedDeficits: rows.filter(cut>0), stable-sorted by
// cut/total ONLY (ties keep the caller's row order, no cut/id tie-break, unlike sortedCutRows
// below), driven by the injectable `evidence` function so a test can substitute a fake one
// without touching lesion_model.js. Takes the full `rows` (caller order), not sortedCutRows'
// tie-broken output, so a tie-heavy sphere names deficits in the same order the drawer does.
function computeNamed(rows,hemi,evidenceOf){
  const named=new Map();
  for(const row of rows.filter(r=>r.cut>0).sort((a,b)=>b.cut/b.total-a.cut/a.total)){
    for(const claim of evidenceOf(row.id).applying.filter(headlines)){
      const entry=named.get(claim.object);
      if(!entry)named.set(claim.object,{object:claim.object,condition:claim.condition,bundles:[row.id]});
      else{
        if(!entry.bundles.includes(row.id))entry.bundles.push(row.id);
        if(entry.condition!==claim.condition)entry.condition=null;
      }
    }
  }
  return [...named.values()];
}

// Interleaves a literal space between each sentence's runs, so consecutive sentences read as
// prose ("…streamlines. Most cut: …") instead of running together with no separator. Each
// sentence's own text is already the concatenation of its own runs (see push(), below), so this
// makes runs.map(r=>r.text).join('') exactly equal sentences.map(s=>s.text).join(' ').
function joinSentenceRuns(sentences){
  return sentences.flatMap((s,i)=>i===0?s.runs:[textRun(' '),...s.runs]);
}

// Largest cut/total first, then the larger cut, then the bundle id (the reviewer's explicit
// tie-break for "top", used for computeNamed's iteration order too so a deficit's first bundle
// is always the same bundle "top" would name).
function sortedCutRows(rows){
  return rows.filter(r=>r.cut>0).slice().sort((a,b)=>
    (b.cut/b.total-a.cut/a.total)||(b.cut-a.cut)||(a.id<b.id?-1:a.id>b.id?1:0));
}

/**
 * @param {object} args
 * @param {Array<{id:string,group:string,total:number,cut:number,margin:number}>} args.rows
 * @param {'L'|'R'} args.hemi
 * @param {number} args.radius
 * @param {boolean} args.marginOn
 * @param {number} args.margin
 * @param {number} args.marginLines
 * @param {number} args.totalLines
 * @param {(id:string,hemi:'L'|'R')=>{applying:object[],other:object[]}} [args.evidence] defaults to evidenceFor
 * @returns {{runs:object[],sentences:string[]}}
 */
export function composeStory({rows,hemi,radius,marginOn,margin,marginLines,totalLines,evidence=defaultEvidenceFor}){
  const cutRows=sortedCutRows(rows);
  const sentences=[];
  const push=(key,slots)=>{const runs=fromTemplate(key,slots);sentences.push({runs,text:runs.map(r=>r.text).join('')});};

  if(!cutRows.length){
    if(marginOn&&marginLines>0)push('emptyMargin',{k:numberRun(marginLines),m:numberRun(margin)});
    else push('empty',{});
    return {runs:joinSentenceRuns(sentences),sentences:sentences.map(s=>s.text)};
  }

  const cutLines=cutRows.reduce((n,r)=>n+r.cut,0);
  push('lead',{
    r:numberRun(radius),
    B:[numberRun(cutRows.length),textRun(cutRows.length===1?' bundle':' bundles')],
    S:numberRun(cutLines),
    T:numberRun(totalLines),
  });

  const top=cutRows[0];
  push('top',{bundle1:bundleRun(top.id,top.group),c1:numberRun(top.cut),t1:numberRun(top.total)});

  if(cutRows.length===2)push('next1',{bundle2:bundleRun(cutRows[1].id,cutRows[1].group)});
  else if(cutRows.length>=3)push('next2',{bundle2:bundleRun(cutRows[1].id,cutRows[1].group),bundle3:bundleRun(cutRows[2].id,cutRows[2].group)});

  const evidenceCache=new Map();
  const evidenceOf=id=>{
    if(!evidenceCache.has(id))evidenceCache.set(id,evidence(id,hemi));
    return evidenceCache.get(id);
  };
  const named=computeNamed(rows,hemi,evidenceOf);
  let anyApplying=false,anyOther=false;
  for(const row of cutRows){
    const e=evidenceOf(row.id);
    if(e.applying.length)anyApplying=true;
    if(e.other.length)anyOther=true;
  }

  let sentence4;
  if(named.length){sentence4='named';push('named',{list:namedListRuns(named)});}
  else if(anyApplying){sentence4='qualified';push('qualified',{});}
  else if(anyOther){sentence4='otherSide';push('otherSide',{hemi:hemi==='L'?'left':'right'});}
  else{sentence4='noneQuoted';push('noneQuoted',{});}

  if(sentence4==='named'||sentence4==='qualified'){
    const topEvidence=evidenceOf(top.id);
    if(!topEvidence.applying.length&&!topEvidence.other.length)push('topUnquoted',{bundle1:bundleRun(top.id,top.group,{capitalize:true})});
  }

  if(marginOn){
    if(marginLines>0)push(marginLines===1?'marginSingular':'margin',{m:numberRun(margin),k:numberRun(marginLines)});
    else push('marginNone',{m:numberRun(margin)});
  }

  push('ends',{});

  return {runs:joinSentenceRuns(sentences),sentences:sentences.map(s=>s.text)};
}
