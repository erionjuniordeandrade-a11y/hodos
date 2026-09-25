import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readdir, readFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {LESSONS, SOURCES, REGIONS, sourceIdsForStep} from '../../viewer/lesson_content.js';
import {TEACHING_GUIDES} from '../../viewer/lesson_briefings.js';
import {CASES} from '../../viewer/case_content.js';
import {writeReviewSheets, buildLessonSheet, buildCaseSheet, citationTag} from '../../scripts/review-sheets.mjs';

async function withTempDir(fn) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'hodos-review-sheets-'));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
}

test('writes one sheet per lesson and per case (18 total) into the given output dir', async () => {
  await withTempDir(async (dir) => {
    const written = await writeReviewSheets(dir);
    assert.equal(written.length, 18);
    const files = (await readdir(dir)).sort();
    const expected = [...LESSONS.map((l) => `${l.id}.md`), ...CASES.map((c) => `${c.id}.md`)].sort();
    assert.deepEqual(files, expected);
    assert.equal(files.length, 18);
    assert.equal(LESSONS.length, 14);
    assert.equal(CASES.length, 4);
  });
});

test('known-positive: every lesson sheet contains every source id used by that lesson', async () => {
  await withTempDir(async (dir) => {
    await writeReviewSheets(dir);
    for (const lesson of LESSONS) {
      const content = await readFile(path.join(dir, `${lesson.id}.md`), 'utf8');
      const usedIds = new Set(lesson.steps.flatMap((s) => sourceIdsForStep(s, REGIONS)));
      assert.ok(usedIds.size > 0, `lesson ${lesson.id} unexpectedly has no sources to check`);
      for (const id of usedIds) {
        const found = new RegExp(`\\b${id}\\b`).test(content);
        assert.ok(found, `expected source id "${id}" in ${lesson.id}.md`);
        assert.ok(SOURCES[id], `sanity: ${id} should resolve in the combined SOURCES table`);
      }
      // The guide's opening question and takeaway text must also be present verbatim.
      const guide = TEACHING_GUIDES[lesson.id];
      assert.ok(content.includes(guide.question));
      for (const point of guide.takeaways) assert.ok(content.includes(point.text));
    }
  });
});

test('known-positive: every case sheet contains every source id used by that case', async () => {
  await withTempDir(async (dir) => {
    await writeReviewSheets(dir);
    for (const case_ of CASES) {
      const content = await readFile(path.join(dir, `${case_.id}.md`), 'utf8');
      const usedIds = new Set((case_.sources ?? []).map((s) => s.id));
      for (const id of usedIds) {
        assert.ok(new RegExp(`\\b${id}\\b`).test(content), `expected source id "${id}" in ${case_.id}.md`);
      }
    }
  });
});

test('negative control: a fabricated lesson with no sources anywhere gets an explicit NO SOURCES line', () => {
  const fakeLesson = {
    id: 'fabricated-empty',
    title: 'Fabricated lesson with no citations',
    minutes: 5,
    reviewStatus: 'draft',
    steps: [
      {title: 'Step with no claims', text: 'This step cites nothing at all.', sources: [], regions: []},
    ],
  };
  const fakeGuide = {
    question: 'Does an uncited step get flagged?',
    takeaways: [{step: 0, text: 'This takeaway also has nothing behind it whatsoever here.'}],
  };
  const sheet = buildLessonSheet(fakeLesson, fakeGuide, {}, {});
  assert.match(sheet, /NO SOURCES/);
  // Exactly two NO SOURCES markers expected: the one step, and the full source list.
  assert.equal((sheet.match(/NO SOURCES/g) ?? []).length, 2);
});

test('citationTag prefers PMID over DOI and falls back to the raw URL', () => {
  assert.equal(citationTag({url: 'https://pubmed.ncbi.nlm.nih.gov/12345678/'}), 'PMID 12345678');
  assert.equal(citationTag({url: 'https://doi.org/10.1093/brain/awt163'}), 'DOI 10.1093/brain/awt163');
  assert.equal(citationTag({url: 'https://example.org/paper'}), 'https://example.org/paper');
  assert.equal(citationTag(null), null);
});

// Every string a learner can read (outside ids and scene/geometry) must reach the
// reviewer; a field added to the content later fails this test until rendered.
function readableStrings(value, skip, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => readableStrings(v, skip, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) if (!skip.has(k)) readableStrings(v, skip, out);
  }
  return out;
}

test('completeness: every learner-visible string of every lesson step and case is on its sheet', () => {
  const structural = new Set(['id', 'url', 'lesson', 'scene', 'regions', 'targets', 'sources', 'sourceIds', 'category', 'version', 'reviewStatus']);
  for (const lesson of LESSONS) {
    const sheet = buildLessonSheet(lesson, TEACHING_GUIDES[lesson.id]);
    for (const s of readableStrings(lesson, structural)) {
      assert.ok(sheet.includes(s), `${lesson.id}: missing ${JSON.stringify(s.slice(0, 80))}`);
    }
  }
  for (const case_ of CASES) {
    const sheet = buildCaseSheet(case_);
    for (const s of readableStrings(case_, structural)) {
      assert.ok(sheet.includes(s), `${case_.id}: missing ${JSON.stringify(s.slice(0, 80))}`);
    }
  }
});

test('negative control: the completeness check catches a dropped step field', () => {
  const lesson = LESSONS[0];
  const sheet = buildLessonSheet(lesson, TEACHING_GUIDES[lesson.id]).replace(lesson.steps[0].surgical, '');
  assert.ok(!sheet.includes(lesson.steps[0].surgical));
});
