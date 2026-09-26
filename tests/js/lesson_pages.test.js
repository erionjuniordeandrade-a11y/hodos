import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildHodos} from '../../scripts/build-hodos.mjs';
import {LESSONS,SOURCES,sourceIdsForStep} from '../../viewer/lesson_content.js';
import {extractSingleElement,rootAbsoluteMarkup,validateLessonKeys} from '../../scripts/lesson-pages.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=async(out,name)=>readFile(path.join(out,name),'utf8');
const titleOf=html=>html.match(/<title>([^<]+)<\/title>/)?.[1];
const metaOf=(html,name)=>html.match(new RegExp(`<meta name="${name}" content="([^"]*)">`))?.[1];
const canonicalOf=html=>html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
const jsonLd=html=>[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match=>JSON.parse(match[1]));

function publicPaths(receipt){
  const paths=new Set();
  for(const file of receipt.files){
    if(!file.path.endsWith('.html')){paths.add(`/${file.path}`);continue;}
    const route=file.path.slice(0,-5);
    paths.add(route==='index'?'/':`/${route}`);
  }
  return paths;
}

test('lesson page build emits 14 pages and an index with complete static teaching content',async t=>{
  const temp=await mkdtemp(path.join(os.tmpdir(),'hodos-lesson-pages-'));
  t.after(()=>rm(temp,{recursive:true,force:true}));
  const out=path.join(temp,'site'),receipt=await buildHodos({root,out});
  const index=await read(out,'lessons.html');
  assert.equal(LESSONS.length,14);
  assert.match(index,/<h1>Lessons<\/h1>/);
  assert.match(index,/Lesson text is an educational draft awaiting anatomical review\./);
  assert.equal((index.match(/<li><p class="lesson-index-number">/g)||[]).length,14);
  const pages=await Promise.all(LESSONS.map(async lesson=>({lesson,html:await read(out,`lessons/${lesson.id}.html`)})));
  assert.equal(pages.length,14);
  const titles=pages.map(({html})=>titleOf(html)),descriptions=pages.map(({html})=>metaOf(html,'description')),canonicals=pages.map(({html})=>canonicalOf(html));
  assert.equal(new Set(titles).size,14);
  assert.equal(new Set(descriptions).size,14);
  assert.equal(new Set(canonicals).size,14);
  for(const {lesson,html} of pages){
    assert.equal(titleOf(html),`${escapeHTML(lesson.title)} · Hodos`);
    assert.equal(canonicalOf(html),`https://hodosatlas.com/lessons/${lesson.id}`);
    assert.match(html,new RegExp(`<h1>${escapeHTML(lesson.title)}<\\/h1>`));
    assert.match(html,new RegExp(`${escapeHTML(lesson.category)} · ${lesson.steps.length} relationships, about ${lesson.minutes} minutes`));
    assert.match(html,/<a class="lesson-primary-link" href="\/atlas\?lesson=[a-z0-9-]+">Start this lesson in the atlas<\/a>/);
    assert.match(html,/Lesson text is an educational draft awaiting anatomical review\./);
    for(const step of lesson.steps){
      assert(html.includes(escapeHTML(step.title)),`step title is present: ${lesson.id}/${step.title}`);
      for(const sourceId of sourceIdsForStep(step))assert(html.includes(SOURCES[sourceId].url),`source URL is present: ${lesson.id}/${sourceId}`);
    }
    assert.equal((html.match(/<details class="lesson-explanation"><summary>Explanation<\/summary>/g)||[]).length,lesson.steps.length);
    assert.doesNotMatch(html,/<details class="lesson-explanation" open>/);
    const graphs=jsonLd(html);
    assert.equal(graphs.length,1);
    assert(graphs[0]['@graph'].some(node=>node['@type']==='LearningResource'));
    assert(graphs[0]['@graph'].some(node=>node['@type']==='BreadcrumbList'));
  }
  const indexJSON=jsonLd(index)[0]['@graph'];
  const itemList=indexJSON.find(node=>node['@type']==='ItemList');
  assert.equal(itemList.numberOfItems,14);
  assert.equal(itemList.itemListElement.length,14);
  for(const lesson of LESSONS)assert(index.includes(`href="/lessons/${lesson.id}"`));
  const paths=publicPaths(receipt);
  for(const {lesson,html} of [...pages,{lesson:{id:'index'},html:index}]){
    for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
      const href=match[1];
      if(href.startsWith('#'))continue;
      const url=new URL(href,'https://hodosatlas.com/');
      if(url.origin==='https://hodosatlas.com')assert(paths.has(url.pathname),`generated link is exported: ${lesson.id} -> ${url.pathname}`);
    }
  }
});

test('generated shell, CSP surface and JSON-LD stay static and source-derived',async t=>{
  const temp=await mkdtemp(path.join(os.tmpdir(),'hodos-lesson-shell-'));
  t.after(()=>rm(temp,{recursive:true,force:true}));
  const out=path.join(temp,'site');
  await buildHodos({root,out});
  const sources=await read(out,'atlas-sources.html'),caseConference=await read(out,'case-conference.html');
  const expectedHeader=rootAbsoluteMarkup(extractSingleElement(sources,'header','atlas-sources header'));
  const expectedFooter=rootAbsoluteMarkup(extractSingleElement(caseConference,'footer','case-conference footer','source-footer'));
  for(const name of ['lessons.html',...LESSONS.map(lesson=>`lessons/${lesson.id}.html`)]){
    const html=await read(out,name);
    assert.equal(extractSingleElement(html,'header',`${name} header`),expectedHeader);
    assert.equal(extractSingleElement(html,'footer',`${name} footer`,'source-footer'),expectedFooter);
    assert.doesNotMatch(html,/<style\b|\sstyle=/i);
    for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
      assert.match(match[1],/\btype="application\/ld\+json"/i);
      assert.doesNotThrow(()=>JSON.parse(match[2]));
    }
  }
});

test('unknown lesson or step keys fail the explicit exclusion contract',()=>{
  const lessonExtra=structuredClone(LESSONS);
  lessonExtra[0].unexpectedText='must fail';
  assert.throws(()=>validateLessonKeys(lessonExtra),/Unknown lesson key: unexpectedText/);
  const stepExtra=structuredClone(LESSONS);
  stepExtra[0].steps[0].unexpectedText='must fail';
  assert.throws(()=>validateLessonKeys(stepExtra),/Unknown step motor-cst\/1 key: unexpectedText/);
  const targetExtra=structuredClone(LESSONS);
  targetExtra[0].steps[0].targets[0].unexpectedText='must fail';
  assert.throws(()=>validateLessonKeys(targetExtra),/Unknown target motor-cst\/1 key: unexpectedText/);
  assert.throws(()=>extractSingleElement('<header></header><header></header>','header','atlas-sources header'),/Expected exactly one atlas-sources header, found 2/);
  assert.throws(()=>extractSingleElement('<footer></footer>','footer','case-conference footer','source-footer'),/Expected case-conference footer to have class source-footer/);
});
