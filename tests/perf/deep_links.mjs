import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.argv.find(v => v.startsWith('--url='))?.slice(6);
if (!base) throw new Error('Pass --url=');
const out = process.argv.find(v => v.startsWith('--out='))?.slice(6) || 'output/deep-links';
await mkdir(out, {recursive: true});
const report = {url: base, checks: [], errors: []};
const BUNDLES = ['AF_L', 'CST_R'];

const browser = await chromium.launch({headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
// reducedMotion: camera smoothing is frame-counted, and software GL draws a frame every few seconds with bundles on, so smoothed rest would take minutes.
async function open(size = {width: 1440, height: 900}, label = 'page') {
  const context = await browser.newContext({viewport: size, reducedMotion: 'reduce'});
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', e => report.errors.push(`${label}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(`${label}: console ${m.text()}`); });
  return {context, page};
}
// The loop draws on demand, so an idle scene yields no "new" frame by itself: the scene redraws on visibilitychange, which does not move the camera.
async function newFrame(page) {
  const f = await page.evaluate(() => window.__atlasTest.frames);
  await page.waitForFunction(n => { document.dispatchEvent(new Event('visibilitychange')); return window.__atlasTest.frames > n; }, f, {polling: 100});
}
// Ready = loading banner hidden AND the test hook reports a scene that has drawn at least one frame.
async function ready(page) {
  await page.waitForFunction(() => document.getElementById('atlasLoading')?.hidden === true && window.__atlasTest?.ready && window.__atlasTest.frames > 0, null, {timeout: 45000});
}
const snap = page => page.evaluate(() => { const s = window.__atlasTest; return {bundles: s.selectedBundles, sceneBundles: s.bundles, camera: s.camera, target: s.render.target}; });
const near = (a, b, tol = 0.5) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= tol);
const withTest = (path) => new URL(`${path}${path.includes('?') ? '&' : '?'}test=1`, base).href;

try {
  // 1. Pick two bundles through the chips, orbit, wait for rest, round-trip the URL.
  const a = await open({width: 1440, height: 900}, 'orbit');
  await a.page.goto(withTest('/atlas.html'), {waitUntil: 'domcontentloaded'});
  await ready(a.page);
  await a.page.locator('#openAtlasTools').click(); // chips live in the Layers drawer
  for (const id of BUNDLES) await a.page.locator(`#pathwayGroups .bundle-chip[data-bundle="${id}"]`).click();
  await a.page.waitForFunction(w => { const s = window.__atlasTest; return s.bundles.length === w.length && w.every(i => s.bundles.includes(i)); }, BUNDLES);
  if (await a.page.locator('#openAtlasTools').getAttribute('aria-expanded') === 'true') await a.page.locator('#openAtlasTools').click();
  const box = await a.page.locator('#atlasCanvas canvas[data-engine]').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const before = await a.page.evaluate(() => new URLSearchParams(location.search).get('cam'));
  await a.page.mouse.move(cx, cy); await a.page.mouse.down();
  await a.page.mouse.move(cx + 120, cy + 40, {steps: 12}); await a.page.mouse.up();
  await a.page.waitForFunction(b => { const c = new URLSearchParams(location.search).get('cam'); return c && c !== b; }, before, {timeout: 30000});
  // Rest = the camera stopped moving AND the debounced URL write caught up with it (a mid-smoothing value must not survive).
  await a.page.waitForFunction(() => {
    const t = window.__atlasTest, w = window; const prev = w.__lastCam; w.__lastCam = t.camera.join();
    const c = new URLSearchParams(location.search).get('cam'); if (!c || prev !== w.__lastCam) return false;
    const u = c.split(',').map(Number); return t.camera.every((v, i) => Math.abs(v - u[i]) <= 0.5) && t.render.target.every((v, i) => Math.abs(v - u[3 + i]) <= 0.5);
  }, null, {polling: 500, timeout: 120000}).catch(async e => { throw new Error(`camera/URL never settled: ${JSON.stringify(await a.page.evaluate(() => ({cam: window.__atlasTest.camera, target: window.__atlasTest.render.target, url: location.search})))}\n${e.message}`); });
  const url = await a.page.evaluate(() => location.href);
  const first = await snap(a.page);
  const q = new URL(url).searchParams;
  assert.equal(q.get('tracts'), BUNDLES.join(','), `tracts param keeps pick order: ${url}`);
  assert.equal(q.get('cam')?.split(',').length, 9, `cam param has 9 numbers: ${url}`);
  assert.deepEqual(first.bundles, BUNDLES, 'first page selection order');
  await a.page.goto('about:blank', {timeout: 120000}); // software-GL teardown of a loaded scene is slow // a same-URL goto would not reload
  await a.page.goto(url, {waitUntil: 'domcontentloaded'});
  await ready(a.page);
  await a.page.waitForFunction(w => { const s = window.__atlasTest; return s.bundles.length === w.length && w.every(i => s.bundles.includes(i)); }, BUNDLES);
  await newFrame(a.page);
  const second = await snap(a.page);
  report.roundTrip = {url, first, second};
  assert.deepEqual(second.bundles, first.bundles, 'reloaded selection is the same bundles in the same order');
  assert(near(second.camera, first.camera), `camera position within 0.5: ${first.camera} vs ${second.camera}`);
  assert(near(second.target, first.target), `camera target within 0.5: ${first.target} vs ${second.target}`);
  report.checks.push(`round trip: ${BUNDLES.join(',')} and camera restored from ${url}`);
  await a.context.close();

  // 2. Garbage params: clean console, no bundles.
  const g = await open({width: 1440, height: 900}, 'garbage');
  await g.page.goto(withTest('/atlas.html?tracts=NOPE,,&cam=1,2,x'), {waitUntil: 'domcontentloaded'});
  await ready(g.page);
  const gs = await snap(g.page);
  assert.deepEqual(gs.bundles, [], 'garbage tracts select nothing');
  assert.deepEqual(gs.sceneBundles, [], 'garbage tracts load nothing');
  report.checks.push('garbage tracts/cam ignored without errors');
  await g.context.close();

  // 3. lesson wins over tracts/cam.
  const l = await open({width: 1440, height: 900}, 'lesson');
  await l.page.goto(withTest('/atlas.html?lesson=motor-cst&tracts=AF_L,UF_R&cam=300,0,0,0,0,0,0,0,1'), {waitUntil: 'domcontentloaded'});
  await ready(l.page);
  const ls = await snap(l.page);
  assert(!ls.bundles.includes('UF_R') && !ls.sceneBundles.includes('UF_R') && !ls.sceneBundles.includes('AF_L'), `lesson ignores tracts: ${JSON.stringify(ls)}`);
  assert(!near(ls.camera, [300, 0, 0], 1), `lesson ignores cam: ${ls.camera}`);
  report.checks.push('lesson param wins over tracts/cam');
  await l.context.close();

  // 4. Copy link button: present, named, no overlap with siblings, inside the viewport.
  for (const size of [{width: 390, height: 844}, {width: 1440, height: 900}]) {
    const label = `${size.width}x${size.height}`;
    const c = await open(size, `copy ${label}`);
    await c.context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await c.page.goto(withTest('/atlas.html'), {waitUntil: 'domcontentloaded'});
    await ready(c.page);
    await c.page.evaluate(() => document.querySelector('.atlas-stage').scrollIntoView({block: 'start'}));
    await c.page.locator('.atlas-view-menu summary').click();
    const btn = c.page.getByRole('button', {name: 'Copy link to this view'});
    assert.equal(await btn.count(), 1, `${label} Copy link button exists`);
    const rects = await c.page.evaluate(() => {
      const r = e => { const b = e.getBoundingClientRect(); return {id: e.id || e.textContent.trim(), x: b.x, y: b.y, w: b.width, h: b.height}; };
      return [...document.querySelectorAll('.stage-tools > button, .stage-tools > details > summary, .atlas-view-menu .views button')].map(r);
    });
    const me = rects.find(r => r.id === 'atlasCopyLink');
    assert(me && me.w > 0 && me.h > 0, `${label} button has a box`);
    assert(me.x >= -0.5 && me.x + me.w <= size.width + 0.5 && me.y >= -0.5 && me.y + me.h <= size.height + 0.5, `${label} button inside viewport: ${JSON.stringify(me)}`);
    for (const o of rects) if (o !== me) assert(me.x + me.w <= o.x + 0.5 || o.x + o.w <= me.x + 0.5 || me.y + me.h <= o.y + 0.5 || o.y + o.h <= me.y + 0.5, `${label} Copy link overlaps ${o.id}: ${JSON.stringify([me, o])}`);
    const hit = await c.page.evaluate(({x, y}) => document.elementFromPoint(x, y)?.id, {x: me.x + me.w / 2, y: me.y + me.h / 2});
    assert.equal(hit, 'atlasCopyLink', `${label} button is not covered`);
    if (size.width === 1440) {
      await btn.click();
      await c.page.waitForFunction(() => document.getElementById('linkStatus')?.textContent === 'Link copied');
      const clip = await c.page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
      if (clip !== null) assert.equal(clip, await c.page.evaluate(() => location.href), 'clipboard holds location.href');
      report.checks.push('Copy link announces "Link copied"');
    }
    report.checks.push(`${label}: Copy link button present, named, no overlap`);
    await c.context.close();
  }
  assert.deepEqual(report.errors, [], 'no unexpected browser errors');
} catch (error) {
  report.failure = error.stack || String(error);
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
  console.error(report.failure);
  await browser.close();
  process.exit(1);
}
await browser.close();
await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
console.log(`PASS: ${report.checks.length} deep-link checks`);
