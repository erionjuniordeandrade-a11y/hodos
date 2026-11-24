// esbuild-backed ESM bundler operating strictly over the in-memory allowlisted `files` Map.
// Tree-shakes vendored dependencies, minifies bundles, and code-splits shared chunks
// (so /atlas, /mips and /labs/lesion-lab reuse one tree-shaken Three.js + atlas_scene chunk).
import {build} from 'esbuild';
import path from 'node:path';

const VIRTUAL_NS = 'hodos-virtual';

// Mirrors the bare-specifier resolution used by build-hodos.mjs's allowlist check,
// so dependency verification and bundling never disagree.
export function resolveDependency(fromName, spec) {
  if (spec === 'three') return 'vendor/three.module.js';
  if (spec === 'three-mesh-bvh') return 'vendor/three-mesh-bvh.js';
  if (spec === 'camera-controls') return 'vendor/camera-controls.js';
  if (spec.startsWith('three/addons/')) return spec.replace('three/addons/', 'vendor/addons/');
  if (spec.startsWith('.')) {
    const clean = spec.split(/[?#]/)[0];
    const posix = fromName.split('/').slice(0, -1).concat(clean.split('/'));
    const out = [];
    for (const part of posix) {
      if (part === '' || part === '.') continue;
      if (part === '..') out.pop();
      else out.push(part);
    }
    return out.join('/');
  }
  return null;
}

function virtualPlugin(files) {
  return {
    name: VIRTUAL_NS,
    setup(pluginBuild) {
      pluginBuild.onResolve({filter: /.*/}, (args) => {
        if (args.kind === 'entry-point') {
          if (!files.has(args.path)) {
            return {errors: [{text: `Bundler: missing entry ${args.path}`}]};
          }
          return {path: args.path, namespace: VIRTUAL_NS};
        }
        const target = resolveDependency(args.importer, args.path);
        if (!target) {
          return {errors: [{text: `Bundler: unresolved import specifier "${args.path}" in ${args.importer}`}]};
        }
        if (!files.has(target)) {
          return {errors: [{text: `Bundler: missing dependency ${target} (required by ${args.importer})`}]};
        }
        return {path: target, namespace: VIRTUAL_NS};
      });

      pluginBuild.onLoad({filter: /.*/, namespace: VIRTUAL_NS}, (args) => {
        const bytes = files.get(args.path);
        if (!bytes) return {errors: [{text: `Bundler: missing file ${args.path}`}]};
        return {contents: bytes.toString('utf8'), loader: 'js'};
      });
    },
  };
}

function stripNamespace(inputKey) {
  return inputKey.startsWith(`${VIRTUAL_NS}:`) ? inputKey.slice(VIRTUAL_NS.length + 1) : inputKey;
}

// Bundles one or more page entry specs `{entry, out}` into minified, tree-shaken ESM
// outputs with shared content-hashed chunks under `chunks/`.
export async function bundleEntries(specs, files) {
  const entryPoints = {};
  for (const {entry, out} of specs) {
    entryPoints[out.replace(/\.js$/, '')] = entry;
  }

  let result;
  try {
    result = await build({
      entryPoints,
      bundle: true,
      splitting: specs.length > 1,
      format: 'esm',
      minify: true,
      treeShaking: true,
      target: 'es2022',
      legalComments: 'inline',
      write: false,
      outdir: '.',
      chunkNames: 'chunks/[name]-[hash]',
      metafile: true,
      logLevel: 'silent',
      logOverride: {'import-is-undefined': 'error'},
      plugins: [virtualPlugin(files)],
    });
  } catch (error) {
    const details = error?.errors?.map(e => `${e.location ? `${e.location.file}:${e.location.line}: ` : ''}${e.text}`).join('\n');
    throw new Error(details ? `Bundler failed:\n${details}` : String(error?.message || error));
  }

  const badWarnings = (result.warnings || []).filter(w => /no matching export|import-is-undefined/i.test(`${w.id || ''} ${w.text || ''}`));
  if (badWarnings.length) {
    throw new Error(`Bundler: ${badWarnings.map(w => w.text).join('; ')}`);
  }

  const outputs = new Map();
  const cwd = process.cwd();
  for (const file of result.outputFiles) {
    const rel = path.relative(cwd, file.path).split(path.sep).join('/');
    outputs.set(rel, file.text);
  }

  const includedByEntry = new Map();
  const metaOutputs = result.metafile?.outputs || {};
  for (const {entry, out} of specs) {
    const visited = new Set();
    const queue = [out];
    const inputs = new Set();
    while (queue.length) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
      const info = metaOutputs[current];
      if (!info) continue;
      for (const inp of Object.keys(info.inputs || {})) inputs.add(stripNamespace(inp));
      for (const imp of info.imports || []) {
        if (imp.kind === 'import-statement' && metaOutputs[imp.path]) queue.push(imp.path);
      }
    }
    includedByEntry.set(entry, [...inputs]);
  }

  return {outputs, includedByEntry};
}

// Single-entry helper kept for direct unit testing.
export async function bundleModules(entry, files, header = '') {
  const out = entry.replace(/\.js$/, '.bundle.js');
  const {outputs, includedByEntry} = await bundleEntries([{entry, out}], files);
  return {
    code: `${header}${outputs.get(out)}`,
    includedIds: includedByEntry.get(entry) || [],
  };
}
