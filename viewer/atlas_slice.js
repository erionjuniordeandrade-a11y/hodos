// Pure slicing math for the atlas slice panel: no DOM, no three.js.
// World space is MNI millimetres: x = Right, y = Anterior, z = Superior.
// Each plane is drawn in radiological convention: the subject's right on screen left,
// anterior up on axial, superior up on coronal and sagittal, anterior on screen left on sagittal.
export const SLICE_AXES=Object.freeze({
  axial:Object.freeze({normal:2,u:0,v:1,uSign:-1,vSign:1,label:'Axial',coordinate:'z',edges:['R','L','A','P']}),
  coronal:Object.freeze({normal:1,u:0,v:2,uSign:-1,vSign:1,label:'Coronal',coordinate:'y',edges:['R','L','S','I']}),
  sagittal:Object.freeze({normal:0,u:1,v:2,uSign:-1,vSign:1,label:'Sagittal',coordinate:'x',edges:['A','P','S','I']}),
});
export const SLICE_AXIS_IDS=Object.freeze(Object.keys(SLICE_AXES));

/** Plane coordinates (screen-right, screen-up) in mm for one world point. */
export function toPlane(axis,point){
  const a=SLICE_AXES[axis];return [a.uSign*point[a.u],a.vSign*point[a.v]];
}
/** The world point on the plane `value` at plane coordinates (u, v). */
export function fromPlane(axis,u,v,value){
  const a=SLICE_AXES[axis],point=[0,0,0];
  point[a.normal]=value;point[a.u]=a.uSign*u;point[a.v]=a.vSign*v;return point;
}

/**
 * Cut an indexed (or non-indexed) triangle mesh with the plane world[normal] = value.
 * Returns the crossing segments as world points (6 floats each), the source triangle of each
 * segment, and the two mesh edges each endpoint lies on (so contours can be chained exactly).
 * Vertices exactly on the plane count as above it, which keeps every crossing a clean pair.
 */
export function sliceMesh(positions,index,normal,value){
  const triangleCount=index?index.length/3:positions.length/9;
  const segments=[],triangles=[],edgeKeys=[];
  const side=v=>positions[v*3+normal]>=value;
  const point=(a,b)=>{
    // Interpolate from the lower vertex id so both triangles sharing an edge get identical bits.
    if(a>b)[a,b]=[b,a];
    const da=positions[a*3+normal]-value,db=positions[b*3+normal]-value,t=da/(da-db);
    return [0,1,2].map(k=>positions[a*3+k]+t*(positions[b*3+k]-positions[a*3+k]));
  };
  for(let t=0;t<triangleCount;t++){
    const v=index?[index[t*3],index[t*3+1],index[t*3+2]]:[t*3,t*3+1,t*3+2];
    const s=v.map(side);
    if(s[0]===s[1]&&s[1]===s[2])continue;
    const cut=[];
    for(let e=0;e<3;e++){const a=v[e],b=v[(e+1)%3];if(s[e]!==s[(e+1)%3])cut.push([a,b]);}
    for(const [a,b] of cut)segments.push(...point(a,b));
    triangles.push(t);edgeKeys.push(cut.map(([a,b])=>a<b?`${a}:${b}`:`${b}:${a}`));
  }
  return {segments:Float32Array.from(segments),triangles:Int32Array.from(triangles),edgeKeys};
}

/** Join slice segments into polylines through their shared mesh edges. Closed loops repeat their first point. */
export function chainContours({segments,edgeKeys}){
  const byEdge=new Map(),used=new Uint8Array(edgeKeys.length),loops=[];
  edgeKeys.forEach(([a,b],i)=>{for(const key of [a,b]){const list=byEdge.get(key);if(list)list.push(i);else byEdge.set(key,[i]);}});
  const pointAt=(i,end)=>Array.from(segments.subarray(i*6+end*3,i*6+end*3+3));
  for(let start=0;start<edgeKeys.length;start++){
    if(used[start])continue;used[start]=1;
    const line=[pointAt(start,0),pointAt(start,1)];
    // Walk forward from the second endpoint, then backward from the first.
    for(const direction of [1,0]){
      let key=edgeKeys[start][direction];
      for(;;){
        const next=(byEdge.get(key)||[]).find(i=>!used[i]);if(next===undefined)break;
        used[next]=1;const end=edgeKeys[next][0]===key?1:0;
        if(direction)line.push(pointAt(next,end));else line.unshift(pointAt(next,end));
        key=edgeKeys[next][end];
      }
    }
    loops.push(line);
  }
  return loops;
}

