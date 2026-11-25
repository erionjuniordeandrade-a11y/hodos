export const VIEW_W = 440;
export const VIEW_H = 300;
export const SCALE = 1.56;
export const MID_Y = -17;
export const MID_Z = 10;
export const GRID_W = 220;
export const GRID_H = 150;
export const CELL = VIEW_W / GRID_W;

export function project(y, z, mirror) {
  const sx = mirror ? VIEW_W / 2 + (y - MID_Y) * SCALE : VIEW_W / 2 - (y - MID_Y) * SCALE;
  const sy = VIEW_H / 2 - (z - MID_Z) * SCALE;
  return [sx, sy];
}

export function rasterizeTriangles(positions, indices, predicate, mirror, dilate = 0) {
  const mask = new Uint8Array(GRID_W * GRID_H);
  for (let f = 0; f < indices.length; f += 3) {
    const a = indices[f], b = indices[f + 1], c = indices[f + 2];
    if (!predicate(a, b, c)) continue;
    const [ax, ay] = project(positions[a * 3 + 1], positions[a * 3 + 2], mirror);
    const [bx, by] = project(positions[b * 3 + 1], positions[b * 3 + 2], mirror);
    const [cx, cy] = project(positions[c * 3 + 1], positions[c * 3 + 2], mirror);
    const minGX = Math.max(1, Math.floor(Math.min(ax, bx, cx) / CELL));
    const maxGX = Math.min(GRID_W - 2, Math.ceil(Math.max(ax, bx, cx) / CELL));
    const minGY = Math.max(1, Math.floor(Math.min(ay, by, cy) / CELL));
    const maxGY = Math.min(GRID_H - 2, Math.ceil(Math.max(ay, by, cy) / CELL));
    const denom = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    if (Math.abs(denom) < 1e-4) continue;
    for (let gy = minGY; gy <= maxGY; gy++) {
      const py = (gy + 0.5) * CELL;
      for (let gx = minGX; gx <= maxGX; gx++) {
        const px = (gx + 0.5) * CELL;
        const w1 = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / denom;
        const w2 = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / denom;
        const w3 = 1 - w1 - w2;
        if (w1 >= -0.02 && w2 >= -0.02 && w3 >= -0.02) mask[gy * GRID_W + gx] = 1;
      }
    }
  }
  let cur = mask;
  for (let step = 0; step < dilate; step++) {
    const next = new Uint8Array(cur);
    for (let y = 1; y < GRID_H - 1; y++) {
      for (let x = 1; x < GRID_W - 1; x++) {
        const idx = y * GRID_W + x;
        if (cur[idx] || cur[idx - 1] || cur[idx + 1] || cur[idx - GRID_W] || cur[idx + GRID_W]) next[idx] = 1;
      }
    }
    cur = next;
  }
  if (dilate > 0) {
    for (let step = 0; step < dilate; step++) {
      const next = new Uint8Array(cur);
      for (let y = 1; y < GRID_H - 1; y++) {
        for (let x = 1; x < GRID_W - 1; x++) {
          const idx = y * GRID_W + x;
          if (!(cur[idx] && cur[idx - 1] && cur[idx + 1] && cur[idx - GRID_W] && cur[idx + GRID_W])) next[idx] = 0;
        }
      }
      cur = next;
    }
  }
  return cur;
}

