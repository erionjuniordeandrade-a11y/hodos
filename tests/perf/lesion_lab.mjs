// Lesion lab proof on the local GPU. Builds the release into a temporary folder and serves it the
// way Cloudflare Pages does (clean URLs, byte ranges, _headers with the CSP), then drives
// labs/lesion-lab in headless Chromium: frame rate during a scripted sphere drag at 1440 and 390 px,
// console and page errors, the evidence shown against the quoted graph, the fallback state, and a
// 30 s captioned screen recording with a pointer marker.
//
// node tests/perf/lesion_lab.mjs [--url=http://host:port] [--out=output/lesion-lab] [--no-record]
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createReadStream,existsSync} from 'node:fs';
import {mkdir,mkdtemp,readFile,readdir,rm,stat,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {buildHodos} from '../../scripts/build-hodos.mjs';
import {CONNECTION_ROWS} from '../../viewer/connections_data.js';
import {PMID_RECORDS} from '../../viewer/lesion_evidence.js';
import {evidenceFor} from '../../viewer/lesion_model.js';

const arg=name=>process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3);
const out=path.resolve(arg('out')||'output/lesion-lab');
const record=!process.argv.includes('--no-record');
const FPS_MIN=58,DRAG_SECONDS=3,VIDEO_SECONDS=30;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),url:null,renderer:null,fps:{},checks:[],errors:[],expectedErrors:0,video:null};

// ---- A Pages-like static server ----------------------------------------------------------------

const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json','.wasm':'application/wasm','.glb':'model/gltf-binary','.bin':'application/octet-stream',
  '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ttf':'font/ttf',
  '.md':'text/markdown; charset=utf-8','.txt':'text/plain; charset=utf-8','.xml':'application/xml','.mp4':'video/mp4',
  '.webm':'video/webm','.vtt':'text/vtt; charset=utf-8'};
function headerRules(text){
  const rules=[];let current=null;
  for(const line of text.split('\n')){
    if(!line.trim())continue;
    if(!/^\s/.test(line)){current={pattern:line.trim(),ops:[]};rules.push(current);continue;}
    const entry=line.trim();
    if(entry.startsWith('! '))current.ops.push({remove:entry.slice(2).trim().toLowerCase()});
    else{const i=entry.indexOf(':');current.ops.push({name:entry.slice(0,i).trim(),value:entry.slice(i+1).trim()});}
  }
  return rules.filter(r=>r.pattern.startsWith('/'))
    .map(r=>({...r,re:new RegExp(`^${r.pattern.replace(/[.+?^${}()|[\]\\]/g,'\\$&').replaceAll('*','.*')}$`)}));
}
async function serve(root){
  const rules=headerRules(await readFile(path.join(root,'_headers'),'utf8'));
  const headersFor=pathname=>{
    const set=new Map();
    for(const rule of rules)if(rule.re.test(pathname))for(const op of rule.ops){
      if(op.remove){for(const key of [...set.keys()])if(key.toLowerCase()===op.remove)set.delete(key);continue;}
      const key=[...set.keys()].find(k=>k.toLowerCase()===op.name.toLowerCase());
      if(key)set.set(key,`${set.get(key)}, ${op.value}`);else set.set(op.name,op.value);
    }
    return Object.fromEntries(set);
  };
  const find=async pathname=>{
    const candidates=pathname.endsWith('/')?[`${pathname}index.html`]:[pathname,`${pathname}.html`,`${pathname}/index.html`];
    for(const candidate of candidates){
      const file=path.join(root,candidate),info=await stat(file).catch(()=>null);
      if(info?.isFile())return {file,info};
    }
    return null;
  };
  const server=createServer(async(request,response)=>{
    try{
      const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
      if(pathname.split('/').includes('..')){response.writeHead(400);response.end();return;}
      let found=await find(pathname),status=200;
      if(!found){found=await find('/404.html');status=404;}
      const {file,info}=found,headers={...headersFor(pathname),'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes'};
      let start=0,end=info.size-1;
      const range=status===200&&/^bytes=(\d*)-(\d*)$/.exec(request.headers.range||'');
      if(range&&(range[1]||range[2])){
        if(range[1]==='')start=Math.max(0,info.size-Number(range[2]));
        else{start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),info.size-1):info.size-1;}
        if(start>end||start>=info.size){response.writeHead(416,{'Content-Range':`bytes */${info.size}`});response.end();return;}
        status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
      }
      headers['Content-Length']=String(end-start+1);
      response.writeHead(status,headers);
      if(request.method==='HEAD'){response.end();return;}
      createReadStream(file,{start,end}).pipe(response);
    }catch(error){response.writeHead(500);response.end(String(error));}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  return server;
}

