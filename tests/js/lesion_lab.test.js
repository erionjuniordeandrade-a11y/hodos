import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildHodos} from '../../scripts/build-hodos.mjs';
import {CONNECTION_ROWS} from '../../viewer/connections_data.js';
import {CLAIM_PROVENANCE,PMID_RECORDS,GRAPH_TO_ATLAS,UNPLACED_SUBJECTS} from '../../viewer/lesion_evidence.js';
import {labBundles,packStreamlines,segmentDistance2,classify,summarize,bundleAnchor,clampCentre,parseLabParams,
  claimsFor,evidenceFor,headlines,namedDeficits,familyOf,EVIDENCE_GAPS,CLAIMS,CLAIMS_WITH_PMID,UNPLACED_CLAIMS,
  SPARED,MARGIN,CUT,RADIUS,MARGIN_MM} from '../../viewer/lesion_model.js';

const root=fileURLToPath(new URL('../../',import.meta.url));
const tractMeta=JSON.parse(await readFile(path.join(root,'viewer/atlas/tracts.json'),'utf8'));
const page=await readFile(path.join(root,'viewer/labs/lesion-lab.html'),'utf8');
const INJURY=CONNECTION_ROWS.filter(r=>r[1]==='Tract'&&r[2]==='INJURY_CAUSES');

test('every lab statement is a verbatim INJURY_CAUSES row of the quoted graph, and every graph row is traced',()=>{
  assert.deepEqual(EVIDENCE_GAPS,[]);
  assert.equal(CLAIMS.length,INJURY.length);
  for(const claim of CLAIMS)
    assert(INJURY.some(r=>r[0]===claim.subject&&r[3]===claim.object&&r[5]===claim.quote&&r[6]===claim.section),`${claim.subject} → ${claim.object}`);
  const keys=CLAIM_PROVENANCE.map(p=>JSON.stringify(p.slice(0,3)));
  assert.equal(new Set(keys).size,keys.length,'each statement is traced once');
});

