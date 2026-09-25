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

function sourceLookupFor(sourceIds, sourcesById) {
  return sourceIds.map((id) => sourcesById[id]).filter(Boolean);
}

// --- Lessons -----------------------------------------------------------

export function buildLessonSheet(lesson, guide, sourcesById = SOURCES, regions = REGIONS) {
  if (!guide) throw new Error(`No teaching guide for lesson ${lesson.id}`);
  const lines = [];
  lines.push(`# ${lesson.title}`, '');
  lines.push(`Lesson id: \`${lesson.id}\` · Minutes: ${lesson.minutes} · Review status: ${lesson.reviewStatus}`, '');
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
    sourceLookupFor([...allSourceIds], sourcesById).forEach((s) => lines.push(formatSourceLine(s)));
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
    case_.sources.forEach((s) => lines.push(formatSourceLine(s)));
  } else {
    lines.push('NO SOURCES');
  }
  lines.push('');
  lines.push('## Review checklist', '', CHECKLIST, '', 'Notes:', '');
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
  return written;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const outArgIndex = process.argv.indexOf('--out');
  const outDir = outArgIndex !== -1 ? path.resolve(process.argv[outArgIndex + 1]) : DEFAULT_OUT_DIR;
  const written = await writeReviewSheets(outDir);
  console.log(`Wrote ${written.length} review sheets to ${outDir}`);
}
