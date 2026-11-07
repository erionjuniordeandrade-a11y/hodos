/**
 * Insular-floor teaching draft. The scenes compare population references and
 * gross structures; they do not expose individual tissue planes or vessels.
 */
import {parcel,deep,bundle,cortex,scene,step,lesson} from './resident-anatomy.js';

export const SOURCES={};

export const REGIONS={
  ifSurfaceLimits:Object.freeze({
    name:'Insular surface and named limits',
    text:'Microsurgical descriptions supply the Sylvian relationships, limiting sulcus and limen. A limited opening may expose only a band, leaving superior and posterior insula concealed beneath the opercula; AVI and PoI2 are population references, not marks of those hidden limits.',
    sources:['Q1','Q4','R5','M1','D1'],
    evidenceClass:'experimental_anatomy',
  }),
  ifCentralStack:Object.freeze({
    name:'Subinsular layers and deep references',
    text:'Dissection teaching distinguishes a ventral association-pathway relationship from the deeper lentiform–internal-capsular relationship. The viewer supplies sampled population bundles and gross subcortical meshes, not the intervening tissue layers or individual vessels.',
    sources:['Q1','R2','Q5','R5','D2','D3'],
    evidenceClass:'experimental_anatomy',
  }),
};

const floorScene=(extra={})=>scene({
  side:'L',network:null,surface:.14,camera:{view:'left',tweenMs:650},...extra,
});

