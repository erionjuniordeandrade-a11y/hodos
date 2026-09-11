import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {anatomyCatalog,searchAnatomy,pathwayFamilies} from '../../viewer/atlas_catalog.js';
const read=name=>JSON.parse(readFileSync(new URL(`../../viewer/atlas/${name}.json`,import.meta.url)));
const label=id=>id.startsWith('AF_')?`Arcuate · ${id.endsWith('L')?'left':'right'}`:id;
const tracts=read('tracts');
const entries=anatomyCatalog(read('surface'),tracts,read('subcortex'),label,id=>id.startsWith('CST_')?'Cortico Spinal Tract':'');
test('one search finds installed cortical deep and tract identities without inventing names',()=>{
  assert.equal(searchAnatomy(entries,'V1')[0].code,'V1');
  for(const q of ['thalamus','hippocampus'])assert(searchAnatomy(entries,q).every(e=>e.kind==='Deep structures'));
  assert.equal(searchAnatomy(entries,'Arcuate').length,2);
  assert.equal(searchAnatomy(entries,'thalamus right').length,1);
  assert.equal(searchAnatomy(entries,'uninstalled nucleus').length,0);
  assert.equal(searchAnatomy(entries,'cortico spinal').length,2,'publisher wording remains searchable');
});
test('paired pathway rows retain every manifest identity exactly once',()=>{
  const families=pathwayFamilies(tracts.bundles,label);
  assert.deepEqual(families.flatMap(f=>f.bundles.map(b=>b.id)).sort(),tracts.bundles.map(b=>b.id).sort());
  assert.equal(families.find(f=>f.family==='AF').bundles.length,2);
  assert.equal(families.find(f=>f.family==='V').label,'V');
});