// ---- Helpers -------------------------------------------------------------------------------------

const lab=page=>page.evaluate(()=>window.__lesionLabTest);
const watch=(page,sink)=>{
  page.on('pageerror',error=>sink.push(`pageerror: ${error.message}`));
  page.on('console',message=>{if(message.type()==='error')sink.push(`console: ${message.text()}`);});
};
async function ready(page){
  await page.waitForFunction(()=>window.__lesionLabTest?.ready||window.__lesionLabTest?.error,null,{timeout:60000});
  const state=await lab(page);assert.equal(state.error,null,`lab error: ${state.error}`);
  await page.waitForFunction(()=>window.__lesionLabTest.sphere&&!window.__lesionLabTest.loading);
  return state;
}
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function showStage(page,top=16){
  await page.evaluate(offset=>{const r=document.querySelector('.lab-stage').getBoundingClientRect();window.scrollBy({top:r.top-offset,behavior:'instant'});},top);
  await frame(page);
}
const noOverflow=page=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
const setRange=(page,id,value)=>page.evaluate(([id,value])=>{
  const input=document.getElementById(id);input.value=String(value);
  input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
},[id,value]);
const cutIds=state=>state.rows.filter(r=>r.cut>0).map(r=>r.id).sort();
// Streamlines the sphere cuts are drawn in their saturated DEC tint; spared ones are a desaturated
// ghost grey. Counting chromatic pixels on the stage therefore measures how many streamlines are
// lit, independent of the cut COUNTS (which come from the model, not the shader). A build whose
// bundle lost the MARGIN/CUT exports lit every streamline while the counts stayed right.
async function litPixels(page){
  await frame(page);
  const png=PNG.sync.read(await page.locator('.lab-stage').screenshot());
  let lit=0;
  for(let i=0;i<png.data.length;i+=4){const r=png.data[i],g=png.data[i+1],b=png.data[i+2];if(Math.max(r,g,b)-Math.min(r,g,b)>70)lit++;}
  return lit;
}
// The orbit controls re-derive the camera from spherical coordinates every frame, so an untouched camera drifts by ~1e-14 mm.
const sameCamera=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-3);

/**
 * Drags the sphere along a Lissajous path for DRAG_SECONDS with real mouse input, sent as fast as the browser accepts it
 * so the scene redraws on every frame it can, and times every animation frame in the page.
 */
async function measureDrag(page,label){
  await showStage(page);
  const before=await lab(page),stage=await page.locator('.lab-stage').boundingBox();
  assert(before.sphere,'the sphere is on screen');
  const {x,y}=before.sphere,ax=Math.min(stage.width*.2,150),ay=Math.min(stage.height*.14,80);
  await page.evaluate(()=>{
    window.__lesionLabResetStats();
    const times=[];window.__frameTimes=times;
    const tick=now=>{times.push(now);if(window.__frameTimes===times)requestAnimationFrame(tick);};requestAnimationFrame(tick);
  });
  await page.mouse.move(x,y);await page.mouse.down();
  const started=Date.now();let moves=0,middle=null;
  while(Date.now()-started<DRAG_SECONDS*1000){
    const t=(Date.now()-started)/1000;
    await page.mouse.move(x+ax*Math.sin(2*Math.PI*t/1.6),y+ay*Math.sin(2*Math.PI*t/1.1));moves++;
    if(!middle&&t>DRAG_SECONDS/2)middle=await lab(page);
  }
  await page.mouse.up();
  const times=await page.evaluate(()=>{const times=window.__frameTimes;window.__frameTimes=null;return times;});
  const after=await lab(page);
  const intervals=times.slice(1).map((t,i)=>t-times[i]),sorted=[...intervals].sort((a,b)=>a-b);
  const mean=intervals.reduce((a,b)=>a+b,0)/intervals.length,seconds=(times.at(-1)-times[0])/1000;
  const result={viewport:label,fpsMean:+(1000/mean).toFixed(1),frameP95Ms:+sorted[Math.floor(sorted.length*.95)].toFixed(1),
    framesOver25Ms:intervals.filter(v=>v>25).length,frames:intervals.length,sceneDrawsPerSecond:+((after.scene.frames-before.scene.frames)/seconds).toFixed(1),
    pointerMoves:moves,seconds:+seconds.toFixed(2),classifyMaxMs:+after.classifyMax.toFixed(2),streamlines:after.count,
    duringDrag:(({drawWidth,drawHeight,pixelRatio,interacting,aoEnabled})=>({drawWidth,drawHeight,pixelRatio,interacting,aoEnabled}))(middle.scene.pipeline),
    atRest:(({drawWidth,drawHeight,pixelRatio,interacting,aoEnabled})=>({drawWidth,drawHeight,pixelRatio,interacting,aoEnabled}))(after.scene.pipeline)};
  assert.equal(middle?.dragging,true,'the drag holds the sphere');
  assert.equal(after.dragging,false,'the drag ends on release');
  assert.notDeepEqual(after.centre,before.centre,'dragging moves the sphere');
  assert(sameCamera(after.scene.camera,before.scene.camera),'dragging the sphere does not rotate the view');
  assert(result.fpsMean>=FPS_MIN,`${label}: ${result.fpsMean} fps mean during the drag (needs ${FPS_MIN})`);
  assert(result.sceneDrawsPerSecond>=FPS_MIN,`${label}: the scene redrew ${result.sceneDrawsPerSecond} times a second during the drag (needs ${FPS_MIN})`);
  return result;
}

