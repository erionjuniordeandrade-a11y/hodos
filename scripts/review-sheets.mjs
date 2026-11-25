// Owner review sheets (Teach-back program unit 0.1, docs/plans/2026-09-25-teach-back-program.md §3).
// Reads the real lesson and case modules and writes one Markdown page per lesson/case
// so the owner's review is reading, not hunting. Read-only on viewer/ — writes only
// into the given output directory (default docs/review-sheets/).
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {LESSONS, SOURCES, REGIONS, sourceIdsForStep} from '../viewer/lesson_content.js';
import {TEACHING_GUIDES} from '../viewer/lesson_briefings.js';
import {CASES} from '../viewer/case_content.js';
import {
  REVIEW_STATUS as TESTING_REVIEW_STATUS,
  TESTING_VERSION,
  TESTING_SOURCES,
  COMPARISON_ROWS,
  MODALITIES,
  TESTING_TASKS,
  SCENARIO_DRILLS,
  TARGET_PROTOCOLS,
  TEST_LENSES,
  LESION_PRESETS,
  BATTERY_TASKS,
  PRIMARY_TASKS_BY_TRACT,
  MODE_BY_ID,
  TASK_BY_ID,
} from '../viewer/testing_model.js';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
export const DEFAULT_OUT_DIR = path.join(repoRoot, 'docs/review-sheets');

const CHECKLIST = [
  '- [ ] anatomy correct',
  '- [ ] sources support claims',
  '- [ ] wording OK',
  '- [ ] approve to reviewed',
].join('\n');

// A source's own scope note usually already restates PMID/DOI in prose, so pull the
// identifier straight from its canonical URL instead of trusting free text.
export function citationTag(source) {
  if (!source || !source.url) return null;
  const pmid = source.url.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/);
  if (pmid) return `PMID ${pmid[1]}`;
  const doi = source.url.match(/doi\.org\/(.+?)\/?$/);
  if (doi) return `DOI ${doi[1]}`;
  return source.url;
}

function formatSourceLine(source) {
  if (!source) return '(unresolved source)';
  const tag = citationTag(source);
  const evidence = source.evidenceClass ? ` — ${source.evidenceClass}` : '';
  return `- **${source.id}** — ${source.title}${tag ? ` (${tag})` : ''}${evidence}`;
}

function formatSourceEntry(source) {
  const line = formatSourceLine(source);
  return source && source.scope ? `${line}\n  - _Scope:_ ${source.scope}` : line;
}

function sourceLookupFor(sourceIds, sourcesById) {
  return sourceIds.map((id) => sourcesById[id]).filter(Boolean);
}

// Everything a learner can read must reach the reviewer, so the extra fields are
// chosen by EXCLUSION: any field not listed here as structural or already printed
// is rendered generically, including fields added to the content later.
const STEP_SHOWN_OR_STRUCTURAL = new Set(['title', 'text', 'sources', 'scene', 'regions', 'targets']);
const LESSON_SHOWN_OR_STRUCTURAL = new Set(['id', 'title', 'minutes', 'reviewStatus', 'reviewedAt', 'reviewedBy', 'steps', 'version', 'referenceOnly', 'category']);
const CASE_SHOWN_OR_STRUCTURAL = new Set(['id', 'fictional', 'title', 'location', 'number', 'prompt', 'debrief', 'sources']);

function label(key) {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

// Renders any JSON-like value as Markdown lines under a bold label; nested objects
// and arrays of objects become indented bullet lists so nothing is dropped.
export function renderField(key, value, indent = '') {
  if (value === undefined || value === null || value === '') return [];
  const head = `${indent}${indent ? '- ' : ''}**${label(key)}:**`;
  if (typeof value !== 'object') return [`${head} ${value}`];
  const entries = Array.isArray(value) ? value.map((v, i) => [String(i + 1), v]) : Object.entries(value);
  const lines = [head];
  const inner = indent + '  ';
  for (const [k, v] of entries) {
    if (v !== null && typeof v === 'object') {
      lines.push(...renderField(Array.isArray(value) ? `${label(key)} ${k}` : k, v, inner));
    } else if (Array.isArray(value)) {
      lines.push(`${inner}- ${v}`);
    } else {
      lines.push(...renderField(k, v, inner));
    }
  }
  return lines;
}

function renderRest(obj, exclude) {
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (exclude.has(k)) continue;
    const rendered = renderField(k, v);
    if (rendered.length) lines.push(...rendered, '');
  }
  return lines;
}

