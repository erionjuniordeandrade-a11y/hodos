import {PROTOCOL_BY_ID} from './testing_model.js';
import {
  MAP_VIEWBOX,
  BRAIN_OUTLINES,
  MEDIAL_WALLS,
  SULCAL_CREASES,
  CORTEX_TERRITORIES,
  TRACT_CENTERLINES,
} from './testing_map_geometry.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const {width: CANVAS_WIDTH, height: CANVAS_HEIGHT} = MAP_VIEWBOX;
const LEFT_COL_X = 46;
const RIGHT_COL_X = 394;
const PILL_H = 15;
const MIN_STEP = 18;
const TOP_MIN_Y = 24;
const BOTTOM_MAX_Y = CANVAS_HEIGHT - 18;

const cortex = (id, view, hemi, targetId, shortLabel) => {
  const geom = CORTEX_TERRITORIES[targetId];
  if (!geom) throw new Error(`Missing cortex geometry for ${targetId}`);
  return Object.freeze({
    id,
    view,
    hemi,
    targetId,
    kind: 'cortex',
    group: 'Cortex',
    untestable: false,
    shortLabel,
    shape: {type: 'path', d: geom.d},
    anchor: geom.anchor,
  });
};

const tract = (id, view, hemi, targetId, group, untestable, shortLabel, keys) => {
  const parts = keys.map(k => {
    const geom = TRACT_CENTERLINES[k];
    if (!geom) throw new Error(`Missing tract geometry for ${k}`);
    return geom;
  });
  const d = parts.map(p => p.d).join(' ');
  const ax = parts.reduce((sum, p) => sum + p.anchor[0], 0) / parts.length;
  const ay = parts.reduce((sum, p) => sum + p.anchor[1], 0) / parts.length;
  return Object.freeze({
    id,
    view,
    hemi,
    targetId,
    kind: 'tract',
    group,
    untestable,
    shortLabel,
    shape: {type: 'path', d},
    anchor: [Math.round(ax * 10) / 10, Math.round(ay * 10) / 10],
  });
};

export const MAP_REGIONS = Object.freeze([
  cortex('ll-pmfg', 'lateral', 'L', 'ctx-pmfg-left', 'pMFG 55b'),
  cortex('ll-precentral', 'lateral', 'L', 'ctx-precentral-left', 'M1 / vPMC'),
  cortex('ll-ifg', 'lateral', 'L', 'ctx-ifg-left', 'IFG 44/45'),
  cortex('ll-smg', 'lateral', 'L', 'ctx-smg-left', 'SMG'),
  cortex('ll-ang', 'lateral', 'L', 'ctx-ang-left', 'ANG'),
  cortex('ll-pstg', 'lateral', 'L', 'ctx-pstg-left', 'pSTG'),
  cortex('ll-mpsts', 'lateral', 'L', 'ctx-mpsts-left', 'mid-pSTS'),
  cortex('ll-amtg', 'lateral', 'L', 'ctx-amtg-left', 'aMTG'),
  cortex('ll-mitg', 'lateral', 'L', 'ctx-mitg-left', 'mid-ITG'),
  tract('ll-cst', 'lateral', 'L', 'cst-bilateral', 'Projection', false, 'CST', ['CST-L-lateral']),
  tract('ll-af', 'lateral', 'L', 'af-left', 'Association', false, 'AF', ['AF-L-lateral']),
  tract('ll-slf3', 'lateral', 'L', 'slf3-left', 'Association', false, 'SLF III', ['SLF3-L-lateral']),
  tract('ll-ifof', 'lateral', 'L', 'ifof-left', 'Association', false, 'IFOF', ['IFOF-L-lateral']),
  tract('ll-uf', 'lateral', 'L', 'uf-left', 'Association', false, 'UF', ['UF-L-lateral']),
  tract('ll-ilf-vof', 'lateral', 'L', 'ilf-vof-left-reading', 'Association', false, 'ILF/VOF', [
    'ILF-L-lateral',
    'VOF-L-lateral',
  ]),
  tract('ll-or', 'lateral', 'L', 'or-bilateral', 'Projection', false, 'OR', ['OR-L-lateral']),
  cortex('lm-sma', 'medial', 'L', 'ctx-sma-psfg-left', 'SMA / pSFG'),
  tract('lm-cst', 'medial', 'L', 'cst-bilateral', 'Projection', false, 'CST', ['CST-L-medial']),
  tract('lm-fat', 'medial', 'L', 'fat-left', 'Association', false, 'FAT', ['FAT-L-medial']),
  tract('lm-slf1', 'medial', 'L', 'slf1-bilateral', 'Association', false, 'SLF I', ['SLF1-L-medial']),
  tract('lm-fornix', 'medial', 'L', 'fornix-bilateral', 'Projection', true, 'Fornix', ['F-L-medial']),
  tract('lm-tra', 'medial', 'L', 'tra-bilateral', 'Projection', true, 'TR_A', ['TR_A-L-medial']),
  tract('lm-drtt', 'medial', 'L', 'drtt-bilateral', 'Projection', true, 'DRTT', ['DRTT-L-medial']),
  tract('rl-cst', 'lateral', 'R', 'cst-bilateral', 'Projection', false, 'CST', ['CST-R-lateral']),
  tract('rl-slf2', 'lateral', 'R', 'slf2-right', 'Association', false, 'Right SLF II', ['SLF2-R-lateral']),
  tract('rl-af', 'lateral', 'R', 'af-right', 'Association', false, 'Right AF', ['AF-R-lateral']),
  tract('rl-ifof', 'lateral', 'R', 'ifof-right', 'Association', false, 'Right IFOF', ['IFOF-R-lateral']),
  tract('rl-or', 'lateral', 'R', 'or-bilateral', 'Projection', false, 'OR', ['OR-R-lateral']),
  tract('rm-cst', 'medial', 'R', 'cst-bilateral', 'Projection', false, 'CST', ['CST-R-medial']),
  tract('rm-fat', 'medial', 'R', 'fat-right', 'Association', false, 'Right FAT', ['FAT-R-medial']),
  tract('rm-slf1', 'medial', 'R', 'slf1-bilateral', 'Association', false, 'SLF I', ['SLF1-R-medial']),
  tract('rm-fornix', 'medial', 'R', 'fornix-bilateral', 'Projection', true, 'Fornix', ['F-R-medial']),
  tract('rm-tra', 'medial', 'R', 'tra-bilateral', 'Projection', true, 'TR_A', ['TR_A-R-medial']),
  tract('rm-drtt', 'medial', 'R', 'drtt-bilateral', 'Projection', true, 'DRTT', ['DRTT-R-medial']),
]);

