import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {LESSONS,validateLessons} from '../../viewer/lesson_content.js';
import {DISSECTION_PLATES} from '../../viewer/dissection_references.js';

test('five distinct source photographs support existing relationships without adding a lesson',()=>{
  assert.equal(LESSONS.length,14);assert.equal(LESSONS.reduce((n,l)=>n+l.steps.length,0),85);
  const uses=LESSONS.flatMap(l=>l.steps.filter(s=>s.referencePlate).map(s=>s.referencePlate));
  assert.equal(uses.length,5);assert.equal(new Set(uses).size,5);
  assert.deepEqual(uses.sort(),Object.keys(DISSECTION_PLATES).sort());
  const manifest=JSON.parse(readFileSync(new URL('../../viewer/reference-plates/manifest.json',import.meta.url)));
  for(const entry of manifest.plates){
    const data=readFileSync(new URL(`../../viewer/reference-plates/${entry.file}`,import.meta.url));
    assert.equal(createHash('sha256').update(data).digest('hex'),entry.sha256);
    assert.equal(data.readUInt32BE(16),DISSECTION_PLATES[entry.id].width);
    assert.equal(data.readUInt32BE(20),1080);assert.equal(DISSECTION_PLATES[entry.id].slide,entry.slide);
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
