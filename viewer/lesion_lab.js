// Lesion lab page. Hodos's atlas scene supplies the surface, camera, controls and verified bundle
// bytes; this file adds one line layer (every sampled streamline, drawn as spared, inside the
// margin or cut), the sphere with its silhouette rings, the drag, and the quoted-evidence panel.
// The geometric test and the evidence joins live in lesion_model.js; nothing here writes a claim.
import {labBundles,packStreamlines,classify,summarize,bundleAnchor,clampCentre,parseLabParams,evidenceFor,namedDeficits,
  CLAIMS,CLAIMS_WITH_PMID,UNPLACED_CLAIMS,SPARED,MARGIN,CUT} from './lesion_model.js';
import {EVIDENCE_SOURCES} from './lesion_evidence.js';
import {bundleLabel} from './atlas_glossary.js';
import {VERBS} from './connections_graph.js';
import {composeStory} from './lesion_story.js';

const $=id=>document.getElementById(id);
const testMode=new URLSearchParams(location.search).has('test');
const initial=parseLabParams(location.search);
const GROUPS=['Association','Projection','Commissural'];
// tokens.css --color-dec-association, -projection, -commissural; the ghost is atlas_scene.js GHOST_TINT.
const DEC=[0x62b97a,0x6a93e8,0xe0605a],GHOST=0x818d99;
const TEX_WIDTH=128,SLOW_MS=30000,PANEL_MS=100,ANNOUNCE_MS=400;
const PASSES=[{show:SPARED,alpha:.015,order:1},{show:MARGIN,alpha:.24,order:2},{show:CUT,alpha:.62,order:4}];
const HEMI_NAME={L:'left',R:'right'};
const VIEW_NAMES={oblique:'Oblique view',lateral:'Lateral view',medial:'Medial view',superior:'Superior view',anterior:'Anterior view',
  posterior:'Posterior view',inferior:'Inferior view',free:'Free rotation'};

const lab={hemi:initial.hemi,centre:null,radius:initial.radius,marginOn:initial.marginOn,margin:initial.margin,
  ready:false,loading:false,slow:false,error:null,rows:[],reached:[],named:[],classifyMs:0,classifyMax:0,view:'oblique'};
let scene=null,stage=null,THREE=null,decodeAtlasBundle=null,leaving=false;
let sphere=null,rings=null,ringScreen=null,drag=null,hover=false,focusIndex=-1,openIndex=-1;
let lastStory=null,lastInsets=null,drawerReturnFocus=null,insetsObserver=null;
const layers=new Map(),rowsByHemi=new Map();
const mount=$('atlasCanvas'),status=$('sceneStatus'),list=$('bundleList'),controls=$('lesionControls');
const drawer=$('evidenceDrawer'),dock=$('labDock'),sheetHandle=$('sheetHandle');
const stageEl=mount.closest('.lab-stage'),hudTitle=document.querySelector('.lab-hud-title'),
  consoleEl=document.querySelector('.lab-console'),chipsEl=document.querySelector('.lab-chips'),scopeEl=document.querySelector('.lab-scope'),
  storyEl=document.querySelector('.lab-story'),stageLabelEl=$('stageLabel');

const fmt=value=>(value<0?'−':'')+Math.abs(value).toFixed(1);
const count=value=>value.toLocaleString('en-US');
const plural=(n,word)=>`${count(n)} ${word}${n===1?'':'s'}`;
// A share that rounds to 0 or 100 without being either reads "<1%" or ">99%", so the percentage never contradicts the count.
const percent=(part,total)=>{const value=part/total*100;return part>0&&value<.5?'<1%':part<total&&value>=99.5?'>99%':`${Math.round(value)}%`;};
const el=(tag,props={},...children)=>{const node=Object.assign(document.createElement(tag),props);node.append(...children.filter(c=>c!==null&&c!==undefined&&c!==false));return node;};
const layer=()=>layers.get(lab.hemi);
const radiusOuter=()=>lab.radius+(lab.marginOn?lab.margin:0);

function showStatus(message){status.textContent=message;status.hidden=!message;}
function fail(error,{slow=false}={}){
  if(slow){lab.slow=true;console.warn(error.message);}
  else{lab.error=error.message||String(error);console.error(error);}
  showStatus(slow?'The 3D atlas is taking longer than expected. Retry it, or read the method and sources below.':
    'The 3D atlas could not load. Retry it, or read the method and sources below.');
  $('retryScene').hidden=false;
  if(!lab.ready){$('labSummary').textContent='The bundle list needs the 3D atlas. Retry it above; the method, sources and limits below remain available.';$('labSummary').dataset.empty='true';}
}
$('retryScene').addEventListener('click',()=>location.reload());
$('skipLink').addEventListener('click',event=>{event.preventDefault();$('labMain').focus();});

// The full-bleed stage subtracts the site header's real height (it varies by breakpoint and can
// wrap); lesion-lab.css falls back to a literal estimate, this corrects it once measured.
function syncHeaderHeight(){
  const header=document.querySelector('.studio-header');
  if(header)document.documentElement.style.setProperty('--studio-header-h',`${header.getBoundingClientRect().height}px`);
}
if(document.querySelector('.studio-header')){new ResizeObserver(syncHeaderHeight).observe(document.querySelector('.studio-header'));syncHeaderHeight();}

// ---- Line layer: one geometry per hemisphere, three passes that each keep one state ------------