function polyArea(pts) {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

export function traceContours(mask) {
  const edges = new Map();
  const key = (x, y) => `${x},${y}`;
  const addEdge = (x1, y1, x2, y2) => {
    const k = key(x1, y1);
    const list = edges.get(k) ?? [];
    list.push([x2, y2]);
    edges.set(k, list);
  };
  for (let y = 0; y < GRID_H - 1; y++) {
    for (let x = 0; x < GRID_W - 1; x++) {
      const tl = mask[y * GRID_W + x];
      const tr = mask[y * GRID_W + x + 1];
      const br = mask[(y + 1) * GRID_W + x + 1];
      const bl = mask[(y + 1) * GRID_W + x];
      const c = (tl << 3) | (tr << 2) | (br << 1) | bl;
      if (c === 0 || c === 15) continue;
      const top = [x + 0.5, y];
      const right = [x + 1, y + 0.5];
      const bottom = [x + 0.5, y + 1];
      const left = [x, y + 0.5];
      const segs = {
        1: [[left, bottom]],
        2: [[bottom, right]],
        3: [[left, right]],
        4: [[right, top]],
        5: [[left, top], [bottom, right]],
        6: [[bottom, top]],
        7: [[left, top]],
        8: [[top, left]],
        9: [[top, bottom]],
        10: [[top, right], [left, bottom]],
        11: [[top, right]],
        12: [[right, left]],
        13: [[right, bottom]],
        14: [[bottom, left]],
      }[c];
      for (const [p1, p2] of segs) addEdge(p1[0], p1[1], p2[0], p2[1]);
    }
  }
  const loops = [];
  while (edges.size) {
    const [startKey] = edges.entries().next().value;
    const [sx, sy] = startKey.split(',').map(Number);
    const loop = [[sx * CELL, sy * CELL]];
    let curKey = startKey;
    while (true) {
      const nextList = edges.get(curKey);
      if (!nextList || !nextList.length) break;
      const [nx, ny] = nextList.pop();
      if (!nextList.length) edges.delete(curKey);
      const nk = key(nx, ny);
      if (nk === startKey) break;
      loop.push([nx * CELL, ny * CELL]);
      curKey = nk;
    }
    if (loop.length >= 6) loops.push(loop);
  }
  loops.sort((a, b) => Math.abs(polyArea(b)) - Math.abs(polyArea(a)));
  return loops;
}

function smoothClosed(pts, passes = 2) {
  let cur = pts;
  for (let p = 0; p < passes; p++) {
    const n = cur.length;
    const next = [];
    for (let i = 0; i < n; i++) {
      const a = cur[(i - 1 + n) % n];
      const b = cur[i];
      const c = cur[(i + 1) % n];
      next.push([a[0] * 0.25 + b[0] * 0.5 + c[0] * 0.25, a[1] * 0.25 + b[1] * 0.5 + c[1] * 0.25]);
    }
    cur = next;
  }
  return cur;
}

function rdp(pts, eps) {
  if (pts.length <= 2) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
  let maxD = -1, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    let d;
    if (len2 < 1e-6) d = Math.hypot(px - ax, py - ay);
    else {
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    }
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD > eps) {
    const left = rdp(pts.slice(0, idx + 1), eps);
    const right = rdp(pts.slice(idx), eps);
    return [...left.slice(0, -1), ...right];
  }
  return [pts[0], pts[pts.length - 1]];
}

export function closedPathD(loop, eps = 1.4) {
  const sm = smoothClosed(loop, 3);
  const simp = rdp([...sm, sm[0]], eps).slice(0, -1);
  if (simp.length < 3) return '';
  const r = v => Math.round(v * 10) / 10;
  return `M${simp.map(([x, y]) => `${r(x)} ${r(y)}`).join('L')}Z`;
}

export function openPathD(pts, eps = 1.2) {
  const simp = rdp(pts, eps);
  if (simp.length < 2) return '';
  const r = v => Math.round(v * 10) / 10;
  if (simp.length === 2) return `M${r(simp[0][0])} ${r(simp[0][1])}L${r(simp[1][0])} ${r(simp[1][1])}`;
  let d = `M${r(simp[0][0])} ${r(simp[0][1])}`;
  for (let i = 1; i < simp.length - 1; i++) {
    const mx = (simp[i][0] + simp[i + 1][0]) / 2;
    const my = (simp[i][1] + simp[i + 1][1]) / 2;
    d += `Q${r(simp[i][0])} ${r(simp[i][1])} ${r(mx)} ${r(my)}`;
  }
  const last = simp[simp.length - 1];
  d += `L${r(last[0])} ${r(last[1])}`;
  return d;
}

export function centroidOf(loop) {
  let sx = 0, sy = 0;
  for (const [x, y] of loop) { sx += x; sy += y; }
  return [Math.round((sx / loop.length) * 10) / 10, Math.round((sy / loop.length) * 10) / 10];
}

export function faceNormals(positions, indices) {
  const nx = new Float32Array(indices.length / 3);
  for (let f = 0; f < indices.length; f += 3) {
    const a = indices[f] * 3, b = indices[f + 1] * 3, c = indices[f + 2] * 3;
    const uy = positions[b + 1] - positions[a + 1], uz = positions[b + 2] - positions[a + 2];
    const vy = positions[c + 1] - positions[a + 1], vz = positions[c + 2] - positions[a + 2];
    const cx = uy * vz - uz * vy;
    const ux = positions[b] - positions[a], vx = positions[c] - positions[a];
    const cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    const len = Math.hypot(cx, cy, cz) || 1;
    nx[f / 3] = cx / len;
  }
  return nx;
}

