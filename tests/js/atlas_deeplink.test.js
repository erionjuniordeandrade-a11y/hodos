import test from 'node:test';
import assert from 'node:assert/strict';
import {tractsToSearchValue,tractsFromSearch,cameraToSearchValue,cameraFromSearch} from '../../viewer/atlas_deeplink.js';
const known=['CST_L','CST_R','AF_L','OR_L','UF_R'];
test('tracts: empty selection writes nothing, picks keep order',()=>{
  assert.equal(tractsToSearchValue([]),null);assert.equal(tractsToSearchValue(undefined),null);
  assert.equal(tractsToSearchValue(['AF_L','CST_R']),'AF_L,CST_R');
});
test('tracts: round trip keeps pick order',()=>{
  assert.deepEqual(tractsFromSearch(tractsToSearchValue(['UF_R','CST_L','AF_L']),known,6),['UF_R','CST_L','AF_L']);
});
test('tracts: unknown ids, duplicates and garbage are dropped; cap applies',()=>{
  assert.deepEqual(tractsFromSearch('NOPE,,CST_L,CST_L,XX,AF_L',known,6),['CST_L','AF_L']);
  assert.deepEqual(tractsFromSearch('CST_L,CST_R,AF_L,OR_L',known,2),['CST_L','CST_R']);
  for(const g of ['',',,,','NOPE,,',null,undefined,42])assert.deepEqual(tractsFromSearch(g,known,6),[]);
});
test('camera: rounds position/target to 0.1 and up to 0.001',()=>{
  assert.equal(cameraToSearchValue({camera:[12.34,-56.78,300.04],target:[0.06,1,2],up:[0.00049,0.9996,0]}),'12.3,-56.8,300,0.1,1,2,0,1,0');
});
test('camera: negative zero is stripped',()=>{
  const v=cameraToSearchValue({camera:[-0.04,-0.001,5],target:[0,0,0],up:[-0.0002,1,-0]});
  assert.ok(!/-0(,|$)/.test(v),v);assert.equal(v,'0,0,5,0,0,0,0,1,0');
});
test('camera: round trip is stable',()=>{
  const c={camera:[120.5,-80.2,210.9],target:[0,-17.3,12],up:[0,0,1]},v=cameraToSearchValue(c);
  assert.deepEqual(cameraFromSearch(v),c);assert.equal(cameraToSearchValue(cameraFromSearch(v)),v);
});
test('camera: garbage and degenerate values are null',()=>{
  for(const g of [null,undefined,'','1,2,x','1,2,3,4,5,6,7,8','1,2,3,4,5,6,7,8,9,10','1,2,3,4,5,6,7,8,Infinity','1,2,3,4,5,6,,0,1',
    '1,2,3,4,5,6,0,0,0','5,5,5,5,5,5,0,0,1'])assert.equal(cameraFromSearch(g),null,String(g));
  assert.equal(cameraToSearchValue({camera:[NaN,0,0],target:[0,0,0],up:[0,0,1]}),null);assert.equal(cameraToSearchValue(null),null);
});
