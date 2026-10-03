// Connections page: a node-link reading of the white matter teaching notes. Every link opens its quotes.
import {CONNECTION_ROWS} from './connections_data.js';
import {NODE_TYPES,VERBS,VIEWS,buildGraph,around,findNode} from './connections_graph.js';

const graph=buildGraph(CONNECTION_ROWS);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const typeKey=n=>graph.nodeType.get(n)||'Model';

let network=null,current=null,currentLinks=[];
const stage=$('graphCanvas'),inspector=$('inspector'),status=$('graphStatus');
// The canvas cannot read CSS variables, so the stage's own tokens are resolved once here.
const tok=getComputedStyle(stage),T=n=>tok.getPropertyValue(n).trim();
const INK=T('--color-ink'),MUTED=T('--color-muted'),EDGE=T('--color-rule-2'),ACCENT=T('--color-accent'),STAGE=T('--color-stage'),FACE=T('--font-body');


// Node labels are drawn by vis-network outside the physics model, so stabilised nodes can print over each
// other. Push overlapping label boxes apart, then fit the union of boxes (labels included) into the stage.
function boxes(ids,rel){
  return ids.map(id=>{const p=network.getPosition(id),o=rel.get(id);return {id,b:{left:p.x+o.left,right:p.x+o.right,top:p.y+o.top,bottom:p.y+o.bottom}};});
}
// vis-network refreshes a node's bounding box only on redraw, so read each box once, relative to the node
// position, and recompute it from the moved position on every pass.
function boxOffsets(ids){
  network.redraw();
  const rel=new Map();
  for(const id of ids){const p=network.getPosition(id),b=network.getBoundingBox(id);rel.set(id,{left:b.left-p.x,right:b.right-p.x,top:b.top-p.y,bottom:b.bottom-p.y});}
  return rel;
}
function separateLabels(ids,rel){
  const gap=4;
  for(let pass=0;pass<80;pass++){
    const bs=boxes(ids,rel);let moved=false;
    for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){
      const p=bs[i].b,q=bs[j].b;
      const ox=Math.min(p.right,q.right)-Math.max(p.left,q.left)+gap,oy=Math.min(p.bottom,q.bottom)-Math.max(p.top,q.top)+gap;
      if(ox<=0||oy<=0)continue;
      moved=true;
      const a=network.getPosition(bs[i].id),c=network.getPosition(bs[j].id);
      const half=oy/2;
      const up=(p.top+p.bottom)/2<=(q.top+q.bottom)/2?-1:1;
      network.moveNode(bs[i].id,a.x,a.y+up*half);network.moveNode(bs[j].id,c.x,c.y-up*half);
    }
    if(!moved)break;
  }
}
// Edge labels sit at the middle of their edge, so two edges that meet at a hub can print one verb over the
// other. Where two label boxes overlap, keep the edge with more evidence and blank the other's label
// (the edge stays and its verb is still in the side panel).
function hideOverlappingEdgeLabels(links,ids,rel){
  // Edge labels are rotated along their edge, so use the axis-aligned box of the rotated label.
  const items=links.filter(l=>VERBS[l.rel]).map(l=>{
    const a=network.getPosition(l.subj),b=network.getPosition(l.obj),e=network.body.edges[l.id],sz=e&&e.labelModule&&e.labelModule.size;
    const w=(sz&&sz.width)||VERBS[l.rel].length*5.6+8,h=(sz&&sz.height)||14,cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
    const t=Math.atan2(b.y-a.y,b.x-a.x),c=Math.abs(Math.cos(t)),sn=Math.abs(Math.sin(t)),hw=(w*c+h*sn)/2,hh=(w*sn+h*c)/2;
    return {l,box:{left:cx-hw,right:cx+hw,top:cy-hh,bottom:cy+hh},keep:true};
  }).sort((x,y)=>y.l.evidence.length-x.l.evidence.length);
  const hits=(p,q)=>Math.min(p.right,q.right)-Math.max(p.left,q.left)>-2&&Math.min(p.bottom,q.bottom)-Math.max(p.top,q.top)>-2;
  const nodeBoxes=boxes(ids,rel).map(o=>o.b);
  const hidden=[];
  for(let i=0;i<items.length;i++){
    if(items[i].keep&&nodeBoxes.some(nb=>hits(items[i].box,nb))){items[i].keep=false;hidden.push(items[i].l.id);continue;}
    if(!items[i].keep)continue;
    for(let j=i+1;j<items.length;j++)if(items[j].keep&&hits(items[i].box,items[j].box)){items[j].keep=false;hidden.push(items[j].l.id);}
  }
  if(hidden.length)network.body.data.edges.update(hidden.map(id=>({id,label:''})));
}
function frameLabels(ids,rel){
  const bs=boxes(ids,rel).map(o=>o.b);
  const left=Math.min(...bs.map(b=>b.left)),right=Math.max(...bs.map(b=>b.right)),top=Math.min(...bs.map(b=>b.top)),bottom=Math.max(...bs.map(b=>b.bottom));
  const pad=16,w=stage.clientWidth,h=stage.clientHeight;
  const scale=Math.min(w/(right-left+2*pad),h/(bottom-top+2*pad),1.5);
  network.moveTo({position:{x:(left+right)/2,y:(top+bottom)/2},scale,animation:false});
}

