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
  assert.equal(home,await readFile(path.join(out,'atlas.html'),'utf8'));
  for(const html of [home,sources]){
    assert.match(html,/Dr\. Erion de Andrade/);
    assert.match(html,/https:\/\/www\.dreriondeandrade\.com\.br\//);
    assert.doesNotMatch(html,/Case reconstruction|profile=clinical/);
  }
  assert.match(sources,/Amy Sterling/);
  assert.match(sources,/href="\.\/THIRD_PARTY_NOTICES\.md"/);
  assert.match(home,/<link rel="canonical" href="https:\/\/hodos-atlas\.pages\.dev\/">/);
  assert.match(home,/property="og:image" content="https:\/\/hodos-atlas\.pages\.dev\/brand\/hodos-og\.png"/);
  assert.match(home,/class="brand" href="\.\/"/);assert.doesNotMatch(home,/href="\.\/atlas\.html"/);
  assert.match(sources,/href="\.\/"/);assert.match(home,/href="\.\/atlas-sources"/);
  const headers=await readFile(path.join(out,'_headers'),'utf8');
  assert.match(headers,/\/atlas\/\*\n  Cache-Control: public, max-age=2592000/);assert.match(headers,/^\/\*\n(?:.*\n)*?  Cache-Control: public, max-age=0, must-revalidate/);
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
