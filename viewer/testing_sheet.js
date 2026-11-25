const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.filter(c => c !== null && c !== undefined && c !== false));
  return node;
};

function taskColumnItems(tasks, emptyText) {
  if (!tasks.length) return el('p', {className: 'sheet-empty', textContent: emptyText});
  return el(
    'ul',
    {className: 'sheet-list'},
    ...tasks.map(t =>
      el(
        'li',
        {},
        el('strong', {textContent: t.name}),
        el('span', {className: 'sheet-meta', textContent: `${t.timing} (${t.targets.join(', ')})`}),
        el('span', {className: 'sheet-caveat', textContent: t.caveat}),
      ),
    ),
  );
}

function trapColumnItems(sheet, formatBundle) {
  const items = [];
  for (const b of sheet.blindSpots) {
    items.push(
      el(
        'li',
        {className: 'sheet-trap-item'},
        el('strong', {textContent: b.isBlindSpot ? `${b.name} (Blind spot)` : b.name}),
        el('span', {className: 'sheet-caveat', textContent: b.blindSpot}),
      ),
    );
  }
  for (const u of sheet.untestable) {
    items.push(
      el(
        'li',
        {className: 'sheet-untestable-item'},
        el('strong', {textContent: `${u.name} (Corridor only)`}),
        el('span', {className: 'sheet-caveat', textContent: u.execution}),
      ),
    );
  }
  if (sheet.uncurated.length) {
    items.push(
      el(
        'li',
        {},
        el('strong', {textContent: 'Uncurated atlas bundles (stay bright)'}),
        el('span', {className: 'sheet-meta', textContent: sheet.uncurated.map(formatBundle).join(', ')}),
      ),
    );
  }
  if (!items.length) return el('p', {className: 'sheet-empty', textContent: 'No blind spots or untestable corridors in this selection.'});
  return el('ul', {className: 'sheet-list'}, ...items);
}

export function renderTestingSheet(
  dialog,
  sheet,
  {snapshotUrl = '', thirdColTitle = 'False-reassurance trap & limits', formatBundle = id => id} = {},
) {
  const watermarkEl = dialog.querySelector('[data-sheet-watermark]');
  const titleEl = dialog.querySelector('[data-sheet-title]');
  const subtitleEl = dialog.querySelector('[data-sheet-subtitle]');
  const bodyEl = dialog.querySelector('[data-sheet-body]');
  const statusEl = dialog.querySelector('[data-sheet-status]');
  if (watermarkEl) watermarkEl.textContent = sheet.watermark;
  if (titleEl) titleEl.textContent = sheet.title;
  if (subtitleEl) {
    const hemiText = sheet.hemi === 'both' || sheet.hemi === 'all' ? 'Bilateral' : sheet.hemi === 'R' ? 'Right hemisphere' : 'Left hemisphere';
    subtitleEl.textContent = sheet.subtitle ? `${hemiText} · ${sheet.subtitle}` : hemiText;
  }
  if (statusEl) statusEl.textContent = '';

  const parts = [];
  if (snapshotUrl) {
    parts.push(
      el(
        'figure',
        {className: 'sheet-snapshot'},
        el('img', {src: snapshotUrl, alt: '3D Lesion lab snapshot for this testing sheet'}),
        el('figcaption', {textContent: '3D Lesion lab group-reference view at capture.'}),
      ),
    );
  }
  if (sheet.note) parts.push(el('p', {className: 'sheet-note', textContent: sheet.note}));

  const table = el(
    'div',
    {className: 'sheet-table-wrap'},
    el(
      'table',
      {className: 'sheet-table'},
      el(
        'thead',
        {},
        el(
          'tr',
          {},
          el('th', {scope: 'col', textContent: 'Map <=4 s DES / HF probe'}),
          el('th', {scope: 'col', textContent: 'Monitor continuously'}),
          el('th', {scope: 'col', textContent: thirdColTitle}),
        ),
      ),
      el(
        'tbody',
        {},
        el(
          'tr',
          {},
          el('td', {}, taskColumnItems(sheet.mapTasks, 'No real-time focal mapping task.')),
          el('td', {}, taskColumnItems(sheet.monitorTasks, 'No continuous monitoring surrogate.')),
          el('td', {}, trapColumnItems(sheet, formatBundle)),
        ),
      ),
    ),
  );
  parts.push(table);

  if (sheet.errorSignatures.length) {
    parts.push(
      el(
        'section',
        {className: 'sheet-section'},
        el('h3', {textContent: 'Error signatures and execution'}),
        el(
          'ul',
          {className: 'sheet-list'},
          ...sheet.errorSignatures.map(sig =>
            el(
              'li',
              {},
              el('strong', {textContent: sig.name}),
              el('span', {className: 'sheet-meta', textContent: sig.errorSignature}),
              el('span', {className: 'sheet-caveat', textContent: sig.execution}),
            ),
          ),
        ),
      ),
    );
  }

  if (sheet.sources.length) {
    parts.push(
      el(
        'section',
        {className: 'sheet-section'},
        el('h3', {textContent: 'Verified PubMed / DOI sources'}),
        el(
          'ol',
          {className: 'sheet-sources'},
          ...sheet.sources.map(src =>
            el(
              'li',
              {},
              el('a', {href: src.url, target: '_blank', rel: 'noopener noreferrer', textContent: src.title}),
              el('span', {className: 'sheet-meta', textContent: src.scope}),
            ),
          ),
        ),
      ),
    );
  }

  bodyEl?.replaceChildren(...parts);
}

export function bindTestingSheetDialog(dialog, {getShareUrl = () => location.href} = {}) {
  const printBtn = dialog.querySelector('[data-sheet-print]');
  const copyBtn = dialog.querySelector('[data-sheet-copy]');
  const closeBtn = dialog.querySelector('[data-sheet-close]');
  const statusEl = dialog.querySelector('[data-sheet-status]');

  printBtn?.addEventListener('click', () => window.print());
  closeBtn?.addEventListener('click', () => dialog.close());
  copyBtn?.addEventListener('click', async () => {
    const url = getShareUrl();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        if (statusEl) statusEl.textContent = 'Shareable link copied to clipboard.';
      } else if (statusEl) {
        statusEl.textContent = 'Copy the link from your browser address bar.';
      }
    } catch {
      if (statusEl) statusEl.textContent = 'Copy the link from your browser address bar.';
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
}
