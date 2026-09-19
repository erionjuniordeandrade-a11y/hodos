import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,request} from 'playwright';

const base=process.argv.find(arg=>arg.startsWith('--url='))?.slice(6);
if(!base)throw Error('Pass --url=');
const out=process.argv.find(arg=>arg.startsWith('--out='))?.slice(6)||'output/tract-ranges';
await mkdir(out,{recursive:true});
const report={url:base,route:null,errors:[],tractResponses:[],checks:[]};
const http=await request.newContext({baseURL:base,timeout:30000});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const page=await context.newPage();page.setDefaultTimeout(45000);
page.on('pageerror',error=>report.errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
const tractResponses=[];
page.on('response',response=>{
  if(new URL(response.url()).pathname.endsWith('/atlas/tracts.bin'))tractResponses.push(response);
});
const responseRows=async()=>Promise.all(tractResponses.map(async response=>({status:response.status(),bytes:(await response.body()).byteLength,url:response.url()})));
const state=()=>page.evaluate(()=>window.__atlasTest);
const waitBundles=expected=>page.waitForFunction(want=>{
  const got=window.__atlasTest?.bundles||[];return got.length===want.length&&want.every(id=>got.includes(id));
},expected);
try{
  const cleanProbe=await http.get('/atlas',{maxRedirects:0});
  const route=cleanProbe.status()===200?'/atlas':'/atlas.html';
  report.route=route;
  await page.goto(new URL(`${route}?lesson=motor-cst&test=1`,base).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__atlasTest?.ready,null,{timeout:45000});
  assert.deepEqual((await state()).bundles,[],'lesson opens with its declared empty step-0 pathway set');
  for(let i=0;i<6;i++)await page.locator('#lessonNext').click();
  await waitBundles(['CST_L']);
  const firstRows=await responseRows();
  assert(firstRows.length>0,'the first tract-bearing lesson scene requests pathway bytes');
  assert(firstRows.every(row=>row.status===206),'every first-scene tracts.bin response is 206');
  assert(firstRows.every(row=>/[?&]v=[a-f0-9]{12}(?:$|&)/.test(row.url)),'every range request carries a content key');
  assert(firstRows.reduce((sum,row)=>sum+row.bytes,0)<1000000,'first lesson scene transfers under 1,000,000 tract bytes');
  assert.deepEqual((await state()).bundles,['CST_L']);
  report.tractResponses.push(...firstRows);
  report.checks.push('motor-cst first tract-bearing scene loads only its declared CST_L bundle');

  await page.locator('#lessonExplore').click();
  await page.waitForFunction(()=>window.__atlasTest?.lesson?.status==='inactive'&&window.__atlasTest.bundles.length===0);
  const before=tractResponses.length;
  await page.locator('#pathwayGroups .bundle-chip[data-bundle="AF_L"]').click();
  await waitBundles(['AF_L']);
  const afterRows=await responseRows(),added=afterRows.slice(before);
  assert.equal(added.length,1,'turning on one new Explore bundle makes exactly one additional range request');
  assert.equal(added[0].status,206);
  assert.match(added[0].url,/[?&]v=[a-f0-9]{12}(?:$|&)/);
  assert.deepEqual((await state()).bundles,['AF_L']);
  report.tractResponses.push(added[0]);
  report.checks.push('Explore adds AF_L with exactly one additional range request and no full-file fetch');
  assert.deepEqual(report.errors,[],'no console or page errors');
  report.passed=true;
  console.log(JSON.stringify({passed:true,route,firstSceneBytes:firstRows.reduce((sum,row)=>sum+row.bytes,0),tractResponses:report.tractResponses.length,checks:report.checks},null,2));
}catch(error){
  report.passed=false;report.failure=error.stack;throw error;
}finally{
  await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');
  await http.dispose();await context.close();await browser.close();
}
