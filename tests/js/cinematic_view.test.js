import test from 'node:test';
import assert from 'node:assert/strict';
import {CINEMATIC_BUNDLES,cinematicEntryBundles,MAX_BUNDLES} from '../../viewer/bundle_picker.js';
import {litStreamlineGeometry,litStreamlineIndex,LIT_STREAMLINE_FAST} from '../../viewer/lit_streamlines.js';

test('entry with nothing selected selects the 12 Cinematic Bundles in order',()=>{
  assert.deepEqual(cinematicEntryBundles([],CINEMATIC_BUNDLES),['CC','CST_L','CST_R','AF_L','AF_R','IFOF_L','IFOF_R','ILF_L','ILF_R','UF_L','UF_R','FAT_L']);
  assert.equal(CINEMATIC_BUNDLES.length,MAX_BUNDLES);
});
test('entry leaves an existing selection untouched',()=>{
  const selected=['OR_L'];
  assert.equal(cinematicEntryBundles(selected,CINEMATIC_BUNDLES),selected);
});
test('entry drops Bundles the installed atlas does not ship',()=>{
  assert.deepEqual(cinematicEntryBundles([],['AF_L','CC','NOPE']),['CC','AF_L']);
});

// Two straight streamlines of 4 points: one travels left-right (x), one up-down (z).
const lines=[[[0,0,0],[10,0,0],[20,0,0],[30,0,0]],[[5,5,0],[5,5,10],[5,5,20],[5,5,30]]];
const rgb=(color,v)=>[0,1,2].map(a=>color[v*3+a]/65535);
test('Lit streamlines use Direction colour: red for left-right, blue for up-down',()=>{
  const {color,P}=litStreamlineGeometry(lines,LIT_STREAMLINE_FAST),perLine=P*LIT_STREAMLINE_FAST.sides;
  const [r1,g1,b1]=rgb(color,0),[r2,g2,b2]=rgb(color,perLine);
  assert(r1>g1&&r1>b1,`x travel is red: ${[r1,g1,b1]}`);
  assert(b2>r2&&b2>g2,`z travel is blue: ${[r2,g2,b2]}`);
});
test('Fast tier keeps the original points and rings each one at the stated radius',()=>{
  const {position,P}=litStreamlineGeometry(lines,LIT_STREAMLINE_FAST),{sides,radius}=LIT_STREAMLINE_FAST;
  assert.equal(P,4);assert.equal(position.length,lines.length*P*sides*3);
  for(let l=0;l<lines.length;l++)for(let i=0;i<P;i++){const centre=lines[l][i];
    for(let s=0;s<sides;s++){const v=(l*P+i)*sides+s,d=Math.hypot(...[0,1,2].map(a=>position[v*3+a]-centre[a]));
      assert(Math.abs(d-radius)<1e-5,`ring vertex ${v} sits ${d} mm from its point`);}}
  const index=litStreamlineIndex(lines.length,P,sides);
  assert.equal(index.length,lines.length*(P-1)*sides*6);
  assert(index.every(i=>i<lines.length*P*sides),'every triangle stays inside the geometry');
});
import {clampPeel,clampGhost,peelRange,peelThreshold,PEEL_AMP,PEEL_DIR} from '../../viewer/cortex_peel.js';
test('Peel: 0 leaves the whole cortex ahead of the sweep, 100 has swept past all of it',()=>{
  const cortex=new Float32Array([0,0,0, 60,-90,70, -70,70,-40]),range=peelRange([cortex]);
  const s=i=>cortex[i]*PEEL_DIR[0]+cortex[i+1]*PEEL_DIR[1]+cortex[i+2]*PEEL_DIR[2],proj=[0,3,6].map(s);
  assert(peelThreshold(0,range)>Math.max(...proj)+PEEL_AMP,'Peel 0: no vertex is reached even by the noise edge');
  assert(peelThreshold(100,range)<Math.min(...proj)-PEEL_AMP,'Peel 100: every vertex is past the noise edge');
  let last=Infinity;for(let p=0;p<=100;p+=5){const t=peelThreshold(p,range);assert(t<last,`monotonic at ${p}`);last=t;}
});
test('Peel and ghost amounts clamp to their ranges',()=>{
  assert.deepEqual([-5,0,37,100,140,NaN,'50',undefined].map(clampPeel),[0,0,37,100,100,0,50,0]);
  assert.deepEqual([-1,0,.2,1,3,NaN].map(clampGhost),[0,0,.2,1,1,0]);
  assert.throws(()=>peelRange([new Float32Array(0)]));
});