function buildLayer(pack){
  const n=pack.points.length/3,arc=new Float32Array(n),sid=new Float32Array(n);
  let segments=0;
  for(let s=0;s<pack.count;s++){
    const a=pack.start[s],b=pack.start[s+1],p=pack.points;
    let total=0;for(let i=a+1;i<b;i++)total+=Math.hypot(p[i*3]-p[i*3-3],p[i*3+1]-p[i*3-2],p[i*3+2]-p[i*3-1]);
    let run=0;arc[a]=0;sid[a]=s;
    for(let i=a+1;i<b;i++){run+=Math.hypot(p[i*3]-p[i*3-3],p[i*3+1]-p[i*3-2],p[i*3+2]-p[i*3-1]);arc[i]=total>0?run/total:0;sid[i]=s;}
    segments+=b-a-1;
  }
  const index=new Uint32Array(segments*2);let k=0;
  for(let s=0;s<pack.count;s++)for(let i=pack.start[s];i<pack.start[s+1]-1;i++){index[k++]=i;index[k++]=i+1;}
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(pack.points,3));
  geometry.setAttribute('arc',new THREE.BufferAttribute(arc,1));
  geometry.setAttribute('sid',new THREE.BufferAttribute(sid,1));
  geometry.setIndex(new THREE.BufferAttribute(index,1));geometry.computeBoundingSphere();
  // Per streamline: R = state, G = DEC family, B = bundle index. Read with texelFetch, never filtered.
  const rows=Math.ceil(pack.count/TEX_WIDTH),data=new Uint8Array(TEX_WIDTH*rows*4);
  for(let s=0;s<pack.count;s++){const bundle=pack.bundles[pack.bundleOf[s]];data[s*4+1]=GROUPS.indexOf(bundle.group);data[s*4+2]=pack.bundleOf[s];data[s*4+3]=255;}
  const texture=new THREE.DataTexture(data,TEX_WIDTH,rows,THREE.RGBAFormat,THREE.UnsignedByteType);texture.needsUpdate=true;
  const shared={uState:{value:texture},uFocus:{value:-1},uTint:{value:DEC.map(hex=>new THREE.Color(hex))},uGhost:{value:new THREE.Color(GHOST)}};
  const objects=PASSES.map(pass=>{
    const material=new THREE.ShaderMaterial({uniforms:{...shared,uShow:{value:pass.show},uAlpha:{value:pass.alpha}},
      vertexShader:`attribute float arc;attribute float sid;uniform highp sampler2D uState;uniform float uShow;uniform float uFocus;
        varying float vArc;varying float vGroup;varying float vFocus;
        void main(){int id=int(sid+.5);vec4 v=texelFetch(uState,ivec2(id%${TEX_WIDTH},id/${TEX_WIDTH}),0);
          if(abs(floor(v.r*255.+.5)-uShow)>.5){gl_Position=vec4(2.,2.,2.,1.);return;}
          vArc=arc;vGroup=floor(v.g*255.+.5);vFocus=uFocus>-.5&&abs(floor(v.b*255.+.5)-uFocus)<.5?1.:0.;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`uniform vec3 uTint[3];uniform vec3 uGhost;uniform float uShow;uniform float uAlpha;uniform float uFocus;
        varying float vArc;varying float vGroup;varying float vFocus;
        void main(){float feather=smoothstep(0.,.06,min(vArc,1.-vArc));
          vec3 tint=vGroup<.5?uTint[0]:vGroup<1.5?uTint[1]:uTint[2];float alpha=uAlpha;
          if(uShow<.5){if(vFocus>.5)alpha=.16;else tint=uGhost;}
          else if(uFocus>-.5)alpha*=vFocus>.5?1.6:.35;
          gl_FragColor=vec4(tint,min(alpha,1.)*feather);}`,
      transparent:true,depthWrite:false,blending:THREE.NormalBlending,toneMapped:false});
    const lines=new THREE.LineSegments(geometry,material);lines.renderOrder=pass.order;lines.userData.kind='lesion-lab';return lines;
  });
  return {pack,geometry,texture,shared,objects,state:new Uint8Array(pack.count),anchors:new Map()};
}

function disposeLayer(entry){
  for(const object of entry.objects){stage?.scene.remove(object);object.material.dispose();}
  entry.geometry.dispose();entry.texture.dispose();
}

async function loadLayer(hemi){
  if(layers.has(hemi))return layers.get(hemi);
  const bundles=labBundles(scene.tractMeta,hemi);
  if(!lab.slow)showStatus(`Loading ${bundles.length} sampled bundles…`);
  const bytes=await stage.loadBundleBytes(bundles.map(b=>b.id));
  const entries=bundles.map(meta=>({id:meta.id,group:meta.group,lines:decodeAtlasBundle({...meta,offset:0},bytes.get(meta.id))}));
  const entry=buildLayer(packStreamlines(entries));
  layers.set(hemi,entry);return entry;
}

// ---- Sphere and its silhouette rings ---------------------------------------------------------

const svgNS='http://www.w3.org/2000/svg';
function createSphere(){
  const material=new THREE.MeshStandardMaterial({color:0x9be1f0,emissive:0x2b6f80,emissiveIntensity:.35,roughness:.55,metalness:0,
    transparent:true,opacity:.24,depthWrite:false});
  sphere=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),material);
  sphere.renderOrder=3;sphere.frustumCulled=false;sphere.userData.kind='lesion-lab';
  // Rings follow the frame actually drawn: updated from the render call, not from input events.
  sphere.onBeforeRender=(renderer,s,camera)=>updateRings(camera);
  stage.scene.add(sphere);
  const svg=document.createElementNS(svgNS,'svg');svg.classList.add('lab-rings');svg.setAttribute('aria-hidden','true');
  const lesionRing=document.createElementNS(svgNS,'polygon'),marginRing=document.createElementNS(svgNS,'polygon');
  lesionRing.classList.add('lab-ring');marginRing.classList.add('lab-ring','lab-ring-margin');
  svg.append(marginRing,lesionRing);mount.append(svg);
  rings={svg,lesionRing,marginRing,size:{w:mount.clientWidth,h:mount.clientHeight}};
  rings.observer=new ResizeObserver(()=>{rings.size={w:mount.clientWidth,h:mount.clientHeight};stage?.requestDraw();});rings.observer.observe(mount);
}

const RING_POINTS=96;
const ringTmp={};
// Exact outline of a sphere under perspective: the circle of tangent points seen from the camera,
// centred C − u·R²/d with radius R·√(d² − R²)/d in the plane normal to the view ray u.
function silhouette(camera,radius){
  const {Vector3}=THREE,t=ringTmp;
  t.c??=new Vector3();t.u??=new Vector3();t.a??=new Vector3();t.b??=new Vector3();t.p??=new Vector3();t.v??=new Vector3();
  t.c.fromArray(lab.centre);t.u.subVectors(t.c,camera.position);
  const d=t.u.length();if(d<=radius*1.01)return null;
  t.u.divideScalar(d);
  const rho=radius*Math.sqrt(d*d-radius*radius)/d;
  t.c.addScaledVector(t.u,-radius*radius/d);
  t.a.crossVectors(t.u,camera.up);if(t.a.lengthSq()<1e-8)t.a.set(1,0,0).cross(t.u);
  t.a.normalize();t.b.crossVectors(t.a,t.u).normalize();
  const {w,h}=rings.size,out=[];
  for(let i=0;i<RING_POINTS;i++){
    const angle=i/RING_POINTS*Math.PI*2;
    t.p.copy(t.c).addScaledVector(t.a,rho*Math.cos(angle)).addScaledVector(t.b,rho*Math.sin(angle));
    if(t.v.copy(t.p).applyMatrix4(camera.matrixWorldInverse).z>-camera.near)return null;
    t.p.project(camera);out.push([(t.p.x+1)/2*w,(1-t.p.y)/2*h]);
  }
  return out;
}
const pointsAttr=points=>points.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
function updateRings(camera){
  if(!rings||!lab.centre)return;
  const inner=silhouette(camera,lab.radius);
  rings.lesionRing.setAttribute('points',inner?pointsAttr(inner):'');
  const outer=lab.marginOn&&inner?silhouette(camera,radiusOuter()):null;
  rings.marginRing.setAttribute('points',outer?pointsAttr(outer):'');
  if(!inner){ringScreen=null;return;}
  const centre=ringTmp.v.fromArray(lab.centre).project(camera),{w,h}=rings.size;
  const x=(centre.x+1)/2*w,y=(1-centre.y)/2*h;
  ringScreen={x,y,r:Math.max(...inner.map(([px,py])=>Math.hypot(px-x,py-y)))};
}

// ---- State changes ---------------------------------------------------------------------------

let panelTimer=0,panelAt=0,announceTimer=0,urlTimer=0;
function applyGeometry(){
  const entry=layer();if(!entry||!lab.centre)return;
  const started=performance.now();
  const changed=classify(entry.pack,{centre:lab.centre,radius:lab.radius,margin:lab.marginOn?lab.margin:0},entry.state);
  if(changed){
    const data=entry.texture.image.data;
    for(let s=0;s<entry.pack.count;s++)data[s*4]=entry.state[s];
    entry.texture.needsUpdate=true;
  }
  lab.classifyMs=performance.now()-started;lab.classifyMax=Math.max(lab.classifyMax,lab.classifyMs);
  sphere.position.fromArray(lab.centre);sphere.scale.setScalar(lab.radius);
  stage.requestDraw();
  const [x,y,z]=lab.centre;
  $('positionReadout').textContent=`MNI x ${fmt(x)} · y ${fmt(y)} · z ${fmt(z)} mm`;
  for(const [axis,id] of [[0,'posX'],[1,'posY'],[2,'posZ']])if(document.activeElement!==$(id))$(id).value=String(lab.centre[axis]);
  $('midlineNote').hidden=Math.abs(x)>=radiusOuter();
  schedulePanel();
}
function schedulePanel(){
  const wait=PANEL_MS-(performance.now()-panelAt);
  if(wait<=0){clearTimeout(panelTimer);panelTimer=0;renderPanel();}
  else if(!panelTimer)panelTimer=setTimeout(()=>{panelTimer=0;renderPanel();},wait);
}
function settle(){
  clearTimeout(panelTimer);panelTimer=0;renderPanel();
  clearTimeout(urlTimer);urlTimer=setTimeout(writeURL,250);
  clearTimeout(announceTimer);announceTimer=setTimeout(announce,ANNOUNCE_MS);
}
function setCentre(next,{source='control'}={}){
  const entry=layer();if(!entry)return;
  const centre=clampCentre(next,lab.hemi,entry.pack.extent);
  if(lab.centre&&centre.every((v,i)=>v===lab.centre[i]))return;
  lab.centre=centre;
  if(source!=='anchor')$('anchor').value='';
  applyGeometry();
}

function writeURL(){
  if(!lab.centre)return;
  const params=new URLSearchParams({hemi:lab.hemi,x:String(lab.centre[0]),y:String(lab.centre[1]),z:String(lab.centre[2]),r:String(lab.radius)});
  if(lab.marginOn)params.set('margin',String(lab.margin));
  if(testMode)params.set('test','1');
  history.replaceState(null,'',`${location.pathname}?${params}`);
}
function announce(){
  if(!lab.centre)return;
  const cut=lab.reached.filter(r=>r.cut>0);
  const where=`Sphere at x ${fmt(lab.centre[0])}, y ${fmt(lab.centre[1])}, z ${fmt(lab.centre[2])} millimetres, radius ${lab.radius}.`;
  $('announce').textContent=cut.length?`${where} It cuts ${plural(cut.length,'bundle')}: ${cut.slice(0,5).map(r=>bundleLabel(r.id)).join(', ')}${cut.length>5?', and more':''}.`:
    `${where} It cuts no sampled streamline.`;
}

// ---- Story: the HUD sentence and chips, built only from composeStory's closed templates ------

function runNode(run){
  switch(run.type){
    case 'number':return el('span',{className:'lab-story-number',textContent:run.text});
    case 'bundle':{const span=el('span',{className:'lab-story-bundle',textContent:run.text});span.dataset.group=run.group;return span;}
    case 'deficit':{const button=el('button',{type:'button',className:'lab-story-chip',textContent:run.text});
      button.addEventListener('click',()=>openEvidenceFor(run.id));return button;}
    case 'more':{const button=el('button',{type:'button',className:'lab-story-chip',textContent:run.text});
      button.addEventListener('click',()=>openDrawer());return button;}
    default:return document.createTextNode(run.text);
  }
}
function renderStory(entry,marginLines){
  lastStory=composeStory({rows:lab.rows,hemi:lab.hemi,radius:lab.radius,marginOn:lab.marginOn,margin:lab.margin,
    marginLines,totalLines:entry.pack.count});
  $('storyText').replaceChildren(...lastStory.runs.map(runNode));
}
// The desktop story card is capped to its grid row and scrolls; data-more fades its bottom edge
// while text remains below, so a cut-off line reads as "scroll for more", not as a clipped card.
function syncStoryMore(){
  const card=$('labStory');if(!card)return;
  card.dataset.more=String(card.scrollHeight-card.clientHeight-card.scrollTop>2);
}
if($('labStory')){
  $('labStory').addEventListener('scroll',syncStoryMore,{passive:true});
  new ResizeObserver(syncStoryMore).observe($('labStory'));
  new MutationObserver(syncStoryMore).observe($('storyText'),{childList:true,subtree:true,characterData:true});
}
function updateChips(bundles,linesCut,linesTotal){
  $('chipRadius').textContent=`${lab.radius} mm`;
  $('chipMargin').textContent=lab.marginOn?`${lab.margin} mm`:'Off';
  $('chipBundles').textContent=String(bundles);
  $('chipLines').textContent=count(linesCut);
  $('chipLinesTotal').textContent=count(linesTotal);
}
// A story chip names a bundle's first cited deficit; jump to that bundle's row and open it, the
// same target a reader would reach by scanning the drawer themselves.
function openEvidenceFor(id){
  openDrawer();
  const item=list.querySelector(`li[data-bundle="${id}"]`);
  if(!item)return;
  const details=item.querySelector('details');
  if(details)details.open=true;
  item.scrollIntoView({block:'nearest'});
}

// ---- Panel: summary, named deficits, one row per bundle reached ------------------------------

function rowFor(entry,index){
  const cache=rowsByHemi.get(lab.hemi)??new Map();rowsByHemi.set(lab.hemi,cache);
  if(cache.has(index))return cache.get(index);
  const bundle=entry.pack.bundles[index],{applying,other}=evidenceFor(bundle.id,lab.hemi);
  const name=el('span',{className:'lab-bundle-name',textContent:bundleLabel(bundle.id)});
  const counts=el('span',{className:'lab-bundle-count'});
  const bar=el('span',{className:'lab-bar'},el('span'),el('span'));bar.setAttribute('aria-hidden','true');
  const withPmid=applying.filter(c=>c.pmids.length).length;
  const evidence=el('span',{className:'lab-bundle-evidence',textContent:applying.length?
    `${plural(applying.length,'quoted statement')}${withPmid?` · ${count(withPmid)} with a PMID on the cited slide`:''}`:
    other.length?`No quoted evidence for a ${HEMI_NAME[lab.hemi]} hemisphere lesion`:'No quoted evidence'});
  if(!applying.length)evidence.dataset.none='true';
  const swatch=el('span',{className:'lab-swatch'});swatch.dataset.group=bundle.group;swatch.setAttribute('aria-hidden','true');
  const details=el('details',{className:'lab-bundle'},el('summary',{},swatch,name,counts,bar,evidence));
  details.dataset.group=bundle.group;
  const item=el('li',{},details);item.dataset.bundle=bundle.id;
  details.addEventListener('toggle',()=>{
    if(details.open&&!details.querySelector('.lab-bundle-body'))details.append(bundleBody(bundle,applying,other));
    openIndex=details.open?index:openIndex===index?-1:openIndex;setFocus();
  });
  item.addEventListener('pointerenter',()=>{focusIndex=index;setFocus();});
  item.addEventListener('pointerleave',()=>{if(focusIndex===index){focusIndex=-1;setFocus();}});
  const row={item,details,counts,bar};cache.set(index,row);return row;
}
function setFocus(){
  const entry=layer();if(!entry)return;
  const next=focusIndex>=0?focusIndex:openIndex;
  if(entry.shared.uFocus.value!==next){entry.shared.uFocus.value=next;stage.requestDraw();}
}

const SLIDES=cites=>cites.map(c=>c.replace(/^m/,'')).join(', ');
function fact(claim){
  const article=el('article',{className:'fact'},
    el('p',{className:'fact-rel'},claim.subject,' ',el('span',{className:'verb',textContent:VERBS.INJURY_CAUSES}),' ',claim.object));
  if(claim.condition==='bilateral')article.append(el('p',{className:'lab-tag',textContent:'Stated for bilateral damage'}));
  if(claim.condition==='dominant')article.append(el('p',{className:'lab-tag',textContent:'Stated for dominant-hemisphere damage'}));
  if(claim.site)article.append(el('p',{className:'lab-tag',textContent:`Where the notes place the injury: “${claim.site}”`}));
  if(claim.contested)article.append(el('p',{className:'contested',textContent:'Contested in the notes'}));
  article.append(el('blockquote',{},el('p',{textContent:claim.quote}),
    el('cite',{textContent:`Teaching notes · ${claim.section}${claim.cites.length?` · master slide${claim.cites.length>1?'s':''} ${SLIDES(claim.cites)}`:''}`})));
  const sources=el('p',{className:'lab-sources'});
  if(claim.sources.length){
    sources.append(`Listed on the cited slide${claim.cites.length>1?'s':''}:`);
    for(const source of claim.sources)sources.append(el('span',{},
      el('a',{href:`https://pubmed.ncbi.nlm.nih.gov/${source.pmid}/`,target:'_blank',rel:'noopener noreferrer',textContent:`PMID ${source.pmid}`}),
      ` · ${source.citation}`));
  }else sources.textContent=claim.cites.length?'No PMID on the cited slides.':'No slide or PMID recorded for this statement.';
  article.append(sources);
  return article;
}
function bundleBody(bundle,applying,other){
  const body=el('div',{className:'lab-bundle-body'});
  if(!applying.length)body.append(el('p',{textContent:other.length?
    `No quoted evidence for a ${HEMI_NAME[lab.hemi]} hemisphere lesion. The notes state the following for the other side only.`:
    'No quoted evidence. The connections graph quotes no statement about injury to this bundle.'}));
  for(const claim of applying)body.append(fact(claim));
  if(other.length){
    const otherSide=HEMI_NAME[lab.hemi==='L'?'R':'L'];
    body.append(el('div',{className:'lab-other'},el('p',{textContent:`Stated for a ${otherSide} hemisphere lesion`}),...other.map(fact)));
  }
  return body;
}

