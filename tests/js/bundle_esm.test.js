// The regex bundler behind scripts/build-hodos.mjs: every declarator of a multi-name
// `export const` is exported, and a named import that the bundled target does not export
// refuses the bundle instead of binding `undefined` (the lesion lab's MARGIN/CUT regression).
import test from 'node:test';
import assert from 'node:assert/strict';
import {bundleModules} from '../../scripts/bundle-esm.mjs';

const files=entries=>new Map(Object.entries(entries).map(([id,src])=>[id,Buffer.from(src)]));
async function run(code){
  const url=`data:text/javascript;base64,${Buffer.from(code.replace(/^await __require\((.*)\);\n$/m,'export const __result=await __require($1);')).toString('base64')}`;
  return (await import(url)).__result;
}

test('every declarator of a multi-name export const is exported',async()=>{
  const bundle=bundleModules('entry.js',files({
    'model.js':'export const SPARED=0,MARGIN=1,CUT=2;\nexport const RADIUS={min:1,max:20},NAMES=["a,b;","c"],f=(p,q)=>p+q, tpl=`x;${SPARED}`;\n',
    'entry.js':'import {SPARED,MARGIN,CUT,RADIUS,NAMES,f,tpl} from "./model.js";\nexport const OUT={SPARED,MARGIN,CUT,RADIUS,NAMES,sum:f(1,2),tpl};\n'}));
  const result=await run(bundle.code);
  assert.deepEqual(result.OUT,{SPARED:0,MARGIN:1,CUT:2,RADIUS:{min:1,max:20},NAMES:['a,b;','c'],sum:3,tpl:'x;0'});
  assert.deepEqual(bundle.includedIds,['model.js','entry.js']);
});

test('a named import the bundled module does not export refuses the bundle',()=>{
  assert.throws(()=>bundleModules('entry.js',files({
    'model.js':'export const SPARED=0;\nconst CUT=2;\n',
    'entry.js':'import {SPARED,CUT} from "./model.js";\nexport const OUT=[SPARED,CUT];\n'})),
    /entry\.js imports \{CUT\} from model\.js, which does not export it/);
});

test('a const export without a depth-0 terminator is refused',()=>{
  assert.throws(()=>bundleModules('entry.js',files({'entry.js':'export const A=(1\n'})),/no terminating ';'/);
});
