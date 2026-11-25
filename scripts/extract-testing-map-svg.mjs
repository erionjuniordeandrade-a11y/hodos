import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {decodeAtlasBundle, decodeAtlasLabels, MIDLINE_BUNDLE_FAMILIES, resolveBundleId} from '../viewer/atlas_data.js';
import {CORTEX_PROTOCOLS} from '../viewer/testing_cortex_data.js';
import {
  VIEW_W,
  VIEW_H,
  project,
  rasterizeTriangles,
  traceContours,
  closedPathD,
  openPathD,
  centroidOf,
  faceNormals,
  extractSulcalCreases,
  medoidCenterline,
  commissuralMidlineArc,
} from './extract-testing-map-geom.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

async function initDraco() {
  const dir = path.join(root, 'viewer/vendor/addons/libs/draco/gltf');
  const code = fs.readFileSync(path.join(dir, 'draco_wasm_wrapper.js'), 'utf8');
  const ctx = {
    require,
    __dirname: dir,
    process,
    console,
    Buffer,
    URL,
    Uint8Array,
    Int8Array,
    Int32Array,
    Float32Array,
    ArrayBuffer,
    DataView,
    WebAssembly,
    performance,
    setTimeout,
    clearTimeout,
    TextDecoder,
    TextEncoder,
  };
  const DracoDecoderModule = vm.runInNewContext(`${code}; DracoDecoderModule;`, ctx);
  const wasmBinary = fs.readFileSync(path.join(dir, 'draco_decoder.wasm'));
  return DracoDecoderModule({wasmBinary});
}

function decodeCortexGlb(draco, filePath) {
  const glb = fs.readFileSync(filePath);
  const jsonLen = glb.readUInt32LE(12);
  const gltf = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));
  const binStart = 20 + jsonLen + 8;
  const ext = gltf.meshes[0].primitives[0].extensions.KHR_draco_mesh_compression;
  const bv = gltf.bufferViews[ext.bufferView];
  const buf = new Int8Array(glb.buffer, glb.byteOffset + binStart + (bv.byteOffset || 0), bv.byteLength);
  const decoder = new draco.Decoder();
  const dBuf = new draco.DecoderBuffer();
  dBuf.Init(buf, buf.length);
  const mesh = new draco.Mesh();
  const st = decoder.DecodeBufferToMesh(dBuf, mesh);
  if (!st.ok()) throw new Error(`Draco decode failed for ${filePath}`);
  const numPts = mesh.num_points();
  const numFaces = mesh.num_faces();
  const posAttr = decoder.GetAttributeByUniqueId(mesh, ext.attributes.POSITION);
  const posArr = new draco.DracoFloat32Array();
  decoder.GetAttributeFloatForAllPoints(mesh, posAttr, posArr);
  const positions = new Float32Array(numPts * 3);
  for (let i = 0; i < numPts * 3; i++) positions[i] = posArr.GetValue(i);
  const faceArr = new draco.DracoInt32Array();
  const indices = new Uint32Array(numFaces * 3);
  for (let f = 0; f < numFaces; f++) {
    decoder.GetFaceFromMesh(mesh, f, faceArr);
    indices[f * 3] = faceArr.GetValue(0);
    indices[f * 3 + 1] = faceArr.GetValue(1);
    indices[f * 3 + 2] = faceArr.GetValue(2);
  }
  draco.destroy(posArr);
  draco.destroy(faceArr);
  draco.destroy(mesh);
  draco.destroy(dBuf);
  draco.destroy(decoder);
  return {positions, indices, numPts, numFaces};
}

