import test from 'node:test';
import assert from 'node:assert/strict';
import {CONNECTION_ROWS} from '../../viewer/connections_data.js';
import {VIEWS,buildGraph,around} from '../../viewer/connections_graph.js';
import {ROUTE_KINDS,routeFromHash,hashFor,routeContent} from '../../viewer/connections_route.js';

const graph=buildGraph(CONNECTION_ROWS);
const parse=hash=>routeFromHash(hash,VIEWS,graph);

test('the route has two kinds: a named view and a found node',()=>{
  assert.deepEqual([...ROUTE_KINDS],['view','node']);
  assert(Object.isFrozen(ROUTE_KINDS));
});

test('every named view round-trips through its hash in the existing #id style',()=>{
  for(const v of VIEWS){
    const route={kind:'view',view:v};
    assert.equal(hashFor(route),`#${v.id}`);
    assert.deepEqual(parse(hashFor(route)),route);
  }
});

test('a found node round-trips through its hash, spaces and brackets included',()=>{
  for(const node of ['IFOF','FAT','area 44','semantic processing (word meaning access)']){
    assert(graph.nodeType.has(node),`fixture node missing: ${node}`);
    const route={kind:'node',node};
    const hash=hashFor(route);
    assert.match(hash,/^#node=/);
    assert(!/\s/.test(hash),`unencoded space in ${hash}`);
    assert.deepEqual(parse(hash),route,hash);
  }
  // A view id and a node name never collide: '#fat' is the view, '#node=FAT' is the node.
  assert.equal(parse('#fat').kind,'view');assert.equal(parse('#node=FAT').kind,'node');
});

test('an unknown or malformed hash falls back to the default view without throwing',()=>{
  const first={kind:'view',view:VIEWS[0]};
  for(const hash of ['','#','#no-such-view','#node=','#node=no such structure','#node=%E0%A4%A','#node=fat',undefined,null])
    assert.deepEqual(parse(hash),first,String(hash));
});

test('the content of a route gives the title, focus and links the stage draws',()=>{
  const view=routeContent({kind:'view',view:VIEWS[2]},graph);
  assert.equal(view.title,VIEWS[2].title);assert.equal(view.focus,VIEWS[2].focus);assert.equal(view.links.length,VIEWS[2].links(graph).length);
  const node=routeContent({kind:'node',node:'IFOF'},graph);
  assert.equal(node.title,'IFOF');assert.equal(node.focus,'IFOF');assert.equal(node.links.length,around(graph,'IFOF').length);assert.match(node.intro,/IFOF/);
});
