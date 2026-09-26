import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LESSONS} from '../../viewer/lesson_content.js';

const html=readFileSync(new URL('../../viewer/index.html',import.meta.url),'utf8');
const ctaId='motor-cst';

test('landing duration copy matches lesson metadata and never says "ten minutes"',()=>{
  assert.equal(LESSONS.length,14);
  const minutes=LESSONS.map(l=>l.minutes);
  const min=Math.min(...minutes),max=Math.max(...minutes);
  const cta=LESSONS.find(l=>l.id===ctaId);
  assert.ok(cta,`CTA lesson ${ctaId} must exist in lesson metadata`);
  assert.match(html,new RegExp(`id="open"[^>]*href="\\./atlas\\.html\\?lesson=${ctaId}"`),
    'the primary CTA must still open the lesson these numbers describe');
  // Printed numbers must trace to freshly computed metadata, not a stale guess: this fails the
  // moment lesson durations drift without the landing copy being updated to match.
  assert.ok(html.includes(`${min} to ${max} minutes`),
    `landing must print the real duration range "${min} to ${max} minutes"`);
  assert.ok(html.includes(`${cta.minutes} minutes`),
    `landing must print the CTA lesson's real duration "${cta.minutes} minutes"`);
  assert.doesNotMatch(html,/ten minutes/i);
});

test('every landing lesson link prints that lesson\'s real duration',()=>{
  const lessons=html.slice(html.indexOf('data-lessons'),html.indexOf('</section>',html.indexOf('data-lessons')));
  const items=[...lessons.matchAll(/<li[^>]*>(.*?)<\/li>/gs)].map(m=>m[1]);
  assert.equal(items.length,14);
  for(const li of items){
    const id=li.match(/lesson=([a-z-]+)/)[1];
    const lesson=LESSONS.find(l=>l.id===id);
    assert.ok(lesson,`unknown lesson ${id}`);
    assert.match(li,new RegExp(`class="lesson-min">${lesson.minutes} min<`),`${id} must print ${lesson.minutes} min`);
  }
});