async function main() {
  const draco = await initDraco();
  const surfMeta = JSON.parse(fs.readFileSync(path.join(root, 'viewer/atlas/surface.json'), 'utf8'));
  const lblBuf = zlib.gunzipSync(fs.readFileSync(path.join(root, 'viewer/atlas/surface-labels.bin.gz')));
  const lblArrayBuf = lblBuf.buffer.slice(lblBuf.byteOffset, lblBuf.byteOffset + lblBuf.byteLength);

  const cortexL = decodeCortexGlb(draco, path.join(root, 'viewer/atlas/cortex-L.glb'));
  const cortexR = decodeCortexGlb(draco, path.join(root, 'viewer/atlas/cortex-R.glb'));
  const labels = decodeAtlasLabels(surfMeta, lblArrayBuf, [cortexL.numPts, cortexR.numPts], 'glasser');

  const nxL = faceNormals(cortexL.positions, cortexL.indices);
  const nxR = faceNormals(cortexR.positions, cortexR.indices);

  const outlines = {};
  const medialWalls = {};
  const sulci = {};
  for (const [hemi, mesh, nx, hemiLabels] of [
    ['L', cortexL, nxL, labels.L],
    ['R', cortexR, nxR, labels.R],
  ]) {
    for (const view of ['lateral', 'medial']) {
      const mirror = (view === 'lateral' && hemi === 'R') || (view === 'medial' && hemi === 'L');
      const fullMask = rasterizeTriangles(mesh.positions, mesh.indices, () => true, mirror, 1);
      const outerLoops = traceContours(fullMask);
      outlines[`${hemi}-${view}`] = closedPathD(outerLoops[0], 1.3);
      sulci[`${hemi}-${view}`] = extractSulcalCreases(mesh.positions, mesh.indices, nx, hemi, view, mirror);
      if (view === 'medial') {
        const wallMask = rasterizeTriangles(
          mesh.positions,
          mesh.indices,
          (a, b, c) => hemiLabels[a] === 0 && hemiLabels[b] === 0 && hemiLabels[c] === 0,
          mirror,
          1,
        );
        const wallLoops = traceContours(wallMask);
        medialWalls[`${hemi}-medial`] = wallLoops.length ? closedPathD(wallLoops[0], 1.4) : '';
      }
    }
  }

  const codeToId = {L: new Map(), R: new Map()};
  for (const hemi of ['L', 'R']) {
    const prefix = new RegExp(`^${hemi}_`);
    for (const [idStr, roi] of Object.entries(surfMeta.sets.glasser.regions[hemi])) {
      const code = roi.replace(prefix, '').replace(/_ROI$/, '');
      codeToId[hemi].set(code, Number(idStr));
    }
  }

  const MEDIAL_CORTEX_IDS = new Set(['ctx-sma-psfg-left', 'ctx-sma-psfg-right']);
  const cortexTerritories = {};
  for (const p of CORTEX_PROTOCOLS) {
    const hemi = p.hemi === 'R' ? 'R' : 'L';
    const mesh = hemi === 'L' ? cortexL : cortexR;
    const hemiLabels = labels[hemi];
    const ids = new Set(p.parcels.map(c => codeToId[hemi].get(c)).filter(Boolean));
    const view = MEDIAL_CORTEX_IDS.has(p.id) ? 'medial' : 'lateral';
    const mirror = (view === 'lateral' && hemi === 'R') || (view === 'medial' && hemi === 'L');
    const outwardSign = hemi === 'L' ? (view === 'lateral' ? -1 : 1) : (view === 'lateral' ? 1 : -1);
    const mask = rasterizeTriangles(
      mesh.positions,
      mesh.indices,
      (a, b, c) => {
        if (!(ids.has(hemiLabels[a]) || ids.has(hemiLabels[b]) || ids.has(hemiLabels[c]))) return false;
        const ay = mesh.positions[a * 3 + 1], az = mesh.positions[a * 3 + 2];
        const by = mesh.positions[b * 3 + 1], bz = mesh.positions[b * 3 + 2];
        const cy = mesh.positions[c * 3 + 1], cz = mesh.positions[c * 3 + 2];
        const uy = by - ay, uz = bz - az;
        const vy = cy - ay, vz = cz - az;
        return (uy * vz - uz * vy) * outwardSign > 0;
      },
      mirror,
      1,
    );
    const loops = traceContours(mask);
    if (!loops.length) throw new Error(`No projected polygon for ${p.id}`);
    cortexTerritories[p.id] = {
      view,
      hemi,
      d: closedPathD(loops[0], 1.4),
      anchor: centroidOf(loops[0]),
    };
  }

  const tractsMeta = JSON.parse(fs.readFileSync(path.join(root, 'viewer/atlas/tracts.json'), 'utf8'));
  const tractsBin = fs.readFileSync(path.join(root, 'viewer/atlas/tracts.bin'));
  const tractsBuf = tractsBin.buffer.slice(tractsBin.byteOffset, tractsBin.byteOffset + tractsBin.byteLength);
  const bundleById = new Map(tractsMeta.bundles.map(b => [b.id, b]));

  const tractPaths = {};
  const needed = [
    ['AF', 'L', 'lateral'], ['SLF2', 'L', 'lateral'], ['SLF3', 'L', 'lateral'], ['IFOF', 'L', 'lateral'],
    ['EMC', 'L', 'lateral'], ['UF', 'L', 'lateral'], ['ILF', 'L', 'lateral'], ['VOF', 'L', 'lateral'],
    ['OR', 'L', 'lateral'], ['CST', 'L', 'lateral'],
    ['FAT', 'L', 'medial'], ['SLF1', 'L', 'medial'], ['CST', 'L', 'medial'], ['CC', 'L', 'medial'],
    ['F', 'L', 'medial'], ['TR_A', 'L', 'medial'], ['DRTT', 'L', 'medial'],
    ['SLF2', 'R', 'lateral'], ['SLF3', 'R', 'lateral'], ['AF', 'R', 'lateral'], ['IFOF', 'R', 'lateral'],
    ['EMC', 'R', 'lateral'], ['OR', 'R', 'lateral'], ['CST', 'R', 'lateral'],
    ['FAT', 'R', 'medial'], ['SLF1', 'R', 'medial'], ['CST', 'R', 'medial'], ['CC', 'R', 'medial'],
    ['F', 'R', 'medial'], ['TR_A', 'R', 'medial'], ['DRTT', 'R', 'medial'],
  ];
  for (const [fam, hemi, view] of needed) {
    const id = resolveBundleId(fam, hemi);
    const meta = bundleById.get(id);
    if (!meta) throw new Error(`Missing bundle ${id}`);
    const lines = decodeAtlasBundle(meta, tractsBuf);
    const centerline = MIDLINE_BUNDLE_FAMILIES.includes(fam) ? commissuralMidlineArc(lines) : medoidCenterline(lines);
    const mirror = (view === 'lateral' && hemi === 'R') || (view === 'medial' && hemi === 'L');
    const pts2d = centerline.map(([, y, z]) => project(y, z, mirror));
    const mid = pts2d[Math.floor(pts2d.length / 2)];
    tractPaths[`${fam}-${hemi}-${view}`] = {
      d: openPathD(pts2d, 1.4),
      anchor: [Math.round(mid[0] * 10) / 10, Math.round(mid[1] * 10) / 10],
    };
  }

  const formatMap = obj => `{\n${Object.entries(obj).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')}\n}`;
  const outJs = `export const MAP_VIEWBOX = Object.freeze({width: ${VIEW_W}, height: ${VIEW_H}});
export const BRAIN_OUTLINES = Object.freeze(${formatMap(outlines)});
export const MEDIAL_WALLS = Object.freeze(${formatMap(medialWalls)});
export const SULCAL_CREASES = Object.freeze(${formatMap(sulci)});
export const CORTEX_TERRITORIES = Object.freeze(${formatMap(cortexTerritories)});
export const TRACT_CENTERLINES = Object.freeze(${formatMap(tractPaths)});
`;
  const outPath = path.join(root, 'viewer/testing_map_geometry.js');
  fs.writeFileSync(outPath, outJs);
  console.log(`Wrote ${outPath} (${outJs.length} bytes, ~${Math.round(outJs.length / 4)} tokens)`);
}

main().catch(err => { console.error(err); process.exit(1); });
