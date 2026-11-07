// Lit streamline geometry for Cinematic view, ported from the cinematic prototype (itself a port of
// build_shots_v2.py). Pure typed-array maths: no DOM, no three, so node tests import it directly.
// The spline passes through every original point (display interpolation only, no smoothing, no bundling);
// k=1 keeps the original points unchanged.

// Direction colour: red = left-right (x), green = front-back (y), blue = up-down (z), in sRGB.
export const DIRECTION_COLOUR_HEX=Object.freeze({x:'#E0605A',y:'#62B97A',z:'#6A93E8'});
const srgbToLinear=hex=>[1,3,5].map(i=>{const c=parseInt(hex.slice(i,i+2),16)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});
const DIRECTION_LINEAR={x:srgbToLinear(DIRECTION_COLOUR_HEX.x),y:srgbToLinear(DIRECTION_COLOUR_HEX.y),z:srgbToLinear(DIRECTION_COLOUR_HEX.z)};

/** Fast Quality tier: the original points, 4 sides, 0.30 mm radius. */
export const LIT_STREAMLINE_FAST=Object.freeze({k:1,sides:4,radius:.3});

/** Uniform Catmull-Rom through every point. pts: [[x,y,z],...] */
export function catmullRom(pts,k){
  if(k<=1)return pts.map(p=>p.slice());
  const P=pts.length,ext=[pts[0].map((v,a)=>2*v-pts[1][a]),...pts,pts[P-1].map((v,a)=>2*v-pts[P-2][a])],out=[];
  for(let i=0;i<P-1;i++){const p0=ext[i],p1=ext[i+1],p2=ext[i+2],p3=ext[i+3];
    for(let s=0;s<k;s++){const t=s/k,t2=t*t,t3=t2*t;
      out.push([0,1,2].map(a=>.5*(2*p1[a]+(p2[a]-p0[a])*t+(2*p0[a]-5*p1[a]+4*p2[a]-p3[a])*t2+(3*p1[a]-p0[a]-3*p2[a]+p3[a])*t3)));}}
  out.push(pts[P-1].slice());
  return out;
}
const unit=v=>{const n=Math.hypot(v[0],v[1],v[2])+1e-12;return [v[0]/n,v[1]/n,v[2]/n];};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
/** numpy.gradient along the curve (central inside, one-sided at the ends), normalised. */
function tangents(c){
  const P=c.length,T=new Array(P);
  for(let i=0;i<P;i++){const a=c[Math.max(0,i-1)],b=c[Math.min(P-1,i+1)],d=(i===0||i===P-1)?1:2;
    T[i]=unit([(b[0]-a[0])/d,(b[1]-a[1])/d,(b[2]-a[2])/d]);}
  return T;
}

/** Triangle index for `lines` streamlines of `P` rings x `sides`; every Bundle with the same shape shares it. */
export function litStreamlineIndex(lines,P,sides){
  const idx=new Uint32Array(lines*(P-1)*sides*6);let o=0;
  for(let l=0;l<lines;l++)for(let i=0;i<P-1;i++){const base=(l*P+i)*sides;
    for(let s=0;s<sides;s++){const a=base+s,b=base+(s+1)%sides,c=b+sides,d=a+sides;
      idx[o++]=a;idx[o++]=b;idx[o++]=c;idx[o++]=a;idx[o++]=c;idx[o++]=d;}}
  return idx;
}

/** One Bundle's streamlines (equal point counts) -> {position Float32, normal Int8 (normalised), color Uint16 (normalised, linear), P}.
 * Rings follow parallel transport; colour comes from the squared tangent components (Direction colour). */
export function litStreamlineGeometry(lines,{k,sides,radius}){
  const P=(lines[0].length-1)*k+1,V=lines.length*P*sides;
  const position=new Float32Array(V*3),normal=new Int8Array(V*3),color=new Uint16Array(V*3),cosA=[],sinA=[];
  for(let s=0;s<sides;s++){cosA.push(Math.cos(2*Math.PI*s/sides));sinA.push(Math.sin(2*Math.PI*s/sides));}
  const X=DIRECTION_LINEAR.x,Y=DIRECTION_LINEAR.y,Z=DIRECTION_LINEAR.z;
  let v=0;
  for(const raw of lines){
    const c=catmullRom(raw,k),T=tangents(c),t0=T[0],ref=Math.abs(t0[2])<.9?[0,0,1]:[1,0,0];
    let n=unit(cross(t0,ref));
    for(let i=0;i<P;i++){
      const t=T[i],dp=n[0]*t[0]+n[1]*t[1]+n[2]*t[2];
      n=unit([n[0]-t[0]*dp,n[1]-t[1]*dp,n[2]-t[2]*dp]);
      const b=cross(t,n),w=[t[0]*t[0],t[1]*t[1],t[2]*t[2]],ws=w[0]+w[1]+w[2];
      const col=[0,1,2].map(a=>Math.round(65535*Math.min(1,(w[0]*X[a]+w[1]*Y[a]+w[2]*Z[a])/ws)));
      for(let s=0;s<sides;s++,v++){
        const r=[cosA[s]*n[0]+sinA[s]*b[0],cosA[s]*n[1]+sinA[s]*b[1],cosA[s]*n[2]+sinA[s]*b[2]];
        for(let a=0;a<3;a++){position[v*3+a]=c[i][a]+radius*r[a];normal[v*3+a]=Math.round(127*r[a]);color[v*3+a]=col[a];}
      }
    }
  }
  return {position,normal,color,P};
}
