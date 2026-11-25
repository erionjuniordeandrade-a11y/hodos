import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  REVIEW_STATUS,
  TESTING_VERSION,
  TESTING_MODES,
  TESTING_SOURCES,
  COMPARISON_ROWS,
  MODALITIES,
  TESTING_TASKS,
  SCENARIO_DRILLS,
  TRACT_PROTOCOLS,
  CORTEX_PROTOCOLS,
  TARGET_PROTOCOLS,
  validateTestingRegistry,
  protocolsForBundles,
  filterProtocols,
  evaluateDrill,
  parseTestingParams,
} from '../../viewer/testing_model.js';
import {LESSONS} from '../../viewer/lesson_content.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const tractMeta = JSON.parse(await readFile(path.join(root, 'viewer/atlas/tracts.json'), 'utf8'));
const tractFamilies = new Set(tractMeta.bundles.map(b => (/_[LR]$/.test(b.id) ? b.id.slice(0, -2) : b.id)));
const lessonIds = new Set(LESSONS.map(l => l.id));

test('testing registry integrity matches tracts.json families, lesson IDs, and verified sources', () => {
  assert.equal(REVIEW_STATUS, 'draft');
  assert.match(TESTING_VERSION, /^\d{4}-\d{2}-\d{2}\.\d+$/);
  assert.equal(validateTestingRegistry(tractFamilies), true);
  assert.equal(TESTING_MODES.length, 5);
  assert.equal(COMPARISON_ROWS.length, 7);
  assert.equal(MODALITIES.length, 7);
  assert.equal(TRACT_PROTOCOLS.length, 16);
  assert.equal(CORTEX_PROTOCOLS.length, 10);
  assert.equal(TARGET_PROTOCOLS.length, 26);
  assert.equal(SCENARIO_DRILLS.length, 5);
  assert.equal(Object.keys(TESTING_SOURCES).length, 25);

  const dulipTasks = TESTING_TASKS.filter(t => t.id.startsWith('dulip-'));
  assert.equal(dulipTasks.length, 17, 'All 17 DuLIP tasks are registered');
  const semanticAssoc = TESTING_TASKS.find(t => t.id === 'dulip-semantic-association');
  assert.equal(semanticAssoc.mode, 'awake-monitoring-resection');
  assert.match(semanticAssoc.caveat, /83\.44%/);

  const oddWordOut = TESTING_TASKS.find(t => t.id === 'dulip-phonological-odd-word-out');
  assert.match(oddWordOut.caveat, /visual/i);

  for (const p of TARGET_PROTOCOLS) {
    assert(lessonIds.has(p.lessonId), `Unknown lessonId ${p.lessonId} on ${p.id}`);
  }
});

test('protocolsForBundles matches cut bundles by hemisphere and orders by max cut share', () => {
  const rows = [
    {id: 'AF_L', cut: 22, margin: 5, total: 220},
    {id: 'CST_L', cut: 88, margin: 10, total: 220},
    {id: 'F_L', cut: 10, margin: 0, total: 220},
    {id: 'SLF2_R', cut: 50, margin: 0, total: 220},
    {id: 'UF_L', cut: 0, margin: 12, total: 220},
  ];
  const matchedL = protocolsForBundles(rows, 'L');
  assert.deepEqual(
    matchedL.map(m => m.id),
    ['cst-bilateral', 'af-left', 'fornix-bilateral'],
    'Should match cut left/bilateral tracts ordered by share, ignoring margin-only UF_L and right-only SLF2_R',
  );
  assert.equal(matchedL[0].modeInfo.badge, 'Map');
  assert.equal(matchedL[2].modeInfo.badge, 'Corridor only');

  const ilfVof = protocolsForBundles([{id: 'VOF_L', cut: 15, margin: 0, total: 100}], 'L');
  assert.deepEqual(ilfVof.map(m => m.id), ['ilf-vof-left-reading']);
});

test('filterProtocols narrows by kind, hemisphere, mode, and search query', () => {
  assert.equal(filterProtocols({kind: 'cortex'}).length, 10);
  assert.equal(filterProtocols({kind: 'tract'}).length, 16);

  const rightTracts = filterProtocols({kind: 'tract', hemi: 'R'});
  assert(rightTracts.some(p => p.id === 'slf2-right'));
  assert(rightTracts.some(p => p.id === 'cst-bilateral'));
  assert(!rightTracts.some(p => p.id === 'af-left'));

  const untestable = filterProtocols({mode: 'untestable-anatomy-only'});
  assert.deepEqual(
    untestable.map(p => p.id),
    ['or-bilateral', 'fornix-bilateral', 'tra-bilateral', 'drtt-bilateral'],
  );

  const byParcel = filterProtocols({query: '55b'});
  assert.deepEqual(byParcel.map(p => p.id), ['ctx-pmfg-left']);

  const byTrap = filterProtocols({query: '83.44%'});
  assert.deepEqual(byTrap.map(p => p.id), ['ifof-left']);
});

test('evaluateDrill grades options and rejects unknown IDs', () => {
  const pass = evaluateDrill('drill-sma-fat-mep', 'a');
  assert.equal(pass.correct, true);
  assert.match(pass.rationale, /SMA\/pre-SMA/);

  const fail = evaluateDrill('drill-sma-fat-mep', 'b');
  assert.equal(fail.correct, false);
  assert.equal(fail.correctOptionId, 'a');

  assert.throws(() => evaluateDrill('nope', 'a'));
  assert.throws(() => evaluateDrill('drill-sma-fat-mep', 'nope'));
});

test('parseTestingParams validates query bounds and rejects garbage', () => {
  assert.deepEqual(parseTestingParams('?target=af-left&kind=tract&hemi=L&mode=awake-mapping-des&q=phonemic'), {
    target: 'af-left',
    kind: 'tract',
    hemi: 'L',
    mode: 'awake-mapping-des',
    query: 'phonemic',
  });
  assert.deepEqual(parseTestingParams('?target=bad&kind=weird&hemi=X&mode=fake'), {
    target: null,
    kind: 'all',
    hemi: 'all',
    mode: 'all',
    query: '',
  });
});

test('testing.css has zero raw hex colors, testing.html obeys strict CSP, and UI text has zero em/en dashes', async () => {
  const [css, html, js, labCss] = await Promise.all([
    readFile(path.join(root, 'viewer/testing.css'), 'utf8'),
    readFile(path.join(root, 'viewer/testing.html'), 'utf8'),
    readFile(path.join(root, 'viewer/testing.js'), 'utf8'),
    readFile(path.join(root, 'viewer/lesion-lab.css'), 'utf8'),
  ]);
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, 'testing.css must use tokens only, zero raw hex');
  assert.doesNotMatch(labCss, /#[0-9a-fA-F]{3,8}\b/, 'lesion-lab.css must remain free of raw hex');
  assert.doesNotMatch(html, /\sstyle=/i, 'testing.html must not contain inline style attributes');
  const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/gi)].filter(
    m => !/\btype\s*=\s*(['"])application\/ld\+json\1/i.test(m[1]),
  );
  assert.equal(inlineScripts.length, 0, 'testing.html must not contain executable inline scripts');
  assert.doesNotMatch(html, /[\u2013\u2014]/, 'testing.html must contain zero em/en dashes');
  assert.doesNotMatch(js, /[\u2013\u2014]/, 'testing.js must contain zero em/en dashes');
});
