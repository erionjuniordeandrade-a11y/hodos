const sha256=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
const integrity=()=>new Error('Atlas asset integrity failed: tracts.bin');
const indexIntegrity=()=>new Error('Atlas asset integrity failed: tracts-ranges.json');

export function coalesceRanges(entries){
  const sorted=[...entries].sort((a,b)=>a.offset-b.offset),groups=[];
  for(const entry of sorted){
    const end=entry.offset+entry.bytes-1,last=groups.at(-1);
    if(last&&entry.offset<=last.end+1){last.end=Math.max(last.end,end);last.entries.push(entry);}
    else groups.push({start:entry.offset,end,entries:[entry]});
  }
  return groups;
}

function limiter(limit){
  let active=0;const queue=[];
  const pump=()=>{while(active<limit&&queue.length){const {task,resolve,reject}=queue.shift();active++;
    Promise.resolve().then(task).then(resolve,reject).finally(()=>{active--;pump();});}};
  return task=>new Promise((resolve,reject)=>{queue.push({task,resolve,reject});pump();});
}

function validEntry(entry,total){return entry&&typeof entry.id==='string'&&Number.isSafeInteger(entry.offset)&&Number.isSafeInteger(entry.bytes)&&
  entry.offset>=0&&entry.bytes>0&&entry.offset+entry.bytes<=total;}

export function createTractRangeLoader({fetchImpl=globalThis.fetch?.bind(globalThis),url,bin,index,metadata,bundleMeta,concurrency=3}={}){
  if(typeof fetchImpl!=='function'||typeof url!=='string'||!bin?.sha256||!Number.isSafeInteger(bin.bytes)||
    index?.bin?.sha256!==bin.sha256||index.bin.bytes!==bin.bytes||
    (metadata&&(!index.metadata||index.metadata.sha256!==metadata.sha256||index.metadata.bytes!==metadata.bytes))||
    !Array.isArray(index.bundles))throw indexIntegrity();
  const ranges=new Map();
  for(const entry of index.bundles){
    if(!validEntry(entry,bin.bytes)||ranges.has(entry.id))throw indexIntegrity();
    ranges.set(entry.id,entry);
  }
  if(bundleMeta){
    const expected=new Map(bundleMeta.map(entry=>[entry.id,entry]));
    if(expected.size!==ranges.size||[...ranges].some(([id,entry])=>expected.get(id)?.offset!==entry.offset||expected.get(id)?.bytes!==entry.bytes))throw indexIntegrity();
  }
  const cache=new Map(),pending=new Map(),schedule=limiter(Math.max(1,Math.floor(concurrency)||1));
  let fullBody=null;
  const verify=async(entry,bytes)=>{
    if(bytes.byteLength!==entry.bytes||await sha256(bytes)!==entry.sha256)throw integrity();
    return bytes;
  };
  const fromFull=async entry=>verify(entry,fullBody.slice(entry.offset,entry.offset+entry.bytes));
  async function fetchGroup(entries){
    const start=entries[0].offset,end=entries.at(-1).offset+entries.at(-1).bytes-1;
    let response;
    try{response=await schedule(()=>fetchImpl(url,{headers:{Range:`bytes=${start}-${end}`}}));}
    catch(error){throw new Error('Atlas asset unavailable: tracts.bin',{cause:error});}
    if(response.status===200){
      const body=await response.arrayBuffer();
      if(body.byteLength!==bin.bytes||await sha256(body)!==bin.sha256)throw integrity();
      fullBody=body;return {body,start,full:true};
    }
    if(response.status!==206)throw new Error('Atlas asset unavailable: tracts.bin');
    const contentRange=response.headers?.get?.('Content-Range')||'';
    const match=contentRange.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
    if(!match||Number(match[1])!==start||Number(match[2])!==end||Number(match[3])!==bin.bytes)throw integrity();
    const body=await response.arrayBuffer();
    if(body.byteLength!==end-start+1)throw integrity();
    return {body,start,full:false};
  }
  async function load(ids=[]){
    const requested=[...new Set(ids)],result=new Map(),fresh=[];
    for(const id of requested){
      const entry=ranges.get(id);if(!entry)throw new Error(`Unknown atlas bundle: ${id}`);
      if(cache.has(id))result.set(id,Promise.resolve(cache.get(id)));
      else if(pending.has(id))result.set(id,pending.get(id));
      else if(fullBody)result.set(id,fromFull(entry).then(bytes=>{cache.set(id,bytes);return bytes;}));
      else fresh.push(entry);
    }
    for(const group of coalesceRanges(fresh)){
      const groupPromise=fetchGroup(group.entries);
      for(const entry of group.entries){
        const promise=groupPromise.then(({body,start,full})=>{
          const bytes=full?body.slice(entry.offset,entry.offset+entry.bytes):body.slice(entry.offset-start,entry.offset-start+entry.bytes);
          return verify(entry,bytes).then(value=>{cache.set(entry.id,value);return value;});
        }).finally(()=>pending.delete(entry.id));
        pending.set(entry.id,promise);result.set(entry.id,promise);
      }
    }
    const values=await Promise.all(requested.map(id=>result.get(id)));
    return new Map(requested.map((id,i)=>[id,values[i]]));
  }
  return {load,get cached(){return [...cache.keys()];}};
}
