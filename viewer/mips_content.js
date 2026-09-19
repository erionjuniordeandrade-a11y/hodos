// Authored teaching geometry in the shared MNI/RAS reference space (mm).
// The entries are illustrative points, not identified sulci or validated approaches.
export const MIPS_TARGET=Object.freeze({x:-25,y:10,z:26,radiusMm:8,side:'L',label:'Fictional deep frontal target'});
export const MIPS_BUNDLES=Object.freeze(['FAT_L','CST_L','SLF1_L']);
const choices=Object.freeze({phase:['orient','compare','explain'],corridor:['both','A','B'],width:['reference','wide'],view:['left','superior','anterior']});
export function parseMipsState(search=''){
  const params=new URLSearchParams(search);
  return Object.fromEntries(Object.entries(choices).map(([key,values])=>[key,values.includes(params.get(key))?params.get(key):values[0]]));
}
export function mipsQuery(state){
  const params=new URLSearchParams();
  for(const [key,values] of Object.entries(choices))params.set(key,values.includes(state[key])?state[key]:values[0]);
  return `?${params}`;
}
export function corridorsForState(state){
  const valid=parseMipsState(mipsQuery(state));
  if(valid.phase==='orient')return [];
  return [
    {id:'A',label:'A · anterolateral illustration',start:[-45,45,24],color:0x9be1f0},
    {id:'B',label:'B · superior illustration',start:[-25,12,68],color:0xdcc39a},
  ].filter(c=>valid.corridor==='both'||valid.corridor===c.id).map(c=>({...c,
    end:[MIPS_TARGET.x,MIPS_TARGET.y,MIPS_TARGET.z],radiusMm:valid.width==='wide'?7:4}));
}
export function reflectionText(note,state){
  const valid=parseMipsState(mipsQuery(state));
  return `Hodos · One target, two corridors\nFictional teaching exercise. Reference anatomy only.\n\nCorridor display: ${valid.corridor}\nWidth illustration: ${valid.width}\nNamed view: ${valid.view}\n\nMy reasoning\n${String(note)}\n\nPrompt: Explain an anatomical trade-off, a limitation of this view, and evidence that could change your interpretation.\n`;
}
