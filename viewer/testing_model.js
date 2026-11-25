import {
  REVIEW_STATUS,
  TESTING_VERSION,
  TESTING_MODES,
  TESTING_SOURCES,
  COMPARISON_ROWS,
  MODALITIES,
  TESTING_TASKS,
  SCENARIO_DRILLS,
} from './testing_protocol_data.js';
import {TRACT_PROTOCOLS, CORTEX_PROTOCOLS, TARGET_PROTOCOLS} from './testing_targets_data.js';
import {TEST_LENSES, LESION_PRESETS, BATTERY_TASKS, PRIMARY_TASKS_BY_TRACT} from './testing_presets_data.js';
import {TESTING_SHEET_WATERMARK, buildTestingSheetData} from './testing_sheet_model.js';
import {
  BATTERY_TASK_BY_ID,
  tractProtocolsForCutBundles,
  interrogatedFamiliesForLens,
  interrogatedFamiliesForTasks,
  evaluateTestLens,
  evaluateCustomBattery,
  hudTestingSummary,
} from './testing_lens_model.js';

export {
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
  BATTERY_TASK_BY_ID,
  TESTING_SHEET_WATERMARK,
  buildTestingSheetData,
  tractProtocolsForCutBundles,
  interrogatedFamiliesForLens,
  interrogatedFamiliesForTasks,
  evaluateTestLens,
  evaluateCustomBattery,
  hudTestingSummary,
};

const VALID_EVIDENCE = new Set([
  'atlas',
  'reconstruction',
  'association',
  'schematic',
  'recovery_overlay',
  'functional_measurement',
  'model_metric',
  'experimental_anatomy',
  'conceptual_model',
]);
const VALID_KINDS = new Set(['all', 'tract', 'cortex']);
const VALID_HEMIS = new Set(['all', 'L', 'R']);
const SOURCE_URL_RE = /^https:\/\/(?:pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/?|doi\.org\/10\.\d{4,9}\/\S+)$/;

const nullMap = pairs => Object.freeze(Object.assign(Object.create(null), Object.fromEntries(pairs)));

export const MODE_BY_ID = nullMap(TESTING_MODES.map(m => [m.id, m]));
export const TASK_BY_ID = nullMap(TESTING_TASKS.map(t => [t.id, t]));
export const PROTOCOL_BY_ID = nullMap(TARGET_PROTOCOLS.map(p => [p.id, p]));
export const DRILL_BY_ID = nullMap(SCENARIO_DRILLS.map(d => [d.id, d]));
export const LENS_BY_ID = nullMap(TEST_LENSES.map(l => [l.id, l]));
export const PRESET_BY_ID = nullMap(LESION_PRESETS.map(p => [p.id, p]));

export const modeOf = id => (typeof id === 'string' ? MODE_BY_ID[id] ?? null : null);
export const taskOf = id => (typeof id === 'string' ? TASK_BY_ID[id] ?? null : null);
export const protocolOf = id => (typeof id === 'string' ? PROTOCOL_BY_ID[id] ?? null : null);
export const lensOf = id => (typeof id === 'string' ? LENS_BY_ID[id] ?? null : null);
export const presetOf = id => (typeof id === 'string' ? PRESET_BY_ID[id] ?? null : null);

function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, out);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) collectStrings(v, out);
  return out;
}

