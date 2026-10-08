import {BUNDLE_TINTS,MAX_BUNDLES} from './bundle_picker.js';
import * as THREE from 'three';
import {MeshBVH,acceleratedRaycast,computeBoundsTree,disposeBoundsTree} from 'three-mesh-bvh';
import CameraControls from 'camera-controls';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {ATLAS_VIEWS,decodeAtlasLabels,decodeAtlasBundle} from './atlas_data.js';
import {paletteUnit,YEO7_SET,networkSelection} from './atlas_networks.js';
import {ARTERIAL_SET,arterialTable,arterialPaletteUnit,arterialSelection} from './atlas_arterial.js';
import {configContextMaterial} from './scene_materials.js';
import {createRenderPipeline} from './render_pipeline.js';
import {createCorridorOverlay} from './corridor_overlay.js';
import {createTractRangeLoader} from './tract_ranges.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {SLICE_AXES,sliceMesh,chainContours,slicePolylines,nearestVertex} from './atlas_slice.js';
const MANIFEST_SHA256='772efa37e0756552aafc1fb4720565d104a23f38d597977835c77c91a1bf35a3';
const sha256=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
THREE.BufferGeometry.prototype.computeBoundsTree=computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree=disposeBoundsTree;
THREE.Mesh.prototype.raycast=acceleratedRaycast;
CameraControls.install({THREE});
const disposeGeometry=geo=>{geo?.disposeBoundsTree?.();geo?.dispose();};
function fatLine(positions,{arc=[],normals=[],color,opacity=1,linewidth,depthTest=true,effect=''}={}){
  const geo=new LineSegmentsGeometry();geo.setPositions(positions);
  if(arc.length)geo.setAttribute('instanceArc',new THREE.InstancedBufferAttribute(new Float32Array(arc),2));
  if(normals.length){const data=new THREE.InstancedInterleavedBuffer(new Float32Array(normals),6,1);
    geo.setAttribute('instanceNormalStart',new THREE.InterleavedBufferAttribute(data,3,0));
    geo.setAttribute('instanceNormalEnd',new THREE.InterleavedBufferAttribute(data,3,3));}
  const mat=new LineMaterial({color,opacity,linewidth,worldUnits:false,transparent:true,depthWrite:false,depthTest,
    blending:THREE.NormalBlending,toneMapped:false});
  mat.userData.time={value:0};mat.userData.phase={value:0};
  // three keys compiled programs by onBeforeCompile's source text, which is identical for every
  // variant here; the key must carry what actually changes the generated shader.
  mat.customProgramCacheKey=()=>`hodos-fatline:${effect}:${arc.length?1:0}:${normals.length?1:0}`;
  mat.onBeforeCompile=shader=>{
    shader.uniforms.time=mat.userData.time;shader.uniforms.phase=mat.userData.phase;
    shader.vertexShader=shader.vertexShader.replace('void main() {',
      `${arc.length?'attribute vec2 instanceArc; varying float vArc;':''}
       ${normals.length?'attribute vec3 instanceNormalStart; attribute vec3 instanceNormalEnd; varying float vFront;':''}
       void main() {`);
    shader.vertexShader=shader.vertexShader.replace('vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );',
      `vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );
       ${arc.length?'vArc = mix(instanceArc.x,instanceArc.y,clamp(position.y,0.0,1.0));':''}
       ${normals.length?'vec3 lineNormal=mix(instanceNormalStart,instanceNormalEnd,clamp(position.y,0.0,1.0)); vFront=dot(normalize(normalMatrix*lineNormal),normalize(-mix(start.xyz,end.xyz,clamp(position.y,0.0,1.0))));':''}`);
    shader.fragmentShader=shader.fragmentShader.replace('void main() {',
      `${arc.length?'varying float vArc;':''}${normals.length?'varying float vFront;':''}
       uniform float time; uniform float phase; void main() {`);
    const effectAlpha=effect==='feather'?'alpha *= smoothstep(0.0,0.06,min(vArc,1.0-vArc));'
      :effect==='pulse'?'float p=0.18+0.27*(1.0-cos(time*0.7+phase)); alpha *= max(exp(-pow((vArc-p)/0.025,2.0)),exp(-pow((vArc-(1.0-p))/0.025,2.0)))*0.85; if(alpha<0.02)discard;':'';
    shader.fragmentShader=shader.fragmentShader.replace('gl_FragColor = vec4( diffuseColor.rgb, alpha );',
      `${normals.length?'if(vFront<0.05)discard;':''}${effectAlpha} gl_FragColor = vec4( diffuseColor.rgb, alpha );`);
  };
  return new LineSegments2(geo,mat);
}

// Discrete parcel identity, separate from the published network palette.
// All fills use the installed triangle/label correspondence; no generated surface.
const CORTEX_TINTS={neutral:0xaaa09c,focus:0x9be1f0,context:0xdcc39a,hover:0xf6ede6};