// --- Lessons -----------------------------------------------------------

export function buildLessonSheet(lesson, guide, sourcesById = SOURCES, regions = REGIONS) {
  if (!guide) throw new Error(`No teaching guide for lesson ${lesson.id}`);
  const lines = [];
  lines.push(`# ${lesson.title}`, '');
  const reviewDetail = lesson.reviewedAt
    ? ` · Reviewed: ${lesson.reviewedAt}${lesson.reviewedBy ? ` (${lesson.reviewedBy})` : ''}`
    : '';
  lines.push(`Lesson id: \`${lesson.id}\` · Minutes: ${lesson.minutes} · Review status: ${lesson.reviewStatus}${reviewDetail}`, '');
  lines.push(...renderRest(lesson, LESSON_SHOWN_OR_STRUCTURAL));
  lines.push('## Opening question', '', guide.question, '');
  lines.push('## Three takeaways', '');
  guide.takeaways.forEach((point, i) => {
    const stepTitle = lesson.steps[point.step]?.title ?? `(step ${point.step} not found)`;
    lines.push(`${i + 1}. ${point.text} _(step ${point.step}: ${stepTitle})_`);
  });
  lines.push('');
  lines.push('## Steps', '');
  const allSourceIds = new Set();
  lesson.steps.forEach((step, i) => {
    const stepSourceIds = sourceIdsForStep(step, regions);
    stepSourceIds.forEach((id) => allSourceIds.add(id));
    lines.push(`### Step ${i}: ${step.title}`, '');
    lines.push(`**Claim:** ${step.text}`, '');
    lines.push(...renderRest(step, STEP_SHOWN_OR_STRUCTURAL));
    if (stepSourceIds.length) {
      lines.push('**Sources:**');
      sourceLookupFor(stepSourceIds, sourcesById).forEach((s) => lines.push(formatSourceLine(s)));
    } else {
      lines.push('**Sources:** NO SOURCES');
    }
    lines.push('');
  });
  lines.push('## Full source list', '');
  if (allSourceIds.size) {
    sourceLookupFor([...allSourceIds], sourcesById).forEach((s) => lines.push(formatSourceEntry(s)));
  } else {
    lines.push('NO SOURCES');
  }
  lines.push('');
  lines.push('## Review checklist', '', CHECKLIST, '', 'Notes:', '');
  return lines.join('\n');
}

// --- Cases ---------------------------------------------------------------
// case_content.js does not share the lesson() shape (no minutes/steps/takeaways array);
// its nearest equivalents are: prompt (opening question), the debrief entries (each a
// title + text + sourceIds, the case's "steps"), and its own top-level `sources` list
// (not the shared SOURCES table). Adapted per the task's "note and continue" allowance
// for formatting choices; flagged in the handback report.

function casesSourcesById(case_) {
  return Object.fromEntries((case_.sources ?? []).map((s) => [s.id, s]));
}