export function validateMapCoverage(protocols) {
  const mappedIds = new Set();
  for (const region of MAP_REGIONS) {
    if (!PROTOCOL_BY_ID[region.targetId]) {
      throw new Error(`Map region ${region.id} references unknown structure ${region.targetId}`);
    }
    mappedIds.add(region.targetId);
  }
  for (const protocol of protocols) {
    if (!mappedIds.has(protocol.id)) {
      throw new Error(`Structure ${protocol.id} is missing from MAP_REGIONS`);
    }
  }
  return true;
}

function stackColumnY(items) {
  if (!items.length) return [];
  const ys = items.map(item => Math.max(TOP_MIN_Y, Math.min(BOTTOM_MAX_Y, item.anchor[1])));
  for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + MIN_STEP);
  if (ys[ys.length - 1] > BOTTOM_MAX_Y) {
    ys[ys.length - 1] = BOTTOM_MAX_Y;
    for (let i = ys.length - 2; i >= 0; i--) ys[i] = Math.min(ys[i], ys[i + 1] - MIN_STEP);
  }
  return ys;
}

function layoutCallouts(regions) {
  const cols = [[], []];
  for (const r of regions) cols[r.anchor[0] < CANVAS_WIDTH / 2 ? 0 : 1].push(r);
  const maxPerCol = Math.floor((BOTTOM_MAX_Y - TOP_MIN_Y) / MIN_STEP) + 1;
  for (const side of [0, 1]) {
    while (cols[side].length > maxPerCol && cols[1 - side].length < maxPerCol) {
      cols[side].sort((a, b) => Math.abs(a.anchor[0] - CANVAS_WIDTH / 2) - Math.abs(b.anchor[0] - CANVAS_WIDTH / 2));
      cols[1 - side].push(cols[side].shift());
    }
  }
  const placements = new Map();
  for (const side of [0, 1]) {
    cols[side].sort((a, b) => a.anchor[1] - b.anchor[1] || a.id.localeCompare(b.id));
    const ys = stackColumnY(cols[side]);
    const pillX = side === 0 ? LEFT_COL_X : RIGHT_COL_X;
    cols[side].forEach((region, idx) => {
      const pillW = Math.min(76, Math.max(36, region.shortLabel.length * 5.0 + 10));
      placements.set(region.id, {side, pillX, pillY: ys[idx], pillW});
    });
  }
  return placements;
}

function svgEl(tag, attrs = {}, text = null) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (text !== null) node.textContent = text;
  return node;
}

