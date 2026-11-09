// The lesion lab's interaction decisions (docs/state-machines.md, "Lesion lab"): the pointer state
// behind the [data-lesion] cursor, what Esc does, and which bundle row the scene lifts. Each is one
// pure function in lesion_model.js; lesion_lab.js only renders what it returns.
import test from 'node:test';
import assert from 'node:assert/strict';
import {POINTER_STATES,pointerState,ESCAPE_ACTIONS,escapeAction,FOCUS_STATES,bundleFocus} from '../../viewer/lesion_model.js';

const BOOLS=[false,true];
const READY={ready:true,loading:false};

test('pointer state: one priority order (not ready, dragging, place pending, hovering, placing armed, idle)',()=>{
  assert.ok(Object.isFrozen(POINTER_STATES));
  assert.deepEqual([...POINTER_STATES],['idle','hovering','placing','place-pending','dragging']);
  const expect=({dragging,placePending,hover,placing},{ready,loading})=>
    !ready||loading?'idle':dragging?'dragging':placePending?'place-pending':hover?'hovering':placing?'placing':'idle';
  const seen=new Set();
  for(const dragging of BOOLS)for(const placePending of BOOLS)for(const hover of BOOLS)for(const placing of BOOLS)
    for(const flags of [READY,{ready:true,loading:true},{ready:false,loading:false}]){
      const facts={dragging,placePending,hover,placing},state=pointerState(facts,flags);
      assert.ok(POINTER_STATES.includes(state),`${JSON.stringify(facts)} -> ${state} is a listed state`);
      assert.equal(state,expect(facts,flags),`${JSON.stringify(facts)} with ${JSON.stringify(flags)}`);
      seen.add(state);
    }
  assert.deepEqual([...seen].sort(),[...POINTER_STATES].sort(),'the table reaches every state');
});

test('pointer state: the combination where the four old cursor derivations disagreed',()=>{
  // lesion_lab.js before the fix, cursor value per site (hover = grab, place = crosshair, drag = grabbing):
  const old={
    setPlacing_L234:({placing,hover})=>placing?'place':hover?'hover':null,
    pointermove_L750:({placing,hover})=>!placing||hover?(hover?'hover':null):'place',
    dragEnd_L766:({placing,hover})=>hover?'hover':placing?'place':null,
    pointerleave_L769:({placing})=>placing?'place':null,
  };
  // An entry is armed and the pointer rests on the sphere. A pointerdown there DRAGS the sphere
  // (bindDrag places only off the sphere), so the honest cursor is the hover one.
  const facts={dragging:false,placePending:false,hover:true,placing:'A'};
  const values=Object.values(old).map(f=>f(facts));
  assert.ok(new Set(values).size>1,`the old derivations disagreed: ${JSON.stringify(values)}`);
  assert.equal(pointerState(facts,READY),'hovering');
  // The same facts off the sphere: every old site agreed on the crosshair, and so does the one function.
  assert.equal(pointerState({...facts,hover:false},READY),'placing');
  // A drag in flight always shows the grabbing cursor, whatever else is armed.
  assert.equal(pointerState({dragging:true,placePending:false,hover:true,placing:'A'},READY),'dragging');
  // While the atlas switches hemisphere pointerdown is refused, so no action cursor is promised.
  assert.equal(pointerState(facts,{ready:true,loading:true}),'idle');
});

test('Esc: one priority order (a drag owns the pointer, then an armed entry, then the open drawer)',()=>{
  assert.ok(Object.isFrozen(ESCAPE_ACTIONS));
  assert.deepEqual([...ESCAPE_ACTIONS],['none','cancel-placing','close-drawer']);
  const expect=({dragging,placing,drawerOpen})=>dragging?'none':placing?'cancel-placing':drawerOpen?'close-drawer':'none';
  for(const dragging of BOOLS)for(const placing of [null,'A'])for(const drawerOpen of BOOLS){
    const facts={dragging,placing,drawerOpen},action=escapeAction(facts);
    assert.ok(ESCAPE_ACTIONS.includes(action));
    assert.equal(action,expect(facts),JSON.stringify(facts));
  }
  // The reported defect: the drawer is open and nothing else is going on.
  assert.equal(escapeAction({dragging:false,placing:null,drawerOpen:true}),'close-drawer');
  // One step per press: with an entry armed and the drawer open, the first Esc disarms, the next closes.
  assert.equal(escapeAction({dragging:false,placing:'B',drawerOpen:true}),'cancel-placing');
  assert.equal(escapeAction({dragging:false,placing:null,drawerOpen:true}),'close-drawer');
});

test('bundle focus: a hovered or open row lifts its bundle only while the row is listed',()=>{
  assert.ok(Object.isFrozen(FOCUS_STATES));
  assert.deepEqual([...FOCUS_STATES],['none','hovered','open']);
  const shown=[3,7,12];
  assert.deepEqual(bundleFocus({hovered:-1,open:-1},shown),{state:'none',hovered:-1,index:-1});
  assert.deepEqual(bundleFocus({hovered:7,open:-1},shown),{state:'hovered',hovered:7,index:7});
  assert.deepEqual(bundleFocus({hovered:-1,open:12},shown),{state:'open',hovered:-1,index:12});
  assert.deepEqual(bundleFocus({hovered:7,open:12},shown),{state:'hovered',hovered:7,index:7},'the hovered row wins over the open one');
  // The suspected defect: the sphere moves, the hovered row leaves the list (no pointerleave reaches
  // a removed node), and the scene kept lifting a bundle no row names while dimming the rest.
  assert.deepEqual(bundleFocus({hovered:7,open:-1},[3,12]),{state:'none',hovered:-1,index:-1},'a hover ends with its row');
  // An open row that leaves the list keeps its <details> open (it comes back open), but lifts nothing while away.
  assert.deepEqual(bundleFocus({hovered:-1,open:12},[3,7]),{state:'none',hovered:-1,index:-1});
  assert.deepEqual(bundleFocus({hovered:7,open:12},[3,12]),{state:'open',hovered:-1,index:12},'the open row takes over when the hovered one leaves');
  assert.deepEqual(bundleFocus({hovered:-1,open:-1},[]),{state:'none',hovered:-1,index:-1});
  assert.deepEqual(bundleFocus({hovered:3,open:-1},[]),{state:'none',hovered:-1,index:-1},'an empty list lifts nothing');
});
