import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {SLICE_AXES,SLICE_AXIS_IDS,toPlane,fromPlane,sliceMesh,chainContours,slicePolylines,sampleVolume,linearToSrgbByte,nearestVertex} from '../../viewer/atlas_slice.js';
import {decodeAtlasBundle} from '../../viewer/atlas_data.js';
const root=new URL('../../viewer/atlas/',import.meta.url);
const read=p=>readFile(new URL(p,root));
const sha=b=>createHash('sha256').update(b).digest('hex');

// A 20 mm cube centred on the origin: 8 vertices, 12 triangles.
const cube=()=>{
  const positions=new Float32Array([-10,-10,-10, 10,-10,-10, 10,10,-10, -10,10,-10, -10,-10,10, 10,-10,10, 10,10,10, -10,10,10]);
  const index=new Uint32Array([0,1,2,0,2,3, 4,6,5,4,7,6, 0,4,5,0,5,1, 1,5,6,1,6,2, 2,6,7,2,7,3, 3,7,4,3,4,0]);
  return {positions,index};
};

test('plane coordinates follow radiological convention and invert exactly',()=>{
  // Subject right (+x) draws on screen left; anterior and superior draw up.
  assert.deepEqual(toPlane('axial',[30,20,5]),[-30,20]);
  assert.deepEqual(toPlane('coronal',[30,20,5]),[-30,5]);
  assert.deepEqual(toPlane('sagittal',[30,20,5]),[-20,5]);
  for(const axis of SLICE_AXIS_IDS){
    const p=[12,-34,56],[u,v]=toPlane(axis,p);
    assert.deepEqual(fromPlane(axis,u,v,p[SLICE_AXES[axis].normal]),p);
  }
});

test('a cube cut through its middle gives one closed square contour at the plane',()=>{
  const {positions,index}=cube();
  for(const axis of SLICE_AXIS_IDS){
    const n=SLICE_AXES[axis].normal,cut=sliceMesh(positions,index,n,2.5);
    assert.equal(cut.segments.length/6,8,`${axis}: 4 faces x 2 triangles cross`);
    for(let i=n;i<cut.segments.length;i+=3)assert.equal(cut.segments[i],2.5);
    const loops=chainContours(cut);
    assert.equal(loops.length,1,`${axis}: one contour`);
    const loop=loops[0];
    assert.deepEqual(loop[0],loop.at(-1),`${axis}: the contour closes on itself`);
    for(const p of loop)for(let k=0;k<3;k++)if(k!==n)assert.equal(Math.abs(p[k])<=10,true);
  }
});

test('a plane outside the mesh, or through no triangle, cuts nothing',()=>{
  const {positions,index}=cube();
  assert.equal(sliceMesh(positions,index,2,10.5).segments.length,0);
  assert.equal(sliceMesh(positions,index,0,-11).segments.length,0);
  assert.deepEqual(chainContours(sliceMesh(positions,index,1,40)),[]);
});

test('non-indexed meshes slice the same as indexed ones',()=>{
  const {positions,index}=cube(),flat=new Float32Array(index.length*3);
  index.forEach((v,i)=>flat.set(positions.subarray(v*3,v*3+3),i*3));
  const a=sliceMesh(positions,index,2,-3),b=sliceMesh(flat,null,2,-3);
  assert.equal(a.segments.length,b.segments.length);
  assert.equal(chainContours(b).length,8,'non-indexed triangles share no vertex ids, so no segments join');
  assert.equal(chainContours(a).length,1);
});

test('streamline crossings land on the plane and keep their owning segment',()=>{
  const line=new Float32Array([0,0,-5, 0,0,5, 0,0,5, 4,0,15, 4,0,15, 4,0,25]);
  const cut=slicePolylines(line,2,10);
  assert.deepEqual(Array.from(cut.segments),[1]);
  assert.deepEqual(Array.from(cut.points),[2,0,10]);
  assert.equal(slicePolylines(line,2,40).segments.length,0);
  // An endpoint on the plane is counted once, by the segment that leaves it.
  assert.equal(slicePolylines(line,2,5).segments.length,1);
});

test('volume sampling orients the image radiologically and interpolates between planes',()=>{
  // 3 x 2 x 2 grid, origin (0,0,0), 1 mm: value = 10*x + 100*y + z*50 at the voxel centre.
  const dims=[3,2,2],data=new Uint8Array(12);
  for(let z=0;z<2;z++)for(let y=0;y<2;y++)for(let x=0;x<3;x++)data[x+3*(y+2*z)]=10*x+100*y+50*z;
  const slice=sampleVolume({dims,origin:[0,0,0],data},'axial',.5);
  assert.equal(slice.width,3);assert.equal(slice.height,2);
  // Top row is anterior (y = 1); left column is subject right (x = 2).
  assert.deepEqual(Array.from(slice.pixels),[145,135,125,45,35,25]);
  assert.deepEqual([slice.left,slice.right,slice.bottom,slice.top],[-2.5,.5,-.5,1.5]);
  assert.equal(sampleVolume({dims,origin:[0,0,0],data},'axial',5),null);
  const sag=sampleVolume({dims,origin:[0,0,0],data},'sagittal',1);
  // Sagittal: screen left is anterior (y = 1), top is superior (z = 1).
  assert.deepEqual(Array.from(sag.pixels),[160,60,110,10]);
});

test('colour and nearest-vertex helpers',()=>{
  assert.equal(linearToSrgbByte(0),0);assert.equal(linearToSrgbByte(1),255);
  assert.equal(linearToSrgbByte(.2159),128);
  const positions=new Float32Array([0,0,0, 5,0,0, 9,9,9]);
  assert.equal(nearestVertex(positions,[4,1,0]),1);
  assert.equal(nearestVertex(positions,[30,30,30],3),-1);
});

test('the MNI template asset matches its manifest record and grid header',async()=>{
  const manifest=JSON.parse(await read('manifest.json'));
  const header=JSON.parse(await read('template-t1.json')),bin=await read('template-t1.bin');
  const record=manifest.assets.find(a=>a.path==='template-t1.bin');
  assert.equal(sha(bin),record.sha256);assert.equal(bin.length,record.bytes);
  assert.equal(header.template,'MNI152NLin2009aAsym');
  assert.equal(bin.length,header.dims[0]*header.dims[1]*header.dims[2]);
  assert.equal(record.terms,'MNI template permission notice');
});

test('HCP1065 pathways fall inside the template brain: one MNI frame, not a registration',async()=>{
  const header=JSON.parse(await read('template-t1.json')),data=await read('template-t1.bin');
  const meta=JSON.parse(await read('tracts.json')),buffer=await read('tracts.bin');
  const tracts=buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength);
  const {dims,origin_mm:origin}=header;
  for(const id of ['CST_L','AF_R','CC','OR_L'].filter(id=>meta.bundles.some(b=>b.id===id))){
    const points=decodeAtlasBundle(meta.bundles.find(b=>b.id===id),tracts).flat();
    let inside=0;
    for(const p of points){
      const ijk=p.map((x,k)=>Math.round(x-origin[k]));
      if(ijk.every((v,k)=>v>=0&&v<dims[k])&&data[ijk[0]+dims[0]*(ijk[1]+dims[1]*ijk[2])]>0)inside++;
    }
    assert(inside/points.length>.97,`${id}: ${(100*inside/points.length).toFixed(1)}% of points inside the template brain`);
  }
});
