// Public reference-atlas export. Never copy the viewer or repository wholesale.
import {readFile,writeFile,mkdir,lstat,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot=fileURLToPath(new URL('../',import.meta.url));
const modules=[
  'case_images.js',
  'case_content.js','case_state.js','case_audio.js','case_conference.js','case_reference.js',
  'atlas_app.js','atlas_scene.js','atlas_data.js','atlas_catalog.js','atlas_glossary.js',
  'atlas_networks.js','anatomy_lesson_player.js','anatomy_learning.js','lesson_briefings.js',
  'dissection_references.js',
  'lesson_scene.js','lesson_content.js','lesson_state.js','lesson_references.js','bundle_picker.js',
  'lessons/resident-anatomy.js','lessons/network-lectures.js','render_pipeline.js','scene_materials.js',
  'vendor/three.module.js','vendor/three.core.js','vendor/OrbitControls.js',
  'vendor/addons/loaders/GLTFLoader.js','vendor/addons/loaders/DRACOLoader.js',
  'vendor/addons/utils/BufferGeometryUtils.js','vendor/addons/utils/SkeletonUtils.js',
];
const supportingFiles=[
  'case-images/medial-frontal.png','case-images/insular.png','case-images/temporoparietal.png','case-images/README.md',
  'case_conference.css',
  'tokens.css','lesson_player.css','atlas.css','anatomy_workbench.css','atlas-design.css','hodos.css',
  'brand/hodos-mark.svg','brand/hodos-mark-light.svg','brand/hodos-favicon.svg','brand/hodos-og.png',
  'vendor/LICENSE.md','vendor/fonts/playfair-display.ttf','vendor/fonts/Playfair-Display-OFL.txt',
  'vendor/fonts/inter-latin-regular.woff2','vendor/fonts/inter-latin-medium.woff2','vendor/fonts/inter-latin-semibold.woff2','vendor/fonts/Inter-OFL.txt',
  'vendor/addons/libs/draco/gltf/draco_decoder.js',
  'vendor/addons/libs/draco/gltf/draco_wasm_wrapper.js',
  'vendor/addons/libs/draco/gltf/draco_decoder.wasm',
  'vendor/addons/libs/draco/LICENSE','vendor/addons/libs/draco/AUTHORS',
  'atlas/licenses/hcp-data-use-terms.txt','atlas/licenses/melbourne-subcortex.txt',
  'atlas/licenses/mni-template-license.txt','atlas/licenses/freesurfer-atlas-license.txt',
];
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

async function safeRead(base,relative){
  if(!relative||path.isAbsolute(relative)||relative.includes('\\')||relative.split('/').some(p=>p==='..'||p==='.'))throw Error(`Invalid public asset path: ${relative}`);
  let current=base;
  for(const segment of relative.split('/')){
    current=path.join(current,segment);
    if((await lstat(current)).isSymbolicLink())throw Error(`Symlink refused: ${relative}`);
  }
  if(!(await lstat(current)).isFile())throw Error(`Expected a file: ${relative}`);
  return readFile(current);
}

function publicHTML(html){
  html=html.replace(/(?: · )?<a href="\.\/\?profile=clinical">Case reconstruction<\/a>/g,'');
  // Pages serves the coursebook at the site root and strips .html; public links use those paths
  // so the canonical URL, the wordmark and the sources link all agree.
  html=html.replaceAll('href="./atlas.html"','href="./"').replaceAll('href="./atlas-sources.html"','href="./atlas-sources"').replaceAll('href="./case-conference.html"','href="./case-conference"');
  html=html.replace('THIRD_PARTY_NOTICES.md in the source checkout','<a href="./THIRD_PARTY_NOTICES.md">Third-party notices and software licenses</a>');
  if(!html.includes('name="description"'))html=html.replace('</head>','<meta name="description" content="Hodos: an interactive cortex and white matter atlas for neurosurgical residents. Explore anatomy, relationships and brain networks. Created by Dr. Erion de Andrade."></head>');
  if(/profile=clinical|Case reconstruction/.test(html))throw Error('Local case navigation remains in the public page');
  return html;
}

async function filesUnder(base,prefix=''){
  const entries=await readdir(path.join(base,prefix),{withFileTypes:true});
  const names=[];
  for(const entry of entries){
    const relative=path.posix.join(prefix,entry.name);
    if(entry.isSymbolicLink())throw Error(`Symlink refused in output: ${relative}`);
    if(entry.isDirectory())names.push(...await filesUnder(base,relative));
    else if(entry.isFile())names.push(relative);
    else throw Error(`Unexpected output entry: ${relative}`);
  }
  return names.sort();
}

export async function buildHodos({root=repoRoot,out=path.join(root,'dist/hodos')}={}){
  root=path.resolve(root);out=path.resolve(out);
  const viewer=path.join(root,'viewer'),files=new Map();
  const add=(name,bytes)=>files.set(name,Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes));
  const copy=async name=>add(name,await safeRead(viewer,name));
  for(const name of [...modules,...supportingFiles])await copy(name);
  await copy('atlas/manifest.json');
  const manifestBytes=files.get('atlas/manifest.json');
  const expected=files.get('atlas_scene.js').toString().match(/MANIFEST_SHA256\s*=\s*['"]([a-f0-9]{64})['"]/)?.[1];
  if(!expected||sha256(manifestBytes)!==expected)throw Error('Atlas manifest integrity failed');
  const manifest=JSON.parse(manifestBytes);
  for(const asset of manifest.assets){
    const bytes=await safeRead(viewer,`atlas/${asset.path}`);
    if(bytes.length!==asset.bytes||sha256(bytes)!==asset.sha256)throw Error(`Atlas asset integrity failed: ${asset.path}`);
    add(`atlas/${asset.path}`,bytes);
  }
  await copy('reference-plates/manifest.json');
  await copy('reference-plates/README.md');
  const plates=JSON.parse(files.get('reference-plates/manifest.json')).plates;
  for(const plate of plates){
    const name=`reference-plates/${plate.file}`;
    const bytes=await safeRead(viewer,name);
    if(bytes.length!==plate.bytes||sha256(bytes)!==plate.sha256)throw Error(`Dissection asset integrity failed: ${plate.file}`);
    add(name,bytes);
  }
  for(const name of ['atlas.html','atlas-sources.html','case-conference.html'])add(name,publicHTML((await safeRead(viewer,name)).toString()));
  add('index.html',files.get('atlas.html'));
  add('THIRD_PARTY_NOTICES.md',(await safeRead(root,'THIRD_PARTY_NOTICES.md')).toString().replaceAll('(viewer/atlas/','(atlas/'));
  add('LICENSE',await safeRead(root,'LICENSE'));
  // Pages are revalidated on every visit; large static assets are cached for 30 days. Atlas and
  // plate fetches carry a content-hash query, so a changed asset is fetched under a new key.
  // Pages applies every matching rule and appends same-named headers, so the asset rules
  // detach the page-level Cache-Control ("! Header") before setting their own.
  const cached=['  ! Cache-Control','  Cache-Control: public, max-age=2592000'];
  add('_headers',['/*','  X-Content-Type-Options: nosniff','  Referrer-Policy: strict-origin-when-cross-origin','  Cache-Control: public, max-age=0, must-revalidate',
    '/atlas/*',...cached,'/vendor/*',...cached,'/reference-plates/*',...cached,'/brand/*',...cached,''].join('\n'));
  // Plate version keys embedded in the lesson module must match the shipped bytes.
  const plateModule=files.get('dissection_references.js').toString();
  for(const plate of plates)if(!plateModule.includes(`sha:'${plate.sha256.slice(0,12)}'`))throw Error(`Dissection plate version key stale: ${plate.file}`);
  add('404.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found · Hodos</title><link rel="icon" href="/brand/hodos-favicon.svg"><link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/atlas.css"><link rel="stylesheet" href="/atlas-design.css"><link rel="stylesheet" href="/hodos.css"></head><body><main class="prose"><h1>Page not found.</h1><p><a href="/">Return to the anatomy coursebook</a></p></main></body></html>\n');

  // Explicit imports must resolve inside the allowlist. A new dependency
  // needs an intentional export change, never an automatic whole-tree copy.
  for(const name of modules){
    const text=files.get(name).toString();
    for(const match of text.matchAll(/^\s*(?:import|export)\s+(?:[\w*$,{}\s]+?\s+from\s*)?['"]([^'"]+)['"]/gm)){
      const spec=match[1];
      const dependency=spec==='three'?'vendor/three.module.js':
        spec==='three/addons/controls/OrbitControls.js'?'vendor/OrbitControls.js':
        spec.startsWith('three/addons/')?spec.replace('three/addons/','vendor/addons/'):
        spec.startsWith('.')?path.posix.normalize(path.posix.join(path.posix.dirname(name),spec)):null;
      if(!dependency||!files.has(dependency))throw Error(`Unexported dependency in ${name}: ${spec}`);
    }
  }
  for(const [name,bytes] of files){
    if(bytes.length>25*1024*1024)throw Error(`Asset exceeds Pages size limit: ${name}`);
    if(/\.(html|css|js|json|md|txt)$/.test(name)&&/\/Users\/|\/home\/|http:\/\/(?:127\.0\.0\.1|localhost)|["']\/api\//.test(bytes.toString()))throw Error(`Local-only reference in ${name}`);
  }
  const version=files.get('lesson_content.js').toString().match(/CONTENT_VERSION\s*=\s*['"]([^'"]+)/)?.[1];
  if(!version)throw Error('Missing lesson content version');
  const receipt={product:'Hodos',contentVersion:version,atlasManifestSha256:expected,files:[...files].sort(([a],[b])=>a.localeCompare(b)).map(([name,bytes])=>({path:name,bytes:bytes.length,sha256:sha256(bytes)}))};
  add('release.json',JSON.stringify(receipt,null,2)+'\n');

  // Immutable build folders: reruns may reuse identical bytes, but never
  // overwrite an existing or externally modified release.
  const existing=await lstat(out).catch(error=>{if(error.code!=='ENOENT')throw error;return null;});
  if(existing){
    if(existing.isSymbolicLink()||!existing.isDirectory())throw Error('Refusing an unsafe output path');
    const names=await filesUnder(out);
    if(JSON.stringify(names)!==JSON.stringify([...files.keys()].sort()))throw Error('Hodos existing output differs; use a fresh --out directory');
    for(const [name,bytes] of files)if(!(await safeRead(out,name)).equals(bytes))throw Error('Hodos existing output differs; use a fresh --out directory');
  }else{
    // All source and integrity checks complete before the first output write.
    await mkdir(out,{recursive:true});
    for(const [name,bytes] of files){await mkdir(path.dirname(path.join(out,name)),{recursive:true});await writeFile(path.join(out,name),bytes,{flag:'wx'});}
  }
  return receipt;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const out=process.argv.find(a=>a.startsWith('--out='))?.slice(6)||path.join(repoRoot,'dist/hodos');
  const receipt=await buildHodos({out});
  console.log(JSON.stringify({output:path.resolve(out),version:receipt.contentVersion,files:receipt.files.length+1,bytes:receipt.files.reduce((sum,f)=>sum+f.bytes,0),atlasManifestSha256:receipt.atlasManifestSha256},null,2));
}
