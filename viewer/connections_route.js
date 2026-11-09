// Connections route: the one state the URL hash names. '#<view id>' is a named view; '#node=<encoded name>' is a
// found node's neighbourhood. Anything else is the default view. The page renders a route; it never stores one.
import {around} from './connections_graph.js';

export const ROUTE_KINDS=Object.freeze(['view','node']);
const NODE='node=';

export function routeFromHash(hash,views,graph){
  const key=String(hash||'').replace(/^#/,'');
  if(key.startsWith(NODE)){
    let node=null;try{node=decodeURIComponent(key.slice(NODE.length));}catch{node=null;}
    return node&&graph.nodeType.has(node)?{kind:'node',node}:{kind:'view',view:views[0]};
  }
  return {kind:'view',view:views.find(v=>v.id===key)||views[0]};
}
export function hashFor(route){return route.kind==='node'?`#${NODE}${encodeURIComponent(route.node)}`:`#${route.view.id}`;}
// What the stage draws for a route: title, intro, focus and links.
export function routeContent(route,graph){
  if(route.kind==='node'){const n=route.node;return {title:n,intro:`Everything the notes state about ${n}.`,focus:n,links:around(graph,n)};}
  const v=route.view;return {title:v.title,intro:v.intro,focus:v.focus,links:v.links(graph)};
}
