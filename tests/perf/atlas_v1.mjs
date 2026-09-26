import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {LESSONS,CONTENT_VERSION,REGIONS,SOURCES,sourceIdsForStep} from '../../viewer/lesson_content.js';
import {resolveTeachingScene} from '../../viewer/anatomy_learning.js';
import {TEACHING_GUIDES} from '../../viewer/lesson_briefings.js';

const base=process.argv.find(v=>v.startsWith('--url='))?.slice(6);
if(!base)throw Error('Pass the isolated atlas --url');
const out=process.argv.find(v=>v.startsWith('--out='))?.slice(6)||'output/anatomy-v1-20260910/browser';
await mkdir(out,{recursive:true});
const report={version:CONTENT_VERSION,steps:[],checks:[],layouts:[],errors:[],requests:[],externalRequests:[]};
const browser=await chromium.launch({headless:true});
const sameCamera=(actual,expected,message='Camera changed')=>actual.forEach((value,index)=>assert(Math.abs(value-expected[index])<1e-7,message));
try{
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('requestfailed',r=>report.requests.push(r.url()));
  page.on('request',r=>{const url=new URL(r.url());if(url.pathname.startsWith('/api/'))report.requests.push(r.url());
    if(url.protocol.startsWith('http')&&url.origin!==new URL(base).origin)report.externalRequests.push(r.url());});
  const state=()=>page.evaluate(()=>window.__atlasTest);
  const ready=async()=>{
    try{await page.waitForFunction(()=>window.__atlasTest?.ready,null,{timeout:30000});}
    catch(error){report.loading=await page.locator('#atlasLoading').textContent();await page.screenshot({path:`${out}/load-failure.png`});throw error;}
  };
  const visit=async query=>{await page.goto(new URL(`atlas.html?test=1&${query}`,base).href);await ready();};
  const choose=async id=>{if(await page.locator('#lessonSelect').count())await page.locator('#lessonSelect').selectOption(id);else await page.locator(`#lessonStart-${id}`).click();};
  const jump=async index=>{await page.locator('.lesson-outline>summary').click();await page.locator(`#lessonStep-${index}`).click();};
  const checkLabels=async()=>{
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const layout=await page.evaluate(()=>{
      const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
      return {canvas:rect(document.querySelector('canvas')),labels:[...document.querySelectorAll('.atlas-parcel-label')].map(e=>({...rect(e),text:e.textContent})),axis:rect(document.querySelector('.atlas-orientation'))};
    });
    const overlaps=(a,b)=>a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5;
    for(const [i,a] of layout.labels.entries()){
      assert(a.left>=layout.canvas.left&&a.right<=layout.canvas.right+1&&a.top>=layout.canvas.top&&a.bottom<=layout.canvas.bottom+1,`label clipped: ${a.text}`);
      for(const b of layout.labels.slice(i+1))assert(!overlaps(a,b),`labels overlap: ${a.text} / ${b.text}`);
      assert(!overlaps(a,layout.axis),`label overlaps orientation: ${a.text}`);
    }
  };
  await visit('');assert.equal((await state()).lesson.status,'inactive');
  assert.equal(await page.title(),'Hodos · Brain networks & white matter tracts');
  assert.match(await page.locator('.brand-name').innerText(),/^Hodos/);
  await page.evaluate(()=>document.fonts.ready);assert(await page.evaluate(()=>document.fonts.check('600 26px "Archivo"')));
  assert.match(await page.locator('link[rel=icon]').getAttribute('href'),/hodos-favicon/);
  assert.equal(await page.locator('.curriculum-row').count(),10);assert.equal(new URL(page.url()).searchParams.has('lesson'),false);
  assert.equal(await page.locator('#anatomyDrawer').getAttribute('open'),null);
  await page.screenshot({path:`${out}/library-desktop.png`,fullPage:true});
  report.checks.push('Fresh entry offers learning/exploration without an implicit motor lesson');
  const seenCards=new Set();
  if(!process.argv.includes('--flows-only')){
  for(const lesson of LESSONS){
    await choose(lesson.id);assert.equal((await state()).learningPhase,'brief');
    assert.match(await page.locator('.lesson-case').innerText(),new RegExp(TEACHING_GUIDES[lesson.id].question.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    await page.locator('#lessonNext').click();
    for(const [i,step] of lesson.steps.entries()){
      const loaded=await state(),authored=resolveTeachingScene(lesson,step);
      assert.equal(loaded.lesson.step,i);assert.equal(loaded.learningPhase,'orient');assert.equal(loaded.lesson.status,'paused');
      assert.deepEqual(loaded.network,authored.network);assert.equal(loaded.hemisphere,authored.side);
      assert.deepEqual(loaded.selected,authored.regions[0]||null);
      assert.equal(await page.locator('#lessonCurrentTitle').innerText(),step.title);
      assert.equal(await page.locator('.lesson-lead').innerText(),step.text);
      await page.locator('#lessonNext').click();assert.equal((await state()).learningPhase,'compare');
      assert.equal(await page.locator('.lesson-observe>p').innerText(),step.observe);
      assert.deepEqual(await page.locator('.lesson-anatomy li').allTextContents(),step.anatomy);
      const cortex=authored.regions.map(r=>r.id).sort((a,b)=>a-b),allBundles=[...authored.bundleIds,...authored.ghostIds].sort();
      for(const [index,target] of (step.targets||[]).entries()){
        const before=await state();await page.locator(`#lessonTarget-${index}`).click();const focused=await state();
        assert.equal(focused.lesson.step,i);assert.equal(focused.learningPhase,'compare');
        assert(await page.locator('#explorationStatus').isHidden());
        const named=[focused.selected,...focused.highlighted].filter(Boolean).map(r=>r.id).sort((a,b)=>a-b);
        for(const id of cortex)assert(named.includes(id),`${lesson.id}/${i}: lost cortical neighbour ${id}`);
        for(const id of authored.deepRegionIds)assert(focused.deepHighlight.includes(id),`${lesson.id}/${i}: lost deep neighbour ${id}`);
        for(const id of allBundles)assert([...focused.bundles,...focused.ghostBundles].includes(id),`${lesson.id}/${i}: lost pathway ${id}`);
        sameCamera(focused.camera,before.camera,'inspection keeps the comparison camera');
        if(target.kind==='parcel')assert.equal(focused.selected.id,target.id);
        if(target.kind==='deep')assert(focused.deepFocus.includes(`${target.id}-${authored.side==='R'?'rh':'lh'}`));
        if(target.kind==='bundle')assert(focused.bundles.some(id=>id===target.id||id===`${target.id}_${authored.side}`));
        await page.locator('#lessonRestore').click();
      }
      await page.locator('.lesson-reference-drawer>summary').click();
      assert.deepEqual(await page.locator('.lesson-sources>div>a').evaluateAll(as=>as.map(a=>a.href)),sourceIdsForStep(step).map(id=>SOURCES[id].url));
      assert.equal(await page.locator('[data-region-card]').count(),step.regions.length);
      for(const id of step.regions){const card=page.locator(`[data-region-card="${id}"]`);await card.locator('summary').click();
        assert.equal(await card.locator('p').innerText(),REGIONS[id].text);assert(await card.locator('p').isVisible());
        assert.deepEqual(await card.locator('a').evaluateAll(as=>as.map(a=>a.href)),REGIONS[id].sources.map(id=>SOURCES[id].url));seenCards.add(id);
        await card.locator('summary').click();
      }
      await page.locator('.lesson-reference-drawer>summary').click();
      if((lesson.id==='motor-cst'&&[0,1,4].includes(i))||(lesson.id==='optic-radiation'&&i===2)||(lesson.category==='Network lectures'&&i===1)){
        await page.locator('#lessonCurrentTitle').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${lesson.id}-${i+1}.png`,fullPage:true});
      }
      await page.locator('#lessonNext').click();assert.equal((await state()).learningPhase,'explain');
      assert.equal(await page.locator('.lesson-check>p').innerText(),step.question);
      await page.locator('#lessonAnswer>summary').click();assert.equal(await page.locator('#lessonAnswer>p').innerText(),step.answer);
      assert.equal(await page.locator('.lesson-surgical>p').innerText(),step.surgical);
      await page.locator('#lessonNext').click();
      report.steps.push({lesson:lesson.id,step:i+1,targets:step.targets?.length||0,cards:step.regions,sources:sourceIdsForStep(step)});
    }
    assert.equal((await state()).learningPhase,'recap');assert.equal(await page.locator('.recap-takeaways li').count(),3);
    await page.locator('#lessonReview').click();assert.equal(await page.locator('#lessonReview').innerText(),'Marked reviewed');
    if(lesson.id==='motor-cst')await page.screenshot({path:`${out}/motor-recap.png`,fullPage:true});
    await page.locator('#lessonNext').click();assert.equal((await state()).lesson.status,'inactive');
    assert.match(await page.locator(`#lessonStart-${lesson.id}`).innerText(),/reviewed/);
    console.log(`Verified ${lesson.id}: ${lesson.steps.length} complete relationships`);
  }
  assert.deepEqual([...seenCards].sort(),Object.keys(REGIONS).sort());
  report.checks.push('58 relationships: all phases, targets, neighbour retention, sources, cards, answers and recaps');
  }

  // Separate Learn/Explore ownership; real controls set the pre-lesson snapshot.
  await page.locator('#toggleLesson').click();await page.locator('#openAtlasTools').click();
  await page.locator('#atlasArea').selectOption('L:1');await page.locator('#atlasHemisphere').selectOption('R');
  assert.deepEqual((await state()).selected,{hemi:'R',id:1});
  await page.locator('#atlasNetworks').selectOption('7');
  await page.locator('#surfaceLevel').fill('22');
  await page.locator('button[data-bundle="CST_R"]').click();
  await page.locator('#openAtlasTools').click();
  const exploration=await state();
  await page.locator('#learnHome').click();await choose('motor-cst');await page.locator('#lessonNext').click();await jump(1);
  assert.equal((await state()).hemisphere,'L');assert.deepEqual((await state()).network,{mode:'off',focus:null});
  await page.locator('#openAtlasTools').click();await page.locator('#atlasHemisphere').selectOption('R');
  assert.equal((await state()).hemisphere,'R');assert.equal((await state()).selected.hemi,'R');
  assert(await page.locator('#lessonSceneStatus').isHidden());assert(await page.locator('#explorationStatus').isVisible());
  await page.locator('#openAtlasTools').click();await page.locator('#lessonRestore').click();
  assert.equal((await state()).hemisphere,'L');
  await page.locator('#lessonExplore').click();const returned=await state();
  for(const key of ['selected','hemisphere','network','bundles','ghostBundles'])assert.deepEqual(returned[key],exploration[key],`Explore restores ${key}`);
  sameCamera(returned.camera,exploration.camera,'Explore restores the camera');
  assert.equal(await page.locator('#surfaceLevel').inputValue(),'22');
  report.checks.push('Explore returns exact parcel, side, network, pathways, opacity and camera in the session');
  await page.locator('#learnHome').click();await choose('attention-networks');await page.locator('#lessonNext').click();
  assert.deepEqual((await state()).network,{mode:'focus',focus:3});
  await choose('optic-radiation');await page.locator('#lessonNext').click();await jump(2);await page.locator('#phase-compare').click();
  assert.deepEqual((await state()).network,{mode:'off',focus:null});
  await page.reload();await ready();assert.equal((await state()).learningPhase,'compare');assert.equal((await state()).lesson.step,2);
  assert.equal((await state()).selected.id,1);assert.deepEqual((await state()).network,{mode:'off',focus:null});
  await page.locator('#lessonLibrary').click();await page.reload();await ready();assert.equal((await state()).lesson.status,'inactive');
  await page.locator('#lessonResume').click();assert.equal((await state()).lesson.lessonId,'optic-radiation');assert.equal((await state()).lesson.step,2);assert.equal((await state()).learningPhase,'compare');
  report.checks.push('Lesson switch/reload cannot inherit an unrelated network or parcel; library resumes exact step and phase');

  // Explicit comparisons use the same camera and declare the model they show.
  for(const lesson of LESSONS.filter(l=>TEACHING_GUIDES[l.id].comparison)){
    await choose(lesson.id);await page.locator('#lessonNext').click();await page.locator('#phase-compare').click();
    await page.locator('.network-comparison>summary').click();let camera;
    for(const [index,option] of TEACHING_GUIDES[lesson.id].comparison.options.entries()){
      await page.locator(`#lectureCompare-${index}`).click();const s=await state();
      if(camera)sameCamera(s.camera,camera);camera=s.camera;
      assert.match(await page.locator('#lessonSceneStatus').innerText(),/Lecture comparison/);
      assert.equal(await page.locator('#sceneNetwork').isVisible(),s.network.mode!=='off');
      if(option.bundles)for(const id of option.bundles)assert(s.bundles.includes(`${id}_${s.hemisphere}`)||s.bundles.includes(id));
    }
    await page.locator('#lessonRestore').click();assert.deepEqual((await state()).network,resolveTeachingScene(lesson,lesson.steps[0]).network);
  }
  report.checks.push('Network/pathway comparison toggles preserve their common camera and restore the relationship');

  await choose('motor-cst');await page.locator('#lessonNext').click();await jump(4);await page.locator('#phase-compare').click();
  for(const [width,height,profile] of [[1440,900,'teaching'],[1157,601,'teaching'],[851,900,'teaching'],[390,844,'teaching'],[320,700,'teaching'],[1440,900,'presenter']]){
    await page.setViewportSize({width,height});await page.locator('#lessonProfile').selectOption(profile);await page.locator('.brand').scrollIntoViewIfNeeded();
    const metrics=await page.evaluate(()=>{const rect=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,scroll:e.scrollHeight,client:e.clientHeight};};return {width:innerWidth,height:innerHeight,pageWidth:document.documentElement.scrollWidth,stage:rect('.atlas-stage'),canvas:rect('canvas'),panel:rect('#lessonPanel'),readout:rect('.scene-readout'),nav:rect('.lesson-controls')};});
    assert(metrics.pageWidth<=width,`horizontal overflow at ${width}`);
    assert(metrics.readout.bottom<=metrics.stage.bottom+1,`readout outside stage at ${width}`);
    assert(metrics.stage.scroll<=metrics.stage.client+1,`stage overflow at ${width}`);
    if(width>=1200)assert(metrics.canvas.h>=500,'desktop scene dominates');
    if(width>760){assert(metrics.nav.bottom<=height+1);assert(metrics.panel.y+metrics.panel.h<=height+1);}
    else assert(metrics.panel.y<height,'lesson begins in the first phone viewport');
    await checkLabels();
    if(width<=760){
      assert(metrics.canvas.h>=190,'phone canvas remains usable');
      // A real paragraph can scroll into the reading space between sticky scene
      // and navigation. Rectangle checks alone would miss covered prose.
      await page.locator('.lesson-anatomy li').last().evaluate(e=>e.scrollIntoView({block:'center'}));
      const readable=await page.locator('.lesson-anatomy li').last().evaluate(e=>{
        const r=e.getBoundingClientRect(),stage=document.querySelector('.atlas-stage').getBoundingClientRect(),nav=document.querySelector('.lesson-controls').getBoundingClientRect();
        return r.bottom>stage.bottom&&r.top<nav.top;
      });assert(readable,'phone prose is reachable between stage and navigation');
      await page.screenshot({path:`${out}/reading-${width}-${height}.png`});
      await jump(9);await checkLabels();await jump(4);await page.locator('#phase-compare').click();
      await page.locator('.brand').scrollIntoViewIfNeeded();
    }
    await page.screenshot({path:`${out}/layout-${width}-${height}-${profile}.png`,fullPage:true});report.layouts.push({...metrics,profile});
  }
  await page.setViewportSize({width:1440,height:900});
  // Keyboard-only phase changes, reference disclosure and navigation.
  await page.locator('#phase-explain').focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'lessonCurrentTitle');
  await page.locator('#lessonAnswer>summary').focus();await page.keyboard.press('Enter');assert(await page.locator('#lessonAnswer>p').isVisible());
  await page.locator('#openAnatomySearch').click();
  for(const [query,expected] of [['V1','V1'],['thalamus','Thalamus'],['hippocampus','Hippocampus'],['arcuate','Arcuate']]){
    await page.locator('#pathwayFilter').fill(query);assert.match(await page.locator('#anatomyResults').innerText(),new RegExp(expected,'i'));
  }
  await page.locator('#pathwayFilter').fill('zznonexistent');assert.match(await page.locator('#anatomySearchStatus').innerText(),/No anatomy matches/);
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'openAnatomySearch');
  await page.locator('.skip-link').focus();await page.keyboard.press('Enter');assert(await page.locator('#atlasControls').isVisible());
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'openAtlasTools');
  report.checks.push('Keyboard phase/answer/settings/search flows and cross-catalog empty feedback');
  await page.locator('#lessonExplore').click();await page.locator('#openAtlasTools').click();
  if(!(await page.locator('#pathwayClear').isDisabled()))await page.locator('#pathwayClear').click();
  const chips=page.locator('#pathwayGroups .bundle-chip');for(let i=0;i<12;i++)await chips.nth(i).click();
  assert.equal((await state()).bundles.length,12);assert.match(await page.locator('#pathwayStatus').innerText(),/12.*remove/i);
  assert.equal(await page.locator('#selectedPathways button').count(),12);
  await page.locator('#selectedPathways button').first().click();assert.equal((await state()).bundles.length,11);
  await page.keyboard.press('Escape');await page.locator('#atlasFit').click();const fitted=(await state()).camera;
  await page.locator('canvas').focus();await page.keyboard.press('ArrowRight');assert.notDeepEqual((await state()).camera,fitted);
  await page.keyboard.press('Home');sameCamera((await state()).camera,fitted);
  assert(await page.locator('#tracePlay').isDisabled());
  await page.waitForTimeout(200);const idle=await state();await page.waitForTimeout(250);
  assert.equal((await state()).frames,idle.frames);assert.equal((await state()).time,idle.time);
  report.checks.push('12-pathway capacity, keyboard rotation/fit and reduced-motion idle rendering');
  await page.goto(new URL('atlas-sources.html',base).href);await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.title(),'Hodos · Atlas sources');assert(await page.evaluate(()=>document.fonts.check('600 26px "Archivo"')));
  assert.match(await page.locator('.brand-name').innerText(),/^Hodos/);
  assert.match(await page.locator('main').innerText(),/Amy Sterling/);
  await page.emulateMedia({forcedColors:'active'});
  assert.notEqual(await page.locator('.brand-mark').evaluate(e=>getComputedStyle(e).stroke),'none');
  await page.emulateMedia({forcedColors:'none',media:'print'});assert(await page.locator('.brand').isVisible());
  await page.emulateMedia({media:'screen'});
  report.checks.push('Both atlas pages use Hodos and locally served Archivo; original atlas attribution remains');
  await visit('lesson=motor-cst&lessonVersion=old&step=5&phase=compare');assert.equal((await state()).lesson.status,'paused');assert.equal((await state()).lesson.step,5);assert.match(await page.locator('.lesson-notice').innerText(),/updated after this link/);
  await page.locator('#lessonNext').click();assert.equal(await page.locator('.lesson-notice').count(),0,'notice clears on navigation');

  // A small touch screen with storage denied must still be a usable lesson.
  const touchContext=await browser.newContext({viewport:{width:320,height:700},hasTouch:true,reducedMotion:'reduce'});
  await touchContext.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage disabled','SecurityError');}}));
  const touch=await touchContext.newPage();touch.on('pageerror',e=>report.errors.push(e.message));
  touch.on('requestfailed',r=>report.requests.push(r.url()));
  await touch.goto(new URL('atlas.html?test=1',base).href);await touch.waitForFunction(()=>window.__atlasTest?.ready);
  assert.match(await touch.locator('.learning-save-note').innerText(),/session/);
  await touch.locator('#lessonStart').click();await touch.locator('#lessonNext').click();
  const touchMetrics=await touch.evaluate(()=>({pageWidth:document.documentElement.scrollWidth,width:innerWidth,
    controls:[...document.querySelectorAll('.studio-header button,.stage-tools button,.learning-phases button,.lesson-nav button')]
      .filter(e=>e.getClientRects().length).map(e=>({id:e.id||e.textContent,height:e.getBoundingClientRect().height}))}));
  report.touch=touchMetrics;
  assert(touchMetrics.pageWidth<=touchMetrics.width);
  for(const control of touchMetrics.controls)assert(control.height>=44,`${control.id} has a short touch target`);
  await touch.locator('#phase-explain').click();await touch.locator('#lessonAnswer>summary').click();assert(await touch.locator('#lessonAnswer>p').isVisible());
  await touch.locator('#lessonLibrary').click();await touch.locator('#lessonResume').click();
  assert.equal(await touch.evaluate(()=>window.__atlasTest.learningPhase),'explain');
  await touch.screenshot({path:`${out}/touch-storage-denied.png`,fullPage:true});await touchContext.close();
  report.checks.push('320px touch controls and session resume work when device storage is denied');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.requests,[]);assert.deepEqual(report.externalRequests,[]);report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;throw error;}
finally{await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,steps:report.steps.length,checks:report.checks,layouts:report.layouts.length,failure:report.failure},null,2));}
