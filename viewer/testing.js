import {
  TESTING_MODES,
  TESTING_SOURCES,
  COMPARISON_ROWS,
  MODALITIES,
  TESTING_TASKS,
  SCENARIO_DRILLS,
  TARGET_PROTOCOLS,
  MODE_BY_ID,
  TASK_BY_ID,
  PROTOCOL_BY_ID,
  testingStateFromSearch,
  testingStep,
  evaluateDrill,
  buildTestingSheetData,
} from './testing_model.js';
import {mountTerritoryMap} from './testing_map.js';
import {renderTestingSheet, bindTestingSheetDialog} from './testing_sheet.js';

const $ = id => document.getElementById(id);
const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter(c => c !== null && c !== undefined && c !== false));
  return node;
};

const routeHref = (slug, query) => {
  const ext = location.pathname.endsWith('.html') ? '.html' : '';
  return `./${slug}${ext}?${query}`;
};

let state = testingStateFromSearch(location.search);
const drillAnswers = new Map();
const drillRefs = new Map();
let renderedMatchIds = '';
let territoryMap = null;

function syncUrl() {
  const params = new URLSearchParams();
  if (state.selectedId) params.set('target', state.selectedId);
  if (state.kind !== 'all') params.set('kind', state.kind);
  if (state.hemi !== 'all') params.set('hemi', state.hemi);
  if (state.mode !== 'all') params.set('mode', state.mode);
  if (state.query) params.set('q', state.query);
  if (new URLSearchParams(location.search).has('test')) params.set('test', '1');
  const query = params.toString();
  const base = query ? `${location.pathname}?${query}` : location.pathname;
  history.replaceState(null, '', `${base}${location.hash}`);
}

function sourceLinks(sourceIds) {
  const wrap = el('span', {className: 'detail-sources'});
  sourceIds.forEach((id, index) => {
    const src = TESTING_SOURCES[id];
    if (!src) return;
    if (index > 0) wrap.append(' · ');
    const shortTitle = src.title.split(' · ')[0];
    wrap.append(el('a', {href: src.url, target: '_blank', rel: 'noopener noreferrer', textContent: shortTitle}));
  });
  return wrap;
}

function modeBadge(modeId) {
  const mode = MODE_BY_ID[modeId];
  const badge = el('span', {className: 'mode-badge', textContent: mode?.badge ?? modeId});
  badge.dataset.badge = mode?.badge ?? '';
  return badge;
}

function renderTaskList(ids, emptyText) {
  if (!ids.length) return el('p', {textContent: emptyText});
  return el(
    'ul',
    {},
    ...ids.map(id => {
      const task = TASK_BY_ID[id];
      return el('li', {}, el('strong', {textContent: task.name}), ` (${task.timing})`);
    }),
  );
}

