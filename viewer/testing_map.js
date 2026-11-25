import {PROTOCOL_BY_ID} from './testing_model.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 250;

const shouldMirrorHorizontally = (view, hemi) =>
  (view === 'lateral' && hemi === 'R') || (view === 'medial' && hemi === 'L');
const mirrorX = (x, mirror) => (mirror ? CANVAS_WIDTH - x : x);

function mirrorPathX(d, mirror) {
  if (!mirror) return d;
  return d.replace(/([MLQC])([^MLQCZ]*)/gi, (_, cmd, nums) => {
    const vals = nums.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    const out = [];
    for (let i = 0; i < vals.length; i += 2) {
      out.push(mirrorX(vals[i], true), vals[i + 1]);
    }
    return `${cmd} ${out.join(' ')} `;
  });
}

const cortex = (id, view, hemi, targetId, shortLabel, [x, y, w, h], labelPos, labelLines = null) =>
  Object.freeze({
    id,
    view,
    hemi,
    targetId,
    kind: 'cortex',
    group: 'Cortex',
    untestable: false,
    shortLabel,
    labelLines,
    shape: {type: 'rect', x, y, w, h, rx: 4},
    labelPos,
  });

const tract = (id, view, hemi, targetId, group, untestable, shortLabel, d, labelPos) =>
  Object.freeze({
    id,
    view,
    hemi,
    targetId,
    kind: 'tract',
    group,
    untestable,
    shortLabel,
    shape: {type: 'path', d},
    labelPos,
  });

export const MAP_REGIONS = Object.freeze([
  cortex('ll-pmfg', 'lateral', 'L', 'ctx-pmfg-left', 'pMFG 55b', [68, 50, 58, 26], [97, 63]),
  cortex('ll-precentral', 'lateral', 'L', 'ctx-precentral-left', 'M1 / vPMC', [134, 42, 36, 64], [152, 74], ['M1', 'vPMC']),
  cortex('ll-ifg', 'lateral', 'L', 'ctx-ifg-left', 'IFG 44/45', [60, 90, 60, 26], [90, 103]),
  cortex('ll-smg', 'lateral', 'L', 'ctx-smg-left', 'SMG', [184, 54, 48, 26], [208, 67]),
  cortex('ll-ang', 'lateral', 'L', 'ctx-ang-left', 'ANG', [242, 60, 48, 26], [266, 73]),
  cortex('ll-pstg', 'lateral', 'L', 'ctx-pstg-left', 'pSTG', [176, 114, 50, 24], [201, 126]),
  cortex('ll-mpsts', 'lateral', 'L', 'ctx-mpsts-left', 'mid-pSTS', [234, 114, 58, 24], [263, 126]),
  cortex('ll-amtg', 'lateral', 'L', 'ctx-amtg-left', 'aMTG', [110, 146, 52, 24], [136, 158]),
  cortex('ll-mitg', 'lateral', 'L', 'ctx-mitg-left', 'mid-ITG', [174, 156, 58, 24], [203, 168]),
  tract('ll-cst', 'lateral', 'L', 'cst-bilateral', 'Projection', false, 'CST', 'M 152 50 Q 168 140 190 222', [188, 210]),
  tract('ll-af', 'lateral', 'L', 'af-left', 'Association', false, 'AF', 'M 95 104 C 132 34 222 34 246 118', [188, 32]),
  tract('ll-slf3', 'lateral', 'L', 'slf3-left', 'Association', false, 'SLF III', 'M 148 96 Q 178 88 208 88', [194, 98]),
  tract('ll-ifof', 'lateral', 'L', 'ifof-left', 'Association', false, 'IFOF', 'M 78 122 C 136 134 228 144 294 134', [146, 132]),
  tract('ll-uf', 'lateral', 'L', 'uf-left', 'Association', false, 'UF', 'M 92 120 Q 104 146 120 154', [82, 146]),
  tract('ll-ilf-vof', 'lateral', 'L', 'ilf-vof-left-reading', 'Association', false, 'ILF/VOF', 'M 146 176 L 268 174 M 278 100 L 278 168', [272, 162]),
  tract('ll-or', 'lateral', 'L', 'or-bilateral', 'Projection', false, 'OR', 'M 152 162 Q 230 144 314 140', [314, 134]),
  cortex('lm-sma', 'medial', 'L', 'ctx-sma-psfg-left', 'SMA / pSFG', [112, 40, 62, 26], [143, 53]),
  tract('lm-cst', 'medial', 'L', 'cst-bilateral', 'Projection', false, 'CST', 'M 182 46 Q 186 138 192 222', [192, 210]),
  tract('lm-fat', 'medial', 'L', 'fat-left', 'Association', false, 'FAT', 'M 124 66 Q 112 94 100 112', [92, 92]),
  tract('lm-slf1', 'medial', 'L', 'slf1-bilateral', 'Association', false, 'SLF I', 'M 148 68 Q 204 54 258 78', [232, 58]),
  tract('lm-fornix', 'medial', 'L', 'fornix-bilateral', 'Projection', true, 'Fornix', 'M 142 134 Q 178 104 218 128', [182, 108]),
  tract('lm-tra', 'medial', 'L', 'tra-bilateral', 'Projection', true, 'TR_A', 'M 176 138 Q 134 128 92 118', [108, 134]),
  tract('lm-drtt', 'medial', 'L', 'drtt-bilateral', 'Projection', true, 'DRTT', 'M 262 204 Q 214 176 186 142', [262, 206]),
  tract('rl-cst', 'lateral', 'R', 'cst-bilateral', 'Projection', false, 'CST', 'M 152 50 Q 168 140 190 222', [188, 210]),
  tract('rl-slf2', 'lateral', 'R', 'slf2-right', 'Association', false, 'Right SLF II', 'M 98 72 Q 182 60 258 82', [244, 72]),
  tract('rl-af', 'lateral', 'R', 'af-right', 'Association', false, 'Right AF', 'M 98 104 C 134 38 220 40 244 120', [212, 46]),
  tract('rl-ifof', 'lateral', 'R', 'ifof-right', 'Association', false, 'Right IFOF', 'M 78 122 C 136 134 228 144 294 134', [142, 144]),
  tract('rl-or', 'lateral', 'R', 'or-bilateral', 'Projection', false, 'OR', 'M 152 162 Q 230 144 314 140', [306, 152]),
  tract('rm-cst', 'medial', 'R', 'cst-bilateral', 'Projection', false, 'CST', 'M 182 46 Q 186 138 192 222', [192, 210]),
  tract('rm-fat', 'medial', 'R', 'fat-right', 'Association', false, 'Right FAT', 'M 124 66 Q 112 94 100 112', [98, 86]),
  tract('rm-slf1', 'medial', 'R', 'slf1-bilateral', 'Association', false, 'SLF I', 'M 148 68 Q 204 54 258 78', [224, 56]),
  tract('rm-fornix', 'medial', 'R', 'fornix-bilateral', 'Projection', true, 'Fornix', 'M 142 134 Q 178 104 218 128', [182, 108]),
  tract('rm-tra', 'medial', 'R', 'tra-bilateral', 'Projection', true, 'TR_A', 'M 176 138 Q 134 128 92 118', [108, 134]),
  tract('rm-drtt', 'medial', 'R', 'drtt-bilateral', 'Projection', true, 'DRTT', 'M 262 204 Q 214 176 186 142', [262, 206]),
]);

