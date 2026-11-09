// Cinematic view gate, section 8: no fibre-animation work while Cinematic view hides the traces.
// Kept apart from cinematic_view.mjs, which calls it with its page helpers.
import assert from 'node:assert/strict';

export async function checkFibreMotion({browser, report, withTest, ready, menu, litReady}) {
  // 8. No fibre-animation work while Cinematic view hides the traces. This context allows motion; frames are
  // counted, not timed, because software GL draws slowly with pathways on. The clock (__atlasTest.time) advances
  // only while the animation runs: it must move in Explore with Animate on, stand still inside Cinematic view, and move again after exit.
  const m = await browser.newContext({viewport: {width: 1440, height: 900}, reducedMotion: 'no-preference'});
  const mp = await m.newPage(); mp.setDefaultTimeout(60000);
  mp.on('pageerror', e => report.errors.push(`motion: ${e.message}`));
  mp.on('console', msg => { if (msg.type() === 'error') report.errors.push(`motion: console ${msg.text()}`); });
  await mp.goto(withTest('/atlas.html?tracts=AF_L'), {waitUntil: 'domcontentloaded'});
  await ready(mp);
  await mp.waitForFunction(() => window.__atlasTest.bundles.includes('AF_L'));
  await mp.evaluate(() => document.getElementById('tracePlay').click());
  assert.equal(await mp.evaluate(() => window.__atlasTest.playing), true, 'Animate fibre paths is on');
  const tick = async () => {
    const before = await mp.evaluate(() => ({t: window.__atlasTest.time, f: window.__atlasTest.frames}));
    await mp.waitForFunction(f => window.__atlasTest.frames >= f + 2, before.f, {timeout: 60000});
    return (await mp.evaluate(() => window.__atlasTest.time)) - before.t;
  };
  const moving = await tick();
  assert(moving > 0, `control: the fibre clock advances in Explore with Animate on (${moving.toFixed(3)} s over two frames)`);
  await menu(mp, '#atlasCinematic');
  await litReady(mp, ['AF_L']);
  await mp.waitForTimeout(500);
  const t0 = await mp.evaluate(() => window.__atlasTest.time);
  await mp.waitForTimeout(1500);
  const stalled = (await mp.evaluate(() => window.__atlasTest.time)) - t0;
  assert.equal(stalled, 0, `the fibre clock stands still while Cinematic view hides the traces (advanced ${stalled.toFixed(3)} s)`);
  await menu(mp, '#atlasCinematic');
  await mp.waitForFunction(() => !window.__atlasTest.cinematic.on);
  const resumed = await tick();
  assert(resumed > 0, `the animation resumes after leaving Cinematic view (${resumed.toFixed(3)} s over two frames)`);
  report.checks.push(`fibre animation: clock +${moving.toFixed(3)} s in Explore, +${stalled.toFixed(3)} s inside Cinematic view, +${resumed.toFixed(3)} s after exit`);
  await m.close();
}
