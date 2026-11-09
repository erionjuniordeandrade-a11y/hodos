import test from 'node:test';
import assert from 'node:assert/strict';
import {CASES} from '../../viewer/case_content.js';
import {caseRoute,createCaseStore,historyEntry,stagesFor} from '../../viewer/case_state.js';

const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
const seven=stagesFor({decision:{}}),six=stagesFor(null),at=(stage,maxStage,reviewOnly=false)=>({stage,maxStage,reviewOnly});

test('a Stage number within maxStage is shown as asked',()=>{
 assert.deepEqual(caseRoute({maxStage:3},seven,'0'),at(0,3));
 assert.deepEqual(caseRoute({maxStage:3},seven,'2'),at(2,3));
 assert.deepEqual(caseRoute({maxStage:3},seven,'3'),at(3,3));
});
test('a Stage number beyond maxStage is clamped to maxStage',()=>{
 assert.deepEqual(caseRoute({maxStage:3},seven,'5'),at(3,3));
 assert.deepEqual(caseRoute({maxStage:3},seven,'6'),at(3,3));
 // Beyond the last Stage or below zero is not a Stage at all: resume at maxStage.
 assert.deepEqual(caseRoute({maxStage:3},seven,'7'),at(3,3));
 assert.deepEqual(caseRoute({maxStage:3},six,'6'),at(3,3));
 assert.deepEqual(caseRoute({maxStage:3},seven,'-1'),at(3,3));
});
test('review shows the last Stage and never raises maxStage',()=>{
 assert.deepEqual(caseRoute({maxStage:1},seven,'review'),at(6,1,true));
 assert.deepEqual(caseRoute({maxStage:0},six,'review'),at(5,0,true));
 assert.deepEqual(caseRoute({maxStage:0},seven,'review',{reach:true}),at(6,0,true),'review never counts as reaching a Stage');
});
test('unknown text resumes practice at maxStage',()=>{
 for(const part of ['abc','Review','2.5',undefined])assert.deepEqual(caseRoute({maxStage:2},seven,part),at(2,2),String(part));
});
test('only reaching a Stage raises maxStage',()=>{
 assert.deepEqual(caseRoute({maxStage:2},seven,3,{reach:true}),at(3,3));
 assert.deepEqual(caseRoute({maxStage:4},seven,1,{reach:true}),at(1,4),'going back keeps progress');
 assert.deepEqual(caseRoute({maxStage:2},seven,9,{reach:true}),at(2,2),'a Stage that does not exist is never reached');
});
test('the store moves only through caseRoute: leaving review cannot unlock Stages',()=>{
 const store=createCaseStore(memory()),id=CASES[0].id,last=store.stages(id).length-1,position=()=>{const r=store.get(id);return [r.stage,r.maxStage,r.reviewOnly];};
 store.move(id,'review');assert.deepEqual(position(),[last,0,true]);
 // A position patch through update() is dropped: before, {reviewOnly:false} alone raised maxStage from 0 to the last Stage.
 store.update(id,{reviewOnly:false});assert.deepEqual(position(),[last,0,true]);
 store.update(id,{stage:last,maxStage:last,reviewOnly:false,initial:'kept'});assert.deepEqual(position(),[last,0,true]);assert.equal(store.get(id).initial,'kept');
 store.move(id,String(last));assert.deepEqual(position(),[0,0,false]);
 store.move(id,1,{reach:true});assert.deepEqual(position(),[1,1,false]);
 store.move(id,'review');store.move(id,'1');assert.deepEqual(position(),[1,1,false]);
});
test('one history navigation is one decision; a cancelled one is recognised until history.go returns',()=>{
 const shown={hash:'#c/5',at:5};
 // Back: popstate reads entry 4, the paired hashchange reads the same entry.
 const back=historyEntry(shown,null,'#c/4',{at:4});assert.deepEqual(back,{entry:{hash:'#c/4',at:4},kind:'new'});
 assert.equal(historyEntry(shown,back.entry,'#c/4',{at:4}).kind,'refused','the paired hashchange of a cancelled Back asks nothing');
 assert.equal(historyEntry(shown,back.entry,'#c/5',{at:5}).kind,'shown','history.go(1) lands on the entry already shown');
 // Accepted: once entry 4 is shown, its paired hashchange is the entry on screen.
 assert.equal(historyEntry({hash:'#c/4',at:4},null,'#c/4',{at:4}).kind,'shown');
 // A typed fragment has no index and sits after the shown entry.
 assert.deepEqual(historyEntry(shown,null,'#d/0',null),{entry:{hash:'#d/0',at:6},kind:'new'});
 // A refused entry does not mask a later, different navigation.
 assert.equal(historyEntry(shown,back.entry,'#c/3',{at:3}).kind,'new');
});
test('entries a closed reference iframe left behind are the shown entry: Back over them asks nothing and overwrites nothing',()=>{
 // The reference dialog's iframe navigated twice while Stage 5 (index 5) was on screen, then the dialog closed. Chrome keeps the
 // two joint entries; each carries the top window's own hash and state {at:5}. Back lands on them before it reaches Stage 4.
 const shown={hash:'#c/5',at:5},dead={hash:'#c/5',at:5};
 const d1=historyEntry(shown,null,dead.hash,{at:dead.at});assert.equal(d1.kind,'shown','first dead entry');
 const d2=historyEntry(shown,null,dead.hash,{at:dead.at});assert.equal(d2.kind,'shown','the entry pushed before the iframe moved');
 // The next Back reaches Stage 4: one decision. Cancelled, history.go(shown.at-entry.at) is go(1) and lands on a dead entry, still 'shown'.
 const back=historyEntry(shown,null,'#c/4',{at:4});assert.deepEqual(back,{entry:{hash:'#c/4',at:4},kind:'new'});
 assert.equal(shown.at-back.entry.at,1);
 assert.equal(historyEntry(shown,back.entry,'#c/5',{at:5}).kind,'shown','go(1) returns to a dead entry of the shown Stage');
 // Dead entries between Stage 4 and Stage 5 (the iframe moved while Stage 4 was shown): Back from 5 meets one as a normal Stage 4 entry.
 const mid=historyEntry(shown,null,'#c/4',{at:4});assert.equal(mid.kind,'new');
 assert.equal(historyEntry({hash:'#c/4',at:4},null,'#c/4',{at:4}).kind,'shown','its sibling dead entries are then the shown one');
});
