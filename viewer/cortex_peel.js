// Peel: the cortex dissolve in Cinematic view, ported from the prototype (~/hodos-cinematic-proto/app.js).
// A plane sweeps along PEEL_DIR; fractal noise of amplitude PEEL_AMP (mm) roughens its edge, and the
// soft band is an alpha-hashed screen-space dither, so depth stays exact for shadows and AO.
export const PEEL_AMP=9;
export const PEEL_DIR=(([x,y,z])=>{const n=Math.hypot(x,y,z);return [x/n,y/n,z/n];})([-0.25,0.45,0.86]);

const ease=t=>{t=Math.min(Math.max(t,0),1);return t*t*(3-2*t);};
/** Peel amount 0..100; anything else becomes the nearest end, and a non-number becomes 0. */
export const clampPeel=v=>{v=Number(v);return Number.isFinite(v)?Math.min(100,Math.max(0,v)):0;};
/** Ghost cortex opacity 0..1, as clampPeel. */
export const clampGhost=v=>{v=Number(v);return Number.isFinite(v)?Math.min(1,Math.max(0,v)):0;};

/** Sweep range over cortex vertex positions (flat xyz arrays, MNI mm): at `high` the sweep has not
 * touched the cortex; at `low` it has passed all of it, noise included. */
export function peelRange(positionArrays){
  let max=-Infinity,min=Infinity;const [dx,dy,dz]=PEEL_DIR;
  for(const a of positionArrays)for(let i=0;i<a.length;i+=3){const s=a[i]*dx+a[i+1]*dy+a[i+2]*dz;if(s>max)max=s;if(s<min)min=s;}
  if(!Number.isFinite(max))throw new Error('peelRange needs cortex vertices');
  return {high:max+PEEL_AMP+1,low:min-PEEL_AMP-2};
}
/** Sweep threshold for a Peel amount, eased as in the prototype's Blender sweep. */
export const peelThreshold=(peel,{high,low})=>high+(low-high)*ease(clampPeel(peel)/100);

const NOISE_GLSL=/* glsl */`
vec3 pmod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 pmod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 ppermute(vec4 x){return pmod289(((x*34.0)+1.0)*x);}
float psnoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=pmod289(i);
  vec4 p=ppermute(ppermute(ppermute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  vec3 ns=0.142857142857*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 xx=x_*ns.x+ns.yyyy; vec4 yy=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(xx)-abs(yy);
  vec4 b0=vec4(xx.xy,yy.xy); vec4 b1=vec4(xx.zw,yy.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 nr=1.79284291400159-0.85373472095314*vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3));
  p0*=nr.x; p1*=nr.y; p2*=nr.z; p3*=nr.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float peelNoise(vec3 p){
  float n=0.0, a=1.0, w=0.0; vec3 q=p*0.028;
  for(int o=0;o<4;o++){ n+=a*psnoise(q); w+=a; a*=0.5; q*=2.0; }
  return clamp(0.5+0.5*n/w, 0.0, 1.0);
}`;

/** Shared uniforms for every material that draws the peeled cortex (colour, shadow depth, AO normals). */
export const createPeelUniforms=()=>({uPeelThr:{value:1e4},uPeelActive:{value:0}});

/** Inject the dissolve into a built-in three material. `kind` keys the compiled program. */
export function addPeel(material,uniforms,kind){
  const dir=PEEL_DIR.map(v=>v.toFixed(6)).join(',');
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    // Declarations go first: not every built-in shader (MeshNormalMaterial's fragment) includes <common>.
    shader.vertexShader='varying vec3 vPeelPos;\n'+shader.vertexShader
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvPeelPos=(modelMatrix*vec4(transformed,1.0)).xyz;');
    shader.fragmentShader=`varying vec3 vPeelPos; uniform float uPeelThr; uniform float uPeelActive;
${NOISE_GLSL}
`+shader.fragmentShader
      .replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
if (uPeelActive > 0.5) {
  float s = dot(vPeelPos, vec3(${dir})) + peelNoise(vPeelPos) * ${(2*PEEL_AMP).toFixed(1)} - ${PEEL_AMP.toFixed(1)};
  float fac = smoothstep(-1.2, 1.2, s - uPeelThr);
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  if (1.0 - fac <= ign) discard;
}`);
  };
  material.customProgramCacheKey=()=>`hodos-peel:${kind}`;
  return material;
}
