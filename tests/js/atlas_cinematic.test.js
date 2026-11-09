import test from 'node:test';
import assert from 'node:assert/strict';
import {SURFACE_OWNERS,surfaceOwner,revealedSurfaceLevel,fibreMotion} from '../../viewer/atlas_cinematic.js';

test('cinematic: the Peel owns the surface in Cinematic view, the Layers slider otherwise',()=>{
  assert.deepEqual([...SURFACE_OWNERS],['layers','peel']);
  assert.equal(surfaceOwner(false),'layers');assert.equal(surfaceOwner(true),'peel');
});
test('cinematic: a reveal opens a defined cortex to 15 and leaves a transparent one alone',()=>{
  assert.equal(revealedSurfaceLevel({level:60,cinematic:false}),15);
  assert.equal(revealedSurfaceLevel({level:80,cinematic:false}),15);
  assert.equal(revealedSurfaceLevel({level:59,cinematic:false}),null);
  assert.equal(revealedSurfaceLevel({level:15,cinematic:false}),null);
});
// The confirmed defect: a pathway chip in Cinematic view changed the Layers surface level the Peel owns.
test('cinematic: in Cinematic view a reveal never changes the Layers surface level',()=>{
  for(const level of [95,80,60,59,15])assert.equal(revealedSurfaceLevel({level,cinematic:true}),null,`level ${level} stays with the Peel`);
});
test('cinematic: fibre animation runs only in Study, with motion allowed, in a visible tab',()=>{
  const base={playing:true,profile:'teaching',reducedMotion:false,hidden:false,cinematic:false};
  assert.equal(fibreMotion(base),true);
  assert.equal(fibreMotion({...base,playing:false}),false);
  assert.equal(fibreMotion({...base,profile:'presenter'}),false);
  assert.equal(fibreMotion({...base,reducedMotion:true}),false,'reduced motion stays static');
  assert.equal(fibreMotion({...base,hidden:true}),false);
});
// The confirmed defect: the animation kept advancing while Cinematic view hid the traces.
test('cinematic: no fibre-animation work while the traces are hidden; it resumes when they show',()=>{
  const base={playing:true,profile:'teaching',reducedMotion:false,hidden:false};
  assert.equal(fibreMotion({...base,cinematic:true}),false,'Cinematic view hides the traces: nothing animates');
  assert.equal(fibreMotion({...base,cinematic:false}),true,'leaving Cinematic view resumes the animation');
  assert.equal(fibreMotion({...base,cinematic:true,reducedMotion:true}),false);
});
