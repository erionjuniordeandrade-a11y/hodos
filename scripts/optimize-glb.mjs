import {stat,mkdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {NodeIO} from '@gltf-transform/core';
import {EXTMeshoptCompression,KHRDracoMeshCompression,KHRMeshQuantization} from '@gltf-transform/extensions';
import {dedup,prune,quantize} from '@gltf-transform/functions';
import {MeshoptDecoder,MeshoptEncoder} from 'meshoptimizer';

const [inputArg,outputArg,...extra]=process.argv.slice(2);
const positionArg=extra.length===1?extra[0].match(/^--position-bits=(0|1[4-6])$/):null;
if(!inputArg||!outputArg||(extra.length&&!positionArg))throw Error('Usage: node scripts/optimize-glb.mjs INPUT.glb OUTPUT.glb [--position-bits=0|14|15|16]');
const positionBits=positionArg?Number(positionArg[1]):14;
const input=path.resolve(inputArg),output=path.resolve(outputArg);
if(input===output)throw Error('Input and output must differ');
const pinned=path.resolve('viewer/atlas');
if(output.startsWith(`${pinned}${path.sep}`))throw Error('Refusing to write a pinned atlas asset');
if(path.extname(input).toLowerCase()!=='.glb'||path.extname(output).toLowerCase()!=='.glb')throw Error('Input and output must be .glb files');
const before=(await stat(input)).size;
try{await stat(output);throw Error(`Output already exists: ${output}`);}catch(error){if(error.code!=='ENOENT')throw error;}
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready]);
// Published source assets use Draco; decode with the already vendored first-party module.
const decoderPath=new URL('../viewer/vendor/addons/libs/draco/gltf/draco_decoder.js',import.meta.url);
const decoderSource=await readFile(decoderPath,'utf8');
const decoderModule={exports:{}};
const loadDecoder=vm.runInThisContext(`(function(require,__dirname,module,exports){${decoderSource}\nreturn DracoDecoderModule;})`,{filename:decoderPath.pathname});
const dracoFactory=loadDecoder(createRequire(decoderPath),path.dirname(decoderPath.pathname),decoderModule,decoderModule.exports);
const dracoDecoder=await dracoFactory();
const io=new NodeIO().registerExtensions([KHRDracoMeshCompression,EXTMeshoptCompression,KHRMeshQuantization]).registerDependencies({'draco3d.decoder':dracoDecoder,'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const document=await io.read(input);
document.getRoot().listExtensionsUsed().find(extension=>extension.extensionName==='KHR_draco_mesh_compression')?.dispose();
// meshopt() includes reorder(), which breaks the cortex's external per-vertex labels.
// Add the compression extension directly after quantization to retain vertex indices.
await document.transform(dedup(),prune(),quantize(positionBits
  ? {quantizePosition:positionBits}
  : {pattern:/^(?!POSITION$).*/}));
document.createExtension(EXTMeshoptCompression).setRequired(true)
  .setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
await mkdir(path.dirname(output),{recursive:true});
await io.write(output,document);
const after=(await stat(output)).size;
console.log(JSON.stringify({input,output,positionBits,beforeBytes:before,afterBytes:after,savedBytes:before-after,changePercent:Number(((before-after)/before*100).toFixed(2))},null,2));
