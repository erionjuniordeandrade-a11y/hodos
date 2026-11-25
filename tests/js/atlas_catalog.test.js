import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {anatomyCatalog,searchAnatomy,pathwayFamilies} from '../../viewer/atlas_catalog.js';
import {PARCEL_NAMES,parcelDisplayName,parcelSearchTerms} from '../../viewer/atlas_parcel_names.js';
import {YEO7} from '../../viewer/atlas_networks.js';
import {arterialTable} from '../../viewer/atlas_arterial.js';
const read=name=>JSON.parse(readFileSync(new URL(`../../viewer/atlas/${name}.json`,import.meta.url)));
const label=id=>id.startsWith('AF_')?`Arcuate · ${id.endsWith('L')?'left':'right'}`:id;
const surface=read('surface');
const tracts=read('tracts');
const subcortex=read('subcortex');
const entries=anatomyCatalog(surface,tracts,subcortex,label,id=>id.startsWith('CST_')?'Cortico Spinal Tract':'');
test('one search finds installed cortical deep and tract identities without inventing names',()=>{
  assert.equal(searchAnatomy(entries,'V1')[0].code,'V1');
  assert(searchAnatomy(entries,'thalamus').every(e=>e.kind==='Deep structures'));
  const hippo=searchAnatomy(entries,'hippocampus');
  assert(hippo.some(e=>e.kind==='Deep structures'));
  assert.deepEqual([...new Set(hippo.filter(e=>e.kind==='Cortical parcels').map(e=>e.code))].sort(),['H','PreS']);
  assert(hippo.every(e=>e.kind==='Deep structures'||e.kind==='Cortical parcels'));
  assert.equal(searchAnatomy(entries,'Arcuate').length,2);
  assert.equal(searchAnatomy(entries,'thalamus right').length,1);
  assert.equal(searchAnatomy(entries,'uninstalled nucleus').length,0);
  assert.equal(searchAnatomy(entries,'cortico spinal').length,2,'publisher wording remains searchable');
});
test('parcel names map high-yield codes present in surface.json and return empty strings safely',()=>{
  for(const hemi of ['L','R']){
    const codes=new Set(Object.entries(surface.sets.glasser.regions[hemi]).filter(([id])=>Number(id)!==0).map(([,raw])=>raw.replace(/^[LR]_/, '').replace(/_ROI$/, '')));
    for(const code of Object.keys(PARCEL_NAMES))assert(codes.has(code),`${code} must exist in ${hemi} hemisphere of surface.json`);
  }
  assert.equal(parcelDisplayName('44'),"Broca's area, pars opercularis");
  assert.equal(parcelDisplayName('nonexistent'),'');
  assert.equal(parcelDisplayName('toString'),'');
  assert.match(parcelSearchTerms('44'),/\bBroca\b/);
  assert.equal(parcelSearchTerms('nonexistent'),'');
  assert.equal(parcelSearchTerms('toString'),'');
});
test('expanded anatomyCatalog indexes networks and arterial territories while preserving backward compatibility',()=>{
  assert.equal(entries.some(e=>e.kind==='Resting-state networks'||e.kind==='Arterial territories'),false);
  assert.equal(searchAnatomy(entries,'default mode').length,0);
  assert.equal(searchAnatomy(entries,'MCA').length,0);
  const expanded=anatomyCatalog(surface,tracts,subcortex,label,id=>id.startsWith('CST_')?'Cortico Spinal Tract':'',{networks:YEO7,arterial:arterialTable(surface)});
  const broca=searchAnatomy(expanded,'Broca');
  assert(broca.length>=4&&broca.every(e=>e.kind==='Cortical parcels'));
  assert.deepEqual([...new Set(broca.map(e=>e.code))].sort(),['44','45']);
  const area44=searchAnatomy(expanded,'44');
  assert.equal(area44.length,2);
  assert(area44.every(e=>e.kind==='Cortical parcels'&&e.code==='44'));
  const mca=searchAnatomy(expanded,'MCA');
  assert.equal(mca.length,1);
  assert.equal(mca[0].kind,'Arterial territories');
  assert.equal(mca[0].code,'MCA');
  const dmn=searchAnatomy(expanded,'default mode');
  assert.equal(dmn.length,1);
  assert.equal(dmn[0].kind,'Resting-state networks');
  assert.equal(dmn[0].code,'DMN');
  const arcuate=searchAnatomy(expanded,'arcuate');
  assert.equal(arcuate.length,2);
  assert(arcuate.every(e=>e.kind==='White matter tracts'));
  assert.deepEqual(arcuate.map(e=>e.code).sort(),['AF_L','AF_R']);
});
test('paired pathway rows retain every manifest identity exactly once',()=>{
  const families=pathwayFamilies(tracts.bundles,label);
  assert.deepEqual(families.flatMap(f=>f.bundles.map(b=>b.id)).sort(),tracts.bundles.map(b=>b.id).sort());
  assert.equal(families.find(f=>f.family==='AF').bundles.length,2);
  assert.equal(families.find(f=>f.family==='V').label,'V');
});