/**
 * The inverse of measureDrag's camera check: a drag that starts away from the sphere must still
 * reach CameraControls and orbit the view, and must leave the sphere itself untouched. This proves
 * the capture-phase pointerdown on the mount only swallows events that start on the sphere, so main's
 * CameraControls still drives every other drag. Confirms via real DOM hit-testing that the chosen
 * start point actually lands on the canvas, not a status overlay sibling of #atlasCanvas.
 */
async function measureOffSphereDrag(page){
  await showStage(page);
  const before=await lab(page),{x:sx,y:sy,r}=before.sphere,stage=await page.locator('.lab-stage').boundingBox();
  const onCanvas=([cx,cy])=>page.evaluate(([cx,cy])=>!!document.elementFromPoint(cx,cy)?.closest('#atlasCanvas'),[cx,cy]);
  const candidates=[[stage.x+stage.width-24,stage.y+24],[stage.x+24,stage.y+24],
    [stage.x+24,stage.y+stage.height-24],[stage.x+stage.width-24,stage.y+stage.height-24],
    [stage.x+stage.width/2,stage.y+stage.height-16]].filter(([cx,cy])=>Math.hypot(cx-sx,cy-sy)>r+60);
  let picked=null;
  for(const candidate of candidates)if(await onCanvas(candidate)){picked=candidate;break;}
  assert(picked,'found a point off the sphere that hits the canvas, not a status overlay');
  const [x,y]=picked;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x-70,y+45,{steps:8});await page.mouse.move(x-130,y+80,{steps:8});
  await page.mouse.up();
  const after=await lab(page);
  assert(!sameCamera(after.scene.camera,before.scene.camera),'an off-sphere drag still orbits the camera');
  assert.deepEqual(after.centre,before.centre,'an off-sphere drag does not move the sphere');
}

/** Walks every bundle anchor of the current hemisphere, opens every row and returns what the page shows. */
const collectEvidence=page=>page.evaluate(async()=>{
  const select=document.getElementById('anchor'),tick=()=>new Promise(resolve=>setTimeout(resolve,0));
  const facts=new Map(),rows=new Map(),named=new Set(),anchors=[...select.options].filter(o=>o.value).map(o=>o.value);
  for(const value of anchors){
    select.value=value;select.dispatchEvent(new Event('change'));
    for(const details of document.querySelectorAll('#bundleList details'))details.open=true;
    for(let i=0;i<50&&document.querySelector('#bundleList details:not(:has(.lab-bundle-body))');i++)await tick();
    for(const li of document.querySelectorAll('#namedList li'))named.add(li.firstChild.textContent);
    for(const li of document.querySelectorAll('#bundleList li')){
      const id=li.dataset.bundle,body=li.querySelector('.lab-bundle-body'),evidence=li.querySelector('.lab-bundle-evidence');
      rows.set(id,{id,evidence:evidence.textContent,none:evidence.dataset.none==='true',
        applying:body?body.querySelectorAll(':scope > .fact').length:null,other:body?body.querySelectorAll('.lab-other .fact').length:null,
        note:body?.querySelector(':scope > p')?.textContent??null});
      for(const article of li.querySelectorAll('.fact')){
        const rel=article.querySelector('.fact-rel').childNodes,quote=article.querySelector('blockquote p').textContent;
        facts.set(JSON.stringify([id,rel[0].textContent,quote]),{bundle:id,subject:rel[0].textContent,verb:article.querySelector('.verb').textContent,
          object:rel[rel.length-1].textContent,quote,links:[...article.querySelectorAll('.lab-sources a')].map(a=>({text:a.textContent,href:a.href})),
          sources:article.querySelector('.lab-sources').textContent});
      }
    }
    if(!document.querySelector('#bundleList li'))throw Error(`No row after centring on ${value}`);
  }
  for(const details of document.querySelectorAll('#bundleList details'))details.open=false;
  return {anchors,facts:[...facts.values()],rows:[...rows.values()],named:[...named]};
});

