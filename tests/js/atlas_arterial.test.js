import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ARTERIAL_SET,arterialTable,arterialSelection,arterialFromSearch,arterialToSearchValue,arterialPaletteUnit,arterialLabel} from '../../viewer/atlas_arterial.js';
import {decodeAtlasLabels} from '../../viewer/atlas_data.js';
const root=new URL('../../viewer/atlas/',import.meta.url);
const json=async n=>JSON.parse(await readFile(new URL(n,root),'utf8'));
test('arterial contracts: an absent set yields an empty table and every selection falls back to off',()=>{
  assert.deepEqual(arterialTable({sets:{}}),[]);
  assert.deepEqual(arterialSelection('focus',3,[]),{mode:'off',focus:null});
  assert.deepEqual(arterialFromSearch('?art=MCA',[]),{mode:'off',focus:null});
  assert.equal(arterialToSearchValue({mode:'all',focus:null},[]),'all');
  assert.throws(()=>arterialTable({sets:{[ARTERIAL_SET]:{regions:{L:{1:'ACA'},R:{1:'MCA'}}}}}),/differ/);
});
test('installed arterial set (when present) rides the vertex order, names four territories and round-trips the URL key',async()=>{
  const m=await json('surface.json');
  if(!m.sets[ARTERIAL_SET]){assert.equal(arterialTable(m).length,0);return;}
  const b=new Uint8Array(await readFile(new URL('surface-labels.bin',root))).buffer;
  const rows=arterialTable(m);assert.deepEqual(rows.map(r=>r.code).sort(),['ACA','MCA','PCA','VB']);
  const art=decodeAtlasLabels(m,b,[32492,32492],ARTERIAL_SET);
  for(const h of ['L','R']){assert.equal(art[h].length,32492);const ids=new Set(art[h]);for(const id of ids)assert.ok(id===0||rows.some(r=>r.id===id),`${h}:${id}`);}
  const gl=decodeAtlasLabels(m,b,[32492,32492],'glasser');
  const majority=(h,parcel)=>{const c=new Map();for(let i=0;i<gl[h].length;i++)if(gl[h][i]===parcel){const a=art[h][i];c.set(a,(c.get(a)||0)+1);}return rows.find(r=>r.id===[...c].sort((x,y)=>y[1]-x[1])[0][0])?.code;};
  assert.equal(majority('L',1),'PCA','V1 is posterior cerebral');assert.equal(majority('L',26),'ACA','SFL is anterior cerebral');
  assert.equal(majority('L',148),'MCA','PF is middle cerebral');assert.equal(majority('R',148),'MCA');
  const pal=arterialPaletteUnit(rows);assert.equal(pal.length,rows.length+1);
  for(const r of rows){const sel=arterialSelection('focus',r.id,rows);assert.deepEqual(arterialFromSearch(`?art=${arterialToSearchValue(sel,rows)}`,rows),sel);assert.match(arterialLabel(rows,r.id),new RegExp(r.code));}
});
