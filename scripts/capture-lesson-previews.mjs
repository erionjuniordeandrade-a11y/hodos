// Capture the actual authored atlas scenes. No geometry, colours or labels are altered.
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

const base=process.argv.find(v=>v.startsWith('--url='))?.slice(6);
if(!base)throw Error('Pass --url for the source viewer server');
const out=process.argv.find(v=>v.startsWith('--out='))?.slice(6)||'output/lesson-previews-20260919/capture';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const records=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2,reducedMotion:'reduce'});
  for(const id of ['motor-cst','fat-language','default-mode-network']){
    const query=`lesson=${id}&step=0&phase=orient&hemi=L`;
    await page.goto(new URL(`atlas.html?${query}&test=1`,base).href);
    await page.waitForFunction(()=>window.__atlasTest?.ready&&!window.__atlasTest.cameraTransition);
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('#atlasCanvas').scrollIntoViewIfNeeded();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const file=`plate-${id}-20260919.jpg`;
    const bytes=await page.locator('#atlasCanvas').screenshot({path:`${out}/${file}`,type:'jpeg',quality:93});
    const scene=await page.evaluate(()=>{const s=window.__atlasTest;return {lesson:s.lesson.lessonId,step:s.lesson.step,phase:s.learningPhase,hemisphere:s.hemisphere,camera:s.camera,selected:s.selected,highlighted:s.highlighted,bundles:s.bundles,network:s.network};});
    const box=await page.locator('#atlasCanvas').boundingBox();
    records.push({file,query,cssSize:{width:box.width,height:box.height},deviceScaleFactor:2,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),scene});
  }
  await writeFile(`${out}/capture.json`,JSON.stringify(records,null,2)+'\n');
  console.log(JSON.stringify(records,null,2));
}finally{await browser.close();}
