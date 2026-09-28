// The lesion lab's model: which sampled HCP1065 streamlines a sphere cuts, and what the quoted
// white matter graph says injury to each cut bundle causes. No DOM and no three.js, so the same
// code runs in the page and under node --test.
//
// Geometry is the group-average sample exactly as shipped (at most 220 streamlines per bundle,
// 28 points each); the test is a distance from the sphere's centre to each streamline segment.
// Statements are never written here: each one is a Tract INJURY_CAUSES row of CONNECTION_ROWS,
// joined to the provenance that scripts/lesion-evidence.mjs traced for it.
import {CONNECTION_ROWS} from './connections_data.js';
import {CLAIM_PROVENANCE,PMID_RECORDS,GRAPH_TO_ATLAS,UNPLACED_SUBJECTS} from './lesion_evidence.js';

// Owner switch: true lists only statements whose cited slides carry a PMID.
export const REQUIRE_PMID=false;
// Cerebellar, peduncle, vermis and cranial nerve samples are not tested; the page says so.
export const LAB_GROUPS=Object.freeze(['Association','Projection','Commissural']);
export const SPARED=0,MARGIN=1,CUT=2;
export const RADIUS=Object.freeze({min:3,max:30,step:1,initial:10});
export const MARGIN_MM=Object.freeze({min:1,max:20,step:1,initial:5});

export const familyOf=id=>/_[LR]$/.test(id)?id.slice(0,-2):id;

/** Bundles the lab tests for one hemisphere: its association and projection bundles plus the commissures. */
export function labBundles(tractMeta,hemi){
  return tractMeta.bundles.filter(b=>LAB_GROUPS.includes(b.group)&&(b.group==='Commissural'||b.id.endsWith(`_${hemi}`)));
}

/** Flattens decoded bundles ([{id,group,lines:[[[x,y,z],…],…]}]) into typed arrays for the distance test. */
export function packStreamlines(entries){
  let lineCount=0,pointCount=0;
  for(const entry of entries)for(const line of entry.lines){lineCount++;pointCount+=line.length;}
  const points=new Float32Array(pointCount*3),start=new Uint32Array(lineCount+1),bounds=new Float32Array(lineCount*6);
  const bundleOf=new Uint16Array(lineCount),bundles=[],lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
  let s=0,p=0;
  entries.forEach((entry,index)=>{
    bundles.push({id:entry.id,group:entry.group,first:s,count:entry.lines.length});
    for(const line of entry.lines){
      start[s]=p;bundleOf[s]=index;
      const b=s*6;bounds[b]=bounds[b+1]=bounds[b+2]=Infinity;bounds[b+3]=bounds[b+4]=bounds[b+5]=-Infinity;
      for(const point of line){
        for(let axis=0;axis<3;axis++){
          const v=point[axis];points[p*3+axis]=v;
          if(v<bounds[b+axis])bounds[b+axis]=v;if(v>bounds[b+3+axis])bounds[b+3+axis]=v;
          if(v<lo[axis])lo[axis]=v;if(v>hi[axis])hi[axis]=v;
        }
        p++;
      }
      s++;
    }
  });
  start[lineCount]=p;
  return {points,start,bounds,bundleOf,bundles,count:lineCount,extent:[lo,hi]};
}

/** Squared distance from point c to segment ab. */
export function segmentDistance2(ax,ay,az,bx,by,bz,cx,cy,cz){
  const dx=bx-ax,dy=by-ay,dz=bz-az,len2=dx*dx+dy*dy+dz*dz;
  let t=len2>0?((cx-ax)*dx+(cy-ay)*dy+(cz-az)*dz)/len2:0;
  t=t<0?0:t>1?1:t;
  const ex=ax+t*dx-cx,ey=ay+t*dy-cy,ez=az+t*dz-cz;
  return ex*ex+ey*ey+ez*ez;
}

/**
 * Marks each streamline CUT when any of its segments comes within `radius` of the centre, MARGIN
 * when it comes within radius + margin but not radius, else SPARED. Writes into `state`
 * (a Uint8Array of pack.count) and returns how many entries changed.
 */