export function validateTestingRegistry(tractFamilies = null, parcelCodes = null) {
  const familySet = tractFamilies ? new Set(tractFamilies) : null;
  const parcelSet = parcelCodes ? new Set(parcelCodes) : null;
  if (TESTING_MODES.length !== 5) throw new Error(`Expected 5 testing modes, found ${TESTING_MODES.length}`);
  const modeIds = new Set(TESTING_MODES.map(m => m.id));
  if (modeIds.size !== TESTING_MODES.length) throw new Error('Duplicate mode id');

  const seenUrls = new Set();
  for (const [id, src] of Object.entries(TESTING_SOURCES)) {
    if (src.id !== id || !src.title || !src.scope || !VALID_EVIDENCE.has(src.evidenceClass)) {
      throw new Error(`Invalid testing source ${id}`);
    }
    if (!SOURCE_URL_RE.test(src.url)) throw new Error(`Source ${id} must link to PubMed or DOI: ${src.url}`);
    const canonical = src.url.toLowerCase().replace(/\/$/, '');
    if (seenUrls.has(canonical)) throw new Error(`Duplicate source URL on ${id}`);
    seenUrls.add(canonical);
  }

  const taskIds = new Set();
  for (const task of TESTING_TASKS) {
    if (!task.id || taskIds.has(task.id)) throw new Error(`Duplicate or missing task id: ${task.id}`);
    taskIds.add(task.id);
    if (!modeIds.has(task.mode)) throw new Error(`Invalid mode ${task.mode} on task ${task.id}`);
    if (!task.sourceIds.length || task.sourceIds.some(id => !TESTING_SOURCES[id])) {
      throw new Error(`Unresolved source on task ${task.id}`);
    }
  }

  for (const mod of MODALITIES) {
    if (!mod.sourceIds.length || mod.sourceIds.some(id => !TESTING_SOURCES[id])) {
      throw new Error(`Unresolved source on modality ${mod.id}`);
    }
  }

  const protocolIds = new Set();
  for (const p of TARGET_PROTOCOLS) {
    if (!p.id || protocolIds.has(p.id)) throw new Error(`Duplicate or missing protocol id: ${p.id}`);
    protocolIds.add(p.id);
    if (p.kind !== 'tract' && p.kind !== 'cortex') throw new Error(`Invalid protocol kind on ${p.id}`);
    if (!['L', 'R', 'both'].includes(p.hemi)) throw new Error(`Invalid hemi on ${p.id}`);
    if (!modeIds.has(p.mode)) throw new Error(`Invalid primary mode on ${p.id}`);
    for (const sm of p.secondaryModes) if (!modeIds.has(sm)) throw new Error(`Invalid secondary mode ${sm} on ${p.id}`);
    for (const tid of [...p.mappingTasks, ...p.monitoringTasks]) {
      if (!taskIds.has(tid)) throw new Error(`Unresolved task ${tid} on ${p.id}`);
    }
    if (!p.sourceIds.length || p.sourceIds.some(id => !TESTING_SOURCES[id])) {
      throw new Error(`Unresolved source on ${p.id}`);
    }
    if (p.kind === 'tract') {
      if (!p.families.length) throw new Error(`Tract protocol ${p.id} requires families`);
      if (familySet) {
        for (const f of p.families) if (!familySet.has(f)) throw new Error(`Unknown tract family ${f} on ${p.id}`);
      }
    } else {
      if (!p.parcels.length) throw new Error(`Cortex protocol ${p.id} requires parcels`);
      if (parcelSet) {
        for (const code of p.parcels) if (!parcelSet.has(code)) throw new Error(`Unknown parcel code ${code} on ${p.id}`);
      }
    }
  }

  const drillIds = new Set();
  for (const drill of SCENARIO_DRILLS) {
    if (!drill.id || drillIds.has(drill.id)) throw new Error(`Duplicate drill id: ${drill.id}`);
    drillIds.add(drill.id);
    if (!protocolIds.has(drill.targetId)) throw new Error(`Unknown targetId ${drill.targetId} on drill ${drill.id}`);
    const correctCount = drill.options.filter(o => o.correct).length;
    if (drill.options.length < 2 || correctCount !== 1) throw new Error(`Drill ${drill.id} must have >=2 options and 1 correct`);
    if (!drill.sourceIds.length || drill.sourceIds.some(id => !TESTING_SOURCES[id])) {
      throw new Error(`Unresolved source on drill ${drill.id}`);
    }
  }

  const lensIds = new Set();
  for (const lens of TEST_LENSES) {
    if (!lens.id || lensIds.has(lens.id)) throw new Error(`Duplicate or missing lens id: ${lens.id}`);
    lensIds.add(lens.id);
    if (!lens.label || !lens.shortLabel || !lens.summary) throw new Error(`Missing fields on lens ${lens.id}`);
    if (lens.interrogates !== null) {
      if (!Array.isArray(lens.interrogates)) throw new Error(`Lens ${lens.id} interrogates must be array or null`);
      for (const pid of lens.interrogates) {
        const p = PROTOCOL_BY_ID[pid];
        if (!p || p.kind !== 'tract' || p.mode === 'untestable-anatomy-only') {
          throw new Error(`Invalid interrogated protocol ${pid} on lens ${lens.id}`);
        }
      }
    }
  }

  const presetIds = new Set();
  for (const preset of LESION_PRESETS) {
    if (!preset.id || presetIds.has(preset.id)) throw new Error(`Duplicate or missing preset id: ${preset.id}`);
    presetIds.add(preset.id);
    if (!preset.label || !preset.note) throw new Error(`Missing label or note on preset ${preset.id}`);
    if (preset.hemi !== 'L' && preset.hemi !== 'R') throw new Error(`Invalid hemi on preset ${preset.id}`);
    if (!Array.isArray(preset.centre) || preset.centre.length !== 3 || !preset.centre.every(Number.isFinite)) {
      throw new Error(`Invalid centre coordinates on preset ${preset.id}`);
    }
    if (!Number.isFinite(preset.radius) || preset.radius < 3 || preset.radius > 30) {
      throw new Error(`Invalid radius on preset ${preset.id}`);
    }
    if (!lensIds.has(preset.defaultLens)) throw new Error(`Invalid defaultLens ${preset.defaultLens} on preset ${preset.id}`);
  }

  const batteryIds = new Set();
  for (const task of BATTERY_TASKS) {
    if (!task.id || batteryIds.has(task.id)) throw new Error(`Duplicate or missing battery task id: ${task.id}`);
    batteryIds.add(task.id);
    if (!taskIds.has(task.id)) throw new Error(`Battery task ${task.id} missing from TESTING_TASKS`);
    if (!task.shortLabel || (task.group !== 'asleep' && task.group !== 'awake')) {
      throw new Error(`Invalid battery task metadata on ${task.id}`);
    }
  }

  for (const p of TRACT_PROTOCOLS) {
    const primary = PRIMARY_TASKS_BY_TRACT[p.id];
    if (!Array.isArray(primary)) throw new Error(`Missing PRIMARY_TASKS_BY_TRACT entry for ${p.id}`);
    if (p.mode === 'untestable-anatomy-only' && primary.length > 0) {
      throw new Error(`Untestable tract ${p.id} must have empty primary task list`);
    }
    for (const tid of primary) {
      if (!taskIds.has(tid)) throw new Error(`Unknown task ${tid} in PRIMARY_TASKS_BY_TRACT[${p.id}]`);
      if (!batteryIds.has(tid)) throw new Error(`Task ${tid} in PRIMARY_TASKS_BY_TRACT[${p.id}] missing from BATTERY_TASKS`);
    }
  }

  for (const s of collectStrings([
    TESTING_MODES,
    TESTING_SOURCES,
    COMPARISON_ROWS,
    MODALITIES,
    TESTING_TASKS,
    TARGET_PROTOCOLS,
    SCENARIO_DRILLS,
    TEST_LENSES,
    LESION_PRESETS,
    BATTERY_TASKS,
    PRIMARY_TASKS_BY_TRACT,
  ])) {
    if (/[\u2013\u2014]/.test(s)) throw new Error(`Em/en dash prohibited in testing data: ${s.slice(0, 60)}`);
    for (const line of s.split('\n')) {
      if ((line.match(/·/g) ?? []).length > 1) throw new Error(`At most one middle dot per line: ${line.slice(0, 60)}`);
    }
  }
  return true;
}

