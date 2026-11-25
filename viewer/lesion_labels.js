import {placeLabels} from './atlas_labels.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function statusTag(protocol, evalLens) {
  if (protocol?.mode === 'untestable-anatomy-only') return 'Corridor only';
  if (!evalLens?.active) return '';
  if (!protocol) return 'Uncurated';
  if (evalLens.blindSpotProtocols.some(p => p.id === protocol.id)) return 'Blind spot';
  if (evalLens.interrogatedProtocols.some(p => p.id === protocol.id)) return 'Dimmed';
  return '';
}

function shortTractName(protocol, bundleId) {
  if (!protocol) return bundleId.replace(/_[LR]$/, '');
  if (protocol.id === 'fornix-bilateral') return 'Fornix';
  if (protocol.id === 'slf2-right') return 'Right SLF II';
  if (protocol.id === 'af-right') return 'Right AF';
  if (protocol.id === 'ifof-right') return 'Right IFOF';
  if (protocol.id === 'fat-right') return 'Right FAT';
  if (protocol.families.length > 1) return bundleId.replace(/_[LR]$/, '');
  return protocol.families[0];
}

export function createTractLabelOverlay(stageEl, {onHover, onClick} = {}) {
  const container = document.createElement('div');
  container.id = 'labLabels';
  container.className = 'lab-labels';
  container.setAttribute('aria-hidden', 'false');

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('lab-label-leaders');
  svg.setAttribute('aria-hidden', 'true');
  container.append(svg);
  stageEl.append(container);

  let enabled = true;
  let dragging = false;
  let currentCount = 0;

  function setEnabled(next) {
    enabled = Boolean(next);
    container.hidden = !enabled || dragging;
  }

  function setDragging(next) {
    dragging = Boolean(next);
    container.hidden = !enabled || dragging;
  }

  function clear() {
    currentCount = 0;
    svg.replaceChildren();
    for (const node of [...container.querySelectorAll('.lab-tract-label')]) node.remove();
  }

  function update({reached = [], evalLens = null, entry = null, stage = null, THREE = null, anchorFor = null, isMobile = false}) {
    if (!enabled || dragging || isMobile || !entry || !stage || !THREE || !anchorFor) {
      clear();
      return;
    }
    const frameRect = container.getBoundingClientRect();
    const w = frameRect.width;
    const h = frameRect.height;
    if (w < 120 || h < 120) {
      clear();
      return;
    }

    const cutRows = reached.filter(r => r.cut > 0);
    if (!cutRows.length) {
      clear();
      return;
    }

    const protocolByBundle = new Map();
    const blindIds = new Set((evalLens?.blindSpotProtocols ?? []).map(p => p.id));
    for (const p of evalLens?.protocols ?? []) {
      for (const b of p.matchedBundles) {
        if (!protocolByBundle.has(b.id)) protocolByBundle.set(b.id, p);
      }
    }

    const candidates = cutRows.map(r => {
      const protocol = protocolByBundle.get(r.id) ?? null;
      const isUntestable = protocol?.mode === 'untestable-anatomy-only';
      const isBlind = protocol ? blindIds.has(protocol.id) : false;
      const tier = evalLens?.active
        ? (isBlind || isUntestable ? 0 : !protocol ? 1 : 2)
        : (protocol ? 0 : 1);
      return {row: r, protocol, tier, share: r.cut / r.total};
    });

    candidates.sort((a, b) => a.tier - b.tier || b.share - a.share || a.row.index - b.row.index);
    const chosen = candidates.slice(0, 5);

    const canvasRect = stage.canvas.getBoundingClientRect();
    const v = new THREE.Vector3();
    const items = [];
    for (const item of chosen) {
      const pt = anchorFor(entry, item.row.id);
      if (!pt) continue;
      v.set(pt[0], pt[1], pt[2]).project(stage.camera);
      if (v.z < -1 || v.z > 1) continue;
      const x = canvasRect.left + ((v.x + 1) / 2) * canvasRect.width - frameRect.left;
      const y = canvasRect.top + ((1 - v.y) / 2) * canvasRect.height - frameRect.top;
      if (x < 0 || x > w || y < 0 || y > h) continue;
      const tag = shortTractName(item.protocol, item.row.id);
      const status = statusTag(item.protocol, evalLens);
      const text = status ? `${tag} · ${status}` : tag;
      items.push({item, x, y, text, status});
    }

    clear();
    if (!items.length) return;

    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const nodes = [];
    for (const entryItem of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lab-tract-label';
      btn.dataset.group = entryItem.item.row.group;
      btn.dataset.bundle = entryItem.item.row.id;
      if (entryItem.status) btn.dataset.status = entryItem.status;
      const dot = document.createElement('span');
      dot.className = 'lab-tract-dot';
      dot.setAttribute('aria-hidden', 'true');
      btn.append(dot, entryItem.text);
      btn.addEventListener('pointerenter', () => onHover?.(entryItem.item.row.index));
      btn.addEventListener('pointerleave', () => onHover?.(-1, entryItem.item.row.index));
      btn.addEventListener('click', () => onClick?.(entryItem.item.row.id));
      container.append(btn);
      entryItem.node = btn;
      entryItem.width = Math.ceil(btn.getBoundingClientRect().width);
      entryItem.height = Math.ceil(btn.getBoundingClientRect().height);
      nodes.push(entryItem);
    }

    const orientEl = stageEl.querySelector('.atlas-orientation');
    const obstacles = [];
    if (orientEl) {
      const mr = orientEl.getBoundingClientRect();
      if (mr.width > 0 && mr.height > 0) {
        obstacles.push({
          left: mr.left - frameRect.left,
          top: mr.top - frameRect.top,
          right: mr.right - frameRect.left,
          bottom: mr.bottom - frameRect.top,
        });
      }
    }

    const placed = placeLabels({width: w, height: h, labels: nodes, obstacles, gap: 6, margin: 8});
    nodes.forEach((n, idx) => {
      const {left, top, side} = placed[idx];
      n.node.style.left = `${left}px`;
      n.node.style.top = `${top}px`;
      const line = document.createElementNS(SVG_NS, 'line');
      line.classList.add('lab-tract-leader');
      line.setAttribute('x1', String(side ? left : left + n.width));
      line.setAttribute('y1', String(top + n.height / 2));
      line.setAttribute('x2', String(n.x));
      line.setAttribute('y2', String(n.y));
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.classList.add('lab-tract-anchor');
      dot.setAttribute('cx', String(n.x));
      dot.setAttribute('cy', String(n.y));
      dot.setAttribute('r', '2.5');
      svg.append(line, dot);
    });
    currentCount = nodes.length;
  }

  return {
    setEnabled,
    setDragging,
    update,
    clear,
    get count() {
      return currentCount;
    },
    get enabled() {
      return enabled;
    },
  };
}
