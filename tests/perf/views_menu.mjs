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
