import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMERA_FRAMES,cameraFrameTransition,refitsOnLoad,framesFocus,holdsView} from '../../viewer/atlas_camera_frame.js';

const step=(state,...events)=>events.reduce(cameraFrameTransition,state);
test('camera frame: the state list is closed and every transition lands in it',()=>{
  assert.deepEqual([...CAMERA_FRAMES],['auto-framed','authored','flight-pending','user-moved']);
  const events=[{type:'view'},{type:'fly',focus:true,zoom:1},{type:'fly',focus:false,zoom:1},{type:'fly',focus:false,zoom:1.15},{type:'place'},
    {type:'user',source:'pointer'},{type:'user',source:'wheel'},{type:'user',source:'keyboard'},{type:'user',source:'touch'},{type:'nonsense'}];
  for(const from of [...CAMERA_FRAMES,'garbage'])for(const e of events)assert(CAMERA_FRAMES.includes(cameraFrameTransition(from,e)),`${from} + ${JSON.stringify(e)}`);
});
test('camera frame: named views auto-frame, a focus flight stays pending, a zoomed authored camera is held, a saved camera is the user\'s',()=>{
  assert.equal(step('user-moved',{type:'view'}),'auto-framed');
  assert.equal(step('auto-framed',{type:'fly',focus:true,zoom:1}),'flight-pending');
  assert.equal(step('auto-framed',{type:'fly',focus:false,zoom:1}),'auto-framed');
  assert.equal(step('auto-framed',{type:'fly',focus:false,zoom:1.15}),'authored');
  assert.equal(step('flight-pending',{type:'place'}),'user-moved');
  assert.deepEqual(CAMERA_FRAMES.map(refitsOnLoad),[false,false,true,false],'only a pending flight refits when pathways arrive');
  assert.deepEqual(CAMERA_FRAMES.map(framesFocus),[false,false,true,false]);
  assert.deepEqual(CAMERA_FRAMES.map(s=>holdsView(s,{zoom:1})),[true,false,true,false],'auto-framed and a zoom-1 flight still show their named view');
  assert.equal(holdsView('flight-pending',{zoom:1.4}),false,'a zoomed focus flight does not refit on resize');
});
// The confirmed defect: arrow keys (and the wheel) during a focus flight left it pending, so the camera snapped back when the bundles loaded.
test('camera frame: any user camera input cancels a pending flight; a later bundle load never re-frames',()=>{
  for(const source of ['pointer','touch','wheel','keyboard']){
    const after=step('flight-pending',{type:'user',source});
    assert.equal(after,'user-moved',`${source} input marks the camera user-moved`);
    assert.equal(refitsOnLoad(after),false,`${source}: no refit when the pathways arrive`);
    assert.equal(holdsView(after,{zoom:1}),false,`${source}: the readout says free view`);
  }
  assert.equal(step('auto-framed',{type:'user',source:'keyboard'}),'user-moved');
  assert.equal(step('user-moved',{type:'fly',focus:true,zoom:1}),'flight-pending','a new lesson step may fly again');
});
