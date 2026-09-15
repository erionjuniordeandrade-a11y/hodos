import {mkdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const LESSONS = ['evidence-classes', 'sampling-support', 'motor-cst', 'fat-language', 'optic-radiation', 'interoception', 'attention-networks', 'language-networks', 'default-mode-network', 'salience-network','corpus-callosum','internal-capsule','ventral-stream','brainstem-corridors'];
const WIDTHS = [320, 375, 414, 768, 1024, 1440];
const base = process.argv.find(v => v.startsWith('--url='))?.slice(6);
if (!base) throw new Error('Pass --url=');
const out = process.argv.find(v => v.startsWith('--out='))?.slice(6) || 'output/landing-gate';
await mkdir(out, {recursive: true});
const target = new URL('/', base).href;

function initMetrics() {
  window.__cls = 0;
  window.__lcp = null;
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
  }).observe({type: 'layout-shift', buffered: true});
  new PerformanceObserver(list => {
    const e = list.getEntries().at(-1);
    if (!e) return;
    const el = e.element;
    window.__lcp = {
      time: e.startTime,
      tag: el ? el.tagName.toLowerCase() : null,
      selector: el ? `${el.closest('[data-hero]') ? '[data-hero] ' : ''}${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.classList[0] ? '.' + el.classList[0] : ''}` : null,
      inHero: !!(el && el.closest('[data-hero]')),
    };
  }).observe({type: 'largest-contentful-paint', buffered: true});
}

async function transferSize(response) {
  const cl = response.headers()['content-length'];
  const n = Number(cl);
  if (cl != null && cl !== '' && Number.isFinite(n)) return n;
  try { return (await response.body()).length; } catch { return 0; }
}

