import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LESSONS} from '../../viewer/lesson_content.js';
import {sitemapPathsFromExport} from '../../scripts/public-routes.mjs';
import {censusMismatches,lessonCensus} from '../../scripts/lesson-census.mjs';

const PRE_CONNECTIONS = [
  'index.html', 'atlas.html', 'atlas-sources.html', 'case-conference.html', 'mips.html', 'lessons.html', '404.html',
];

test('sitemap paths follow exported HTML and skip the 404 page', () => {
  const names = [...PRE_CONNECTIONS, 'connections.html', 'labs/lesion-lab.html', 'lessons/motor-cst.html'];
  assert.deepEqual(sitemapPathsFromExport(names), [
    '/', '/atlas', '/atlas-sources', '/case-conference', '/mips', '/lessons', '/connections', '/labs/lesion-lab', '/lessons/motor-cst',
  ]);
});

test('the pre-connections export list is missing the page that shipped in 2f4e41b', () => {
  const withConnections = [...PRE_CONNECTIONS, 'connections.html'];
  const stale = sitemapPathsFromExport(PRE_CONNECTIONS);
  const derived = sitemapPathsFromExport(withConnections);
  assert.deepEqual(derived.filter(route => !stale.includes(route)), ['/connections']);
});

test('lesson census is the step total the lesson pages call relationships', () => {
  assert.deepEqual(lessonCensus(LESSONS), {lessons: 14, relationships: 85});
});

test('the pre-wave2 README sentence disagrees with the lesson census', () => {
  const mismatches = censusMismatches(
    'Ten lessons connect 58 anatomical relationships through Orient, Compare and Explain phases.',
    lessonCensus(LESSONS),
  );
  assert.deepEqual(mismatches.map(item => [item.kind, item.stated, item.actual]), [
    ['lessons', 10, 14],
    ['relationships', 58, 85],
  ]);
});

test('README and CLAUDE state the live lesson census', async () => {
  const census = lessonCensus(LESSONS);
  for (const file of ['README.md', 'CLAUDE.md']) {
    const text = await readFile(new URL(`../../${file}`, import.meta.url), 'utf8');
    assert.deepEqual(censusMismatches(text, census), [], file);
  }
});
