/** Installed atlas identities only; never infer names or laterality from a query. */
export function anatomyCatalog(surface,tracts,subcortex,bundleLabel){
  const entries=[];
  for(const hemi of ['L','R'])for(const [id,raw] of Object.entries(surface.sets.glasser.regions[hemi])){
    if(Number(id)===0)continue;
    const code=raw.replace(/^[LR]_/, '').replace(/_ROI$/, '');
    entries.push({kind:'Cortical parcels',id:Number(id),hemi,code,label:`${code} · ${hemi==='L'?'left':'right'}`,search:`${code} ${raw} ${hemi==='L'?'left':'right'}`});
  }
  for(const d of subcortex.structures)entries.push({kind:'Deep structures',id:d.id,code:d.name,label:`${d.name} · ${d.hemisphere==='L'?'left':'right'}`,search:`${d.id} ${d.name} ${d.hemisphere==='L'?'left':'right'}`});
  for(const b of tracts.bundles)entries.push({kind:'Reference pathways',id:b.id,code:b.id,label:bundleLabel(b.id),search:`${b.id} ${bundleLabel(b.id)} ${b.group}`});
  return entries;
}

export function searchAnatomy(entries,query){
  const q=query.trim().toLowerCase();if(!q)return [];
  const words=q.split(/\s+/);
  return entries.filter(e=>words.every(w=>e.search.toLowerCase().includes(w)))
    .sort((a,b)=>Number(b.code.toLowerCase()===q)-Number(a.code.toLowerCase()===q)||a.label.localeCompare(b.label,undefined,{numeric:true}));
}

export function pathwayFamilies(bundles,label){
  const groups=new Map();
  for(const b of bundles){
    const family=b.id.replace(/_[LR]$/,'');
    const key=`${b.group}:${family}`;
    if(!groups.has(key))groups.set(key,{group:b.group,family,label:label(b.id).replace(/ · (left|right)$/,'').replace(/_[LR]$/,''),bundles:[]});
    groups.get(key).bundles.push(b);
  }
  return [...groups.values()].sort((a,b)=>a.group.localeCompare(b.group)||a.label.localeCompare(b.label,undefined,{numeric:true}));
}
