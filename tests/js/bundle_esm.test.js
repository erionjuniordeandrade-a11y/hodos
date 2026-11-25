// Tests for the esbuild-backed allowlisted ESM bundler behind scripts/build-hodos.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {bundleModules,bundleEntries} from '../../scripts/bundle-esm.mjs';

const files=entries=>new Map(Object.entries(entries).map(([id,src])=>[id,Buffer.from(src)]));
async function run(code){
  const url=`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  return await import(url);
}

test('every declarator of a multi-name export const is exported',async()=>{
  const bundle=await bundleModules('entry.js',files({
    'model.js':'export const SPARED=0,MARGIN=1,CUT=2;\nexport const RADIUS={min:1,max:20},NAMES=["a,b;","c"],f=(p,q)=>p+q, tpl=`x;${SPARED}`;\n',
    'entry.js':'import {SPARED,MARGIN,CUT,RADIUS,NAMES,f,tpl} from "./model.js";\nexport const OUT={SPARED,MARGIN,CUT,RADIUS,NAMES,sum:f(1,2),tpl};\n'}));
  const result=await run(bundle.code);
  assert.deepEqual(result.OUT,{SPARED:0,MARGIN:1,CUT:2,RADIUS:{min:1,max:20},NAMES:['a,b;','c'],sum:3,tpl:'x;0'});
  assert.deepEqual(bundle.includedIds.sort(),['entry.js','model.js']);
});

test('a named import the bundled module does not export refuses the bundle',async()=>{
  await assert.rejects(()=>bundleModules('entry.js',files({
    'model.js':'export const SPARED=0;\nconst CUT=2;\n',
    'entry.js':'import {SPARED,CUT} from "./model.js";\nexport const OUT=[SPARED,CUT];\n'})),
    /No matching export|import-is-undefined|CUT/i);
});

test('multi-entry bundling splits shared code and dynamic imports into content-hashed chunks',async()=>{
  const {outputs}=await bundleEntries(
    [{entry:'a.js',out:'a.bundle.js'},{entry:'b.js',out:'b.bundle.js'}],
    files({
      'util.js':'export const used="kept-helper";\nexport const unused="tree-shaken-out";\n',
      'shared.js':'import {used} from "./util.js";\nexport const tag=used;\n',
      'a.js':'import {tag} from "./shared.js";\nexport const outA=tag;\n',
      'b.js':'export async function load(){const m=await import("./shared.js");return m.tag;}\n',
    }));
  assert(outputs.has('a.bundle.js'));
  assert(outputs.has('b.bundle.js'));
  const chunks=[...outputs.keys()].filter(k=>k.startsWith('chunks/'));
  assert(chunks.length>=1,'shared module emits a code-split chunk');
  const allCode=[...outputs.values()].join('\n');
  assert(!allCode.includes('tree-shaken-out'),'unused exports of statically imported modules are tree-shaken');
});

test('imports outside the allowlisted files Map are refused',async()=>{
  await assert.rejects(()=>bundleModules('entry.js',files({
    'entry.js':'import {x} from "./missing.js";\nexport const out=x;\n'})),
    /missing dependency missing\.js/);
});
