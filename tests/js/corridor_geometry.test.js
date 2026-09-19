import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCorridor} from '../../viewer/corridor_geometry.js';

const corridor=overrides=>({
  id:'A',
  label:'Illustrative corridor A',
  color:0x7ec8e3,
  start:[1,2,3],
  end:[4,6,15],
  radiusMm:3,
  ...overrides,
});

test('normalizes explicit endpoints into midpoint, unit direction, length, and radius',()=>{
  const normalized=normalizeCorridor(corridor());
  assert.deepEqual(normalized.start,[1,2,3]);
  assert.deepEqual(normalized.end,[4,6,15]);
  assert.deepEqual(normalized.center,[2.5,4,9]);
  assert.equal(normalized.lengthMm,13);
  assert.deepEqual(normalized.direction,[3/13,4/13,12/13]);
  assert.equal(normalized.radiusMm,3);
});

test('a width change retains the authored axis and endpoints',()=>{
  const narrow=normalizeCorridor(corridor({radiusMm:2}));
  const wide=normalizeCorridor(corridor({radiusMm:8}));
  assert.equal(narrow.radiusMm,2);
  assert.equal(wide.radiusMm,8);
  assert.deepEqual(wide.start,narrow.start);
  assert.deepEqual(wide.end,narrow.end);
  assert.deepEqual(wide.center,narrow.center);
  assert.deepEqual(wide.direction,narrow.direction);
  assert.equal(wide.lengthMm,narrow.lengthMm);
});

test('rejects malformed coordinates, radius, identifiers, color, and a zero-length axis',()=>{
  const invalid=[
    corridor({start:[NaN,2,3]}),
    corridor({start:['1',2,3]}),
    corridor({end:[4,Infinity,15]}),
    corridor({start:[1,2]}),
    corridor({end:[251,6,15]}),
    corridor({end:[1,2,3]}),
    corridor({radiusMm:0}),
    corridor({radiusMm:-1}),
    corridor({radiusMm:20.01}),
    corridor({radiusMm:Infinity}),
    corridor({id:'   '}),
    corridor({label:new String('not a primitive')}),
    corridor({color:-1}),
    corridor({color:0x1000000}),
    corridor({color:0x7ec8e3 + .5}),
  ];
  for(const spec of invalid)assert.throws(()=>normalizeCorridor(spec));
});

test('does not mutate or retain the caller endpoint arrays',()=>{
  const input=Object.freeze({
    id:'B',label:'Illustrative corridor B',color:0xffa36c,
    start:Object.freeze([-20,10,30]),end:Object.freeze([20,10,30]),radiusMm:4,
  });
  const normalized=normalizeCorridor(input);
  assert.deepEqual(input.start,[-20,10,30]);
  assert.deepEqual(input.end,[20,10,30]);
  assert.notStrictEqual(normalized.start,input.start);
  assert.notStrictEqual(normalized.end,input.end);
  normalized.start[0]=99;
  normalized.center[0]=99;
  normalized.direction[0]=99;
  assert.deepEqual(input.start,[-20,10,30]);
  assert.deepEqual(input.end,[20,10,30]);
});
