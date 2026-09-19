import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {decodeAtlasBundle} from '../../viewer/atlas_data.js';
import {coalesceRanges,createTractRangeLoader} from '../../viewer/tract_ranges.js';

const root=new URL('../../viewer/atlas/',import.meta.url);
const read=async path=>readFile(new URL(path,root));
const manifest=JSON.parse(await read('manifest.json'));
const bin=await read('tracts.bin');
const meta=JSON.parse((await read('tracts.json')).toString());
const index=JSON.parse((await read('tracts-ranges.json')).toString());
const binRecord=manifest.assets.find(asset=>asset.path==='tracts.bin');
const fullArrayBuffer=bin.buffer.slice(bin.byteOffset,bin.byteOffset+bin.byteLength);
const records=new Map(index.bundles.map(bundle=>[bundle.id,bundle]));
const metadata=new Map(meta.bundles.map(bundle=>[bundle.id,bundle]));

function responseForRange(url,options,calls,{status=206,tamper=false,delay=0}={}){
  const range=options?.headers?.Range||options?.headers?.range;
  calls.push({url,range,status});
  const body=status===200?Buffer.from(bin):(()=>{
    assert.match(range,/^bytes=\d+-\d+$/);
    const [,start,end]=range.match(/^bytes=(\d+)-(\d+)$/).map(Number);
    const result=Buffer.from(bin.subarray(start,end+1));
    if(tamper)result[0]^=0xff;
    return result;
  })();
  const [,start,end]=range?.match(/^bytes=(\d+)-(\d+)$/)||[];
  const headers=status===206?{'Content-Range':`bytes ${start}-${end}/${bin.byteLength}`}:{};
  const result=new Response(body,{status,headers});
  return delay?new Promise(resolve=>setTimeout(()=>resolve(result),delay)):result;
}

const loaderFor=(fetchImpl,indexValue=index,options={})=>createTractRangeLoader({
  fetchImpl,url:'./atlas/tracts.bin?v=test-key',bin:binRecord,index:indexValue,metadata:manifest.assets.find(asset=>asset.path==='tracts.json'),bundleMeta:meta.bundles,...options,
});

test('every indexed bundle hash matches its unchanged tracts.bin range',()=>{
  assert.equal(index.bin.sha256,binRecord.sha256);
  assert.equal(index.bin.bytes,binRecord.bytes);
  assert.equal(index.bundles.length,meta.bundles.length);
  for(const entry of index.bundles){
    const source=metadata.get(entry.id);
    assert(source,entry.id);
    assert.deepEqual({offset:entry.offset,bytes:entry.bytes},{offset:source.offset,bytes:source.bytes},entry.id);
    assert.equal(createHash('sha256').update(bin.subarray(entry.offset,entry.offset+entry.bytes)).digest('hex'),entry.sha256,entry.id);
  }
});

test('range-loaded bundle decodes exactly like the corresponding full-file slice',async()=>{
  const calls=[],loader=loaderFor((url,options)=>responseForRange(url,options,calls));
  const entry=records.get('CST_L'),loaded=(await loader.load(['CST_L'])).get('CST_L');
  assert.deepEqual(Buffer.from(loaded),bin.subarray(entry.offset,entry.offset+entry.bytes));
  const expected=decodeAtlasBundle(metadata.get('CST_L'),fullArrayBuffer);
  const actual=decodeAtlasBundle({...metadata.get('CST_L'),offset:0},loaded);
  assert.deepEqual(actual,expected);
});

test('coalescing joins contiguous bundle ranges into one request',async()=>{
  const calls=[],loader=loaderFor((url,options)=>responseForRange(url,options,calls));
  await loader.load(['AF_L','AF_R','C_FPH_L','C_FPH_R']);
  assert.equal(calls.length,1);
  assert.equal(calls[0].range,`bytes=${records.get('AF_L').offset}-${records.get('C_FPH_R').offset+records.get('C_FPH_R').bytes-1}`);
});

test('range requests are concurrency limited',async()=>{
  let active=0,maxActive=0;const calls=[];
  const fetchImpl=(url,options)=>{active++;maxActive=Math.max(maxActive,active);return responseForRange(url,options,calls,{delay:5}).finally(()=>{active--;});};
  const loader=loaderFor(fetchImpl,index,{concurrency:1});
  await loader.load(['AF_L','C_FP_L']);
  assert.equal(maxActive,1);
  assert.equal(calls.length,2);
});

test('a 200 fallback verifies and caches the whole unchanged file',async()=>{
  const calls=[],loader=loaderFor((url,options)=>responseForRange(url,options,calls,{status:200}));
  const loaded=await loader.load(['FAT_L']);
  assert.equal(calls.length,1);
  assert.equal(calls[0].range,`bytes=${records.get('FAT_L').offset}-${records.get('FAT_L').offset+records.get('FAT_L').bytes-1}`);
  assert.deepEqual(Buffer.from(loaded.get('FAT_L')),bin.subarray(records.get('FAT_L').offset,records.get('FAT_L').offset+records.get('FAT_L').bytes));
  await loader.load(['CST_L']);
  assert.equal(calls.length,1);
});

test('a tampered 206 range is rejected before the bundle can be used',async()=>{
  const calls=[],loader=loaderFor((url,options)=>responseForRange(url,options,calls,{tamper:true}));
  await assert.rejects(loader.load(['AF_L']),/Atlas asset integrity failed: tracts\.bin/);
  assert.equal(calls.length,1);
});
