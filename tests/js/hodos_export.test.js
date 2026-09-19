import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,cp,rm,symlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildHodos} from '../../scripts/build-hodos.mjs';

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
  assert.equal(landingAssets.length,21);
  assert(landingAssets.some(f=>f.path==='media/landing/hero-superior-commissural-1200-20260914.jpg'));
  assert(landingAssets.some(f=>f.path==='media/landing/hero-superior-commissural-1920-20260914.jpg'));
  assert(landingAssets.some(f=>f.path==='media/landing/case-right-medial-frontal-20260914.jpg'));
  assert(receipt.files.some(f=>f.path==='landing.js'));
  assert(receipt.files.some(f=>f.path==='lesson_previews.js'));
  assert.match(home,/<script src="\.\/lesson_previews\.js" defer><\/script>/);
  for(const id of ['motor-cst','fat-language','default-mode-network']){
    assert(home.includes(`data-preview-target="preview-${id}"`));
    assert(home.includes(`href="./atlas?lesson=${id}&amp;step=0&amp;phase=orient&amp;hemi=L"`));
    const plate=`media/lesson-previews/plate-${id}-20260919.jpg`;
    assert(home.includes(`data-src="./${plate}"`));
    assert(!home.includes(` src="./${plate}"`),'Large plates load only after opening a preview');
    assert(receipt.files.some(f=>f.path===plate),`Preview plate is exported: ${plate}`);
  }
  assert(!receipt.files.some(f=>/^media\/hodos-hero-/.test(f.path)));
  assert.match(home,/href="\.\/atlas"/);
  assert.match(home,/href="\.\/atlas\?lesson=motor-cst"/);
  assert.doesNotMatch(home,/atlas\.html|index\.html|pages\.dev/);
  const atlas=await readFile(path.join(out,'atlas.html'),'utf8');
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
  assert.match(home,/href="\.\/brand\/hodos-favicon\.svg\?v=[a-f0-9]{12}"/);
  assert.match(await readFile(path.join(out,'hodos.css'),'utf8'),/inter-latin-regular\.woff2\?v=[a-f0-9]{12}/);
  assert.match(await readFile(path.join(out,'404.html'),'utf8'),/\/brand\/hodos-favicon\.svg\?v=[a-f0-9]{12}/);
  assert(receipt.files.some(f=>f.path==='brand/hodos-og.png'));
  assert(receipt.files.some(f=>f.path==='vendor/addons/libs/draco/gltf/draco_decoder.wasm'));
  assert(receipt.files.some(f=>f.path==='404.html'));
  assert(receipt.files.some(f=>f.path==='LICENSE'));
  assert(receipt.files.some(f=>f.path==='dissection_references.js'));
  assert.equal(receipt.files.filter(f=>/^reference-plates\/.*\.png$/.test(f.path)).length,5);
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