function draw(links,focus){
  currentLinks=links;
  const names=new Set();links.forEach(l=>{names.add(l.subj);names.add(l.obj);});
  const big=names.size>60;
  const nodes=[...names].map(n=>{const c=NODE_TYPES[typeKey(n)].color;return {id:n,label:n.length>34?n.slice(0,32)+'…':n,title:n,shape:'dot',size:n===focus?16:(big?7:10),
    color:{background:c,border:c,highlight:{background:c,border:INK},hover:{background:c,border:INK}},
    font:{color:INK,size:big?11:13,face:FACE,strokeWidth:4,strokeColor:STAGE}};});
  const edges=links.map(l=>({id:l.id,from:l.subj,to:l.obj,arrows:{to:{enabled:true,scaleFactor:.45}},label:big?undefined:VERBS[l.rel],
    width:Math.min(1+(l.evidence.length-1)*1.2,4),dashes:l.contested,
    color:{color:EDGE,highlight:ACCENT,hover:ACCENT,opacity:.9},
    font:{color:MUTED,size:10,face:FACE,strokeWidth:4,strokeColor:STAGE,align:'middle'}}));
  const options={physics:{solver:'forceAtlas2Based',forceAtlas2Based:{gravitationalConstant:big?-45:-80,springLength:big?70:130,avoidOverlap:.6},stabilization:{iterations:big?400:250}},
    interaction:{hover:true,tooltipDelay:150,keyboard:false},edges:{smooth:{type:'continuous'}}};
  if(network)network.destroy();
  network=new window.vis.Network(stage,{nodes,edges},options);
  network.once('stabilizationIterationsDone',()=>{network.setOptions({physics:false});const ids=nodes.map(n=>n.id),rel=boxOffsets(ids);separateLabels(ids,rel);hideOverlappingEdgeLabels(links,ids,rel);frameLabels(ids,rel);});
  network.on('click',p=>{if(p.nodes.length)showNode(p.nodes[0]);else if(p.edges.length)showLink(graph.links.find(l=>l.id===p.edges[0]));else showIntro();});
  $('viewCount').textContent=`${names.size} structures · ${links.length} links`;
  stage.setAttribute('aria-label',`${current.title}: graph of ${names.size} structures and ${links.length} links. The structure list in the side panel gives the same content.`);
  if(focus&&names.has(focus)){network.selectNodes([focus]);showNode(focus);}else showIntro();
}

const nodeButton=n=>`<button type="button" class="node-link" data-node="${esc(n)}">${esc(n)}</button>`;
const typeTag=n=>`<span class="type-tag t-${typeKey(n)}">${esc(NODE_TYPES[typeKey(n)].label)}</span>`;
function factHTML(l){
  const quotes=l.evidence.map(v=>`<blockquote><p>${esc(v.quote)}</p><cite>Teaching notes · ${esc(v.section)}</cite></blockquote>`).join('');
  return `<article class="fact"><p class="fact-rel">${nodeButton(l.subj)} <span class="verb">${VERBS[l.rel]}</span> ${nodeButton(l.obj)}</p>${l.contested?'<p class="contested">Contested in the notes</p>':''}${quotes}</article>`;
}
function wire(){inspector.querySelectorAll('button[data-node]').forEach(b=>b.addEventListener('click',()=>focusNode(b.dataset.node)));}

