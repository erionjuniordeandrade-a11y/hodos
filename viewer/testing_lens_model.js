import {TESTING_MODES, TESTING_TASKS} from './testing_protocol_data.js';
import {TRACT_PROTOCOLS} from './testing_targets_data.js';
import {TEST_LENSES, BATTERY_TASKS, PRIMARY_TASKS_BY_TRACT} from './testing_presets_data.js';

const nullMap = pairs => Object.freeze(Object.assign(Object.create(null), Object.fromEntries(pairs)));
const MODE_BY_ID = nullMap(TESTING_MODES.map(m => [m.id, m]));
const TASK_BY_ID = nullMap(TESTING_TASKS.map(t => [t.id, t]));
const LENS_BY_ID = nullMap(TEST_LENSES.map(l => [l.id, l]));
export const BATTERY_TASK_BY_ID = nullMap(BATTERY_TASKS.map(t => [t.id, t]));

const familyOf = id => (/_[LR]$/.test(id) ? id.slice(0, -2) : id);

export function tractProtocolsForCutBundles(rows = [], hemi = 'L') {
  const side = hemi === 'R' ? 'R' : 'L';
  const cutRows = [];
  const cutByFamily = new Map();
  for (const row of rows) {
    if (!row || !(row.cut > 0)) continue;
    const fam = familyOf(row.id);
    const share = row.total > 0 ? row.cut / row.total : 0;
    const entry = {id: row.id, cut: row.cut, total: row.total, share};
    cutRows.push(entry);
    const list = cutByFamily.get(fam) ?? [];
    list.push(entry);
    cutByFamily.set(fam, list);
  }
  if (!cutByFamily.size) return {protocols: [], unmatchedCutIds: []};

  const matched = [];
  const coveredBundleIds = new Set();
  for (const protocol of TRACT_PROTOCOLS) {
    if (protocol.hemi !== 'both' && protocol.hemi !== side) continue;
    const matchedBundles = protocol.families.flatMap(f => cutByFamily.get(f) ?? []);
    if (!matchedBundles.length) continue;
    for (const b of matchedBundles) coveredBundleIds.add(b.id);
    const maxCutShare = Math.max(...matchedBundles.map(b => b.share));
    matched.push({
      ...protocol,
      modeInfo: MODE_BY_ID[protocol.mode] ?? null,
      mappingTaskList: protocol.mappingTasks.map(id => TASK_BY_ID[id]).filter(Boolean),
      monitoringTaskList: protocol.monitoringTasks.map(id => TASK_BY_ID[id]).filter(Boolean),
      matchedBundles,
      maxCutShare,
    });
  }
  matched.sort((a, b) => b.maxCutShare - a.maxCutShare || a.name.localeCompare(b.name));
  const unmatchedCutIds = cutRows
    .filter(r => !coveredBundleIds.has(r.id))
    .sort((a, b) => b.share - a.share || a.id.localeCompare(b.id))
    .map(r => r.id);
  return {protocols: matched, unmatchedCutIds};
}

function partitionMatchedBundleIds(interrogatedProtocols, blindSpotProtocols) {
  const blindSpotBundleSet = new Set();
  for (const protocol of blindSpotProtocols) {
    for (const b of protocol.matchedBundles) blindSpotBundleSet.add(b.id);
  }
  const interrogatedOnlyBundleSet = new Set();
  for (const protocol of interrogatedProtocols) {
    for (const b of protocol.matchedBundles) {
      if (!blindSpotBundleSet.has(b.id)) interrogatedOnlyBundleSet.add(b.id);
    }
  }
  return {
    interrogatedBundleIds: [...interrogatedOnlyBundleSet],
    blindSpotBundleIds: [...blindSpotBundleSet],
  };
}

function familiesFromInterrogatedIds(hemi, interrogatedIds) {
  const side = hemi === 'R' ? 'R' : 'L';
  const blindFamilies = new Set();
  const interrogatedFamilies = new Set();
  for (const protocol of TRACT_PROTOCOLS) {
    if (protocol.hemi !== 'both' && protocol.hemi !== side) continue;
    const target = interrogatedIds.has(protocol.id) ? interrogatedFamilies : blindFamilies;
    for (const fam of protocol.families) target.add(fam);
  }
  for (const fam of blindFamilies) interrogatedFamilies.delete(fam);
  return interrogatedFamilies;
}

function interrogatedTractIdsForTasks(hemi, validTaskIds) {
  const side = hemi === 'R' ? 'R' : 'L';
  const selected = new Set(validTaskIds);
  const interrogated = new Set();
  for (const protocol of TRACT_PROTOCOLS) {
    if (protocol.hemi !== 'both' && protocol.hemi !== side) continue;
    if (protocol.mode === 'untestable-anatomy-only') continue;
    const primary = PRIMARY_TASKS_BY_TRACT[protocol.id] ?? [];
    if (primary.some(tid => selected.has(tid))) interrogated.add(protocol.id);
  }
  return interrogated;
}