export function extractSulcalCreases(positions, indices, nx, hemi, view, mirror) {
  const isLat = view === 'lateral';
  const depth = new Float32Array(GRID_W * GRID_H).fill(NaN);
  const outwardSign = hemi === 'L' ? (isLat ? -1 : 1) : (isLat ? 1 : -1);
  for (let f = 0; f < indices.length; f += 3) {
    if (nx[f / 3] * outwardSign < 0.08) continue;
    const a = indices[f] * 3, b = indices[f + 1] * 3, c = indices[f + 2] * 3;
    const mx = (positions[a] + positions[b] + positions[c]) / 3;
    const my = (positions[a + 1] + positions[b + 1] + positions[c + 1]) / 3;
    const mz = (positions[a + 2] + positions[b + 2] + positions[c + 2]) / 3;
    const [px, py] = project(my, mz, mirror);
    const gx = Math.round(px / CELL), gy = Math.round(py / CELL);
    if (gx < 2 || gx >= GRID_W - 2 || gy < 2 || gy >= GRID_H - 2) continue;
    const val = mx * outwardSign;
    const idx = gy * GRID_W + gx;
    if (Number.isNaN(depth[idx]) || val > depth[idx]) depth[idx] = val;
  }
  const sulciMask = new Uint8Array(GRID_W * GRID_H);
  for (let y = 4; y < GRID_H - 4; y++) {
    for (let x = 4; x < GRID_W - 4; x++) {
      const idx = y * GRID_W + x;
      const d = depth[idx];
      if (Number.isNaN(d)) continue;
      let maxN = -Infinity, count = 0;
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const v = depth[(y + dy) * GRID_W + (x + dx)];
          if (!Number.isNaN(v)) { count++; if (v > maxN) maxN = v; }
        }
      }
      if (count >= 35 && maxN - d > 5.2) sulciMask[idx] = 1;
    }
  }
  const loops = traceContours(sulciMask).filter(l => l.length >= 14).slice(0, 12);
  return loops.map(l => closedPathD(l, 1.8)).filter(Boolean);
}

function resampleLine(pts, n = 22) {
  const segLen = [0];
  for (let i = 1; i < pts.length; i++) {
    segLen.push(segLen[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  }
  const total = segLen[segLen.length - 1];
  if (total < 1e-4) return Array.from({length: n}, () => pts[0]);
  const out = [];
  for (let k = 0; k < n; k++) {
    const target = (k / (n - 1)) * total;
    let i = 1;
    while (i < segLen.length - 1 && segLen[i] < target) i++;
    const span = segLen[i] - segLen[i - 1] || 1;
    const t = (target - segLen[i - 1]) / span;
    out.push([
      pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
      pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t,
      pts[i - 1][2] + (pts[i][2] - pts[i - 1][2]) * t,
    ]);
  }
  return out;
}

export function medoidCenterline(lines) {
  const N = 22;
  const sampled = lines.map(line => {
    const pts = [];
    if (Array.isArray(line[0]) || ArrayBuffer.isView(line[0])) {
      for (const p of line) pts.push([Number(p[0]), Number(p[1]), Number(p[2])]);
    } else {
      for (let i = 0; i < line.length; i += 3) pts.push([Number(line[i]), Number(line[i + 1]), Number(line[i + 2])]);
    }
    return resampleLine(pts, N);
  });
  const ref = sampled[0];
  const aligned = sampled.map(line => {
    const dSame = Math.hypot(line[0][0] - ref[0][0], line[0][1] - ref[0][1], line[0][2] - ref[0][2]);
    const dRev = Math.hypot(line[N - 1][0] - ref[0][0], line[N - 1][1] - ref[0][1], line[N - 1][2] - ref[0][2]);
    return dRev < dSame ? [...line].reverse() : line;
  });
  const mean = Array.from({length: N}, (_, k) => {
    let x = 0, y = 0, z = 0;
    for (const line of aligned) { x += line[k][0]; y += line[k][1]; z += line[k][2]; }
    return [x / aligned.length, y / aligned.length, z / aligned.length];
  });
  let best = aligned[0], bestDist = Infinity;
  for (const line of aligned) {
    let d = 0;
    for (let k = 0; k < N; k++) d += Math.hypot(line[k][0] - mean[k][0], line[k][1] - mean[k][1], line[k][2] - mean[k][2]);
    if (d < bestDist) { bestDist = d; best = line; }
  }
  return best.map((p, i) => {
    if (i === 0 || i === N - 1) return p;
    const a = best[i - 1], c = best[i + 1];
    return [a[0] * 0.25 + p[0] * 0.5 + c[0] * 0.25, a[1] * 0.25 + p[1] * 0.5 + c[1] * 0.25, a[2] * 0.25 + p[2] * 0.5 + c[2] * 0.25];
  });
}