function renderPanel(){
  panelAt=performance.now();
  const entry=layer();if(!entry||!lab.centre)return;
  lab.rows=summarize(entry.pack,entry.state);
  const reached=lab.rows.map((row,index)=>({...row,index})).filter(r=>r.cut>0||r.margin>0)
    .sort((a,b)=>b.cut/b.total-a.cut/a.total||b.margin/b.total-a.margin/a.total||a.index-b.index);
  lab.reached=reached;
  const cutRows=reached.filter(r=>r.cut>0),cutLines=cutRows.reduce((n,r)=>n+r.cut,0),marginLines=reached.reduce((n,r)=>n+r.margin,0);
  const summary=$('labSummary');
  if(cutRows.length){
    summary.textContent=`Cuts ${plural(cutRows.length,'bundle')} · ${count(cutLines)} of ${count(entry.pack.count)} sampled streamlines`+
      (lab.marginOn&&marginLines?` · ${count(marginLines)} more within the ${lab.margin} mm margin`:'');
    delete summary.dataset.empty;
  }else{
    summary.textContent=lab.marginOn&&marginLines?
      `No sampled streamline passes through the sphere; ${count(marginLines)} run within the ${lab.margin} mm margin.`:
      'No sampled streamline passes through the sphere here. Move it into the white matter.';
    summary.dataset.empty='true';
  }
  lab.named=namedDeficits(lab.rows,lab.hemi);
  const named=$('namedList');
  // Bundle labels already contain " · left", so bundles are separated by commas.
  named.replaceChildren(...lab.named.map(n=>el('li',{},n.object,el('small',{textContent:
    [n.condition==='dominant'?'Dominant hemisphere':null,n.bundles.map(bundleLabel).join(', ')].filter(Boolean).join(' · ')}))));
  $('namedBlock').hidden=!lab.named.length;
  const items=reached.map(r=>{
    const row=rowFor(entry,r.index);
    row.counts.textContent=`${count(r.cut)} of ${count(r.total)} sampled streamlines cut (${percent(r.cut,r.total)})`+
      (r.margin?` · ${count(r.margin)} more within the margin`:'');
    row.bar.style.setProperty('--share',`${(r.cut/r.total*100).toFixed(1)}%`);
    row.bar.style.setProperty('--margin-share',`${(r.margin/r.total*100).toFixed(1)}%`);
    return row.item;
  });
  const current=[...list.children];
  if(current.length!==items.length||current.some((node,i)=>node!==items[i]))list.replaceChildren(...items);
  renderStory(entry,marginLines);
  updateChips(cutRows.length,cutLines,entry.pack.count);
}

