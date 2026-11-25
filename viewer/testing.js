// Interactive UI for Hodos "How to test it? Monitoring vs Mapping" (/testing).
// Pure filtering, URL parsing, and drill evaluation live in testing_model.js.
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
  filterProtocols,
  evaluateDrill,
  parseTestingParams,
} from './testing_model.js';

const $ = id => document.getElementById(id);
const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter(c => c !== null && c !== undefined && c !== false));
  return node;
};

const initial = parseTestingParams(location.search);
const state = {
  kind: initial.kind,
  hemi: initial.hemi,
  mode: initial.mode,
  query: initial.query,
  selectedId: initial.target ?? TARGET_PROTOCOLS[0].id,
  drillAnswers: new Map(),
};

function syncUrl() {
  const params = new URLSearchParams();
  if (state.selectedId) params.set('target', state.selectedId);
  if (state.kind !== 'all') params.set('kind', state.kind);
  if (state.hemi !== 'all') params.set('hemi', state.hemi);
  if (state.mode !== 'all') params.set('mode', state.mode);
  if (state.query) params.set('q', state.query);
  if (new URLSearchParams(location.search).has('test')) params.set('test', '1');
  const query = params.toString();
  history.replaceState(null, '', query ? `${location.pathname}?${query}` : location.pathname);
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
    detail.replaceChildren(el('p', {textContent: 'No targets match the current filter. Clear search or widen filters.'}));
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
    el('a', {className: 'detail-link', href: `./atlas.html?lesson=${protocol.lessonId}`, textContent: 'Open matching 3D lesson'}),
    protocol.kind === 'tract'
      ? el('a', {
          className: 'detail-link',
          href: `./labs/lesion-lab.html?hemi=${protocol.hemi === 'R' ? 'R' : 'L'}`,
          textContent: 'Open in Lesion lab',
        })
      : null,
  );

  const sources = el('p', {className: 'detail-sources'}, 'Sources: ', sourceLinks(protocol.sourceIds));
  detail.replaceChildren(head, modeNote, taskGrid, execGrid, blindSpot, links, sources);
}

function renderLookup() {
  const matches = filterProtocols({kind: state.kind, hemi: state.hemi, mode: state.mode, query: state.query});
  if (matches.length && !matches.some(p => p.id === state.selectedId)) {
    state.selectedId = matches[0].id;
  }
  const active = matches.find(p => p.id === state.selectedId) ?? null;

  $('lookupStatus').textContent = `Showing ${matches.length} of ${TARGET_PROTOCOLS.length} anatomical protocols.`;
  const list = $('targetList');
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
    if (active && p.id === active.id) btn.setAttribute('aria-current', 'true');
    btn.addEventListener('click', () => {
      state.selectedId = p.id;
      syncUrl();
      renderLookup();
    });
    return btn;
  });
  list.replaceChildren(...rows);
  renderDetail(active);
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

function jumpToTarget(targetId) {
  if (!PROTOCOL_BY_ID[targetId]) return;
  state.kind = 'all';
  state.hemi = 'all';
  state.mode = 'all';
  state.query = '';
  state.selectedId = targetId;
  syncControls();
  syncUrl();
  renderLookup();
  $('lookupSection').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
}

function renderDrills() {
  $('drillsList').replaceChildren(
    ...SCENARIO_DRILLS.map((drill, idx) => {
      const answer = state.drillAnswers.get(drill.id) ?? null;
      const card = el('article', {className: 'drill-card'});
      card.dataset.drill = drill.id;
      card.append(
        el('h3', {textContent: `Trap ${idx + 1}: ${drill.title}`}),
        el('p', {className: 'drill-stem', textContent: drill.stem}),
        el(
          'div',
          {className: 'drill-options'},
          ...drill.options.map(opt => {
            const btn = el('button', {
              type: 'button',
              className: 'drill-option',
              textContent: opt.label,
            });
            btn.dataset.option = opt.id;
            btn.setAttribute('aria-pressed', String(answer?.optionId === opt.id));
            btn.addEventListener('click', () => {
              state.drillAnswers.set(drill.id, evaluateDrill(drill.id, opt.id));
              renderDrills();
            });
            return btn;
          }),
        ),
      );
      const feedback = el('div', {className: 'drill-feedback', role: 'status'});
      feedback.setAttribute('aria-live', 'polite');
      if (!answer) {
        feedback.hidden = true;
      } else {
        feedback.dataset.verdict = answer.correct ? 'correct' : 'wrong';
        const verdict = answer.correct ? 'Correct.' : 'False-reassurance trap.';
        const jumpBtn = el('button', {
          type: 'button',
          className: 'drill-jump',
          textContent: `Inspect ${PROTOCOL_BY_ID[drill.targetId].name} above`,
        });
        jumpBtn.addEventListener('click', () => jumpToTarget(drill.targetId));
        feedback.append(
          el('p', {}, el('strong', {textContent: `${verdict} `}), answer.rationale),
          el('p', {className: 'detail-sources'}, 'Sources: ', sourceLinks(answer.sourceIds)),
          jumpBtn,
        );
      }
      card.append(feedback);
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
    btn.addEventListener('click', () => {
      state.kind = btn.dataset.filterKind;
      syncControls();
      syncUrl();
      renderLookup();
    });
  }
  for (const btn of document.querySelectorAll('[data-filter-hemi]')) {
    btn.addEventListener('click', () => {
      state.hemi = btn.dataset.filterHemi;
      syncControls();
      syncUrl();
      renderLookup();
    });
  }
  modeSelect.addEventListener('change', () => {
    state.mode = modeSelect.value;
    syncUrl();
    renderLookup();
  });
  $('targetSearch').addEventListener('input', event => {
    state.query = event.target.value;
    syncUrl();
    renderLookup();
  });
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
      answeredDrills: Object.fromEntries(state.drillAnswers),
    }),
  });
}

bindControls();
renderLookup();
renderComparison();
renderTasks();
renderModalities();
renderDrills();
renderSources();
