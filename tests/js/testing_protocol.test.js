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
  TEST_LENSES,
  LESION_PRESETS,
  BATTERY_TASKS,
  PRIMARY_TASKS_BY_TRACT,
  PRESET_BY_ID,
  validateTestingRegistry,
  tractProtocolsForCutBundles,
  evaluateTestLens,
  evaluateCustomBattery,
  hudTestingSummary,
  interrogatedFamiliesForLens,
  interrogatedFamiliesForTasks,
  buildTestingSheetData,
  filterProtocols,
  testingStateFromSearch,
  testingStep,
  evaluateDrill,
  parseTestingParams,
} from '../../viewer/testing_model.js';
import {decodeAtlasBundle} from '../../viewer/atlas_data.js';
import {labBundles, packStreamlines, classify, summarize, parseLabParams} from '../../viewer/lesion_model.js';
import {MAP_REGIONS, validateMapCoverage} from '../../viewer/testing_map.js';
import {LESSONS} from '../../viewer/lesson_content.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const tractMeta = JSON.parse(await readFile(path.join(root, 'viewer/atlas/tracts.json'), 'utf8'));
const surfaceMeta = JSON.parse(await readFile(path.join(root, 'viewer/atlas/surface.json'), 'utf8'));
const tractFamilies = new Set(tractMeta.bundles.map(b => (/_[LR]$/.test(b.id) ? b.id.slice(0, -2) : b.id)));
const parcelCodes = new Set(
  Object.values(surfaceMeta.sets.glasser.regions.L)
    .filter(v => /^L_.+_ROI$/.test(v))
    .map(v => v.slice(2, -4)),
);
const lessonIds = new Set(LESSONS.map(l => l.id));

test('testing registry integrity matches tracts.json families, surface.json parcels, lesson IDs, and verified sources', () => {
  assert.equal(REVIEW_STATUS, 'draft');
  assert.match(TESTING_VERSION, /^\d{4}-\d{2}-\d{2}\.\d+$/);
  assert.equal(validateTestingRegistry(tractFamilies, parcelCodes), true);
  assert.equal(TESTING_MODES.length, 5);
  assert.equal(COMPARISON_ROWS.length, 7);
  assert.equal(MODALITIES.length, 7);
  assert.equal(TRACT_PROTOCOLS.length, 16);
  assert.equal(CORTEX_PROTOCOLS.length, 10);
  assert.equal(TARGET_PROTOCOLS.length, 26);
  assert.equal(TEST_LENSES.length, 4);
  assert.equal(LESION_PRESETS.length, 6);
  assert.equal(SCENARIO_DRILLS.length, 5);
  assert.equal(Object.keys(TESTING_SOURCES).length, 25);

  const dulipTasks = TESTING_TASKS.filter(t => t.id.startsWith('dulip-'));
  assert.equal(dulipTasks.length, 17, 'All 17 DuLIP tasks are registered');
  const semanticAssoc = TESTING_TASKS.find(t => t.id === 'dulip-semantic-association');
  assert.equal(semanticAssoc.mode, 'awake-monitoring-resection');
  assert.match(semanticAssoc.caveat, /83\.44%/);

  const oddWordOut = TESTING_TASKS.find(t => t.id === 'dulip-phonological-odd-word-out');
  assert.match(oddWordOut.caveat, /visual/i);

  const pstg = CORTEX_PROTOCOLS.find(p => p.id === 'ctx-pstg-left');
  assert(!pstg.parcels.includes('STGa'), 'posterior STG must not include anterior STGa');

  for (const p of TARGET_PROTOCOLS) {
    assert(lessonIds.has(p.lessonId), `Unknown lessonId ${p.lessonId} on ${p.id}`);
  }
});

