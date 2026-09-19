import {BUNDLE_TINTS,MAX_BUNDLES} from './bundle_picker.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {ATLAS_VIEWS,decodeAtlasLabels,decodeAtlasBundle} from './atlas_data.js';
import {paletteUnit,YEO7_SET,networkSelection} from './atlas_networks.js';
import {ARTERIAL_SET,arterialTable,arterialPaletteUnit,arterialSelection} from './atlas_arterial.js';
import {configContextMaterial} from './scene_materials.js';
import {createRenderPipeline} from './render_pipeline.js';
import {createCorridorOverlay} from './corridor_overlay.js';
import {createTractRangeLoader} from './tract_ranges.js';
const MANIFEST_SHA256='4d03204569136df62809aef15fa3778e5d631270005d6f2739afd3c475f2494d';
const sha256=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');

// Discrete parcel identity, separate from the published network palette.
// All fills use the installed triangle/label correspondence; no generated surface.
const CORTEX_TINTS={neutral:0xaaa09c,focus:0x9be1f0,context:0xdcc39a,hover:0xf6ede6};

/** Owns one reference scene. Its inputs never include a case result or mask. */
export async function createAtlasScene(mount,{onPick=()=>{},onHover=()=>{},onStatus=()=>{},onInteraction=()=>{},onView=()=>{}}={}) {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const scene=new THREE.Scene();
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  // Bug fix: fill-rate cost on a high-DPI phone GPU is too high at 3x; cap at 2x below a 700px
  // viewport (matches the codebase's other 700px breakpoint, hodos.css:680), keep 3x above it.
  // This initial call only covers the instant before the first resize; the real, live-updating
  // cap lives in resize() below, since render_pipeline.js's own quality config is fixed at
  // pipeline-creation time and cannot be re-passed per resize.
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?2:3));renderer.setClearColor(0x070c12,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.localClippingEnabled=true;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  renderer.domElement.setAttribute('aria-label','Interactive HCP reference atlas');
  renderer.domElement.setAttribute('aria-describedby','canvasHelp');renderer.domElement.tabIndex=0;
  mount.append(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(35,1,.1,2000);camera.up.set(0,0,1);
  const pipeline=createRenderPipeline(renderer,{THREE,scene,camera,aoRadiusMm:7,aoStrength:.7,
    maxPixelRatio:3,maxPixels:8000000,interactiveMaxPixelRatio:1.5,interactiveMaxPixels:2400000});
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=!reduced.matches;controls.dampingFactor=.12;controls.enablePan=true;
  controls.minDistance=150;controls.maxDistance=900;
  scene.add(new THREE.AmbientLight(0xf8eff5,.55));
  const light=new THREE.DirectionalLight(0xfff4e7,2.7);light.position.set(-200,120,260);scene.add(light);
  const fill=new THREE.DirectionalLight(0xe4e0f3,1.25);fill.position.set(200,-180,120);scene.add(fill);
  const centre=new THREE.Vector3(0,-18,8),hemis={},deep=[],bundles=new Map(),frameGeometry=[];
  let playing=false,profile='teaching',frame=0,last=0,time=0,disposed=false,view='left';
  let selected=null,highlighted=[],visibleHemi='both',surface=.6,deepVisible=false,framed=false,autoFrame=true;
  let deepHighlightIds=[],deepFocusIds=[],cameraTween=null,frameFocus=false;
  let corridorOverlay=null;
  let annotations=[],annotationStamp='',annotationTime=-Infinity;
  const annotationLayer=document.createElement('div');annotationLayer.className='atlas-annotations';
  annotationLayer.setAttribute('role','list');annotationLayer.setAttribute('aria-label','Labelled atlas structures');
  const svgNS='http://www.w3.org/2000/svg',leaders=document.createElementNS(svgNS,'svg');
  leaders.classList.add('atlas-leaders');leaders.setAttribute('aria-hidden','true');
  mount.append(leaders,annotationLayer);
  const orientation=document.createElementNS(svgNS,'svg');orientation.setAttribute('viewBox','0 0 80 80');orientation.classList.add('atlas-orientation');
  orientation.setAttribute('role','img');orientation.setAttribute('aria-label','Anatomical orientation: right, left, anterior, posterior, superior and inferior');
  const axes=[];
  for(const [axis,positive,negative] of [[new THREE.Vector3(1,0,0),'R','L'],[new THREE.Vector3(0,1,0),'A','P'],[new THREE.Vector3(0,0,1),'S','I']]){
    const line=document.createElementNS(svgNS,'line'),a=document.createElementNS(svgNS,'text'),b=document.createElementNS(svgNS,'text');
    a.textContent=positive;b.textContent=negative;orientation.append(line,a,b);axes.push({axis,line,a,b});
  }
  mount.append(orientation);let viewStamp='';
  function updateOrientation(){
    const inverse=camera.quaternion.clone().invert();
    for(const {axis,line,a,b} of axes){const p=axis.clone().applyQuaternion(inverse),x=p.x*25,y=-p.y*25;
      line.setAttribute('x1',String(40-x));line.setAttribute('y1',String(40-y));line.setAttribute('x2',String(40+x));line.setAttribute('y2',String(40+y));
      for(const [text,sign] of [[a,1],[b,-1]]){text.setAttribute('x',String(40+sign*x*1.2));text.setAttribute('y',String(40+sign*y*1.2));
        // When an axis points at the viewer, show its near end once.
        text.style.opacity=Math.hypot(x,y)<7&&sign*p.z<0?'0':'1';}
    }
    const next=`${visibleHemi}:${autoFrame?view:'free'}`;
    if(next!==viewStamp){viewStamp=next;onView({hemisphere:visibleHemi,view:autoFrame?view:'free'});}
  }
  const traces=[];let frames=0,contextLost=false;
  const bundleIdsBy=ghost=>[...bundles].filter(([,v])=>v.ghost===ghost).map(([id])=>id);
  function draw(now=0){
    frame=0;if(disposed||contextLost)return;
    const moving=playing&&profile==='teaching'&&!reduced.matches&&!document.hidden;
    if(moving&&last)time+=Math.min((now-last)/1000,.05);
    last=moving?now:0;
    for(const trace of traces)trace.material.uniforms.time.value=time;
    const changed=controls.update();pipeline.render();updateAnnotations(now);updateOrientation();corridorOverlay?.update(camera);frames++;
    if(moving||changed)requestDraw();
  }
  function requestDraw(){if(!frame&&!disposed&&!contextLost)frame=requestAnimationFrame(draw);}
  controls.addEventListener('change',requestDraw);
  controls.addEventListener('start',()=>{cameraTween=null;autoFrame=false;pipeline.setInteracting(true);onInteraction();});
  controls.addEventListener('end',()=>{pipeline.setInteracting(false);annotationStamp='';requestDraw();});
  reduced.addEventListener('change',requestDraw);
  document.addEventListener('visibilitychange',requestDraw);
  // A lost WebGL context (GPU switch, backgrounded mobile tab) pauses the loop and says so;
  // three.js re-initialises its state on restore, so the scene is redrawn rather than left blank.
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;cancelAnimationFrame(frame);frame=0;
    onStatus('Graphics context lost. Waiting for the browser to restore it; reload if the atlas stays blank.');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;annotationStamp='';resize();onStatus('Atlas ready',{ready:true});requestDraw();});
  const resize=()=>{const w=mount.clientWidth,h=mount.clientHeight;
    if(w<=0||h<=0)return;camera.aspect=w/h;camera.updateProjectionMatrix();
    // Bug fix (continued from the renderer.setPixelRatio call above): render_pipeline.js resolves
    // its own pixel ratio as min(dpr, maxPixelRatio, budgetRatio), and maxPixelRatio is fixed to 3
    // at pipeline creation with no per-resize override. Pre-clamping the dpr argument itself below
    // 700px viewport width achieves the same 2x cap without needing to touch render_pipeline.js.
    // Verified empirically: at 390px width with a forced 3x device pixel ratio, the live canvas
    // rendered at an uncapped 3x before this change and at 2x after it.
    pipeline.resize(w,h,Math.min(devicePixelRatio,innerWidth<700?2:3));
    annotationStamp='';
    if(framed&&autoFrame){
      if(cameraTween){const target=computeViewTarget(view,cameraTween.zoom,frameFocus);
        cameraTween.target.position.copy(target.position);cameraTween.target.centre.copy(target.centre);
      }else{const target=computeViewTarget(view,1,frameFocus);camera.position.copy(target.position);controls.target.copy(target.centre);controls.update();}
    }requestDraw();};
  const observer=new ResizeObserver(resize);observer.observe(mount);
  function disposeBase(){disposed=true;cameraTween=null;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();
    reduced.removeEventListener('change',requestDraw);reduced.removeEventListener('change',motionChanged);document.removeEventListener('visibilitychange',requestDraw);
    pipeline.dispose();renderer.dispose();renderer.domElement.remove();annotationLayer.remove();leaders.remove();orientation.remove();}
  resize();
  // Shared frustum-fit math for an instant cut (setView) and an animated flight (flyTo).
  function focusPoints(){
    const result=[],named=[...(selected?[selected]:[]),...highlighted],p=new THREE.Vector3();
    for(const h of ['L','R']){const host=hemis[h];if(!host?.group.visible)continue;
      const ids=new Set(named.filter(r=>r.hemi===h||r.hemi==='both').map(r=>r.id)),pos=host.geo.attributes.position;
      for(let i=0;i<pos.count;i++)if(ids.has(labels[h][i]))result.push(p.fromBufferAttribute(pos,i).clone());
    }
    for(const {group,ghost} of bundles.values())if(!ghost){const pos=group.children[0].geometry.attributes.position;
      for(let i=0;i<pos.count;i++)result.push(p.fromBufferAttribute(pos,i).clone());}
    for(const mesh of deep)if(mesh.visible&&deepHighlightIds.includes(mesh.userData.id)){
      const pos=mesh.geometry.attributes.position;for(let i=0;i<pos.count;i++)result.push(p.fromBufferAttribute(pos,i).clone());}
    return result;
  }
  function computeViewTarget(key,zoom=1,focus=false) {
    const resolved=key in ATLAS_VIEWS?key:'left';
    const direction=new THREE.Vector3(...ATLAS_VIEWS[resolved]);
    if(resolved==='medial'&&visibleHemi==='R')direction.x*=-1;
    direction.normalize();
    const right=new THREE.Vector3().crossVectors(camera.up,direction).normalize();
    const up=new THREE.Vector3().crossVectors(direction,right).normalize();
    const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tanH=tanV*camera.aspect;
    const geometries=framed?frameGeometry.filter(geo=>!Object.values(hemis).some(h=>h.geo===geo&&!h.group.visible)):frameGeometry;
    const points=focus?focusPoints():[],focusing=points.length>0;
    const origin=focusing?new THREE.Box3().setFromPoints(points).getCenter(new THREE.Vector3()):centre;
    let minR=Infinity,maxR=-Infinity,minU=Infinity,maxU=-Infinity;const p=new THREE.Vector3();
    const eachPoint=fn=>{if(focusing){for(const point of points)fn(p.copy(point));}
      else for(const geo of geometries){const pos=geo.attributes.position;for(let i=0;i<pos.count;i++)fn(p.fromBufferAttribute(pos,i));}};
    eachPoint(p=>{p.sub(origin);const r=p.dot(right),u=p.dot(up);
      minR=Math.min(minR,r);maxR=Math.max(maxR,r);minU=Math.min(minU,u);maxU=Math.max(maxU,u);});
    const targetCentre=origin.clone();
    if(Number.isFinite(minR))targetCentre.addScaledVector(right,(minR+maxR)/2).addScaledVector(up,(minU+maxU)/2);
    let distance=focusing?160:250;
    eachPoint(p=>{p.sub(targetCentre);distance=Math.max(distance,p.dot(direction)+Math.abs(p.dot(up))/tanV,
      p.dot(direction)+Math.abs(p.dot(right))/tanH);});
    distance=distance*(focusing?1.28:1.08)/Math.max(zoom,.1);
    return {view:resolved,centre:targetCentre,position:targetCentre.clone().addScaledVector(direction,distance)};
  }
  function setView(key='left') {
    cameraTween=null;frameFocus=false;
    const target=computeViewTarget(key,1);
    view=target.view;camera.position.copy(target.position);autoFrame=true;
    controls.target.copy(target.centre);controls.update();requestDraw();
  }
  const easeInOutQuad=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  /** Animate the camera to a named view; prefers-reduced-motion jumps instantly. */
  function flyTo({view:key='left',zoom=1,tweenMs=900,focus=false}={}) {
    frameFocus=focus;
    const target=computeViewTarget(key,zoom,focus);
    view=target.view;autoFrame=zoom<=1;
    if(reduced.matches||tweenMs<=0){
      cameraTween=null;camera.position.copy(target.position);controls.target.copy(target.centre);
      controls.update();requestDraw();return;
    }
    const fromPosition=camera.position.clone(),fromTarget=controls.target.clone(),start=performance.now();
    const token=cameraTween={target,zoom,start,duration:tweenMs};
    function step(now){
      if(cameraTween!==token||disposed)return;
      if(reduced.matches){motionChanged();return;}
      const t=Math.min(1,(now-start)/tweenMs),eased=easeInOutQuad(t);
      camera.position.lerpVectors(fromPosition,target.position,eased);
      controls.target.lerpVectors(fromTarget,target.centre,eased);
      controls.update();requestDraw();
      if(t<1)requestAnimationFrame(step);else cameraTween=null;
    }
    requestAnimationFrame(step);
  }
  function motionChanged(){
    controls.enableDamping=!reduced.matches;
    if(reduced.matches&&cameraTween){const target=cameraTween.target;cameraTween=null;
      camera.position.copy(target.position);controls.target.copy(target.centre);controls.update();}
    requestDraw();
  }
  reduced.addEventListener('change',motionChanged);
  renderer.domElement.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_','Home'].includes(event.key))return;
    event.preventDefault();cameraTween=null;onInteraction();
    if(event.key==='Home'){setView(view);return;}
    autoFrame=false;
    const offset=camera.position.clone().sub(controls.target),right=new THREE.Vector3().crossVectors(camera.up,offset).normalize();
    if(event.shiftKey&&event.key.startsWith('Arrow')){
      const up=new THREE.Vector3().crossVectors(offset,right).normalize(),shift=new THREE.Vector3();
      shift.addScaledVector(event.key==='ArrowLeft'||event.key==='ArrowRight'?right:up,
        (event.key==='ArrowRight'||event.key==='ArrowUp'?1:-1)*offset.length()*.025);
      controls.target.add(shift);camera.position.add(shift);
    }else{
      if(event.key==='ArrowLeft'||event.key==='ArrowRight')offset.applyAxisAngle(camera.up,(event.key==='ArrowRight'?1:-1)*Math.PI/18);
      else if(event.key==='ArrowUp'||event.key==='ArrowDown')offset.applyAxisAngle(right,(event.key==='ArrowUp'?1:-1)*Math.PI/18);
      else offset.setLength(Math.max(controls.minDistance,Math.min(controls.maxDistance,offset.length()*(['+','='].includes(event.key)?.9:1.1))));
      camera.position.copy(controls.target).add(offset);
    }
    controls.update();requestDraw();
  });
  setView();onStatus('Loading the reference atlas…');
  let manifest;
  try{
    const metaResponse=await fetch(`./atlas/manifest.json?v=${MANIFEST_SHA256.slice(0,12)}`);
    if(!metaResponse.ok)throw new Error(`Atlas manifest unavailable (${metaResponse.status})`);
    const manifestBytes=await metaResponse.arrayBuffer();
    if(await sha256(manifestBytes)!==MANIFEST_SHA256)throw new Error('Atlas manifest integrity failed');
    manifest=JSON.parse(new TextDecoder().decode(manifestBytes));
  }catch(error){disposeBase();throw error;}
  async function checked(path){
    const record=manifest.assets.find(a=>a.path===path);if(!record)throw new Error('Unlisted atlas asset');
    const response=await fetch(`./atlas/${path}?v=${record.sha256.slice(0,12)}`);if(!response.ok)throw new Error(`Atlas asset unavailable: ${path}`);
    const bytes=await response.arrayBuffer();
    const hash=await sha256(bytes);
    if(hash!==record.sha256||bytes.byteLength!==record.bytes)throw new Error(`Atlas asset integrity failed: ${path}`);
    return bytes;
  }
  const json=async path=>JSON.parse(new TextDecoder().decode(await checked(path)));
  const draco=new DRACOLoader();draco.setDecoderPath('./vendor/addons/libs/draco/gltf/');draco.setWorkerLimit(2);
  const loader=new GLTFLoader();loader.setDRACOLoader(draco);
  async function geometry(path){
    const gltf=await loader.parseAsync(await checked(path),'');
    const mesh=gltf.scene.getObjectByProperty('isMesh',true);if(!mesh)throw new Error('Empty atlas mesh');
    gltf.scene.updateMatrixWorld(true);
    const geo=mesh.geometry;geo.applyMatrix4(mesh.matrixWorld);geo.computeVertexNormals();
    mesh.material?.dispose();return geo;
  }
  let surfaceMeta,tractMeta,tractRangeLoader,labels,networks=null,sub,bundleError='';
  let networkSel=networkSelection('off'),arterialSel=arterialSelection('off'),arterial=null,arterialRows=[];
  try {
    onStatus('Loading the reference atlas · cortical surface…');
    // Pathway metadata is small; bundle bytes are fetched by range when a scene needs them.
    const pathways=Promise.all([json('tracts.json'),json('tracts-ranges.json')]);pathways.catch(()=>{});
    const [left,right,labelBuffer,surfaceJson]=await Promise.all([geometry('cortex-L.glb'),geometry('cortex-R.glb'),checked('surface-labels.bin'),json('surface.json')]);
    surfaceMeta=surfaceJson;
    const counts=[left.attributes.position.count,right.attributes.position.count];
    labels=decodeAtlasLabels(surfaceMeta,labelBuffer,counts,'glasser');
    // Yeo-7 rides the same vertex order; absent set → networks stay off, never guessed.
    networks=surfaceMeta.sets?.[YEO7_SET]?decodeAtlasLabels(surfaceMeta,labelBuffer,counts,YEO7_SET):null;
    // Arterial territories ride the same vertex order; absent set → the control stays disabled.
    arterialRows=arterialTable(surfaceMeta);
    arterial=surfaceMeta.sets?.[ARTERIAL_SET]?decodeAtlasLabels(surfaceMeta,labelBuffer,counts,ARTERIAL_SET):null;
    const palette=paletteUnit();
    for(const [i,h] of ['L','R'].entries()) {
      const geo=[left,right][i],count=geo.attributes.position.count;
      geo.setAttribute('selected',new THREE.BufferAttribute(new Float32Array(count),1));
      const netIds=new Float32Array(count),netRgb=new Float32Array(count*3);
      for(let v=0;v<count;v++){const id=networks?networks[h][v]:0;netIds[v]=id;const c=palette[id]||palette[0];netRgb.set(c,v*3);}
      geo.setAttribute('network',new THREE.BufferAttribute(netIds,1));
      geo.setAttribute('netColor',new THREE.BufferAttribute(netRgb,3));
      geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(count*3),3));
      const shell=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,
        roughness:.86,metalness:0,side:THREE.DoubleSide}));
      shell.material.userData.renderRole='atlas-cortex';
      const group=new THREE.Group();group.add(shell);scene.add(group);
      hemis[h]={geo,shell,group,count};
      frameGeometry.push(geo);
    }
    {const bounds=new THREE.Box3();for(const geo of frameGeometry){geo.computeBoundingBox();bounds.union(geo.boundingBox);}bounds.getCenter(centre);}
    framed=true;resize();setView();requestDraw();
    onStatus('Loading the reference atlas · pathway index…');
    const [pathwayData,contextGeometry]=await Promise.all([pathways,geometry('inferior-context.glb')]);
    const tractIndex=pathwayData[1],tractBin=manifest.assets.find(asset=>asset.path==='tracts.bin'),tractJson=manifest.assets.find(asset=>asset.path==='tracts.json');
    [tractMeta]=pathwayData;
    tractRangeLoader=createTractRangeLoader({url:`./atlas/tracts.bin?v=${tractBin.sha256.slice(0,12)}`,bin:tractBin,index:tractIndex,metadata:tractJson,bundleMeta:tractMeta.bundles});
    onStatus('Loading the reference atlas · deep structures…');
    const context=new THREE.Mesh(contextGeometry,new THREE.MeshStandardMaterial({
      color:0x8e8794,roughness:.8,side:THREE.DoubleSide,
      clippingPlanes:[new THREE.Plane(new THREE.Vector3(0,0,-1),0)]}));
    configContextMaterial(context.material,{THREE,opacity:.12});
    scene.add(context);
    frameGeometry.push(context.geometry);
    const bounds=new THREE.Box3();for(const geo of frameGeometry){geo.computeBoundingBox();bounds.union(geo.boundingBox);}bounds.getCenter(centre);
    sub=await json('subcortex.json');
    const deepColours={THA:0xc69d71,HIP:0x68afae,AMY:0xd28b90,PUT:0xa19dbb,CAU:0x829eba,GP:0xb5ab78,NAc:0xc39178};
    await Promise.all(sub.structures.map(async entry=>{
      const mesh=new THREE.Mesh(await geometry(entry.mesh),new THREE.MeshStandardMaterial({
        color:deepColours[entry.id.split('-')[0]],roughness:.5,transparent:true,opacity:.7,depthWrite:false}));
      mesh.visible=false;mesh.userData={...entry,kind:'deep'};scene.add(mesh);deep.push(mesh);
    }));
  } catch(error){
    scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});draco.dispose();disposeBase();throw error;
  }
  let hoverPick=null,boundaryIdentity='';
  const parcelNetworkCache=new Map();
  /** {id, share} of the most frequent Yeo-7 label across a parcel's vertices, or null. */
  function parcelNetwork(hemi,id){
    if(!networks||!(hemi in hemis)||id===0)return null;
    const key=`${hemi}:${id}`;if(parcelNetworkCache.has(key))return parcelNetworkCache.get(key);
    const counts=new Map();let total=0;
    for(let i=0;i<labels[hemi].length;i++){if(labels[hemi][i]!==id)continue;total++;const n=networks[hemi][i];counts.set(n,(counts.get(n)||0)+1);}
    let best=null;for(const [n,c] of counts)if(!best||c>best.count)best={id:n,count:c};
    const summary=best&&total?{id:best.id,share:best.count/total}:null;parcelNetworkCache.set(key,summary);return summary;
  }
  function updateBoundary(){
    const key=JSON.stringify(selected);if(key===boundaryIdentity)return;boundaryIdentity=key;
    for(const h of ['L','R']){
      const host=hemis[h];if(host.boundary){host.group.remove(host.boundary);host.boundary.geometry.dispose();host.boundary.material.dispose();host.boundary=null;}
      if(!selected||selected.id===0||(selected.hemi!=='both'&&selected.hemi!==h))continue;
      const points=[],normals=[],indices=host.geo.index.array,pos=host.geo.attributes.position,normal=host.geo.attributes.normal;
      for(let i=0;i<indices.length;i+=3){const triangle=[indices[i],indices[i+1],indices[i+2]],crossings=[];
        for(let e=0;e<3;e++){const a=triangle[e],b=triangle[(e+1)%3];
          if((labels[h][a]===selected.id)===(labels[h][b]===selected.id))continue;
          const n=new THREE.Vector3().fromBufferAttribute(normal,a).add(new THREE.Vector3().fromBufferAttribute(normal,b)).normalize();
          const p=new THREE.Vector3().fromBufferAttribute(pos,a).add(new THREE.Vector3().fromBufferAttribute(pos,b)).multiplyScalar(.5).addScaledVector(n,.15);
          crossings.push({p,n});}
        if(crossings.length===2)for(const {p,n} of crossings){points.push(...p.toArray());normals.push(...n.toArray());}
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
      const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,
        vertexShader:'varying float front; void main(){vec4 p=modelViewMatrix*vec4(position,1.0);front=dot(normalize(normalMatrix*normal),normalize(-p.xyz));gl_Position=projectionMatrix*p;}',
        fragmentShader:'varying float front; void main(){if(front<0.05)discard;gl_FragColor=vec4(0.88,0.69,0.97,1.0);}'});
      host.boundary=new THREE.LineSegments(geo,mat);host.boundary.renderOrder=3;host.group.add(host.boundary);
    }
  }
  function applySelection(){
    const tints=Object.fromEntries(Object.entries(CORTEX_TINTS).map(([k,c])=>[k,new THREE.Color(c)]));
    const palette=paletteUnit().map(c=>new THREE.Color().setRGB(...c,THREE.SRGBColorSpace));
    const artPalette=arterialPaletteUnit(arterialRows).map(c=>new THREE.Color().setRGB(...c,THREE.SRGBColorSpace));
    const artOn=arterialSel.mode!=='off'&&!!arterial;
    for(const h of ['L','R']){const a=hemis[h].geo.attributes.selected;
      const colour=hemis[h].geo.attributes.color;
      for(let i=0;i<a.count;i++){const id=labels[h][i];
        a.array[i]=(selected&&id!==0&&(selected.hemi==='both'||h===selected.hemi)&&id===selected.id)?1
          :(id!==0&&hoverPick?.hemi===h&&hoverPick.id===id)?3
          :(id!==0&&highlighted.some(r=>r.hemi===h&&r.id===id))?2:0;
        const net=networks?.[h]?.[i]||0;
        const on=net>0&&(networkSel.mode==='all'||(networkSel.mode==='focus'&&networkSel.focus===net));
        const art=artOn?(arterial[h][i]||0):0;
        const artLit=art>0&&(arterialSel.mode==='all'||arterialSel.focus===art);
        const tint=a.array[i]===1?tints.focus:a.array[i]===2?tints.context:a.array[i]===3?tints.hover:artLit?artPalette[art]:on?palette[net]:tints.neutral;
        colour.setXYZ(i,tint.r,tint.g,tint.b);
      }
      a.needsUpdate=true;colour.needsUpdate=true;
    }updateBoundary();requestDraw();
  }
  function rebuildAnnotations(){
    annotationLayer.replaceChildren();leaders.replaceChildren();annotations=[];annotationStamp='';
    const named=[...(selected?[{...selected,primary:true}]:[]),...highlighted];
    const seen=new Set(),p=new THREE.Vector3();
    function addLabel({key,hemi,id,primary=false,indices,centroid,geo,kind='parcel',name,tint,mesh}){
      const node=document.createElement('div');node.className='atlas-parcel-label';node.setAttribute('role','listitem');
      node.dataset.primary=String(primary);node.dataset.structure=key;node.dataset.kind=kind;
      const text=document.createElement('span');text.textContent=`${hemi} · ${name}`;
      const status=document.createElement('small');node.append(text,status);annotationLayer.append(node);
      const line=document.createElementNS(svgNS,'line');line.dataset.primary=String(primary);leaders.append(line);
      annotations.push({key,hemi,id,primary,indices,centroid,geo,kind,tint,mesh,node,status,line,x:0,y:0,visibility:'covered'});
    }
    for(const r of named)for(const h of r.hemi==='both'?['L','R']:[r.hemi]){
      const key=`${h}:${r.id}`,host=hemis[h];if(seen.has(key)||!host?.group.visible||r.id===0)continue;seen.add(key);
      const indices=[],centroid=new THREE.Vector3(),pos=host.geo.attributes.position;
      for(let i=0;i<pos.count;i++)if(labels[h][i]===r.id){indices.push(i);centroid.add(p.fromBufferAttribute(pos,i));}
      if(!indices.length)continue;centroid.multiplyScalar(1/indices.length);
      const raw=surfaceMeta.sets.glasser.regions[h][r.id];
      const code=String(raw).replace(/^[LR]_/, '').replace(/_ROI$/, '');
      addLabel({key,hemi:h,id:r.id,primary:!!r.primary,indices,centroid,geo:host.geo,name:code});
    }
    for(const mesh of deep){if(!mesh.visible||!deepHighlightIds.includes(mesh.userData.id))continue;
      const pos=mesh.geometry.attributes.position,centroid=new THREE.Vector3(),indices=[];
      for(let i=0;i<pos.count;i++){indices.push(i);centroid.add(p.fromBufferAttribute(pos,i));}
      centroid.multiplyScalar(1/pos.count);
      addLabel({key:`deep:${mesh.userData.id}`,hemi:mesh.userData.hemisphere,id:mesh.userData.id,
        primary:deepFocusIds.includes(mesh.userData.id),kind:'deep',name:mesh.userData.name,tint:deepFocusIds.includes(mesh.userData.id)?'#9be1f0':`#${mesh.material.color.getHexString()}`,
        indices,centroid,geo:mesh.geometry,mesh});
    }requestDraw();
  }
  // Leaders are attached to real labelled vertices. Occluded anchors are explicitly
  // marked, not drawn as if their surface were exposed. Recompute only on camera/size
  // changes, with a bounded update cadence while dragging (and a final settled update).
  const labelRay=new THREE.Raycaster();
  function updateAnnotations(now){
    if(!annotations.length)return;
    const w=mount.clientWidth,h=mount.clientHeight;
    const stamp=[...camera.position.toArray(),...controls.target.toArray(),w,h].join(',');
    if(annotationStamp===stamp)return;
    if(now-annotationTime<100&&(cameraTween||pipeline.diagnostics.interacting))return;
    annotationTime=now;annotationStamp=stamp;
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    leaders.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const p=new THREE.Vector3(),n=new THREE.Vector3(),toward=new THREE.Vector3();
    const candidates=Object.values(hemis).filter(host=>host.group.visible).map(host=>host.shell);
    const columns=[[],[]],labelWidth=Math.min(128,w*.30),gap=6;
    for(const a of annotations){const pos=a.geo.attributes.position,normal=a.geo.attributes.normal;
      const occluders=a.kind==='deep'?[a.mesh,...candidates.filter(m=>m.material.opacity>=1)]:candidates;
      const ranked=[];let anchor=new THREE.Vector3(),front=false;
      for(const i of a.indices){p.fromBufferAttribute(pos,i);n.fromBufferAttribute(normal,i);
        const facing=n.dot(toward.copy(camera.position).sub(p).normalize())>.12;
        const score=p.distanceToSquared(a.centroid)+(facing?0:1e6);
        ranked.push({i,score,facing});}
      ranked.sort((a,b)=>a.score-b.score);
      const probes=[...ranked.slice(0,3),...ranked.filter((_,i)=>i%Math.max(1,Math.floor(ranked.length/18))===0)];
      let covered=true;
      anchor.fromBufferAttribute(pos,ranked[0].i);
      for(const probe of probes){if(!probe.facing)continue;
        p.fromBufferAttribute(pos,probe.i);
        labelRay.set(camera.position,toward.copy(p).sub(camera.position).normalize());
        const hit=labelRay.intersectObjects(occluders,false)[0];
        if(!hit||hit.distance>=camera.position.distanceTo(p)-1.5){anchor.copy(p);front=true;covered=false;break;}}
      const projected=anchor.clone().project(camera);
      a.x=(projected.x+1)*w/2;a.y=(1-projected.y)*h/2;
      const inFrame=projected.z>=-1&&projected.z<=1&&a.x>=0&&a.x<=w&&a.y>=0&&a.y<=h;
      a.visibility=!inFrame?'out of view':(!front||covered)?'covered':'visible';
      a.status.textContent=a.visibility==='visible'?'':a.visibility;
      a.node.dataset.visibility=a.visibility;a.line.dataset.visibility=a.visibility;
      a.line.style.display=inFrame?'':'none';
      a.node.style.width=`${labelWidth}px`;a.height=a.node.offsetHeight;
      columns[a.x<w/2?0:1].push(a);
    }
    // Wrapped deep-structure names need their real height, not a fixed row gap.
    // Move labels across the scene only when their preferred column cannot fit.
    const columnHeight=list=>list.reduce((sum,a)=>sum+a.height+gap,0)-gap;
    for(const [side,list] of columns.entries())while(list.length>1&&columnHeight(list)>h-16){
      const other=columns[1-side],move=[...list].sort((a,b)=>Math.abs(a.x-w/2)-Math.abs(b.x-w/2))
        .find(a=>columnHeight([...other,a])<=h-16);
      if(!move)break;list.splice(list.indexOf(move),1);other.push(move);
    }
    for(const [side,list] of columns.entries()){
      list.sort((a,b)=>a.y-b.y);
      let previous=8-gap,remaining=columnHeight(list);
      for(const [i,a] of list.entries()){
        const top=Math.min(h-8-remaining,Math.max(8,a.y-a.height/2,previous+gap));
        previous=top+a.height;remaining-=a.height+gap;
        const left=side?w-labelWidth-8:8;
        a.node.style.cssText=`left:${left}px;top:${top}px;width:${labelWidth}px`;
        if(a.tint){a.node.style.setProperty('--label-color',a.tint);a.line.style.stroke=a.tint;}
        a.line.setAttribute('x1',String(side?left:left+labelWidth));a.line.setAttribute('y1',String(top+a.height/2));
        a.line.setAttribute('x2',String(a.x));a.line.setAttribute('y2',String(a.y));
      }
    }
  }
  function setSurface(value){
    surface=Math.max(.08,Math.min(.95,value));
    annotationStamp='';
    const opacity=surface>=.6?1:surface*.85;
    for(const host of Object.values(hemis)){
      const material=host.shell.material;
      if(opacity<1)configContextMaterial(material,{THREE,opacity});
      else{material.opacity=1;material.transparent=false;material.depthWrite=true;material.needsUpdate=true;}
      material.userData.renderRole='atlas-cortex';
    }requestDraw();
  }
  /** Pick one parcel: hemi 'L' | 'R' | 'both' (paired label, both hemispheres lit as
   * tier 1) | null (clear — no parcel asserted). Never defaults to a side. */
  function select(hemi,id){
    if(hemi==null){selected=null;highlighted=[];applySelection();rebuildAnnotations();return;}
    const hs=hemi==='both'?['L','R']:[hemi];
    if(!hs.every(h=>h in hemis&&id in surfaceMeta.sets.glasser.regions[h]))return;
    selected={hemi,id};highlighted=[];applySelection();rebuildAnnotations();
  }
  /** Light a set of parcels as secondary context (tier 2), leaving the primary
   * `select()` picked region (tier 1) untouched. Empty list clears the set. */
  function highlight(list=[]){
    highlighted=(list||[]).flatMap(r=>r&&r.hemi==='both'?[{...r,hemi:'L'},{...r,hemi:'R'}]:[r]).filter(r=>r&&['L','R'].includes(r.hemi)&&
      Number.isInteger(r.id)&&r.id in surfaceMeta.sets.glasser.regions[r.hemi]);
    applySelection();rebuildAnnotations();
  }
  function setHemisphere(h){
    visibleHemi=['L','R','both'].includes(h)?h:'both';
    for(const key of ['L','R'])hemis[key].group.visible=visibleHemi==='both'||visibleHemi===key;
    for(const mesh of deep)mesh.visible=deepVisible&&(visibleHemi==='both'||visibleHemi===mesh.userData.hemisphere);
    rebuildAnnotations();requestDraw();
  }
  function setDeep(on){deepVisible=!!on;setHemisphere(visibleHemi);}
  /** Yeo-7 colour: update vertex colours in place, never rebuild atlas geometry. */
  function setNetworks(sel){
    networkSel=networkSelection(sel?.mode,sel?.focus);
    if(!networks)networkSel=networkSelection('off');
    applySelection();
  }
  function setArterial(sel){
    arterialSel=arterialSelection(sel?.mode,sel?.focus,arterialRows);
    if(!arterial)arterialSel=arterialSelection('off');
    applySelection();
  }
  /** Arterial territory id at one vertex (0 = unlabelled), or null when the set is not installed. */
  function arterialAt(hemi,vertex){return arterial&&arterial[hemi]?arterial[hemi][vertex]??null:null;}
  const hasArterial=()=>!!arterial;
  /** Yeo-7 id at one vertex (0 = medial wall), or null when the set is not installed. */
  function networkAt(hemi,vertex){return networks&&networks[hemi]?networks[hemi][vertex]??null:null;}
  const hasNetworks=()=>!!networks;
  /** Dim deep structures not named in `ids` (others stay at full opacity); empty = all as today. */
  function setDeepHighlight(ids=[],{focus=[]}={}){
    deepHighlightIds=Array.isArray(ids)?ids:[];
    deepFocusIds=focus.filter(id=>deepHighlightIds.includes(id));
    for(const mesh of deep)mesh.material.opacity=
      (deepHighlightIds.length&&!deepHighlightIds.includes(mesh.userData.id))?.1:deepFocusIds.length?(deepFocusIds.includes(mesh.userData.id)?.95:.35):.7;
    rebuildAnnotations();requestDraw();
  }
  function clearBundles(){
    for(const {group} of bundles.values()){scene.remove(group);group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
    bundles.clear();traces.length=0;
  }
  const GHOST_TINT=0x818d99;
  /** Show a set of bundles at once. `ghost` ids are rendered dimmer, untinted-by-index and
   * without the animated trace — a "kept visible but de-emphasised" layer under the primaries. */
  let bundleRequest=0;
  async function setBundles(ids,{ghost=[]}={}) {
    const request=++bundleRequest;
    const ghostSet=new Set(ghost);
    const primaryIds=[...new Set(ids)].filter(id=>!ghostSet.has(id));
    const ghostIds=[...new Set(ghost)].filter(id=>!primaryIds.includes(id));
    const ordered=[...primaryIds.map(id=>({id,isGhost:false})),...ghostIds.map(id=>({id,isGhost:true}))].slice(0,MAX_BUNDLES);
    const entries=ordered.map(item=>({...item,meta:tractMeta.bundles.find(b=>b.id===item.id)})).filter(item=>item.meta);
    clearBundles();
    try{
      const loaded=await tractRangeLoader.load(entries.map(item=>item.id));
      if(request!==bundleRequest||disposed)return;
      bundleError='';onStatus('Atlas ready',{ready:true});
      let colourIndex=0;
      for(const {id,isGhost,meta} of entries) {
        const lines=decodeAtlasBundle({...meta,offset:0},loaded.get(id)),positions=[],arc=[],tracePositions=[],traceArc=[];
        for(const [li,line] of lines.entries()) {
          let length=0;const lengths=[0];
          for(let i=1;i<line.length;i++){length+=Math.hypot(...line[i].map((x,j)=>x-line[i-1][j]));lengths.push(length);}
          for(let i=1;i<line.length;i++) {
            positions.push(...line[i-1],...line[i]);arc.push(lengths[i-1]/length,lengths[i]/length);
            if(li%Math.ceil(lines.length/18)===0){tracePositions.push(...line[i-1],...line[i]);traceArc.push(lengths[i-1]/length,lengths[i]/length);}
          }
        }
        const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
        geo.setAttribute('arc',new THREE.Float32BufferAttribute(arc,1));
        const tint=isGhost?GHOST_TINT:BUNDLE_TINTS[colourIndex%BUNDLE_TINTS.length];
        const alpha=isGhost?.12:.30;
        if(!isGhost)colourIndex++;
        const group=new THREE.Group();group.add(new THREE.LineSegments(geo,new THREE.ShaderMaterial({
          uniforms:{tint:{value:new THREE.Color(tint)},alpha:{value:alpha}},
          vertexShader:'attribute float arc; varying float t; void main(){t=arc;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
          fragmentShader:'uniform vec3 tint; uniform float alpha; varying float t; void main(){float feather=smoothstep(0.0,0.06,min(t,1.0-t));gl_FragColor=vec4(tint,alpha*feather);}',
          transparent:true,depthWrite:false,blending:THREE.NormalBlending,toneMapped:false})));
        if(!isGhost){
          const traceGeo=new THREE.BufferGeometry();traceGeo.setAttribute('position',new THREE.Float32BufferAttribute(tracePositions,3));
          traceGeo.setAttribute('arc',new THREE.Float32BufferAttribute(traceArc,1));
          const material=new THREE.ShaderMaterial({uniforms:{time:{value:time},phase:{value:colourIndex*.7}},
            vertexShader:'attribute float arc; varying float t; void main(){t=arc;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
            fragmentShader:`uniform float time; uniform float phase; varying float t;
              void main(){float p=0.18+0.27*(1.0-cos(time*0.7+phase));
                float a=max(exp(-pow((t-p)/0.025,2.0)),exp(-pow((t-(1.0-p))/0.025,2.0)));
                if(a<0.02)discard; gl_FragColor=vec4(1.0,0.78,0.36,a*0.85);}`,
            transparent:true,depthWrite:false,depthTest:false,blending:THREE.NormalBlending,toneMapped:false});
          const trace=new THREE.LineSegments(traceGeo,material);trace.visible=profile==='teaching';trace.renderOrder=5;
          group.add(trace);traces.push(trace);
        }
        bundles.set(id,{group,ghost:isGhost,alpha});scene.add(group);
      }
      requestDraw();
    }catch(error){
      if(request===bundleRequest&&!disposed){bundleError=error.message;onStatus(`Reference atlas unavailable: ${error.message}. Reload to retry.`);console.error(error);}
    }
  }
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();let down,hoverFrame=0;
  function pickAt(e){
    const rect=renderer.domElement.getBoundingClientRect();ndc.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    ray.setFromCamera(ndc,camera);
    const candidates=Object.values(hemis).filter(h=>h.group.visible).map(h=>h.shell);
    const deepHit=ray.intersectObjects(deep.filter(x=>x.visible),false)[0],cortexHit=ray.intersectObjects(candidates,false)[0];
    // An opaque surface occludes deep picking; a transparent reference shell does not.
    const hit=surface>=.6?(cortexHit&&(!deepHit||cortexHit.distance<deepHit.distance)?cortexHit:deepHit):(deepHit||cortexHit);
    if(!hit)return null;
    if(hit.object.userData.kind==='deep')return {deep:hit.object.userData};
    const h=Object.keys(hemis).find(k=>hemis[k].shell===hit.object),pos=hemis[h].geo.attributes.position;
    const p=new THREE.Vector3();let nearest=hit.face.a,distance=Infinity;
    for(const i of [hit.face.a,hit.face.b,hit.face.c]){p.fromBufferAttribute(pos,i);const d=p.distanceToSquared(hit.point);if(d<distance){nearest=i;distance=d;}}
    return {hemi:h,id:labels[h][nearest],vertex:nearest};
  }
  function clearHover(){cancelAnimationFrame(hoverFrame);hoverFrame=0;onHover(null);if(hoverPick){hoverPick=null;applySelection();}}
  renderer.domElement.addEventListener('pointerdown',e=>{cameraTween=null;clearHover();down=[e.clientX,e.clientY];});
  renderer.domElement.addEventListener('pointerup',e=>{
    if(!down||e.button!==0||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5){down=null;return;}down=null;
    const pick=pickAt(e);if(pick)onPick(pick);
  });
  renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')return;
    cancelAnimationFrame(hoverFrame);hoverFrame=requestAnimationFrame(()=>{hoverFrame=0;if(disposed)return;const pick=pickAt(e);onHover(pick);
      const next=pick&&!pick.deep?{hemi:pick.hemi,id:pick.id}:null;
      if(JSON.stringify(next)!==JSON.stringify(hoverPick)){hoverPick=next;applySelection();}});});
  renderer.domElement.addEventListener('pointerleave',clearHover);
  renderer.domElement.addEventListener('pointercancel',()=>{down=null;clearHover();});
  setSurface(surface);select(null);framed=true;resize();setView();onStatus('Atlas ready',{ready:true});
  // Fictional lesion marker (case_lesions.js): one translucent sphere in atlas mm, never picked.
  let lesion=null;
  function setLesion(m){
    if(lesion){scene.remove(lesion.group);lesion.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});lesion=null;}
    if(m){
      const r=Math.min(40,Math.max(1,Number(m.radiusMm)||12)),group=new THREE.Group();
      const core=new THREE.Mesh(new THREE.SphereGeometry(r,48,32),new THREE.MeshStandardMaterial({color:0x9be1f0,emissive:0x2b6f80,emissiveIntensity:.35,
        roughness:.55,metalness:0,transparent:true,opacity:.42,depthWrite:false}));
      const halo=new THREE.Mesh(new THREE.SphereGeometry(r*1.06,24,16),new THREE.MeshBasicMaterial({color:0x9be1f0,wireframe:true,transparent:true,opacity:.18,depthWrite:false,toneMapped:false}));
      core.material.userData.renderRole='atlas-lesion';core.renderOrder=4;halo.renderOrder=4;
      group.add(core,halo);group.position.set(m.x,m.y,m.z);group.userData={kind:'lesion',label:m.label,side:m.side};
      scene.add(group);lesion={group,marker:{x:m.x,y:m.y,z:m.z,radiusMm:r,side:m.side,label:m.label}};
    }
    requestDraw();
  }
  function snapshot(){return {selected:selected?{...selected}:null,highlighted:highlighted.map(r=>({...r})),hemisphere:visibleHemi,network:{...networkSel},
    bundles:bundleIdsBy(false),ghostBundles:bundleIdsBy(true),deepHighlight:[...deepHighlightIds],
    surface,deepVisible,view,camera:camera.position.toArray(),target:controls.target.toArray(),up:camera.up.toArray()};}
  function setCorridors(specs){
    if(!corridorOverlay&&specs.length) corridorOverlay=createCorridorOverlay({THREE,scene,mount,requestDraw});
    corridorOverlay?.set(specs);
  }
  function restore(state){
    cameraTween=null;
    select(state.selected?.hemi??null,state.selected?.id);highlight(state.highlighted||[]);
    setHemisphere(state.hemisphere);setBundles(state.bundles,{ghost:state.ghostBundles||[]});
    setDeep(state.deepVisible);setDeepHighlight(state.deepHighlight||[]);setNetworks(state.network||networkSelection('off'));
    setSurface(state.surface);
    camera.position.fromArray(state.camera);controls.target.fromArray(state.target);camera.up.fromArray(state.up);view=state.view;
    autoFrame=false;frameFocus=false;controls.update();requestDraw();
  }
  return {surfaceMeta,tractMeta,subMeta:sub,manifest,select,highlight,setHemisphere,setDeep,setDeepHighlight,
    setBundles,setView,flyTo,snapshot,restore,setNetworks,networkAt,hasNetworks,parcelNetwork,
    setArterial,arterialAt,hasArterial,get arterialRows(){return arterialRows;},
    setSurface,setLesion,setCorridors,
    setProfile(value){profile=value==='presenter'?'presenter':'teaching';for(const t of traces)t.visible=profile==='teaching';requestDraw();},
    setPlaying(value){playing=!!value;last=0;requestDraw();},
    get state(){return {ready:true,profile,playing:playing&&profile==='teaching'&&!reduced.matches,
      reducedMotion:reduced.matches,time,frames,selected,highlighted:highlighted.map(r=>({...r})),hemisphere:visibleHemi,
      bundles:bundleIdsBy(false),ghostBundles:bundleIdsBy(true),tractError:bundleError,
      bundleAlpha:Object.fromEntries([...bundles].map(([id,v])=>[id,v.alpha])),network:{...networkSel},arterial:{...arterialSel},corridors:corridorOverlay?.state.corridors??[],
      vertices:Object.values(hemis).map(h=>h.count),view,deepVisible,lesion:lesion?{...lesion.marker}:null,deepHighlight:[...deepHighlightIds],deepFocus:[...deepFocusIds],
      render:{cortex:'shaded-mesh',pipeline:pipeline.diagnostics,surfaceOpacity:hemis.L.shell.material.opacity,
        cameraFrame:frameFocus?'lesson':'whole',target:controls.target.toArray(),
        labels:annotations.map(a=>({key:a.key,kind:a.kind,x:a.x,y:a.y,visibility:a.visibility,primary:a.primary}))},
      camera:camera.position.toArray(),cameraTransition:cameraTween?{elapsed:performance.now()-cameraTween.start,duration:cameraTween.duration}:null};},
    dispose(){clearHover();corridorOverlay?.dispose();reduced.removeEventListener('change',motionChanged);draco.dispose();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});disposeBase();},
  };
}