function checkEvidence(evidence,hemi){
  const injury=CONNECTION_ROWS.filter(r=>r[1]==='Tract'&&r[2]==='INJURY_CAUSES');
  const rowIds=evidence.rows.map(r=>r.id).sort();
  assert.deepEqual(rowIds,[...evidence.anchors].sort(),`${hemi}: every tested bundle is reached from its own anchor`);
  for(const fact of evidence.facts){
    assert.equal(fact.verb,'injury causes');
    assert(injury.some(r=>r[0]===fact.subject&&r[3]===fact.object&&r[5]===fact.quote),`${hemi} ${fact.bundle}: statement not verbatim in CONNECTION_ROWS: ${fact.quote.slice(0,80)}`);
    for(const link of fact.links){
      const id=/^PMID (\d+)$/.exec(link.text)?.[1];
      assert(id&&link.href===`https://pubmed.ncbi.nlm.nih.gov/${id}/`&&PMID_RECORDS[id],`${hemi} ${fact.bundle}: PMID link ${link.text}`);
    }
    if(!fact.links.length)assert.match(fact.sources,/^No (PMID on the cited slides|slide or PMID recorded for this statement)\.$/);
  }
  for(const object of evidence.named)assert(injury.some(r=>r[3]===object),`${hemi}: named deficit not in the graph: ${object}`);
  let without=0;
  for(const row of evidence.rows){
    const model=evidenceFor(row.id,hemi);
    assert.equal(row.applying,model.applying.length,`${hemi} ${row.id}: statements shown match the quoted graph`);
    assert.equal(row.other,model.other.length,`${hemi} ${row.id}: other-side statements`);
    if(model.applying.length){assert.equal(row.none,false);assert.match(row.evidence,/^\d+ quoted statements?/);}
    else{
      without++;assert.equal(row.none,true);
      assert.equal(row.evidence,model.other.length?`No quoted evidence for a ${hemi==='L'?'left':'right'} hemisphere lesion`:'No quoted evidence',`${hemi} ${row.id}`);
      if(!model.other.length)assert.equal(row.note,'No quoted evidence. The connections graph quotes no statement about injury to this bundle.');
    }
  }
  return {bundles:evidence.rows.length,statementsShown:evidence.facts.length,withoutQuotedEvidence:without,named:evidence.named.length};
}

// ---- Run -----------------------------------------------------------------------------------------

let server=null,buildRoot=null;
let base=arg('url');
const browser=await chromium.launch({headless:true,
  args:process.platform==='darwin'?['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist']:['--enable-gpu','--ignore-gpu-blocklist']});