function drawBrainBackground(svg, view, hemi) {
  const key = `${hemi}-${view}`;
  const mirror = (view === 'lateral' && hemi === 'R') || (view === 'medial' && hemi === 'L');
  const bg = svgEl('g', {'aria-hidden': 'true'});

  const outlineD = BRAIN_OUTLINES[key];
  if (outlineD) bg.append(svgEl('path', {class: 'map-brain-outline', d: outlineD}));
  for (const d of SULCAL_CREASES[key] ?? []) {
    bg.append(svgEl('path', {class: 'map-sulcus', d}));
  }
  if (view === 'medial' && MEDIAL_WALLS[key]) {
    bg.append(svgEl('path', {class: 'map-medial-wall', d: MEDIAL_WALLS[key]}));
  }

  const antX = mirror ? 344 : 96;
  const postX = mirror ? 96 : 344;
  bg.append(
    svgEl('text', {class: 'map-orient', x: antX, y: 26}, 'A'),
    svgEl('text', {class: 'map-orient', x: postX, y: 26}, 'P'),
    svgEl('text', {class: 'map-orient', x: CANVAS_WIDTH / 2, y: 16}, 'S'),
    svgEl('text', {class: 'map-orient', x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 10}, 'I'),
  );
  svg.append(bg);
}

function buildHotspot(region, placement, onSelect) {
  const protocol = PROTOCOL_BY_ID[region.targetId];
  const g = svgEl('g', {
    class: 'map-hotspot',
    role: 'button',
    tabindex: '0',
    'data-map-target': region.targetId,
    'data-kind': region.kind,
    'data-group': region.group,
    'data-untestable': String(region.untestable),
    'aria-label': `${protocol.name} (${region.kind})`,
    'aria-pressed': 'false',
  });

  if (region.kind === 'tract') {
    g.append(svgEl('path', {class: 'map-hit-area', d: region.shape.d}));
  }
  g.append(svgEl('path', {class: 'map-shape', d: region.shape.d}));

  const [ax, ay] = region.anchor;
  g.append(svgEl('circle', {class: 'map-anchor-dot', cx: ax, cy: ay, r: 2.2}));

  g.addEventListener('click', () => onSelect(region.targetId));
  g.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(region.targetId);
    }
  });

  const {side, pillX, pillY, pillW} = placement;
  const edgeX = side === 0 ? pillX + pillW / 2 : pillX - pillW / 2;
  const callout = svgEl('g', {
    class: 'map-callout-item',
    'data-callout-target': region.targetId,
    'data-kind': region.kind,
    'data-group': region.group,
    'data-untestable': String(region.untestable),
    'aria-hidden': 'true',
  });
  callout.append(
    svgEl('line', {class: 'map-leader', x1: edgeX, y1: pillY, x2: ax, y2: ay}),
    svgEl('rect', {
      class: 'map-pill map-callout',
      x: pillX - pillW / 2,
      y: pillY - PILL_H / 2,
      width: pillW,
      height: PILL_H,
      rx: 3,
    }),
    svgEl('text', {class: 'map-label', x: pillX, y: pillY + 3}, region.shortLabel),
  );
  callout.addEventListener('click', () => onSelect(region.targetId));

  return {hotspot: g, callout};
}