export function classify(pack,{centre,radius,margin=0},state){
  const [cx,cy,cz]=centre,r2=radius*radius,outer=radius+Math.max(0,margin),o2=outer*outer;
  const {points,start,bounds,count}=pack;
  let changed=0;
  for(let s=0;s<count;s++){
    const b=s*6;
    // Sphere against the streamline's bounding box first: most of the sample is rejected here.
    const bx=Math.max(bounds[b]-cx,0,cx-bounds[b+3]),by=Math.max(bounds[b+1]-cy,0,cy-bounds[b+4]),bz=Math.max(bounds[b+2]-cz,0,cz-bounds[b+5]);
    let next=SPARED;
    if(bx*bx+by*by+bz*bz<=o2){
      let best=Infinity;
      for(let p=start[s],end=start[s+1]-1;p<end;p++){
        const i=p*3,d=segmentDistance2(points[i],points[i+1],points[i+2],points[i+3],points[i+4],points[i+5],cx,cy,cz);
        if(d<best){best=d;if(best<=r2)break;}
      }
      next=best<=r2?CUT:best<=o2?MARGIN:SPARED;
    }
    if(state[s]!==next){state[s]=next;changed++;}
  }
  return changed;
}

/** Per bundle: how many of its sampled streamlines are cut and how many more lie within the margin. */
export function summarize(pack,state){
  return pack.bundles.map(bundle=>{
    let cut=0,margin=0;
    for(let s=bundle.first,end=bundle.first+bundle.count;s<end;s++){if(state[s]===CUT)cut++;else if(state[s]===MARGIN)margin++;}
    return {id:bundle.id,group:bundle.group,total:bundle.count,cut,margin};
  });
}

/**
 * A placement point for "centre the sphere on this bundle": the real mid-arc point of one of the
 * bundle's own sampled streamlines, the one nearest the component-wise median of all mid-arc points.
 */
export function bundleAnchor(pack,index){
  const bundle=pack.bundles[index],mids=[];
  for(let s=bundle.first,end=bundle.first+bundle.count;s<end;s++){
    const p=pack.start[s]+Math.floor((pack.start[s+1]-pack.start[s]-1)/2);
    mids.push([pack.points[p*3],pack.points[p*3+1],pack.points[p*3+2]]);
  }
  const median=[0,1,2].map(axis=>{const values=mids.map(m=>m[axis]).sort((a,b)=>a-b);return values[values.length>>1];});
  let best=mids[0],bestD=Infinity;
  for(const m of mids){const d=(m[0]-median[0])**2+(m[1]-median[1])**2+(m[2]-median[2])**2;if(d<bestD){bestD=d;best=m;}}
  return best.map(v=>Math.round(v*10)/10);
}

/** Keeps the centre in the chosen hemisphere (the midline is allowed) and inside the sample's extent. */
export function clampCentre(centre,hemi,extent){
  const [lo,hi]=extent;
  return centre.map((v,axis)=>{
    let min=lo[axis],max=hi[axis];
    if(axis===0){if(hemi==='L')max=Math.min(max,0);else min=Math.max(min,0);}
    const value=Number.isFinite(v)?v:0;
    return Math.round(Math.min(max,Math.max(min,value))*10)/10;
  });
}

const numeric=value=>value!==null&&value.trim()!==''&&Number.isFinite(Number(value));
const clampStep=(value,{min,max},fallback)=>numeric(value)?Math.min(max,Math.max(min,Math.round(Number(value)))):fallback;
/** Reads ?hemi=L&x=&y=&z=&r=&margin= ; anything missing or malformed falls back to the defaults. */
export function parseLabParams(search){
  const params=new URLSearchParams(search);
  const hemi=params.get('hemi')==='R'?'R':'L';
  const xyz=['x','y','z'].map(k=>params.get(k));
  const centre=xyz.every(numeric)?xyz.map(Number):null;
  const marginOn=numeric(params.get('margin'));
  return {hemi,centre,radius:clampStep(params.get('r'),RADIUS,RADIUS.initial),marginOn,
    margin:clampStep(params.get('margin'),MARGIN_MM,MARGIN_MM.initial)};
}