test('tractProtocolsForCutBundles matches cut bundles by hemisphere, orders by max cut share, and lists unmatched cuts', () => {
  const rows = [
    {id: 'AF_L', cut: 22, margin: 5, total: 220},
    {id: 'CST_L', cut: 88, margin: 10, total: 220},
    {id: 'F_L', cut: 10, margin: 0, total: 220},
    {id: 'SLF2_R', cut: 50, margin: 0, total: 220},
    {id: 'CC', cut: 33, margin: 0, total: 220},
    {id: 'UF_L', cut: 0, margin: 12, total: 220},
  ];
  const {protocols, unmatchedCutIds} = tractProtocolsForCutBundles(rows, 'L');
  assert.deepEqual(
    protocols.map(m => m.id),
    ['cst-bilateral', 'af-left', 'fornix-bilateral'],
  );
  assert.equal(protocols[0].modeInfo.badge, 'Map');
  assert.equal(protocols[2].modeInfo.badge, 'Corridor only');
  assert.deepEqual(unmatchedCutIds, ['SLF2_R', 'CC']);

  const ilfVof = tractProtocolsForCutBundles([{id: 'VOF_L', cut: 15, margin: 0, total: 100}], 'L');
  assert.deepEqual(ilfVof.protocols.map(m => m.id), ['ilf-vof-left-reading']);
  assert.deepEqual(ilfVof.unmatchedCutIds, []);
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

test('testingStep keeps selectedId synchronized with active matches and resets cleanly on jump', () => {
  let s = testingStateFromSearch('?target=af-left');
  assert.equal(s.selectedId, 'af-left');
  s = testingStep(s, {type: 'set-kind', kind: 'cortex'});
  assert.equal(s.selectedId, 'ctx-ifg-left');
  s = testingStep(s, {type: 'set-query', query: 'no-such-structure-xyz'});
  assert.equal(s.matches.length, 0);
  assert.equal(s.selectedId, null);
  s = testingStep(s, {type: 'jump', targetId: 'fat-left'});
  assert.equal(s.kind, 'all');
  assert.equal(s.query, '');
  assert.equal(s.selectedId, 'fat-left');
});

test('evaluateDrill and parseTestingParams reject unknown IDs and Object.prototype keys', () => {
  const pass = evaluateDrill('drill-sma-fat-mep', 'a');
  assert.equal(pass.correct, true);
  assert.match(pass.rationale, /SMA\/pre-SMA/);

  const fail = evaluateDrill('drill-sma-fat-mep', 'b');
  assert.equal(fail.correct, false);
  assert.equal(fail.correctOptionId, 'a');

  assert.throws(() => evaluateDrill('nope', 'a'), /Unknown drill/);
  assert.throws(() => evaluateDrill('toString', 'a'), /Unknown drill/);
  assert.throws(() => evaluateDrill('constructor', 'a'), /Unknown drill/);
  assert.throws(() => evaluateDrill('drill-sma-fat-mep', 'nope'), /Unknown option/);

  assert.deepEqual(parseTestingParams('?target=af-left&kind=tract&hemi=L&mode=awake-mapping-des&q=phonemic'), {
    target: 'af-left',
    kind: 'tract',
    hemi: 'L',
    mode: 'awake-mapping-des',
    query: 'phonemic',
  });
  assert.deepEqual(parseTestingParams('?target=constructor&kind=weird&hemi=X&mode=toString'), {
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

  const [mapJs, presetsJs] = await Promise.all([
    readFile(path.join(root, 'viewer/testing_map.js'), 'utf8'),
    readFile(path.join(root, 'viewer/testing_presets_data.js'), 'utf8'),
  ]);
  for (const [label, src] of [['testing_map.js', mapJs], ['testing_presets_data.js', presetsJs]]) {
    assert.doesNotMatch(src, /#[0-9a-fA-F]{3,8}\b/, `${label} must use CSS tokens, zero raw hex`);
    assert.doesNotMatch(src, /\bstyle\s*=/i, `${label} must not emit inline style attributes`);
    assert.doesNotMatch(src, /[\u2013\u2014]/, `${label} must contain zero em/en dashes`);
    for (const line of src.split('\n')) {
      assert((line.match(/·/g) ?? []).length <= 1, `${label} max 1 middle dot per line: ${line}`);
    }
  }
  assert.equal(validateMapCoverage(TARGET_PROTOCOLS), true);
  assert(MAP_REGIONS.length >= 26);
});

test('select-map clears narrowing filters so any clicked map region becomes visible and selected', () => {
  let s = testingStateFromSearch('?kind=tract&hemi=L&mode=asleep-mapping&q=corticospinal');
  s = testingStep(s, {type: 'select-map', targetId: 'ctx-pmfg-left'});
  assert.equal(s.selectedId, 'ctx-pmfg-left');
  assert.equal(s.kind, 'all');
  assert.equal(s.query, '');
  assert.equal(s.mode, 'all');
  assert.equal(s.hemi, 'L');
  assert(s.matches.some(m => m.id === 'ctx-pmfg-left'));

  s = testingStep(s, {type: 'set-hemi', hemi: 'L'});
  s = testingStep(s, {type: 'select-map', targetId: 'slf2-right'});
  assert.equal(s.selectedId, 'slf2-right');
  assert.equal(s.hemi, 'R');

  s = testingStep(s, {type: 'set-hemi', hemi: 'R'});
  s = testingStep(s, {type: 'select-map', targetId: 'fornix-bilateral'});
  assert.equal(s.selectedId, 'fornix-bilateral', 'Bilateral map selection keeps selected target');
  assert.equal(s.hemi, 'R', 'Bilateral map selection preserves current hemisphere filter');
});

test('all 6 lesion presets classify real HCP1065 tracts.bin bundles and partition blind spots under test lenses', async () => {
  const bin = (await readFile(path.join(root, 'viewer/atlas/tracts.bin'))).buffer;
  const packs = new Map();
  for (const hemi of ['L', 'R']) {
    const entries = labBundles(tractMeta, hemi).map(b => ({
      id: b.id,
      group: b.group,
      lines: decodeAtlasBundle(b, bin),
    }));
    packs.set(hemi, packStreamlines(entries));
  }
  const runPreset = (presetId, lensId) => {
    const preset = PRESET_BY_ID[presetId];
    assert(preset, `Missing preset ${presetId}`);
    const pack = packs.get(preset.hemi);
    const state = new Uint8Array(pack.count);
    classify(pack, {centre: preset.centre, radius: preset.radius}, state);
    const rows = summarize(pack, state);
    return {
      rows,
      evalResult: evaluateTestLens(rows, preset.hemi, lensId),
      hud: hudTestingSummary(rows, preset.hemi, lensId),
    };
  };

  const allLens = runPreset('left-sma', 'all').evalResult;
  assert.equal(allLens.active, false);
  assert.equal(allLens.interrogatedProtocols.length, 0);
  assert.equal(allLens.blindSpotProtocols.length, 0);

  const smaMep = runPreset('left-sma', 'asleep-mep');
  assert.deepEqual(smaMep.evalResult.interrogatedProtocols.map(p => p.id), ['cst-bilateral']);
  assert(smaMep.evalResult.blindSpotProtocols.some(p => p.id === 'fat-left'));
  assert(smaMep.evalResult.interrogatedBundleIds.includes('CST_L'));
  assert(smaMep.evalResult.blindSpotBundleIds.includes('FAT_L'));
  assert(smaMep.hud.mapCount >= 1 && smaMep.hud.blindCount >= 1);

  const insulaMep = runPreset('left-insula', 'asleep-mep').evalResult;
  assert.equal(insulaMep.interrogatedProtocols.length, 0);
  assert(insulaMep.blindSpotProtocols.some(p => p.id === 'ifof-left'));
  assert(insulaMep.blindSpotProtocols.some(p => p.id === 'uf-left'));
  const insulaNaming = runPreset('left-insula', 'awake-naming').evalResult;
  assert(insulaNaming.interrogatedProtocols.some(p => p.id === 'ifof-left'));
  assert(insulaNaming.interrogatedProtocols.some(p => p.id === 'uf-left'));
  assert(insulaNaming.blindSpotProtocols.some(p => p.id === 'tra-bilateral'));

  const tpNaming = runPreset('left-temporoparietal', 'awake-naming').evalResult;
  assert(tpNaming.interrogatedProtocols.some(p => p.id === 'af-left'));
  assert(tpNaming.blindSpotProtocols.some(p => p.id === 'slf3-left'));

  const otNaming = runPreset('left-occipitotemporal', 'awake-naming').evalResult;
  assert(otNaming.interrogatedProtocols.some(p => p.id === 'ifof-left'));
  assert(otNaming.blindSpotProtocols.some(p => p.id === 'ilf-vof-left-reading'));
  assert(otNaming.blindSpotProtocols.some(p => p.id === 'or-bilateral'));

  for (const lensId of ['asleep-mep', 'awake-naming']) {
    const rp = runPreset('right-parietal', lensId).evalResult;
    assert(rp.blindSpotProtocols.some(p => p.id === 'slf2-right'), `${lensId}: slf2-right blind`);
    assert(rp.blindSpotProtocols.some(p => p.id === 'af-right'), `${lensId}: af-right blind`);
  }

  const tvTailored = runPreset('third-ventricle', 'tailored').evalResult;
  assert.equal(tvTailored.interrogatedProtocols.length, 0);
  const tvBlindIds = tvTailored.blindSpotProtocols.map(p => p.id);
  assert(tvBlindIds.includes('fornix-bilateral'));
  assert(tvBlindIds.includes('tra-bilateral'));
  assert(tvBlindIds.includes('drtt-bilateral'));

  assert.deepEqual([...interrogatedFamiliesForLens('L', 'all')], []);
  assert.deepEqual([...interrogatedFamiliesForLens('L', 'asleep-mep')], ['CST']);
  assert.deepEqual([...interrogatedFamiliesForLens('L', 'awake-naming')].sort(), ['AF', 'IFOF', 'UF']);
  assert.deepEqual([...interrogatedFamiliesForLens('R', 'awake-naming')], []);
  assert.equal(interrogatedFamiliesForLens('L', 'tailored').has('F'), false);
  assert.equal(interrogatedFamiliesForLens('L', 'tailored').has('TR_A'), false);
  assert.equal(interrogatedFamiliesForLens('L', 'tailored').has('DRTT'), false);
  assert.equal(interrogatedFamiliesForLens('L', 'tailored').has('EMC'), false);

  assert.equal(parseLabParams('?lens=asleep-mep&preset=left-sma').lens, 'asleep-mep');
  assert.equal(parseLabParams('?lens=asleep-mep&preset=left-sma').preset, 'left-sma');
  assert.equal(parseLabParams('?lens=constructor&preset=toString').lens, 'all');
  assert.equal(parseLabParams('?lens=constructor&preset=toString').preset, null);
  assert.deepEqual(
    parseLabParams('?tasks=dulip-object-naming,constructor,task-awake-reading,dulip-object-naming').tasks,
    ['dulip-object-naming', 'task-awake-reading'],
  );
  assert.deepEqual(parseLabParams('').tasks, []);
});

test('custom battery builder isolates task-specific blind spots and never dims untestable or uncurated bundles', () => {
  assert.equal(BATTERY_TASKS.length, 16);
  assert.equal(Object.keys(PRIMARY_TASKS_BY_TRACT).length, 16);

  const famsNamingOnly = interrogatedFamiliesForTasks('L', ['dulip-object-naming']);
  assert.deepEqual([...famsNamingOnly].sort(), ['IFOF', 'UF']);
  assert.equal(famsNamingOnly.has('AF'), false);
  assert.equal(famsNamingOnly.has('ILF'), false);
  assert.equal(famsNamingOnly.has('VOF'), false);

  const sampleRows = [
    {id: 'AF_L', cut: 20, total: 220},
    {id: 'IFOF_L', cut: 18, total: 220},
    {id: 'UF_L', cut: 12, total: 220},
    {id: 'ILF_L', cut: 14, total: 220},
    {id: 'VOF_L', cut: 10, total: 220},
    {id: 'FAT_L', cut: 16, total: 220},
    {id: 'SLF3_L', cut: 11, total: 220},
    {id: 'CST_L', cut: 15, total: 220},
    {id: 'OR_L', cut: 9, total: 220},
    {id: 'F_L', cut: 5, total: 220},
    {id: 'TR_A_L', cut: 5, total: 220},
    {id: 'DRTT_L', cut: 5, total: 220},
    {id: 'EMC_L', cut: 8, total: 220},
  ];
  const namingEval = evaluateCustomBattery(sampleRows, 'L', ['dulip-object-naming']);
  assert.equal(namingEval.active, true);
  assert.equal(namingEval.lens.id, 'custom');
  assert.deepEqual(namingEval.interrogatedProtocols.map(p => p.id).sort(), ['ifof-left', 'uf-left']);
  assert.deepEqual(
    namingEval.blindSpotProtocols.map(p => p.id).sort(),
    ['af-left', 'cst-bilateral', 'drtt-bilateral', 'fat-left', 'fornix-bilateral', 'ilf-vof-left-reading', 'or-bilateral', 'slf3-left', 'tra-bilateral'],
  );
  assert.deepEqual(namingEval.unmatchedCutIds, ['EMC_L']);

  const withRepetition = evaluateCustomBattery(sampleRows, 'L', ['dulip-object-naming', 'dulip-repetition']);
  assert.deepEqual(withRepetition.interrogatedProtocols.map(p => p.id).sort(), ['af-left', 'ifof-left', 'slf3-left', 'uf-left']);

  const withReading = evaluateCustomBattery(sampleRows, 'L', ['dulip-object-naming', 'dulip-repetition', 'task-awake-reading']);
  assert(withReading.interrogatedProtocols.some(p => p.id === 'ilf-vof-left-reading'));

  const allSelected = interrogatedFamiliesForTasks('L', BATTERY_TASKS.map(t => t.id));
  assert.equal(allSelected.has('F'), false);
  assert.equal(allSelected.has('TR_A'), false);
  assert.equal(allSelected.has('DRTT'), false);
  assert.equal(allSelected.has('EMC'), false);

  const emptyEval = evaluateCustomBattery(sampleRows, 'L', ['constructor']);
  assert.equal(emptyEval.active, false);
});

test('buildTestingSheetData builds deduplicated 3-column sheet with watermark and zero PHI fields', () => {
  const sampleRows = [
    {id: 'AF_L', cut: 20, total: 220},
    {id: 'IFOF_L', cut: 18, total: 220},
    {id: 'F_L', cut: 5, total: 220},
    {id: 'EMC_L', cut: 8, total: 220},
  ];
  const ev = evaluateCustomBattery(sampleRows, 'L', ['dulip-object-naming']);
  const sheet = buildTestingSheetData({
    title: 'Left temporoparietal',
    subtitle: 'Custom battery',
    hemi: 'L',
    protocols: ev.protocols,
    blindSpotIds: ev.blindSpotProtocols.map(p => p.id),
    interrogatedIds: ev.interrogatedProtocols.map(p => p.id),
    unmatchedCutIds: ev.unmatchedCutIds,
  });
  assert.equal(
    sheet.watermark,
    'Group reference · Educational draft awaiting clinical review · Not patient-specific navigation or an institutional protocol.',
  );
  assert(sheet.mapTasks.length >= 2);
  assert(sheet.monitorTasks.length >= 2);
  assert.equal(new Set(sheet.mapTasks.map(t => t.id)).size, sheet.mapTasks.length);
  assert.equal(new Set(sheet.monitorTasks.map(t => t.id)).size, sheet.monitorTasks.length);
  assert.deepEqual(sheet.blindSpots.map(b => b.id), ['af-left']);
  assert.deepEqual(sheet.untestable.map(u => u.id), ['fornix-bilateral']);
  assert.deepEqual(sheet.uncurated, ['EMC_L']);
  assert(sheet.sources.length >= 3 && sheet.sources.every(s => s.url));
  const keys = Object.keys(sheet);
  for (const phi of ['patient', 'mrn', 'dob', 'age', 'surgeon', 'hospital', 'date']) {
    assert(!keys.includes(phi), `Unexpected PHI field ${phi}`);
  }
});