try{
  if(!base){
    buildRoot=await mkdtemp(path.join(os.tmpdir(),'hodos-lesion-lab-'));
    await buildHodos({out:path.join(buildRoot,'site')});
    server=await serve(path.join(buildRoot,'site'));
    base=`http://127.0.0.1:${server.address().port}`;
  }
  report.url=`${base}/labs/lesion-lab`;

  // Desktop: frame rate, controls, every statement the page can show, URL state.
  {
    const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:2});
    const page=await context.newPage();page.setDefaultTimeout(20000);watch(page,report.errors);
    await page.goto(`${base}/labs/lesion-lab?test=1`,{waitUntil:'domcontentloaded'});
    let state=await ready(page);
    report.renderer=await page.evaluate(()=>{const gl=document.querySelector('#atlasCanvas canvas').getContext('webgl2'),info=gl.getExtension('WEBGL_debug_renderer_info');
      return info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
    assert.equal(state.hemi,'L');assert(cutIds(state).includes('AF_L'),'the opening position cuts the left arcuate fasciculus');
    assert.equal(await page.locator('#anchor').inputValue(),'AF_L');
    assert.match(await page.locator('#labSummary').innerText(),/^Cuts \d+ bundles? · [\d,]+ of [\d,]+ sampled streamlines/);
    assert((await page.locator('footer.source-footer').innerText()).includes('Group reference, not this patient.'));
    assert(await noOverflow(page),'no horizontal overflow at 1440');
    await page.screenshot({path:path.join(out,'desktop-ready.png'),fullPage:true});
    const litReady=await litPixels(page);
    assert(litReady>5000,`the opening position lights streamlines on the stage (${litReady} chromatic px)`);
    report.checks.push(`1440: loads, opens on the left arcuate fasciculus (${litReady} lit px), footer scope line present, no overflow`);

    report.fps.desktop=await measureDrag(page,'1440x900@2x');
    await page.waitForFunction(()=>{const [x,y,z]=window.__lesionLabTest.centre,q=new URLSearchParams(location.search);
      return q.get('x')===String(x)&&q.get('y')===String(y)&&q.get('z')===String(z);});
    report.checks.push(`1440: scripted drag ${report.fps.desktop.fpsMean} fps mean, camera unchanged, URL updated`);

    await measureOffSphereDrag(page);
    report.checks.push('1440: a drag starting off the sphere still orbits the camera and leaves the sphere in place');

    const evidenceL=checkEvidence(await collectEvidence(page),'L');
    await page.locator('[data-hemi="R"]').click();
    await page.waitForFunction(()=>window.__lesionLabTest.hemi==='R'&&!window.__lesionLabTest.loading&&window.__lesionLabTest.sphere);
    state=await lab(page);
    assert(state.centre[0]>=0,'switching hemisphere mirrors the sphere');
    assert(state.rows.every(r=>/_R$/.test(r.id)||!/_[LR]$/.test(r.id)),'right hemisphere rows only');
    assert.equal(await page.locator('#stageLabel').innerText(),'Right hemisphere');
    const evidenceR=checkEvidence(await collectEvidence(page),'R');
    report.evidence={L:evidenceL,R:evidenceR};
    report.checks.push(`Evidence: every row of both hemispheres opened; ${evidenceL.statementsShown+evidenceR.statementsShown} statements shown, all verbatim CONNECTION_ROWS quotes with valid PMID links or a stated gap; ${evidenceL.withoutQuotedEvidence}+${evidenceR.withoutQuotedEvidence} bundles say No quoted evidence`);

    await page.locator('[data-hemi="L"]').click();
    await page.waitForFunction(()=>window.__lesionLabTest.hemi==='L'&&!window.__lesionLabTest.loading);
    await page.selectOption('#anchor','MdLF_L');
    await page.waitForFunction(()=>window.__lesionLabTest.rows.some(r=>r.id==='MdLF_L'&&r.cut>0));
    const mdlf=page.locator('li[data-bundle="MdLF_L"]');
    assert.equal(await mdlf.locator('.lab-bundle-evidence').innerText(),'No quoted evidence');
    await mdlf.locator('summary').click();
    await mdlf.getByText('No quoted evidence. The connections graph quotes no statement about injury to this bundle.').waitFor();
    report.checks.push('MdLF_L (no quote in the graph) shows No quoted evidence and writes no statement');

    await page.selectOption('#anchor','AF_L');
    await page.waitForFunction(()=>window.__lesionLabTest.rows.some(r=>r.id==='AF_L'&&r.cut>0));
    const small=cutIds(await lab(page));
    await setRange(page,'radius',20);
    state=await lab(page);
    assert.equal(state.radius,20);assert.equal(await page.locator('#radiusValue').innerText(),'20 mm');
    assert(small.every(id=>cutIds(state).includes(id)),'a larger sphere at the same centre cuts every bundle the smaller one cut');
    await page.locator('#marginOn').check();
    await page.waitForFunction(()=>window.__lesionLabTest.marginOn);
    assert.equal(await page.locator('#margin').isEnabled(),true);
    await frame(page);
    assert((await page.locator('.lab-ring-margin').getAttribute('points'))?.length>0,'the margin ring is drawn');
    state=await lab(page);
    if(state.rows.some(r=>r.margin>0))assert.match(await page.locator('#labSummary').innerText(),/more within the 5 mm margin/);
    await page.waitForFunction(()=>/[?&]margin=5/.test(location.search)&&/[?&]r=20/.test(location.search));
    report.checks.push('Radius 10 to 20 mm only adds cut bundles; the margin ring draws and counts; URL keeps radius and margin');

    await setRange(page,'radius',3);
    await page.evaluate(()=>{for(const id of ['posX','posY','posZ']){const input=document.getElementById(id);input.value=id==='posX'?input.min:input.max;
      input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}});
    await page.waitForFunction(()=>document.getElementById('labSummary').dataset.empty==='true');
    assert.equal(await page.locator('#bundleList li').count(),0);
    const litEmpty=await litPixels(page);
    assert(litEmpty<litReady*.25,`a sphere that cuts nothing lights no streamline: ${litEmpty} chromatic px vs ${litReady} at the opening position`);
    report.checks.push(`Empty state: a sphere outside the sampled white matter says so, lists no bundle and lights no streamline (${litEmpty} vs ${litReady} px)`);

    await page.selectOption('#anchor','AF_L');await setRange(page,'radius',12);
    await page.waitForFunction(()=>/[?&]r=12/.test(location.search));
    const saved=await lab(page),url=page.url();
    await page.reload({waitUntil:'domcontentloaded'});state=await ready(page);
    assert.deepEqual([state.centre,state.radius,state.marginOn,state.margin],[saved.centre,saved.radius,saved.marginOn,saved.margin]);
    assert.equal(page.url(),url);
    report.checks.push('Reload restores hemisphere, centre, radius and margin from the URL');

    await showStage(page);
    for(const [label,view] of [['Superior','superior'],['Anterior','anterior'],['Medial','medial'],['Lateral','left']]){
      await page.getByRole('button',{name:label,exact:true}).click();
      await page.waitForFunction(view=>window.__lesionLabTest.scene.view===view,view);
      await page.waitForFunction(label=>[...document.querySelectorAll('[data-view]')].find(b=>b.textContent===label).getAttribute('aria-pressed')==='true',label);
    }
    const camera=(await lab(page)).scene.camera;
    await page.locator('#atlasCanvas canvas').focus();await page.keyboard.press('ArrowRight');
    await page.waitForFunction(()=>document.getElementById('viewStatus').textContent==='Free rotation');
    assert(!sameCamera((await lab(page)).scene.camera,camera),'arrow keys rotate the view');
    report.checks.push('Named views press and report; arrow keys rotate to a free view');

    await page.getByRole('button',{name:'Lateral',exact:true}).click();await sleep(500);
    await page.locator('#bundleList summary').first().click();await frame(page);
    await page.screenshot({path:path.join(out,'desktop-margin-open.png'),fullPage:true});
    await page.locator('.lab-stage').screenshot({path:path.join(out,'desktop-stage.png')});
    await context.close();
  }

  // Phone width: frame rate, touch drag, layout.
  {
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
    const page=await context.newPage();page.setDefaultTimeout(20000);watch(page,report.errors);
    await page.goto(`${base}/labs/lesion-lab?test=1`,{waitUntil:'domcontentloaded'});
    await ready(page);
    assert(await noOverflow(page),'no horizontal overflow at 390');
    report.fps.mobile=await measureDrag(page,'390x844@3x');
    await showStage(page);
    const before=await lab(page),cdp=await context.newCDPSession(page),{x,y}=before.sphere;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let i=1;i<=15;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*3,y:y-i*2}]});await sleep(16);}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const after=await lab(page);
    assert.notDeepEqual(after.centre,before.centre,'a touch drag moves the sphere');
    assert(sameCamera(after.scene.camera,before.scene.camera),'a touch drag on the sphere does not rotate the view');
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
    report.checks.push(`390: no overflow, scripted drag ${report.fps.mobile.fpsMean} fps mean, touch drag moves the sphere without rotating`);
    await context.close();
  }

  // Fallback: the 3D atlas fails; the page says so, offers Retry and keeps its method and sources.
  {
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    await context.route('**/atlas_scene.js*',route=>route.abort());
    const page=await context.newPage(),expected=[];watch(page,expected);
    await page.goto(`${base}/labs/lesion-lab?test=1`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__lesionLabTest?.error);
    assert(await page.locator('#retryScene').isVisible());
    assert.match(await page.locator('#sceneStatus').innerText(),/could not load/);
    assert.equal(await page.evaluate(()=>document.getElementById('lesionControls').disabled),true);
    assert(await page.locator('#limitsTitle').isVisible());
    await page.screenshot({path:path.join(out,'fallback.png')});
    report.expectedErrors=expected.length;
    report.checks.push('Atlas failure: status, Retry button, disabled controls, method and sources still readable');
    await context.close();
  }

  if(record)report.video=await recordVideo(base);
  assert.deepEqual(report.errors,[],'no console or page errors');
  report.passed=true;
}catch(error){
  report.passed=false;report.failure=error.stack||String(error);
  process.exitCode=1;
}finally{
  await browser.close();
  server?.close();
  if(buildRoot)await rm(buildRoot,{recursive:true,force:true});
  report.finished=new Date().toISOString();
  await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,renderer:report.renderer,fps:Object.fromEntries(Object.entries(report.fps).map(([k,v])=>[k,{fpsMean:v.fpsMean,frameP95Ms:v.frameP95Ms,framesOver25Ms:v.framesOver25Ms,sceneDrawsPerSecond:v.sceneDrawsPerSecond}])),
    errors:report.errors,checks:report.checks.length,evidence:report.evidence,video:report.video,failure:report.failure,out},null,1));
}

