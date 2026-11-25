import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {decodeAtlasBundle, decodeAtlasLabels} from '../viewer/atlas_data.js';
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

  const codeToIdL = new Map();
  for (const [idStr, roi] of Object.entries(surfMeta.sets.glasser.regions.L)) {
    const code = roi.replace(/^L_/, '').replace(/_ROI$/, '');
    codeToIdL.set(code, Number(idStr));
  }

  const cortexTerritories = {};
  for (const p of CORTEX_PROTOCOLS) {
    const ids = new Set(p.parcels.map(c => codeToIdL.get(c)).filter(Boolean));
    const view = p.id === 'ctx-sma-psfg-left' ? 'medial' : 'lateral';
    const mirror = view === 'medial';
    const outwardSign = view === 'lateral' ? -1 : 1;
    const mask = rasterizeTriangles(
      cortexL.positions,
      cortexL.indices,
      (a, b, c) => {
        if (!(ids.has(labels.L[a]) || ids.has(labels.L[b]) || ids.has(labels.L[c]))) return false;
        const ax = cortexL.positions[a * 3], ay = cortexL.positions[a * 3 + 1], az = cortexL.positions[a * 3 + 2];
        const bx = cortexL.positions[b * 3], by = cortexL.positions[b * 3 + 1], bz = cortexL.positions[b * 3 + 2];
        const cx = cortexL.positions[c * 3], cy = cortexL.positions[c * 3 + 1], cz = cortexL.positions[c * 3 + 2];
        const ux = bx - ax, uy = by - ay, uz = bz - az;
        const vx = cx - ax, vy = cy - ay, vz = cz - az;
        const nxf = uy * vz - uz * vy;
        return nxf * outwardSign > 0;
      },
      mirror,
      1,
    );
    const loops = traceContours(mask);
    if (!loops.length) throw new Error(`No projected polygon for ${p.id}`);
    cortexTerritories[p.id] = {
      view,
      hemi: 'L',
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
    ['AF', 'L', 'lateral'], ['SLF3', 'L', 'lateral'], ['IFOF', 'L', 'lateral'], ['UF', 'L', 'lateral'],
    ['ILF', 'L', 'lateral'], ['VOF', 'L', 'lateral'], ['OR', 'L', 'lateral'], ['CST', 'L', 'lateral'],
    ['FAT', 'L', 'medial'], ['SLF1', 'L', 'medial'], ['CST', 'L', 'medial'], ['F', 'L', 'medial'],
    ['TR_A', 'L', 'medial'], ['DRTT', 'L', 'medial'],
    ['SLF2', 'R', 'lateral'], ['AF', 'R', 'lateral'], ['IFOF', 'R', 'lateral'], ['OR', 'R', 'lateral'], ['CST', 'R', 'lateral'],
    ['FAT', 'R', 'medial'], ['SLF1', 'R', 'medial'], ['CST', 'R', 'medial'], ['F', 'R', 'medial'],
    ['TR_A', 'R', 'medial'], ['DRTT', 'R', 'medial'],
  ];
  for (const [fam, hemi, view] of needed) {
    const id = `${fam}_${hemi}`;
    const meta = bundleById.get(id);
    if (!meta) throw new Error(`Missing bundle ${id}`);
    const lines = decodeAtlasBundle(meta, tractsBuf);
    const medoid = medoidCenterline(lines);
    const mirror = (view === 'lateral' && hemi === 'R') || (view === 'medial' && hemi === 'L');
    const pts2d = medoid.map(([, y, z]) => project(y, z, mirror));
    const mid = pts2d[Math.floor(pts2d.length / 2)];
    tractPaths[`${fam}-${hemi}-${view}`] = {
      d: openPathD(pts2d, 1.4),
      anchor: [Math.round(mid[0] * 10) / 10, Math.round(mid[1] * 10) / 10],
    };
  }

  const outJs = `export const MAP_VIEWBOX = Object.freeze({width: ${VIEW_W}, height: ${VIEW_H}});
export const BRAIN_OUTLINES = Object.freeze(${JSON.stringify(outlines, null, 2)});
export const MEDIAL_WALLS = Object.freeze(${JSON.stringify(medialWalls, null, 2)});
export const SULCAL_CREASES = Object.freeze(${JSON.stringify(sulci, null, 2)});
export const CORTEX_TERRITORIES = Object.freeze(${JSON.stringify(cortexTerritories, null, 2)});
export const TRACT_CENTERLINES = Object.freeze(${JSON.stringify(tractPaths, null, 2)});
`;
  const outPath = path.join(root, 'viewer/testing_map_geometry.js');
  fs.writeFileSync(outPath, outJs);
  console.log(`Wrote ${outPath} (${outJs.length} bytes, ~${Math.round(outJs.length / 4)} tokens)`);
}

main().catch(err => { console.error(err); process.exit(1); });