// ---- Controls ---------------------------------------------------------------------------------

function setRanges(entry){
  const [lo,hi]=entry.pack.extent,down=v=>Math.floor(v*2)/2,up=v=>Math.ceil(v*2)/2;
  const x=lab.hemi==='L'?[down(lo[0]),0]:[0,up(hi[0])];
  for(const [id,[min,max]] of [['posX',x],['posY',[down(lo[1]),up(hi[1])]],['posZ',[down(lo[2]),up(hi[2])]]]){$(id).min=String(min);$(id).max=String(max);}
  const select=$('anchor');select.replaceChildren(el('option',{value:'',textContent:'Choose a bundle'}));
  for(const group of GROUPS){
    const members=entry.pack.bundles.map((b,index)=>({...b,index})).filter(b=>b.group===group)
      .sort((a,b)=>bundleLabel(a.id).localeCompare(bundleLabel(b.id)));
    if(members.length)select.append(el('optgroup',{label:group},...members.map(b=>el('option',{value:b.id,textContent:bundleLabel(b.id)}))));
  }
}
function anchorFor(entry,id){
  const index=entry.pack.bundles.findIndex(b=>b.id===id);if(index<0)return null;
  if(!entry.anchors.has(id))entry.anchors.set(id,bundleAnchor(entry.pack,index));
  return entry.anchors.get(id);
}
function setPressed(selector,value,attribute){for(const button of document.querySelectorAll(selector))button.setAttribute('aria-pressed',String(button.dataset[attribute]===value));}

