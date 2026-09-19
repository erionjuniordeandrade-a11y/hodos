import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {LESSONS,validateLessons} from '../../viewer/lesson_content.js';
import {DISSECTION_PLATES} from '../../viewer/dissection_references.js';

const sha256=buf=>createHash('sha256').update(buf).digest('hex');
const webpSize=buf=>{
  if(buf.toString('ascii',0,4)!=='RIFF'||buf.toString('ascii',8,12)!=='WEBP'||buf.toString('ascii',12,16)!=='VP8 ')throw Error('expected VP8 WebP');
  return {width:buf.readUInt16LE(26)&0x3fff,height:buf.readUInt16LE(28)&0x3fff};
};

test('five distinct source photographs support existing relationships without adding a lesson',()=>{
  assert.equal(LESSONS.length,14);assert.equal(LESSONS.reduce((n,l)=>n+l.steps.length,0),85);
  const uses=LESSONS.flatMap(l=>l.steps.filter(s=>s.referencePlate).map(s=>s.referencePlate));
  assert.equal(uses.length,5);assert.equal(new Set(uses).size,5);
  assert.deepEqual(uses.sort(),Object.keys(DISSECTION_PLATES).sort());
  const module=readFileSync(new URL('../../viewer/dissection_references.js',import.meta.url),'utf8');
  assert.match(module,/reference-plates\/\$\{id\}\.webp\?v=\$\{plate\.sha\}/);
  const manifest=JSON.parse(readFileSync(new URL('../../viewer/reference-plates/manifest.json',import.meta.url)));
  for(const entry of manifest.plates){
    const data=readFileSync(new URL(`../../viewer/reference-plates/${entry.file}`,import.meta.url));
    assert.equal(sha256(data),entry.sha256);assert.equal(data.length,entry.bytes);
    const {width,height}=webpSize(data);assert.equal(width,DISSECTION_PLATES[entry.id].width);
    assert.equal(height,1080);assert.equal(DISSECTION_PLATES[entry.id].slide,entry.slide);
    assert.equal(DISSECTION_PLATES[entry.id].sha,entry.sha256.slice(0,12));
    const png=readFileSync(new URL(`../../viewer/reference-plates/${entry.source_png}`,import.meta.url));
    assert.equal(sha256(png),entry.source_png_sha256);
    assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),height);
  }
});
test('an unknown photograph cannot silently replace an authored comparison',()=>{
  const copy=structuredClone(LESSONS);copy[0].steps[0].referencePlate='missing-image';
  assert.throws(()=>validateLessons(copy),/Unknown dissection reference/);
});
test('the medial frontal case leaves vascular alternatives and recovery uncertainty explicit',()=>{
  const step=LESSONS.find(l=>l.id==='fat-language').steps.at(-1);
  assert.match(step.question,/MEPs/);assert.match(step.answer,/ischaemia|ischemia/);
  assert.match(step.answer,/not.*guarantee|cannot.*guarantee/);assert(step.sources.includes('R11'));
});
