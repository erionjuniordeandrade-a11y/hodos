import {parcel,deep,bundle,cortex,scene,step,lesson} from './resident-anatomy.js';

export const SOURCES={};

export const REGIONS={
  lcLimenLayers:{
    name:'Limen and temporal-stem relationships',
    text:'Dissection-based descriptions place ventral pathways in changing relationships around the limen and temporal stem. The atlas shows population bundle families but does not resolve the thin capsule layers or an individual boundary.',
    sources:['R3','Q4','V2','R2','D2'],
    evidenceClass:'experimental_anatomy',
  },
  lcCommissuralLimbs:{
    name:'Anterior commissure limbs',
    text:'The anterior and posterior limbs of the anterior commissure have different olfactory and temporal relationships. Fibre dissection and the population bundle reference support this route-level account, not an individual limb boundary or functional consequence.',
    sources:['V4','R3','D2'],
    evidenceClass:'experimental_anatomy',
  },
};

const l=lesson('limen-crossroads','The limen crossroads',16,
  'Read the limen and temporal stem as a changing three-dimensional stack of association, commissural and visual pathways, while keeping unrendered tissue layers explicit.',
  ['Describe the local UF and IFOF relationship at the limen without treating overlap as shared fibres.','Distinguish the IFOF and EMC display families from the capsule layers they do not segment.','Relate the anterior commissure limbs and optic radiation to the deeper temporal-stem corridor.'],[
  step('Open the crossroads in three dimensions',
    'The limen is an anatomical junction in the subinsular corridor, and the atlas has no separate limen mesh. The reference view brings UF, IFOF, anterior commissure and optic-radiation families into one population scene.',
    'Rotate from lateral to anterior and name the level and viewing axis before describing where two visible courses meet.',
    ['The limen is a landmark within the changing temporal-stem relationship, with no separate installed structure.','The temporal stem is described through neighbouring pathways and levels along the corridor.','The displayed bundle lines are population references; an apparent crossing does not establish shared fibres.'],
    'In a resident discussion, state the side, level and axis of the relationship before using the view to frame an anatomical question.',
    'What should accompany a statement that two pathways meet at the limen?',
    'Name both pathways and the level and axis of their relationship. The displayed population geometry does not establish shared fibres or an individual boundary.',
    ['R3','Q4','D2'],
    scene({side:'follow',surface:.1,camera:{view:'left',tweenMs:650},bundles:['UF','IFOF','AC','OR'],regions:cortex(111,172,93)}),
    {regions:['lcLimenLayers'],evidenceClass:'experimental_anatomy',targets:[bundle('UF','UF, Uncinate fasciculus'),bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),bundle('AC','AC, Anterior commissure'),bundle('OR','OR, Optic radiation'),parcel(111,'L_AVI_ROI, anterior ventral insula'),parcel(172,'L_TGv_ROI, ventral temporal cortex'),parcel(93,'L_OFC_ROI, orbitofrontal cortex')]}
  ),
  step('Set the UF and IFOF at different levels',
    'At the limen, dissection accounts describe the UF as anterior and inferior to the IFOF in the subinsular corridor. Their anatomical relationship varies along the course through the temporal stem.',
    'Show UF and IFOF together, then rotate between lateral and anterior views; first state their relationship at a fixed level, then compare the projected appearance from each camera view.',
    ['At the limen, the UF is anterior and inferior to the IFOF in the cited dissection account.','Their anatomical relationship varies along the course.','Rotating the camera changes projected appearance, not the anatomical relationship at a fixed level.'],
    'For teaching, identify the anatomical level and axis before describing one structure as above or below another, and do not treat a projection as a changed anatomical relationship.',
    'Why is "one lies above the other" incomplete when describing these pathways?',
    'Their anatomical relationship varies along the course. Rotating the camera changes its projected appearance, not the anatomical relationship at a fixed level. State the limen or temporal-stem level and the direction being compared.',
    ['R3','Q4','V2','D2'],
    scene({side:'follow',surface:.08,camera:{view:'anterior',tweenMs:650},bundles:['UF','IFOF'],regions:cortex(111,172)}),
    {regions:['lcLimenLayers'],evidenceClass:'experimental_anatomy',targets:[bundle('UF','UF, Uncinate fasciculus'),bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),parcel(111,'L_AVI_ROI, anterior ventral insula'),parcel(172,'L_TGv_ROI, ventral temporal cortex')]}
  ),
  step('Distinguish the EMC family from the capsule layer',
    'Ribas distinguishes superficial extreme-capsule short association fibres from deeper external-capsule pathways, including UF and IFOF. Other dissection accounts describe passage through both capsules; the displayed EMC family cannot resolve this tissue distinction. The extreme and external capsules are absent from the scene.',
    'Select IFOF and then EMC to compare the displayed bundle families. Describe the superficial and deeper capsule layers from the cited dissection account, and note that the scene does not segment them.',
    ['In the Ribas account, superficial extreme-capsule fibres are short association fibres.','The deeper external capsule carries long ventral pathways, including UF and IFOF.','Other dissection accounts describe passage through both capsules.','The extreme and external capsules are absent from the scene; the claustrum is not rendered, and EMC does not resolve those layers.'],
    'Use anatomical terminology for the capsule layers and bundle names for the displayed pathway families; the scene does not distinguish the tissue layers.',
    'In the Ribas account, which layer carries the long ventral pathways including UF and IFOF?',
    'The deeper external capsule carries the long ventral pathways, including UF and IFOF. The superficial extreme capsule contains short association fibres in this account. The EMC display family cannot resolve this tissue distinction.',
    ['Q4','R3','D2'],
    scene({side:'follow',surface:.08,camera:{view:'left',tweenMs:650},bundles:['IFOF'],ghost:['EMC'],regions:cortex(111,172)}),
    {regions:['lcLimenLayers'],evidenceClass:'experimental_anatomy',targets:[bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),bundle('EMC','EMC, Extreme-capsule family'),parcel(111,'L_AVI_ROI, anterior ventral insula'),parcel(172,'L_TGv_ROI, ventral temporal cortex')]}
  ),
  step('Read the anterior and posterior commissural limbs',
    'The anterior commissure is described as two limbs with different directions and neighbours. The anterior limb has olfactory relationships described in anatomical studies; the relevant olfactory structures are not rendered here. OFC provides cortical orientation only. The posterior limb continues into temporal white matter; the scene displays a family reference rather than two isolated limb meshes.',
    'Use the anterior view and follow the AC family across the midline. Use OFC for cortical orientation only, note that the olfactory structures are absent, then predict which limb continues toward the temporal lobe.',
    ['The anterior commissure crosses the midline and has anterior and posterior limbs.','The anterior limb has olfactory relationships described in anatomical studies; the relevant olfactory structures are not rendered here.','OFC provides cortical orientation only, while the posterior limb extends toward temporal white matter and the temporal-stem region.','The atlas family does not define an individual boundary for either limb.'],
    'A resident account should name the limb and its neighbouring region, while separating the unrendered olfactory structures from OFC orientation.',
    'Which limb is relevant when describing the commissural route toward temporal white matter?',
    'The posterior limb continues toward temporal white matter. The anterior limb has a different olfactory relationship; its relevant olfactory structures are not rendered, and OFC provides cortical orientation only. The atlas does not isolate either limb as a separate mesh.',
    ['V4','R3','D2'],
    scene({side:'follow',surface:.06,camera:{view:'anterior',tweenMs:650},bundles:['AC'],regions:cortex(93,172)}),
    {regions:['lcCommissuralLimbs'],evidenceClass:'experimental_anatomy',targets:[bundle('AC','AC, Anterior commissure'),parcel(93,'L_OFC_ROI, orbitofrontal cortex'),parcel(172,'L_TGv_ROI, ventral temporal cortex')]}
  ),
  step('Place the posterior limb beneath the pallidum',
    'The posterior AC limb takes a deep and medial course beneath the pallidum toward the temporal stem. The gross pallidal mesh is an orientation landmark.',
    'Add the globus pallidus reference, turn to the medial view, and describe the AC course relative to the deep grey landmark.',
    ['The posterior AC limb passes beneath the pallidum on its temporal course.','The temporal stem is a relationship among white-matter pathways, not a single fascicle.','The pallidum is a gross deep-grey reference in this scene.'],
    'When presenting the deep relationship, name both the commissural limb and the neighbouring landmark.',
    'Why pair the posterior commissural limb with a pallidal reference?',
    "The pallidum helps orient the limb's deep relationship on the way toward the temporal stem. Its gross mesh does not delineate the limb or establish an individual boundary.",
    ['V4','R3','D2','D3'],
    scene({side:'follow',surface:.04,camera:{view:'medial',tweenMs:650},bundles:['AC'],ghost:['IFOF'],deep:true,deepRegions:['GP'],regions:cortex(172)}),
    {regions:['lcCommissuralLimbs','lcLimenLayers'],evidenceClass:'experimental_anatomy',targets:[bundle('AC','AC, Anterior commissure'),bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),deep('GP','Globus pallidus'),parcel(172,'L_TGv_ROI, ventral temporal cortex')]}
  ),
  step('Keep the optic radiation at the deep temporal edge',
    'Beneath the posterior inferior limiting insular sulcus, optic radiations occupy a deeper layer than the anterior commissure and external-capsule pathways. Compare OR with the dimmed AC and IFOF references, while distinguishing this dissection-derived order from the unsegmented scene. The external capsule is absent from the scene.',
    'At the posterior inferior limiting insular sulcus level, compare OR with the dimmed AC and IFOF references in the medial view, then distinguish the cited layer order from the unsegmented scene.',
    ['At this level, optic radiations are deeper than the anterior commissure and external-capsule pathways in the cited dissection account.','AC and IFOF provide dimmed population references; the scene does not segment the posterior inferior limiting insular sulcus or capsule layers.','The rendered OR family is a population reconstruction and does not itself establish the layer order.'],
    'For resident teaching, state that this is a level-specific dissection sequence and name the unsegmented layers before applying the scene as an orientation reference.',
    'Of OR, AC and IFOF, which is deepest beneath the posterior inferior limiting insular sulcus in this account?',
    'The optic radiation is deepest. The anterior commissure and external-capsule pathways, including IFOF, are more superficial at this level. The scene cannot segment the layer boundaries.',
    ['Q4','D2'],
    scene({side:'follow',surface:.06,camera:{view:'medial',tweenMs:650},bundles:['OR'],ghost:['IFOF','AC'],regions:cortex(172)}),
    {regions:['lcLimenLayers'],evidenceClass:'experimental_anatomy',targets:[bundle('OR','OR, Optic radiation'),bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),bundle('AC','AC, Anterior commissure'),parcel(172,'L_TGv_ROI, ventral temporal cortex')]}
  ),
  step('Integrate the stem without inventing a plane',
    'At the limen, UF lies anterior and inferior to IFOF. In the inferior-limiting-sulcus dissection account, external-capsule pathways are superficial to the anterior commissure, with optic radiations deeper still; this level-specific sequence does not define a universal operative plane. The extreme capsule, claustrum, external capsule and temporal horn remain absent from the scene.',
    'Keep UF, IFOF, AC and OR visible, rotate from lateral to medial, and narrate the cited sequence at its stated level before comparing its projected appearance from each view.',
    ['At the limen, UF lies anterior and inferior to IFOF.','In the cited inferior-limiting-sulcus account, external-capsule pathways are superficial to the anterior commissure, with optic radiations deeper still.','The extreme capsule, claustrum, external capsule and temporal horn remain absent from the scene.','Population reference geometry does not establish individual anatomy or surgical safety.'],
    'A resident should present the named pathway, level and neighbouring structure, then state what the atlas cannot resolve. This level-specific sequence does not define a universal operative plane.',
    'Why does the cited limen sequence not define a universal operative plane?',
    'It describes relationships at a particular dissection level: UF is anterior and inferior to IFOF at the limen, external-capsule pathways are superficial to the anterior commissure, and optic radiations are deeper still. The atlas does not render the thin layer boundaries, so the sequence cannot establish an individual plane.',
    ['R3','Q4','D2'],
    scene({side:'follow',surface:.06,camera:{view:'follow',tweenMs:650},bundles:['UF','IFOF','AC','OR'],ghost:['EMC'],deep:true,deepRegions:['GP','AMY','HIP'],regions:cortex(111,172,93)}),
    {regions:['lcLimenLayers','lcCommissuralLimbs'],evidenceClass:'schematic',targets:[bundle('UF','UF, Uncinate fasciculus'),bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),bundle('AC','AC, Anterior commissure'),bundle('OR','OR, Optic radiation'),bundle('EMC','EMC, Extreme-capsule family'),deep('GP','Globus pallidus'),parcel(111,'L_AVI_ROI, anterior ventral insula'),parcel(172,'L_TGv_ROI, ventral temporal cortex'),parcel(93,'L_OFC_ROI, orbitofrontal cortex')]}
  ),
],{regionCards:['lcLimenLayers','lcCommissuralLimbs']});

export const LESSONS=[l];
export const GUIDES={
  'limen-crossroads':{shortTitle:'Limen & temporal-stem stack',hemisphere:'L',question:'How do the UF, IFOF, anterior commissure and optic radiation change their relationships along the limen and temporal stem?',takeaways:[{step:0,text:'Name the level and axis before interpreting a visible crossing.'},{step:3,text:'Distinguish the anterior and posterior commissural limbs by their neighbours.'},{step:6,text:'State the level-specific layer sequence and what the scene cannot segment.'}]},
};
