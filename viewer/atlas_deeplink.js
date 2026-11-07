// Pure URL grammar for the free-explore view (`tracts`, `cam`). No DOM, no three: unit-testable in node.
// Number() drops trailing zeros and `|| 0` turns -0 into 0, so the URL stays short and never shows "-0".
const num=(v,step)=>String(Number((Math.round(v/step)*step).toFixed(step<.01?3:1))||0);
/** Selected bundle ids in pick order (= tint order), or null when none. */
export function tractsToSearchValue(ids){return Array.isArray(ids)&&ids.length?ids.join(','):null;}
/** Keep only catalogue ids, deduped, in URL order, capped. Anything else is dropped silently. */
export function tractsFromSearch(value,knownIds,max){
  if(typeof value!=='string')return [];const known=new Set(knownIds),out=[];
  for(const raw of value.split(',')){const id=raw.trim();if(known.has(id)&&!out.includes(id))out.push(id);if(out.length>=max)break;}
  return out;}
/** "px,py,pz,tx,ty,tz,ux,uy,uz": position/target to 0.1, up to 0.001 (-0 stripped). */
export function cameraToSearchValue(c){
  if(!c||![c.camera,c.target,c.up].every(a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite)))return null;
  return [...c.camera.map(v=>num(v,.1)),...c.target.map(v=>num(v,.1)),...c.up.map(v=>num(v,.001))].join(',');}
/** Parse and sanity-check; null for anything that could not place a camera. */
export function cameraFromSearch(value){
  if(typeof value!=='string')return null;const parts=value.split(',');if(parts.length!==9||parts.some(p=>p.trim()===''))return null;
  const n=parts.map(Number);if(!n.every(Number.isFinite))return null;
  const camera=n.slice(0,3),target=n.slice(3,6),up=n.slice(6,9);
  if(Math.hypot(...up)<1e-3)return null;
  if(Math.hypot(camera[0]-target[0],camera[1]-target[1],camera[2]-target[2])<1e-3)return null;
  return {camera,target,up};}
