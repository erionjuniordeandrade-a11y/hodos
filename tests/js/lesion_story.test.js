import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {composeStory,TEMPLATES} from '../../viewer/lesion_story.js';
import {labBundles,namedDeficits,evidenceFor} from '../../viewer/lesion_model.js';
import {bundleLabel} from '../../viewer/atlas_glossary.js';

const root=fileURLToPath(new URL('../../',import.meta.url));
const tractMeta=JSON.parse(await readFile(path.join(root,'viewer/atlas/tracts.json'),'utf8'));
const groupOf=(hemi,id)=>labBundles(tractMeta,hemi).find(b=>b.id===id).group;
const shortName=id=>bundleLabel(id).replace(/ · (left|right)$/,'');
const row=(hemi,id,cut,total=10,margin=0)=>({id,group:groupOf(hemi,id),total,cut,margin});
const allSentences=[];   // collected across every story built below, for the dash/middle-dot sweep
const isFragment=text=>Object.values(TEMPLATES).some(t=>t.includes(text));
function build(args){
  const story=composeStory(args);
  allSentences.push(...story.sentences);
  return story;
}

test('TEMPLATES is frozen and the base sentence order is lead, top, next, sentence4, margin, ends',()=>{
  assert(Object.isFrozen(TEMPLATES));
  const rows=[row('L','AF_L',6),row('L','OR_L',3),row('L','CST_L',1)];
  const {sentences,runs}=build({rows,hemi:'L',radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20});
  assert.equal(sentences.length,5,sentences.join(' | ')); // lead, top, next, named, ends (no margin: off)
  assert(sentences[0].startsWith('A 10 mm sphere here cuts 3 bundles'));
  assert(sentences[1].startsWith('Most cut:'));
  assert(sentences[2].startsWith('Then '));
  assert.equal(sentences[4],TEMPLATES.ends);
  for(const r of runs)assert(['text','number','bundle','deficit','more'].includes(r.type)&&typeof r.text==='string'&&r.text.length>0);
});

test('every text run is a literal fragment of TEMPLATES',()=>{
  const rows=[row('L','ILF_L',9),row('L','MdLF_L',1)];
  const {runs}=build({rows,hemi:'L',radius:15,marginOn:true,margin:5,marginLines:4,totalLines:30});
  for(const r of runs.filter(r=>r.type==='text'))assert(isFragment(r.text),`"${r.text}" is not a fragment of any template`);
});

test('bundle run text derives from bundleLabel with the side suffix stripped',()=>{
  const rows=[row('L','AF_L',4),row('L','OR_L',2)];
  const {runs}=build({rows,hemi:'L',radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20});
  for(const r of runs.filter(r=>r.type==='bundle')){
    assert.equal(r.text.toLowerCase(),shortName(r.id).toLowerCase());
    assert(!/ · (left|right)$/.test(r.text));
  }
});

test('named: the list joins 1, 2, 3 and over-3 objects; deficit texts are a subset of namedDeficits',()=>{
  const cases=[['CST_L',1],['OR_L',2],['AF_L',3],['ILF_L',4]];
  for(const [id,count] of cases){
    const rows=[row('L',id,5)];
    const {runs,sentences}=build({rows,hemi:'L',radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20});
    const deficits=runs.filter(r=>r.type==='deficit'),mores=runs.filter(r=>r.type==='more');
    const wanted=namedDeficits(rows,'L').map(d=>d.object);
    assert.equal(wanted.length,count,`${id}: fixture assumption`);
    assert(deficits.every(d=>wanted.includes(d.text)),`${id}: deficit run ⊆ namedDeficits`);
    assert.equal(deficits.length,Math.min(count,3),id);
    assert.equal(mores.length,count>3?1:0,id);
    if(count>3)assert.equal(mores[0].text,`${count-3} more`);
    const named=sentences.find(s=>s.startsWith('The quoted notes name'));
    assert(named,`${id}: named sentence present`);
    if(count===1)assert(!named.includes(' and '));
    if(count===2)assert(named.includes(` and `)&&!named.includes(', '));
    if(count===3)assert.match(named,/, .+ and /);
  }
});

test('named deficits cover both hemispheres with real claims',()=>{
  for(const [hemi,id] of [['L','AF_L'],['L','FAT_L'],['R','SLF2_R'],['R','ILF_R']]){
    const rows=[row(hemi,id,5)];
    const {sentences}=build({rows,hemi,radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20});
    assert(sentences.some(s=>s.startsWith('The quoted notes name')),`${hemi} ${id}`);
  }
});

