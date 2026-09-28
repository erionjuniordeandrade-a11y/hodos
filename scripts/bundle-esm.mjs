// Dependency-free ESM bundler for the /atlas, /mips and lesion-lab page entries.
// Only STATIC `import`/`export ... from` specifiers are followed; dynamic `import()`
// calls are left untouched as plain source text, so intentional lazy-loading (e.g.
// mips.js and lesion_lab.js pulling in atlas_scene.js on demand) is preserved exactly.
// esbuild is not available in node_modules/.bin for this project, and the task forbids
// a network install, so this regex-based transform stands in for a real bundler. It is
// justified by the corpus being uniform, already-bundler-shaped ESM (single trailing
// `export {...}` lists, no `export default`, no `export class`, no side-effect-only
// imports, no genuine top-level `await` — all confirmed by inspection before writing
// this file) and is backstopped by a loud throw on anything it does not recognise.

// Mirrors the bare-specifier resolution already used by build-hodos.mjs's dependency
// verification loop, so the two never disagree about where an import resolves.
export function resolveDependency(fromName, spec) {
  if (spec === 'three') return 'vendor/three.module.js';
  if (spec === 'three-mesh-bvh') return 'vendor/three-mesh-bvh.js';
  if (spec === 'camera-controls') return 'vendor/camera-controls.js';
  if (spec.startsWith('three/addons/')) return spec.replace('three/addons/', 'vendor/addons/');
  if (spec.startsWith('.')) {
    const posix = fromName.split('/').slice(0, -1).concat(spec.split('/'));
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

const IMPORT_NAMESPACE = () => /^[ \t]*import\s*\*\s*as\s+([\w$]+)\s+from\s*(['"])([^'"]+)\2\s*;?[ \t]*$/gm;
const IMPORT_DEFAULT = () => /^[ \t]*import\s+([\w$]+)\s+from\s*(['"])([^'"]+)\2\s*;?[ \t]*$/gm;
const IMPORT_NAMED = () => /^[ \t]*import\s*\{([\s\S]*?)\}\s*from\s*(['"])([^'"]+)\2\s*;?/gm;
const EXPORT_FROM = () => /^[ \t]*export\s*\{([\s\S]*?)\}\s*from\s*(['"])([^'"]+)\2\s*;?/gm;
const EXPORT_LIST = () => /^[ \t]*export\s*\{([\s\S]*?)\}\s*;?[ \t]*$/gm;
const EXPORT_CONST = () => /^([ \t]*)export\s+const\s+(?=[\w$])/gm;
const EXPORT_FUNCTION = () => /^([ \t]*)export\s+(async\s+function\*?|function\*?)\s+([\w$]+)(\s*\()/gm;
const LEFTOVER = /^[ \t]*(import\s|export\s)/m;

function splitNames(list) {
  return list.split(',').map(s => s.trim()).filter(Boolean).map(part => {
    const m = part.match(/^([\w$]+)\s+as\s+([\w$]+)$/);
    return m ? { orig: m[1], alias: m[2] } : { orig: part, alias: part };
  });
}

function staticSpecifiers(source) {
  const specs = new Set();
  for (const re of [IMPORT_NAMESPACE(), IMPORT_DEFAULT(), IMPORT_NAMED(), EXPORT_FROM()]) {
    let match;
    while ((match = re.exec(source))) specs.add(match[3]);
  }
  return specs;
}

// Names declared by one `const` declaration starting at `start` (just after the `const` keyword).
// Walks the source tracking bracket depth and skipping string, template and comment bodies;
// stops at the first `;` at depth 0. Throws when no terminator is found.
function constDeclarators(id, source, start) {
  const names = [];
  let i = start, depth = 0, expectName = true;
  const identifier = /[\w$]+/y;
  while (i < source.length) {
    const ch = source[i], next = source[i + 1];
    if (expectName) {
      identifier.lastIndex = i;
      const m = identifier.exec(source);
      if (!m) throw new Error(`Bundler: cannot read the declarator name in a const export of ${id}`);
      names.push(m[0]);
      i += m[0].length;
      expectName = false;
      continue;
    }
    if (ch === '/' && next === '/') { const end = source.indexOf('\n', i); i = end < 0 ? source.length : end + 1; continue; }
    if (ch === '/' && next === '*') { const end = source.indexOf('*/', i + 2); if (end < 0) throw new Error(`Bundler: unterminated comment in ${id}`); i = end + 2; continue; }
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      i++;
      while (i < source.length && source[i] !== quote) { if (source[i] === '\\') i++; i++; }
      if (i >= source.length) throw new Error(`Bundler: unterminated string in a const export of ${id}`);
      i++;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (depth === 0 && ch === ';') return names;
    else if (depth === 0 && ch === ',') { i++; while (/\s/.test(source[i])) i++; expectName = true; continue; }
    i++;
  }
  throw new Error(`Bundler: const export in ${id} has no terminating ';' at depth 0 (declarators so far: ${names.join(', ')})`);
}

// Transforms one module's ESM syntax into the body of a CommonJS-style async factory:
// `async function(module, exports, __require) { ...body... }`. The factory is async
// (rather than trying to prove no top-level `await` exists) so any await that was
// legal at the top of the original module stays legal inside the factory body.
function transformModule(id, source) {
  const requireLines = [];
  const exportEntries = [];
  const exportNames = [];
  const namedImports = [];
  const requireExpr = spec => {
    const target = resolveDependency(id, spec);
    if (!target) throw new Error(`Bundler: unresolved import specifier "${spec}" in ${id}`);
    return `await __require(${JSON.stringify(target)})`;
  };

  let body = source;

  body = body.replace(IMPORT_NAMESPACE(), (m, name, q, spec) => {
    requireLines.push(`const ${name} = ${requireExpr(spec)};`);
    return '';
  });

  body = body.replace(IMPORT_DEFAULT(), (m, name, q, spec) => {
    requireLines.push(`const ${name} = (${requireExpr(spec)}).default;`);
    return '';
  });

  body = body.replace(IMPORT_NAMED(), (m, names, q, spec) => {
    const parsed = splitNames(names);
    namedImports.push({ target: resolveDependency(id, spec), names: parsed.map(({ orig }) => orig) });
    const bindings = parsed.map(({ orig, alias }) => orig === alias ? orig : `${orig}: ${alias}`).join(', ');
    if (!bindings) return '';
    requireLines.push(`const {${bindings}} = ${requireExpr(spec)};`);
    return '';
  });

  body = body.replace(EXPORT_FROM(), (m, names, q, spec) => {
    const dep = `__dep_${exportEntries.length}`;
    requireLines.push(`const ${dep} = ${requireExpr(spec)};`);
    for (const { orig, alias } of splitNames(names)) {
      exportEntries.push(`${JSON.stringify(alias)}: ${dep}[${JSON.stringify(orig)}]`);
      exportNames.push(alias);
    }
    return '';
  });

  body = body.replace(EXPORT_LIST(), (m, names) => {
    for (const { orig, alias } of splitNames(names)) {
      exportEntries.push(`${JSON.stringify(alias)}: ${orig}`);
      exportNames.push(alias);
    }
    return '';
  });

  // `export const a=..., b=..., c=...;` exports EVERY declarator, not just the first. The
  // declaration is scanned from the keyword to its terminating `;` at bracket depth 0 (skipping
  // strings, template literals and comments), and each depth-0 `, name =` starts a new declarator.
  // A declaration without a `;` at depth 0 is refused loudly: it cannot be scoped safely.
  body = body.replace(EXPORT_CONST(), (m, indent, offset) => {
    for (const name of constDeclarators(id, body, offset + m.length)) {
      exportEntries.push(`${JSON.stringify(name)}: ${name}`);
      exportNames.push(name);
    }
    return `${indent}const `;
  });

  body = body.replace(EXPORT_FUNCTION(), (m, indent, kw, name, paren) => {
    exportEntries.push(`${JSON.stringify(name)}: ${name}`);
    exportNames.push(name);
    return `${indent}${kw} ${name}${paren}`;
  });

  if (LEFTOVER.test(body)) {
    throw new Error(`Bundler: unhandled import/export syntax in ${id}`);
  }

  const exportStatement = exportEntries.length
    ? `\nObject.assign(exports, {${exportEntries.join(', ')}});\n`
    : '';
  return { code: `${requireLines.join('\n')}\n${body}${exportStatement}`, exportNames, namedImports };
}

// Walks the STATIC import graph from `entry`, in post-order (dependencies before
// dependents), throwing loudly on a missing file or a circular dependency rather than
// silently producing a broken bundle.
function collectGraph(entry, readSource) {
  const order = [];
  const seen = new Set();
  const visiting = new Set();

  function visit(id) {
    if (seen.has(id)) return;
    if (visiting.has(id)) throw new Error(`Bundler: circular dependency involving ${id}`);
    visiting.add(id);
    const source = readSource(id);
    for (const spec of staticSpecifiers(source)) {
      const target = resolveDependency(id, spec);
      if (!target) throw new Error(`Bundler: unresolved import specifier "${spec}" in ${id}`);
      if (!readSource.has(target)) throw new Error(`Bundler: missing dependency ${target} (required by ${id})`);
      visit(target);
    }
    visiting.delete(id);
    seen.add(id);
    order.push([id, source]);
  }

  visit(entry);
  return order;
}

// `files` is a Map<relPath, Buffer> already populated by build-hodos.mjs (the same
// in-memory copy every other export step reads from). `entry` is a key already in it.
export function bundleModules(entry, files, header = '') {
  const readSource = id => files.get(id).toString();
  readSource.has = id => files.has(id);
  const moduleEntries = collectGraph(entry, readSource);

  const transformed = moduleEntries.map(([id, source]) => [id, transformModule(id, source)]);
  // Every named import of a bundled module must name something that module exports. Silently
  // binding `undefined` is exactly how a partially handled export reaches production unnoticed
  // (a NaN shader uniform lit every streamline in the lesion lab); refuse the bundle instead.
  const exportsOf = new Map(transformed.map(([id, t]) => [id, new Set(t.exportNames)]));
  for (const [id, t] of transformed) {
    for (const { target, names } of t.namedImports) {
      if (!exportsOf.has(target)) continue;
      const missing = names.filter(name => !exportsOf.get(target).has(name));
      if (missing.length) throw new Error(`Bundler: ${id} imports {${missing.join(', ')}} from ${target}, which does not export ${missing.length === 1 ? 'it' : 'them'}`);
    }
  }

  const parts = [];
  if (header) parts.push(header);
  parts.push('const __modules = {');
  for (const [id, t] of transformed) {
    parts.push(`${JSON.stringify(id)}: async function (module, exports, __require) {\n${t.code}\n},`);
  }
  parts.push('};');
  parts.push('const __cache = Object.create(null);');
  parts.push('function __require(id) {');
  parts.push('  let entry = __cache[id];');
  parts.push('  if (!entry) {');
  parts.push('    const mod = { exports: {} };');
  parts.push('    entry = __modules[id](mod, mod.exports, __require).then(() => mod.exports);');
  parts.push('    __cache[id] = entry;');
  parts.push('  }');
  parts.push('  return entry;');
  parts.push('}');
  parts.push(`await __require(${JSON.stringify(entry)});`);

  return { code: parts.join('\n') + '\n', includedIds: moduleEntries.map(([id]) => id) };
}
