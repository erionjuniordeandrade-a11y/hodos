import {normalizeCorridor} from './corridor_geometry.js';

const cylinderAxis=(THREE)=>new THREE.Vector3(0,1,0);
const ringAxis=(THREE)=>new THREE.Vector3(0,0,1);

function stateSpec({id,label,color,start,end,radiusMm,center,direction,lengthMm}){
  return {id,label,color,start:[...start],end:[...end],radiusMm,center:[...center],direction:[...direction],lengthMm};
}

function disposeEntry(scene,entry){
  scene.remove(entry.group);
  const geometries=new Set(),materials=new Set();
  entry.group.traverse(object=>{
    if(object.geometry)geometries.add(object.geometry);
    for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)materials.add(material);
  });
  for(const geometry of geometries)geometry.dispose();
  for(const material of materials)material.dispose();
  entry.label.remove();
}

/**
 * Owns only illustrative corridor geometry and its visual-only labels. The caller owns
 * scene rendering and calls update(camera) from its existing draw path.
 */
export function createCorridorOverlay({THREE,scene,mount,requestDraw}={}){
  if(!THREE||typeof THREE.Group!=='function'||typeof THREE.Vector3!=='function')throw new TypeError('THREE is required');
  if(!scene||typeof scene.add!=='function'||typeof scene.remove!=='function')throw new TypeError('scene is required');
  if(!mount||typeof mount.append!=='function')throw new TypeError('mount is required');
  if(typeof requestDraw!=='function')throw new TypeError('requestDraw is required');

  const layer=document.createElement('div');
  layer.className='corridor-labels';
  mount.append(layer);
  let entries=[],specs=[],disposed=false;

  function build(spec){
    const group=new THREE.Group();
    const direction=new THREE.Vector3(...spec.direction);
    const start=new THREE.Vector3(...spec.start);
    const end=new THREE.Vector3(...spec.end);
    const center=new THREE.Vector3(...spec.center);

    const volume=new THREE.Mesh(
      new THREE.CylinderGeometry(spec.radiusMm,spec.radiusMm,spec.lengthMm,32,1,false),
      new THREE.MeshBasicMaterial({color:spec.color,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),
    );
    volume.position.copy(center);
    volume.quaternion.setFromUnitVectors(cylinderAxis(THREE),direction);
    volume.renderOrder=6;
    group.add(volume);

    const ringGeometry=new THREE.RingGeometry(spec.radiusMm*.84,spec.radiusMm,32);
    const ringMaterial=new THREE.MeshBasicMaterial({color:spec.color,transparent:true,opacity:.78,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    for(const point of [start,end]){
      const ring=new THREE.Mesh(ringGeometry,ringMaterial);
      ring.position.copy(point);
      ring.quaternion.setFromUnitVectors(ringAxis(THREE),direction);
      ring.renderOrder=7;
      group.add(ring);
    }

    const axisGeometry=new THREE.BufferGeometry().setFromPoints([start,end]);
    const axis=new THREE.Line(axisGeometry,new THREE.LineBasicMaterial({color:spec.color,transparent:true,opacity:.94,toneMapped:false}));
    axis.renderOrder=8;
    group.add(axis);

    const label=document.createElement('div');
    label.className='corridor-label';
    label.dataset.corridor=spec.id;
    label.setAttribute('aria-hidden','true');
    label.textContent=spec.id;
    label.hidden=true;
    return {group,label,start};
  }

  function hideLabels(){
    for(const entry of entries)entry.label.hidden=true;
  }

  function set(input){
    if(disposed)throw new Error('corridor overlay is disposed');
    if(!Array.isArray(input))throw new TypeError('corridor specs must be an array');
    const normalized=input.map(normalizeCorridor);
    const ids=new Set();
    for(const spec of normalized){
      if(ids.has(spec.id))throw new Error(`duplicate corridor id: ${spec.id}`);
      ids.add(spec.id);
    }
    const next=[];
    try{
      for(const spec of normalized)next.push(build(spec));
    }catch(error){
      for(const entry of next)disposeEntry(scene,entry);
      throw error;
    }
    for(const entry of entries)disposeEntry(scene,entry);
    entries=next;
    specs=normalized;
    for(const entry of entries){scene.add(entry.group);layer.append(entry.label);}
    requestDraw();
  }

  function update(camera){
    if(disposed)return;
    if(!camera||typeof camera.updateMatrixWorld!=='function'||!camera.matrixWorldInverse){hideLabels();return;}
    camera.updateMatrixWorld();
    const rect=typeof mount.getBoundingClientRect==='function'?mount.getBoundingClientRect():null;
    const width=Number(rect?.width??mount.clientWidth),height=Number(rect?.height??mount.clientHeight);
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0){hideLabels();return;}
    for(const entry of entries){
      const cameraPoint=entry.start.clone().applyMatrix4(camera.matrixWorldInverse);
      const projected=entry.start.clone().project(camera);
      const x=(projected.x+1)*width/2,y=(1-projected.y)*height/2;
      const inFrame=cameraPoint.z<0&&projected.z>=-1&&projected.z<=1&&projected.x>=-1&&projected.x<=1&&projected.y>=-1&&projected.y<=1&&Number.isFinite(x)&&Number.isFinite(y);
      if(!inFrame){entry.label.hidden=true;continue;}
      entry.label.style.left=`${Math.round(x)}px`;
      entry.label.style.top=`${Math.round(y)}px`;
      entry.label.hidden=false;
    }
  }

  function dispose(){
    if(disposed)return;
    for(const entry of entries)disposeEntry(scene,entry);
    entries=[];specs=[];layer.remove();disposed=true;
    requestDraw();
  }

  return {set,update,get state(){return {corridors:specs.map(stateSpec)};},dispose};
}
