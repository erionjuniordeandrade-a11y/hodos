import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium,request} from 'playwright';
import {LESSONS,CONTENT_VERSION} from '../../viewer/lesson_content.js';

const base=process.argv.find(v=>v.startsWith('--url='))?.slice(6);
assert(base,'Pass --url for the built or published Hodos site');
const out=process.argv.find(v=>v.startsWith('--out='))?.slice(6)||'output/hodos-publication-20260911/site';
const releasePath=process.argv.find(v=>v.startsWith('--release='))?.slice(10)||'dist/hodos/release.json';
const expected=JSON.parse(await readFile(releasePath,'utf8'));
await mkdir(out,{recursive:true});
const report={url:base,version:CONTENT_VERSION,assets:[],lessons:[],layouts:[],errors:[],failedRequests:[],externalRequests:[],checks:[]};
const http=await request.newContext({baseURL:base,timeout:30000});
const browser=await chromium.launch({headless:true});
try{
  const release=await http.get('/release.json');
  assert.equal(release.status(),200);
  assert.deepEqual(await release.json(),expected,'Published release must match the reviewed local build');
  const assets=expected.files.filter(f=>f.path!=='_headers');
  for(let start=0;start<assets.length;start+=6){
    await Promise.all(assets.slice(start,start+6).map(async asset=>{
      const response=await http.get(`/${asset.path}`);
      assert.equal(response.status(),200,asset.path);
      const bytes=await response.body();
      assert.equal(bytes.length,asset.bytes,`${asset.path}: byte count`);
      assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,`${asset.path}: SHA-256`);
      report.assets.push(asset.path);
    }));
  }
  report.assets.sort();
  for(const pathname of ['/data.json','/app.js','/api/preflight','/cases/','/handoff/','/.git/config']){
    const response=await http.get(pathname);
    assert.equal(response.status(),404,`Unpublished path must return 404: ${pathname}`);
  }
  report.checks.push('Exact release bytes and all public assets verified; nonpublic routes return 404');
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('requestfailed',r=>report.failedRequests.push(r.url()));
  page.on('request',r=>{const url=new URL(r.url());if(url.protocol.startsWith('http')&&url.origin!==new URL(base).origin)report.externalRequests.push(r.url());});
  // Landing page at the site root: loaded anatomy plate and exactly one deep link per lesson.
  await page.goto(new URL('/',base).href);
  assert.equal(await page.title(),'Hodos · Neuroanatomy coursebook for residents');
  assert.equal(await page.locator('[data-hero] img').count(),1);
  await page.waitForFunction(()=>{
    const img=document.querySelector('[data-hero] img');
    return img?.complete&&img.naturalWidth>0;
  });
  assert.equal(await page.locator('#open').getAttribute('href'),'./atlas?lesson=motor-cst');
  const lessonLinks=await page.locator('[data-lessons] a').evaluateAll(links=>links.map(a=>new URL(a.href).searchParams.get('lesson')));
  assert.deepEqual([...lessonLinks].sort(),[...LESSONS].map(lesson=>lesson.id).sort(),'Landing links one lesson each; display order is the landing\'s own');
  assert.equal(new Set(await page.locator('a[href*="?lesson="]').evaluateAll(as=>as.map(a=>a.getAttribute('href')))).size,10);
  assert.match(await page.locator('.creator-credit').innerText(),/Created by Dr\. Erion de Andrade/);
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    await page.setViewportSize(viewport);
    await page.evaluate(()=>document.fonts.ready);
    // Scroll each lazy frame into view before making a full-page review artifact.
    for(const img of await page.locator('main img').all()){
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(el=>el.decode());
    }
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`${out}/hodos-landing-${viewport.width}-viewport.png`});
    await page.screenshot({path:`${out}/hodos-landing-${viewport.width}.png`,fullPage:true});
  }
  report.landingLayouts=[];
  for(const width of [320,375,414,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    const layout=await page.evaluate(()=>({
      width:document.documentElement.clientWidth,
      scrollWidth:document.documentElement.scrollWidth,
      wrappedLinks:[...document.querySelectorAll('a.cta,nav a,footer a')]
        .filter(a=>a.getClientRects().length>1).map(a=>a.textContent.trim()),
      wrappedText:[...document.querySelectorAll('a.cta,nav a,footer a')].filter(a=>{
        const range=document.createRange();range.selectNodeContents(a);
        return new Set([...range.getClientRects()].filter(r=>r.width&&r.height).map(r=>Math.round(r.top))).size>1;
      }).map(a=>a.textContent.trim()),
    }));
    assert(layout.scrollWidth<=layout.width,`Landing horizontal overflow at ${width}`);
    assert.deepEqual(layout.wrappedLinks,[],`Fragmented clickable links at ${width}`);
    assert.deepEqual(layout.wrappedText,[],`Wrapped clickable text at ${width}`);
    report.landingLayouts.push(layout);
  }
  await page.setViewportSize({width:1440,height:900});
  report.checks.push('Landing page at / with a loaded hero plate, ten lesson links, loaded lazy frames, desktop/phone screenshots and six overflow/wrap checks');
  await page.goto(new URL('/atlas?test=1',base).href);
  await page.waitForFunction(()=>window.__atlasTest?.ready,null,{timeout:45000});
  assert.equal(await page.title(),'Hodos · The atlas and lessons');
  assert.equal(await page.locator('.curriculum-row').count(),LESSONS.length);
  assert(await page.locator('canvas').isVisible());
  const creator=page.locator('.creator-credit');
  assert.match(await creator.innerText(),/Created by Dr\. Erion de Andrade/);
  assert.equal(await creator.locator('a').getAttribute('href'),'https://www.dreriondeandrade.com.br/');
  assert.equal(await page.getByRole('link',{name:'Case reconstruction',exact:true}).count(),0);
  for(const lesson of LESSONS){
    await page.locator(`#lessonStart-${lesson.id}`).click();
    assert(await page.locator('.lesson-case').isVisible());
    await page.locator('#lessonNext').click();
    assert.equal(await page.evaluate(()=>window.__atlasTest.learningPhase),'orient');
    assert.equal(await page.locator('#lessonCurrentTitle').innerText(),lesson.steps[0].title);
    await page.locator('#lessonNext').click();
    assert.equal(await page.evaluate(()=>window.__atlasTest.learningPhase),'compare');
    await page.locator('#lessonNext').click();
    assert.equal(await page.evaluate(()=>window.__atlasTest.learningPhase),'explain');
    await page.locator('#lessonAnswer>summary').click();
    assert.equal(await page.locator('#lessonAnswer>p').innerText(),lesson.steps[0].answer);
    report.lessons.push(lesson.id);
    await page.locator('#learnHome').click();
  }
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    await page.setViewportSize(viewport);
    await page.evaluate(()=>document.fonts.ready);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
    await creator.scrollIntoViewIfNeeded();
    assert(await creator.isVisible());
    await page.screenshot({path:`${out}/hodos-${viewport.width}.png`,fullPage:true});
    report.layouts.push(viewport);
  }
  await page.setViewportSize({width:1440,height:900});
  await page.goto(new URL('/atlas-sources.html',base).href);
  assert.match(await page.locator('.creator-credit').innerText(),/neurosurgeon based in Porto Alegre/);
  assert.equal(await page.getByRole('link',{name:'Professional website'}).getAttribute('href'),'https://www.dreriondeandrade.com.br/');
  assert(await page.getByRole('link',{name:'Amy Sterling, human-brain'}).isVisible());
  assert.equal(await page.getByRole('link',{name:'Third-party notices and software licenses'}).getAttribute('href'),'./THIRD_PARTY_NOTICES.md');
  await page.screenshot({path:`${out}/sources.png`,fullPage:true});
  assert.deepEqual(report.errors,[]);
  assert.deepEqual(report.failedRequests,[]);
  assert.deepEqual(report.externalRequests,[]);
  report.checks.push('Root coursebook, 10 lesson openings and phases, creator profile, source attribution, desktop and phone layouts');
  console.log(JSON.stringify({url:base,assets:report.assets.length,lessons:report.lessons.length,layouts:report.layouts.length,errors:report.errors.length}));
}finally{
  await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');
  await browser.close();
  await http.dispose();
}
