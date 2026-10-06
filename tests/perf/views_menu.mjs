import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.argv.find(value => value.startsWith('--url='))?.slice(6);
if (!base) throw new Error('Pass --url=');
const out = process.argv.find(value => value.startsWith('--out='))?.slice(6) || 'output/views-menu';
await mkdir(out, {recursive: true});

const sizes = [
  {width: 320, height: 700},
  {width: 390, height: 844},
  {width: 430, height: 932},
  {width: 1440, height: 900},
];
// Order matches viewer/atlas.html DOM order. On the library page the hemisphere <select>
// defaults to 'both'; the medial-view click handler (viewer/atlas_app.js) switches it to 'L'
// only when it is still 'both', and only medial is clicked last here, so every earlier label
// is predictable from a fixed starting hemisphere. Inside a lesson the hemisphere already
// starts at 'L' (the lesson targets one hemisphere), so 'right' loses its "lateral" suffix and
// medial's switch is a no-op. Both label sets were confirmed against a running build before
// being hard-coded here.
const scenarios = [
  {
    label: 'library', path: '/atlas',
    views: [
      {key: 'left', expect: 'Both hemispheres, left lateral view'},
      {key: 'right', expect: 'Both hemispheres, right lateral view'},
      {key: 'superior', expect: 'Both hemispheres, superior view'},
      {key: 'anterior', expect: 'Both hemispheres, anterior view'},
      {key: 'posterior', expect: 'Both hemispheres, posterior view'},
      {key: 'inferior', expect: 'Both hemispheres, inferior view'},
      {key: 'medial', expect: 'Left hemisphere, medial view'},
    ],
  },
  {
    label: 'lesson', path: '/atlas?lesson=motor-cst',
    views: [
      {key: 'left', expect: 'Left hemisphere, left lateral view'},
      {key: 'right', expect: 'Left hemisphere, right view'},
      {key: 'superior', expect: 'Left hemisphere, superior view'},
      {key: 'anterior', expect: 'Left hemisphere, anterior view'},
      {key: 'posterior', expect: 'Left hemisphere, posterior view'},
      {key: 'inferior', expect: 'Left hemisphere, inferior view'},
      {key: 'medial', expect: 'Left hemisphere, medial view'},
    ],
  },
];

const report = {url: base, checks: [], errors: []};

function recordErrors(page, label) {
  page.on('pageerror', error => report.errors.push(`${label}: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push(`${label}: console ${message.text()}`);
  });
}

try {
  for (const scenario of scenarios) {
    for (const size of sizes) {
      // Fresh browser per scenario: a long-lived software-GL context loses its WebGL context
      // after several navigations, which is a harness artefact, not a site bug.
      const browser = await chromium.launch({
        headless: true,
        args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
      });
      try {
        const context = await browser.newContext({viewport: {width: size.width, height: size.height}});
        const page = await context.newPage();
        page.setDefaultTimeout(20000);
        const label = `${scenario.label} ${size.width}x${size.height}`;
        recordErrors(page, label);
        await page.goto(new URL(scenario.path, base).href, {waitUntil: 'domcontentloaded'});
        assert.equal(await page.evaluate(() => innerWidth), size.width, `${label} viewport width applied`);
        await page.waitForFunction(() => document.getElementById('atlasLoading')?.hidden === true, null, {timeout: 30000});
        // The slice view never opens on load; the Views menu is its only entry point.
        assert.equal(await page.locator('#slicePanel').isHidden(), true, `${label} slice view closed on load`);

        for (const view of scenario.views) {
          await page.locator('.atlas-view-menu summary').click();
          await page.waitForSelector('.atlas-view-menu[open]');
          const button = page.locator(`.atlas-view-menu .views button[data-view="${view.key}"]`);
          const box = await button.boundingBox();
          assert(box, `${label} ${view.key} button has a box`);
          assert(
            box.x >= -0.5 && box.x + box.width <= size.width + 0.5 && box.y >= -0.5 && box.y + box.height <= size.height + 0.5,
            `${label} ${view.key} button rect is fully inside the ${size.width}x${size.height} viewport: ${JSON.stringify(box)}`,
          );
          const hitKey = await page.evaluate(
            ({x, y}) => document.elementFromPoint(x, y)?.closest('button[data-view]')?.dataset.view ?? null,
            {x: box.x + box.width / 2, y: box.y + box.height / 2},
          );
          assert.equal(hitKey, view.key, `${label} ${view.key} elementFromPoint at its centre hits the button, got ${hitKey}`);
          await button.click();
          await page.waitForFunction(
            expected => document.getElementById('sceneOrientation')?.textContent === expected,
            view.expect,
            {timeout: 10000},
          );
          report.checks.push(`${label}: ${view.key} -> "${view.expect}"`);
        }

        // On short phones the stage starts below the fold; a reader scrolls it up before opening its menu.
        await page.evaluate(() => document.querySelector('.atlas-stage').scrollIntoView({block: 'start'}));
        await page.locator('.atlas-view-menu summary').click();
        const slice = page.locator('.atlas-view-menu [data-slice-open="coronal"]');
        const sliceBox = await slice.boundingBox();
        assert(sliceBox && sliceBox.x >= -0.5 && sliceBox.x + sliceBox.width <= size.width + 0.5 && sliceBox.y >= -0.5 && sliceBox.y + sliceBox.height <= size.height + 0.5,
          `${label} coronal slice choice is inside the viewport: ${JSON.stringify(sliceBox)}`);
        assert.equal(await page.evaluate(({x, y}) => document.elementFromPoint(x, y)?.closest('[data-slice-open]')?.dataset.sliceOpen ?? null,
          {x: sliceBox.x + sliceBox.width / 2, y: sliceBox.y + sliceBox.height / 2}), 'coronal', `${label} coronal slice choice is not covered or clipped`);
        await slice.click();
        await page.waitForSelector('#slicePanel:not([hidden])');
        const panel = await page.evaluate(() => {
          const root = document.getElementById('slicePanel');
          return {axis: root.querySelector('[data-slice-axis][aria-pressed="true"]')?.dataset.sliceAxis,
            overflow: root.scrollHeight - root.clientHeight, menuOpen: document.querySelector('.atlas-view-menu').open,
            slice: new URLSearchParams(location.search).has('slice'),
            // Sticky lesson controls and the header must not paint over the panel's own controls.
            covered: ['[data-slice-close]', '[data-slice-range]', '[data-slice-flip]', '.slice-readout'].filter(selector => {
              const box = root.querySelector(selector).getBoundingClientRect();
              const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
              return !hit || !root.contains(hit);
            })};
        });
        assert.deepEqual(panel, {axis: 'coronal', overflow: 0, menuOpen: false, slice: false, covered: []}, `${label} slice view opens on the chosen plane, fits its box and stays on top`);
        await page.locator('#slicePanel [data-slice-close]').click();
        assert.equal(await page.locator('#slicePanel').isHidden(), true, `${label} slice view closes`);
        report.checks.push(`${label}: slice view opens from the Views menu and closes`);
      } finally {
        await browser.close();
      }
    }
  }
  assert.deepEqual(report.errors, [], 'no unexpected browser errors');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.failure = error.stack || String(error);
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
  throw error;
}

await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
console.log(`PASS: ${report.checks.length} view-menu checks across ${scenarios.length} pages and ${sizes.length} viewports`);