function validBatteryTaskIds(taskIds = []) {
  const seen = new Set();
  const out = [];
  for (const id of taskIds) {
    if (typeof id === 'string' && BATTERY_TASK_BY_ID[id] && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

export function interrogatedFamiliesForLens(hemi = 'L', lensId = 'all') {
  const lens = (typeof lensId === 'string' ? LENS_BY_ID[lensId] : null) ?? LENS_BY_ID.all;
  if (!lens.interrogates) return new Set();
  return familiesFromInterrogatedIds(hemi, new Set(lens.interrogates));
}

export function interrogatedFamiliesForTasks(hemi = 'L', taskIds = []) {
  const valid = validBatteryTaskIds(taskIds);
  if (!valid.length) return new Set();
  return familiesFromInterrogatedIds(hemi, interrogatedTractIdsForTasks(hemi, valid));
}

function partitionProtocolsBySet(protocols, interrogatedSet) {
  const interrogatedProtocols = [];
  const blindSpotProtocols = [];
  for (const protocol of protocols) {
    if (interrogatedSet.has(protocol.id)) interrogatedProtocols.push(protocol);
    else blindSpotProtocols.push(protocol);
  }
  const {interrogatedBundleIds, blindSpotBundleIds} = partitionMatchedBundleIds(interrogatedProtocols, blindSpotProtocols);
  return {interrogatedProtocols, blindSpotProtocols, interrogatedBundleIds, blindSpotBundleIds};
}

export function evaluateTestLens(rows = [], hemi = 'L', lensId = 'all') {
  const {protocols, unmatchedCutIds} = tractProtocolsForCutBundles(rows, hemi);
  const lens = (typeof lensId === 'string' ? LENS_BY_ID[lensId] : null) ?? LENS_BY_ID.all;
  if (lens.id === 'all') {
    return {
      lens,
      active: false,
      protocols,
      interrogatedProtocols: [],
      blindSpotProtocols: [],
      interrogatedBundleIds: [],
      blindSpotBundleIds: [],
      unmatchedCutIds,
    };
  }
  return {
    lens,
    active: true,
    protocols,
    ...partitionProtocolsBySet(protocols, new Set(lens.interrogates)),
    unmatchedCutIds,
  };
}

export function evaluateCustomBattery(rows = [], hemi = 'L', taskIds = []) {
  const {protocols, unmatchedCutIds} = tractProtocolsForCutBundles(rows, hemi);
  const valid = validBatteryTaskIds(taskIds);
  if (!valid.length) {
    return {
      lens: LENS_BY_ID.all,
      active: false,
      protocols,
      interrogatedProtocols: [],
      blindSpotProtocols: [],
      interrogatedBundleIds: [],
      blindSpotBundleIds: [],
      unmatchedCutIds,
    };
  }
  const interrogatedSet = interrogatedTractIdsForTasks(hemi, valid);
  const labels = valid.map(id => BATTERY_TASK_BY_ID[id].shortLabel);
  const lens = Object.freeze({
    id: 'custom',
    label: 'Custom battery',
    shortLabel: 'Custom battery',
    summary: `Selected ${valid.length} task${valid.length === 1 ? '' : 's'} (${labels.join(', ')}).`,
    interrogates: null,
  });
  return {
    lens,
    active: true,
    protocols,
    ...partitionProtocolsBySet(protocols, interrogatedSet),
    unmatchedCutIds,
  };
}

export function hudTestingSummary(rows = [], hemi = 'L', lensId = 'all', taskIds = []) {
  const result = lensId === 'custom' ? evaluateCustomBattery(rows, hemi, taskIds) : evaluateTestLens(rows, hemi, lensId);
  const mapTasks = new Set();
  const monitorTasks = new Set();
  const mapNames = [];
  let untestableCount = 0;
  for (const p of result.protocols) {
    for (const tid of p.mappingTasks) mapTasks.add(tid);
    for (const tid of p.monitoringTasks) monitorTasks.add(tid);
    if (p.mappingTasks.length) mapNames.push(p.name);
    if (p.mode === 'untestable-anatomy-only') untestableCount++;
  }
  return {
    mapCount: mapTasks.size,
    monitorCount: monitorTasks.size,
    untestableCount,
    blindCount: result.blindSpotProtocols.length,
    interrogatedCount: result.interrogatedProtocols.length,
    unmatchedCount: result.unmatchedCutIds.length,
    protocolCount: result.protocols.length,
    lensId: result.lens.id,
    topMapNames: mapNames.slice(0, 3),
    topBlindNames: result.blindSpotProtocols.slice(0, 3).map(p => p.name),
  };
}
