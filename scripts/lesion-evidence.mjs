// Builds viewer/lesion_evidence.js, the provenance table behind the lesion lab.
// The lab's deficit statements are never written here: they stay in viewer/connections_data.js,
// the quoted white matter graph. For every Tract INJURY_CAUSES Deficit row this adds only what
// the sources themselves say: the teaching-deck slides the statement cites, the PMIDs those
// slides list (resolved at NCBI when this runs), the lesion side the sentence names, and whether
// it needs bilateral or dominant-side damage. Graph names are mapped to HCP1065 bundle families
// by name only; a structure with no atlas bundle is listed as unplaced, never approximated.
//
// node scripts/lesion-evidence.mjs --edges=<wm-kg-pilot edges.jsonl> --deck=<master_extract.json>
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CONNECTION_ROWS} from '../viewer/connections_data.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const arg=name=>process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3);
const edgesPath=arg('edges'),deckPath=arg('deck');
if(!edgesPath||!deckPath)throw Error('Pass --edges=<edges.jsonl> and --deck=<master_extract.json>');

// Graph subject → HCP1065 bundle families (atlas ids without the _L/_R suffix). `side` limits a
// name that carries its own side ("right FAT") to that hemisphere's bundle.
export const GRAPH_TO_ATLAS={
  'arcuate fasciculus':{families:['AF']},
  'right arcuate fasciculus':{families:['AF'],side:'R'},
  'SLF':{families:['SLF1','SLF2','SLF3']},
  'SLF-1':{families:['SLF1']},'SLF-2':{families:['SLF2']},'SLF-3':{families:['SLF3']},
  'IFOF':{families:['IFOF']},'ILF':{families:['ILF']},'VOF':{families:['VOF']},
  'FAT':{families:['FAT']},'right FAT':{families:['FAT'],side:'R'},
  'uncinate fasciculus':{families:['UF']},'extreme capsule':{families:['EMC']},
  'optic radiation':{families:['OR']},"Meyer's loop":{families:['OR']},
  'cingulum':{families:['C_FPH','C_FP','C_PHP','C_PH','C_PO']},
  'fornix':{families:['F']},'corpus callosum':{families:['CC']},
  'anterior thalamic peduncle':{families:['TR_A']},'posterior thalamic peduncle':{families:['TR_P']},
  'CST':{families:['CST']},'DRTT':{families:['DRTT']},
};
// Quoted structures without a single atlas bundle. Their statements are counted, not placed.
const UNPLACED=['sagittal stratum','temporal stem'];

// The graph's hemisphere tag is kept only where the sentence or its section heading names the
// lesion's side. These tags name something else, so the side is left unstated.
const SIDE_NOT_THE_LESION={
  'DRTT|ipsilateral deficit (right dentate lesion)':'names the dentate nucleus, not a cerebral hemisphere',
};
// These sentences name the side of space that is lost (a visual field, a hemispace). Vision and
// spatial attention are contralateral, so the lesion is in the opposite hemisphere; shown for the
// other side, the statement would pair a right field defect with a right hemisphere lesion.
const SIDE_OPPOSITE_SPACE={
  'IFOF|allocentric neglect':'R',
  'optic radiation|right inferior quadrantanopia':'L',
};
const SIDE_FROM_SUBJECT={'right FAT|negative motor responses / SMA syndrome / Foix-Chavany-Marie syndrome':'R'};
const CONDITION={
  'fornix|impaired new learning (bilateral)':'bilateral',
  'fornix|durable anterograde amnesia (bilateral)':'bilateral',
  'DRTT|cerebellar mutism':'bilateral',
  'uncinate fasciculus|proper-name anomia':'dominant',
};
// Sentences that place the injury at one part of the bundle. The lab tests whole bundles, so it
// cannot tell whether the sphere sits there; the page shows these words, quoted, and keeps the
// statement out of its headline list. Each value is a verbatim fragment of the quote.
const SITE={
  'DRTT|ipsilateral deficit (right dentate lesion)':['a right dentate lesion'],
  'DRTT|cerebellar mutism':['bilateral proximal injury to this outflow'],
  'DRTT|child mute on day 2':['a proximal injury'],
  "Meyer's loop|contralateral superior quadrantanopia":['standard anterior temporal lobectomies','Opening the temporal horn through its roof or lateral wall'],
  'optic radiation|visual field deficit':['A direct lateral approach to the atrium'],
  'optic radiation|visual field problem':['Lesions of the medial occipital lobe and the splenium'],
};

const edges=(await readFile(edgesPath,'utf8')).trim().split('\n').map(line=>JSON.parse(line));
const deckBytes=await readFile(deckPath);
const deck=JSON.parse(deckBytes);
const notesByMaster=new Map();
for(const slide of deck){
  const match=String(slide.notes||'').trim().match(/\[master (\d+)[^\]]*\]$/);
  if(match)notesByMaster.set(`m${match[1]}`,[...(notesByMaster.get(`m${match[1]}`)||[]),slide.notes]);
}
const slidePmids=id=>{
  const notes=(notesByMaster.get(id)||[]).join('\n');
  const sources=notes.includes('SOURCES')?notes.slice(notes.indexOf('SOURCES')):'';
  const ids=new Set();
  for(const [,list] of sources.matchAll(/PMIDs?[:\s]*((?:\d{6,9}(?:\s*,\s*)?)+)/g))for(const id of list.match(/\d{6,9}/g))ids.add(id);
  for(const [,id] of sources.matchAll(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d{6,9})/g))ids.add(id);
  return [...ids];
};

