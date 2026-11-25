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
      const clippedButtons = [...document.querySelectorAll('.drill-option, .target-row, .drill-jump, .territory-map .segmented button')]
        .filter(btn => {
          const r = btn.getBoundingClientRect();
          return r.width > 0 && (btn.scrollWidth > btn.clientWidth + 1 || r.right > doc.clientWidth + 1);
        })
        .map(btn => btn.textContent.trim().slice(0, 40));
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        scrollHeight: doc.scrollHeight,
        wrappedLinks,
        clippedButtons,
      };
    });
    assert(layout.scrollWidth <= layout.clientWidth, `Horizontal overflow at ${width}px: ${layout.scrollWidth} > ${layout.clientWidth}`);
    assert.deepEqual(layout.wrappedLinks, [], `Wrapped links at ${width}px: ${layout.wrappedLinks.join(', ')}`);
    assert.deepEqual(layout.clippedButtons, [], `Clipped buttons at ${width}px: ${layout.clippedButtons.join(', ')}`);
    await page.screenshot({path: `${out}/testing-${width}.png`});
    if (layout.scrollHeight <= 12000) {
      await page.screenshot({path: `${out}/testing-${width}-full.png`, fullPage: true});
    }
    report.widths.push({width, ...layout});
  }
  report.checks.push('Responsive 320/390/768/1440 layout with 0 overflow, 0 wrapped links, and 0 clipped buttons');

  await page.setViewportSize({width: 1440, height: 900});
  await page.goto(new URL('/testing?test=1', base).href, {waitUntil: 'networkidle'});
  assert.equal(await page.evaluate(() => window.__testingTest.visibleCount), 26);

  await page.locator('[data-target="ifof-left"]').click();
  assert.equal(await page.evaluate(() => document.activeElement?.dataset?.target), 'ifof-left', 'Selecting a target row preserves keyboard focus');

  await page.locator('[data-filter-kind="cortex"]').click();
  assert.equal(await page.evaluate(() => window.__testingTest.visibleCount), 10);
  assert.equal(
    await page.evaluate(() => new URLSearchParams(location.search).get('target')),
    'ctx-ifg-left',
    'URL target updates synchronously with filtered selection',
  );
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
  report.checks.push('Kind, hemisphere, mode, and search filters update lookup, focus, and URL target');

  const drill = page.locator('[data-drill="drill-sma-fat-mep"]');
  await drill.locator('[data-option="a"]').click();
  assert.equal(
    await page.evaluate(() => document.activeElement?.dataset?.option),
    'a',
    'Selecting a drill option preserves keyboard focus in place',
  );
  const feedback = drill.locator('.drill-feedback');
  assert(await feedback.isVisible());
  assert.equal(await feedback.getAttribute('aria-live'), 'polite');
  assert.match(await feedback.innerText(), /Correct\./);
  await drill.locator('.drill-jump').click();
  assert.equal(await page.evaluate(() => window.__testingTest.selectedId), 'fat-left');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'targetDetail', 'Jump moves focus to detail panel');
  report.checks.push('Drill interaction keeps focus, grades answers in mounted aria-live region, and jumps focus to detail');

  await page.goto(new URL('/testing?target=af-left&test=1', base).href, {waitUntil: 'networkidle'});
  assert.equal(await page.evaluate(() => window.__testingTest.selectedId), 'af-left');
  assert.match(await page.locator('#targetDetail h3').innerText(), /Left arcuate fasciculus/);
  assert.match(await page.locator('#targetDetail .detail-link').first().getAttribute('href'), /^\.\/atlas\?lesson=/);
  report.checks.push('Deep link ?target=af-left selects target with clean atlas route');

  assert((await page.evaluate(() => window.__testingTest.mapTargetCount)) >= 20);
  const realMapPaths = await page.locator('#territoryMap [data-kind="cortex"] .map-shape').count();
  assert.equal(realMapPaths, 10, 'Expected all 10 real HCP-MMP1 cortical territory polygons on Left map');

  const checkNoCalloutOverlap = async label => {
    const overlaps = await page.evaluate(() => {
      const svgs = [...document.querySelectorAll('.territory-map-svg')];
      const bad = [];
      for (const svg of svgs) {
        const boxes = [...svg.querySelectorAll('.map-callout')].map(el => el.getBoundingClientRect());
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i], b = boxes[j];
            if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) {
              bad.push([i, j]);
            }
          }
        }
      }
      return bad;
    });
    assert.deepEqual(overlaps, [], `Overlapping .map-callout boxes (${label}): ${JSON.stringify(overlaps)}`);
  };
  await checkNoCalloutOverlap('left-both');

  await page.locator('[data-map-layer="cortex"]').click();
  assert.equal(await page.locator('#territoryMap .map-hotspot[data-kind="tract"]').count(), 0);
  assert.equal(await page.locator('#territoryMap .map-hotspot[data-kind="cortex"]').count(), 10);
  await checkNoCalloutOverlap('left-cortex');

  await page.locator('[data-map-layer="tract"]').click();
  assert.equal(await page.locator('#territoryMap .map-hotspot[data-kind="cortex"]').count(), 0);
  assert((await page.locator('#territoryMap .map-hotspot[data-kind="tract"]').count()) >= 10);
  await checkNoCalloutOverlap('left-tract');

  await page.locator('[data-map-layer="both"]').click();
  await page.locator('[data-map-target="ctx-pmfg-left"]').click();
  assert.equal(await page.evaluate(() => window.__testingTest.selectedId), 'ctx-pmfg-left');
  assert.match(await page.locator('#targetDetail h3').innerText(), /posterior middle frontal gyrus/);
  assert.equal(await page.evaluate(() => new URLSearchParams(location.search).get('target')), 'ctx-pmfg-left');

  await page.locator('[data-map-target="fornix-bilateral"]').click();
  assert.equal(await page.evaluate(() => window.__testingTest.selectedId), 'fornix-bilateral');
  assert.match(await page.locator('#targetDetail h3').innerText(), /Fornix/);
  assert.equal(await page.evaluate(() => new URLSearchParams(location.search).get('target')), 'fornix-bilateral');
  await page.locator('#territoryMap').screenshot({path: `${out}/testing-map-left-1440.png`});

  await page.locator('[data-map-hemi="R"]').click();
  assert.equal(await page.evaluate(() => window.__testingTest.mapHemi), 'R');
  await page.locator('[data-map-target="slf2-right"]').waitFor({state: 'visible'});
  await checkNoCalloutOverlap('right-both');
  await page.locator('[data-map-target="slf2-right"]').click();
  assert.equal(await page.evaluate(() => window.__testingTest.selectedId), 'slf2-right');
  assert.match(await page.locator('#targetDetail h3').innerText(), /Right SLF II/);
  await page.locator('#territoryMap').screenshot({path: `${out}/testing-map-right-1440.png`});

  await page.locator('[data-map-hemi="L"]').click();
  await page.locator('[data-map-target="ctx-ifg-left"]').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => window.__testingTest.selectedId), 'ctx-ifg-left');

  const labSwitchHref = await page.locator('.pillar-link[href*="lesion-lab"]').getAttribute('href');
  assert(labSwitchHref, '3D Lesion Lab switcher link present on /testing');
  await page.locator('#openTestingSheet').click();
  await page.locator('#testingSheetDialog[open]').waitFor({state: 'visible'});
  assert.match(await page.locator('#testingSheetDialog [data-sheet-watermark]').innerText(), /Group reference.*Educational draft/);
  assert.equal(await page.locator('#testingSheetDialog input').count(), 0, 'Testing Sheet has zero PHI input fields');
  await page.locator('#testingSheetDialog').screenshot({path: `${out}/testing-sheet-dialog.png`});
  await page.locator('#testingSheetDialog [data-sheet-close]').click();

  await page.setViewportSize({width: 390, height: 844});
  await page.locator('#territoryMap').screenshot({path: `${out}/testing-map-390.png`});
  await page.setViewportSize({width: 1440, height: 900});
  report.checks.push('2D HCP territory map (cortex/tract layer toggle, zero overlapping callouts), switcher, and Testing Sheet dialog verified');

  await page.goto(new URL('/labs/lesion-lab?test=1', base).href, {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => window.__lesionLabTest?.ready, null, {timeout: 60000});

  for (const vw of [1024, 1440]) {
    await page.setViewportSize({width: vw, height: 900});
    const clippedLabButtons = await page.evaluate(() =>
      [...document.querySelectorAll('.lab-presets button, .lab-lens-options button')]
        .filter(btn => {
          const r = btn.getBoundingClientRect();
          return r.width > 0 && (btn.scrollWidth > btn.clientWidth + 1 || r.right > document.documentElement.clientWidth + 1);
        })
        .map(btn => btn.textContent.trim()),
    );
    assert.deepEqual(clippedLabButtons, [], `Clipped Lesion Lab buttons at ${vw}px: ${clippedLabButtons.join(', ')}`);
  }

  await page.locator('[data-preset="left-sma"]').click();
  await page.waitForFunction(() => window.__lesionLabTest.preset === 'left-sma' && window.__lesionLabTest.lens === 'asleep-mep');
  let labState = await page.evaluate(() => window.__lesionLabTest);
  assert(labState.interrogatedProtocols.includes('cst-bilateral'));
  assert(labState.blindSpotProtocols.includes('fat-left'));
  assert(await page.locator('#storyTesting').isVisible());
  assert.match(await page.locator('#storyTesting').innerText(), /blind spot/);
  await page.waitForFunction(() => window.__lesionLabTest.labelCount >= 1);
  assert((await page.locator('#labLabels .lab-tract-label').count()) >= 1, 'Expected 3D tract callout labels on desktop');
  const railScroll = await page.evaluate(() => {
    const el = document.getElementById('lesionControls');
    return {scrollHeight: el.scrollHeight, clientHeight: el.clientHeight};
  });
  assert(railScroll.scrollHeight <= railScroll.clientHeight + 2, `Expected zero-scroll right rail at 1440x900: ${JSON.stringify(railScroll)}`);
  await page.locator('.lab-stage').screenshot({path: `${out}/lesion-lab-sma-mep-blindspot.png`});

  await page.locator('[data-preset="left-occipitotemporal"]').click();
  await page.waitForFunction(() => window.__lesionLabTest.preset === 'left-occipitotemporal' && window.__lesionLabTest.lens === 'awake-naming');
  labState = await page.evaluate(() => window.__lesionLabTest);
  assert(labState.interrogatedProtocols.includes('ifof-left'));
  assert(labState.blindSpotProtocols.includes('ilf-vof-left-reading'));
  assert(labState.blindSpotProtocols.includes('or-bilateral'));
  await page.locator('.lab-stage').screenshot({path: `${out}/lesion-lab-ot-naming-blindspot.png`});

  await page.locator('.lab-battery summary').click();
  await page.locator('[data-battery-task="dulip-object-naming"]').click();
  await page.waitForFunction(() => window.__lesionLabTest.lens === 'custom' && window.__lesionLabTest.customTasks.includes('dulip-object-naming'));
  labState = await page.evaluate(() => window.__lesionLabTest);
  assert(labState.interrogatedProtocols.includes('ifof-left'), 'Object naming dims ifof-left in left occipitotemporal');
  assert(labState.blindSpotProtocols.includes('ilf-vof-left-reading'), 'Object naming alone leaves ilf-vof-left-reading blind');

  await page.locator('[data-preset="left-temporoparietal"]').click();
  await page.waitForFunction(() => window.__lesionLabTest.preset === 'left-temporoparietal');
  await page.locator('[data-battery-task="dulip-object-naming"]').click();
  await page.waitForFunction(() => window.__lesionLabTest.lens === 'custom' && window.__lesionLabTest.customTasks.includes('dulip-object-naming'));
  labState = await page.evaluate(() => window.__lesionLabTest);
  assert(labState.blindSpotProtocols.includes('af-left'), 'Object naming alone must leave af-left blind');
  await page.locator('[data-battery-task="dulip-repetition"]').click();
  await page.waitForFunction(() => window.__lesionLabTest.customTasks.includes('dulip-repetition'));
  labState = await page.evaluate(() => window.__lesionLabTest);
  assert(labState.interrogatedProtocols.includes('af-left'), 'Adding word repetition dims af-left');
  await page.locator('.lab-stage').screenshot({path: `${out}/lesion-lab-battery-builder.png`});

  await page.locator('#openTestingSheet').click();
  await page.locator('#labTestingSheet[open]').waitFor({state: 'visible'});
  assert.equal(await page.locator('#labTestingSheet thead th').count(), 3);
  assert.match(await page.locator('#labTestingSheet [data-sheet-watermark]').innerText(), /Group reference.*Educational draft/);
  assert.equal(await page.locator('#labTestingSheet input').count(), 0, 'Lab Testing Sheet has zero PHI inputs');
  await page.locator('#labTestingSheet').screenshot({path: `${out}/lesion-lab-sheet-dialog.png`});
  await page.locator('#labTestingSheet [data-sheet-close]').click();

  await page.locator('[data-preset="right-parietal"]').click();
  await page.waitForFunction(() => window.__lesionLabTest.hemi === 'R' && !window.__lesionLabTest.loading && window.__lesionLabTest.preset === 'right-parietal');
  labState = await page.evaluate(() => window.__lesionLabTest);
  assert(labState.blindSpotProtocols.includes('slf2-right'));
  await page.locator('.lab-stage').screenshot({path: `${out}/lesion-lab-right-parietal.png`});

  await page.locator('[data-preset="third-ventricle"]').click();
  await page.waitForFunction(() => window.__lesionLabTest.hemi === 'L' && !window.__lesionLabTest.loading && window.__lesionLabTest.preset === 'third-ventricle' && window.__lesionLabTest.lens === 'tailored');
  labState = await page.evaluate(() => window.__lesionLabTest);
  assert.equal(labState.interrogatedProtocols.length, 0);
  assert(labState.blindSpotProtocols.includes('fornix-bilateral'));
  assert(labState.blindSpotProtocols.includes('tra-bilateral'));
  assert(labState.blindSpotProtocols.includes('drtt-bilateral'));
  await page.locator('.lab-stage').screenshot({path: `${out}/lesion-lab-third-ventricle-tailored.png`});

  await page.locator('#openEvidence').click();
  await page.locator('#testingBlock').waitFor({state: 'visible'});
  await page.waitForFunction(() => document.getElementById('evidenceDrawer').getBoundingClientRect().right <= innerWidth + 1);
  const labItems = await page.locator('#testingList .lab-testing-item').count();
  assert(labItems >= 1, 'Expected at least one matched testing protocol in Lesion Lab drawer');
  const firstHref = await page.locator('#testingList .lab-testing-link').first().getAttribute('href');
  assert.match(firstHref, /^\.\/testing\?target=/);
  await page.screenshot({path: `${out}/lesion-lab-testing-drawer.png`});
  report.checks.push(`Lesion Lab presets, 3D test lens, and #testingBlock render ${labItems} matched protocol(s)`);

  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.consoleErrors, []);
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
console.log(JSON.stringify({ok: true, checks: report.checks.length, widths: report.widths.length}));
