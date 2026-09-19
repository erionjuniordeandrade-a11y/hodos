// Public reference-atlas export. Never copy the viewer or repository wholesale.
import {readFile,writeFile,mkdir,lstat,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot=fileURLToPath(new URL('../',import.meta.url));
const modules=[
  'case_images.js',
  'mips.js','mips_content.js','corridor_geometry.js','corridor_overlay.js',
  'case_content.js','case_state.js','case_audio.js','case_conference.js','case_reference.js','case_lesions.js',
  'atlas_app.js','atlas_scene.js','atlas_data.js','atlas_catalog.js','atlas_glossary.js',
  'atlas_networks.js','atlas_arterial.js','anatomy_lesson_player.js','anatomy_learning.js','lesson_briefings.js',
  'dissection_references.js','landing.js','lesson_previews.js',
  'lesson_scene.js','lesson_content.js','lesson_state.js','lesson_references.js','bundle_picker.js',
  'lessons/resident-anatomy.js','lessons/network-lectures.js','lessons/corpus-callosum.js','lessons/internal-capsule.js','lessons/ventral-stream.js','lessons/brainstem-corridors.js','render_pipeline.js','scene_materials.js',
  'vendor/three.module.js','vendor/three.core.js','vendor/OrbitControls.js',
  'vendor/addons/loaders/GLTFLoader.js','vendor/addons/loaders/DRACOLoader.js',
  'vendor/addons/utils/BufferGeometryUtils.js','vendor/addons/utils/SkeletonUtils.js',
];
const supportingFiles=[
  'case-images/medial-frontal.png','case-images/insular.png','case-images/temporoparietal.png','case-images/right-medial-frontal.png',
  'case-images/medial-frontal-t1c.png','case-images/insular-t1c.png','case-images/temporoparietal-t1c.png','case-images/right-medial-frontal-t1c.png','case-images/README.md',
  'case_conference.css','mips.css',
  'tokens.css','hodos.css','landing.css',
  'media/landing/hero-superior-commissural-1920-20260914.jpg','media/landing/hero-superior-commissural-1200-20260914.jpg',
  'media/landing/family-association-20260914.jpg','media/landing/family-projection-limbic-20260914.jpg',
  'media/landing/family-language-20260914.jpg','media/landing/family-networks-20260914.jpg',
  'media/landing/lesson-evidence-classes-20260914.jpg',
  'media/landing/lesson-sampling-support-20260914.jpg',
  'media/landing/lesson-motor-cst-20260914.jpg',
  'media/landing/lesson-fat-language-20260914.jpg',
  'media/landing/lesson-optic-radiation-20260914.jpg',
  'media/landing/lesson-interoception-20260914.jpg',
  'media/landing/lesson-attention-networks-20260914.jpg',
  'media/landing/lesson-language-networks-20260914.jpg',
  'media/landing/lesson-default-mode-network-20260914.jpg',
  'media/landing/lesson-salience-network-20260914.jpg',
  'media/landing/lesson-demo-20260914.jpg','media/landing/lesson-demo-phone-20260915.jpg','media/landing/hero-superior-loop-1400-20260914.mp4','media/landing/hero-superior-loop-880-20260914.mp4',
  'media/landing/case-right-medial-frontal-20260914.jpg',
  'media/lesson-previews/plate-motor-cst-20260919.jpg',
  'media/lesson-previews/plate-fat-language-20260919.jpg',
  'media/lesson-previews/plate-default-mode-network-20260919.jpg',
  'media/lesson-previews/README.md',
  'brand/hodos-mark.svg','brand/hodos-mark-light.svg','brand/hodos-favicon.svg','brand/hodos-og.png',
  'vendor/LICENSE.md','vendor/fonts/playfair-display.ttf','vendor/fonts/Playfair-Display-OFL.txt',
  'vendor/fonts/inter-latin-regular.woff2','vendor/fonts/inter-latin-medium.woff2','vendor/fonts/inter-latin-semibold.woff2','vendor/fonts/Inter-OFL.txt',
  'vendor/addons/libs/draco/gltf/draco_decoder.js',
  'vendor/addons/libs/draco/gltf/draco_wasm_wrapper.js',
  'vendor/addons/libs/draco/gltf/draco_decoder.wasm',
  'vendor/addons/libs/draco/LICENSE','vendor/addons/libs/draco/AUTHORS',
  'atlas/licenses/hcp-data-use-terms.txt','atlas/licenses/melbourne-subcortex.txt',
  'atlas/licenses/mni-template-license.txt','atlas/licenses/freesurfer-atlas-license.txt',
  'favicon.ico','apple-touch-icon.png','site.webmanifest',
];
const SITE_ORIGIN='https://hodosatlas.com';
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
  // The landing page is the site root; the atlas lives at /atlas (query strings on lesson links survive).
  html=html.replace(/href="\.\/atlas\.html(\?[^"]*)?"/g,(m,q)=>`href="./atlas${q||''}"`).replaceAll('href="./index.html"','href="./"').replaceAll('href="./atlas-sources.html"','href="./atlas-sources"').replaceAll('href="./case-conference.html"','href="./case-conference"');
  html=html.replace('THIRD_PARTY_NOTICES.md in the source checkout','<a href="./THIRD_PARTY_NOTICES.md">Third-party notices and software licenses</a>');
  html=html.replaceAll('href="./mips.html"','href="./mips"');
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
  for(const name of ['index.html','atlas.html','atlas-sources.html','case-conference.html','mips.html'])add(name,publicHTML((await safeRead(viewer,name)).toString()));
  add('THIRD_PARTY_NOTICES.md',(await safeRead(root,'THIRD_PARTY_NOTICES.md')).toString().replaceAll('(viewer/atlas/','(atlas/'));
  add('LICENSE',await safeRead(root,'LICENSE'));
  add('404.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found · Hodos</title><link rel="icon" href="/brand/hodos-favicon.svg"><link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/hodos.css"></head><body><main class="prose"><h1>Page not found.</h1><p><a href="/">Return to the anatomy coursebook</a></p></main></body></html>\n');
  // Sitemap and robots.txt are generated from the exported files, never hand-maintained: lesson
  // ids come from the landing page's own lesson links (the same list residents see), and lastmod
  // comes from the shipped content version.
  const contentVersion=files.get('lesson_content.js').toString().match(/CONTENT_VERSION\s*=\s*['"]([^'"]+)/)?.[1];
  if(!contentVersion)throw Error('Missing lesson content version');
  const lastmod=contentVersion.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if(!lastmod)throw Error('Content version has no lastmod date');
  const lessonIds=[...new Set([...files.get('index.html').toString().matchAll(/href="\.\/atlas\?lesson=([a-z0-9-]+)"/g)].map(m=>m[1]))];
  if(lessonIds.length!==14)throw Error(`Expected 14 lesson ids on the landing page, found ${lessonIds.length}`);
  const sitemapUrls=[`${SITE_ORIGIN}/`,`${SITE_ORIGIN}/atlas`,`${SITE_ORIGIN}/atlas-sources`,`${SITE_ORIGIN}/case-conference`,`${SITE_ORIGIN}/mips`,
    ...lessonIds.map(id=>`${SITE_ORIGIN}/atlas?lesson=${id}`)];
  add('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`+
    sitemapUrls.map(u=>`  <url><loc>${u}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')+`\n</urlset>\n`);
  add('robots.txt',`User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
  // Long-cached assets referenced by plain path (fonts, brand files) get a content-hash query
  // key, so a changed file is fetched under a new key instead of served stale for 30 days.
  // Stylesheets are keyed too: a page must never pair new markup with a stale sheet from cache.
  const keyed=supportingFiles.filter(n=>/^(brand|vendor\/fonts)\/.*\.(svg|png|woff2|ttf)$/.test(n)||/^[a-z_-]+\.css$/.test(n));
  const versionRefs=text=>{for(const name of keyed){const key=sha256(files.get(name)).slice(0,12);
    text=text.replace(new RegExp(`(["'(])(\\./|/)${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(["')])`,'g'),`$1$2${name}?v=${key}$3`);}return text;};
  for(const [name,bytes] of files)if(/\.(html|css)$/.test(name)){
    const text=versionRefs(bytes.toString());
    if(/(["'(])(\.\/|\/)(brand|vendor\/fonts)\/[^"')?]+\.(svg|png|woff2|ttf)(["')])/.test(text))throw Error(`Unversioned cached asset reference in ${name}`);
    if(/<link[^>]*rel="stylesheet"[^>]*href="[^"?]+\.css"/.test(text))throw Error(`Unversioned stylesheet reference in ${name}`);
    files.set(name,Buffer.from(text));
  }
  // Content-Security-Policy: first-party only. The import map is the one inline script and is
  // allowed by hash; Draco decodes meshes in blob workers with WebAssembly; recordings play from
  // blob URLs; the case reference dialog frames the same origin. A <script type="application/ld+json">
  // block is inert data, not a JavaScript/module/importmap MIME type, so CSP's script-src never
  // applies to it and it needs no hash; every other bare <script> still does.
  for(const name of ['index.html','atlas-sources.html','case-conference.html'])
    for(const tag of files.get(name).toString().matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g))
      if(!/\btype="application\/ld\+json"/.test(tag[0]))throw Error(`Inline script in ${name} needs a CSP hash`);
  const inlineScripts=[...files.get('atlas.html').toString().matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  if(inlineScripts.length!==1)throw Error('Expected exactly one inline script (the import map) in atlas.html');
  const mipsInline=[...files.get('mips.html').toString().matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  if(mipsInline.length!==1||mipsInline[0]!==inlineScripts[0])throw Error('MIPS must use the same single import map as the atlas');
  const scriptHashes=inlineScripts.map(s=>`'sha256-${createHash('sha256').update(s).digest('base64')}'`);
  // Cloudflare Web Analytics (auto-injected beacon) is the only third-party script allowed; it is
  // the site's usage signal and carries no user identity beyond Cloudflare's own privacy terms.
  const csp=`default-src 'self'; script-src 'self' ${scriptHashes.join(' ')} 'wasm-unsafe-eval' https://static.cloudflareinsights.com; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; media-src 'self' blob:; connect-src 'self' https://cloudflareinsights.com; worker-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`;
  // Pages are revalidated on every visit; hashed or key-versioned assets are cached for 30 days.
  // Vendor scripts are referenced by plain path, so they revalidate like the page. Pages applies
  // every matching rule and appends same-named headers, so the asset rules detach the page-level
  // Cache-Control ("! Header") before setting their own.
  const cached=['  ! Cache-Control','  Cache-Control: public, max-age=2592000'];
  add('_headers',['/*','  X-Content-Type-Options: nosniff','  Referrer-Policy: strict-origin-when-cross-origin',`  Content-Security-Policy: ${csp}`,
    '  Permissions-Policy: microphone=(self), camera=(), geolocation=(), payment=(), usb=()','  Cache-Control: public, max-age=0, must-revalidate',
    '/atlas/*',...cached,'/vendor/fonts/*',...cached,'/reference-plates/*',...cached,'/brand/*',...cached,'/media/*',...cached,
    ...keyed.filter(n=>n.endsWith('.css')).flatMap(n=>['/'+n,...cached]),''].join('\n'));
  // Plate version keys embedded in the lesson module must match the shipped bytes.
  const plateModule=files.get('dissection_references.js').toString();
  for(const plate of plates)if(!plateModule.includes(`sha:'${plate.sha256.slice(0,12)}'`))throw Error(`Dissection plate version key stale: ${plate.file}`);

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
  const receipt={product:'Hodos',contentVersion,atlasManifestSha256:expected,files:[...files].sort(([a],[b])=>a.localeCompare(b)).map(([name,bytes])=>({path:name,bytes:bytes.length,sha256:sha256(bytes)}))};
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