async function showHemisphere(hemi,{first=false}={}){
  if(lab.loading)return;
  lab.loading=true;controls.disabled=true;
  try{
    const entry=await loadLayer(hemi);
    if(leaving)return;
    const previous=layer();
    if(previous&&previous!==entry){
      for(const object of previous.objects)stage.scene.remove(object);
      for(const row of rowsByHemi.get(lab.hemi)?.values()??[])row.details.open=false;
    }
    const mirrored=lab.centre&&lab.hemi!==hemi?[-lab.centre[0],lab.centre[1],lab.centre[2]]:lab.centre;
    lab.hemi=hemi;
    for(const object of entry.objects)if(!object.parent)stage.scene.add(object);
    scene.setHemisphere(hemi);
    $('stageLabel').textContent=`${HEMI_NAME[hemi][0].toUpperCase()}${HEMI_NAME[hemi].slice(1)} hemisphere · Grid 10 mm`;
    setPressed('[data-hemi]',hemi,'hemi');
    setRanges(entry);
    list.replaceChildren();focusIndex=-1;openIndex=-1;setFocus();
    lab.centre=null;
    const start=(first&&initial.centre)||mirrored||anchorFor(entry,`AF_${hemi}`);
    setCentre(start,{source:first&&!initial.centre?'anchor':'control'});
    if(first&&!initial.centre)$('anchor').value=`AF_${hemi}`;
    if(!first){scene.flyTo({view:hemi==='L'?'left':'right',tweenMs:350});setPressed('[data-view]','lateral','view');}
    settle();
    showStatus('');
  }finally{lab.loading=false;if(lab.ready)controls.disabled=false;}
}