validateTestingRegistry();

export function filterProtocols({kind = 'all', hemi = 'all', mode = 'all', query = ''} = {}) {
  const safeKind = VALID_KINDS.has(kind) ? kind : 'all';
  const safeHemi = VALID_HEMIS.has(hemi) ? hemi : 'all';
  const safeMode = mode === 'all' || modeOf(mode) ? mode : 'all';
  const q = String(query ?? '').trim().toLowerCase();

  return TARGET_PROTOCOLS.filter(p => {
    if (safeKind !== 'all' && p.kind !== safeKind) return false;
    if (safeHemi !== 'all' && p.hemi !== 'both' && p.hemi !== safeHemi) return false;
    if (safeMode !== 'all' && p.mode !== safeMode && !p.secondaryModes.includes(safeMode)) return false;
    if (!q) return true;
    const taskText = [...p.mappingTasks, ...p.monitoringTasks]
      .map(id => taskOf(id)?.name ?? '')
      .join(' ');
    const hay = [
      p.id,
      p.name,
      ...p.families,
      ...p.parcels,
      p.execution,
      p.errorSignature,
      p.blindSpot,
      taskText,
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

export function testingStateFromSearch(search = '') {
  const initial = parseTestingParams(search);
  return testingStep(
    {kind: 'all', hemi: 'all', mode: 'all', query: '', selectedId: TARGET_PROTOCOLS[0].id},
    {type: 'init', params: initial},
  );
}

export function testingStep(prev, action) {
  let next = {...prev};
  switch (action?.type) {
    case 'init': {
      const p = action.params ?? {};
      next = {
        kind: VALID_KINDS.has(p.kind) ? p.kind : 'all',
        hemi: VALID_HEMIS.has(p.hemi) ? p.hemi : 'all',
        mode: p.mode === 'all' || modeOf(p.mode) ? p.mode : 'all',
        query: typeof p.query === 'string' ? p.query.slice(0, 120) : '',
        selectedId: protocolOf(p.target) ? p.target : TARGET_PROTOCOLS[0].id,
      };
      break;
    }
    case 'set-kind':
      next.kind = VALID_KINDS.has(action.kind) ? action.kind : 'all';
      break;
    case 'set-hemi':
      next.hemi = VALID_HEMIS.has(action.hemi) ? action.hemi : 'all';
      break;
    case 'set-mode':
      next.mode = action.mode === 'all' || modeOf(action.mode) ? action.mode : 'all';
      break;
    case 'set-query':
      next.query = String(action.query ?? '').slice(0, 120);
      break;
    case 'select':
      if (protocolOf(action.targetId)) next.selectedId = action.targetId;
      break;
    case 'jump':
      if (protocolOf(action.targetId)) {
        next = {kind: 'all', hemi: 'all', mode: 'all', query: '', selectedId: action.targetId};
      }
      break;
    case 'select-map': {
      const p = protocolOf(action.targetId);
      if (p) {
        next.selectedId = action.targetId;
        next.query = '';
        next.mode = 'all';
        if (next.kind !== 'all' && next.kind !== p.kind) next.kind = 'all';
        if (p.hemi !== 'both' && next.hemi !== 'all' && next.hemi !== p.hemi) next.hemi = p.hemi;
      }
      break;
    }
    default:
      break;
  }
  const matches = filterProtocols(next);
  if (!matches.length) next.selectedId = null;
  else if (!matches.some(p => p.id === next.selectedId)) next.selectedId = matches[0].id;
  return {...next, matches};
}

export function evaluateDrill(drillId, optionId) {
  const drill = typeof drillId === 'string' ? DRILL_BY_ID[drillId] : null;
  if (!drill) throw new Error(`Unknown drill: ${drillId}`);
  const option = drill.options.find(o => o.id === optionId);
  if (!option) throw new Error(`Unknown option ${optionId} on drill ${drillId}`);
  const correctOption = drill.options.find(o => o.correct);
  return {
    drillId: drill.id,
    optionId: option.id,
    correct: option.correct,
    rationale: option.rationale,
    correctOptionId: correctOption.id,
    targetId: drill.targetId,
    sourceIds: drill.sourceIds,
  };
}

export function parseTestingParams(search = '') {
  const params = new URLSearchParams(search);
  const rawTarget = params.get('target');
  const rawKind = params.get('kind');
  const rawHemi = params.get('hemi');
  const rawMode = params.get('mode');
  const rawQuery = params.get('q') ?? '';
  return {
    target: protocolOf(rawTarget) ? rawTarget : null,
    kind: VALID_KINDS.has(rawKind) ? rawKind : 'all',
    hemi: VALID_HEMIS.has(rawHemi) ? rawHemi : 'all',
    mode: rawMode && modeOf(rawMode) ? rawMode : 'all',
    query: rawQuery.trim().slice(0, 120),
  };
}
