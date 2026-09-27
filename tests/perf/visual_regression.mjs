import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import pixelmatch from 'pixelmatch';
import {PNG} from 'pngjs';

const base=process.argv.find(arg=>arg.startsWith('--url='))?.slice(6);
if(!base)throw Error('Pass --url=http://127.0.0.1:PORT');
const out=process.argv.find(arg=>arg.startsWith('--out='))?.slice(6)||'output/visual';
const update=process.argv.includes('--update');
// Chromium rasterises text and WebGL differently per OS, so baselines are kept per platform:
// linux/ is what GitHub Actions renders, darwin/ what a Mac renders. Refresh with --update on that OS.
const baselineDir=fileURLToPath(new URL(`../fixtures/visual/${process.platform}/`,import.meta.url));
const scenes=['atlas-default','atlas-parcel','atlas-bundle','mips-default'];
const report={url:base,update,viewport:{width:1280,height:800},threshold:.1,maxChangedPercent:.5,scenes:[],errors:[]};
await mkdir(out,{recursive:true});
if(update)await mkdir(baselineDir,{recursive:true});

const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  for(const name of scenes){
    // A fresh context keeps independent WebGL scenes from exhausting SwiftShader contexts.
    const context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,reducedMotion:'reduce'});
    const page=await context.newPage();page.setDefaultTimeout(45000);
    page.on('pageerror',error=>report.errors.push(`${name}: ${error.message}`));
    page.on('console',message=>{if(message.type()==='error')report.errors.push(`${name}: ${message.text()}`);});
    try{
      // The parcel scene arrives through the URL the atlas itself writes on pick; the area
      // select lives in a collapsed tools panel and is not a supported test surface.
      const route=name==='mips-default'?'/mips.html?test=1':name==='atlas-parcel'?'/atlas.html?test=1&area=147&areaHemi=L':'/atlas.html?test=1';
      const response=await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});
      assert.equal(response?.status(),200,`${name}: served page`);
      if(name==='mips-default'){
        await page.waitForFunction(()=>window.__mipsTest?.ready||window.__mipsTest?.error);
        assert.equal((await page.evaluate(()=>window.__mipsTest)).error,null,'MIPS scene loads');
        // `ready` fires when the surface is up; the three tract bundles arrive later over a real
        // network, and the scene only redraws once they are in. Wait for that frame or the gate flakes.
        const before=await page.evaluate(()=>({frames:window.__mipsTest.scene.frames,bundles:window.__mipsTest.scene.bundles.length}));
        await page.waitForFunction(()=>window.__mipsTest.scene.bundles.length>0&&!window.__mipsTest.scene.tractError);
        if(!before.bundles)await page.waitForFunction(previous=>window.__mipsTest.scene.frames>previous,before.frames);
      }else{
        await page.waitForFunction(()=>window.__atlasTest?.ready);
        const frames=await page.evaluate(()=>window.__atlasTest.frames);
        if(name==='atlas-parcel')await page.waitForFunction(()=>window.__atlasTest?.selected?.hemi==='L'&&window.__atlasTest.selected.id===147);
        if(name==='atlas-bundle'){
          await page.evaluate(()=>window.__atlasTest.togglePathway('AF_L'));
          await page.waitForFunction(()=>window.__atlasTest?.bundles?.length===1&&window.__atlasTest.bundles[0]==='AF_L');
        }
        // The URL-restored parcel is selected before `ready` fires, so its frame is already counted;
        // only the bundle toggle happens after `ready` and must produce a new frame.
        if(name==='atlas-bundle')await page.waitForFunction(previous=>window.__atlasTest?.frames>previous,frames);
      }
      await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
      assert.deepEqual(report.errors,[],`${name}: no browser errors before capture`);
      const actualPath=path.join(out,`${name}.png`),baselinePath=path.join(baselineDir,`${name}.png`);
      const actual=await page.screenshot({animations:'disabled',caret:'hide'});
      await writeFile(actualPath,actual);
      if(update){await writeFile(baselinePath,actual);report.scenes.push({name,verdict:'UPDATED',baseline:baselinePath,actual:actualPath});continue;}
      let baseline;
      try{baseline=await readFile(baselinePath);}catch(error){if(error.code==='ENOENT')throw Error(`Missing ${baselinePath}; run once with --update against this branch's served build`);throw error;}
      const expected=PNG.sync.read(baseline),observed=PNG.sync.read(actual);
      assert.equal(observed.width,expected.width,`${name}: screenshot width`);
      assert.equal(observed.height,expected.height,`${name}: screenshot height`);
      const diff=new PNG({width:expected.width,height:expected.height});
      const changed=pixelmatch(expected.data,observed.data,diff.data,expected.width,expected.height,{threshold:.1});
      const changedPercent=changed/(expected.width*expected.height)*100;
      const diffPath=path.join(out,`${name}.diff.png`);
      await writeFile(diffPath,PNG.sync.write(diff));
      report.scenes.push({name,verdict:changedPercent<=.5?'PASS':'FAIL',changedPixels:changed,totalPixels:expected.width*expected.height,changedPercent,diff:diffPath});
    }finally{await context.close();}
  }
  const hoverContext=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,reducedMotion:'reduce'});
  try{
    const page=await hoverContext.newPage();page.setDefaultTimeout(45000);
    page.on('pageerror',error=>report.errors.push(`hover: ${error.message}`));
    page.on('console',message=>{if(message.type()==='error')report.errors.push(`hover: ${message.text()}`);});
    await page.goto(new URL('/atlas.html?test=1',base).href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__atlasTest?.ready);
    const frames=await page.evaluate(()=>window.__atlasTest.frames);
    await page.evaluate(()=>window.__atlasTest.togglePathway('AF_L'));
    await page.waitForFunction(previous=>window.__atlasTest?.bundles?.includes('AF_L')&&window.__atlasTest.frames>previous,frames);
    const projected=await page.evaluate(()=>{
      const atlas=window.__atlasTest,rect=document.querySelector('#atlasCanvas canvas').getBoundingClientRect(),points=[];
      for(let line=0;line<20;line++)for(const vertex of [4,8,12,16,20,24]){
        const point=atlas.projectBundleVertex('AF_L',line,vertex);
        if(point&&point.z>-1&&point.z<1&&point.x>Math.max(rect.left,0)+8&&point.x<Math.min(rect.right,innerWidth)-8&&
          point.y>Math.max(rect.top,0)+8&&point.y<Math.min(rect.bottom,innerHeight)-8)points.push(point);
      }
      return points;
    });
    assert(projected.length>0,'visible AF_L vertices project into the canvas');
    let hover=null;
    for(const point of projected){
      await page.mouse.move(point.x,point.y);
      hover=await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>resolve(window.__atlasTest.hover))));
      if(hover?.bundle==='AF_L')break;
    }
    assert.equal(hover?.bundle,'AF_L','a projected AF_L vertex hovers its bundle');
    assert.match(await page.locator('#atlasHover').innerText(),/streamline \d+ of \d+/);
    assert.equal(await page.locator('#atlasHover').getAttribute('aria-live'),'polite');
    await page.mouse.move(0,0);
    await page.waitForFunction(()=>window.__atlasTest?.hover===null);
    assert(await page.locator('#atlasHover').isHidden());
    report.hover={verdict:'PASS',bundle:'AF_L',projectedCandidates:projected.length};
  }finally{await hoverContext.close();}
  assert.deepEqual(report.errors,[],'no console or page errors');
  if(!update)assert(report.scenes.every(scene=>scene.changedPixels===0),'all existing scenes remain pixel identical');
  assert(report.scenes.every(scene=>scene.verdict==='PASS'||scene.verdict==='UPDATED'),'visual differences exceed 0.5%');
  console.log(JSON.stringify({verdict:update?'UPDATED':'PASS',scenes:report.scenes.map(({name,verdict,changedPercent})=>({name,verdict,changedPercent})),hover:report.hover},null,2));
}catch(error){report.failure=error.stack||String(error);throw error;
}finally{
  await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