/** Owns one reference scene. Its inputs never include a case result or mask. */
export async function createAtlasScene(mount,{onPick=()=>{},onHover=()=>{},onStatus=()=>{},onInteraction=()=>{},onView=()=>{},hover=true}={}) {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const scene=new THREE.Scene();
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  // Narrow screens render at 2x at most; resize() applies the same cap to the pipeline.
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?2:3));renderer.setClearColor(0x070c12,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.localClippingEnabled=true;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  renderer.domElement.setAttribute('aria-label','Interactive HCP reference atlas');
  renderer.domElement.setAttribute('aria-describedby','canvasHelp');renderer.domElement.tabIndex=0;
  mount.append(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(35,1,.1,2000);camera.up.set(0,0,1);
  const urlAoMode=new URLSearchParams(location.search).get('ao');
  const pipeline=createRenderPipeline(renderer,{THREE,scene,camera,
    aoMode:urlAoMode==='simple'||urlAoMode==='off'?urlAoMode:'gtao',aoRadiusMm:7,aoStrength:.7,
    maxPixelRatio:3,maxPixels:8000000,interactiveMaxPixelRatio:1.5,interactiveMaxPixels:2400000});
  const controls=new CameraControls(camera,renderer.domElement);controls.updateCameraUp();
  controls.smoothTime=reduced.matches?0:.22;controls.draggingSmoothTime=reduced.matches?0:.12;
  controls.mouseButtons.right=CameraControls.ACTION.TRUCK;controls.touches.two=CameraControls.ACTION.TOUCH_DOLLY_TRUCK;
  controls.minDistance=150;controls.maxDistance=900;
  scene.add(new THREE.AmbientLight(0xf8eff5,.55));
  const light=new THREE.DirectionalLight(0xfff4e7,2.7);light.position.set(-200,120,260);scene.add(light);
  const fill=new THREE.DirectionalLight(0xe4e0f3,1.25);fill.position.set(200,-180,120);scene.add(fill);
  const centre=new THREE.Vector3(0,-18,8),hemis={},deep=[],bundles=new Map(),frameGeometry=[];
  let playing=false,profile='teaching',frame=0,last=0,time=0,disposed=false,view='left';
  let selected=null,highlighted=[],visibleHemi='both',surface=.6,deepVisible=false,framed=false,autoFrame=true;
  let hoveredLine=null,controlsActive=false,frameHold=false;
  let deepHighlightIds=[],deepFocusIds=[],cameraTransition=null,frameFocus=false;
  let corridorOverlay=null;
  let slice=null,sliceFrame=null,context=null;const slicePlane=new THREE.Plane(),sceneListeners=new Set();
  const sceneChanged=()=>{for(const listener of sceneListeners)listener();};
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
    a.textContent=positive;b.textContent=negative;orientation.append(line,a,b);axes.push({axis,line,a,b,letters:[positive,negative]});
  }
  mount.append(orientation);let viewStamp='';
  function updateOrientation(){
    const inverse=camera.quaternion.clone().invert();
    const shown=[];
    for(const {axis,line,a,b,letters} of axes){const p=axis.clone().applyQuaternion(inverse),x=p.x*25,y=-p.y*25;
      line.setAttribute('x1',String(40-x));line.setAttribute('y1',String(40-y));line.setAttribute('x2',String(40+x));line.setAttribute('y2',String(40+y));
      for(const [text,sign,letter] of [[a,1,letters[0]],[b,-1,letters[1]]]){const tx=40+sign*x*1.2,ty=40+sign*y*1.2;
        text.setAttribute('x',String(tx));text.setAttribute('y',String(ty));text.textContent=letter;text.style.textAnchor='';
        // When an axis points at the viewer, show its near end once.
        const visible=!(Math.hypot(x,y)<7&&sign*p.z<0);text.style.opacity=visible?'1':'0';
        if(visible)shown.push({text,letter,x:tx,y:ty});}
    }
    // A diagonal view projects two axes onto one screen direction, which stacked R on A and P on L:
    // merge each such pair into one oblique label ("RA", "LP"), the way radiology viewers mark it. Beside
    // the triad, the two-letter label grows outward so it keeps clear of the line ends.
    for(let i=0;i<shown.length;i++)for(let j=i+1;j<shown.length;j++){const m=shown[i],n=shown[j];
      if(m.merged||n.merged||Math.hypot(m.x-n.x,m.y-n.y)>=12)continue;
      const x=(m.x+n.x)/2,y=(m.y+n.y)/2,side=Math.abs(x-40)>=Math.abs(y-40)?Math.sign(x-40):0;
      // Above or below the triad, it steps 4 px further out so the two line ends stay clear of it.
      m.text.textContent=m.letter+n.letter;m.text.setAttribute('x',String(x-side*3.5));m.text.setAttribute('y',String(side?y:y+Math.sign(y-40)*4));
      m.text.style.textAnchor=side<0?'end':side>0?'start':'';n.text.style.opacity='0';m.merged=n.merged=true;}
    const next=`${visibleHemi}:${autoFrame?view:'free'}`;
    if(next!==viewStamp){viewStamp=next;onView({hemisphere:visibleHemi,view:autoFrame?view:'free'});}
  }
  const traces=[];let frames=0,contextLost=false,controlLast=0;
  const currentTarget=()=>controls.getTarget(new THREE.Vector3(),false);
  const lookAt=(position,target,transition=false)=>controls.setLookAt(...position.toArray(),...target.toArray(),transition);
  const drawSize=new THREE.Vector2();
  function updateLineResolutions(){renderer.getDrawingBufferSize(drawSize);
    for(const host of Object.values(hemis))if(host.boundary)host.boundary.material.resolution.copy(drawSize);
    for(const {group} of bundles.values())for(const line of group.children)line.material.resolution.copy(drawSize);
    if(sliceFrame)for(const line of sliceFrame.children)line.material.resolution.copy(drawSize);
  }
  const bundleIdsBy=ghost=>[...bundles].filter(([,v])=>v.ghost===ghost).map(([id])=>id);
  function draw(now=0){
    frame=0;if(disposed||contextLost)return;
    const moving=playing&&profile==='teaching'&&!reduced.matches&&!document.hidden;
    if(moving&&last)time+=Math.min((now-last)/1000,.05);
    last=moving?now:0;
    for(const trace of traces)trace.material.userData.time.value=time;
    const delta=controlLast?Math.min((now-controlLast)/1000,.05):0;controlLast=now;
    const changed=controls.update(delta);pipeline.render();updateAnnotations(now);updateOrientation();corridorOverlay?.update(camera);frames++;
    if(moving||changed)requestDraw();
  }
  function requestDraw(){if(!frame&&!disposed&&!contextLost)frame=requestAnimationFrame(draw);}
  controls.addEventListener('controlstart',()=>{controlsActive=true;clearHover();cameraTransition=null;autoFrame=false;pipeline.setInteracting(true);updateLineResolutions();onInteraction();requestDraw();});
  controls.addEventListener('control',()=>{autoFrame=false;requestDraw();});
  controls.addEventListener('controlend',()=>{controlsActive=false;pipeline.setInteracting(false);updateLineResolutions();annotationStamp='';requestDraw();});
  reduced.addEventListener('change',requestDraw);
  document.addEventListener('visibilitychange',requestDraw);
  // A lost WebGL context (GPU switch, backgrounded mobile tab) pauses the loop and says so;
  // three.js re-initialises its state on restore, so the scene is redrawn rather than left blank.
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;cancelAnimationFrame(frame);frame=0;
    onStatus('Graphics context lost. Waiting for the browser to restore it; reload if the atlas stays blank.');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;annotationStamp='';resize();onStatus('Atlas ready',{ready:true});requestDraw();});
  let insets=null,insetsWereSet=false;
  const resize=()=>{const w=mount.clientWidth,h=mount.clientHeight;
    if(w<=0||h<=0)return;
    if(insets){
      const fw=Math.max(1,w-insets.left-insets.right),fh=Math.max(1,h-insets.top-insets.bottom);
      camera.aspect=fw/fh;
      camera.setViewOffset(fw,fh,-insets.left,-insets.top,w,h);
      insetsWereSet=true;
    }else{
      camera.aspect=w/h;
      if(insetsWereSet){camera.clearViewOffset();insetsWereSet=false;}
    }
    camera.updateProjectionMatrix();
    pipeline.resize(w,h,Math.min(devicePixelRatio,innerWidth<700?2:3));
    updateLineResolutions();
    annotationStamp='';
    // frameHold (lesion-lab only, via stage.setFrameHold): while a caller is mid-drag on its own
    // overlay (the lesion sphere), that caller's own live readouts (story text, MNI coordinates)
    // reflow the DOM elements setFrameInsets watches, firing this same resize() through the
    // insetsObserver mid-drag. Re-fitting the camera to that incidental reflow moves the view the
    // user never asked to move (measured: ~1-2mm drift at a 390px frame, where those readouts are
    // near a text-wrap boundary; a wide desktop frame never wraps, so it never showed the bug).
    // The projection/viewport update above still applies so the frame itself tracks size changes;
    // only the auto-frame camera re-fit is held.
    if(framed&&autoFrame&&!frameHold){
      const target=computeViewTarget(view,cameraTransition?.zoom??1,frameFocus);
      lookAt(target.position,target.centre,!!cameraTransition&&!reduced.matches);controls.update(0);
    }requestDraw();};
  // Opt-in only (contract 5.1): with insets never set, resize() takes exactly the branch above
  // (no setViewOffset/clearViewOffset call), so a caller that never calls this sees today's
  // behaviour unchanged. null or an all-zero rect clears a previously set inset.
  function setFrameInsets(next){
    const has=next&&(next.top||next.right||next.bottom||next.left);
    insets=has?{top:next.top||0,right:next.right||0,bottom:next.bottom||0,left:next.left||0}:null;
    resize();
  }
  const observer=new ResizeObserver(resize);observer.observe(mount);
  function disposeBase(){disposed=true;cameraTransition=null;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();
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
    for(const {group,ghost} of bundles.values())if(!ghost){const geo=group.children[0].geometry;
      for(const attr of [geo.attributes.instanceStart,geo.attributes.instanceEnd])for(let i=0;i<attr.count;i++)result.push(p.fromBufferAttribute(attr,i).clone());}
    for(const mesh of deep)if(mesh.visible&&deepHighlightIds.includes(mesh.userData.id)){
      const pos=mesh.geometry.attributes.position;for(let i=0;i<pos.count;i++)result.push(p.fromBufferAttribute(pos,i).clone());}
    return result;
  }
  function computeViewTarget(key,zoom=1,focus=false) {
    const resolved=key in ATLAS_VIEWS?key:'left';
    const direction=new THREE.Vector3(...ATLAS_VIEWS[resolved]);
    if((resolved==='medial'||resolved==='oblique')&&visibleHemi==='R')direction.x*=-1;
    direction.normalize();
    const right=new THREE.Vector3().crossVectors(camera.up,direction).normalize();
    const up=new THREE.Vector3().crossVectors(direction,right).normalize();
    const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tanH=tanV*camera.aspect;
    // With frame insets active (lesion-lab only: atlas.html/mips.html never call setFrameInsets, so
    // `insets` stays null for them and this branch never runs there, keeping their fit and visual-
    // regression baselines byte-for-byte unchanged), the cortex shell is the framing contract
    // (computeBrainRect's fill gate in lesion_lab.js measures only the atlas-cortex render role).
    // frameGeometry's other member, the faint inferior-context mesh, still rides along for `centre`'s
    // bounds union but must not be the reason distance grows past what the cortex itself needs — at a
    // phone-width frame, context reaching further inferiorly than the cortex was pulling distance ~15%
    // past the cortex's own fit, under-filling the frame it owns (measured: 79.7% cortex fill at 390px
    // vs the required 80%, with context alone accounting for the shortfall). A little edge cropping of
    // that near-invisible (opacity .12) context silhouette is imperceptible.
    const geometries=!framed?[]:insets?Object.values(hemis).filter(h=>h.group.visible).map(h=>h.geo)
      :frameGeometry.filter(geo=>!Object.values(hemis).some(h=>h.geo===geo&&!h.group.visible));
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
    cameraTransition=null;frameFocus=false;
    const target=computeViewTarget(key,1);
    view=target.view;autoFrame=true;lookAt(target.position,target.centre);controls.update(0);requestDraw();
  }
  /** Animate the camera to a named view; prefers-reduced-motion jumps instantly. */
  function flyTo({view:key='left',zoom=1,tweenMs=900,focus=false}={}) {
    frameFocus=focus;
    const target=computeViewTarget(key,zoom,focus);
    view=target.view;autoFrame=zoom<=1;
    const transition=!reduced.matches&&tweenMs>0;
    controls.smoothTime=transition?Math.max(.08,tweenMs/3000):0;
    const token=cameraTransition=transition?{target,zoom,start:performance.now(),duration:tweenMs}:null;
    let pending=lookAt(target.position,target.centre,transition);
    if(focus){const points=focusPoints();if(points.length){const box=new THREE.Box3().setFromPoints(points),sphere=box.getBoundingSphere(new THREE.Sphere());
      sphere.radius*=1.28;pending=Promise.all([pending,controls.fitToSphere(sphere,transition)]);}}
    if(token)pending.then(()=>{if(cameraTransition===token){cameraTransition=null;controls.smoothTime=reduced.matches?0:.22;annotationStamp='';requestDraw();}});
    controls.update(0);requestDraw();
  }
  function motionChanged(){
    controls.smoothTime=reduced.matches?0:.22;controls.draggingSmoothTime=reduced.matches?0:.12;
    if(reduced.matches&&cameraTransition){const target=cameraTransition.target;cameraTransition=null;
      lookAt(target.position,target.centre);controls.update(0);}
    requestDraw();
  }
  reduced.addEventListener('change',motionChanged);
  renderer.domElement.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_','Home'].includes(event.key))return;
    event.preventDefault();cameraTransition=null;onInteraction();
    if(event.key==='Home'){setView(view);return;}
    autoFrame=false;
    const target=currentTarget(),offset=camera.position.clone().sub(target),right=new THREE.Vector3().crossVectors(camera.up,offset).normalize();
    if(event.shiftKey&&event.key.startsWith('Arrow')){
      const up=new THREE.Vector3().crossVectors(offset,right).normalize(),shift=new THREE.Vector3();
      shift.addScaledVector(event.key==='ArrowLeft'||event.key==='ArrowRight'?right:up,
        (event.key==='ArrowRight'||event.key==='ArrowUp'?1:-1)*offset.length()*.025);
      target.add(shift);camera.position.add(shift);
    }else{
      if(event.key==='ArrowLeft'||event.key==='ArrowRight')offset.applyAxisAngle(camera.up,(event.key==='ArrowRight'?1:-1)*Math.PI/18);
      else if(event.key==='ArrowUp'||event.key==='ArrowDown')offset.applyAxisAngle(right,(event.key==='ArrowUp'?1:-1)*Math.PI/18);
      else offset.setLength(Math.max(controls.minDistance,Math.min(controls.maxDistance,offset.length()*(['+','='].includes(event.key)?.9:1.1))));
      camera.position.copy(target).add(offset);
    }
    lookAt(camera.position,target);controls.update(0);requestDraw();
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
  // surface-labels.bin is served application/octet-stream, which Cloudflare Pages never
  // compresses on the fly, so a static build-time gzip sibling (manifest asset.gzip) carries
  // the same bytes over the wire at ~4% of the size. Decoding re-verifies the DECODED bytes
  // against the asset's own sha256/bytes, so a bad transport or a stale sibling still throws
  // instead of silently serving wrong data. Browsers without DecompressionStream (or an asset
  // with no gzip sibling) fall back to the uncompressed fetch checked() already does.
  async function checkedMaybeGzip(path){
    const record=manifest.assets.find(a=>a.path===path);if(!record)throw new Error('Unlisted atlas asset');
    if(!record.gzip||typeof DecompressionStream!=='function')return checked(path);
    const gz=record.gzip;
    try{
      const response=await fetch(`./atlas/${gz.path}?v=${gz.sha256.slice(0,12)}`);
      if(!response.ok)throw new Error(`Atlas asset unavailable: ${gz.path}`);
      const compressed=await response.arrayBuffer();
      if(compressed.byteLength!==gz.bytes||await sha256(compressed)!==gz.sha256)throw new Error(`Atlas asset integrity failed: ${gz.path}`);
      const decompressedStream=new Response(compressed).body.pipeThrough(new DecompressionStream('gzip'));
      const bytes=await new Response(decompressedStream).arrayBuffer();
      if(await sha256(bytes)!==record.sha256||bytes.byteLength!==record.bytes)throw new Error(`Atlas asset integrity failed: ${path}`);
      return bytes;
    }catch(error){
      // The compressed sibling is an optimisation only: a transport that re-encodes it, a blocked
      // fetch or a failed decode must never cost the atlas its labels. The raw asset is still
      // integrity-checked by checked().
      console.warn(`Compressed atlas asset fell back to the raw file: ${gz.path}`,error);
      return checked(path);
    }
  }
  const draco=new DRACOLoader();draco.setDecoderPath('./vendor/addons/libs/draco/gltf/');draco.setWorkerLimit(2);
  const loader=new GLTFLoader();loader.setDRACOLoader(draco);loader.setMeshoptDecoder(MeshoptDecoder);
  async function geometry(path){
    const gltf=await loader.parseAsync(await checked(path),'');
    const mesh=gltf.scene.getObjectByProperty('isMesh',true);if(!mesh)throw new Error('Empty atlas mesh');
    gltf.scene.updateMatrixWorld(true);
    const geo=mesh.geometry;
    // applyMatrix4 writes back through the attribute; normalized integers would clamp
    // transformed millimetre coordinates to [-1, 1]. Expand them before applying it.
    const positions=geo.getAttribute('position');
    if(positions.normalized){
      const values=new Float32Array(positions.count*3);
      for(let i=0;i<positions.count;i++)values.set([positions.getX(i),positions.getY(i),positions.getZ(i)],i*3);
      geo.setAttribute('position',new THREE.BufferAttribute(values,3));
    }
    geo.applyMatrix4(mesh.matrixWorld);geo.computeVertexNormals();
    mesh.material?.dispose();return geo;
  }
  let surfaceMeta,tractMeta,tractRangeLoader,labels,networks=null,sub,bundleError='';
  let networkSel=networkSelection('off'),arterialSel=arterialSelection('off'),arterial=null,arterialRows=[];
  try {
    onStatus('Loading the reference atlas · cortical surface…');
    // Pathway metadata is small; bundle bytes are fetched by range when a scene needs them.
    const pathways=Promise.all([json('tracts.json'),json('tracts-ranges.json')]);pathways.catch(()=>{});
    const [left,right,labelBuffer,surfaceJson]=await Promise.all([geometry('cortex-L.glb'),geometry('cortex-R.glb'),checkedMaybeGzip('surface-labels.bin'),json('surface.json')]);
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
      geo.boundsTree=new MeshBVH(geo);
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
    context=new THREE.Mesh(contextGeometry,new THREE.MeshStandardMaterial({
      color:0x8e8794,roughness:.8,side:THREE.DoubleSide,
      clippingPlanes:[new THREE.Plane(new THREE.Vector3(0,0,-1),0)]}));
    configContextMaterial(context.material,{THREE,opacity:.12});
    contextGeometry.boundsTree=new MeshBVH(contextGeometry);
    scene.add(context);
    frameGeometry.push(context.geometry);
    const bounds=new THREE.Box3();for(const geo of frameGeometry){geo.computeBoundingBox();bounds.union(geo.boundingBox);}bounds.getCenter(centre);
    sub=await json('subcortex.json');
    const deepColours={THA:0xc69d71,HIP:0x68afae,AMY:0xd28b90,PUT:0xa19dbb,CAU:0x829eba,GP:0xb5ab78,NAc:0xc39178};
    await Promise.all(sub.structures.map(async entry=>{
      const mesh=new THREE.Mesh(await geometry(entry.mesh),new THREE.MeshStandardMaterial({
        color:deepColours[entry.id.split('-')[0]],roughness:.5,transparent:true,opacity:.7,depthWrite:false}));
      mesh.geometry.boundsTree=new MeshBVH(mesh.geometry);
      mesh.visible=false;mesh.userData={...entry,kind:'deep'};scene.add(mesh);deep.push(mesh);
    }));
  } catch(error){
    scene.traverse(o=>{disposeGeometry(o.geometry);o.material?.dispose();});draco.dispose();disposeBase();throw error;
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
      host.boundary=fatLine(points,{normals,color:0xe1b0f7,linewidth:1.5});
      host.boundary.material.resolution.copy(drawSize);host.boundary.renderOrder=3;host.group.add(host.boundary);
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
    }updateBoundary();requestDraw();sceneChanged();
  }
  function rebuildAnnotations(){
    annotationLayer.replaceChildren();leaders.replaceChildren();annotations=[];annotationStamp='';
    const named=[...(selected?[{...selected,primary:true}]:[]),...highlighted];
    const seen=new Set(),p=new THREE.Vector3();
    function addLabel({key,hemi,id,primary=false,indices,centroid,geo,kind='parcel',name,tint,mesh}){
      const node=document.createElement('div');node.className='atlas-parcel-label';node.setAttribute('role','listitem');
      node.dataset.primary=String(primary);node.dataset.structure=key;node.dataset.kind=kind;
      const text=document.createElement('span');text.textContent=`${hemi}\u00a0·\u00a0${name}`;
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
  const labelRay=new THREE.Raycaster();labelRay.firstHitOnly=true;
  function updateAnnotations(now){
    if(!annotations.length)return;
    const w=mount.clientWidth,h=mount.clientHeight;
    const stamp=[...camera.position.toArray(),...currentTarget().toArray(),w,h].join(',');
    if(annotationStamp===stamp)return;
    if(now-annotationTime<100&&(cameraTransition||pipeline.diagnostics.interacting))return;
    annotationTime=now;annotationStamp=stamp;
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    leaders.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const p=new THREE.Vector3(),n=new THREE.Vector3(),toward=new THREE.Vector3();
    const candidates=Object.values(hemis).filter(host=>host.group.visible).map(host=>host.shell);
    const columns=[[],[]],labelWidth=Math.min(150,Math.max(120,w*.40)),gap=6;
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
      // Each label is as wide as its name, up to labelWidth, so short codes cover less anatomy.
      a.node.style.cssText=`max-width:${labelWidth}px`;a.width=Math.ceil(a.node.getBoundingClientRect().width);a.height=a.node.offsetHeight;
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
        const left=side?w-a.width-8:8;
        a.node.style.cssText=`left:${left}px;top:${top}px;width:${a.width}px`;
        if(a.tint){a.node.style.setProperty('--label-color',a.tint);a.line.style.stroke=a.tint;}
        a.line.setAttribute('x1',String(side?left:left+a.width));a.line.setAttribute('y1',String(top+a.height/2));
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
    rebuildAnnotations();requestDraw();sceneChanged();
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
    rebuildAnnotations();requestDraw();sceneChanged();
  }
  function clearBundles(){
    clearHover();
    for(const {group} of bundles.values()){scene.remove(group);group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
    bundles.clear();traces.length=0;sceneChanged();
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
        const lines=decodeAtlasBundle({...meta,offset:0},loaded.get(id)),positions=[],arc=[],segmentOwners=[],ranges=[],tracePositions=[],traceArc=[];
        for(const [li,line] of lines.entries()) {
          const first=segmentOwners.length;
          let length=0;const lengths=[0];
          for(let i=1;i<line.length;i++){length+=Math.hypot(...line[i].map((x,j)=>x-line[i-1][j]));lengths.push(length);}
          for(let i=1;i<line.length;i++) {
            positions.push(...line[i-1],...line[i]);arc.push(lengths[i-1]/length,lengths[i]/length);segmentOwners.push(li);
            if(li%Math.ceil(lines.length/18)===0){tracePositions.push(...line[i-1],...line[i]);traceArc.push(lengths[i-1]/length,lengths[i]/length);}
          }
          ranges.push({first,count:segmentOwners.length-first});
        }
        const tint=isGhost?GHOST_TINT:BUNDLE_TINTS[colourIndex%BUNDLE_TINTS.length];
        const alpha=isGhost?.12:.30;
        if(!isGhost)colourIndex++;
        const group=new THREE.Group();group.add(fatLine(positions,{arc,color:tint,opacity:alpha,linewidth:1.75,effect:'feather'}));
        if(!isGhost){
          const trace=fatLine(tracePositions,{arc:traceArc,color:0xffc75c,linewidth:2.5,depthTest:false,effect:'pulse'});
          trace.material.userData.time.value=time;trace.material.userData.phase.value=colourIndex*.7;
          trace.visible=profile==='teaching';trace.renderOrder=5;
          group.add(trace);traces.push(trace);
        }
        for(const line of group.children)line.material.resolution.copy(drawSize);
        bundles.set(id,{group,ghost:isGhost,alpha,tint,positions,arc,segmentToStreamline:Int32Array.from(segmentOwners),ranges,lineCount:lines.length});scene.add(group);
      }
      applyClipping();requestDraw();sceneChanged();
    }catch(error){
      if(request===bundleRequest&&!disposed){bundleError=error.message;onStatus(`Reference atlas unavailable: ${String(error.message).replace(/\.$/,'')}. Reload to retry.`);console.error(error);}
    }
  }
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();ray.firstHitOnly=true;ray.params.Line2={threshold:2};let down,hoverFrame=0;
  function clearBundleHover(){
    if(!hoveredLine)return;
    const {overlay,group}=hoveredLine;group.remove(overlay);overlay.geometry.dispose();overlay.material.dispose();hoveredLine=null;requestDraw();
  }
  function showBundleHover(id,streamline){
    if(hoveredLine?.bundle===id&&hoveredLine.streamline===streamline)return;
    clearBundleHover();
    const bundle=bundles.get(id),{first,count}=bundle.ranges[streamline];
    const overlay=fatLine(bundle.positions.slice(first*6,(first+count)*6),
      {arc:bundle.arc.slice(first*2,(first+count)*2),color:0xffedaa,opacity:.95,linewidth:3.5,effect:'feather'});
    overlay.material.resolution.copy(drawSize);overlay.material.clippingPlanes=slice?[slicePlane]:null;overlay.renderOrder=6;bundle.group.add(overlay);
    hoveredLine={bundle:id,streamline,overlay,group:bundle.group};requestDraw();
  }
  function pickAt(e,includeBundles=false){
    const rect=renderer.domElement.getBoundingClientRect();ndc.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    ray.setFromCamera(ndc,camera);
    const candidates=Object.values(hemis).filter(h=>h.group.visible).map(h=>h.shell);
    const deepHit=ray.intersectObjects(deep.filter(x=>x.visible),false)[0],cortexHit=ray.intersectObjects(candidates,false)[0];
    if(includeBundles){
      const lines=[...bundles.values()].map(bundle=>bundle.group.children[0]);
      const lineHit=ray.intersectObjects(lines,false)[0];
      if(lineHit&&(!cortexHit||surface<.6||lineHit.distance<=cortexHit.distance)){
        const [id,bundle]=[...bundles].find(([,value])=>value.group.children[0]===lineHit.object);
        return {bundle:id,streamline:bundle.segmentToStreamline[lineHit.faceIndex],total:bundle.lineCount};
      }
    }
    // An opaque surface occludes deep picking; a transparent reference shell does not.
    const hit=surface>=.6?(cortexHit&&(!deepHit||cortexHit.distance<deepHit.distance)?cortexHit:deepHit):(deepHit||cortexHit);
    if(!hit)return null;
    if(hit.object.userData.kind==='deep')return {deep:hit.object.userData};
    const h=Object.keys(hemis).find(k=>hemis[k].shell===hit.object),pos=hemis[h].geo.attributes.position;
    const p=new THREE.Vector3();let nearest=hit.face.a,distance=Infinity;
    for(const i of [hit.face.a,hit.face.b,hit.face.c]){p.fromBufferAttribute(pos,i);const d=p.distanceToSquared(hit.point);if(d<distance){nearest=i;distance=d;}}
    return {hemi:h,id:labels[h][nearest],vertex:nearest};
  }
  function clearHover(){cancelAnimationFrame(hoverFrame);hoverFrame=0;clearBundleHover();onHover(null);if(hoverPick){hoverPick=null;applySelection();}}
  renderer.domElement.addEventListener('pointerdown',e=>{cameraTransition=null;clearHover();down=[e.clientX,e.clientY];});
  renderer.domElement.addEventListener('pointerup',e=>{
    if(!down||e.button!==0||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5){down=null;return;}down=null;
    const pick=pickAt(e);if(pick)onPick(pick);
  });
  if(hover)renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch'||controlsActive)return;
    cancelAnimationFrame(hoverFrame);hoverFrame=requestAnimationFrame(()=>{hoverFrame=0;if(disposed||controlsActive)return;const pick=pickAt(e,true);
      if(pick?.bundle)showBundleHover(pick.bundle,pick.streamline);else clearBundleHover();
      onHover(pick,{x:e.clientX,y:e.clientY});
      const next=pick&&!pick.deep&&!pick.bundle?{hemi:pick.hemi,id:pick.id}:null;
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
  // Slice plane (atlas_slice_panel.js): one world-axis plane through the reference scene. It
  // clips the cortex, deep structures, inferior context and pathways, and sliceAt() returns what
  // that same plane cuts, so the 2D section and the 3D cut always describe one geometry.
  const sliceBounds=()=>{const box=new THREE.Box3();for(const geo of frameGeometry){geo.computeBoundingBox();box.union(geo.boundingBox);}return box;};
  function applyClipping(){
    const planes=slice?.clip?[slicePlane]:null;
    for(const host of Object.values(hemis))host.shell.material.clippingPlanes=planes;
    for(const mesh of deep)mesh.material.clippingPlanes=planes;
    if(context)context.material.clippingPlanes=[context.material.clippingPlanes[0],...(planes||[])];
    for(const {group} of bundles.values())for(const line of group.children)line.material.clippingPlanes=planes;
  }
  function disposeSliceFrame(){if(!sliceFrame)return;scene.remove(sliceFrame);sliceFrame.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});sliceFrame=null;}
  /** {axis:'axial'|'coronal'|'sagittal', value (mm), keep:-1|1, clip, crosshair:[x,y,z]} or null to clear. */
  function setSlice(next){
    disposeSliceFrame();
    slice=next&&SLICE_AXES[next.axis]&&Number.isFinite(next.value)?{axis:next.axis,value:next.value,keep:next.keep===1?1:-1,clip:next.clip!==false,
      crosshair:Array.isArray(next.crosshair)?next.crosshair.slice(0,3):null}:null;
    if(slice){
      const n=SLICE_AXES[slice.axis].normal,normal=new THREE.Vector3();normal.setComponent(n,slice.keep);
      // three keeps fragments where normal·p + constant >= 0: keep -1 keeps world[n] <= value.
      slicePlane.set(normal,-slice.keep*slice.value);
      const box=sliceBounds().expandByScalar(6),corners=[],{u,v}=SLICE_AXES[slice.axis];
      for(const [a,b] of [[0,0],[1,0],[1,1],[0,1]]){const p=new THREE.Vector3();p.setComponent(n,slice.value);
        p.setComponent(u,a?box.max.getComponent(u):box.min.getComponent(u));p.setComponent(v,b?box.max.getComponent(v):box.min.getComponent(v));corners.push(p);}
      const outline=[];for(let i=0;i<4;i++)outline.push(...corners[i].toArray(),...corners[(i+1)%4].toArray());
      sliceFrame=new THREE.Group();sliceFrame.add(fatLine(outline,{color:0xe4e6e3,opacity:.55,linewidth:1.25}));
      if(slice.crosshair){const c=new THREE.Vector3().fromArray(slice.crosshair);c.setComponent(n,slice.value);const cross=[];
        for(const axis of [u,v]){const a=c.clone(),b=c.clone();a.setComponent(axis,box.min.getComponent(axis));b.setComponent(axis,box.max.getComponent(axis));cross.push(...a.toArray(),...b.toArray());}
        sliceFrame.add(fatLine(cross,{color:0xe4e6e3,opacity:.35,linewidth:1,depthTest:false}));}
      for(const line of sliceFrame.children){line.material.resolution.copy(drawSize);line.renderOrder=7;}
      scene.add(sliceFrame);
    }
    applyClipping();requestDraw();
  }
  const sliceIndexCache=new WeakMap();
  // Contours chain through shared vertex ids; a GLB that stores triangles unshared is welded once.
  function sliceSource(geo){
    if(geo.index)return {positions:geo.attributes.position.array,index:geo.index.array};
    if(!sliceIndexCache.has(geo)){const welded=new THREE.BufferGeometry();welded.setAttribute('position',geo.attributes.position);
      const merged=mergeVertices(welded,1e-4);sliceIndexCache.set(geo,{positions:merged.attributes.position.array,index:merged.index.array});}
    return sliceIndexCache.get(geo);
  }
  /** Everything the plane world[axis] = value cuts in the visible scene, in world mm. */
  function sliceAt(axis,value){
    const n=SLICE_AXES[axis].normal,result={axis,value,cortex:[],deep:[],context:[],bundles:[]};
    for(const h of ['L','R']){const host=hemis[h];if(!host.group.visible)continue;
      const cut=sliceMesh(host.geo.attributes.position.array,host.geo.index.array,n,value),colour=host.geo.attributes.color.array,index=host.geo.index.array;
      const count=cut.triangles.length,colours=new Float32Array(count*3),ids=new Int32Array(count);
      for(let i=0;i<count;i++){const v=index[cut.triangles[i]*3];colours.set(colour.subarray(v*3,v*3+3),i*3);ids[i]=labels[h][v];}
      result.cortex.push({hemi:h,segments:cut.segments,colours,ids});}
    for(const mesh of deep){if(!mesh.visible)continue;const {positions,index}=sliceSource(mesh.geometry);
      const loops=chainContours(sliceMesh(positions,index,n,value));
      if(loops.length)result.deep.push({id:mesh.userData.id,name:mesh.userData.name,hemisphere:mesh.userData.hemisphere,
        colour:`#${mesh.material.color.getHexString()}`,opacity:mesh.material.opacity,loops});}
    if(context){const {positions,index}=sliceSource(context.geometry);
      // The 3D context mesh is only drawn below z = 0 (its own clip plane); the section matches.
      result.context=chainContours(sliceMesh(positions,index,n,value)).map(loop=>loop.filter(p=>p[2]<=0)).filter(loop=>loop.length>1);}
    for(const [id,bundle] of bundles){const cut=slicePolylines(bundle.positions,n,value);
      if(cut.points.length)result.bundles.push({id,ghost:bundle.ghost,tint:`#${new THREE.Color(bundle.tint).getHexString()}`,points:cut.points});}
    return result;
  }
  /** The visible HCP-MMP1 parcel nearest a world point (within maxMm), or null. */
  function parcelNear(point,maxMm=4){
    let best=null;
    for(const h of ['L','R']){const host=hemis[h];if(!host.group.visible)continue;
      const pos=host.geo.attributes.position.array,i=nearestVertex(pos,point,best?best.distance:maxMm);
      if(i<0)continue;const distance=Math.hypot(pos[i*3]-point[0],pos[i*3+1]-point[1],pos[i*3+2]-point[2]);
      best={hemi:h,id:labels[h][i],vertex:i,distance};}
    if(!best||best.id===0)return null;
    const raw=surfaceMeta.sets.glasser.regions[best.hemi][best.id];
    return {...best,code:String(raw).replace(/^[LR]_/,'').replace(/_ROI$/,'')};
  }
  let templatePromise=null;
  /** The MNI152NLin2009aAsym T1w underlay, fetched and integrity-checked once, on first use. */
  function loadSliceTemplate(){
    templatePromise??=Promise.all([json('template-t1.json'),checkedMaybeGzip('template-t1.bin')]).then(([header,bytes])=>({
      ...header,origin:header.origin_mm,spacing:header.resolution_mm,data:new Uint8Array(bytes)}));
    templatePromise.catch(()=>{templatePromise=null;});
    return templatePromise;
  }
  function snapshot(){return {selected:selected?{...selected}:null,highlighted:highlighted.map(r=>({...r})),hemisphere:visibleHemi,network:{...networkSel},
    bundles:bundleIdsBy(false),ghostBundles:bundleIdsBy(true),deepHighlight:[...deepHighlightIds],
    surface,deepVisible,view,camera:camera.position.toArray(),target:currentTarget().toArray(),up:camera.up.toArray()};}
  function setCorridors(specs){
    if(!corridorOverlay&&specs.length) corridorOverlay=createCorridorOverlay({THREE,scene,mount,requestDraw});
    corridorOverlay?.set(specs);
  }
  function restore(state){
    cameraTransition=null;
    select(state.selected?.hemi??null,state.selected?.id);highlight(state.highlighted||[]);
    setHemisphere(state.hemisphere);setBundles(state.bundles,{ghost:state.ghostBundles||[]});
    setDeep(state.deepVisible);setDeepHighlight(state.deepHighlight||[]);setNetworks(state.network||networkSelection('off'));
    setSurface(state.surface);
    camera.up.fromArray(state.up);controls.updateCameraUp();view=state.view;
    autoFrame=false;frameFocus=false;lookAt(new THREE.Vector3().fromArray(state.camera),new THREE.Vector3().fromArray(state.target));controls.update(0);requestDraw();
  }
  function projectBundleVertex(id,streamline,vertex){
    const bundle=bundles.get(id),range=bundle?.ranges[streamline];
    if(!range||vertex<0||vertex>range.count)return null;
    const segment=range.first+Math.min(vertex,range.count-1),offset=segment*6+(vertex===range.count?3:0);
    const point=new THREE.Vector3(...bundle.positions.slice(offset,offset+3)).project(camera);
    const rect=renderer.domElement.getBoundingClientRect();
    return {x:rect.left+(point.x+1)*rect.width/2,y:rect.top+(1-point.y)*rect.height/2,z:point.z};
  }
  return {surfaceMeta,tractMeta,subMeta:sub,manifest,select,highlight,setHemisphere,setDeep,setDeepHighlight,
    setBundles,setView,flyTo,snapshot,restore,setNetworks,networkAt,hasNetworks,parcelNetwork,
    setArterial,arterialAt,hasArterial,get arterialRows(){return arterialRows;},
    setSurface,setLesion,setCorridors,projectBundleVertex,setFrameInsets,
    setSlice,sliceAt,parcelNear,loadSliceTemplate,onSceneChange(listener){sceneListeners.add(listener);return ()=>sceneListeners.delete(listener);},
    // For a page that draws its own layer (the lesion lab): the live scene, camera and controls,
    // the on-demand redraw, the interactive size budget, and verified bundle bytes by id.
    get stage(){return {scene,camera,controls,canvas:renderer.domElement,requestDraw,setInteracting:pipeline.setInteracting,
      setFrameHold(v){frameHold=!!v;},loadBundleBytes:ids=>tractRangeLoader.load(ids)};},
    setProfile(value){profile=value==='presenter'?'presenter':'teaching';for(const t of traces)t.visible=profile==='teaching';requestDraw();},
    setPlaying(value){playing=!!value;last=0;requestDraw();},
    get state(){return {ready:true,profile,playing:playing&&profile==='teaching'&&!reduced.matches,
      reducedMotion:reduced.matches,time,frames,selected,highlighted:highlighted.map(r=>({...r})),hemisphere:visibleHemi,
      bundles:bundleIdsBy(false),ghostBundles:bundleIdsBy(true),tractError:bundleError,
      hover:hoveredLine?{bundle:hoveredLine.bundle,streamline:hoveredLine.streamline}:null,
      bundleAlpha:Object.fromEntries([...bundles].map(([id,v])=>[id,v.alpha])),network:{...networkSel},arterial:{...arterialSel},corridors:corridorOverlay?.state.corridors??[],
      vertices:Object.values(hemis).map(h=>h.count),view,deepVisible,slice:slice?{...slice,crosshair:slice.crosshair?[...slice.crosshair]:null}:null,lesion:lesion?{...lesion.marker}:null,deepHighlight:[...deepHighlightIds],deepFocus:[...deepFocusIds],
      render:{cortex:'shaded-mesh',pipeline:pipeline.diagnostics,surfaceOpacity:hemis.L.shell.material.opacity,
        cameraFrame:frameFocus?'lesson':'whole',target:currentTarget().toArray(),
        labels:annotations.map(a=>({key:a.key,kind:a.kind,x:a.x,y:a.y,visibility:a.visibility,primary:a.primary}))},
      camera:camera.position.toArray(),cameraTransition:cameraTransition?{elapsed:performance.now()-cameraTransition.start,duration:cameraTransition.duration}:null};},
    dispose(){clearHover();sceneListeners.clear();disposeSliceFrame();corridorOverlay?.dispose();reduced.removeEventListener('change',motionChanged);draco.dispose();scene.traverse(o=>{disposeGeometry(o.geometry);o.material?.dispose();});disposeBase();},
  };
}