function showIntro(){
  const names=[...new Set(currentLinks.flatMap(l=>[l.subj,l.obj]))].sort((a,b)=>a.localeCompare(b));
  inspector.innerHTML=`<h2>${esc(current.title)}</h2><p>${esc(current.intro)}</p>
    <p class="how">Colour gives the structure type. Arrows run from the subject to the object of each quoted sentence. A thicker link is stated in more than one section; a dashed link is contested.</p>
    ${names.length<=80?`<h3>Structures in this view</h3><ul class="node-list">${names.map(n=>`<li>${nodeButton(n)}</li>`).join('')}</ul>`:''}`;
  wire();
}
function showNode(n){
  const own=currentLinks.filter(l=>l.subj===n||l.obj===n),total=around(graph,n).length;
  inspector.innerHTML=`${typeTag(n)}<h2>${esc(n)}</h2><p class="count">${own.length} link${own.length===1?'':'s'} in this view${total>own.length?` · <button type="button" class="node-link" data-open="${esc(n)}">Show all ${total}</button>`:''}</p>${own.map(factHTML).join('')}`;
  wire();
  inspector.querySelector('button[data-open]')?.addEventListener('click',()=>openNeighbourhood(n));
}
function showLink(l){inspector.innerHTML=`<span class="type-tag">Link</span>${factHTML(l)}`;wire();}

function focusNode(n){
  if(currentLinks.some(l=>l.subj===n||l.obj===n)){network.selectNodes([n]);network.focus(n,{scale:1.1,animation:reducedMotion?false:{duration:420,easingFunction:'easeOutCubic'}});showNode(n);}
  else openNeighbourhood(n);
}
function openNeighbourhood(n){
  current={id:'find',title:n,intro:`Everything the notes state about ${n}.`,focus:n};
  document.querySelectorAll('#viewList button').forEach(b=>b.setAttribute('aria-pressed','false'));
  $('viewTitle').textContent=n;
  draw(around(graph,n),n);
}
function selectView(v){
  current=v;
  document.querySelectorAll('#viewList button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v.id)));
  $('viewTitle').textContent=v.title;
  draw(v.links(graph),v.focus);
  if(location.hash.slice(1)!==v.id)history.replaceState(null,'',`#${v.id}`);
}

$('viewList').innerHTML=VIEWS.map(v=>`<li><button type="button" data-view="${v.id}" aria-pressed="false">${esc(v.title)}<small>${esc(v.blurb)}</small></button></li>`).join('');
$('viewList').addEventListener('click',e=>{const b=e.target.closest('button[data-view]');if(b)selectView(VIEWS.find(v=>v.id===b.dataset.view));});
$('typeKey').innerHTML=Object.entries(NODE_TYPES).map(([k,t])=>`<li class="t-${k}">${esc(t.label)}</li>`).join('');
$('nodeNames').innerHTML=[...graph.nodeType.keys()].sort((a,b)=>a.localeCompare(b)).map(n=>`<option value="${esc(n)}">`).join('');
$('graphStats').textContent=`${graph.nodeType.size} structures, ${graph.links.length} links and ${graph.quotes} quotes`;
$('findForm').addEventListener('submit',e=>{e.preventDefault();const hit=findNode(graph,$('findInput').value);$('findStatus').textContent=hit?'':'No structure matches that name.';if(hit)openNeighbourhood(hit);});

if(!window.vis?.Network){status.textContent='The graph library did not load. Reload the page to try again.';}
else{
  status.hidden=true;
  selectView(VIEWS.find(v=>v.id===location.hash.slice(1))||VIEWS[0]);
  addEventListener('hashchange',()=>{const v=VIEWS.find(v=>v.id===location.hash.slice(1));if(v&&v!==current)selectView(v);});
}