function renderDetail(protocol) {
  const detail = $('targetDetail');
  if (!protocol) {
    detail.replaceChildren(el('p', {textContent: 'No testing cards match the current filter. Clear search or widen filters.'}));
    return;
  }
  const mode = MODE_BY_ID[protocol.mode];
  const secondary = protocol.secondaryModes.map(id => MODE_BY_ID[id]?.label).filter(Boolean);
  const codeText =
    protocol.kind === 'tract'
      ? `HCP1065 family: ${protocol.families.join(', ')} · Hemisphere: ${protocol.hemi === 'both' ? 'Left / Right' : protocol.hemi}`
      : `HCP-MMP1 parcels (${protocol.hemi}): ${protocol.parcels.join(', ')}`;

  const head = el(
    'div',
    {className: 'detail-head'},
    el('div', {}, el('h3', {textContent: protocol.name}), el('p', {className: 'detail-codes', textContent: codeText})),
    modeBadge(protocol.mode),
  );

  const modeNote = el('p', {
    className: 'detail-mode-note',
    textContent: `${mode.label}: ${mode.summary}${secondary.length ? ` Secondary: ${secondary.join(', ')}.` : ''}`,
  });

  const taskGrid = el(
    'div',
    {className: 'detail-grid'},
    el(
      'div',
      {className: 'detail-block'},
      el('h4', {textContent: 'Mapping tasks (focal DES / probe)'}),
      renderTaskList(protocol.mappingTasks, 'No reliable real-time mapping probe.'),
    ),
    el(
      'div',
      {className: 'detail-block'},
      el('h4', {textContent: 'Monitoring tasks (continuous)'}),
      renderTaskList(protocol.monitoringTasks, 'No continuous monitoring surrogate.'),
    ),
  );

  const execGrid = el(
    'div',
    {className: 'detail-grid'},
    el('div', {className: 'detail-block'}, el('h4', {textContent: 'Operative execution'}), el('p', {textContent: protocol.execution})),
    el('div', {className: 'detail-block'}, el('h4', {textContent: 'Error or warning signature'}), el('p', {textContent: protocol.errorSignature})),
  );

  const blindSpot = el(
    'div',
    {className: 'detail-block detail-blindspot'},
    el('h4', {textContent: 'False-reassurance trap / blind spot'}),
    el('p', {textContent: protocol.blindSpot}),
  );

  const links = el(
    'div',
    {className: 'detail-links'},
    el('a', {className: 'detail-link', href: routeHref('atlas', `lesson=${protocol.lessonId}`), textContent: 'Open matching 3D lesson'}),
    protocol.kind === 'tract'
      ? el('a', {
          className: 'detail-link',
          href: routeHref('labs/lesion-lab', `hemi=${protocol.hemi === 'R' ? 'R' : 'L'}`),
          textContent: 'Open in Lesion lab',
        })
      : null,
  );

  const sources = el('p', {className: 'detail-sources'}, 'Sources: ', sourceLinks(protocol.sourceIds));
  detail.replaceChildren(head, modeNote, taskGrid, execGrid, blindSpot, links, sources);
}

function syncCurrentRow() {
  for (const btn of $('targetList').children) {
    if (btn.dataset.target === state.selectedId) btn.setAttribute('aria-current', 'true');
    else btn.removeAttribute('aria-current');
  }
}

function dispatch(action, {focusDetail = false} = {}) {
  state = testingStep(state, action);
  syncControls();
  syncUrl();
  const active = state.selectedId ? PROTOCOL_BY_ID[state.selectedId] ?? null : null;
  let nextMapHemi = null;
  if (action?.type === 'set-hemi' && (state.hemi === 'L' || state.hemi === 'R')) nextMapHemi = state.hemi;
  else if (active && (active.hemi === 'L' || active.hemi === 'R')) nextMapHemi = active.hemi;
  else if (state.hemi === 'L' || state.hemi === 'R') nextMapHemi = state.hemi;
  renderLookup(nextMapHemi);
  if (focusDetail) {
    const activeBtn = $('targetList').querySelector('[aria-current="true"]');
    activeBtn?.scrollIntoView({block: 'nearest'});
    $('lookupSection').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    $('targetDetail').focus({preventScroll: true});
  }
}

function renderLookup(mapHemi = null) {
  const {matches} = state;
  const active = state.selectedId ? PROTOCOL_BY_ID[state.selectedId] ?? null : null;
  $('lookupStatus').textContent = `Showing ${matches.length} of ${TARGET_PROTOCOLS.length} anatomical testing cards.`;
  const sheetBtn = $('openTestingSheet');
  if (sheetBtn) sheetBtn.disabled = !active;

  const key = matches.map(p => p.id).join(',');
  const list = $('targetList');
  if (key !== renderedMatchIds) {
    renderedMatchIds = key;
    const rows = matches.map(p => {
      const meta = p.kind === 'tract' ? `Tract (${p.families.join('/')}) · ${p.hemi}` : `Cortex · ${p.parcels.slice(0, 3).join(', ')}`;
      const btn = el(
        'button',
        {type: 'button', className: 'target-row'},
        el('span', {className: 'target-row-name', textContent: p.name}),
        modeBadge(p.mode),
        el('span', {className: 'target-row-meta', textContent: meta}),
      );
      btn.dataset.target = p.id;
      btn.addEventListener('click', () => dispatch({type: 'select', targetId: p.id}));
      return btn;
    });
    list.replaceChildren(...rows);
  }
  syncCurrentRow();
  renderDetail(active);
  territoryMap?.update({selectedId: state.selectedId, hemi: mapHemi});
}

function renderComparison() {
  $('comparisonBody').replaceChildren(
    ...COMPARISON_ROWS.map(row =>
      el(
        'tr',
        {},
        el('th', {scope: 'row', textContent: row.dimension}),
        el('td', {textContent: row.monitoring}),
        el('td', {textContent: row.mapping}),
      ),
    ),
  );
}