function bindControls(){
  for(const button of document.querySelectorAll('[data-hemi]'))button.addEventListener('click',()=>{
    if(button.dataset.hemi!==lab.hemi)showHemisphere(button.dataset.hemi).catch(error=>fail(error));
  });
  for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{
    const view=button.dataset.view;
    scene.flyTo({view:view==='lateral'?(lab.hemi==='L'?'left':'right'):view,tweenMs:350});
  });
  const radius=$('radius'),margin=$('margin'),marginOn=$('marginOn');
  radius.addEventListener('input',()=>{lab.radius=Number(radius.value);$('radiusValue').textContent=`${lab.radius} mm`;applyGeometry();});
  marginOn.addEventListener('change',()=>{lab.marginOn=marginOn.checked;margin.disabled=!lab.marginOn;applyGeometry();settle();});
  margin.addEventListener('input',()=>{lab.margin=Number(margin.value);$('marginValue').textContent=`${lab.margin} mm`;applyGeometry();});
  for(const input of [radius,margin])input.addEventListener('change',settle);
  for(const [axis,id] of [[0,'posX'],[1,'posY'],[2,'posZ']]){
    const input=$(id);
    input.addEventListener('input',()=>{const next=[...lab.centre];next[axis]=Number(input.value);setCentre(next);});
    input.addEventListener('change',settle);
  }
  $('anchor').addEventListener('change',()=>{
    const value=$('anchor').value,entry=layer();if(!value||!entry)return;
    const point=anchorFor(entry,value);if(point){setCentre(point,{source:'anchor'});settle();}
  });
}

// ---- Evidence drawer, frame insets and the phone sheet -----------------------------------------
// setFrameInsets (atlas_scene.js) reframes the camera around whatever chrome currently overlaps the
// stage; every element that can move or resize that chrome re-measures it here (contract 5.1/8).

function updateInsets(){
  if(!scene)return;
  const stageRect=stageEl.getBoundingClientRect();
  let insets;
  if(innerWidth<=700){
    const chipsRect=chipsEl.getBoundingClientRect(),dockRect=dock.getBoundingClientRect(),scopeRect=scopeEl.getBoundingClientRect();
    insets={top:chipsRect.bottom-stageRect.top+8,left:8,right:8,
      bottom:stageRect.bottom-Math.min(dockRect.top,scopeRect.top)+8};
  }else{
    // Frame the free middle column: left clears whichever of the title/story column runs wider,
    // bottom clears the label row (stageLabel/scope, whichever sits higher), right clears the
    // controls rail unless the drawer has slid over it (contract 5.1/8, reviewer correction 2).
    const titleRect=hudTitle.getBoundingClientRect(),storyRect=storyEl.getBoundingClientRect(),
      controlsRect=controls.getBoundingClientRect(),labelRect=stageLabelEl.getBoundingClientRect(),scopeRect=scopeEl.getBoundingClientRect();
    insets={top:32,left:Math.max(titleRect.right,storyRect.right)-stageRect.left+8,
      bottom:stageRect.bottom-Math.min(labelRect.top,scopeRect.top)+8,
      right:drawer.inert?stageRect.right-controlsRect.left+8:drawer.getBoundingClientRect().width};
  }
  lastInsets=insets;
  scene.setFrameInsets(insets);
}
function openDrawer(){
  if(!drawer.inert)return;
  drawerReturnFocus=document.activeElement;
  drawer.inert=false;
  $('openEvidence').setAttribute('aria-expanded','true');
  $('drawerTitle').focus();
  updateInsets();
}
function closeDrawer(){
  if(drawer.inert)return;
  drawer.inert=true;
  $('openEvidence').setAttribute('aria-expanded','false');
  (drawerReturnFocus&&document.body.contains(drawerReturnFocus)?drawerReturnFocus:$('openEvidence')).focus();
  drawerReturnFocus=null;
  updateInsets();
}
function setSheet(stateName){
  dock.dataset.sheet=stateName;
  sheetHandle.setAttribute('aria-expanded',String(stateName==='expanded'));
  updateInsets();
}
function bindDrawer(){
  $('openEvidence').addEventListener('click',openDrawer);
  $('closeEvidence').addEventListener('click',closeDrawer);
  sheetHandle.addEventListener('click',()=>setSheet(dock.dataset.sheet==='expanded'?'peek':'expanded'));
  setSheet('peek');
  // The drawer's slide and the sheet's peek/expand both move by `transform`, which never fires
  // ResizeObserver (border-box size is unchanged); reframe explicitly once each finishes moving.
  insetsObserver=new ResizeObserver(updateInsets);
  for(const target of [stageEl,hudTitle,consoleEl,dock,controls,storyEl,stageLabelEl,scopeEl])insetsObserver.observe(target);
  for(const target of [dock,drawer])target.addEventListener('transitionend',event=>{if(event.propertyName==='transform')updateInsets();});
  updateInsets();
}

