// Bake the MNI152NLin2009aAsym 1 mm T1w into the slice-panel underlay (deterministic).
// Usage: node scripts/bake-mni-template.mjs --t1=<res-1_T1w.nii.gz> --mask=<res-1_desc-brain_mask.nii.gz> [--out=viewer/atlas]
// Source: TemplateFlow tpl-MNI152NLin2009aAsym (Fonov et al., 2011), MNI permission notice.
// Output: template-t1.bin (uint8, x fastest, then y, then z; brain-masked, cropped to the mask
// bounding box) + template-t1.json (grid) + template-t1.bin.gz (static wire sibling).
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync,gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import path from 'node:path';

const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
if(!args.t1||!args.mask)throw Error('usage: --t1=<T1w.nii.gz> --mask=<brain_mask.nii.gz> [--out=dir]');
const out=args.out||'viewer/atlas';
const sha=b=>createHash('sha256').update(b).digest('hex');

function nifti(raw){
  const b=gunzipSync(raw),v=new DataView(b.buffer,b.byteOffset,b.byteLength);
  if(v.getInt32(0,true)!==348)throw Error('not a little-endian NIfTI-1 file');
  const dims=[1,2,3].map(i=>v.getInt16(40+2*i,true)),type=v.getInt16(70,true),offset=v.getFloat32(108,true);
  const srow=[0,1,2].map(r=>[0,1,2,3].map(c=>v.getFloat32(280+16*r+4*c,true)));
  if(v.getInt16(254,true)<1)throw Error('sform required');
  srow.forEach((row,r)=>row.slice(0,3).forEach((x,c)=>{if(x!==(r===c?1:0))throw Error('expected an axis-aligned 1 mm RAS grid');}));
  const n=dims[0]*dims[1]*dims[2],data=new Float32Array(n);
  const read={2:o=>v.getUint8(o),4:o=>v.getInt16(o,true),16:o=>v.getFloat32(o,true),512:o=>v.getUint16(o,true)}[type];
  const step={2:1,4:2,16:4,512:2}[type];
  if(!read)throw Error(`unsupported NIfTI datatype ${type}`);
  for(let i=0;i<n;i++)data[i]=read(offset+i*step);
  return {dims,origin:srow.map(r=>r[3]),data};
}

const [t1Raw,maskRaw]=await Promise.all([readFile(args.t1),readFile(args.mask)]);
const t1=nifti(t1Raw),mask=nifti(maskRaw);
if(t1.dims.join()!==mask.dims.join()||t1.origin.join()!==mask.origin.join())throw Error('T1 and mask grids differ');
const [nx,ny,nz]=t1.dims;
const lo=[nx,ny,nz],hi=[-1,-1,-1],inside=[];
for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  const i=x+nx*(y+ny*z);
  if(mask.data[i]<0.5)continue;
  inside.push(t1.data[i]);
  [x,y,z].forEach((c,k)=>{lo[k]=Math.min(lo[k],c);hi[k]=Math.max(hi[k],c);});
}
// Window: 0 → black, the 99.5th in-brain percentile → white. One margin voxel keeps edges soft.
const sorted=Float32Array.from(inside).sort();
const white=sorted[Math.floor(0.995*(sorted.length-1))];
for(let k=0;k<3;k++){lo[k]=Math.max(0,lo[k]-1);hi[k]=Math.min(t1.dims[k]-1,hi[k]+1);}
const size=[0,1,2].map(k=>hi[k]-lo[k]+1),bytes=new Uint8Array(size[0]*size[1]*size[2]);
for(let z=0;z<size[2];z++)for(let y=0;y<size[1];y++)for(let x=0;x<size[0];x++){
  const i=(x+lo[0])+nx*((y+lo[1])+ny*(z+lo[2]));
  if(mask.data[i]<0.5)continue;
  bytes[x+size[0]*(y+size[1]*z)]=Math.max(0,Math.min(255,Math.round(255*t1.data[i]/white)));
}
const header={
  template:'MNI152NLin2009aAsym',resolution_mm:1,dims:size,
  origin_mm:[0,1,2].map(k=>t1.origin[k]+lo[k]),
  layout:'uint8, x fastest then y then z; voxel (i,j,k) centre at origin_mm + (i,j,k) mm; MNI x=Right, y=Anterior, z=Superior',
  window:{black:0,white:Math.round(white),note:'raw T1w intensity mapped linearly to 0-255 inside the brain mask; 0 outside'},
  source:{t1:path.basename(args.t1),t1_sha256:sha(t1Raw),mask:path.basename(args.mask),mask_sha256:sha(maskRaw),
    url:'https://templateflow.s3.amazonaws.com/tpl-MNI152NLin2009aAsym/',reference:'Fonov et al., NeuroImage 2011;54:313-327, doi:10.1016/j.neuroimage.2010.07.033'},
};
const json=JSON.stringify(header,null,1)+'\n',gz=gzipSync(bytes,{level:9});
await writeFile(path.join(out,'template-t1.bin'),bytes);
await writeFile(path.join(out,'template-t1.bin.gz'),gz);
await writeFile(path.join(out,'template-t1.json'),json);
console.log(JSON.stringify({dims:size,origin:header.origin_mm,white:header.window.white,
  bin:{bytes:bytes.length,sha256:sha(bytes)},gz:{bytes:gz.length,sha256:sha(gz)},json:{bytes:Buffer.byteLength(json),sha256:sha(json)},
  t1_sha256:header.source.t1_sha256,mask_sha256:header.source.mask_sha256},null,1));