function renderTasks() {
  const columns = [
    {
      title: 'DuLIP Part A (<=4 s DES)',
      note: 'Timed stimulation trials with carrier phrase and 4 s beep.',
      items: TESTING_TASKS.filter(t => t.group === 'dulip-part-a'),
    },
    {
      title: 'DuLIP Part B (Resection monitoring)',
      note: 'Unpaced tasks during removal, including semantic association (section 5.3).',
      items: TESTING_TASKS.filter(t => t.group === 'dulip-part-b'),
    },
    {
      title: 'Asleep IOM & specialized awake tasks',
      note: 'Motor conduction/proximity plus right-hemisphere, reading, and visual tasks.',
      items: TESTING_TASKS.filter(t => t.group === 'motor-asleep' || t.group === 'awake-specialized'),
    },
  ];
  $('tasksGrid').replaceChildren(
    ...columns.map(col =>
      el(
        'section',
        {className: 'task-column'},
        el('h3', {textContent: col.title}),
        el('p', {className: 'task-column-note', textContent: col.note}),
        el(
          'ul',
          {className: 'task-list'},
          ...col.items.map(task =>
            el(
              'li',
              {},
              el('span', {className: 'task-name', textContent: task.name}),
              el('span', {className: 'task-meta', textContent: `${task.domain} · ${task.timing}`}),
              el('span', {className: 'task-meta', textContent: task.carrierPhrase}),
              el('span', {className: 'task-caveat', textContent: task.caveat}),
            ),
          ),
        ),
      ),
    ),
  );
}

function renderModalities() {
  $('modalitiesGrid').replaceChildren(
    ...MODALITIES.map(mod =>
      el(
        'article',
        {className: 'modality-card'},
        el(
          'div',
          {className: 'modality-head'},
          el('h3', {textContent: mod.name}),
          el('span', {className: 'mode-badge', textContent: mod.role}),
        ),
        el('p', {}, el('strong', {textContent: 'Question: '}), mod.question),
        el('p', {}, el('strong', {textContent: 'Parameters: '}), mod.parameters),
        el('p', {}, el('strong', {textContent: 'Blind spot: '}), mod.blindSpot),
        el('p', {className: 'detail-sources'}, 'Sources: ', sourceLinks(mod.sourceIds)),
      ),
    ),
  );
}

function updateDrillCard(drillId) {
  const ref = drillRefs.get(drillId);
  if (!ref) return;
  const answer = drillAnswers.get(drillId) ?? null;
  for (const btn of ref.buttons) {
    btn.setAttribute('aria-pressed', String(answer?.optionId === btn.dataset.option));
  }
  if (!answer) {
    ref.feedback.hidden = true;
    ref.feedback.replaceChildren();
    return;
  }
  ref.feedback.hidden = false;
  ref.feedback.dataset.verdict = answer.correct ? 'correct' : 'wrong';
  const verdict = answer.correct ? 'Correct.' : 'False-reassurance trap.';
  const jumpBtn = el('button', {
    type: 'button',
    className: 'drill-jump',
    textContent: `Inspect ${PROTOCOL_BY_ID[answer.targetId].name} above`,
  });
  jumpBtn.addEventListener('click', () => dispatch({type: 'jump', targetId: answer.targetId}, {focusDetail: true}));
  ref.feedback.replaceChildren(
    el('p', {}, el('strong', {textContent: `${verdict} `}), answer.rationale),
    el('p', {className: 'detail-sources'}, 'Sources: ', sourceLinks(answer.sourceIds)),
    jumpBtn,
  );
}

function mountDrills() {
  drillRefs.clear();
  $('drillsList').replaceChildren(
    ...SCENARIO_DRILLS.map((drill, idx) => {
      const card = el('article', {className: 'drill-card'});
      card.dataset.drill = drill.id;
      const buttons = drill.options.map(opt => {
        const btn = el('button', {
          type: 'button',
          className: 'drill-option',
          textContent: opt.label,
        });
        btn.dataset.option = opt.id;
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => {
          drillAnswers.set(drill.id, evaluateDrill(drill.id, opt.id));
          updateDrillCard(drill.id);
        });
        return btn;
      });
      const feedback = el('div', {className: 'drill-feedback', role: 'status'});
      feedback.setAttribute('aria-live', 'polite');
      feedback.hidden = true;
      card.append(
        el('h3', {textContent: `Trap ${idx + 1}: ${drill.title}`}),
        el('p', {className: 'drill-stem', textContent: drill.stem}),
        el('div', {className: 'drill-options'}, ...buttons),
        feedback,
      );
      drillRefs.set(drill.id, {card, buttons, feedback});
      return card;
    }),
  );
}