export function mountTerritoryMap(container, {onSelect, onHemiChange} = {}) {
  let activeHemi = 'L';
  let activeLayer = 'both';
  let activeSelectedId = null;

  const head = document.createElement('div');
  head.className = 'territory-map-head';

  const titleWrap = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = 'Interactive brain territory map';
  const note = document.createElement('p');
  note.textContent = 'Click any cortical territory or white matter tract to load its testing card.';
  titleWrap.append(title, note);

  const controlsWrap = document.createElement('div');
  controlsWrap.className = 'territory-map-controls';

  const hemiGroup = document.createElement('div');
  hemiGroup.className = 'segmented';
  hemiGroup.setAttribute('role', 'group');
  hemiGroup.setAttribute('aria-label', 'Map hemisphere');
  const btnL = document.createElement('button');
  btnL.type = 'button';
  btnL.dataset.mapHemi = 'L';
  btnL.textContent = 'Left hemisphere';
  const btnR = document.createElement('button');
  btnR.type = 'button';
  btnR.dataset.mapHemi = 'R';
  btnR.textContent = 'Right hemisphere';
  hemiGroup.append(btnL, btnR);

  const layerGroup = document.createElement('div');
  layerGroup.className = 'segmented';
  layerGroup.setAttribute('role', 'group');
  layerGroup.setAttribute('aria-label', 'Map layer');
  const layerButtons = [
    ['both', 'Both'],
    ['cortex', 'Cortex'],
    ['tract', 'Tracts'],
  ].map(([val, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.mapLayer = val;
    b.textContent = label;
    b.addEventListener('click', () => {
      if (activeLayer === val) return;
      activeLayer = val;
      renderPanels();
    });
    return b;
  });
  layerGroup.append(...layerButtons);

  controlsWrap.append(hemiGroup, layerGroup);
  head.append(titleWrap, controlsWrap);

  const grid = document.createElement('div');
  grid.className = 'territory-map-grid';

  const legend = document.createElement('ul');
  legend.className = 'territory-map-legend';
  const legendItems = [
    ['cortex', 'Cortical territory'],
    ['association', 'Association tract'],
    ['projection', 'Projection tract'],
    ['untestable', 'Corridor only (untestable)'],
  ];
  for (const [kind, label] of legendItems) {
    const li = document.createElement('li');
    li.dataset.legend = kind;
    const swatch = document.createElement('span');
    swatch.className = 'territory-map-swatch';
    swatch.setAttribute('aria-hidden', 'true');
    li.append(swatch, label);
    legend.append(li);
  }

  container.replaceChildren(head, grid, legend);

  function renderPanels() {
    btnL.setAttribute('aria-pressed', String(activeHemi === 'L'));
    btnR.setAttribute('aria-pressed', String(activeHemi === 'R'));
    for (const b of layerButtons) b.setAttribute('aria-pressed', String(b.dataset.mapLayer === activeLayer));
    const views = [
      {view: 'lateral', label: `${activeHemi === 'L' ? 'Left' : 'Right'} lateral view`},
      {view: 'medial', label: `${activeHemi === 'L' ? 'Left' : 'Right'} medial view`},
    ];
    const panels = views.map(({view, label}) => {
      const fig = document.createElement('figure');
      fig.className = 'territory-map-panel';
      const cap = document.createElement('figcaption');
      cap.textContent = label;
      const svg = svgEl('svg', {
        class: 'territory-map-svg',
        viewBox: `0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`,
        role: 'group',
        'aria-label': `${label} anatomical testing map`,
      });
      drawBrainBackground(svg, view, activeHemi);
      const regions = MAP_REGIONS.filter(
        r => r.view === view && r.hemi === activeHemi && (activeLayer === 'both' || r.kind === activeLayer),
      );
      const placements = layoutCallouts(regions);
      const ordered = [...regions.filter(r => r.kind === 'cortex'), ...regions.filter(r => r.kind === 'tract')];
      const callouts = [];
      for (const region of ordered) {
        const {hotspot, callout} = buildHotspot(region, placements.get(region.id), id => onSelect?.(id));
        svg.append(hotspot);
        callouts.push(callout);
      }
      for (const callout of callouts) svg.append(callout);
      if (!ordered.length) {
        svg.append(svgEl('text', {class: 'map-empty-note', x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 28}, 'No right-hemisphere cortical cards yet.'));
      }
      fig.append(cap, svg);
      return fig;
    });
    grid.replaceChildren(...panels);
    syncSelection();
  }

  function syncSelection() {
    for (const el of grid.querySelectorAll('.map-hotspot')) {
      const selected = el.dataset.mapTarget === activeSelectedId;
      el.dataset.selected = String(selected);
      el.setAttribute('aria-pressed', String(selected));
    }
    for (const el of grid.querySelectorAll('.map-callout-item')) {
      el.dataset.selected = String(el.dataset.calloutTarget === activeSelectedId);
    }
  }

  btnL.addEventListener('click', () => {
    if (activeHemi === 'L') return;
    activeHemi = 'L';
    renderPanels();
    onHemiChange?.('L');
  });
  btnR.addEventListener('click', () => {
    if (activeHemi === 'R') return;
    activeHemi = 'R';
    renderPanels();
    onHemiChange?.('R');
  });

  renderPanels();

  return {
    update({selectedId = null, hemi = null} = {}) {
      activeSelectedId = selectedId;
      if ((hemi === 'L' || hemi === 'R') && hemi !== activeHemi) {
        activeHemi = hemi;
        renderPanels();
      } else {
        syncSelection();
      }
    },
    setHemi(hemi) {
      if ((hemi === 'L' || hemi === 'R') && hemi !== activeHemi) {
        activeHemi = hemi;
        renderPanels();
      }
    },
    setLayer(layer) {
      if (['both', 'cortex', 'tract'].includes(layer) && layer !== activeLayer) {
        activeLayer = layer;
        renderPanels();
      }
    },
    getHemi: () => activeHemi,
    getLayer: () => activeLayer,
    get targetCount() {
      return grid.querySelectorAll('.map-hotspot').length;
    },
  };
}