export function validateMapCoverage(protocols) {
  const mappedIds = new Set();
  for (const region of MAP_REGIONS) {
    if (!PROTOCOL_BY_ID[region.targetId]) {
      throw new Error(`Map region ${region.id} references unknown protocol ${region.targetId}`);
    }
    mappedIds.add(region.targetId);
  }
  for (const protocol of protocols) {
    if (!mappedIds.has(protocol.id)) {
      throw new Error(`Protocol ${protocol.id} is missing from MAP_REGIONS`);
    }
  }
  return true;
}

function svgEl(tag, attrs = {}, text = null) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    node.setAttribute(k, String(v));
  }
  if (text !== null) node.textContent = text;
  return node;
}

function drawBrainBackground(svg, view, hemi) {
  const mirror = shouldMirrorHorizontally(view, hemi);
  const bg = svgEl('g', {'aria-hidden': 'true'});

  if (view === 'lateral') {
    bg.append(
      svgEl('path', {
        class: 'map-brain-outline',
        d: mirrorPathX(
          'M 42 126 C 38 66 96 28 184 28 C 272 28 326 70 326 126 C 326 164 294 176 254 178 C 234 190 198 192 162 184 C 120 192 84 178 86 148 C 60 148 44 142 42 126 Z',
          mirror,
        ),
      }),
      svgEl('path', {
        class: 'map-brain-stem',
        d: mirrorPathX('M 232 178 C 254 182 286 190 294 212 C 282 224 248 224 224 214 L 204 234 L 178 234 L 182 184', mirror),
      }),
      svgEl('path', {
        class: 'map-brain-landmark',
        d: mirrorPathX('M 174 32 Q 164 76 154 112', mirror),
      }),
      svgEl('path', {
        class: 'map-brain-landmark',
        d: mirrorPathX('M 98 132 Q 168 122 232 104', mirror),
      }),
      svgEl('path', {
        class: 'map-brain-landmark',
        d: mirrorPathX('M 272 48 L 262 82', mirror),
      }),
    );
  } else {
    bg.append(
      svgEl('path', {
        class: 'map-brain-outline',
        d: mirrorPathX(
          'M 42 122 C 42 62 100 28 184 28 C 268 28 324 72 324 128 C 324 166 286 176 244 172 C 208 166 170 156 124 164 C 76 170 44 152 42 122 Z',
          mirror,
        ),
      }),
      svgEl('path', {
        class: 'map-brain-stem',
        d: mirrorPathX('M 232 172 C 264 176 294 192 290 214 C 274 226 240 222 214 212 L 204 234 L 176 234 L 178 164', mirror),
      }),
      svgEl('path', {
        class: 'map-brain-landmark',
        d: mirrorPathX('M 120 124 C 122 92 176 86 226 106 C 240 112 246 128 232 132 C 204 116 148 114 128 134 Z', mirror),
      }),
      svgEl('path', {
        class: 'map-brain-landmark',
        d: mirrorPathX('M 172 32 L 176 74 M 266 56 L 244 102 M 264 140 L 316 128', mirror),
      }),
    );
  }

  const antX = mirror ? CANVAS_WIDTH - 18 : 18;
  const postX = mirror ? 18 : CANVAS_WIDTH - 18;
  bg.append(
    svgEl('text', {class: 'map-orient', x: antX, y: 20}, 'A'),
    svgEl('text', {class: 'map-orient', x: postX, y: 20}, 'P'),
    svgEl('text', {class: 'map-orient', x: CANVAS_WIDTH / 2, y: 14}, 'S'),
    svgEl('text', {class: 'map-orient', x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 8}, 'I'),
  );
  svg.append(bg);
}

