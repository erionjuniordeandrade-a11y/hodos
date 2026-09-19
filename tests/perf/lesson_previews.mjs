import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.argv.find(value => value.startsWith('--url='))?.slice(6);
if (!base) throw new Error('Pass --url=');
const out = process.argv.find(value => value.startsWith('--out='))?.slice(6) || 'output/lesson-previews';
await mkdir(out, {recursive: true});

const landing = new URL('/', base).href;
const previews = [
  {
    lesson: 'motor-cst',
    dialog: 'preview-motor-cst',
    previewHeading: 'Two banks of the central sulcus',
    lessonHeading: 'Find the two banks of the central sulcus',
  },
  {
    lesson: 'fat-language',
    dialog: 'preview-fat-language',
    previewHeading: 'From lateral to medial frontal cortex',
    lessonHeading: 'Connect lateral and medial frontal references',
  },
  {
    lesson: 'default-mode-network',
    dialog: 'preview-default-mode-network',
    previewHeading: 'A network across separated territories',
    lessonHeading: 'Find a distributed network across the medial and lateral surfaces',
  },
];

const report = {url: landing, previews: [], mobile: [], fallbacks: [], errors: []};

function recordErrors(page, label) {
  page.on('pageerror', error => report.errors.push(`${label}: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push(`${label}: console ${message.text()}`);
  });
}

function stateFromLink(href, lesson) {
  const target = new URL(href, landing);
  const params = target.searchParams;
  assert.equal(params.get('lesson'), lesson, `${lesson} Explore link selects its lesson`);
  assert.match(params.get('step') || '', /^\d+$/, `${lesson} Explore link has a numeric step`);
  assert.equal(params.get('phase'), 'orient', `${lesson} Explore link opens Orient`);
  assert.equal(params.get('hemi'), 'L', `${lesson} Explore link opens the left hemisphere`);
  return {target, params};
}

function fallbackFromLink(href, lesson) {
  const target = new URL(href, landing);
  assert.equal(target.searchParams.get('lesson'), lesson, `${lesson} fallback link selects its lesson`);
  return target;
}

function outsidePoint(bounds, width, height) {
  const candidates = [[4, 4], [width - 4, 4], [4, height - 4], [width - 4, height - 4]];
  return candidates.find(([x, y]) => x < bounds.x || x > bounds.x + bounds.width || y < bounds.y || y > bounds.y + bounds.height);
}

async function mobileActionBounds(explore) {
  await explore.evaluate(async node => {
    node.scrollIntoView({block: 'center', inline: 'nearest'});
    // Layout reports the new scroll position before the compositor has painted it.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  return explore.evaluate(node => {
    const dialog = node.closest('dialog');
    const action = node.getBoundingClientRect();
    const box = dialog.getBoundingClientRect();
    const left = box.left + dialog.clientLeft;
    const top = box.top + dialog.clientTop;
    const right = left + dialog.clientWidth;
    const bottom = top + dialog.clientHeight;
    const withinDialog = action.left >= left - 1 && action.right <= right + 1 &&
      action.top >= top - 1 && action.bottom <= bottom + 1;
    const withinViewport = action.left >= -1 && action.right <= innerWidth + 1 &&
      action.top >= -1 && action.bottom <= innerHeight + 1;
    return {
      action: {left: action.left, right: action.right, top: action.top, bottom: action.bottom},
      dialog: {left, right, top, bottom, scrollTop: dialog.scrollTop, clientWidth: dialog.clientWidth, clientHeight: dialog.clientHeight},
      withinDialog, withinViewport,
    };
  });
}

function isAtlasStartupPayload(url) {
  const path = new URL(url).pathname;
  return /(?:^|\/)atlas(?:\.html)?$/.test(path) || /(?:^|\/)atlas\//.test(path) ||
    /(?:^|\/)atlas(?:_[^/]+)?\.js$/.test(path);
}

async function assertAtlasState(page, link, preview) {
  const openedUrl = new URL(page.url());
  assert.equal(openedUrl.searchParams.get('lesson'), link.params.get('lesson'), `${preview.lesson} clicked Explore link keeps its lesson`);
  assert.equal(openedUrl.searchParams.get('step'), link.params.get('step'), `${preview.lesson} clicked Explore link keeps its step`);
  assert.equal(openedUrl.searchParams.get('phase'), link.params.get('phase'), `${preview.lesson} clicked Explore link keeps its phase`);
  assert.equal(openedUrl.searchParams.get('hemi'), link.params.get('hemi'), `${preview.lesson} clicked Explore link keeps its hemisphere`);
  const testUrl = new URL(openedUrl.href);
  testUrl.searchParams.set('test', '1');
  await page.goto(testUrl.href, {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => window.__atlasTest?.ready, {timeout: 45000});
  const state = await page.evaluate(() => window.__atlasTest);
  assert.equal(state.lesson.lessonId, link.params.get('lesson'), `${preview.lesson} atlas lesson state`);
  assert.equal(state.lesson.step, Number(link.params.get('step')), `${preview.lesson} atlas step follows markup`);
  assert.equal(state.learningPhase, link.params.get('phase'), `${preview.lesson} atlas phase follows markup`);
  assert.equal(state.hemisphere, link.params.get('hemi'), `${preview.lesson} atlas hemisphere follows markup`);
  assert.equal(await page.locator('#lessonCurrentTitle').innerText(), preview.lessonHeading, `${preview.lesson} expected lesson heading`);
}

let browser;
try {
  browser = await chromium.launch({headless: true});
  const context = await browser.newContext({viewport: {width: 1440, height: 900}, reducedMotion: 'reduce'});
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  recordErrors(page, 'landing');
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto(landing, {waitUntil: 'networkidle'});

  assert.equal(await page.locator('dialog.lesson-preview').count(), previews.length, 'three lesson preview dialogs');
  assert.equal(await page.locator('a[data-preview-target]').count(), previews.length, 'three preview-enabled lesson cards');
  const startupAtlasPayloads = requests.filter(isAtlasStartupPayload);
  assert.deepEqual(startupAtlasPayloads, [], 'landing does not load atlas routes or atlas payloads before an Explore click');

  for (const [index, preview] of previews.entries()) {
    const opener = page.locator(`a[data-preview-target="${preview.dialog}"]`);
    const dialog = page.locator(`dialog#${preview.dialog}`);
    const image = dialog.locator('[data-preview-image]');
    assert.equal(await opener.count(), 1, `${preview.lesson} has one preview opener`);
    assert.equal(await dialog.count(), 1, `${preview.lesson} has its matching dialog`);
    assert.equal(await image.count(), 1, `${preview.lesson} has one lazy preview image`);
    assert.equal(await opener.getAttribute('aria-haspopup'), 'dialog', `${preview.lesson} announces its dialog`);
    assert.equal(await opener.getAttribute('aria-controls'), preview.dialog, `${preview.lesson} controls its dialog`);
    assert.equal(await opener.locator('.lesson-preview-cue').evaluate(node => node.hidden), false, `${preview.lesson} reveals its enhancement cue`);
    assert.equal(await image.getAttribute('src'), null, `${preview.lesson} image is not loaded before opening`);
    const imageSource = await image.getAttribute('data-src');
    assert(imageSource, `${preview.lesson} image has data-src`);
    assert(!requests.includes(new URL(imageSource, landing).href), `${preview.lesson} image was not requested before opening`);

    const labelledBy = await dialog.getAttribute('aria-labelledby');
    assert(labelledBy, `${preview.lesson} dialog names its title`);
    assert.equal(await page.locator(`#${labelledBy}`).innerText(), preview.previewHeading, `${preview.lesson} dialog heading`);
    const explore = dialog.locator('a.preview-explore');
    assert.equal(await explore.count(), 1, `${preview.lesson} has an Explore link`);
    const link = stateFromLink(await explore.getAttribute('href'), preview.lesson);

    await opener.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 56));
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await opener.focus();
    await opener.dispatchEvent('click', {button: 0, metaKey: true});
    assert.equal(await dialog.evaluate(node => node.open), false, `${preview.lesson} modifier click keeps its link behaviour`);
    await opener.click();
    await dialog.waitFor({state: 'visible'});
    assert.equal(await dialog.evaluate(node => node.open), true, `${preview.lesson} opens natively`);
    assert(await page.locator('html').evaluate(node => node.classList.contains('has-lesson-preview')), `${preview.lesson} locks page scrolling`);
    assert.equal(await image.getAttribute('src'), imageSource, `${preview.lesson} image starts loading only after opening`);
    await image.evaluate(node => node.decode());
    await page.locator(`#${labelledBy}`).click();
    assert.equal(await dialog.evaluate(node => node.open), true, `${preview.lesson} inner content does not close the dialog`);
    await dialog.locator('[data-preview-close]').focus();
    for (const key of ['Shift+Tab', 'Tab', 'Tab', 'Tab', 'Tab', 'Tab']) {
      await page.keyboard.press(key);
      assert(await page.evaluate(id => document.getElementById(id).contains(document.activeElement), preview.dialog), `${preview.lesson} ${key} remains inside the native dialog`);
    }
    await page.screenshot({path: `${out}/desktop-${preview.lesson}.png`});

    if (index === 0) await dialog.locator('[data-preview-close]').click();
    else if (index === 1) await page.keyboard.press('Escape');
    else {
      const bounds = await dialog.boundingBox();
      assert(bounds, `${preview.lesson} dialog bounds are available`);
      const point = outsidePoint(bounds, 1440, 900);
      assert(point, `${preview.lesson} has a clickable backdrop`);
      await page.mouse.click(...point);
    }
    await dialog.waitFor({state: 'hidden'});
    await page.waitForTimeout(32);
    assert.equal(await page.evaluate(id => document.activeElement === document.querySelector(`a[data-preview-target="${id}"]`), preview.dialog), true, `${preview.lesson} restores focus to its opener`);
    assert(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore) <= 1, `${preview.lesson} restores the user scroll position`);
    assert(!await page.locator('html').evaluate(node => node.classList.contains('has-lesson-preview')), `${preview.lesson} releases scroll locking`);

    await opener.click();
    await dialog.waitFor({state: 'visible'});
    await Promise.all([
      page.waitForURL(url => url.pathname === link.target.pathname && url.searchParams.get('lesson') === preview.lesson),
      explore.click(),
    ]);
    await assertAtlasState(page, link, preview);
    report.previews.push({lesson: preview.lesson, href: link.target.href, step: Number(link.params.get('step')), heading: preview.lessonHeading});
    await page.goto(landing, {waitUntil: 'networkidle'});
  }

  await page.setViewportSize({width: 390, height: 844});
  await page.goto(landing, {waitUntil: 'networkidle'});
  for (const preview of previews) {
    const opener = page.locator(`a[data-preview-target="${preview.dialog}"]`);
    const dialog = page.locator(`dialog#${preview.dialog}`);
    const image = dialog.locator('[data-preview-image]');
    const explore = dialog.locator('a.preview-explore');
    await opener.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 40));
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await opener.click();
    await dialog.waitFor({state: 'visible'});
    await image.evaluate(node => node.decode());
    const link = stateFromLink(await explore.getAttribute('href'), preview.lesson);
    const layout = await dialog.evaluate(node => {
      const rect = node.getBoundingClientRect();
      return {
        left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
        dialogOverflow: node.scrollWidth > node.clientWidth + 1,
        pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        width: innerWidth, height: innerHeight,
      };
    });
    assert(layout.left >= -1 && layout.right <= layout.width + 1 && layout.top >= -1 && layout.bottom <= layout.height + 1, `${preview.lesson} mobile dialog fits the viewport`);
    assert(!layout.dialogOverflow && !layout.pageOverflow, `${preview.lesson} mobile dialog has no horizontal overflow`);
    await page.screenshot({path: `${out}/mobile-${preview.lesson}-initial.png`});
    const action = await mobileActionBounds(explore);
    assert(action.withinDialog, `${preview.lesson} mobile Explore control fully fits the dialog client viewport: ${JSON.stringify(action)}`);
    assert(action.withinViewport, `${preview.lesson} mobile Explore control fully fits the phone viewport: ${JSON.stringify(action)}`);
    await page.screenshot({path: `${out}/mobile-${preview.lesson}-action.png`});
    await page.keyboard.press('Escape');
    await dialog.waitFor({state: 'hidden'});
    await page.waitForTimeout(32);
    assert(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore) <= 1, `${preview.lesson} restores mobile page scroll`);
    await opener.click();
    await dialog.waitFor({state: 'visible'});
    const clickAction = await mobileActionBounds(explore);
    assert(clickAction.withinDialog && clickAction.withinViewport, `${preview.lesson} mobile Explore control remains fully visible before activation: ${JSON.stringify(clickAction)}`);
    await Promise.all([
      page.waitForURL(url => url.pathname === link.target.pathname && url.searchParams.get('lesson') === preview.lesson),
      explore.click(),
    ]);
    await assertAtlasState(page, link, preview);
    report.mobile.push({lesson: preview.lesson, initial: layout, action});
    await page.goto(landing, {waitUntil: 'networkidle'});
  }
  await context.close();

  const noJs = await browser.newContext({javaScriptEnabled: false, viewport: {width: 1440, height: 900}});
  const noJsPage = await noJs.newPage();
  for (const preview of previews) {
    await noJsPage.goto(landing, {waitUntil: 'domcontentloaded'});
    const opener = noJsPage.locator(`a[data-preview-target="${preview.dialog}"]`);
    const href = await opener.getAttribute('href');
    const target = fallbackFromLink(href, preview.lesson);
    assert.equal(await opener.getAttribute('aria-haspopup'), null, `${preview.lesson} no-JS fallback does not announce an unavailable dialog`);
    assert.equal(await opener.locator('.lesson-preview-cue').evaluate(node => node.hidden), true, `${preview.lesson} no-JS fallback keeps its enhancement cue hidden`);
    await Promise.all([noJsPage.waitForURL(url => url.pathname === target.pathname && url.searchParams.get('lesson') === preview.lesson), opener.click()]);
    report.fallbacks.push({kind: 'javascript-disabled', lesson: preview.lesson, href: target.href});
  }
  await noJs.close();

  const unsupported = await browser.newContext({viewport: {width: 1440, height: 900}});
  await unsupported.addInitScript(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {value: undefined, configurable: true});
  });
  const unsupportedPage = await unsupported.newPage();
  recordErrors(unsupportedPage, 'showModal-fallback');
  await unsupportedPage.goto(landing, {waitUntil: 'networkidle'});
  const unsupportedPreview = previews[0];
  const unsupportedOpener = unsupportedPage.locator(`a[data-preview-target="${unsupportedPreview.dialog}"]`);
  const unsupportedLink = fallbackFromLink(await unsupportedOpener.getAttribute('href'), unsupportedPreview.lesson);
  assert.equal(await unsupportedOpener.getAttribute('aria-haspopup'), null, 'showModal fallback does not announce an unavailable dialog');
  assert.equal(await unsupportedOpener.locator('.lesson-preview-cue').evaluate(node => node.hidden), true, 'showModal fallback keeps its enhancement cue hidden');
  await Promise.all([
    unsupportedPage.waitForURL(url => url.pathname === unsupportedLink.pathname && url.searchParams.get('lesson') === unsupportedPreview.lesson),
    unsupportedOpener.click(),
  ]);
  report.fallbacks.push({kind: 'showModal-unavailable', lesson: unsupportedPreview.lesson, href: unsupportedLink.href});
  await unsupported.close();

  assert.deepEqual(report.errors, [], 'no JavaScript errors');
} catch (error) {
  report.failure = error.stack || String(error);
  throw error;
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2) + '\n');
  if (browser) await browser.close();
}

console.log(`PASS: ${report.previews.length} lesson previews, ${report.mobile.length} mobile dialogs, ${report.fallbacks.length} navigation fallbacks`);
