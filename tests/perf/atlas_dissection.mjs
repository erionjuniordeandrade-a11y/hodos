import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {LESSONS} from '../../viewer/lesson_content.js';
import {TEACHING_GUIDES} from '../../viewer/lesson_briefings.js';

const base=process.argv.find(v=>v.startsWith('--url='))?.slice(6);
if(!base)throw Error('Pass the isolated atlas --url');
const out=process.argv.find(v=>v.startsWith('--out='))?.slice(6)||'output/dissection-20260911/browser';
await mkdir(out,{recursive:true});
const plates=[['language-networks',1,'lateral-association'],['language-networks',2,'ifof'],
  ['language-networks',3,'uncinate'],['optic-radiation',0,'optic-radiation'],['optic-radiation',1,'temporal-horn']];
const report={plates:[],layouts:[],questions:[],errors:[],requests:[],external:[]};
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('requestfailed',r=>report.requests.push(r.url()));
  page.on('request',r=>{if(new URL(r.url()).origin!==new URL(base).origin)report.external.push(r.url());});
  const visit=async(lesson,step,phase='compare')=>{
    await page.goto(`${base}/atlas.html?test=1&lesson=${lesson}&step=${step}&phase=${phase}`);
    await page.waitForFunction(()=>window.__atlasTest?.ready);
  };
  const scene=()=>page.evaluate(()=>({camera:window.__atlasTest.camera,bundles:window.__atlasTest.bundles,side:window.__atlasTest.hemisphere}));
  for(const [lesson,step,id] of plates){
    await visit(lesson,step,'orient');assert.equal(await page.locator('[data-dissection]').count(),0);
    const images=[];const capture=r=>{if(r.url().includes('/reference-plates/'))images.push(r.url());};page.on('request',capture);
    await page.locator('#phase-compare').click();
    const figure=page.locator(`[data-dissection="${id}"]`);await figure.scrollIntoViewIfNeeded();
    const photo=figure.locator('img').first();await photo.evaluate(img=>img.decode());
    assert.equal(await figure.count(),1);assert.match(await figure.innerText(),/K\. Yagmurlu/);
    assert.match(await figure.innerText(),/AANS.*NREF/);
    assert.match(await figure.innerText(),/anterior.*left/i);
    const before=await scene();const open=figure.locator('.dissection-open');await open.click();
    const dialog=page.locator('dialog[open]');assert.equal(await dialog.count(),1);
    assert.equal(await dialog.getAttribute('aria-labelledby'),'dissectionDialogTitle');
    await dialog.locator('img').evaluate(img=>img.decode());
    assert.match(await dialog.innerText(),/AANS.*NREF/);
    await page.screenshot({path:`${out}/${id}-expanded.png`});
    await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
    assert(await open.evaluate(el=>el===document.activeElement));assert.deepEqual(await scene(),before);
    await open.press('Enter');await page.locator('#dissectionClose').click();
    assert(await open.evaluate(el=>el===document.activeElement));
    assert.deepEqual(await scene(),before);
    await page.locator('#phase-explain').click();assert.equal(await page.locator('[data-dissection]').count(),0);
    assert.equal(await page.locator('dialog').count(),0);
    page.off('request',capture);assert(images.length>0);assert(images.every(url=>url.endsWith(`/${id}.png`)));
    report.plates.push({lesson,step,id,requests:[...new Set(images)]});
  }
  for(const [width,height] of [[1440,900],[1157,601],[851,900],[390,844],[320,700]]){
    await page.setViewportSize({width,height});await visit('optic-radiation',1);
    const figure=page.locator('[data-dissection]');await figure.locator('.dissection-open').evaluate(el=>el.scrollIntoView({block:'start'}));
    await figure.locator('img').first().evaluate(img=>img.decode());
    if(width<=760){const visible=await figure.locator('img').first().evaluate(el=>el.getBoundingClientRect().top>=document.querySelector('.atlas-stage').getBoundingClientRect().bottom);assert(visible,'Reference photograph clears the sticky atlas');}
    await page.screenshot({path:`${out}/compare-${width}.png`});
    await figure.locator('.dissection-open').click();
    const bounds=await page.locator('dialog[open]').evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,overflow:el.scrollWidth>el.clientWidth+1};});
    assert(bounds.left>=0&&bounds.right<=width+1&&bounds.top>=0&&bounds.bottom<=height+1);assert(!bounds.overflow);
    assert(await page.locator('#dissectionClose').isVisible());
    await page.screenshot({path:`${out}/expanded-${width}.png`});
    await page.keyboard.press('Escape');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    report.layouts.push({width,height,bounds});
  }
  await page.setViewportSize({width:1440,height:900});await visit('language-networks',1);
  await page.locator('#lessonProfile').selectOption('presenter');
  await page.locator('.dissection-open').scrollIntoViewIfNeeded();await page.locator('.dissection-open').click();
  await page.screenshot({path:`${out}/presenter-expanded.png`});await page.keyboard.press('Tab');
  assert(await page.evaluate(()=>document.activeElement.closest('dialog')!==null));
  await page.keyboard.press('Escape');await page.locator('#lessonProfile').selectOption('teaching');
  for(const id of ['fat-language','language-networks','attention-networks','interoception']){
    const lesson=LESSONS.find(l=>l.id===id),step=lesson.steps.at(-1);await visit(id,lesson.steps.length-1,'explain');
    assert.equal(await page.locator('.lesson-check>p').innerText(),step.question);
    await page.locator('#lessonAnswer summary').click();assert.equal(await page.locator('#lessonAnswer>p').innerText(),step.answer);
    await page.screenshot({path:`${out}/question-${id}.png`});
    await page.locator('#lessonNext').click();assert.equal(await page.locator('.lesson-check>p').innerText(),TEACHING_GUIDES[id].question);
    await page.locator('#lessonAnswer summary').click();assert.equal(await page.locator('#lessonAnswer>p').innerText(),step.answer);
    report.questions.push(id);
  }
  await page.goto(`${base}/atlas-sources.html`);assert.match(await page.locator('#dissection-references').innerText(),/AANS.*NREF/);
  const receipt=await page.request.get(`${base}/reference-plates/manifest.json`);assert.equal(receipt.status(),200);
  assert.equal((await receipt.json()).plates.length,5);
  await visit('motor-cst',0);assert.equal(await page.locator('[data-dissection]').count(),0);
  await page.route('**/reference-plates/uncinate.png',r=>r.fulfill({status:404,body:'Missing fixture'}));
  await visit('language-networks',3);await page.locator('[data-dissection]').scrollIntoViewIfNeeded();
  await page.locator('.dissection-status').waitFor({state:'visible'});
  assert(await page.locator('.dissection-open').isDisabled());
  await page.locator('#phase-explain').click();await page.locator('#lessonAnswer summary').click();
  assert(await page.locator('#lessonAnswer p').isVisible());
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.requests,[]);assert.deepEqual(report.external,[]);
  await context.close();
}finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');}
console.log(`PASS: ${report.plates.length} references, ${report.layouts.length} layouts, keyboard/focus, phase isolation, unchanged scenes, missing-image recovery`);
