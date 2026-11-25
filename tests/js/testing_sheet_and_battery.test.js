import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BATTERY_TASKS,
  PRIMARY_TASKS_BY_TRACT,
  tractProtocolsForCutBundles,
  evaluateCustomBattery,
  interrogatedFamiliesForTasks,
  buildTestingSheetData,
} from '../../viewer/testing_model.js';

test('custom battery builder isolates task-specific blind spots and never dims untestable or uncurated bundles', () => {
  assert.equal(BATTERY_TASKS.length, 16);
  assert.equal(Object.keys(PRIMARY_TASKS_BY_TRACT).length, 20);

  const famsNamingOnly = interrogatedFamiliesForTasks('L', ['dulip-object-naming']);
  assert.deepEqual([...famsNamingOnly].sort(), ['IFOF', 'UF']);
  assert.equal(famsNamingOnly.has('AF'), false);
  assert.equal(famsNamingOnly.has('ILF'), false);
  assert.equal(famsNamingOnly.has('VOF'), false);
  assert.equal(famsNamingOnly.has('EMC'), false);

  const sampleRows = [
    {id: 'AF_L', cut: 20, total: 220},
    {id: 'IFOF_L', cut: 18, total: 220},
    {id: 'UF_L', cut: 12, total: 220},
    {id: 'ILF_L', cut: 14, total: 220},
    {id: 'VOF_L', cut: 10, total: 220},
    {id: 'FAT_L', cut: 16, total: 220},
    {id: 'SLF2_L', cut: 13, total: 220},
    {id: 'SLF3_L', cut: 11, total: 220},
    {id: 'EMC_L', cut: 8, total: 220},
    {id: 'CST_L', cut: 15, total: 220},
    {id: 'OR_L', cut: 9, total: 220},
    {id: 'CC', cut: 7, total: 220},
    {id: 'F_L', cut: 5, total: 220},
    {id: 'TR_A_L', cut: 5, total: 220},
    {id: 'DRTT_L', cut: 5, total: 220},
    {id: 'MdLF_L', cut: 8, total: 220},
  ];
  const namingEval = evaluateCustomBattery(sampleRows, 'L', ['dulip-object-naming']);
  assert.equal(namingEval.active, true);
  assert.equal(namingEval.lens.id, 'custom');
  assert.deepEqual(namingEval.interrogatedProtocols.map(p => p.id).sort(), ['ifof-left', 'uf-left']);
  assert.deepEqual(
    namingEval.blindSpotProtocols.map(p => p.id).sort(),
    [
      'af-left',
      'cc-commissural',
      'cst-bilateral',
      'drtt-bilateral',
      'emc-bilateral',
      'fat-left',
      'fornix-bilateral',
      'ilf-vof-left-reading',
      'or-bilateral',
      'slf2-left',
      'slf3-left',
      'tra-bilateral',
    ],
  );
  assert.deepEqual(namingEval.unmatchedCutIds, ['MdLF_L']);

  const withRepetition = evaluateCustomBattery(sampleRows, 'L', ['dulip-object-naming', 'dulip-repetition']);
  assert.deepEqual(withRepetition.interrogatedProtocols.map(p => p.id).sort(), ['af-left', 'ifof-left', 'slf2-left', 'slf3-left', 'uf-left']);

  const withSemanticOddPic = evaluateCustomBattery(sampleRows, 'L', ['dulip-semantic-odd-picture-out']);
  assert(withSemanticOddPic.interrogatedProtocols.some(p => p.id === 'emc-bilateral'));
  assert(withSemanticOddPic.blindSpotProtocols.some(p => p.id === 'cc-commissural'));

  const withReading = evaluateCustomBattery(sampleRows, 'L', ['dulip-object-naming', 'dulip-repetition', 'task-awake-reading']);
  assert(withReading.interrogatedProtocols.some(p => p.id === 'ilf-vof-left-reading'));

  const rightRows = [
    {id: 'SLF2_R', cut: 20, total: 220},
    {id: 'SLF3_R', cut: 18, total: 220},
    {id: 'EMC_R', cut: 12, total: 220},
    {id: 'CC', cut: 10, total: 220},
  ];
  const rightProsody = evaluateCustomBattery(rightRows, 'R', ['task-prosody-social']);
  assert.deepEqual(rightProsody.interrogatedProtocols.map(p => p.id).sort(), ['slf3-right']);
  assert.deepEqual(rightProsody.blindSpotProtocols.map(p => p.id).sort(), ['cc-commissural', 'emc-bilateral', 'slf2-right']);
  const leftProsody = evaluateCustomBattery(sampleRows, 'L', ['task-prosody-social']);
  assert(leftProsody.blindSpotProtocols.some(p => p.id === 'emc-bilateral'));
  assert.deepEqual(tractProtocolsForCutBundles([{id: 'SLF2_R', cut: 50, total: 220}], 'L'), {
    protocols: [],
    unmatchedCutIds: ['SLF2_R'],
  });

  const allSelected = interrogatedFamiliesForTasks('L', BATTERY_TASKS.map(t => t.id));
  assert.equal(allSelected.has('F'), false);
  assert.equal(allSelected.has('TR_A'), false);
  assert.equal(allSelected.has('DRTT'), false);
  assert.equal(allSelected.has('CC'), false);
  assert.equal(allSelected.has('EMC'), true);
  assert.equal(allSelected.has('SLF2'), true);
  assert.equal(allSelected.has('MdLF'), false);

  const emptyEval = evaluateCustomBattery(sampleRows, 'L', ['constructor']);
  assert.equal(emptyEval.active, false);
  assert.deepEqual(tractProtocolsForCutBundles(null, 'L'), {protocols: [], unmatchedCutIds: []});
  assert.equal(evaluateCustomBattery(sampleRows, 'L', null).active, false);
});

