#!/usr/bin/env node
// Drives a built Hodos site in headless Chromium the way a visitor does.
// Usage: node .claude/skills/verify/verify.mjs [--dist=dist/hodos] [--url=http://host:port]
//          [--only=landing,atlas] [--out=output/verify] [--keep-shots]
// Exit 0 = every selected feature passed; exit 1 = a check failed or a console error appeared.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile,access} from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const arg=(name,fallback)=>process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const dist=path.resolve(root,arg('dist','dist/hodos'));
const out=path.resolve(root,arg('out','output/verify'));
const only=arg('only','')?.split(',').filter(Boolean);
const keepShots=process.argv.includes('--keep-shots');
const GL=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];

const freePort=()=>new Promise((res,rej)=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const{port}=s.address();s.close(()=>res(port));});s.on('error',rej);});
async function startServer(){
  await access(path.join(dist,'release.json')).catch(()=>{throw Error(`No build at ${dist}. Run: npm run build`);});
  const port=await freePort();
  const child=spawn('python3',[path.join(root,'.claude/skills/verify/serve.py'),'--port',String(port),'--directory',dist],{stdio:'ignore'});
  const base=`http://127.0.0.1:${port}`;
  for(let i=0;i<50;i++){
    try{if((await fetch(`${base}/release.json`)).ok)return{base,child};}catch{}
    await new Promise(r=>setTimeout(r,100));
  }
  child.kill();throw Error('Server did not become ready');
}

const results=[];
const features={
  async landing({page,base}){
    await open(page,base,'/');
    assert.equal(await page.title(),'Hodos · Neuroanatomy coursebook for residents');
    await page.waitForFunction(()=>{const i=document.querySelector('[data-hero] img');return i?.complete&&i.naturalWidth>0;});
    const n=await page.locator('[data-lessons] a').count();
    assert.equal(n,14,'landing links one deep link per lesson');
    assert.match(await page.locator('.creator-credit').innerText(),/Created by Dr\. Erion de Andrade/);
    return `hero image decoded, ${n} lesson links, creator credit`;
  },
  async lessons({page,base}){
    await open(page,base,'/lessons');
    const hrefs=await page.locator('a[href^="/lessons/"]').evaluateAll(a=>[...new Set(a.map(x=>x.getAttribute('href')))]);
    assert.equal(hrefs.length,14,'lesson index lists 14 lessons');
    await open(page,base,hrefs[0]);
    const h1=(await page.locator('h1').first().innerText()).trim();
    assert(h1.length>3,'lesson page has a heading');
    return `index lists ${hrefs.length} lessons; ${hrefs[0]} renders "${h1}"`;
  },
  async atlas({page,base}){
    await open(page,base,'/atlas?test=1');
    await page.waitForFunction(()=>window.__atlasTest?.ready,null,{timeout:45000});
    assert(await page.locator('canvas').first().isVisible(),'atlas canvas visible');
    const f0=await page.evaluate(()=>window.__atlasTest.frames);
    await page.evaluate(()=>window.__atlasTest.togglePathway('AF_L'));
    await page.waitForFunction(()=>window.__atlasTest.bundles.includes('AF_L'));
    // "ready" is not "drawn": require a new rendered frame after the toggle.
    await page.waitForFunction(p=>window.__atlasTest.frames>p,f0);
    assert(await canvasHasPixels(page),'atlas canvas is not blank');
    return `scene ready, AF_L bundle toggled, frames ${f0} -> ${await page.evaluate(()=>window.__atlasTest.frames)}, canvas drawn`;
  },
  async lessonPlayer({page,base}){
    await open(page,base,'/atlas?test=1');
    await page.waitForFunction(()=>window.__atlasTest?.ready,null,{timeout:45000});
    const rows=await page.locator('.curriculum-row').count();
    assert.equal(rows,14,'curriculum lists 14 lessons');
    await page.locator('[id^="lessonStart-"]').first().click();
    assert(await page.locator('.lesson-case').isVisible(),'lesson case shown');
    const phases=[];
    for(let i=0;i<3;i++){await page.locator('#lessonNext').click();phases.push(await page.evaluate(()=>window.__atlasTest.learningPhase));}
    assert.deepEqual(phases,['orient','compare','explain']);
    await page.locator('#lessonAnswer>summary').click();
    assert((await page.locator('#lessonAnswer>p').innerText()).length>10,'answer revealed');
    return `${rows} curriculum rows; first lesson stepped ${phases.join(' > ')} and answer revealed`;
  },
  async mips({page,base}){
    await open(page,base,'/mips?test=1');
    await page.waitForFunction(()=>window.__mipsTest?.ready||window.__mipsTest?.error,null,{timeout:45000});
    const merr=await page.evaluate(()=>String(window.__mipsTest.error?.message??window.__mipsTest.error));
    assert.equal(merr,'null','MIPS loads: '+merr);
    // Tract bundles arrive after `ready`; the controls and the next frame depend on them.
    await page.waitForFunction(()=>window.__mipsTest.scene.bundles.length>0&&!window.__mipsTest.scene.tractError,null,{timeout:45000});
    const f0=await page.evaluate(()=>window.__mipsTest.scene.frames);
    await page.getByRole('button',{name:'Compare corridors',exact:true}).click({timeout:45000});
    await page.waitForFunction(()=>window.__mipsTest.scene.corridors.length===2);
    await page.waitForFunction(p=>window.__mipsTest.scene.frames>p,f0);
    assert.deepEqual(await page.locator('.corridor-label').allTextContents(),['A','B']);
    assert(await canvasHasPixels(page),'MIPS canvas is not blank');
    return `corridors A and B drawn after Compare; frames ${f0} -> ${await page.evaluate(()=>window.__mipsTest.scene.frames)}`;
  },
  async connections({page,base}){
    await open(page,base,'/connections');
    await page.waitForFunction(()=>document.querySelector('#graphStats')?.textContent.trim().length>0);
    const stats=(await page.locator('#graphStats').innerText()).replace(/\s+/g,' ').trim();
    assert(await canvasHasPixels(page,'#graphCanvas'),'graph canvas is not blank');
    return `graph drawn; stats "${stats.slice(0,60)}"`;
  },
  async pages({page,base}){
    const seen=[];
    for(const [route,title] of [['/atlas-sources',/Sources and use terms/],['/case-conference',/Case Conference/]]){
      await open(page,base,route);
      assert.match(await page.title(),title);
      assert((await page.locator('body').innerText()).length>200,`${route} has content`);
      seen.push(route);
    }
    return `static pages render: ${seen.join(', ')}`;
  },
};

