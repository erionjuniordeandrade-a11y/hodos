import test from 'node:test';
import assert from 'node:assert/strict';
import {CONNECTION_ROWS} from '../../viewer/connections_data.js';
import {NODE_TYPES,VERBS,VIEWS,buildGraph,around,sharedNodes,findNode} from '../../viewer/connections_graph.js';

const graph=buildGraph(CONNECTION_ROWS);

test('every row is a typed, quoted statement from a named section',()=>{
  for(const [subj,st,rel,obj,ot,quote,section] of CONNECTION_ROWS){
    assert(subj&&obj&&quote.length>10&&section,`incomplete row: ${subj} ${rel} ${obj}`);
    assert(NODE_TYPES[st]&&NODE_TYPES[ot]&&VERBS[rel]);
  }
});

test('teaching case vignettes stay out of the public map',()=>{
  for(const [subj,st,,obj,ot,quote,section] of CONNECTION_ROWS){
    assert(st!=='Case'&&ot!=='Case');
    assert(!/^Case\b/.test(section),`case section leaked: ${section}`);
    assert(!/\bcard ?\d|year-old/i.test(`${subj} ${obj} ${quote} ${section}`));
  }
});

test('repeated statements merge into one link carrying every quote',()=>{
  const g=buildGraph([['A','Tract','CONNECTS','B','CorticalArea','first quote here',"s1",0],['A','Tract','CONNECTS','B','CorticalArea','second quote here','s2',1]]);
  assert.equal(g.links.length,1);assert.equal(g.links[0].evidence.length,2);assert.equal(g.links[0].contested,true);
  assert.throws(()=>buildGraph([['A','Case','CONNECTS','B','Tract','q','s',0]]));
});

test('every named view is non-empty and its focus is on the canvas',()=>{
  for(const v of VIEWS){
    const links=v.links(graph);
    assert(links.length>0,`empty view ${v.id}`);
    if(v.focus)assert(links.some(l=>l.subj===v.focus||l.obj===v.focus),`focus missing in ${v.id}`);
  }
  assert(sharedNodes(graph).every(l=>l.ot==='Network'));
  assert(around(graph,'IFOF').length>5);
});

test('find matches exact names first, then substrings',()=>{
  assert.equal(findNode(graph,'fat'),'FAT');
  assert.equal(findNode(graph,'  '),null);
  assert.equal(findNode(graph,'no such structure'),null);
});
