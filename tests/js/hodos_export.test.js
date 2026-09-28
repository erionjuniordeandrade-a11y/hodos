import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,cp,rm,symlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildHodos} from '../../scripts/build-hodos.mjs';
import {lessonIdsInCurriculum} from '../../scripts/lesson-pages.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));

test('Hodos publishes a complete atlas with working public navigation and attribution',async t=>{
  const temp=await mkdtemp(path.join(os.tmpdir(),'hodos-export-'));
  t.after(()=>rm(temp,{recursive:true,force:true}));
  const out=path.join(temp,'site');
  const receipt=await buildHodos({root,out});
  const home=await readFile(path.join(out,'index.html'),'utf8');
  const sources=await readFile(path.join(out,'atlas-sources.html'),'utf8');
  assert.match(home,/data-hero[ >]/);
  assert.doesNotMatch(home,/heroFilm|\sstyle=|<style[ >]/);
  assert.match(home,/<video id="heroLoop"[^>]*muted[^>]*playsinline/);
  const lessonIds=[...home.matchAll(/href="(\.\/atlas\?[^\"]+)"/g)].map(m=>new URL(m[1].replaceAll('&amp;','&'),'https://hodosatlas.com/').searchParams.get('lesson'));
  assert.equal(new Set(lessonIds).size,14);
  const landingAssets=receipt.files.filter(f=>f.path.startsWith('media/landing/'));
  // 2026-09-28: recaptured lesson-demo stills from the current (post-CSS-token) build were added
  // alongside the 2026-09-26 originals (add-only), so the landing asset count grew by 2.
  // Same day: the two 20260919 hero loops left the allowlist and four 20260928 loops (AV1 + H.264) entered (+2).
  assert.equal(landingAssets.length,31);
  assert.equal([...home.matchAll(/<video class="family-loop"[^>]*muted[^>]*playsinline[^>]*preload="none"[^>]*data-src="\.\/media\/landing\/family-[a-z]+-loop-20260926\.mp4"/g)].length,4);
  assert.match(home,/<video id="demoLoop"[^>]*muted[^>]*playsinline[^>]*preload="none"[^>]*data-src="\.\/media\/landing\/lesson-demo-loop-20260926\.mp4"/);
  assert(landingAssets.some(f=>f.path==='media/landing/lesson-demo-loop-20260926.mp4'));
  assert(landingAssets.some(f=>f.path==='media/landing/lesson-demo-20260928.jpg'));
  assert(landingAssets.some(f=>f.path==='media/landing/lesson-demo-phone-20260928.jpg'));
  assert(landingAssets.some(f=>f.path==='media/landing/hero-atlas-poster-1200-20260919.jpg'));
  assert(landingAssets.some(f=>f.path==='media/landing/hero-atlas-poster-1920-20260919.jpg'));
  assert(landingAssets.some(f=>f.path==='media/landing/case-right-medial-frontal-20260914.jpg'));
  assert(receipt.files.some(f=>f.path==='landing.js'));
  assert(receipt.files.some(f=>f.path==='lesson_previews.js'));
  assert.match(home,/<script src="\.\/lesson_previews\.js" defer><\/script>/);
  for(const id of ['motor-cst','fat-language','default-mode-network']){
    assert(home.includes(`data-preview-target="preview-${id}"`));
    assert(home.includes(`href="./atlas?lesson=${id}&amp;step=0&amp;phase=orient&amp;hemi=L"`));
    // 2026-09-28: landing now points at the recaptured plate; the 2026-09-19 original stays
    // exported too (add-only media policy), just no longer linked from the landing page.
    const plate=`media/lesson-previews/plate-${id}-20260928.jpg`;
    const priorPlate=`media/lesson-previews/plate-${id}-20260919.jpg`;
    assert(home.includes(`data-src="./${plate}"`));
    assert(!home.includes(` src="./${plate}"`),'Large plates load only after opening a preview');
    assert(receipt.files.some(f=>f.path===plate),`Preview plate is exported: ${plate}`);
    assert(receipt.files.some(f=>f.path===priorPlate),`Prior preview plate stays exported (add-only): ${priorPlate}`);
  }
  assert(!receipt.files.some(f=>/^media\/hodos-hero-/.test(f.path)));
  assert.match(home,/href="\.\/atlas"/);
  assert.match(home,/href="\.\/atlas\?lesson=motor-cst"/);
  assert.doesNotMatch(home,/atlas\.html|index\.html|pages\.dev/);
  const atlas=await readFile(path.join(out,'atlas.html'),'utf8');
  const mips=await readFile(path.join(out,'mips.html'),'utf8');
  assert.match(home,/href="\.\/mips"/);
  assert.match(mips,/rel="canonical" href="https:\/\/hodosatlas\.com\/mips"/);
  // /mips loads the bundled entry (mips.js + its static closure in one request, content-hash
  // versioned like the other keyed assets); the unbundled mips.js still ships for the dynamic
  // import()s that lazy-load atlas_scene.js, which the loop below still asserts exist.
  assert.match(mips,/src="\.\/mips\.bundle\.js\?v=[a-f0-9]{12}"/);
  for(const asset of ['mips.js','mips_content.js','mips.bundle.js','mips.css','corridor_geometry.js','corridor_overlay.js'])assert(receipt.files.some(f=>f.path===asset));
  const sitemap=await readFile(path.join(out,'sitemap.xml'),'utf8');
  const sitemapLocs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
  assert.equal(sitemapLocs.length,22);
  assert(sitemapLocs.includes('https://hodosatlas.com/lessons'));
  assert.deepEqual(sitemapLocs.filter(url=>url.startsWith('https://hodosatlas.com/lessons/')),lessonIdsInCurriculum().map(id=>`https://hodosatlas.com/lessons/${id}`));
  assert(!sitemap.includes('/atlas?lesson='));
  assert.match(sitemap,/<loc>https:\/\/hodosatlas\.com\/mips<\/loc>/);
  const connections=await readFile(path.join(out,'connections.html'),'utf8');
  assert.match(home,/href="\.\/connections"/);
  assert.match(connections,/rel="canonical" href="https:\/\/hodosatlas\.com\/connections"/);
  assert.doesNotMatch(connections,/ style=/);
  for(const asset of ['connections.js','connections_graph.js','connections_data.js','connections.css','vendor/vis-network.min.js','vendor/vis-data.min.js','vendor/vis-LICENSE.md'])assert(receipt.files.some(f=>f.path===asset));
  assert.match(sitemap,/<loc>https:\/\/hodosatlas\.com\/connections<\/loc>/);
  for(const [tag] of atlas.matchAll(/<link\b[^>]*rel="modulepreload"[^>]*>/g)){
    assert.match(tag,/\bdata-document-preload\b/,'Cloudflare must not promote import-map-dependent modules into HTTP Link headers');
  }
  assert.match(atlas,/<link rel="canonical" href="https:\/\/hodosatlas\.com\/atlas">/);
  assert.match(atlas,/<a class="brand" href="\.\/"/);
  assert.match(await readFile(path.join(out,'_headers'),'utf8'),/\/media\/\*\n  ! Cache-Control/);
  for(const html of [home,sources]){
    assert.match(html,/Dr\. Erion de Andrade/);
    assert.match(html,/https:\/\/www\.dreriondeandrade\.com\.br\//);
    assert.doesNotMatch(html,/Case reconstruction|profile=clinical/);
  }
  assert.match(sources,/Amy Sterling/);
  assert.match(sources,/href="\.\/THIRD_PARTY_NOTICES\.md"/);
  assert.match(home,/<link rel="canonical" href="https:\/\/hodosatlas\.com\/">/);
  assert.match(home,/property="og:image" content="https:\/\/hodosatlas\.com\/brand\/hodos-og\.png"/);
  assert.match(home,/class="brand" href="\.\/"/);assert.doesNotMatch(home,/href="\.\/atlas\.html"/);
  assert.match(sources,/href="\.\/"/);assert.match(home,/href="\.\/atlas-sources"/);
  const headers=await readFile(path.join(out,'_headers'),'utf8');
  assert.match(headers,/\/atlas\/\*\n  ! Cache-Control\n  Cache-Control: public, max-age=2592000/);assert.match(headers,/^\/\*\n(?:.*\n)*?  Cache-Control: public, max-age=0, must-revalidate/);
  assert.match(headers,/Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-[A-Za-z0-9+/=]+' 'wasm-unsafe-eval' https:\/\/static\.cloudflareinsights\.com; style-src 'self'/);
  assert.match(headers,/Permissions-Policy: microphone=\(self\), camera=\(\)/);
  assert.doesNotMatch(headers,/^\/vendor\/\*$/m);assert.match(headers,/\/vendor\/fonts\/\*\n  ! Cache-Control\n  Cache-Control: public, max-age=2592000/);
  assert.match(headers,/\/vendor\/addons\/libs\/draco\/\*\n  ! Cache-Control\n  Cache-Control: public, max-age=14400, must-revalidate/);
  assert.match(headers,/https:\/\/hodos-atlas\.pages\.dev\/\*\n  X-Robots-Tag: noindex/);
  assert.match(headers,/https:\/\/:version\.hodos-atlas\.pages\.dev\/\*\n  X-Robots-Tag: noindex/);
  assert.match(headers,/https:\/\/www\.hodosatlas\.com\/\*\n  X-Robots-Tag: noindex/);
  assert.match(home,/href="\.\/brand\/hodos-favicon\.svg\?v=[a-f0-9]{12}"/);
  assert.match(await readFile(path.join(out,'hodos.css'),'utf8'),/archivo-latin\.woff2\?v=[a-f0-9]{12}/);
  assert.match(await readFile(path.join(out,'404.html'),'utf8'),/\/brand\/hodos-favicon\.svg\?v=[a-f0-9]{12}/);
  assert(receipt.files.some(f=>f.path==='brand/hodos-og.png'));
  assert(receipt.files.some(f=>f.path==='vendor/addons/libs/draco/gltf/draco_decoder.wasm'));
  for(const asset of [
    'vendor/three-mesh-bvh.js','vendor/camera-controls.js','vendor/addons/libs/meshopt_decoder.module.js',
    'vendor/addons/lines/Line2.js','vendor/addons/lines/LineGeometry.js','vendor/addons/lines/LineMaterial.js',
    'vendor/addons/shaders/GTAOShader.js','vendor/addons/shaders/PoissonDenoiseShader.js',
    'vendor/addons/lines/LineSegments2.js','vendor/addons/lines/LineSegmentsGeometry.js',
    'vendor/VENDOR.json','vendor/LICENSE.md','vendor/three-mesh-bvh-LICENSE.md','vendor/camera-controls-LICENSE.md',
  ])assert(receipt.files.some(f=>f.path===asset),`Vendored asset is exported: ${asset}`);
  assert.deepEqual(JSON.parse(await readFile(path.join(out,'vendor/VENDOR.json'),'utf8')).packages,{
    three:'0.186.1','three-mesh-bvh':'0.9.15','camera-controls':'3.1.2',
  });
  assert(receipt.files.some(f=>f.path==='404.html'));
  assert(receipt.files.some(f=>f.path==='LICENSE'));
  assert(receipt.files.some(f=>f.path==='dissection_references.js'));
  assert.equal(receipt.files.filter(f=>/^reference-plates\/.*\.webp$/.test(f.path)).length,5);
  assert(!receipt.files.some(f=>/^(data\.json|app\.js|cases\/|api\/|handoff\/|\.env)/.test(f.path)));
  const repeated=await buildHodos({root,out});
  assert.deepEqual(repeated,receipt,'an unchanged build is repeatable');
});

test('extra private-looking files never enter the public export; changed output is preserved',async t=>{
  const temp=await mkdtemp(path.join(os.tmpdir(),'hodos-boundary-'));
  t.after(()=>rm(temp,{recursive:true,force:true}));
  const fixture=path.join(temp,'fixture');
  await buildHodos({root,out:path.join(fixture,'viewer')});
  await cp(path.join(root,'THIRD_PARTY_NOTICES.md'),path.join(fixture,'THIRD_PARTY_NOTICES.md'));
  await cp(path.join(root,'LICENSE'),path.join(fixture,'LICENSE'));
  await writeFile(path.join(fixture,'viewer/data.json'),'SYNTHETIC_PRIVATE_SENTINEL');
  await writeFile(path.join(fixture,'viewer/atlas/unlisted.json'),'SYNTHETIC_PRIVATE_SENTINEL');
  const out=path.join(temp,'site');
  const receipt=await buildHodos({root:fixture,out});
  assert(!receipt.files.some(f=>f.path==='data.json'||f.path==='atlas/unlisted.json'));
  await writeFile(path.join(out,'keep-me.txt'),'Do not overwrite');
  await assert.rejects(buildHodos({root:fixture,out}),/existing output differs/);
  assert.equal(await readFile(path.join(out,'keep-me.txt'),'utf8'),'Do not overwrite');
});

test('corrupt atlas bytes and symlinked assets stop publication',async t=>{
  const temp=await mkdtemp(path.join(os.tmpdir(),'hodos-integrity-'));
  t.after(()=>rm(temp,{recursive:true,force:true}));
  const fixture=path.join(temp,'fixture');
  await buildHodos({root,out:path.join(fixture,'viewer')});
  await cp(path.join(root,'THIRD_PARTY_NOTICES.md'),path.join(fixture,'THIRD_PARTY_NOTICES.md'));
  await cp(path.join(root,'LICENSE'),path.join(fixture,'LICENSE'));
  const asset=path.join(fixture,'viewer/atlas/tracts.bin');
  await writeFile(asset,'corrupt');
  await assert.rejects(buildHodos({root:fixture,out:path.join(temp,'corrupt')}),/Atlas asset integrity failed/);
  await rm(asset);
  await symlink(path.join(root,'viewer/atlas/tracts.bin'),asset);
  await assert.rejects(buildHodos({root:fixture,out:path.join(temp,'linked')}),/Symlink refused/);
});

test('atlas and MIPS JSON-LD is inert and does not enter the import-map CSP hash',async t=>{
  const temp=await mkdtemp(path.join(os.tmpdir(),'hodos-ldjson-'));
  t.after(()=>rm(temp,{recursive:true,force:true}));
  const fixture=path.join(temp,'fixture'),viewer=path.join(fixture,'viewer');
  await cp(path.join(root,'viewer'),viewer,{recursive:true});
  await cp(path.join(root,'THIRD_PARTY_NOTICES.md'),path.join(fixture,'THIRD_PARTY_NOTICES.md'));
  await cp(path.join(root,'LICENSE'),path.join(fixture,'LICENSE'));
  const block='<script type="application/ld+json">{"@context":"https://schema.org","name":"fixture"}</script>';
  const authored={};
  for(const name of ['atlas.html','mips.html']){
    const file=path.join(viewer,name),html=await readFile(file,'utf8');
    authored[name]=(html.match(/<script type="application\/ld\+json">/g)||[]).length;
    await writeFile(file,html.replace('</head>',`${block}</head>`));
  }
  const out=path.join(temp,'site');
  await buildHodos({root:fixture,out});
  const headers=await readFile(path.join(out,'_headers'),'utf8');
  assert.equal((headers.match(/sha256-/g)||[]).length,1);
  for(const name of ['atlas.html','mips.html']){
    const html=await readFile(path.join(out,name),'utf8');
    assert.equal((html.match(/<script type="importmap">/g)||[]).length,1);
    assert.equal((html.match(/<script type="application\/ld\+json">/g)||[]).length,authored[name]+1);
  }
  const atlasFile=path.join(viewer,'atlas.html'),atlasHTML=await readFile(atlasFile,'utf8');
  await writeFile(atlasFile,atlasHTML.replace('</head>','<script>window.invalidInlineScript=true;</script></head>'));
  await assert.rejects(buildHodos({root:fixture,out:path.join(temp,'bad-inline')}),/Expected exactly one inline script/);
});