/**
 * Where streamline segments (6 floats each: start xyz, end xyz) cross the plane.
 * Returns the crossing points (3 floats each) and the segment each came from.
 */
export function slicePolylines(positions,normal,value){
  const points=[],owners=[];
  for(let s=0,n=positions.length/6;s<n;s++){
    const da=positions[s*6+normal]-value,db=positions[s*6+3+normal]-value;
    if((da<0)===(db<0))continue;
    const t=da/(da-db);
    for(let k=0;k<3;k++)points.push(positions[s*6+k]+t*(positions[s*6+3+k]-positions[s*6+k]));
    owners.push(s);
  }
  return {points:Float32Array.from(points),segments:Int32Array.from(owners)};
}

/**
 * One plane of a uint8 volume (x fastest, then y, then z; voxel (i,j,k) centred at
 * origin + (i,j,k) * spacing), linearly interpolated between the two voxel planes either
 * side of `value`. The image is returned in screen orientation (row 0 at the top) with the
 * world rectangle it covers, so a canvas can draw it at 1 px per voxel and scale.
 */
export function sampleVolume({dims,origin,spacing=1,data},axis,value){
  const a=SLICE_AXES[axis],n=a.normal;
  const f=(value-origin[n])/spacing;
  if(!(f>-1&&f<dims[n]))return null;
  const k0=Math.floor(f),w=f-k0,stride=[1,dims[0],dims[0]*dims[1]];
  const width=dims[a.u],height=dims[a.v],pixels=new Uint8ClampedArray(width*height);
  for(let row=0;row<height;row++){
    // Screen up is +v (vSign 1), so the top row is the highest v index.
    const j=a.vSign>0?height-1-row:row;
    for(let col=0;col<width;col++){
      const i=a.uSign<0?width-1-col:col;
      const base=i*stride[a.u]+j*stride[a.v];
      const lo=k0>=0?data[base+k0*stride[n]]:0,hi=k0+1<dims[n]?data[base+(k0+1)*stride[n]]:0;
      pixels[row*width+col]=lo+(hi-lo)*w;
    }
  }
  const uRange=[origin[a.u],origin[a.u]+(dims[a.u]-1)*spacing].map(x=>a.uSign*x).sort((p,q)=>p-q);
  const vRange=[origin[a.v],origin[a.v]+(dims[a.v]-1)*spacing].map(x=>a.vSign*x).sort((p,q)=>p-q);
  // The rectangle spans voxel edges, half a voxel beyond the first and last centres.
  return {width,height,pixels,left:uRange[0]-spacing/2,right:uRange[1]+spacing/2,bottom:vRange[0]-spacing/2,top:vRange[1]+spacing/2};
}

/** Linear-light (three.js colour buffer) to an sRGB 0-255 channel. */
export function linearToSrgbByte(c){
  const s=c<=.0031308?12.92*c:1.055*Math.pow(c,1/2.4)-.055;
  return Math.max(0,Math.min(255,Math.round(s*255)));
}

/** The nearest vertex to `point` among `positions` (3 floats each), within `maxMm`, or -1. */
export function nearestVertex(positions,point,maxMm=Infinity){
  let best=-1,limit=maxMm*maxMm;
  for(let i=0,n=positions.length/3;i<n;i++){
    const dx=positions[i*3]-point[0],dy=positions[i*3+1]-point[1],dz=positions[i*3+2]-point[2],d=dx*dx+dy*dy+dz*dz;
    if(d<=limit){limit=d;best=i;}
  }
  return best;
}