export function buildCaseSheet(case_) {
  const sourcesById = casesSourcesById(case_);
  const lines = [];
  lines.push(`# ${case_.title} (fictional case)`, '');
  lines.push(`Case id: \`${case_.id}\` · Location: ${case_.location} · Number: ${case_.number} · Minutes: N/A (case, not a timed lesson)`, '');
  lines.push('## Opening question (conference prompt)', '', case_.prompt, '');
  lines.push('## Case content', '');
  lines.push(...renderRest(case_, CASE_SHOWN_OR_STRUCTURAL));
  lines.push('## Takeaways (debrief titles, in place of a lesson\'s three takeaways)', '');
  (case_.debrief ?? []).forEach((d, i) => lines.push(`${i + 1}. ${d.title}`));
  lines.push('');
  lines.push('## Steps (debrief entries)', '');
  const allSourceIds = new Set();
  (case_.debrief ?? []).forEach((d, i) => {
    (d.sourceIds ?? []).forEach((id) => allSourceIds.add(id));
    lines.push(`### Debrief ${i}: ${d.title}`, '');
    lines.push(`**Claim:** ${d.text}`, '');
    if (d.sourceIds?.length) {
      lines.push('**Sources:**');
      sourceLookupFor(d.sourceIds, sourcesById).forEach((s) => lines.push(formatSourceLine(s)));
    } else {
      lines.push('**Sources:** NO SOURCES');
    }
    lines.push('');
  });
  lines.push('## Full source list', '');
  if ((case_.sources ?? []).length) {
    case_.sources.forEach((s) => lines.push(formatSourceEntry(s)));
  } else {
    lines.push('NO SOURCES');
  }
  lines.push('');
  lines.push('## Review checklist', '', CHECKLIST, '', 'Notes:', '');
  return lines.join('\n');
}

