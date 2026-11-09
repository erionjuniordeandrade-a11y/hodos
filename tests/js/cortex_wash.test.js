import test from 'node:test';
import assert from 'node:assert/strict';
import {WASH_KINDS,NO_WASH,networkWash,arterialWash,washOf,washLayers,washFromSearch,washReadout} from '../../viewer/cortex_wash.js';
import {networkSelection} from '../../viewer/atlas_networks.js';
import {arterialSelection} from '../../viewer/atlas_arterial.js';

const ROWS=[{id:1,code:'ACA',name:'Anterior cerebral artery',rgb:[200,80,80]},{id:2,code:'MCA',name:'Middle cerebral artery',rgb:[80,200,80]}];

test('a Wash is one value: choosing one layer always turns the other off',()=>{
  for(const wash of [NO_WASH,networkWash(networkSelection('all')),networkWash(networkSelection('focus',7)),arterialWash(arterialSelection('focus',2,ROWS))]){
    assert.ok(WASH_KINDS.includes(wash.kind));
    const layers=washLayers(wash,ROWS);
    assert.ok(layers.network.mode==='off'||layers.arterial.mode==='off','never both layers on');
    assert.deepEqual(washOf(layers),wash,'the layers read back as the same Wash');
  }
  assert.equal(networkWash(networkSelection('off')),NO_WASH);assert.equal(arterialWash(arterialSelection('off')),NO_WASH);
});

test('the scene colour pass lets arterial win, and the Wash agrees',()=>{
  assert.equal(washOf({network:networkSelection('all'),arterial:arterialSelection('all')}).kind,'arterial');
  assert.equal(washOf({network:networkSelection('all'),arterial:arterialSelection('off')}).kind,'network');
  assert.equal(washOf({}).kind,'none');
});

test('the URL keys net and art read as one Wash; art is ignored when the arterial set is absent',()=>{
  assert.deepEqual(washFromSearch('?net=7&art=MCA',ROWS),{kind:'arterial',mode:'focus',focus:2});
  assert.deepEqual(washFromSearch('?net=7',ROWS),{kind:'network',mode:'focus',focus:7});
  assert.deepEqual(washFromSearch('?net=7&art=all',[]),{kind:'network',mode:'focus',focus:7});
  assert.equal(washFromSearch('?art=nonsense',ROWS),NO_WASH);
});

test('the chip and an empty picked panel always describe the Wash on screen, including none',()=>{
  const none=washReadout(NO_WASH,ROWS);
  assert.equal(none.chip,null);assert.deepEqual(none.picked,['Atlas parcel','No parcel selected','Select cortex to inspect its HCP-MMP1 label.']);
  const arterial=washReadout(arterialWash(arterialSelection('all')),ROWS);
  assert.match(arterial.chip,/Arterial territories/);assert.equal(arterial.picked[1],'Four supply territories');assert.match(arterial.swatch,/linear-gradient/);
  const focused=washReadout(arterialWash(arterialSelection('focus',2,ROWS)),ROWS);
  assert.match(focused.chip,/Middle cerebral artery/);assert.equal(focused.swatch,'rgb(80,200,80)');
  const network=washReadout(networkWash(networkSelection('all')),ROWS);
  assert.equal(network.chip,'Yeo-7 · all group networks');assert.equal(network.picked[1],'Seven cortical networks');
});