// ---- 30 s recording -----------------------------------------------------------------------------

function tool(name){
  const candidates=[process.env[name.toUpperCase()],name,path.join(os.homedir(),'fsl/bin',name)].filter(Boolean);
  for(const candidate of candidates){try{execFileSync(candidate,['-version'],{stdio:'ignore'});return candidate;}catch{}}
  throw Error(`${name} not found (set ${name.toUpperCase()})`);
}
// Runs in every document of the recording: a caption naming it a screen recording and a ring on the pointer.
function recordingOverlay(){
  const install=()=>{
    if(document.getElementById('recordingCaption'))return;
    const caption=document.createElement('div'),pointer=document.createElement('div');
    caption.id='recordingCaption';pointer.id='recordingPointer';
    caption.textContent='Screen recording · Hodos lesion lab · the yellow ring marks the pointer · group reference, not this patient';
    Object.assign(caption.style,{position:'fixed',left:'50%',bottom:'14px',transform:'translateX(-50%)',zIndex:'2147483647',padding:'7px 14px',
      background:'rgba(19,22,25,.94)',color:'#E4E6E3',font:'500 14px/1.3 system-ui,sans-serif',border:'1px solid #5C6671',borderRadius:'4px',pointerEvents:'none',whiteSpace:'nowrap'});
    Object.assign(pointer.style,{position:'fixed',left:'0',top:'0',width:'30px',height:'30px',margin:'-15px 0 0 -15px',borderRadius:'50%',
      border:'2px solid #F2C94C',background:'rgba(242,201,76,.16)',boxShadow:'0 0 0 1px rgba(0,0,0,.6)',zIndex:'2147483647',pointerEvents:'none',transform:'translate(-60px,-60px)'});
    document.documentElement.append(caption,pointer);
    const place=event=>{pointer.style.transform=`translate(${event.clientX}px,${event.clientY}px)`;};
    addEventListener('pointermove',place,true);
    addEventListener('pointerdown',event=>{place(event);pointer.style.background='rgba(242,201,76,.6)';},true);
    addEventListener('pointerup',()=>{pointer.style.background='rgba(242,201,76,.16)';},true);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
}
async function recordVideo(base){
  const ffmpeg=tool('ffmpeg'),ffprobe=tool('ffprobe'),raw=path.join(out,'video-raw');
  await rm(raw,{recursive:true,force:true});
  const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:raw,size:{width:1440,height:900}}});
  await context.addInitScript(recordingOverlay);
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);watch(page,errors);
  const opened=Date.now();
  let pointer=[720,120];
  // Timed by the wall clock, not by a step count: under CPU load each `mouse.move` round trip is slower,
  // so a glide sends fewer, larger moves instead of stretching the clip.
  const glide=async(to,ms)=>{const [x0,y0]=pointer,t0=Date.now();
    for(let t=0;t<1;){t=Math.min(1,(Date.now()-t0)/ms);const e=t<.5?2*t*t:1-(-2*t+2)**2/2;
      await page.mouse.move(x0+(to[0]-x0)*e,y0+(to[1]-y0)*e);if(t<1)await sleep(14);}
    pointer=to;};
  const centreOf=async locator=>{const box=await locator.boundingBox();return [box.x+box.width/2,box.y+box.height/2];};
  const smoothScroll=async top=>{await page.evaluate(top=>window.scrollBy({top,behavior:'smooth'}),top);await sleep(700);};
  const reveal=async locator=>{if(!await locator.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=70&&r.bottom<=innerHeight-60;})){
    await locator.evaluate(e=>e.scrollIntoView({behavior:'smooth',block:'center'}));await sleep(800);}return centreOf(locator);};
  await page.goto(`${base}/labs/lesion-lab?test=1`,{waitUntil:'domcontentloaded'});
  await ready(page);await showStage(page,60);await page.mouse.move(...pointer);
  // The clip opens on the loaded stage, with the pointer ring already showing. Each step's end time is kept, so an overrun names its step.
  const start=Date.now(),marks=[];
  const mark=step=>marks.push(`${step} ${((Date.now()-start)/1000).toFixed(1)} s`);
  await sleep(700);
  let sphere=(await lab(page)).sphere;
  await glide([sphere.x,sphere.y],600);
  await page.mouse.down();
  await glide([sphere.x+150,sphere.y+95],1600);await sleep(300);
  await glide([sphere.x-120,sphere.y-60],1900);await sleep(200);
  await glide([sphere.x-20,sphere.y+10],900);
  await page.mouse.up();await sleep(700);mark('drag');
  await smoothScroll(300);
  await glide(await centreOf(page.locator('#marginOn')),700);await page.mouse.down();await page.mouse.up();await sleep(700);mark('margin');
  const radius=await page.locator('#radius').boundingBox(),thumb=[radius.x+radius.width*(10-3)/27,radius.y+radius.height/2];
  await glide(thumb,600);await page.mouse.down();await glide([radius.x+radius.width*(17-3)/27,thumb[1]],1000);await page.mouse.up();await sleep(500);mark('radius');
  // Hemisphere: the sphere is mirrored across the midline and the view turns to the right lateral view.
  await glide(await centreOf(page.locator('[data-hemi=R]')),700);await page.mouse.down();await page.mouse.up();
  await page.waitForFunction(()=>{const t=window.__lesionLabTest;return t.hemi==='R'&&!t.loading&&t.scene.view==='right';});mark('hemisphere');await sleep(800);
  await smoothScroll(-300);
  sphere=(await lab(page)).sphere;
  await glide([sphere.x,sphere.y],700);await page.mouse.down();
  await glide([sphere.x+60,sphere.y-70],1400);await page.mouse.up();await sleep(500);mark('right drag');
  await glide(await reveal(page.locator('#bundleList summary').first()),800);await page.mouse.down();await page.mouse.up();await sleep(1600);mark('quote');
  await glide(await reveal(page.getByRole('button',{name:'Superior',exact:true})),700);await page.mouse.down();await page.mouse.up();await sleep(1200);mark('superior');
  await reveal(page.locator('.lab-stage'));
  const stage=await page.locator('.lab-stage').boundingBox();
  await glide([stage.x+stage.width*.18,stage.y+stage.height*.8],700);await page.mouse.down();
  // The closing rotation takes the time the clip has left (1.4 to 5 s), ending about 1.5 s before the clip does.
  await glide([stage.x+stage.width*.34,stage.y+stage.height*.72],Math.min(5000,Math.max(1400,(VIDEO_SECONDS-1.5)*1000-(Date.now()-start))));
  await page.mouse.up();mark('rotate');
  // The clip starts 0.3 s before `start`, so the whole interaction must end by 29.7 s.
  const interactionSeconds=(Date.now()-start)/1000;
  assert(interactionSeconds<=VIDEO_SECONDS-.5,`the scripted interaction (${interactionSeconds.toFixed(1)} s) fits in the ${VIDEO_SECONDS} s clip; steps end at ${marks.join(', ')}`);
  const overlay=await page.evaluate(()=>({caption:document.getElementById('recordingCaption')?.textContent,
    ring:getComputedStyle(document.getElementById('recordingPointer')).transform}));
  assert.equal(overlay.caption,'Screen recording · Hodos lesion lab · the yellow ring marks the pointer · group reference, not this patient');
  const [,,,,ringX,ringY]=overlay.ring.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number);
  assert(Math.abs(ringX-pointer[0])<1&&Math.abs(ringY-pointer[1])<1,`the pointer ring sits at the pointer (${ringX},${ringY} vs ${pointer})`);
  const remaining=VIDEO_SECONDS*1000+700-(Date.now()-start);
  if(remaining>0)await sleep(remaining);
  const video=page.video();
  await context.close();
  const rawFile=await video.path(),offset=Math.max(0,(start-opened)/1000-.3);
  const file=path.join(out,'lesion-lab-recording.mp4');
  execFileSync(ffmpeg,['-y','-loglevel','error','-ss',offset.toFixed(2),'-i',rawFile,'-t',String(VIDEO_SECONDS),'-an','-c:v','libx264','-pix_fmt','yuv420p','-crf','20',
    '-movflags','+faststart','-metadata','title=Screen recording of the Hodos lesion lab (group reference, not this patient)',file]);
  const duration=Number(execFileSync(ffprobe,['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',file],{encoding:'utf8'}).trim());
  assert(Math.abs(duration-VIDEO_SECONDS)<=.5,`recording lasts ${duration} s`);
  assert.deepEqual(errors,[],'no console or page errors during the recording');
  await rm(raw,{recursive:true,force:true});
  report.checks.push(`Recording: ${duration.toFixed(2)} s; interaction ends at ${interactionSeconds.toFixed(1)} s; caption and pointer ring checked in the page`);
  return {file:path.relative(process.cwd(),file),seconds:+duration.toFixed(2),interactionSeconds:+interactionSeconds.toFixed(1),steps:marks};
}