function buildHotspot(region, mirror, onSelect) {
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

  if (region.shape.type === 'rect') {
    const {x, y, w, h, rx} = region.shape;
    g.append(
      svgEl('rect', {
        class: 'map-shape',
        x: mirror ? CANVAS_WIDTH - x - w : x,
        y,
        width: w,
        height: h,
        rx,
      }),
    );
  } else {
    const d = mirrorPathX(region.shape.d, mirror);
    g.append(svgEl('path', {class: 'map-hit-area', d}));
    g.append(svgEl('path', {class: 'map-shape', d}));
  }

  const lx = mirrorX(region.labelPos[0], mirror);
  const ly = region.labelPos[1];
  const pillW = Math.max(26, region.shortLabel.length * 6.2 + 10);
  if (region.kind === 'tract') {
    g.append(
      svgEl('rect', {
        class: 'map-pill',
        x: lx - pillW / 2,
        y: ly - 9,
        width: pillW,
        height: 17,
        rx: 3,
      }),
    );
  }
  if (region.labelLines) {
    const text = svgEl('text', {class: 'map-label', x: lx, y: ly - 3});
    region.labelLines.forEach((line, idx) => {
      text.append(svgEl('tspan', {x: lx, dy: idx === 0 ? 0 : 11}, line));
    });
    g.append(text);
  } else {
    g.append(svgEl('text', {class: 'map-label', x: lx, y: ly + 3.5}, region.shortLabel));
  }

  g.addEventListener('click', () => onSelect(region.targetId));
  g.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(region.targetId);
    }
  });
  return g;
}

export function mountTerritoryMap(container, {onSelect, onHemiChange} = {}) {
  let activeHemi = 'L';
  let activeSelectedId = null;

  const head = document.createElement('div');
  head.className = 'territory-map-head';

  const titleWrap = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = 'Interactive brain territory map';
  const note = document.createElement('p');
  note.textContent = 'Click any cortical territory or white matter tract to load its testing protocol.';
  titleWrap.append(title, note);

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
  head.append(titleWrap, hemiGroup);

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
        role: 'img',
        'aria-label': `${label} anatomical testing map`,
      });
      drawBrainBackground(svg, view, activeHemi);
      const mirror = shouldMirrorHorizontally(view, activeHemi);
      const regions = MAP_REGIONS.filter(r => r.view === view && r.hemi === activeHemi);
      const tractsBeneathCortex = [...regions.filter(r => r.kind === 'tract'), ...regions.filter(r => r.kind === 'cortex')];
      for (const region of tractsBeneathCortex) {
        svg.append(buildHotspot(region, mirror, id => onSelect?.(id)));
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
    getHemi: () => activeHemi,
    get targetCount() {
      return grid.querySelectorAll('.map-hotspot').length;
    },
  };
}
