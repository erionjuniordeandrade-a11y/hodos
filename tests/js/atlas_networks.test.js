import test from 'node:test';
import assert from 'node:assert/strict';
import {YEO7,networkById,networkByCode,networkLabel,paletteUnit,networkSelection,networkFromSearch,
  networkToSearchValue,networkFromScene,rgbCss} from '../../viewer/atlas_networks.js';

test('Yeo-7 table: seven networks, ids 1..7, unique codes, canonical colours',()=>{
  assert.equal(YEO7.length,7);
  assert.deepEqual(YEO7.map(n=>n.id),[1,2,3,4,5,6,7]);
  assert.equal(new Set(YEO7.map(n=>n.code)).size,7);
  assert.deepEqual(networkById(2).rgb,[70,130,180]);   // Somatomotor, Yeo 2011 colour table
  assert.deepEqual(networkById(7).rgb,[205,62,78]);    // Default mode
  assert.equal(new Set(YEO7.map(n=>rgbCss(n.rgb))).size,7);
});

test('labels carry the clinical alias the owner asked for (salience = Yeo-7 ventral attention)',()=>{
  assert.equal(networkLabel(4),'Ventral attention · salience');
  assert.equal(networkLabel(2),'Somatomotor · sensorimotor');
  assert.equal(networkLabel(7),'Default mode');
  assert.equal(networkByCode('dmn').id,7);
  assert.equal(networkById(9),null);
});

test('palette: index 0 is the neutral cortex blue, 1..7 the network colours in unit range',()=>{
  const p=paletteUnit();
  assert.deepEqual(p[0],[0.30,0.64,0.87]);
  assert.equal(p.length,8);
  for(const c of p.slice(1))for(const v of c)assert(v>=0&&v<=1);
});

test('selection + URL key round-trip; invalid input fails to off, never to an invented network',()=>{
  assert.deepEqual(networkSelection('focus',3),{mode:'focus',focus:3});
  assert.deepEqual(networkSelection('focus',42),{mode:'off',focus:null});
  assert.deepEqual(networkFromSearch('?net=2'),{mode:'focus',focus:2});
  assert.deepEqual(networkFromSearch('?net=DAN'),{mode:'focus',focus:3});
  assert.deepEqual(networkFromSearch('?net=all'),{mode:'all',focus:null});
  assert.deepEqual(networkFromSearch('?net=bogus'),{mode:'off',focus:null});
  assert.deepEqual(networkFromSearch(''),{mode:'off',focus:null});
  assert.equal(networkToSearchValue({mode:'off',focus:null}),null);
  assert.equal(networkToSearchValue({mode:'all',focus:null}),'all');
  assert.equal(networkToSearchValue({mode:'focus',focus:5}),'5');
});

test('scene grammar codes resolve; unknown code throws instead of guessing',()=>{
  assert.deepEqual(networkFromScene('VAN'),{mode:'focus',focus:4});
  assert.deepEqual(networkFromScene(null),{mode:'off',focus:null});
  assert.throws(()=>networkFromScene('SALIENCE'),/Unknown network code/);
});