test('buildTestingSheetData builds deduplicated 3-column sheet with watermark and zero PHI fields', () => {
  const sampleRows = [
    {id: 'AF_L', cut: 20, total: 220},
    {id: 'IFOF_L', cut: 18, total: 220},
    {id: 'CC', cut: 9, total: 220},
    {id: 'F_L', cut: 5, total: 220},
    {id: 'MdLF_L', cut: 8, total: 220},
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
    'Group reference · Educational draft awaiting clinical review, not patient-specific navigation or an institutional protocol.',
  );
  assert.equal((sheet.watermark.match(/·/g) ?? []).length, 1);
  assert.equal(sheet.lensActive, true);
  assert(sheet.mapTasks.length >= 2);
  assert(sheet.monitorTasks.length >= 2);
  assert(sheet.mapTasks.some(t => t.id === 'dulip-object-naming'));
  assert(!sheet.mapTasks.some(t => t.id === 'dulip-repetition'), 'Blind-spot pathway tasks must not appear in Map column');
  assert.equal(new Set(sheet.mapTasks.map(t => t.id)).size, sheet.mapTasks.length);
  assert.equal(new Set(sheet.monitorTasks.map(t => t.id)).size, sheet.monitorTasks.length);
  assert.deepEqual(sheet.blindSpots.map(b => b.id), ['af-left']);
  assert.equal(sheet.blindSpots[0].isBlindSpot, true);
  const singleCard = buildTestingSheetData({title: 'Single card', protocols: [ev.protocols[0]]});
  assert.equal(singleCard.lensActive, false);
  assert.equal(singleCard.blindSpots[0].isBlindSpot, false);
  assert.deepEqual(sheet.untestable.map(u => u.id), ['cc-commissural', 'fornix-bilateral']);
  assert.deepEqual(sheet.uncurated, ['MdLF_L']);
  assert(sheet.sources.length >= 3 && sheet.sources.every(s => s.url));
  const keys = Object.keys(sheet);
  for (const phi of ['patient', 'mrn', 'dob', 'age', 'surgeon', 'hospital', 'date']) {
    assert(!keys.includes(phi), `Unexpected PHI field ${phi}`);
  }
});
