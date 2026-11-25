import {TESTING_SOURCES} from './testing_sources_data.js';
import {TESTING_MODES, TESTING_TASKS} from './testing_protocol_data.js';

export const TESTING_SHEET_WATERMARK = [
  'Group reference',
  'Educational draft awaiting clinical review',
  'Not patient-specific navigation or an institutional protocol.',
].join(' \u00b7 ');

const MODE_BY_ID = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(TESTING_MODES.map(m => [m.id, m]))));
const TASK_BY_ID = Object.freeze(Object.assign(Object.create(null), Object.fromEntries(TESTING_TASKS.map(t => [t.id, t]))));

function collectSheetTasks(protocols, field) {
  const byId = new Map();
  for (const p of protocols) {
    for (const tid of p[field] ?? []) {
      const task = TASK_BY_ID[tid];
      if (!task) continue;
      let entry = byId.get(tid);
      if (!entry) {
        entry = {
          id: task.id,
          name: task.name,
          timing: task.timing,
          carrierPhrase: task.carrierPhrase,
          caveat: task.caveat,
          targets: [],
        };
        byId.set(tid, entry);
      }
      if (!entry.targets.includes(p.name)) entry.targets.push(p.name);
    }
  }
  return [...byId.values()];
}

export function buildTestingSheetData({
  title = 'Intraoperative testing sheet',
  subtitle = '',
  hemi = 'L',
  protocols = [],
  blindSpotIds = [],
  interrogatedIds = [],
  unmatchedCutIds = [],
  note = '',
} = {}) {
  const list = Array.isArray(protocols) ? protocols.filter(Boolean) : [];
  const blindSet = new Set(blindSpotIds);
  const interrogatedSet = new Set(interrogatedIds);
  const lensActive = blindSet.size > 0 || interrogatedSet.size > 0;

  const mapTasks = collectSheetTasks(list, 'mappingTasks');
  const monitorTasks = collectSheetTasks(list, 'monitoringTasks');
  const untestable = [];
  const blindSpots = [];
  const interrogated = [];
  const errorSignatures = [];
  const sourceById = new Map();

  for (const p of list) {
    const badge = MODE_BY_ID[p.mode]?.badge ?? p.mode;
    if (p.mode === 'untestable-anatomy-only') {
      untestable.push({
        id: p.id,
        name: p.name,
        execution: p.execution,
        errorSignature: p.errorSignature,
        blindSpot: p.blindSpot,
        badge,
      });
    } else if (!lensActive || blindSet.has(p.id)) {
      blindSpots.push({
        id: p.id,
        name: p.name,
        blindSpot: p.blindSpot,
        mode: p.mode,
        badge,
      });
    }
    if (interrogatedSet.has(p.id)) {
      interrogated.push({id: p.id, name: p.name, mode: p.mode, badge});
    }
    errorSignatures.push({
      id: p.id,
      name: p.name,
      errorSignature: p.errorSignature,
      execution: p.execution,
    });
    for (const sid of p.sourceIds ?? []) {
      const src = TESTING_SOURCES[sid];
      if (src && !sourceById.has(sid)) sourceById.set(sid, src);
    }
  }

  return {
    title: String(title || 'Intraoperative testing sheet'),
    subtitle: String(subtitle || ''),
    hemi: hemi === 'R' || hemi === 'both' || hemi === 'all' ? hemi : 'L',
    note: String(note || ''),
    watermark: TESTING_SHEET_WATERMARK,
    mapTasks,
    monitorTasks,
    blindSpots,
    untestable,
    interrogated,
    uncurated: [...new Set(unmatchedCutIds)],
    errorSignatures,
    sources: [...sourceById.values()],
  };
}