const insularFloor=lesson('insular-floor','The insular floor',14,
  'Orient the buried insular surface, compare its ventral and upper relationships, and distinguish sampled pathways from the absent layers and vessels beneath it.',
  [
    'Distinguish gross insular landmarks from AVI and PoI2 parcel references.',
    'Compare population bundle families around the insula without treating them as individual boundaries.',
    'Name the deep grey references and the unrendered layers and vessels.',
  ],[
  step('Look beyond the exposed Sylvian band',
    'A limited Sylvian opening may expose only a band of insula, leaving superior and posterior portions concealed beneath the opercula. The highlighted parcels do not delineate those hidden limits.',
    'Select AVI and PoI2, lower surface opacity, then compare left and superior views. Use the parcel labels to orient the buried surface, and note that the view does not show a Sylvian opening or draw the concealed limits.',
    [
      'A limited Sylvian opening may expose only a band of insula.',
      'Superior and posterior portions may remain concealed beneath the opercula.',
      'A parcel highlight does not delineate those concealed limits.',
    ],
    'For resident teaching, describe the exposed band separately from the superior and posterior insula hidden beneath the opercula. The population parcel highlights help orient the surface but do not define the concealed extent.',
    'When a limited Sylvian opening exposes a band, which insular portions may remain concealed beneath the opercula?',
    'Superior and posterior portions may remain concealed. The parcel highlights do not delineate those hidden limits.',
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
  step('Compare association and descending references',
    'AF and SLF III provide association-pathway references around the superior and posterior insular neighbourhood, whereas CST belongs to the deeper descending projection system. Compare these relationships without assigning individual body-part fibres or an operative boundary.',
    'Show CST with AF and SLF III dimmed and PoI2 visible, then compare superior and posterior views. Describe the association-versus-descending relationship without assigning individual fibres or a boundary.',
    [
      'AF and SLF III provide association-pathway references around the superior and posterior insular neighbourhood.',
      'CST belongs to the deeper descending projection system.',
      'The displayed bundles are population references, not individual fibre distributions.',
      'No individual body-part fibres or operative boundary are assigned here.',
    ],
    'Keep this as a population-level orientation comparison. It describes association and descending pathway relationships without establishing individual fibre locations or operative boundaries.',
    'How do AF and SLF III relate to the superior and posterior insular neighbourhood compared with CST?',
    'AF and SLF III provide association-pathway references around that superior and posterior neighbourhood, whereas CST belongs to the deeper descending projection system. These are population-level relationships; the scene does not assign individual body-part fibres or an operative boundary.',
    ['K3','R2','D2','M1','D1'],
    floorScene({bundles:['CST'],ghost:['AF','SLF3'],regions:cortex(106),surface:.1,camera:{view:'superior',tweenMs:650}}),
    {regions:['ifSurfaceLimits'],evidenceClass:'reconstruction',targets:[parcel(106,'PoI2, posterior insula'),bundle('CST','CST, corticospinal tract'),bundle('AF','AF, arcuate fasciculus'),bundle('SLF3','SLF3, superior longitudinal fasciculus III')]}
  ),
  step('Look deep to the superior limiting sulcus',
    'Just deep to the superior limiting sulcus, the insular region meets the corona radiata, where projection fibres including the CST family ascend. The displayed CST is a population reference; it does not mark the sulcus or an individual boundary.',
    'Show CST with PoI2 and AVI context in superior view. Compare the insular surface with the deeper corona-radiata projection relationship, and name the superior limiting sulcus as anatomical context rather than a rendered boundary.',
    [
      'Just deep to the superior limiting sulcus, the insular region meets the corona radiata.',
      'Projection fibres, including the CST family, ascend in this relationship.',
      'The displayed CST is a population reference.',
      'The bundle and parcel references do not mark the sulcus or an individual boundary.',
    ],
    'For teaching, distinguish the superior limiting sulcus from the deeper projection-fibre relationship. The scene supports population-level orientation, not an individual sulcal boundary or operative limit.',
    'What lies just deep to the superior limiting sulcus, and how should the displayed CST be interpreted there?',
    'The insular region meets the corona radiata, where projection fibres including the CST family ascend. The displayed CST is a population reference; it does not mark the sulcus or an individual boundary.',
    ['Q1','R2','K3','D2','M1','D1'],
    floorScene({bundles:['CST'],regions:cortex(106,111),surface:.1,camera:{view:'superior',tweenMs:650}}),
    {regions:['ifSurfaceLimits'],evidenceClass:'experimental_anatomy',targets:[parcel(106,'PoI2, posterior insula'),parcel(111,'AVI, anterior ventral insula'),bundle('CST','CST, corticospinal tract')]}
  ),
  step('Contrast the ventral pathway and deep floor',
    'Recall the subinsular layer sequence from the “Insula & central core” lesson. Distinguish the ventral association-pathway relationship from the deeper lentiform–internal-capsular relationship; the displayed bundles do not replace the intervening tissue layers.',
    'Keep AVI, PUT and GP visible; compare the primary CST sample with the dimmed EMC reference.',
    [
      'AVI is a population parcel reference for the ventral insular surface.',
      'The lentiform complex and internal-capsular relationship lie deeper.',
      'CST and EMC are population bundle references, not tissue layers.',
      'The intervening layers and internal capsule are not segmented in this scene.',
    ],
    'For residents, distinguish the ventral association pathway from the deeper lentiform–internal-capsular relationship. The displayed bundles orient this comparison but do not show the intervening tissue layers.',
    'How does the ventral association-pathway relationship compare with the deeper lentiform–internal-capsular relationship?',
    'The ventral association-pathway reference lies nearer the insular floor, while the lentiform complex and internal-capsular relationship lie deeper. The displayed bundle samples orient this contrast but do not replace the intervening tissue layers.',
    ['Q1','R2','Q5','D2','D3','M1','D1'],
    floorScene({regions:cortex(111),bundles:['CST'],ghost:['EMC'],deep:true,deepRegions:['PUT','GP'],surface:.08,camera:{view:'anterior',tweenMs:650}}),
    {regions:['ifCentralStack'],evidenceClass:'experimental_anatomy',targets:[parcel(111,'AVI, anterior ventral insula'),bundle('CST','CST, corticospinal tract'),deep('PUT','Putamen, gross'),deep('GP','Globus pallidus, gross')]}
  ),
  step('Compare M1 and M2 perforator origins',
    'Lateral lenticulostriate arteries usually arise from M1 and enter the anterior perforated substance, supplying deep grey structures and parts of the internal capsule. They are distinct from the insular perforators arising from M2; neither vascular system is rendered here.',
    'Keep EMC and the deep grey references visible; compare the text-only M1 origin of lateral lenticulostriate arteries with the M2 origin of insular perforators.',
    [
      'Lateral lenticulostriate arteries usually arise from M1.',
      'They enter the anterior perforated substance and supply deep grey structures and parts of the internal capsule.',
      'Insular perforators arise from M2.',
      'Neither vascular system is rendered in this scene.',
    ],
    'In resident teaching, distinguish the arterial origins as anatomical context. The bundles and gross grey references do not show an individual vessel course.',
    'Which arterial origin distinguishes lateral lenticulostriate arteries from insular perforators?',
    'Lateral lenticulostriate arteries usually arise from M1; insular perforators arise from M2. Neither vascular system is represented in this scene.',
    ['R5','R2','D2','D3'],
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
      {step:0,text:'A limited Sylvian opening may leave superior and posterior insula concealed; AVI and PoI2 do not draw those hidden limits.'},
      {step:3,text:'The superior limiting sulcus is anatomical context; the displayed CST does not mark its boundary.'},
      {step:5,text:'Lateral lenticulostriate arteries usually arise from M1, whereas insular perforators arise from M2; neither system is rendered.'},
    ],
  },
};
