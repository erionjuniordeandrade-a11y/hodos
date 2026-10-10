/**
 * Insular-floor teaching draft. The scenes compare population references and
 * gross structures; they do not expose individual tissue planes or vessels.
 */
import {parcel,deep,bundle,cortex,scene,step,lesson} from './resident-anatomy.js';

export const SOURCES={};

export const REGIONS={
  ifSurfaceLimits:Object.freeze({
    name:'Insular surface and named limits',
    text:'Microsurgical descriptions supply the insular gyri, Sylvian relationships, limiting sulcus and limen. AVI and PoI2 are group parcel references rather than sulcal outlines or complete gyri; the population surface is not an individual boundary.',
    sources:['Q1','Q4','R5','M1','D1'],
    evidenceClass:'experimental_anatomy',
  }),
  ifCentralStack:Object.freeze({
    name:'Subinsular layers and deep references',
    text:'Dissection accounts describe the thin capsule and claustral layers around the lentiform complex. The viewer instead supplies sampled population bundle families and gross subcortical meshes; those objects do not reproduce the intervening tissue sheets or individual vessels.',
    sources:['Q1','R2','Q5','R5','D2','D3'],
    evidenceClass:'experimental_anatomy',
  }),
};

const floorScene=(extra={})=>scene({
  side:'L',network:'off',surface:.14,camera:{view:'left',tweenMs:650},...extra,
});

