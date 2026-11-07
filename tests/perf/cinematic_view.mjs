// Cinematic view on the built /atlas: entry and exit from the Views menu, the `view=cinematic` URL
// round trip, the entry selection, the slice panel and Lesson Scene exits, hover, Present mode,
// the draft notice and credits, and a clean console.
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.argv.find(v => v.startsWith('--url='))?.slice(6);
if (!base) throw new Error('Pass --url=');
const out = process.argv.find(v => v.startsWith('--out='))?.slice(6) || 'output/cinematic-view';
await mkdir(out, {recursive: true});
const report = {url: base, checks: [], errors: []};
const ENTRY = ['CC', 'CST_L', 'CST_R', 'AF_L', 'AF_R', 'IFOF_L', 'IFOF_R', 'ILF_L', 'ILF_R', 'UF_L', 'UF_R', 'FAT_L'];

const browser = await chromium.launch({headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
async function open(label, size = {width: 1440, height: 900}) {
  const context = await browser.newContext({viewport: size, reducedMotion: 'reduce'});
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.on('pageerror', e => report.errors.push(`${label}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(`${label}: console ${m.text()}`); });
  return {context, page};
}
const withTest = path => new URL(`${path}${path.includes('?') ? '&' : '?'}test=1`, base).href;
async function ready(page) {
  await page.waitForFunction(() => document.getElementById('atlasLoading')?.hidden === true && window.__atlasTest?.ready && window.__atlasTest.frames > 0, null, {timeout: 60000});
}
async function newFrame(page) {
  const f = await page.evaluate(() => window.__atlasTest.frames);
  await page.waitForFunction(n => { document.dispatchEvent(new Event('visibilitychange')); return window.__atlasTest.frames > n; }, f, {polling: 100});
}
const state = page => page.evaluate(() => {
  const t = window.__atlasTest, q = new URLSearchParams(location.search);
  return {on: t.cinematic.on, lit: t.cinematic.litStreamlines, selected: t.selectedBundles, view: q.get('view'), tracts: q.get('tracts'),
    pressed: document.getElementById('atlasCinematic').getAttribute('aria-pressed'), legend: !document.getElementById('cinematicLegend').hidden,
    camera: t.camera, target: t.render.target, slice: t.slicePanel.open};
});
async function menu(page, locator) {
  await page.evaluate(() => document.querySelector('.atlas-stage').scrollIntoView({block: 'start'}));
  await page.locator('.atlas-view-menu summary').click();
  await page.locator(locator).click();
}
const litReady = (page, ids) => page.waitForFunction(w => { const l = window.__atlasTest.cinematic.litStreamlines; return l.length === w.length && w.every(id => l.includes(id)); }, ids);
const near = (a, b, tol = 0.5) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= tol);

try {
  // 1. Entry with nothing selected: the 12 entry Bundles, Lit streamlines, legend, URL; then the draft notice, credits, hover, Present mode, exit.
  const a = await open('entry');
  await a.page.goto(withTest('/atlas.html'), {waitUntil: 'domcontentloaded'});
  await ready(a.page);
  const camBefore = await a.page.evaluate(() => window.__atlasTest.camera);
  assert.deepEqual((await state(a.page)).selected, [], 'boot selects nothing');
  await menu(a.page, '#atlasCinematic');
  await litReady(a.page, ENTRY);
  await newFrame(a.page);
  let s = await state(a.page);
  assert.equal(s.on, true, 'Views menu enters Cinematic view');
  assert.deepEqual(s.selected, ENTRY, 'entry with nothing selected selects the 12 entry Bundles in order');
  assert.equal(s.view, 'cinematic', 'entry writes view=cinematic');
  assert.equal(s.tracts, ENTRY.join(','), 'entry writes the entry Bundles to tracts=');
  assert.equal(s.pressed, 'true'); assert.equal(s.legend, true, 'legend shows');
  assert(near(s.camera, camBefore, 1), `entry keeps the camera: ${camBefore} -> ${s.camera}`);
  assert.match(await a.page.locator('#cinematicLegend').innerText(), /Red: left–right[\s\S]*Green: front–back[\s\S]*Blue: up–down/);
  report.checks.push('entry: 12 entry Bundles drawn as Lit streamlines, legend shown, view=cinematic written, camera kept');
  for (const text of ['Educational draft, research only.', 'HCP1065 sampled tractography', 'HCP S1200 group surface']) {
    const node = a.page.locator('.source-footer p', {hasText: text}).first();
    assert(await node.isVisible(), `${text} stays visible`);
  }
  await a.page.screenshot({path: `${out}/entry-1440.png`});
  report.checks.push('draft notice and data credits visible in Cinematic view');
  // Hover still names the streamline under the pointer.
  const projected = await a.page.evaluate(() => {
    const t = window.__atlasTest, rect = document.querySelector('#atlasCanvas>canvas').getBoundingClientRect(), points = [];
    for (let line = 0; line < 40; line++) for (const v of [6, 10, 14, 18, 22]) {
      const p = t.projectBundleVertex('AF_L', line, v);
      if (p && p.z > -1 && p.z < 1 && p.x > rect.left + 8 && p.x < Math.min(rect.right, innerWidth) - 8 && p.y > Math.max(rect.top, 0) + 8 && p.y < Math.min(rect.bottom, innerHeight) - 8) points.push(p);
    }
    return points;
  });
  let hover = null;
  for (const p of projected) {
    await a.page.mouse.move(p.x, p.y);
    hover = await a.page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(window.__atlasTest.hover)))));
    if (hover?.bundle) break;
  }
  assert(hover?.bundle, `hover finds a Lit streamline among ${projected.length} projected AF_L points`);
  assert.match(await a.page.locator('#atlasHover').innerText(), /streamline \d+ of \d+/);
  await a.page.mouse.move(0, 0);
  await a.page.waitForFunction(() => window.__atlasTest.hover === null);
  report.checks.push(`hover on Lit streamlines names ${hover.bundle} streamline ${hover.streamline + 1}`);
  // Present mode keeps the view; Study mode returns.
  await a.page.selectOption('#lessonProfile', 'presenter');
  await newFrame(a.page);
  s = await state(a.page);
  assert.equal(s.on, true, 'Present mode keeps Cinematic view'); assert.equal(s.lit.length, 12);
  assert.equal(await a.page.evaluate(() => window.__atlasTest.profile), 'presenter');
  await a.page.screenshot({path: `${out}/present-1440.png`});
  await a.page.selectOption('#lessonProfile', 'teaching');
  await newFrame(a.page);
  s = await state(a.page);
  assert.equal(s.on, true, 'Study mode keeps Cinematic view'); assert.equal(s.lit.length, 12);
  report.checks.push('Cinematic view holds through Present and Study modes');
  // Choosing the item again leaves; the selection stays.
  await menu(a.page, '#atlasCinematic');
  await newFrame(a.page);
  s = await state(a.page);
  assert.equal(s.on, false, 'choosing the item again leaves Cinematic view');
  assert.deepEqual(s.lit, [], 'Lit streamlines removed'); assert.equal(s.view, null, 'exit removes view=');
  assert.equal(s.pressed, 'false'); assert.equal(s.legend, false, 'legend hides');
  assert.deepEqual(s.selected, ENTRY, 'exit keeps the selection');
  report.checks.push('exit: view= removed, legend hidden, selection kept');
  await a.context.close();

  // 2. URL round trip: view=cinematic with tracts= and cam= opens Cinematic view on that selection and camera.
  const cam = '-414,81,118,-8,-14,12,0,0,1';
  const b = await open('round trip');
  await b.page.goto(withTest(`/atlas.html?view=cinematic&tracts=AF_L,CST_R&cam=${cam}`), {waitUntil: 'domcontentloaded'});
  await ready(b.page);
  await litReady(b.page, ['AF_L', 'CST_R']);
  await newFrame(b.page);
  s = await state(b.page);
  assert.equal(s.on, true, 'view=cinematic opens Cinematic view');
  assert.deepEqual(s.selected, ['AF_L', 'CST_R'], 'an existing selection stays untouched');
  assert(near(s.camera, [-414, 81, 118]) && near(s.target, [-8, -14, 12]), `cam= placed the camera: ${s.camera} / ${s.target}`);
  const url = await b.page.evaluate(() => location.href);
  assert.equal(new URL(url).searchParams.get('view'), 'cinematic', `URL keeps view=cinematic: ${url}`);
  await b.page.goto('about:blank', {timeout: 120000});
  await b.page.goto(url, {waitUntil: 'domcontentloaded'});
  await ready(b.page);
  await litReady(b.page, ['AF_L', 'CST_R']);
  const again = await state(b.page);
  assert.equal(again.on, true); assert.deepEqual(again.selected, ['AF_L', 'CST_R']);
  assert(near(again.camera, s.camera), `reload keeps the camera: ${s.camera} vs ${again.camera}`);
  report.checks.push(`URL round trip: ${url}`);
  // 3. Slice panel exit.
  await menu(b.page, '[data-slice-open="axial"]');
  await b.page.waitForFunction(() => window.__atlasTest.slicePanel.open);
  s = await state(b.page);
  assert.equal(s.on, false, 'opening the slice panel leaves Cinematic view');
  assert.equal(s.view, null, 'slice exit removes view='); assert.deepEqual(s.lit, []);
  report.checks.push('slice panel exit');
  await b.context.close();

  // 4. Unknown view values are ignored.
  const u = await open('unknown view');
  await u.page.goto(withTest('/atlas.html?view=peel&tracts=AF_L'), {waitUntil: 'domcontentloaded'});
  await ready(u.page);
  await u.page.waitForFunction(() => window.__atlasTest.bundles.includes('AF_L'));
  s = await state(u.page);
  assert.equal(s.on, false, 'an unknown view value is ignored'); assert.deepEqual(s.lit, []);
  report.checks.push('unknown view value ignored');
  await u.context.close();

  // 5. Lesson Scene exit: enter during a lesson, then Restore scene leaves and restores the authored selection.
  const l = await open('lesson');
  await l.page.goto(withTest('/atlas.html?lesson=motor-cst'), {waitUntil: 'domcontentloaded'});
  await ready(l.page);
  await l.page.waitForFunction(() => window.__atlasTest.lesson.lessonId === 'motor-cst' && document.getElementById('lessonRestore'));
  const authored = (await state(l.page)).selected;
  await menu(l.page, '#atlasCinematic');
  const lessonEntry = authored.length ? authored : ENTRY;
  await litReady(l.page, lessonEntry);
  s = await state(l.page);
  assert.equal(s.on, true); assert.deepEqual(s.selected, lessonEntry, 'entry during a lesson follows the entry selection rule');
  assert.equal(s.view, 'cinematic', 'entry during a lesson writes view=');
  await l.page.locator('#lessonRestore').click();
  await l.page.waitForFunction(() => !window.__atlasTest.cinematic.on);
  s = await state(l.page);
  assert.deepEqual(s.lit, []); assert.equal(s.view, null, 'Lesson Scene exit removes view=');
  assert.deepEqual(s.selected, authored, 'Restore scene brings back the authored selection');
  report.checks.push(`Lesson Scene exit (motor-cst step 0, authored selection ${JSON.stringify(authored)})`);
  await l.context.close();

  // 6. Phone width: the legend and the menu item fit without horizontal scroll.
  const p = await open('phone', {width: 375, height: 812});
  await p.page.goto(withTest('/atlas.html'), {waitUntil: 'domcontentloaded'});
  await ready(p.page);
  await menu(p.page, '#atlasCinematic');
  await litReady(p.page, ENTRY);
  await newFrame(p.page);
  const fit = await p.page.evaluate(() => {
    const r = document.getElementById('cinematicLegend').getBoundingClientRect();
    return {scroll: document.documentElement.scrollWidth, width: innerWidth, legend: [r.left, r.right]};
  });
  assert(fit.scroll <= fit.width, `no horizontal scroll at 375 px: ${JSON.stringify(fit)}`);
  assert(fit.legend[0] >= 0 && fit.legend[1] <= fit.width, `legend inside 375 px: ${JSON.stringify(fit)}`);
  await p.page.screenshot({path: `${out}/entry-375.png`});
  report.checks.push('375 px: legend inside the viewport, no horizontal scroll');
  await p.context.close();

  assert.deepEqual(report.errors, [], 'no console or page errors');
  console.log(`PASS: ${report.checks.length} Cinematic view checks\n- ${report.checks.join('\n- ')}`);
} catch (error) {
  report.failure = error.stack || String(error); throw error;
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