async function audit(page, width) {
  return page.evaluate(async ({LESSONS, width}) => {
    const fails = [];
    const q = (s, r = document) => r.querySelector(s);
    const qa = (s, r = document) => [...r.querySelectorAll(s)];
    const sel = el => el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.classList?.length ? '.' + [...el.classList].slice(0, 2).join('.') : ''}` : '?';
    const cls = window.__cls, lcp = window.__lcp, doc = document.documentElement;
    let overflow = null;
    if (doc.scrollWidth > doc.clientWidth) {
      let widest = null, maxR = -Infinity;
      for (const el of qa('*')) {
        const r = el.getBoundingClientRect().right;
        if (r > maxR) { maxR = r; widest = el; }
      }
      overflow = {scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, widest: sel(widest), right: maxR};
      fails.push(`horizontal overflow at ${width}px: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth} widest=${overflow.widest} right=${overflow.right}`);
    }
    for (const a of qa('a.cta, nav a, footer a, [data-lessons] a')) {
      const cs = getComputedStyle(a);
      const fs = parseFloat(cs.fontSize) || 16;
      const lh = Number.isFinite(parseFloat(cs.lineHeight)) ? parseFloat(cs.lineHeight) : fs * 1.6;
      const label = a.querySelector('.lesson-name') || a;
      const range = document.createRange(); range.selectNodeContents(label);
      const textH = range.getBoundingClientRect().height;
      if (textH > 1.6 * Math.max(lh, fs)) {
        fails.push(`two-line clickable: ${a.getAttribute('href')} textH=${Math.round(textH)} lh=${lh}`);
      }
    }
    const hero = q('[data-hero]');
    const heroImgs = hero ? qa('img', hero) : [];
    const heroImg = heroImgs[0];
    if (!hero) fails.push('missing [data-hero]');
    else {
      if (heroImgs.length !== 1) fails.push(`[data-hero] img count ${heroImgs.length} != 1`);
      if (heroImg && !heroImg.closest('picture')) fails.push('hero img not inside <picture>');
      if (heroImg && (heroImg.getAttribute('fetchpriority') || '').toLowerCase() !== 'high') fails.push('hero img missing fetchpriority=high');
      if (heroImg && (!heroImg.hasAttribute('width') || !heroImg.hasAttribute('height'))) fails.push('hero img missing width/height');
      if (!q('[data-hero-scrim]', hero)) fails.push('missing [data-hero-scrim]');
      const h1 = q('h1', hero);
      if (!h1) fails.push('missing [data-hero] h1');
      else {
        const r = h1.getBoundingClientRect();
        if (!(r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth)) {
          fails.push(`hero h1 not fully in first viewport box=(${r.top.toFixed(1)},${r.left.toFixed(1)},${r.bottom.toFixed(1)},${r.right.toFixed(1)}) vp=${innerWidth}x${innerHeight}`);
        }
      }
      const n = qa('a.cta.cta-primary', hero).length;
      if (n !== 1) fails.push(`[data-hero] a.cta.cta-primary count ${n} != 1`);
    }
    const fam = q('[data-families]');
    if (!fam) fails.push('missing [data-families]');
    else {
      const kids = [...fam.children];
      if (kids.length !== 4) fails.push(`[data-families] children ${kids.length} != 4`);
      kids.forEach((k, i) => { const n = qa('img', k).length; if (n !== 1) fails.push(`[data-families] child ${i} img count ${n} != 1`); });
    }
    const lessonsRoot = q('[data-lessons]');
    if (!lessonsRoot) fails.push('missing [data-lessons]');
    else {
      const ids = [];
      for (const a of qa('a', lessonsRoot)) {
        try {
          const u = new URL(a.getAttribute('href') || '', location.href);
          const leaf = u.pathname.replace(/\/+$/, '').split('/').pop();
          const id = u.searchParams.get('lesson');
          if ((leaf !== 'atlas' && leaf !== 'atlas.html') || !id) fails.push(`lesson href not /atlas?lesson=: ${a.getAttribute('href')}`);
          else ids.push(id);
        } catch { fails.push(`bad lesson href ${a.getAttribute('href')}`); }
      }
      const set = new Set(ids);
      if (ids.length !== 14) fails.push(`[data-lessons] a count ${ids.length} != 10`);
      for (const id of LESSONS) if (!set.has(id)) fails.push(`missing lesson ${id}`);
      for (const id of set) if (!LESSONS.includes(id)) fails.push(`unknown lesson ${id}`);
      if (ids.length !== set.size) fails.push('duplicate lesson ids');
    }
    const demo = q('[data-demo]');
    if (!demo) fails.push('missing [data-demo]');
    else if (qa('img', demo).length !== 1) fails.push(`[data-demo] img count ${qa('img', demo).length} != 1`);
    const cas = q('[data-case]');
    if (!cas) fails.push('missing [data-case]');
    else if (qa('img', cas).length !== 1) fails.push(`[data-case] img count ${qa('img', cas).length} != 1`);
    if (!q('footer.source-footer')) fails.push('missing footer.source-footer');
    if (!q('header .brand')) fails.push('missing header .brand');
    const scrim = hero ? q('[data-hero-scrim]', hero) : null;
    const scrimReport = {exists: !!scrim};
    if (scrim && hero) {
      const a = scrim.getBoundingClientRect(), b = hero.getBoundingClientRect();
      const spans = Math.abs(a.top - b.top) <= 2 && Math.abs(a.left - b.left) <= 2 && Math.abs(a.right - b.right) <= 2 && Math.abs(a.bottom - b.bottom) <= 2;
      const cs = getComputedStyle(scrim);
      const bg = cs.backgroundImage || '', color = cs.backgroundColor || '';
      const m = color.match(/rgba?\(([^)]+)\)/);
      let alpha = 1;
      if (m) { const p = m[1].split(',').map(x => parseFloat(x)); alpha = p.length >= 4 ? p[3] : 1; }
      const overlay = /linear-gradient/i.test(bg) || alpha > 0;
      Object.assign(scrimReport, {spansHero: spans, backgroundImage: bg.slice(0, 160), backgroundColor: color, alpha, overlay});
      if (!spans) fails.push('scrim does not span [data-hero] within 2px');
      if (!overlay) fails.push('scrim has no linear-gradient or alpha>0 background-color');
    }
    for (const img of qa('img')) {
      img.scrollIntoView({block: 'nearest'});
      try { await Promise.race([img.decode(), new Promise(r => setTimeout(r, 4000))]); } catch {}
    }
    let high = 0;
    for (const img of qa('img')) {
      const src = img.getAttribute('src') || img.currentSrc || '';
      const inHero = !!img.closest('[data-hero]');
      if (!img.hasAttribute('width') || !img.hasAttribute('height')) fails.push(`img missing width/height: ${src}`);
      if (!img.hasAttribute('alt')) fails.push(`img missing alt: ${src}`);
      if (!img.complete || img.naturalWidth <= 0) fails.push(`img not decoded: ${src}`);
      if (!inHero && img.getAttribute('loading') !== 'lazy') fails.push(`img missing loading=lazy: ${src}`);
      if ((img.getAttribute('fetchpriority') || '').toLowerCase() === 'high') {
        high++;
        if (!inHero) fails.push(`non-hero fetchpriority=high: ${src}`);
      }
    }
    if (high !== 1) fails.push(`fetchpriority=high count ${high} != 1`);
    if (cls > 0.05) fails.push(`CLS ${cls} > 0.05`);
    if (width >= 768 && !lcp?.inHero) fails.push(`LCP not in [data-hero]: ${JSON.stringify(lcp)}`);
    return {fails, overflow, cls, lcp, scrim: scrimReport};
  }, {LESSONS, width});
}

const summary = {url: target, out, ok: true, widths: []};
let browser;
try {
  browser = await chromium.launch({headless: true});
  for (const width of WIDTHS) {
    const height = width <= 414 ? 844 : 900;
    const row = {width, height, fails: [], bytes: 0, bytesByType: {}, consoleErrors: [], pageErrors: [], overflow: null, cls: null, lcp: null, scrim: null, reducedMotion: null};
    const context = await browser.newContext({viewport: {width, height}, deviceScaleFactor: 1});
    const page = await context.newPage();
    page.setDefaultTimeout(25000);
    try {
      const pending = [];
      let counting = true;
      page.on('console', m => { if (m.type() === 'error') row.consoleErrors.push(m.text()); });
      page.on('pageerror', e => row.pageErrors.push(e.message));
      page.on('response', r => {
        if (!counting) return;
        pending.push(transferSize(r).then(n => {
          const t = r.request().resourceType();
          row.bytesByType[t] = (row.bytesByType[t] || 0) + n;
          row.bytes += n;
        }).catch(() => {}));
      });
      await page.addInitScript(initMetrics);
      try { await page.goto(target, {waitUntil: 'networkidle'}); }
      catch (e) { row.fails.push(`navigation: ${e.message}`); }
      await page.waitForTimeout(3000);
      counting = false;
      await Promise.all(pending);
      // The hero loop is progressive media fetched after first paint; it has its own budget.
      const mediaBytes = row.bytesByType.media || 0;
      const pageBytes = row.bytes - mediaBytes;
      row.pageBytes = pageBytes; row.mediaBytes = mediaBytes;
      if (width === 375 && pageBytes > 1.1 * 1024 * 1024) row.fails.push(`page bytes ${pageBytes} exceed 1.1 MB at 375`);
      if (width === 1440 && pageBytes > 2 * 1024 * 1024) row.fails.push(`page bytes ${pageBytes} exceed 2.0 MB at 1440`);
      if (width <= 700 && mediaBytes > 1.3 * 1024 * 1024) row.fails.push(`media bytes ${mediaBytes} exceed 1.3 MB at ${width}`);
      if (width > 700 && mediaBytes > 3.6 * 1024 * 1024) row.fails.push(`media bytes ${mediaBytes} exceed 3.6 MB at ${width}`);
      await page.screenshot({path: `${out}/${width}-viewport.png`});
      const got = await audit(page, width);
      row.fails.push(...got.fails);
      row.overflow = got.overflow;
      row.cls = got.cls;
      row.lcp = got.lcp;
      row.scrim = got.scrim;
      await page.screenshot({path: `${out}/${width}-full.png`, fullPage: true});
      await page.emulateMedia({reducedMotion: 'reduce'});
      try { await page.reload({waitUntil: 'networkidle'}); }
      catch (e) { row.fails.push(`reduced-motion reload: ${e.message}`); }
      const n = await page.evaluate(() => document.getAnimations().length);
      row.reducedMotion = {animations: n};
      if (n !== 0) row.fails.push(`reduced-motion: ${n} running animation(s)`);
    } catch (e) {
      row.fails.push(`crash: ${e.message}`);
    }
    if (row.consoleErrors.length) row.fails.push(`console errors (${row.consoleErrors.length}): ${row.consoleErrors.slice(0, 5).join(' | ')}`);
    if (row.pageErrors.length) row.fails.push(`page errors (${row.pageErrors.length}): ${row.pageErrors.slice(0, 5).join(' | ')}`);
    row.ok = row.fails.length === 0;
    if (!row.ok) summary.ok = false;
    summary.widths.push(row);
    console.error(`${width}x${height}: ${row.fails.length} fail(s), ${row.bytes} B`);
    await context.close();
  }
} catch (e) {
  summary.ok = false;
  const msg = String(e.message || e);
  summary.crash = msg.split('\n')[0] + (/\bSIGSEGV\b/.test(msg) ? ' (SIGSEGV)' : '');
} finally {
  await writeFile(`${out}/summary.json`, JSON.stringify(summary, null, 2) + '\n');
  if (browser) await browser.close().catch(() => {});
}
console.log(JSON.stringify(summary, null, 2));
if (!summary.ok) process.exit(1);