const insularFloor=lesson('insular-floor','The insular floor',14,
  'Orient the buried insular surface, compare its ventral and upper relationships, and distinguish sampled pathways from the absent layers and vessels beneath it.',
  [
    'Distinguish gross insular landmarks from AVI and PoI2 parcel references.',
    'Compare population bundle families around the insula without treating them as individual boundaries.',
    'Name the deep grey references and the unrendered layers and vessels.',
  ],[
  step('Look beyond the exposed Sylvian band',
    'A split Sylvian fissure exposes only part of the buried insula; the limiting sulcus bounds the surface, while the central insular sulcus separates short and long gyral regions. This scene offers AVI and PoI2 parcel references on a population surface, but it does not mark either sulcus or the full extent of an individual insula.',
    'Select AVI and PoI2 in turn, lower surface opacity, and compare left and superior views. Use the parcels only as anchors, then name the limiting sulcus as text anatomy and say why the visible fissure band cannot define the whole insular extent.',
    [
      'A split Sylvian fissure shows only a band of the buried insular surface.',
      'The limiting sulcus is the gross boundary; it is not a separate scene object.',
      'The central insular sulcus separates the short and long gyral regions.',
      'AVI and PoI2 are population parcel references, not sulcal contours or individual boundaries.',
    ],
    'For a resident description, separate the visible fissure band from the full buried surface. The parcel and population surface orient the discussion but do not supply the hidden sulcal edge.',
    'Does the visible Sylvian band identify the full extent of the insular surface?',
    'No. It exposes only part of the insula. The limiting sulcus and the direction of the hidden extent remain gross anatomical context rather than boundaries drawn by these parcel highlights.',
    ['Q1','Q4','R5','M1','D1'],
    floorScene({regions:cortex(111,106),surface:.2,camera:{view:'left',tweenMs:650}}),
    {regions:['ifSurfaceLimits'],evidenceClass:'experimental_anatomy',targets:[parcel(111,'AVI, anterior ventral insula'),parcel(106,'PoI2, posterior insula')]}
  ),
  step('Follow the inferior limit to the limen',
    'The inferior limiting sulcus approaches the limen at the ventral insular transition. IFOF and UF are population bundle samples associated with ventral and anterior insular relationships; they do not draw the sulcus or define the limen as a fibre endpoint. The scene contains the pathway references, not the named sulcus or limen itself.',
    'Show IFOF and UF together, then rotate from lateral to anterior. Describe the inferior sulcus and limen from the anatomical account, and identify the two highlighted objects as bundle samples.',
    [
      'Microsurgical anatomy describes the inferior limiting sulcus and temporal-stem relationship.',
      'The limen is a gross landmark at the ventral insular transition.',
      'IFOF and UF are pathway-family references, not capsule-layer meshes.',
      'The rendered bundles do not establish an individual sulcus, limen or endpoint.',
    ],
    'When presenting this relationship, name the limen and inferior limiting sulcus from anatomy, then describe the pathway samples separately.',
    'Do the IFOF and UF highlights mark where the inferior limiting sulcus ends?',
    'No. They are bundle references, whereas the limiting sulcus and limen are anatomical landmarks. Their proximity in a view does not make a sulcal boundary or a measured endpoint.',
    ['Q1','Q4','R3','D2'],
    floorScene({bundles:['IFOF','UF'],regions:cortex(111,106),surface:.12,camera:{view:'anterior',tweenMs:650}}),
    {regions:['ifSurfaceLimits'],evidenceClass:'reconstruction',targets:[bundle('IFOF','IFOF, inferior fronto-occipital fasciculus'),bundle('UF','UF, uncinate fasciculus')]}
  ),
  step('Compare the upper and posterior motor references',
    'In this population reference, compare the displayed CST sample and dimmed AF/SLF3 references with PoI2 in superior and posterior views. Their positions in this atlas do not locate individual sulci, exits or fibre distributions.',
    'Show CST with AF and SLF3 dimmed, then compare lateral, superior and posterior views against PoI2. Describe only the displayed population references; do not infer an individual boundary or fibre location.',
    [
      'CST, AF and SLF3 appear here as population bundle samples.',
      'PoI2 is a population cortical parcel reference for comparison.',
      'The scene does not segment the superior limiting sulcus or internal capsule.',
      'The displayed positions do not identify an individual fibre distribution or exit.',
    ],
    'Keep this as a population-level orientation comparison. It does not establish an operative exit, leg-fibre position or individual capsule boundary.',
    'Can this CST view identify an individual motor-fibre distribution relative to PoI2?',
    'No. The samples supply population references, and no individual fibre distribution is segmented in this scene. Neither the overlay nor its projection identifies an individual exit.',
    ['D2','M1'],
    floorScene({bundles:['CST'],ghost:['AF','SLF3'],regions:cortex(106),surface:.1,camera:{view:'superior',tweenMs:650}}),
    {regions:['ifSurfaceLimits'],evidenceClass:'reconstruction',targets:[parcel(106,'PoI2, posterior insula'),bundle('CST','CST, corticospinal tract'),bundle('AF','AF, arcuate fasciculus'),bundle('SLF3','SLF3, superior longitudinal fasciculus III')]}
  ),
  step('Separate the capsule label from the capsule layer',
    'The viewer’s EMC selection is a population tract-family reconstruction, not a physical sheet of extreme-capsule tissue. Dissection descriptions place the extreme capsule, claustrum and external capsule among the thin layers beneath insular cortex. Those layers are not separate scene objects, so the bundle label cannot expose their tissue planes.',
    'Show EMC, then compare IFOF as a dimmed reference. Rotate to a medial view and name the extreme capsule, claustrum and external capsule as anatomical layers absent from the scene.',
    [
      'Human dissection describes extreme and external capsules, claustrum and lentiform relationships.',
      'EMC is a sampled pathway-family label in this viewer.',
      'The thin extreme capsule, claustrum and external capsule are not separate meshes.',
      'A tract-family selection does not resolve a tissue sheet or its individual boundary.',
    ],
    'Keep the viewer’s pathway-family name distinct from the anatomical layer name when explaining this deep relationship.',
    'Does selecting EMC expose the extreme-capsule tissue plane?',
    'No. EMC is a population pathway-family reconstruction, while the extreme capsule is a named anatomical layer. The render does not show that sheet or the adjacent claustrum and external-capsule boundaries.',
    ['Q1','R2','D2'],
    floorScene({bundles:['EMC'],ghost:['IFOF'],surface:.12,camera:{view:'medial',tweenMs:650}}),
    {regions:['ifCentralStack'],evidenceClass:'reconstruction',targets:[bundle('EMC','EMC, extreme-capsule family'),bundle('IFOF','IFOF, inferior fronto-occipital fasciculus')]}
  ),
  step('Place the grey floor before the medial capsule',
    'In the described floor sequence, the external capsule is followed by putamen, the first gross deep-grey mesh shown here; globus pallidus lies medial to putamen within the lentiform complex. The internal capsule is described further medially, but neither it nor a tissue boundary is segmented in this scene. CST is a separate population sample, not a substitute for the capsule sheet.',
    'Keep AVI visible, turn on PUT and GP, and add CST as a dimmed reference. Compare lateral and anterior views, then recite the unrendered layers before naming the deeper capsule relationship.',
    [
      'Extreme capsule, claustrum and external capsule precede putamen in the described lateral-to-medial sequence.',
      'Putamen and globus pallidus are gross meshes; pallidum lies medial to putamen within the lentiform complex.',
      'The internal capsule is described medial to the lentiform complex but is not segmented here.',
      'The CST sample is not the internal capsule or an individual capsule boundary.',
    ],
    'In resident teaching, name the gross floor reference and the medial capsule relationship without turning either into an individual boundary or an operative stop rule.',
    'Does the rendered floor show the tissue layers and the internal-capsule boundary?',
    'No. PUT and GP are gross grey references; the capsule sheets and internal capsule are not segmented. The CST overlay is a population sample and cannot fill those missing tissue boundaries.',
    ['Q1','R2','Q5','D2','D3','M1','D1'],
    floorScene({regions:cortex(111),bundles:['CST'],ghost:['EMC'],deep:true,deepRegions:['PUT','GP'],surface:.08,camera:{view:'anterior',tweenMs:650}}),
    {regions:['ifCentralStack'],evidenceClass:'experimental_anatomy',targets:[parcel(111,'AVI, anterior ventral insula'),bundle('CST','CST, corticospinal tract'),deep('PUT','Putamen, gross'),deep('GP','Globus pallidus, gross')]}
  ),
  step('Keep lenticulostriate vessels outside the render',
    'Microsurgical anatomy describes arterial branches and perforators in the insular and Sylvian region; the layer teaching names lenticulostriate arteries as part of the deep vascular context. No individual vessel is rendered here. Bundle samples and gross grey meshes cannot map an artery or its course in a particular brain.',
    'Keep EMC and the deep grey references visible, then name the absent vascular information. Explain why neither a nearby tract nor a grey-mesh edge can serve as an arterial marker.',
    [
      'Insular microsurgical anatomy discusses MCA branches and perforators.',
      'Lenticulostriate arteries are vascular structures, not tract families.',
      'The pathway samples and gross subcortical meshes contain no individual vessel course.',
      'An adjacent displayed object cannot establish an individual artery’s route.',
    ],
    'In a resident account, label this vascular context as text-only anatomy and do not read an artery route from a neighbouring pathway or mesh.',
    'Can an EMC or CST display reveal an individual lenticulostriate artery course?',
    'No. EMC and CST are population pathway references, and the deep meshes show gross grey anatomy rather than arteries. The individual vessel course is not represented by this scene.',
    ['R2','R5','D2','D3'],
    floorScene({bundles:['EMC'],ghost:['CST'],deep:true,deepRegions:['PUT','GP'],surface:.1,camera:{view:'left',tweenMs:650}}),
    {regions:['ifCentralStack'],evidenceClass:'experimental_anatomy',targets:[bundle('EMC','EMC, extreme-capsule family'),bundle('CST','CST, corticospinal tract'),deep('PUT','Putamen, gross'),deep('GP','Globus pallidus, gross')]}
  ),
],{regionCards:['ifSurfaceLimits','ifCentralStack']});

export const LESSONS=[insularFloor];

export const GUIDES={
  'insular-floor':{
    shortTitle:'The insular floor',
    hemisphere:'L',
    question:'Which parts of the insular floor can the atlas show, and which must remain anatomical context?',
    takeaways:[
      {step:0,text:'Keep AVI and PoI2 parcel references separate from sulci and gross gyri.'},
      {step:3,text:'Treat EMC as a pathway-family reconstruction, not a rendered tissue layer.'},
      {step:5,text:'Keep lenticulostriate vessels text-only; nearby bundles and grey meshes do not map them.'},
    ],
  },
};