const used={side:new Set(),space:new Set(),added:new Set(),condition:new Set()},usedSites=new Set();
const claims=[];
for(const row of CONNECTION_ROWS.filter(r=>r[1]==='Tract'&&r[2]==='INJURY_CAUSES')){
  const [subject,,relation,object,,quote]=row;
  const matches=edges.filter(e=>e.subj===subject&&e.rel===relation&&e.obj===object&&e.quote===quote);
  if(matches.length!==1)throw Error(`Expected one upstream edge for ${subject} → ${object}, found ${matches.length}`);
  if(!(subject in GRAPH_TO_ATLAS)&&!UNPLACED.includes(subject))throw Error(`Unmapped graph subject: ${subject}`);
  const edge=matches[0],key=`${subject}|${object}`;
  const cites=(edge.cites||[]).filter(c=>/^m\d+$/.test(c));
  if(cites.length!==(edge.cites||[]).length)throw Error(`Non-slide citation on a shipped claim: ${key}`);
  const tag=edge.hemisphere==='left'?'L':edge.hemisphere==='right'?'R':null;
  let side=tag;
  if(key in SIDE_NOT_THE_LESION){side=null;used.side.add(key);}
  if(key in SIDE_OPPOSITE_SPACE){side=SIDE_OPPOSITE_SPACE[key];used.space.add(key);}
  if(key in SIDE_FROM_SUBJECT){side=SIDE_FROM_SUBJECT[key];used.added.add(key);}
  if(key in CONDITION)used.condition.add(key);
  let site=null;
  if(key in SITE){
    site=SITE[key].find(fragment=>quote.includes(fragment))??null;
    if(!site)throw Error(`No site fragment of ${key} is in its quote`);
    usedSites.add(site);
  }
  claims.push([subject,object,quote,cites,[...new Set(cites.flatMap(slidePmids))],side,CONDITION[key]||null,site]);
}
for(const [name,table] of [['side',SIDE_NOT_THE_LESION],['space',SIDE_OPPOSITE_SPACE],['added',SIDE_FROM_SUBJECT],['condition',CONDITION]])
  for(const key of Object.keys(table))if(!used[name].has(key))throw Error(`Stale ${name} override: ${key}`);
for(const fragment of Object.values(SITE).flat())if(!usedSites.has(fragment))throw Error(`Stale site fragment: ${fragment}`);

// Every PMID must resolve at NCBI; the citation is built from the record, never typed.
const pmids=[...new Set(claims.flatMap(c=>c[4]))].sort();
const records={};
if(pmids.length){
  const response=await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${pmids.join(',')}`);
  if(!response.ok)throw Error(`NCBI esummary failed: ${response.status}`);
  const result=(await response.json()).result;
  for(const id of pmids){
    const r=result[id];
    if(!r||r.error)throw Error(`PMID does not resolve at NCBI: ${id}`);
    const names=r.authors.filter(a=>a.authtype==='Author').map(a=>a.name);
    const authors=names.length>6?`${names.slice(0,6).join(', ')}, et al`:names.join(', ');
    const year=r.pubdate.match(/\d{4}/)[0];
    // NCBI sometimes folds the issue into the volume ("123 ( Pt 4)"); Vancouver writes 123(Pt 4).
    const tidy=value=>String(value||'').replace(/\s*\(\s*/g,'(').replace(/\s*\)/g,')').replace(/\s+/g,' ').trim();
    const locator=`${year};${tidy(r.volume)}${r.issue?`(${tidy(r.issue)})`:''}${r.pages?`:${r.pages}`:''}`;
    const title=r.title.replace(/\.$/,'');
    records[id]={citation:`${authors}. ${title}. ${r.source}. ${locator}.`,doi:r.articleids.find(a=>a.idtype==='doi')?.value||null};
  }
}

const git=(cwd,...args)=>execFileSync('git',['-C',cwd,...args],{encoding:'utf8'}).trim();
const graphCommit=git(path.dirname(edgesPath),'log','-1','--format=%h','--',path.basename(edgesPath));
const checked=new Date().toISOString().slice(0,10);
const q=value=>JSON.stringify(value);
const out=[
  `// Generated by scripts/lesion-evidence.mjs on ${checked}. Do not edit by hand; rerun the script.`,
  '// Provenance for the lesion lab. The statements themselves live in connections_data.js; each row',
  '// here is [subject, object, verbatim quote, cited deck slides, PMIDs those slides list, lesion side',
  '// the sentence names (L, R or null), condition the sentence names (bilateral, dominant or null),',
  '// the words of the quote that place the injury at one part of the bundle (or null)].',
  `export const EVIDENCE_SOURCES=${q({graph:`wm-kg-pilot edges.jsonl @ ${graphCommit}`,deck:`WM teaching series master deck notes (master_extract.json sha256 ${createHash('sha256').update(deckBytes).digest('hex').slice(0,12)})`,pmidsResolved:checked})};`,
  `export const GRAPH_TO_ATLAS=${q(GRAPH_TO_ATLAS)};`,
  `export const UNPLACED_SUBJECTS=${q(UNPLACED)};`,
  'export const CLAIM_PROVENANCE=[',
  ...claims.map(c=>`  ${q(c)},`),
  '];',
  'export const PMID_RECORDS={',
  ...Object.entries(records).map(([id,r])=>`  ${q(id)}:${q(r)},`),
  '};',
  '',
].join('\n');
await writeFile(path.join(root,'viewer/lesion_evidence.js'),out);
console.log(JSON.stringify({claims:claims.length,withPmid:claims.filter(c=>c[4].length).length,sided:claims.filter(c=>c[5]).length,pmids,graphCommit},null,1));
