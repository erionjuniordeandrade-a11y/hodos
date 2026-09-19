import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function generateTractRanges({binPath=path.join(root,'viewer/atlas/tracts.bin'),metadataPath=path.join(root,'viewer/atlas/tracts.json'),outPath=path.join(root,'viewer/atlas/tracts-ranges.json')}={}){
  const [bin,metadataBytes]=await Promise.all([readFile(binPath),readFile(metadataPath)]);
  const metadata=JSON.parse(metadataBytes);
  if(!Array.isArray(metadata.bundles)||!metadata.bundles.length)throw Error('No tract bundles found');
  const bundles=metadata.bundles.map(bundle=>{
    const {id,offset,bytes}=bundle;
    if(typeof id!=='string'||![offset,bytes].every(Number.isSafeInteger)||offset<0||bytes<1||offset+bytes>bin.length)
      throw Error(`Invalid tract range: ${id||'unknown'}`);
    return {id,offset,bytes,sha256:sha256(bin.subarray(offset,offset+bytes))};
  });
  const index={version:1,bin:{path:'tracts.bin',bytes:bin.length,sha256:sha256(bin)},metadata:{path:'tracts.json',bytes:metadataBytes.length,sha256:sha256(metadataBytes)},bundles};
  await mkdir(path.dirname(outPath),{recursive:true});
  await writeFile(outPath,JSON.stringify(index,null,2)+'\n');
  return index;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const output=process.argv.find(arg=>arg.startsWith('--out='))?.slice(6)||path.join(root,'viewer/atlas/tracts-ranges.json');
  const index=await generateTractRanges({outPath:output});
  console.log(JSON.stringify({output:path.resolve(output),bundles:index.bundles.length,bytes:index.bin.bytes,sha256:index.bin.sha256},null,2));
}
