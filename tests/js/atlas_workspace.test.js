import test from 'node:test';
import assert from 'node:assert/strict';
import {WORKSPACE_MODES,DRAWER_STATES,INITIAL_WORKSPACE,workspaceTransition,drawerOf} from '../../viewer/atlas_workspace.js';

const step=(state,...events)=>events.reduce(workspaceTransition,state);
test('workspace: the state lists are closed and the initial state is the library with the drawer closed',()=>{
  assert.deepEqual([...WORKSPACE_MODES],['library','lesson','recap','explore']);
  assert.deepEqual([...DRAWER_STATES],['docked','open','closed']);
  assert.deepEqual(INITIAL_WORKSPACE,{mode:'library',expanded:false,drawerOpen:false});
  assert.throws(()=>{WORKSPACE_MODES.push('x');});
});
test('workspace: entering Explore docks the drawer open; leaving Explore closes it; other modes keep it',()=>{
  const explore=step(INITIAL_WORKSPACE,{type:'mode',mode:'explore'});
  assert.deepEqual(explore,{mode:'explore',expanded:false,drawerOpen:true});
  assert.equal(drawerOf(explore,false),'docked');
  assert.deepEqual(step(explore,{type:'mode',mode:'library'}),{mode:'library',expanded:false,drawerOpen:false});
  const openInLesson=step(INITIAL_WORKSPACE,{type:'mode',mode:'lesson'},{type:'tools',overlay:true});
  assert.equal(openInLesson.drawerOpen,true);assert.equal(drawerOf(openInLesson,true),'open');
  assert.equal(step(openInLesson,{type:'mode',mode:'recap'}).drawerOpen,true,'library, lesson and recap share one overlay drawer');
  assert.equal(step(explore,{type:'mode',mode:'nonsense'}).mode,'explore','an unknown mode is ignored');
});
test('workspace: a mode change always folds the expanded atlas back',()=>{
  const expanded=step(INITIAL_WORKSPACE,{type:'mode',mode:'lesson'},{type:'expand'});
  assert.equal(expanded.expanded,true);
  assert.equal(step(expanded,{type:'expand'}).expanded,false);
  assert.equal(step(expanded,{type:'mode',mode:'recap'}).expanded,false);
});
// The confirmed defect: in Explore a click on the docked drawer's summary collapsed the controls.
test('workspace: while docked, the summary cannot collapse the drawer; its open state follows the mode',()=>{
  const explore=step(INITIAL_WORKSPACE,{type:'mode',mode:'explore'});
  const clicked=step(explore,{type:'summary',overlay:false});
  assert.equal(clicked.drawerOpen,true,'summary click in docked Explore keeps the drawer open');
  assert.equal(drawerOf(clicked,false),'docked');
  assert.equal(step(clicked,{type:'summary',overlay:false},{type:'summary',overlay:false}).drawerOpen,true,'repeated clicks change nothing');
  assert.equal(step(explore,{type:'tools',overlay:false}).drawerOpen,true,'the Layers button cannot collapse it either');
  assert.equal(step(explore,{type:'escape',overlay:false}).drawerOpen,true,'Esc does not collapse a docked drawer');
});
test('workspace: where the drawer is a real overlay, the summary toggles it as before',()=>{
  const lesson=step(INITIAL_WORKSPACE,{type:'mode',mode:'lesson'});
  const open=step(lesson,{type:'summary',overlay:true});
  assert.equal(open.drawerOpen,true);assert.equal(drawerOf(open,true),'open');
  assert.equal(step(open,{type:'summary',overlay:true}).drawerOpen,false);
  assert.equal(step(open,{type:'escape',overlay:true}).drawerOpen,false,'Esc closes an open overlay');
  assert.equal(step(lesson,{type:'skip'}).drawerOpen,true,'the skip link opens it');
  // Explore on a layout whose stylesheet still floats the drawer: it is an overlay there and toggles.
  const narrowExplore=step(INITIAL_WORKSPACE,{type:'mode',mode:'explore'});
  assert.equal(drawerOf(narrowExplore,true),'open');
  assert.equal(step(narrowExplore,{type:'summary',overlay:true}).drawerOpen,false);
});
