// Connections page: a node-link reading of the white matter teaching notes. Every link opens its quotes.
import {CONNECTION_ROWS} from './connections_data.js';
import {NODE_TYPES,VERBS,VIEWS,buildGraph,around,findNode} from './connections_graph.js';

const graph=buildGraph(CONNECTION_ROWS);
const INK='#ece7dc',MUTED='#aab1ba',EDGE='#5d6874',ACCENT='#9ad8ea',STAGE='#0e1114';
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const typeKey=n=>graph.nodeType.get(n)||'Model';

let network=null,current=null,currentLinks=[];
const stage=$('graphCanvas'),inspector=$('inspector'),status=$('graphStatus');

function draw(links,focus){
  currentLinks=links;
  const names=new Set();links.forEach(l=>{names.add(l.subj);names.add(l.obj);});
  const big=names.size>60;
  const nodes=[...names].map(n=>{const c=NODE_TYPES[typeKey(n)].color;return {id:n,label:n.length>34?n.slice(0,32)+'…':n,title:n,shape:'dot',size:n===focus?16:(big?7:10),
    color:{background:c,border:c,highlight:{background:c,border:INK},hover:{background:c,border:INK}},
    font:{color:INK,size:big?11:13,face:'Inter, system-ui, sans-serif',strokeWidth:4,strokeColor:STAGE}};});
  const edges=links.map(l=>({id:l.id,from:l.subj,to:l.obj,arrows:{to:{enabled:true,scaleFactor:.45}},label:big?undefined:VERBS[l.rel],
    width:Math.min(1+(l.evidence.length-1)*1.2,4),dashes:l.contested,
    color:{color:EDGE,highlight:ACCENT,hover:ACCENT,opacity:.9},
    font:{color:MUTED,size:10,face:'Inter, system-ui, sans-serif',strokeWidth:4,strokeColor:STAGE,align:'middle'}}));
  const options={physics:{solver:'forceAtlas2Based',forceAtlas2Based:{gravitationalConstant:big?-45:-80,springLength:big?70:130,avoidOverlap:.6},stabilization:{iterations:big?400:250}},
    interaction:{hover:true,tooltipDelay:150,keyboard:false},edges:{smooth:{type:'continuous'}}};
  if(network)network.destroy();
  network=new window.vis.Network(stage,{nodes,edges},options);
  network.once('stabilizationIterationsDone',()=>{network.setOptions({physics:false});network.fit({animation:false});});
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
