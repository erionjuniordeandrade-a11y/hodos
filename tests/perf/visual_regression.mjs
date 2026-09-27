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
const baselineDir=fileURLToPath(new URL('../fixtures/visual/',import.meta.url));
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
  assert.deepEqual(report.errors,[],'no console or page errors');
  assert(report.scenes.every(scene=>scene.verdict==='PASS'||scene.verdict==='UPDATED'),'visual differences exceed 0.5%');
  console.log(JSON.stringify({verdict:update?'UPDATED':'PASS',scenes:report.scenes.map(({name,verdict,changedPercent})=>({name,verdict,changedPercent}))},null,2));
}catch(error){report.failure=error.stack||String(error);throw error;
}finally{
  await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
