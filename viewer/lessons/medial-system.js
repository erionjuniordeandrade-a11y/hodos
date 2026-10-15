import {source,parcel,deep,bundle,cortex,scene,step,lesson} from './resident-anatomy.js';

export const SOURCES={
  MS1:source('MS1','Jones et al., 2013 · cingulum subdivisions by diffusion MRI fibre tracking','23178227','reconstruction','Diffusion MRI fibre tracking describes subdivisions within the cingulum bundle. It supports a model-based account of regional courses, not histological boundaries or an individual endpoint map.'),
  MS2:source('MS2','Senova et al., 2020 · fornix anatomy and function','32132227','conceptual_model','This review summarises fornix anatomy and functional evidence. It does not establish an individual memory outcome or a surgical boundary.'),
  MS3:source('MS3','Bubb et al., 2018 · cingulum anatomy, function and dysfunction','29753752','conceptual_model','This review synthesises cingulum anatomy and reported functions. It does not support a segment-to-symptom rule or an individual prediction.'),
  MS4:source('MS4','Catani et al., 2013 · revised limbic-system model','23850593','conceptual_model','This review proposes a revised model of limbic relationships across memory, emotion and behaviour. It supports treating Papez as one historical framework, not as a complete circuit or a single-function map.'),
};

export const REGIONS={
  msFornixCourse:{
    name:'Fornix course and visible limits',
    text:'Anatomical accounts trace the hippocampal mammillary projection through fimbria, crus, body and the postcommissural fornix. Precommissural fibres instead reach basal forebrain structures, including the septal region; these subdivisions are not separately identified here. The viewer shows a population F sample and a gross hippocampal reference.',
    sources:['MS2','K5','D2','D3'],
    evidenceClass:'experimental_anatomy',
  },
  msCingulumRoutes:{
    name:'Cingulum route families',
    text:'Dissection and diffusion studies describe subdivisions along medial and parahippocampal cingulum routes. The installed families are population tractography categories, not histological compartments or endpoints registered to one person; PHA1 is a cortical reference rather than a tract endpoint.',
    sources:['MS1','MS3','K3','D2','M1'],
    evidenceClass:'reconstruction',
  },
  msPapezModel:{
    name:'Papez model and missing links',
    text:'The Papez model brings fornix and cingulum relationships into a broader account of limbic anatomy and memory. Several named links and relay structures are absent from the scene, so the model is not a closed circuit rendered by this atlas.',
    sources:['MS2','MS4','D2','D3'],
    evidenceClass:'conceptual_model',
  },
};

const medialScene=(extra={})=>scene({side:'L',surface:.18,camera:{view:'medial',tweenMs:650},...extra});