async function open(page,base,route){
  // Navigating to a different URL each time: same-URL goto() would not reload.
  const res=await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});
  assert.equal(res?.status(),200,`${route} returned ${res?.status()}`);
}
// WebGL canvases cannot be read back (no preserveDrawingBuffer), so screenshot the element,
// decode the PNG in a scratch page and count distinct colours: a blank canvas has almost none.
// (pngjs is a devDependency but is not always installed, so the decode uses the browser.)
async function canvasHasPixels(page,sel='canvas'){
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const b64=(await page.locator(sel).first().screenshot({animations:'disabled'})).toString('base64');
  const scratch=await page.context().newPage();
  try{
    return await scratch.evaluate(async data=>{
      const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();
      const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
      const x=c.getContext('2d');x.drawImage(img,0,0);
      const d=x.getImageData(0,0,c.width,c.height).data;const colours=new Set();
      for(let i=0;i<d.length;i+=52)colours.add((d[i]>>3)<<10|(d[i+1]>>3)<<5|d[i+2]>>3);
      return colours.size>12;
    },b64);
  }finally{await scratch.close();}
}

const external=arg('url');
const srv=external?{base:external,child:null}:await startServer();
const browser=await chromium.launch({headless:true,args:GL});
await mkdir(out,{recursive:true});
try{
  for(const [name,fn] of Object.entries(features)){
    if(only.length&&!only.includes(name))continue;
    // Fresh context per feature keeps WebGL contexts and console logs independent.
    const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    const page=await context.newPage();page.setDefaultTimeout(20000);
    const errors=[];
    page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
    page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`);});
    page.on('requestfailed',r=>errors.push(`requestfailed: ${r.url()}`));
    try{
      const detail=await fn({page,base:srv.base});
      assert.deepEqual(errors,[],'console/page errors: '+JSON.stringify(errors));
      results.push({name,ok:true,detail});
    }catch(e){
      results.push({name,ok:false,detail:e.message.split('\n')[0]});
      if(keepShots)await page.screenshot({path:path.join(out,`${name}-fail.png`)}).catch(()=>{});
    }
    await context.close();
  }
}finally{
  await browser.close();
  srv.child?.kill();
}
for(const r of results)console.log(`${r.ok?'PASS':'FAIL'}  ${r.name.padEnd(13)} ${r.detail}`);
const failed=results.filter(r=>!r.ok).length;
console.log(`\n${results.length-failed}/${results.length} features passed (${srv.base}, dist ${path.relative(root,dist)})`);
process.exit(failed?1:0);