test('PMIDs come only from the cited slides and each has a Vancouver record with a DOI',()=>{
  for(const claim of CLAIMS){
    if(claim.pmids.length)assert(claim.cites.length,`${claim.subject}: a PMID needs a cited slide`);
    for(const pmid of claim.pmids){
      assert.match(pmid,/^\d{6,9}$/);
      const record=PMID_RECORDS[pmid];
      assert(record,`PMID ${pmid} has a record`);
      assert.match(record.citation,/\. \d{4};/,`PMID ${pmid}: Vancouver journal, year;`);
      assert.match(record.doi,/^10\.\d{4,9}\//);
    }
  }
  assert.equal(CLAIMS_WITH_PMID,CLAIMS.filter(c=>c.pmids.length).length);
  assert.deepEqual(Object.keys(PMID_RECORDS).sort(),[...new Set(CLAIMS.flatMap(c=>c.pmids))].sort(),'no unused PMID record');
});

test('graph subjects map only to bundle families the atlas ships; unmapped subjects are declared',()=>{
  const families=new Set(tractMeta.bundles.map(b=>familyOf(b.id)));
  for(const [subject,mapping] of Object.entries(GRAPH_TO_ATLAS)){
    assert(mapping.families.length,subject);
    for(const family of mapping.families)assert(families.has(family),`${subject} → ${family}`);
    if(mapping.side)assert.match(mapping.side,/^[LR]$/);
  }
  for(const claim of CLAIMS)assert(claim.placed||UNPLACED_SUBJECTS.includes(claim.subject),`${claim.subject} is placed or declared unplaced`);
  assert.equal(UNPLACED_CLAIMS,CLAIMS.filter(c=>!c.placed).length);
});

test('side, condition and site annotations are read from the quote, never added to it',()=>{
  for(const claim of CLAIMS){
    if(claim.site)assert(claim.quote.includes(claim.site),`site "${claim.site}" is words of its quote`);
    assert([null,'bilateral','dominant'].includes(claim.condition));
    assert([null,'L','R'].includes(claim.side));
  }
  // A named side of space or of the visual field belongs to the opposite hemisphere.
  const find=(subject,object)=>CLAIMS.find(c=>c.subject===subject&&c.object===object);
  assert.equal(find('IFOF','allocentric neglect').side,'R');
  assert.equal(find('optic radiation','right inferior quadrantanopia').side,'L');
  assert.equal(find('SLF','neglect').side,'R');
  assert.equal(find('uncinate fasciculus','proper-name anomia').condition,'dominant');
});

test('evidence per bundle: side-specific statements apply to one hemisphere and none is shown twice',()=>{
  for(const hemi of ['L','R']){
    const bundles=labBundles(tractMeta,hemi);
    assert.equal(bundles.length,36);
    assert(bundles.every(b=>b.id.endsWith(`_${hemi}`)||b.group==='Commissural'));
    for(const bundle of bundles){
      const {applying,other}=evidenceFor(bundle.id,hemi),quotes=[...applying,...other].map(c=>c.quote);
      assert.equal(new Set(quotes).size,quotes.length,`${bundle.id}: no quote twice`);
      for(const claim of applying)assert(!claim.side||claim.side===hemi,`${bundle.id}: ${claim.object}`);
      for(const claim of other)assert(claim.side&&claim.side!==hemi);
      for(const claim of [...applying,...other])assert(claim.families.includes(familyOf(bundle.id)));
    }
  }
  const neglectL=claimsFor('SLF2_L','L').filter(c=>c.object==='neglect'),neglectR=claimsFor('SLF2_R','R').filter(c=>c.object==='neglect');
  assert(neglectL.length&&neglectL.every(c=>!c.applies));
  assert(neglectR.length&&neglectR.every(c=>c.applies));
  // Bundles with no statement in the graph stay empty: the page then says "No quoted evidence".
  const unquoted=['MdLF','PAT','AR','CBT','CPT_F','CPT_O','CPT_P','CS_A','CS_P','CS_S','ML','RST','TR_S'];
  for(const hemi of ['L','R'])
    assert.deepEqual(labBundles(tractMeta,hemi).filter(b=>!claimsFor(b.id,hemi).length).map(b=>b.id).sort(),
      ['AC',...unquoted.map(f=>`${f}_${hemi}`)].sort(),`${hemi}: bundles without a quoted statement`);
});

test('named deficits leave out bilateral, site-bound and other-side statements',()=>{
  const bundles=labBundles(tractMeta,'L'),rows=bundles.map(b=>({id:b.id,group:b.group,total:10,cut:5,margin:0}));
  const named=namedDeficits(rows,'L'),objects=new Set(named.map(n=>n.object));
  const headlined=new Set(bundles.flatMap(b=>evidenceFor(b.id,'L').applying.filter(headlines).map(c=>c.object)));
  assert.deepEqual(objects,headlined);
  assert(!objects.has('neglect'),'right-hemisphere neglect is not named for a left lesion');
  for(const claim of CLAIMS.filter(c=>c.condition==='bilateral'||c.site))assert(!headlines({...claim,applies:true}));
  assert.equal(new Set(named.map(n=>n.object)).size,named.length);
  assert.deepEqual(namedDeficits(rows.map(r=>({...r,cut:0,margin:4})),'L'),[],'margin-only bundles name nothing');
});

// Two straight streamlines along x (y = 0 and y = 10) in one bundle, one along z in another.
const straight=(from,to,n=11)=>Array.from({length:n},(_,i)=>from.map((v,axis)=>v+(to[axis]-v)*i/(n-1)));
const pack=packStreamlines([
  {id:'A_L',group:'Association',lines:[straight([-50,0,0],[50,0,0]),straight([-50,10,0],[50,10,0])]},
  {id:'P_L',group:'Projection',lines:[straight([30,-5,-40],[30,-5,40])]},
]);

test('segment distance and the cut / margin / spared test',()=>{
  assert.equal(segmentDistance2(0,0,0,10,0,0,5,3,0),9);
  assert.equal(segmentDistance2(0,0,0,10,0,0,-4,3,0),25,'beyond an end the distance is to that end');
  assert.equal(segmentDistance2(1,1,1,1,1,1,1,1,4),9,'a zero-length segment is a point');
  assert.equal(pack.count,3);
  assert.deepEqual(pack.extent,[[-50,-5,-40],[50,10,40]]);
  const state=new Uint8Array(pack.count);
  assert.equal(classify(pack,{centre:[0,2,0],radius:3},state),1);
  assert.deepEqual([...state],[CUT,SPARED,SPARED]);
  assert.equal(classify(pack,{centre:[0,2,0],radius:3,margin:6},state),1);
  assert.deepEqual([...state],[CUT,MARGIN,SPARED]);
  assert.equal(classify(pack,{centre:[0,2,0],radius:3,margin:6},state),0,'an unchanged test reports no change');
  // Samples sit every 8 mm along z; a 1 mm sphere at z = 4 touches no sample point, only the segment.
  classify(pack,{centre:[30,-5,4],radius:1},state);
  assert.deepEqual([...state],[SPARED,SPARED,CUT],'a sphere between sample points still cuts the segment through it');
  assert.deepEqual(summarize(pack,state),[{id:'A_L',group:'Association',total:2,cut:0,margin:0},{id:'P_L',group:'Projection',total:1,cut:1,margin:0}]);
  const larger=new Uint8Array(pack.count),smaller=new Uint8Array(pack.count);
  classify(pack,{centre:[0,4,0],radius:4},smaller);classify(pack,{centre:[0,4,0],radius:7},larger);
  for(let s=0;s<pack.count;s++)assert(larger[s]>=smaller[s],'a larger sphere keeps every cut');
});

test('bundle anchors are real sample points; centres stay in the chosen hemisphere and the sample',()=>{
  const anchor=bundleAnchor(pack,0);
  assert([...Array(pack.points.length/3).keys()].some(i=>[0,1,2].every(a=>Math.abs(pack.points[i*3+a]-anchor[a])<.05)));
  assert.deepEqual(bundleAnchor(pack,1),[30,-5,0]);
  assert.deepEqual(clampCentre([20,3,100],'L',pack.extent),[0,3,40]);
  assert.deepEqual(clampCentre([-20,3,0],'R',pack.extent),[0,3,0]);
  assert.deepEqual(clampCentre([-12.345,NaN,-99],'L',pack.extent),[-12.3,0,-40]);
});

test('lab links restore allowed values and discard malformed ones',()=>{
  assert.deepEqual(parseLabParams('?hemi=R&x=12.5&y=-30&z=20&r=15&margin=8'),{hemi:'R',centre:[12.5,-30,20],radius:15,marginOn:true,margin:8});
  assert.deepEqual(parseLabParams(''),{hemi:'L',centre:null,radius:RADIUS.initial,marginOn:false,margin:MARGIN_MM.initial});
  assert.deepEqual(parseLabParams('?hemi=X&x=1&y=2&r=&margin=abc'),{hemi:'L',centre:null,radius:RADIUS.initial,marginOn:false,margin:MARGIN_MM.initial});
  assert.deepEqual(parseLabParams('?x=1&y=2&z=Infinity&r=999&margin=0'),{hemi:'L',centre:null,radius:RADIUS.max,marginOn:true,margin:MARGIN_MM.min});
  assert.equal(parseLabParams('?r=2').radius,RADIUS.min);
});

test('the page states its scope, sample sizes that match the atlas, and follows the site CSP',async()=>{
  assert(page.includes('<p class="lab-foot-scope">Group reference, not this patient.</p>'));
  assert(page.includes('Educational draft awaiting independent clinical review'));
  const af=tractMeta.bundles.find(b=>b.id==='AF_L'),sampled=Math.max(...labBundles(tractMeta,'L').concat(labBundles(tractMeta,'R')).map(b=>b.lines));
  assert(page.includes(`(${af.streamlines_in_atlas.toLocaleString('en-US')} in the left arcuate fasciculus)`));
  assert(page.includes(`at most ${sampled} streamlines`));
  assert.doesNotMatch(page,/\sstyle=|<style[ >]/);
  for(const file of ['viewer/labs/lesion-lab.html','viewer/lesion_lab.js','viewer/lesion-lab.css','viewer/lesion_model.js']){
    const text=file.endsWith('.html')?page:await readFile(path.join(root,file),'utf8');
    assert.doesNotMatch(text,/[–—]/,`${file}: no en or em dash`);
  }
  const atlas=await readFile(path.join(root,'viewer/atlas.html'),'utf8'),importMap=/<script type="importmap">[^<]*<\/script>/;
  assert.equal(page.match(importMap)[0],atlas.match(importMap)[0]);
});

test('the export publishes the lab with keyed assets and the atlas import map',async t=>{
  const temp=await mkdtemp(path.join(os.tmpdir(),'hodos-lesion-lab-'));
  t.after(()=>rm(temp,{recursive:true,force:true}));
  const out=path.join(temp,'site');
  await buildHodos({root,out});
  const html=await readFile(path.join(out,'labs/lesion-lab.html'),'utf8'),headers=await readFile(path.join(out,'_headers'),'utf8');
  assert.match(html,/href="\.\/lesion-lab\.css\?v=[0-9a-f]{12}"/);
  assert.match(html,/<base href="\/">/);
  for(const file of ['lesion_lab.js','lesion_model.js','lesion_evidence.js','lesion-lab.css','atlas_scene.js'])assert(existsSync(path.join(out,file)),file);
  assert.equal((headers.match(/sha256-/g)||[]).length,1,'one import map hash serves every page');
  assert(!existsSync(path.join(out,'handoff')));
});