export function buildTestingSheet() {
  const lines = [];
  lines.push('# How to test it: Monitoring vs mapping', '');
  lines.push(`Guide id: \`testing-monitoring-vs-mapping\` · Version: ${TESTING_VERSION} · Review status: ${TESTING_REVIEW_STATUS}`, '');
  lines.push('## Monitoring vs mapping', '');
  for (const row of COMPARISON_ROWS) {
    lines.push(`- **${row.dimension}:** Monitoring: ${row.monitoring} | Mapping: ${row.mapping}`);
  }
  lines.push('', '## Modalities', '');
  for (const mod of MODALITIES) {
    lines.push(`### ${mod.name} (${mod.role})`, '');
    lines.push(`- **Question:** ${mod.question}`);
    lines.push(`- **Parameters:** ${mod.parameters}`);
    lines.push(`- **Blind spot:** ${mod.blindSpot}`);
    lines.push('**Sources:**');
    sourceLookupFor(mod.sourceIds, TESTING_SOURCES).forEach((s) => lines.push(formatSourceLine(s)));
    lines.push('');
  }
  lines.push('## Tasks (DuLIP & specialized)', '');
  for (const task of TESTING_TASKS) {
    const modeLabel = MODE_BY_ID[task.mode]?.label ?? task.mode;
    lines.push(`### ${task.name}`, '');
    lines.push(`- **Group / mode:** ${task.group} · ${modeLabel}`);
    lines.push(`- **Domain / timing:** ${task.domain}, ${task.timing}`);
    lines.push(`- **Prompt / protocol:** ${task.carrierPhrase}`);
    lines.push(`- **Caveat:** ${task.caveat}`);
    lines.push('**Sources:**');
    sourceLookupFor(task.sourceIds, TESTING_SOURCES).forEach((s) => lines.push(formatSourceLine(s)));
    lines.push('');
  }
  lines.push('## Anatomical protocols', '');
  for (const p of TARGET_PROTOCOLS) {
    const modeLabel = MODE_BY_ID[p.mode]?.label ?? p.mode;
    const secondary = p.secondaryModes.map((id) => MODE_BY_ID[id]?.label ?? id).join(', ');
    const refs = p.kind === 'tract' ? `Families: ${p.families.join(', ')}` : `Parcels: ${p.parcels.join(', ')}`;
    lines.push(`### ${p.name}`, '');
    lines.push(`- **Kind / side:** ${p.kind} (${p.hemi}) · ${refs} · **Mode:** ${modeLabel}${secondary ? ` (Secondary: ${secondary})` : ''}`);
    lines.push(`- **Mapping tasks:** ${p.mappingTasks.map((id) => TASK_BY_ID[id]?.name ?? id).join(', ') || 'None'}`);
    lines.push(`- **Monitoring tasks:** ${p.monitoringTasks.map((id) => TASK_BY_ID[id]?.name ?? id).join(', ') || 'None'}`);
    lines.push(`- **Execution:** ${p.execution}`);
    lines.push(`- **Error signature:** ${p.errorSignature}`);
    lines.push(`- **Blind spot:** ${p.blindSpot}`);
    lines.push(`- **Matching lesson:** ${p.lessonId}`);
    lines.push('**Sources:**');
    sourceLookupFor(p.sourceIds, TESTING_SOURCES).forEach((s) => lines.push(formatSourceLine(s)));
    lines.push('');
  }
  lines.push('## Clinical trap drills', '');
  for (const drill of SCENARIO_DRILLS) {
    lines.push(`### ${drill.title}`, '', drill.stem, '');
    lines.push(`- **Target protocol:** \`${drill.targetId}\``);
    for (const opt of drill.options) {
      lines.push(`- [${opt.correct ? 'x' : ' '}] ${opt.label} — ${opt.rationale}`);
    }
    lines.push('**Sources:**');
    sourceLookupFor(drill.sourceIds, TESTING_SOURCES).forEach((s) => lines.push(formatSourceLine(s)));
    lines.push('');
  }
  lines.push('## Lesion lab test lenses and surgical territory presets', '');
  lines.push('All 26 anatomical testing cards are projected from HCP S1200/HCP1065 onto interactive 2D lateral and medial hemisphere diagrams on `/testing` (`testing_map.js`), and the 3D Lesion lab applies test lenses (`evaluateTestLens`) and custom batteries (`evaluateCustomBattery`) across 6 verified HCP1065 MNI surgical territories.', '');
  for (const lens of TEST_LENSES) {
    const scope = lens.interrogates ? `Interrogates: ${lens.interrogates.join(', ')}` : 'Interrogates: all cut tracts (no dimming)';
    lines.push(`- **${lens.label}** (\`${lens.id}\`): ${lens.summary} (${scope})`);
  }
  lines.push('', '### Custom Battery Builder tasks', '');
  for (const bt of BATTERY_TASKS) {
    lines.push(`- **${bt.shortLabel}** (\`${bt.id}\`, ${bt.group})`);
  }
  lines.push('', '### Primary interrogation tasks per tract', '');
  for (const [tractId, taskIds] of Object.entries(PRIMARY_TASKS_BY_TRACT)) {
    lines.push(`- \`${tractId}\`: ${taskIds.length ? taskIds.join(', ') : 'none (untestable corridor only)'}`);
  }
  lines.push('');
  for (const preset of LESION_PRESETS) {
    lines.push(`- **${preset.label}** (\`${preset.id}\`): hemi ${preset.hemi}, MNI [${preset.centre.join(', ')}], radius ${preset.radius} mm, default lens \`${preset.defaultLens}\` — ${preset.note}`);
  }
  lines.push('', '## Full source list', '');
  Object.values(TESTING_SOURCES).forEach((s) => lines.push(formatSourceEntry(s)));
  lines.push('', '## Review checklist', '', CHECKLIST, '', 'Notes:', '');
  return lines.join('\n');
}

// --- Driver ---------------------------------------------------------------

export async function writeReviewSheets(outDir = DEFAULT_OUT_DIR) {
  await mkdir(outDir, {recursive: true});
  const written = [];
  for (const lesson of LESSONS) {
    const sheet = buildLessonSheet(lesson, TEACHING_GUIDES[lesson.id]);
    const file = path.join(outDir, `${lesson.id}.md`);
    await writeFile(file, sheet, 'utf8');
    written.push(file);
  }
  for (const case_ of CASES) {
    const sheet = buildCaseSheet(case_);
    const file = path.join(outDir, `${case_.id}.md`);
    await writeFile(file, sheet, 'utf8');
    written.push(file);
  }
  const testingFile = path.join(outDir, 'testing-monitoring-vs-mapping.md');
  await writeFile(testingFile, buildTestingSheet(), 'utf8');
  written.push(testingFile);
  return written;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const outArgIndex = process.argv.indexOf('--out');
  const outDir = outArgIndex !== -1 ? path.resolve(process.argv[outArgIndex + 1]) : DEFAULT_OUT_DIR;
  const written = await writeReviewSheets(outDir);
  console.log(`Wrote ${written.length} review sheets to ${outDir}`);
}
