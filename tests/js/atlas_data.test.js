import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {decodeAtlasLabels,regionIdentity,decodeAtlasBundle,atlasSelectionFromSearch} from '../../viewer/atlas_data.js';
const root=new URL('../../viewer/atlas/',import.meta.url);
const json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const bytes=async p=>{const b=await readFile(new URL(p,root));return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);};
const assertCstLaterality=(points,side)=>{
  // MNI x is positive right. Point-weighted distribution of the installed,
  // equally sampled paths: a side check, not cross-atlas registration proof.
  const distance=points.map(p=>p[0]*(side==='L'?-1:1)).sort((a,b)=>a-b);
  assert(distance.length&&distance.every(Number.isFinite),'finite CST coordinates');
  const centroid=distance.reduce((a,b)=>a+b,0)/distance.length;
  const p10=distance[Math.floor((distance.length-1)*.1)];
  assert(centroid>8,`${side} CST centroid must be >8 mm into its hemisphere, got ${centroid}`);
  assert(p10>2,`${side} CST must have at least 90% of sampled points >2 mm into its hemisphere, got ${p10}`);
};
test('CST laterality rejects midline, near-midline bilateral and mixed-side geometry',()=>{
  const points=xs=>xs.map(x=>[x,0,0]);
  assert.throws(()=>assertCstLaterality(points(Array(100).fill(0)),'L'));
  assert.throws(()=>assertCstLaterality(points([...Array(50).fill(-3),...Array(50).fill(3)]),'L'));
  assert.throws(()=>assertCstLaterality(points([...Array(50).fill(-40),...Array(50).fill(3)]),'L'));
  assert.throws(()=>assertCstLaterality(points([...Array(99).fill(20),0]),'L'));
  assert.throws(()=>assertCstLaterality(points([...Array(99).fill(-20),0]),'R'));
  assert.doesNotThrow(()=>assertCstLaterality(points([...Array(99).fill(-20),0]),'L'));
  assert.doesNotThrow(()=>assertCstLaterality(points([...Array(99).fill(20),0]),'R'));
});
test('public atlas assets match the pinned manifest bytes',async()=>{
  const m=await json('manifest.json');
  for(const a of m.assets)assert.equal(createHash('sha256').update(await readFile(new URL(a.path,root))).digest('hex'),a.sha256,a.path);
});
test('cortical labels preserve hemisphere-specific identities and reject a mismatched mesh',async()=>{
  const m=await json('surface.json'),b=await bytes('surface-labels.bin');
  const labels=decodeAtlasLabels(m,b,[32492,32492]);
  assert.equal(labels.L.length,32492);assert(labels.L.includes(8));assert(labels.R.includes(8));
  assert.equal(regionIdentity(m,'L',8).raw,'L_4_ROI');assert.equal(regionIdentity(m,'R',8).raw,'R_4_ROI');
  assert.throws(()=>decodeAtlasLabels(m,b,[32491,32493]));
  assert.throws(()=>decodeAtlasLabels(m,b.slice(0,-2),[32492,32492]));
});
test('Yeo-7 network labels ride the same vertex order and decode from their own offset',async()=>{
  const m=await json('surface.json'),b=await bytes('surface-labels.bin');
  const net=decodeAtlasLabels(m,b,[32492,32492],'yeo7');
  assert.equal(net.L.length,32492);assert.equal(net.R.length,32492);
  for(const h of ['L','R']){const ids=new Set(net[h]);assert.deepEqual([...ids].sort((a,b)=>a-b),[0,1,2,3,4,5,6,7],h);}
  assert.equal(m.sets.yeo7.offset,0);assert.equal(m.sets.glasser.offset,259936);
  // the two sets are different labelings of the same vertices, not copies
  const gl=decodeAtlasLabels(m,b,[32492,32492],'glasser');assert.notDeepEqual([...gl.L.slice(0,64)],[...net.L.slice(0,64)]);
  assert.throws(()=>decodeAtlasLabels(m,b,[32492,32492],'nope'),/missing/);
});
test('atlas tract byte offsets decode their documented side and inferior/superior extent',async()=>{
  const m=await json('tracts.json'),b=await bytes('tracts.bin');
  const left=decodeAtlasBundle(m.bundles.find(x=>x.id==='CST_L'),b).flat();
  const right=decodeAtlasBundle(m.bundles.find(x=>x.id==='CST_R'),b).flat();
  assertCstLaterality(left,'L');assertCstLaterality(right,'R');
  assert(Math.min(...left.map(p=>p[2]))< -30);assert(Math.max(...left.map(p=>p[2]))>50);
  assert.throws(()=>decodeAtlasBundle({...m.bundles[0],offset:b.byteLength-2},b));
});
test('atlas links validate their selection and always restore paused',()=>{
  assert.deepEqual(atlasSelectionFromSearch('?hemi=R&area=8&playing=1&profile=presenter'),{hemi:'R',area:8,profile:'presenter',playing:false});
  assert.equal(atlasSelectionFromSearch('?area=-1&hemi=invalid').area,8);
});
