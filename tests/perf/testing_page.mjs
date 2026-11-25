import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.argv.find(a => a.startsWith('--url='))?.slice(6);
assert(base, 'Pass --url=http://127.0.0.1:PORT');
const out = process.argv.find(a => a.startsWith('--out='))?.slice(6) || 'output/testing-page';
await mkdir(out, {recursive: true});

const WIDTHS = [320, 390, 768, 1440];
const report = {url: base, widths: [], checks: [], errors: [], consoleErrors: []};
const browser = await chromium.launch({headless: true});

try {
  const context = await browser.newContext({viewport: {width: 1440, height: 900}, reducedMotion: 'reduce'});
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push(m.text()); });

  for (const width of WIDTHS) {
    await page.setViewportSize({width, height: 900});
    await page.goto(new URL('/testing?test=1', base).href, {waitUntil: 'networkidle'});
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => {
      const doc = document.documentElement;
      const wrappedLinks = [...document.querySelectorAll('header nav a, footer a, .detail-link')]
        .filter(a => {
          const r = document.createRange();
          r.selectNodeContents(a);
          return new Set([...r.getClientRects()].filter(x => x.width && x.height).map(x => Math.round(x.top))).size > 1;
        })
        .map(a => a.textContent.trim());
      return {scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, scrollHeight: doc.scrollHeight, wrappedLinks};
    });
    assert(layout.scrollWidth <= layout.clientWidth, `Horizontal overflow at ${width}px: ${layout.scrollWidth} > ${layout.clientWidth}`);
    assert.deepEqual(layout.wrappedLinks, [], `Wrapped links at ${width}px: ${layout.wrappedLinks.join(', ')}`);
    await page.screenshot({path: `${out}/testing-${width}.png`});
    if (layout.scrollHeight <= 12000) {
      await page.screenshot({path: `${out}/testing-${width}-full.png`, fullPage: true});
    }
    report.widths.push({width, ...layout});
  }
  report.checks.push('Responsive 320/390/768/1440 layout with 0 overflow and 0 wrapped links');

  await page.setViewportSize({width: 1440, height: 900});
  await page.goto(new URL('/testing?test=1', base).href, {waitUntil: 'networkidle'});
  assert.equal(await page.evaluate(() => window.__testingTest.visibleCount), 26);

  await page.locator('[data-filter-kind="cortex"]').click();
  assert.equal(await page.evaluate(() => window.__testingTest.visibleCount), 10);
  await page.locator('[data-filter-kind="tract"]').click();
  assert.equal(await page.evaluate(() => window.__testingTest.visibleCount), 16);
  await page.locator('[data-filter-hemi="R"]').click();
  assert(await page.locator('[data-target="slf2-right"]').isVisible());
  await page.locator('[data-filter-hemi="all"]').click();
  await page.locator('[data-filter-kind="all"]').click();
  await page.locator('#modeSelect').selectOption('untestable-anatomy-only');
  assert.equal(await page.evaluate(() => window.__testingTest.visibleCount), 4);
  await page.locator('#modeSelect').selectOption('all');
  await page.locator('#targetSearch').fill('55b');
  assert.equal(await page.evaluate(() => window.__testingTest.visibleCount), 1);
  assert.equal(await page.evaluate(() => window.__testingTest.selectedId), 'ctx-pmfg-left');
  report.checks.push('Kind, hemisphere, mode, and search filters update lookup and selection');

  const drill = page.locator('[data-drill="drill-sma-fat-mep"]');
  await drill.locator('[data-option="a"]').click();
  const feedback = drill.locator('.drill-feedback');
  assert(await feedback.isVisible());
  assert.equal(await feedback.getAttribute('aria-live'), 'polite');
  assert.match(await feedback.innerText(), /Correct\./);
  await drill.locator('.drill-jump').click();
  assert.equal(await page.evaluate(() => window.__testingTest.selectedId), 'fat-left');
  report.checks.push('Drill interaction grades answers in aria-live region and jumps to protocol');

  await page.goto(new URL('/testing?target=af-left&test=1', base).href, {waitUntil: 'networkidle'});
  assert.equal(await page.evaluate(() => window.__testingTest.selectedId), 'af-left');
  assert.match(await page.locator('#targetDetail h3').innerText(), /Left arcuate fasciculus/);
  report.checks.push('Deep link ?target=af-left selects target');

  await page.goto(new URL('/labs/lesion-lab?test=1', base).href, {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => window.__lesionLabTest?.ready, null, {timeout: 60000});
  await page.locator('#openEvidence').click();
  await page.locator('#testingBlock').waitFor({state: 'visible'});
  await page.waitForFunction(() => document.getElementById('evidenceDrawer').getBoundingClientRect().right <= innerWidth + 1);
  const labItems = await page.locator('#testingList .lab-testing-item').count();
  assert(labItems >= 1, 'Expected at least one matched testing protocol in Lesion Lab drawer');
  const firstHref = await page.locator('#testingList .lab-testing-link').first().getAttribute('href');
  assert.match(firstHref, /^\.\/testing\?target=/);
  await page.screenshot({path: `${out}/lesion-lab-testing-drawer.png`});
  report.checks.push(`Lesion Lab #testingBlock renders ${labItems} matched protocol(s)`);

  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.consoleErrors, []);
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
console.log(JSON.stringify({ok: true, checks: report.checks.length, widths: report.widths.length}));