// ---- Drag: capture-phase listeners on the mount run before OrbitControls and the scene's picking --

const dragTmp={};
function localPoint(event,rect=mount.getBoundingClientRect()){return {x:event.clientX-rect.left,y:event.clientY-rect.top};}
function onSphere(point,pointerType){
  if(!ringScreen)return false;
  const slack=pointerType==='touch'?22:12;
  return Math.hypot(point.x-ringScreen.x,point.y-ringScreen.y)<=ringScreen.r+slack;
}
function rayHit(point,target){
  const {Vector2}=THREE,t=dragTmp,{w,h}=rings.size;
  t.ndc??=new Vector2();t.ray??=new THREE.Raycaster();
  t.ndc.set(point.x/w*2-1,-(point.y/h)*2+1);t.ray.setFromCamera(t.ndc,stage.camera);
  return t.ray.ray.intersectPlane(t.plane,target);
}
function setCursor(value){if(value)mount.dataset.lesion=value;else delete mount.dataset.lesion;}
function bindDrag(){
  mount.addEventListener('pointerdown',event=>{
    if(drag){event.stopPropagation();event.preventDefault();return;}
    if(!lab.ready||lab.loading||event.button!==0)return;
    const rect=mount.getBoundingClientRect(),point=localPoint(event,rect);
    if(!onSphere(point,event.pointerType))return;
    event.stopPropagation();event.preventDefault();
    const {Vector3,Plane}=THREE,t=dragTmp;
    t.normal??=new Vector3();t.hit??=new Vector3();t.offset??=new Vector3();t.plane??=new Plane();
    stage.camera.getWorldDirection(t.normal);
    t.plane.setFromNormalAndCoplanarPoint(t.normal,new Vector3().fromArray(lab.centre));
    if(!rayHit(point,t.hit))return;
    t.offset.fromArray(lab.centre).sub(t.hit);
    drag={pointerId:event.pointerId,rect};
    // Holding the auto-frame camera fit for the drag's duration keeps the view still while this
    // panel's own live readouts (MNI coordinates, the story sentence) update and reflow; see the
    // matching note at atlas_scene.js's resize(). Only OUR sphere drag needs this; CameraControls'
    // own orbit drag already disables auto-frame via its own controlstart handler.
    mount.setPointerCapture(event.pointerId);setCursor('drag');stage.setInteracting(true);stage.setFrameHold(true);
  },true);
  mount.addEventListener('pointermove',event=>{
    if(drag){
      event.stopPropagation();
      if(event.pointerId!==drag.pointerId)return;
      event.preventDefault();
      const t=dragTmp;if(!rayHit(localPoint(event,drag.rect),t.hit))return;
      t.hit.add(t.offset);setCentre([t.hit.x,t.hit.y,t.hit.z],{source:'drag'});
      return;
    }
    // Without a button pressed, the atlas would hover-pick cortex parcels; the lab has none to show.
    if(event.buttons===0&&event.pointerType!=='touch'){
      event.stopPropagation();
      const next=lab.ready&&onSphere(localPoint(event),event.pointerType);
      if(next!==hover){hover=next;setCursor(hover?'hover':null);}
    }
  },true);
  const end=event=>{
    if(!drag||event.pointerId!==drag.pointerId)return;
    event.stopPropagation();drag=null;
    setCursor(hover?'hover':null);stage.setInteracting(false);stage.setFrameHold(false);stage.requestDraw();settle();
  };
  for(const type of ['pointerup','pointercancel','lostpointercapture'])mount.addEventListener(type,end,true);
  mount.addEventListener('pointerleave',()=>{if(!drag&&hover){hover=false;setCursor(null);}});
}

// ---- Evidence notes and the test hook -----------------------------------------------------------

function fillNotes(){
  const [year,month,day]=EVIDENCE_SOURCES.pmidsResolved.split('-').map(Number);
  const checked=new Date(Date.UTC(year,month-1,day)).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
  $('pmidNote').textContent=`${count(CLAIMS_WITH_PMID)} of ${count(CLAIMS.length)} statements cite a slide that lists a PMID; the others say so where they appear. `+
    `PMIDs are the ones listed on the cited slide. Each was checked to exist at NCBI on ${checked}; the papers were not re-read against each sentence.`;
  $('unplacedNote').textContent=`${plural(UNPLACED_CLAIMS,'statement')} about the sagittal stratum and the temporal stem ${UNPLACED_CLAIMS===1?'is':'are'} not placed, because the atlas has no single bundle for either.`;
  $('provenance').textContent=`Statements: ${EVIDENCE_SOURCES.graph}. Slides and PMIDs: ${EVIDENCE_SOURCES.deck}.`;
}

