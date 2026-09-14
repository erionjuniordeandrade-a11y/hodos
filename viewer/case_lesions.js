// Fictional lesion markers for the Case Conference, expressed in the shared atlas
// space: MNI millimetres, RAS (+x right, +y anterior, +z superior), the space that
// tracts.json declares and the HCP S1200 fs_LR group surface is shipped in.
//
// Each marker is an illustrative sphere for a fictional case. It is not a tumour
// boundary, a measured distance, a safe margin or an individual registration. The
// idea of pairing a syndrome with an MNI marker plus the structures it implicates is
// borrowed from the schema of Ayci's Clinical Neuroanatomy Atlas (Apache-2.0 code);
// every value below is authored for Hodos and the four cases in case_content.js.
//
// `scene` is a partial SCENE GRAMMAR v2 descriptor (lesson_content.js DEFAULT_SCENE)
// that atlas_app merges before resolveScene: regions (first = focus), bundle families,
// ghost families, surface opacity and a camera flight. Region ids are Glasser ids for
// the marker's own hemisphere (surface.json sets.glasser.regions[side]).
const marker=(label,side,x,y,z,radiusMm,scene)=>Object.freeze({label,side,mni:Object.freeze({x,y,z}),radiusMm,scene:Object.freeze(scene)});
const regions=(hemi,...ids)=>ids.map(id=>({id,hemi}));

export const CASE_LESIONS=Object.freeze({
  // 01 · left medial frontal, supplementary motor region anterior to the paracentral motor territory.
  'medial-frontal':marker('Left medial frontal territory','L',-8,2,58,16,{
    regions:regions('L',43,44,55,26,8),bundles:['FAT','CST'],ghost:['SLF1'],surface:.92,
    camera:{view:'medial',zoom:1.15,tweenMs:900}}),
  // 02 · left insula, beneath the opercula; the shell is thinned so the buried marker reads.
  'insular':marker('Left insular territory','L',-38,0,2,16,{
    regions:regions('L',109,106,167,168,112,111,114),bundles:['IFOF','UF'],ghost:['AF'],surface:.35,
    camera:{view:'left',zoom:1.15,tweenMs:900}}),
  // 03 · left posterior temporal / inferior parietal junction.
  'temporoparietal':marker('Left posterior temporal / parietal territory','L',-52,-46,20,16,{
    regions:regions('L',25,28,148,149,139,129,150),bundles:['AF','ILF'],ghost:['OR','MdLF'],surface:.85,
    camera:{view:'left',zoom:1.15,tweenMs:900}}),
  // 04 · right medial frontal, supplementary motor region; attention references are ghosted.
  'right-medial-frontal':marker('Right medial frontal territory','R',8,4,58,16,{
    regions:regions('R',43,44,55,26,8),bundles:['FAT','CST'],ghost:['SLF2'],surface:.92,
    camera:{view:'medial',zoom:1.15,tweenMs:900}}),
});

/** Partial scene descriptor for a marker: merge over DEFAULT_SCENE, then resolveScene. */
export function lesionScene(l){
  return {side:l.side,...l.scene,lesion:{...l.mni,radiusMm:l.radiusMm,side:l.side,label:l.label}};
}

export const LESION_NOTE='Illustrative sphere in atlas space. Not a tumour boundary, a measured distance or an individual registration.';