test('qualified: a DRTT-only sphere has applying claims that all fail headlines, so it is not noneQuoted',()=>{
  for(const [hemi,id] of [['L','DRTT_L'],['R','DRTT_R']]){
    assert.equal(namedDeficits([row(hemi,id,5)],hemi).length,0,`${id}: fixture assumption (headlines drops every DRTT claim)`);
    assert(evidenceFor(id,hemi).applying.length>0,`${id}: fixture assumption (DRTT has applying claims)`);
    const {sentences}=build({rows:[row(hemi,id,5)],hemi,radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20});
    assert(sentences.includes(TEMPLATES.qualified),`${hemi} ${id}: ${sentences.join(' | ')}`);
    assert(!sentences.some(s=>s.endsWith(': no quoted evidence.')),'the DRTT bundle itself has quoted evidence, so no topUnquoted addendum');
    assert(!sentences.includes(TEMPLATES.noneQuoted));
  }
});

test('otherSide: injected evidence with only other-side claims, hemi word matches the tested side',()=>{
  const otherSideOnly=()=>({applying:[],other:[{object:'fake other-side deficit',condition:null,site:null}]});
  for(const [hemi,word] of [['L','left'],['R','right']]){
    const rows=[row(hemi,hemi==='L'?'AF_L':'AF_R',5)];
    const {sentences}=build({rows,hemi,radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20,evidence:otherSideOnly});
    assert.equal(sentences.at(-2),`No quoted evidence for a ${word} hemisphere lesion of the bundles it cuts.`);
    assert(!sentences.some(s=>s.endsWith(': no quoted evidence.')),'otherSide never gets the topUnquoted addendum');
  }
});

test('noneQuoted: a bundle with no claim at all in either direction',()=>{
  const rows=[row('L','MdLF_L',5)];
  assert.equal(evidenceFor('MdLF_L','L').applying.length,0);
  assert.equal(evidenceFor('MdLF_L','L').other.length,0);
  const {sentences}=build({rows,hemi:'L',radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20});
  assert(sentences.includes(TEMPLATES.noneQuoted));
  assert(!sentences.some(s=>s.endsWith(': no quoted evidence.')));
});

test('topUnquoted: the top (most cut) bundle has zero claims while a lower-ranked cut bundle is named',()=>{
  // MdLF_L is the largest cut share (top) and has no claim in either direction; AF_L cuts less but is named.
  const rows=[row('L','MdLF_L',8),row('L','AF_L',2)];
  assert.equal(evidenceFor('MdLF_L','L').applying.length+evidenceFor('MdLF_L','L').other.length,0);
  const {sentences,runs}=build({rows,hemi:'L',radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20});
  assert(sentences.some(s=>s.startsWith('The quoted notes name')),'sentence 4 is named, driven by AF_L');
  const addendum=sentences.at(-2);
  assert.equal(addendum,`${shortName('MdLF_L')[0].toUpperCase()}${shortName('MdLF_L').slice(1)}: no quoted evidence.`);
  const lastBundleRun=[...runs].reverse().find(r=>r.type==='bundle');
  assert.equal(lastBundleRun.id,'MdLF_L');
  assert.equal(lastBundleRun.text[0],lastBundleRun.text[0].toUpperCase(),'the addendum bundle name is capitalised (sentence start)');
});

test('margin: on with no further reach, singular, plural, and off adds no margin sentence',()=>{
  const base={rows:[row('L','CST_L',5)],hemi:'L',radius:10,margin:5,totalLines:20};
  const none=build({...base,marginOn:true,marginLines:0});
  assert(none.sentences.includes('The 5 mm margin reaches no further streamline.'));
  const one=build({...base,marginOn:true,marginLines:1});
  assert(one.sentences.includes('The 5 mm margin reaches 1 more sampled streamline.'));
  const many=build({...base,marginOn:true,marginLines:7});
  assert(many.sentences.includes('The 5 mm margin reaches 7 more sampled streamlines.'));
  const off=build({...base,marginOn:false,marginLines:7});
  assert(!off.sentences.some(s=>s.includes('margin')),'margin sentence is absent when marginOn is false');
});