// Screen-space bounding box of the cortex shell (whichever meshes atlas_scene.js marks as the
// cortex render role), found by unioning their world-space boxes and projecting all 8 corners
// through the live camera; same NDC-to-viewport mapping the sphere silhouette (silhouette(), above)
// already uses. Test-only: the layout gate (tests/perf/lesion_lab.mjs) checks the brain still fills
// the frame and never spills under the phone sheet peek.
function computeBrainRect(){
  if(!stage||!THREE)return null;
  // A hemisphere is hidden by clearing its GROUP's `visible` (atlas_scene.js setHemisphere), never
  // the shell mesh's own flag, so node.visible alone reads true for a hidden hemisphere's shell too;
  // walk the ancestor chain (matches computeViewTarget's own frameGeometry.filter on host.group.visible).
  const effectivelyVisible=node=>{for(let o=node;o;o=o.parent)if(!o.visible)return false;return true;};
  const rect=mount.getBoundingClientRect();
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,found=false;
  const world=new THREE.Vector3();
  stage.scene.traverse(node=>{
    if(node.material?.userData?.renderRole!=='atlas-cortex'||!effectivelyVisible(node)||!node.geometry)return;
    // Project every vertex (world space), not a world-axis-aligned box's 8 corners: computeViewTarget
    // itself fits the camera to the mesh's actual points, and under an oblique view the camera's
    // right/up basis is not aligned with world X/Y/Z, so an AABB's corners are phantom points off the
    // brain surface that overstate the true screen silhouette. Mirror the production fit exactly.
    node.updateWorldMatrix(true,false);
    const pos=node.geometry.attributes.position;
    for(let i=0;i<pos.count;i++){
      world.fromBufferAttribute(pos,i).applyMatrix4(node.matrixWorld).project(stage.camera);
      const x=rect.left+(world.x+1)/2*rect.width,y=rect.top+(1-world.y)/2*rect.height;
      if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
      found=true;
    }
  });
  if(!found)return null;
  return {left:minX,top:minY,right:maxX,bottom:maxY,width:maxX-minX,height:maxY-minY};
}

if(testMode)Object.defineProperty(window,'__lesionLabTest',{get:()=>{
  const rect=mount.getBoundingClientRect(),entry=layer(),sr=stageEl.getBoundingClientRect();
  return {ready:lab.ready,error:lab.error,slow:lab.slow,loading:lab.loading,hemi:lab.hemi,centre:lab.centre&&[...lab.centre],radius:lab.radius,
    marginOn:lab.marginOn,margin:lab.margin,rows:lab.rows.filter(r=>r.cut||r.margin).map(r=>({...r})),named:lab.named.map(n=>n.object),
    sphere:ringScreen?{x:rect.left+ringScreen.x,y:rect.top+ringScreen.y,r:ringScreen.r}:null,count:entry?.pack.count??0,
    extent:entry?entry.pack.extent.map(v=>[...v]):null,classifyMs:lab.classifyMs,classifyMax:lab.classifyMax,dragging:!!drag,
    scene:scene?(({frames,view,hemisphere,camera,render})=>({frames,view,hemisphere,camera,pipeline:render.pipeline}))(scene.state):null,
    story:lastStory,insets:lastInsets,sheet:innerWidth<=700?(dock.dataset.sheet||'peek'):null,drawer:!drawer.inert,
    frame:lastInsets?{left:sr.left+lastInsets.left,top:sr.top+lastInsets.top,right:sr.right-lastInsets.right,bottom:sr.bottom-lastInsets.bottom}:null,
    brainRect:computeBrainRect()};
}});
if(testMode)window.__lesionLabResetStats=()=>{lab.classifyMax=0;};

addEventListener('pagehide',event=>{
  if(event.persisted)return;
  leaving=true;rings?.observer.disconnect();insetsObserver?.disconnect();
  for(const entry of layers.values())disposeLayer(entry);layers.clear();
  scene?.dispose();scene=null;stage=null;
});

// ---- Start --------------------------------------------------------------------------------------

fillNotes();
$('radius').value=String(lab.radius);$('radiusValue').textContent=`${lab.radius} mm`;
$('marginOn').checked=lab.marginOn;$('margin').disabled=!lab.marginOn;$('margin').value=String(lab.margin);$('marginValue').textContent=`${lab.margin} mm`;
(async()=>{
  const slow=setTimeout(()=>{if(!lab.ready&&!lab.error)fail(new Error('Atlas load exceeded 30 s'),{slow:true});},SLOW_MS);
  try{
    const [sceneModule,three,data]=await Promise.all([import('./atlas_scene.js?v=lesion-20260926-1'),import('three'),import('./atlas_data.js')]);
    THREE=three;decodeAtlasBundle=data.decodeAtlasBundle;
    const created=await sceneModule.createAtlasScene(mount,{
      hover:false,
      // Before the lab is ready its own loading messages lead, and the scene's "Atlas ready" is not the lab's.
      onStatus(message,detail){
        if(lab.ready)showStatus(detail?.ready?'':message);
        else if(!detail?.ready&&!lab.slow&&!lab.error)showStatus(message);
      },
      onView({view}){
        lab.view=view==='left'||view==='right'?'lateral':view;
        setPressed('[data-view]',lab.view,'view');$('viewStatus').textContent=VIEW_NAMES[lab.view]||VIEW_NAMES.free;
      }});
    if(leaving){created.dispose();return;}
    scene=created;stage=scene.stage;
    if(!stage)throw Error('This atlas build does not expose the lab stage');
    scene.setProfile('presenter');scene.setPlaying(false);scene.setDeep(false);scene.setSurface(.14);scene.setHemisphere(lab.hemi);
    scene.flyTo({view:'oblique',tweenMs:0});
    createSphere();
    await showHemisphere(lab.hemi,{first:true});
    if(leaving)return;
    bindControls();bindDrag();bindDrawer();
    lab.ready=true;lab.slow=false;controls.disabled=false;$('retryScene').hidden=true;showStatus('');
    stage.requestDraw();
  }catch(error){fail(error);}
  finally{clearTimeout(slow);}
})();
