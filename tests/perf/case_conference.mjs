import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.argv.find(x=>x.startsWith('--url='))?.slice(6)||'http://127.0.0.1:51118/';
const out=process.argv.find(x=>x.startsWith('--out='))?.slice(6)||'output/case-conference';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const report={checks:[],errors:[],externalRequests:[],screenshots:[]};
const learning=JSON.stringify({version:'2026-09-11.2',lastLesson:'motor-cst',lessons:{'motor-cst':{step:1,phase:'explain',visited:[0,1],reviewed:false}}});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['microphone'],reducedMotion:'reduce'});
 await context.addInitScript(value=>{
  if(!localStorage.getItem('tractlab.anatomy.learning.v1'))localStorage.setItem('tractlab.anatomy.learning.v1',value);
  window.__caseStreams=[];const original=navigator.mediaDevices?.getUserMedia.bind(navigator.mediaDevices);
  if(original)navigator.mediaDevices.getUserMedia=async options=>{const stream=await original(options);window.__caseStreams.push(stream);return stream;};
 },learning);
 const page=await context.newPage();page.setDefaultTimeout(20000);
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('request',r=>{if(r.url().startsWith('http')&&new URL(r.url()).origin!==new URL(base).origin)report.externalRequests.push(r.url());});
 const shot=async name=>{await page.screenshot({path:`${out}/${name}.png`,fullPage:true});report.screenshots.push(name);};
 const next=()=>page.locator('.stage-actions .primary').click();
 const savedLearning=()=>page.evaluate(()=>localStorage.getItem('tractlab.anatomy.learning.v1'));
 await page.goto(new URL('case-conference.html',base).href);await page.getByRole('heading',{name:'Bring your reasoning to the conference.'}).waitFor();
 assert.equal(await page.locator('.case-row').count(),4);await shot('catalog-desktop');
 for(const [index,id] of ['medial-frontal','insular','temporoparietal','right-medial-frontal'].entries()){
  await page.locator('.case-row').nth(index).getByRole('button',{name:'Begin case'}).click();
  await page.getByRole('heading',{name:'Read the case'}).waitFor();
  if(await page.locator('.case-mri img').count()){
   await page.locator('.case-mri img').evaluate(img=>img.decode());
   assert.match(await page.locator('.case-mri img').getAttribute('src'),new RegExp(`${id}.png$`));
   assert.match(await page.locator('.case-mri figcaption').innerText(),/AI-generated/);
  }else{assert.equal(await page.locator('.case-imaging').count(),0);assert(await page.locator('.schematic svg').isVisible(),'schematic shown when no illustration is installed');}
  await shot(`${id}-imaging`);if(index===0)await shot('medial-case');
  await next();await page.locator('#initialResponse').fill(`Initial teaching answer ${id}`);await next();
  if(index===0){
   await page.locator('.stage-body .reference-links button').first().click();
   const frame=page.frameLocator('#referenceDialog iframe');await frame.locator('#phase-compare').waitFor();await frame.locator('#phase-compare').click();
   await frame.locator('#lessonNext').click();assert.equal(await savedLearning(),learning);
   await frame.getByRole('link',{name:'Sources',exact:true}).click();
   await frame.getByRole('link',{name:'Return to atlas'}).click();
   await frame.locator('#caseConferenceLink').waitFor({state:'hidden'});
   assert.match(await page.locator('#referenceDialog iframe').evaluate(f=>f.contentWindow.location.search),/caseReference=1/);
   assert.equal(await savedLearning(),learning);
   await frame.locator('body').click({position:{x:5,y:5}});
   await page.keyboard.press('Escape');await page.locator('#referenceDialog').waitFor({state:'hidden'});assert.equal(await page.locator('iframe').count(),0);
   assert.equal(await page.locator('#stageTitle').textContent(),'Explore the relationships');report.checks.push('reference round trip preserves original progress and case stage');
  }
  await next();await page.locator('#revisedResponse').fill(`Reconsidered teaching answer ${id}`);await next();
  await page.locator('#finalResponse').fill(`Final teaching response ${id}`);
  await page.getByRole('button',{name:'Speak',exact:true}).click();
  if(index===0){
   await page.getByRole('button',{name:'Record response',exact:true}).click();await page.getByText('Recording locally. Stop whenever you are ready.',{exact:true}).waitFor();
   await page.getByRole('button',{name:'Stop recording',exact:true}).click();await page.getByText('Recording ready. Replay it before comparing your reasoning.',{exact:true}).waitFor();
   assert.equal(await page.locator('audio').count(),1);assert(await page.evaluate(()=>window.__caseStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended'))));
   const audioDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Download audio'}).click();assert.match((await audioDownload).suggestedFilename(),/response\.(webm|m4a)$/);
   report.checks.push('fake-device record, stop, replay, download and track cleanup');
  }
  await page.getByRole('button',{name:'Write',exact:true}).click();assert.equal(await page.locator('#finalResponse').inputValue(),`Final teaching response ${id}`);
  await page.locator('#rememberCase').check();assert.match(await page.locator('#saveStatus').innerText(),/saved on this device/);
  const textDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Download text'}).click();assert.match((await textDownload).suggestedFilename(),/response.txt$/);
  await next();assert.match(await page.locator('.stage-body>.status').innerText(),/Practice response completed/);
  for(let i=0;i<4;i++)await page.locator(`#rubric-${i}`).selectOption(i?'partly':'addressed');
  if(index===0)await shot('medial-debrief');
  await page.reload();await page.locator('#rubric-0').waitFor();assert.equal(await page.locator('#rubric-0').inputValue(),'addressed');
  assert.equal(await savedLearning(),learning);await page.getByRole('button',{name:'Return to cases'}).click();report.checks.push(`${id}: all stages, mode parity, opt-in reload and rubric`);
 }
 await page.setViewportSize({width:390,height:844});await shot('catalog-mobile');
 await page.locator('.case-row').first().getByRole('button',{name:'Continue case'}).click();
 await page.locator('.stage-nav button').first().click();await page.locator('.case-mri img').evaluate(img=>img.decode());
 assert(await page.locator('.case-mri img').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('imaging-mobile');
 await page.locator('.stage-nav button').last().click();await page.getByRole('button',{name:'All cases'}).click();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('.case-row').first().getByRole('button',{name:'Continue case'}).click();await shot('debrief-mobile');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.getByRole('button',{name:'All cases'}).click();await page.locator('.case-row').first().getByRole('button',{name:'Review debrief'}).click();assert.match(await page.locator('.stage-body>.status').innerText(),/Review mode/);
 report.checks.push('390px layout and explicit review-only mode');
 await page.getByRole('button',{name:'Practice this case'}).click();assert.match(await page.locator('.stage-body>.status').innerText(),/Practice response completed/);
 const denied=await browser.newContext();await denied.addInitScript(()=>{Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))});Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}});});
 const dp=await denied.newPage();dp.on('pageerror',e=>report.errors.push(e.message));await dp.goto(new URL('case-conference.html',base).href);
 await dp.getByRole('button',{name:'Review debrief'}).first().click();assert.equal(await dp.locator('.stage-nav button:disabled').count(),5);
 await dp.getByRole('button',{name:'Practice this case'}).click();await dp.getByRole('heading',{name:'Read the case'}).waitFor();
 for(let i=0;i<4;i++)await dp.locator('.stage-actions .primary').click();await dp.getByRole('button',{name:'Speak',exact:true}).click();await dp.getByRole('button',{name:'Record response',exact:true}).click();await dp.getByText(/Microphone access was denied/).waitFor();
 await dp.getByRole('button',{name:'Write',exact:true}).click();await dp.locator('#finalResponse').fill('Session draft survives denied storage');await dp.locator('#rememberCase').click();assert.equal(await dp.locator('#rememberCase').isChecked(),false);assert.equal(await dp.locator('#finalResponse').inputValue(),'Session draft survives denied storage');
 report.checks.push('denied microphone and storage preserve usable written response');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.externalRequests,[]);
}catch(e){report.failure=e.stack;throw e;}finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2));}