const l=lesson('medial-system','The medial system: fornix, cingulum and the Papez loop',16,
  'Compare the fornix and cingulum as distinct medial pathways, then use their place in the Papez model to qualify what a population atlas can establish.',
  ['Trace the fornix waypoints while identifying structures absent from the scene.','Compare cingulum families as population-level reconstructed routes.','Distinguish a historical circuit model from evidence about individual memory function.'],[
  step('Trace the fornix through its named waypoints',
    'Trace the hippocampal mammillary projection through fimbria, crus, body and the postcommissural fornix. Precommissural fibres instead reach basal forebrain structures, including the septal region; these subdivisions are not separately identified here. The displayed F family is population-averaged tractography and does not encode conduction direction.',
    'Set the medial view and show F with the gross hippocampal reference. Describe the postcommissural course, distinguish the precommissural projection towards basal forebrain structures, and identify which subdivisions are not separately shown.',
    ['The hippocampal mammillary projection passes through fimbria, crus, body and the postcommissural fornix.','Precommissural fibres instead reach basal forebrain structures, including the septal region; these subdivisions are not separately identified here.','The septum and foramen of Monro are anatomical landmarks that are not rendered as scene objects.','The displayed tract geometry does not identify subdivision boundaries or encode conduction direction.'],
    'For resident teaching, distinguish the postcommissural and precommissural courses from a separate sectional description of ventricular landmarks. This display does not show the subdivisions or supply an operative plan.',
    'Can this render establish conduction direction or identify every named fornix subdivision?',
    'No. It shows a reconstructed course, while subdivision boundaries and conduction direction require separate evidence.',
    ['MS2','K5','D2','D3'],
    medialScene({bundles:['F'],deep:true,deepRegions:['HIP']}),
    {regions:['msFornixCourse'],evidenceClass:'experimental_anatomy',targets:[bundle('F','F, Fornix'),deep('HIP','Hippocampus')]}
  ),
  step('Place the Papez model beside the rendered tracts',
    'The Papez model places the fornix and cingulum within a proposed route linking hippocampal, diencephalic and cingulate structures. Limbic reviews revise the classic account and treat it as one model, not a complete inventory of memory function. This scene shows only selected population tract families and gross HIP and THA references. TR_A is shown as a broad thalamic-radiation reference. This scene does not isolate the anterior thalamic nuclei or their specific cingulate connections.',
    'Show F, C_PH and TR_A with HIP and THA visible. Describe TR_A as a broad thalamic-radiation reference, then identify the mammillary bodies and mammillothalamic tract as links that need an external anatomical reference.',
    ['The model relates hippocampal, fornical, thalamic, cingulate and parahippocampal anatomy.','TR_A is a broad thalamic-radiation reference; it does not isolate anterior thalamic nuclei or their specific cingulate connections.','The mammillary bodies and mammillothalamic tract are not rendered as scene objects, and the gross THA mesh does not identify anterior thalamic nuclei.','Co-displayed pathways are separate population samples, not a demonstrated closed or directionally encoded circuit.'],
    'For residents, use the loop to ask which links are represented and which require another anatomical source. The label alone does not localise an individual memory difficulty.',
    'Do F, C_PH and broad TR_A identify the specific thalamic-cingulate links in the Papez model?',
    'No. The mammillary bodies and mammillothalamic tract are not displayed. Broad TR_A and the gross THA mesh do not isolate anterior thalamic nuclei or their specific cingulate connections. The classic circuit remains an external model rather than a closed pathway in this viewer.',
    ['MS2','MS3','MS4','D2','D3'],
    medialScene({bundles:['F','C_PH','TR_A'],regions:cortex(14,118),deep:true,deepRegions:['HIP','THA'],surface:.14}),
    {regions:['msPapezModel','msFornixCourse'],evidenceClass:'conceptual_model',targets:[bundle('F','F, Fornix'),bundle('C_PH','C_PH, parahippocampal cingulum'),bundle('TR_A','TR_A, anterior thalamic radiation'),deep('HIP','Hippocampus'),deep('THA','Thalamus'),parcel(14,'RSC, retrosplenial reference'),parcel(118,'EC, entorhinal reference')]}
  ),
  step('Compare the cingulum route families',
    'Human dissection and diffusion tracking describe the cingulum in subdivisions rather than as one undifferentiated cable. Hodos displays five families, C_FP, C_PO, C_PH, C_FPH and C_PHP; their names are route labels, not microscopic partitions or proof that one tract follows the full arc.',
    'Show all five cingulum families in the medial view. Compare their broad courses with the selected cortical references, without treating a parcel outline as a tract endpoint.',
    ['The five displayed cingulum families are C_FP, C_PO, C_PH, C_FPH and C_PHP.','Diffusion tracking identifies modelled subdivisions; it does not supply histological borders for these five names.','Areas 25, 23d, RSC, EC and PHA1 provide cortical reference points; their boundaries do not establish tract endpoints.','Displayed line continuity is not an axon count or proof that each fibre follows the entire arc.'],
    'Use the family names to describe a group-scale medial pathway before proposing a functional interpretation. Do not turn a tract label into an individual tissue border or a direct symptom explanation.',
    'Do the five installed cingulum families represent five histologically separated tracts?',
    'No. They distinguish the atlas route categories. They do not establish separated tissue compartments, the fibre course of any one person or a function for the nearby cortex.',
    ['MS1','MS3','K3','D2','M1'],
    medialScene({bundles:['C_FP','C_PO','C_PH','C_FPH','C_PHP'],regions:cortex(164,32,14,118,126),surface:.12}),
    {regions:['msCingulumRoutes'],evidenceClass:'reconstruction',targets:[bundle('C_FP','C_FP, frontal-parietal cingulum'),bundle('C_PO','C_PO, Cingulum, parolfactory'),bundle('C_PH','C_PH, parahippocampal cingulum'),bundle('C_FPH','C_FPH, Cingulum, frontal-parahippocampal'),bundle('C_PHP','C_PHP, parahippocampal-parietal cingulum'),parcel(164,'25, subgenual cingulate reference'),parcel(32,'23d, posterior cingulate reference'),parcel(14,'RSC, retrosplenial reference'),parcel(118,'EC, entorhinal reference'),parcel(126,'PHA1, parahippocampal reference')]}
  ),
  step('Follow the posterior cingulum towards medial temporal cortex',
    'Posterior cingulum reconstructions include a medial course and routes towards parahippocampal territory. Compare C_PH and C_PHP with RSC, EC and PHA1 references, while remembering that these parcels and tract samples come from population atlases. Their proximity does not establish exact endpoints or a connection in one individual.',
    'Show C_PH and C_PHP together, select RSC, EC and PHA1, and rotate through medial and posterior views. Describe the named reference parcels separately from the displayed tract course.',
    ['RSC orients retrosplenial cortex, EC entorhinal cortex, and PHA1 part of the parahippocampal cortex. These references do not establish exact cingulum terminations.','The cingulum families are reconstructed routes, not registrations of fibres in any one person to those parcel boundaries.','The posterior projection is not a sectional dissection of the isthmus or neighbouring structures.','The scene does not establish a functional role from spatial proximity alone.'],
    'For resident anatomy discussion, describe the posterior tract and its cortical references separately from any cognitive claim. The population view cannot define an individual corridor or the function of a nearby parcel.',
    'Do the RSC, EC and PHA1 parcels mark the exact endpoints of the highlighted cingulum families?',
    'No. RSC, EC and PHA1 are group cortical references, and the cingulum families are group tractography samples. Their proximity can orient an anatomical hypothesis, but it does not register the pathway in one person.',
    ['MS1','MS3','K3','D2','M1'],
    medialScene({bundles:['C_PH','C_PHP'],ghost:['C_PO'],regions:cortex(14,118,126),surface:.14,camera:{view:'posterior',tweenMs:650}}),
    {regions:['msCingulumRoutes'],evidenceClass:'reconstruction',targets:[bundle('C_PH','C_PH, parahippocampal cingulum'),bundle('C_PHP','C_PHP, parahippocampal-parietal cingulum'),parcel(14,'RSC, retrosplenial reference'),parcel(118,'EC, entorhinal reference'),parcel(126,'PHA1, parahippocampal reference')]}
  ),
  step('Keep the fornix and cingulum distinct in a limbic account',
    'The fornix and cingulum appear together in classic limbic accounts, but they have distinct courses: F is a hippocampal output family, while the cingulum contains medial association routes. Showing them together does not make them one continuous cable or demonstrate fibres between the families.',
    'Show F with C_FPH and C_PH, then compare each route with the gross hippocampal reference. Name the source that supports each anatomical description before opening the answer.',
    ['F and the cingulum are separate installed pathway families.','The fornix anatomy and cingulum subdivisions come from different anatomical and reconstruction evidence.','The hippocampus is shown at gross scale; the mammillary bodies and fine cingulum endpoints are absent.','A single view cannot establish which fibres are intact in an individual.'],
    'A resident explanation should name the pathway under discussion before attaching it to a broader memory model. This group render does not show whether either route is intact in a person.',
    'If both pathways appear in one limbic model, are they one tract?',
    'No. F and the cingulum are distinct anatomical systems that can be placed in a broader circuit model. The scene shows their population geometry and does not establish a continuous fibre connection between them.',
    ['MS2','MS3','K3','D2','D3'],
    medialScene({bundles:['F','C_FPH','C_PH'],deep:true,deepRegions:['HIP'],surface:.14}),
    {regions:['msFornixCourse','msCingulumRoutes'],evidenceClass:'schematic',targets:[bundle('F','F, Fornix'),bundle('C_FPH','C_FPH, Cingulum, frontal-parahippocampal'),bundle('C_PH','C_PH, parahippocampal cingulum'),deep('HIP','Hippocampus')]}
  ),
  step('Bound what a highlighted route says about memory',
    'Use the Papez model to retrieve links that are not represented in this scene. The mammillary bodies, mammillothalamic tract and identified anterior thalamic nuclei remain unrepresented.',
    'Show F, C_PH and TR_A with HIP and THA visible. Compare the displayed pathways with the named Papez links and identify which structures remain absent.',
    ['F and TR_A are displayed pathway references, not a complete hippocampal-diencephalic route.','The mammillary bodies are not separate scene objects.','The mammillothalamic tract is not rendered.','The gross THA mesh does not identify anterior thalamic nuclei.'],
    'A highlighted route does not measure memory; in resident teaching, pair any memory claim with a named test and its result.',
    'Which links in the hippocampal–diencephalic route remain unrepresented?',
    'The mammillary bodies, mammillothalamic tract and identified anterior thalamic nuclei remain unrepresented.',
    ['MS2','MS4','D2'],
    medialScene({bundles:['F','C_PH','TR_A'],regions:cortex(14,118),deep:true,deepRegions:['HIP','THA'],surface:.14}),
    {regions:['msPapezModel'],evidenceClass:'conceptual_model',targets:[bundle('F','F, Fornix'),bundle('C_PH','C_PH, parahippocampal cingulum'),bundle('TR_A','TR_A, anterior thalamic radiation'),deep('HIP','Hippocampus'),deep('THA','Thalamus, gross'),parcel(14,'RSC, retrosplenial reference'),parcel(118,'EC, entorhinal reference')]}
  ),
],{regionCards:['msFornixCourse','msCingulumRoutes','msPapezModel']});

export const LESSONS=[l];
export const GUIDES={
  'medial-system':{shortTitle:'Fornix, cingulum and the Papez loop',hemisphere:'L',
    question:'How do the fornix and cingulum enter the Papez model, and what does the atlas leave unresolved?',
    takeaways:[{step:0,text:'Name the fornix waypoints from anatomical sources, not from the F render alone.'},{step:2,text:'Compare cingulum families as reconstructed routes rather than histological compartments.'},{step:5,text:'Identify the mammillary bodies, mammillothalamic tract and anterior thalamic nuclei as links absent from the displayed route.'}]},
};