test('empty and emptyMargin replace the whole story when nothing is cut',()=>{
  const empty=build({rows:[row('L','AF_L',0)],hemi:'L',radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20});
  assert.deepEqual(empty.sentences,[TEMPLATES.empty]);
  const emptyMarginOne=build({rows:[row('L','AF_L',0)],hemi:'L',radius:10,marginOn:true,margin:5,marginLines:1,totalLines:20});
  assert.deepEqual(emptyMarginOne.sentences,['No sampled streamline passes through the sphere; 1 run within the 5 mm margin.']);
  const emptyMarginMany=build({rows:[row('L','AF_L',0)],hemi:'L',radius:10,marginOn:true,margin:5,marginLines:6,totalLines:20});
  assert.deepEqual(emptyMarginMany.sentences,['No sampled streamline passes through the sphere; 6 run within the 5 mm margin.']);
  const emptyIgnoresMarginOff=build({rows:[row('L','AF_L',0)],hemi:'L',radius:10,marginOn:false,margin:5,marginLines:6,totalLines:20});
  assert.deepEqual(emptyIgnoresMarginOff.sentences,[TEMPLATES.empty]);
});

test('lead: singular "1 bundle" vs plural "N bundles"',()=>{
  const single=build({rows:[row('L','CST_L',5)],hemi:'L',radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20});
  assert(single.sentences[0].includes(' 1 bundle and '),single.sentences[0]);
  const plural=build({rows:[row('L','CST_L',5),row('L','AF_L',5)],hemi:'L',radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20});
  assert(plural.sentences[0].includes(' 2 bundles and '),plural.sentences[0]);
});

test('sentences are interleaved with a space: runs re-join to exactly sentences.join(\' \')',()=>{
  const otherSideOnly=()=>({applying:[],other:[{object:'fake other-side deficit',condition:null,site:null}]});
  const cases=[
    ['empty',{rows:[row('L','AF_L',0)],hemi:'L',radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20}],
    ['emptyMargin one',{rows:[row('L','AF_L',0)],hemi:'L',radius:10,marginOn:true,margin:5,marginLines:1,totalLines:20}],
    ['emptyMargin many',{rows:[row('L','AF_L',0)],hemi:'L',radius:10,marginOn:true,margin:5,marginLines:6,totalLines:20}],
    ['named',{rows:[row('L','CST_L',5)],hemi:'L',radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20}],
    ['qualified',{rows:[row('L','DRTT_L',5)],hemi:'L',radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20}],
    ['otherSide',{rows:[row('L','AF_L',5)],hemi:'L',radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20,evidence:otherSideOnly}],
    ['noneQuoted',{rows:[row('L','MdLF_L',5)],hemi:'L',radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20}],
    ['topUnquoted',{rows:[row('L','MdLF_L',8),row('L','AF_L',2)],hemi:'L',radius:10,marginOn:false,margin:5,marginLines:0,totalLines:20}],
    ['margin none',{rows:[row('L','CST_L',5)],hemi:'L',radius:10,margin:5,totalLines:20,marginOn:true,marginLines:0}],
    ['margin singular',{rows:[row('L','CST_L',5)],hemi:'L',radius:10,margin:5,totalLines:20,marginOn:true,marginLines:1}],
    ['margin plural',{rows:[row('L','CST_L',5)],hemi:'L',radius:10,margin:5,totalLines:20,marginOn:true,marginLines:7}],
  ];
  for(const [label,args] of cases){
    const {runs,sentences}=build(args);
    assert.equal(runs.map(r=>r.text).join(''),sentences.join(' '),label);
  }
});

test('named list order matches namedDeficits(rows,hemi) on tie-heavy synthetic rows (non-alphabetical input, real evidence, both hemispheres)',()=>{
  const cases=[
    ['L',[row('L','ILF_L',220,220),row('L','CST_L',220,220),row('L','OR_L',220,220),row('L','AF_L',220,220),row('L','MdLF_L',50,220)]],
    ['R',[row('R','OR_R',220,220),row('R','SLF2_R',220,220),row('R','CST_R',220,220),row('R','ILF_R',220,220),row('R','AF_R',220,220),row('R','MdLF_R',50,220)]],
  ];
  for(const [hemi,rows] of cases){
    const named=namedDeficits(rows,hemi);
    assert(named.length>0,`${hemi}: fixture assumption (some claim is named)`);
    const {runs}=build({rows,hemi,radius:10,marginOn:false,margin:5,marginLines:0,totalLines:220});
    const deficits=runs.filter(r=>r.type==='deficit'),mores=runs.filter(r=>r.type==='more');
    assert.deepEqual(deficits.map(d=>d.text),named.slice(0,3).map(d=>d.object),hemi);
    assert.equal(mores.length,named.length>3?1:0,hemi);
    if(named.length>3)assert.equal(mores[0].text,`${named.length-3} more`,hemi);
  }
});

test('no dash and at most one middle dot per sentence, across every story built above',()=>{
  assert(allSentences.length>10);
  for(const sentence of allSentences){
    assert.doesNotMatch(sentence,/[–—]/,sentence);
    assert((sentence.match(/·/g)||[]).length<=1,sentence);
  }
});