function renderSources() {
  $('sourcesList').replaceChildren(
    ...Object.values(TESTING_SOURCES).map(src =>
      el(
        'li',
        {},
        el('a', {href: src.url, target: '_blank', rel: 'noopener noreferrer', textContent: src.title}),
        el('p', {textContent: `Evidence class: ${src.evidenceClass.replaceAll('_', ' ')} · ${src.scope}`}),
      ),
    ),
  );
}

function syncControls() {
  for (const btn of document.querySelectorAll('[data-filter-kind]')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.filterKind === state.kind));
  }
  for (const btn of document.querySelectorAll('[data-filter-hemi]')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.filterHemi === state.hemi));
  }
  $('modeSelect').value = state.mode;
  $('targetSearch').value = state.query;
}

function bindControls() {
  const modeSelect = $('modeSelect');
  for (const mode of TESTING_MODES) {
    modeSelect.append(el('option', {value: mode.id, textContent: mode.label}));
  }
  for (const btn of document.querySelectorAll('[data-filter-kind]')) {
    btn.addEventListener('click', () => dispatch({type: 'set-kind', kind: btn.dataset.filterKind}));
  }
  for (const btn of document.querySelectorAll('[data-filter-hemi]')) {
    btn.addEventListener('click', () => dispatch({type: 'set-hemi', hemi: btn.dataset.filterHemi}));
  }
  modeSelect.addEventListener('change', () => dispatch({type: 'set-mode', mode: modeSelect.value}));
  $('targetSearch').addEventListener('input', event => dispatch({type: 'set-query', query: event.target.value}));
  const sheetDialog = $('testingSheetDialog');
  if (sheetDialog) {
    bindTestingSheetDialog(sheetDialog, {getShareUrl: () => location.href});
    $('openTestingSheet')?.addEventListener('click', () => {
      const active = state.selectedId ? PROTOCOL_BY_ID[state.selectedId] ?? null : null;
      if (!active) return;
      const mode = MODE_BY_ID[active.mode];
      const sheet = buildTestingSheetData({
        title: active.name,
        subtitle: `Testing card (${mode?.label ?? active.mode})`,
        hemi: active.hemi,
        protocols: [active],
      });
      renderTestingSheet(sheetDialog, sheet, {thirdColTitle: 'False-reassurance trap & limits'});
      sheetDialog.showModal();
    });
  }
  syncControls();
}

if (new URLSearchParams(location.search).has('test')) {
  Object.defineProperty(window, '__testingTest', {
    get: () => ({
      selectedId: state.selectedId,
      kind: state.kind,
      hemi: state.hemi,
      mode: state.mode,
      query: state.query,
      visibleCount: $('targetList').children.length,
      answeredDrills: Object.fromEntries(drillAnswers),
      mapHemi: territoryMap?.getHemi() ?? null,
      mapLayer: territoryMap?.getLayer() ?? null,
      mapTargetCount: territoryMap?.targetCount ?? 0,
    }),
  });
}

territoryMap = mountTerritoryMap($('territoryMap'), {
  onSelect: targetId => dispatch({type: 'select-map', targetId}),
  onHemiChange: hemi => {
    if (state.hemi !== 'all' && state.hemi !== hemi) dispatch({type: 'set-hemi', hemi});
  },
});

bindControls();
const initialProtocol = state.selectedId ? PROTOCOL_BY_ID[state.selectedId] : null;
const initialMapHemi =
  initialProtocol && (initialProtocol.hemi === 'L' || initialProtocol.hemi === 'R')
    ? initialProtocol.hemi
    : state.hemi === 'R'
      ? 'R'
      : 'L';
renderLookup(initialMapHemi);
renderComparison();
renderTasks();
renderModalities();
mountDrills();
renderSources();