// ---- Evidence: the quoted graph joined to its provenance -------------------------------------

const INJURY_ROWS=CONNECTION_ROWS.filter(row=>row[1]==='Tract'&&row[2]==='INJURY_CAUSES');
const rowKey=(subject,object,quote)=>JSON.stringify([subject,object,quote]);
const graphRows=new Map(INJURY_ROWS.map(row=>[rowKey(row[0],row[3],row[5]),row]));
const traced=new Set(CLAIM_PROVENANCE.map(p=>rowKey(p[0],p[1],p[2])));

/** Mismatches between the graph and the provenance table. The tests require this to be empty. */
export const EVIDENCE_GAPS=Object.freeze([
  ...CLAIM_PROVENANCE.filter(p=>!graphRows.has(rowKey(p[0],p[1],p[2]))).map(p=>`provenance without a graph row: ${p[0]} → ${p[1]}`),
  ...INJURY_ROWS.filter(row=>!traced.has(rowKey(row[0],row[3],row[5]))).map(row=>`graph row without provenance: ${row[0]} → ${row[3]}`),
]);

/** Every statement the lab can show. Quote, section and contested flag are read from the graph row itself. */
export const CLAIMS=Object.freeze(CLAIM_PROVENANCE.filter(p=>graphRows.has(rowKey(p[0],p[1],p[2]))).map(([subject,object,quote,cites,pmids,side,condition,site])=>{
  const row=graphRows.get(rowKey(subject,object,quote)),mapping=GRAPH_TO_ATLAS[subject];
  return Object.freeze({subject,object:row[3],quote:row[5],section:row[6],contested:Boolean(row[7]),
    cites:Object.freeze([...cites]),pmids:Object.freeze([...pmids]),side:side??mapping?.side??null,condition,site:site??null,
    families:Object.freeze(mapping?[...mapping.families]:[]),placed:Boolean(mapping)});
}));
export const CLAIMS_WITH_PMID=CLAIMS.filter(c=>c.pmids.length).length;
/** Statements about structures with no single atlas bundle (sagittal stratum, temporal stem): counted, never placed. */
export const UNPLACED_CLAIMS=CLAIMS.filter(c=>UNPLACED_SUBJECTS.includes(c.subject)).length;

const withSources=claim=>({...claim,sources:claim.pmids.map(pmid=>({pmid,...PMID_RECORDS[pmid]}))});

/** Statements placed on a bundle's family, marked by whether they apply to a lesion on this side. */
export function claimsFor(bundleId,hemi){
  const family=familyOf(bundleId),side=bundleId.endsWith('_L')?'L':bundleId.endsWith('_R')?'R':hemi;
  return CLAIMS.filter(c=>c.families.includes(family)&&(!REQUIRE_PMID||c.pmids.length))
    .map(c=>({...withSources(c),applies:!c.side||c.side===side}));
}

/** What the page lists under a bundle: statements for this side, then other-side statements not already quoted. */
export function evidenceFor(bundleId,hemi){
  const claims=claimsFor(bundleId,hemi),applying=claims.filter(c=>c.applies),shown=new Set(applying.map(c=>c.quote));
  return {applying,other:claims.filter(c=>!c.applies&&!shown.has(c.quote))};
}

/** A one-sided sphere cannot meet a bilateral condition, and the lab cannot tell whether it sits at a quoted site. */
export const headlines=claim=>claim.applies&&claim.condition!=='bilateral'&&!claim.site;

/** Deficits the notes name for the bundles the sphere cuts, once each, ordered by the largest cut share. */
export function namedDeficits(rows,hemi){
  const named=new Map();
  for(const row of rows.filter(r=>r.cut>0).sort((a,b)=>b.cut/b.total-a.cut/a.total)){
    for(const claim of evidenceFor(row.id,hemi).applying.filter(headlines)){
      const entry=named.get(claim.object);
      if(!entry)named.set(claim.object,{object:claim.object,condition:claim.condition,bundles:[row.id]});
      else{
        if(!entry.bundles.includes(row.id))entry.bundles.push(row.id);
        if(entry.condition!==claim.condition)entry.condition=null;
      }
    }
  }
  return [...named.values()];
}
