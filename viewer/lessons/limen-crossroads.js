import {source,parcel,deep,bundle,cortex,scene,step,lesson} from './resident-anatomy.js';

export const SOURCES={
  LC1:source('LC1','Ebeling et al., 1988 · temporal-lobe topography of the optic radiation','3407471','experimental_anatomy','An anatomical topography account of the optic radiation in the temporal lobe. It supports regional anatomical relationships, not an individual pathway boundary or operative limit.'),
};

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
    sources:['K5','V4','D2'],
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
    {regions:['lcLimenLayers'],evidenceClass:'experimental_anatomy',targets:[bundle('UF','UF, Uncinate fasciculus'),bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),bundle('AC','AC, Anterior commissure'),bundle('OR','OR, Optic radiation'),parcel(111,'AVI, anterior ventral insula'),parcel(172,'TGv, ventral temporal cortex'),parcel(93,'OFC, orbitofrontal cortex')]}
  ),
  step('Set the UF and IFOF at different levels',
    'At the limen, dissection accounts describe the UF as lower and anterior to the IFOF, which lies higher and posterior in the subinsular corridor. This local relationship shifts as the pathways turn through depth along the temporal stem.',
    'Show UF and IFOF together, then rotate between lateral and anterior views; describe their anterior and superior positions at each level.',
    ['The UF and IFOF have different local positions as they pass the limen.','The relationship changes along the temporal stem as the pathways turn through depth.','A lateral projection can hide mediolateral separation.'],
    'For teaching, identify the anatomical level and axis before describing one structure as above or below another.',
    'Why is "one lies above the other" incomplete when describing these pathways?',
    'The relative position depends on the level and viewing axis as the pathways turn through three dimensions. State the limen or temporal-stem level and the direction being compared.',
    ['R3','Q4','V2','D2'],
    scene({side:'follow',surface:.08,camera:{view:'anterior',tweenMs:650},bundles:['UF','IFOF'],regions:cortex(111,172)}),
    {regions:['lcLimenLayers'],evidenceClass:'experimental_anatomy',targets:[bundle('UF','UF, Uncinate fasciculus'),bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),parcel(111,'AVI, anterior ventral insula'),parcel(172,'TGv, ventral temporal cortex')]}
  ),
  step('Distinguish the EMC family from the capsule layer',
    'The extreme capsule is an anatomical layer, and EMC is a separate displayed population bundle family. Dissection accounts place IFOF in a subinsular extreme-capsule relationship; sampled lines cannot mark capsule boundaries.',
    'Select IFOF and then EMC; compare the two family courses while naming the capsule layers that the viewer does not draw.',
    ['The insula, extreme capsule, claustrum and external capsule are separate parts of the subinsular sequence.','The atlas has no claustrum or external-capsule scene targets.','IFOF and EMC are separate display families; neither draws histological capsule borders.'],
    'Use anatomical terminology for the capsule and the bundle names for the displayed pathway families.',
    'If IFOF and EMC appear adjacent, what does the scene establish?',
    'It shows adjacent population bundle references in this view. It does not identify the thin capsule boundary or establish shared fibres.',
    ['V2','Q4','R2','D2'],
    scene({side:'follow',surface:.08,camera:{view:'left',tweenMs:650},bundles:['IFOF'],ghost:['EMC'],regions:cortex(111,172)}),
    {regions:['lcLimenLayers'],evidenceClass:'experimental_anatomy',targets:[bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),bundle('EMC','EMC, Extreme-capsule family'),parcel(111,'AVI, anterior ventral insula'),parcel(172,'TGv, ventral temporal cortex')]}
  ),
  step('Read the anterior and posterior commissural limbs',
    'The anterior commissure is described as two limbs with different directions and neighbours. The anterior limb relates to olfactory structures, while the posterior limb continues into temporal white matter; the scene displays a family reference rather than two isolated limb meshes.',
    'Use the anterior view and follow the AC family across the midline; predict which limb continues toward the temporal lobe before opening the explanation.',
    ['The anterior commissure crosses the midline and has anterior and posterior limbs.','The anterior limb has an olfactory relationship.','The posterior limb extends toward temporal white matter and the temporal-stem region.','The atlas family does not define an individual boundary for either limb.'],
    'A resident account should name the limb and its neighbouring region instead of treating the commissure as a single midline point.',
    'Which limb is relevant when describing the commissural route toward temporal white matter?',
    'The posterior limb continues toward temporal white matter. The anterior limb has a different, olfactory relationship, and the atlas does not isolate either limb as a separate mesh.',
    ['K5','V4','R3','D2'],
    scene({side:'follow',surface:.06,camera:{view:'anterior',tweenMs:650},bundles:['AC'],regions:cortex(93,172)}),
    {regions:['lcCommissuralLimbs'],evidenceClass:'experimental_anatomy',targets:[bundle('AC','AC, Anterior commissure'),parcel(93,'OFC, orbitofrontal cortex'),parcel(172,'TGv, ventral temporal cortex')]}
  ),
  step('Place the posterior limb beneath the pallidum',
    'The posterior AC limb takes a deep and medial course beneath the pallidum toward the temporal stem. The gross pallidal mesh is an orientation landmark.',
    'Add the globus pallidus reference, turn to the medial view, and describe the AC course relative to the deep grey landmark.',
    ['The posterior AC limb passes beneath the pallidum on its temporal course.','The temporal stem is a relationship among white-matter pathways, not a single fascicle.','The pallidum is a gross deep-grey reference in this scene.'],
    'When presenting the deep relationship, name both the commissural limb and the neighbouring landmark.',
    'Why pair the posterior commissural limb with a pallidal reference?',
    "The pallidum helps orient the limb's deep relationship on the way toward the temporal stem. Its gross mesh does not delineate the limb or establish an individual boundary.",
    ['K5','V4','R3','D2','D3'],
    scene({side:'follow',surface:.04,camera:{view:'medial',tweenMs:650},bundles:['AC'],ghost:['IFOF'],deep:true,deepRegions:['GP'],regions:cortex(172)}),
    {regions:['lcCommissuralLimbs','lcLimenLayers'],evidenceClass:'experimental_anatomy',targets:[bundle('AC','AC, Anterior commissure'),bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),deep('GP','Globus pallidus'),parcel(172,'TGv, ventral temporal cortex')]}
  ),
  step('Keep the optic radiation at the deep temporal edge',
    "Meyer's loop is the anterior sweep of the optic-radiation family in relation to the temporal-horn roof. The horn is absent from the scene, which cannot show a sectional boundary for the deep temporal-stem relationship.",
    'Show OR with IFOF dimmed, rotate to the medial view, and identify the absent temporal-horn surface that anatomical descriptions use as a reference.',
    ['The optic radiation has a temporal course as well as a posterior visual-cortical relationship.','The temporal horn provides an anatomical reference for the anterior optic-radiation sweep but is absent from this scene.','The rendered OR family is a population reconstruction; the viewer does not separately label the anterior loop.'],
    'For a resident presentation, relate this anatomy to findings from the individual before proposing a visual implication.',
    'What does the absent temporal horn contribute to an account of the deep optic-radiation relationship?',
    "The horn anchors the anatomical description of the loop's course around the temporal lobe. The atlas lacks that surface, so use the cited relationship rather than inferring a boundary from an absent mesh.",
    ['R3','LC1','D2'],
    scene({side:'follow',surface:.06,camera:{view:'medial',tweenMs:650},bundles:['OR'],ghost:['IFOF','AC'],deep:true,deepRegions:['AMY','HIP'],regions:cortex(172)}),
    {regions:['lcLimenLayers'],evidenceClass:'reconstruction',targets:[bundle('OR','OR, Optic radiation'),bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),deep('AMY','Amygdala (gross)'),deep('HIP','Hippocampus (gross)'),parcel(172,'TGv, ventral temporal cortex')]}
  ),
  step('Integrate the stem without inventing a plane',
    'The stack changes along the corridor: UF and IFOF have a local anterior-superior relationship at the limen, while the AC posterior limb and optic radiation occupy deeper temporal-stem relationships. Capsule layers, claustrum, external capsule and temporal horn remain absent from the scene.',
    'Keep UF, IFOF, AC and OR visible, rotate from lateral to medial, and narrate each relationship with its level and axis.',
    ['UF and IFOF have distinct positions at the limen.','The IFOF and EMC display families do not show capsule tissue boundaries.','The posterior AC limb has a deep pallidal relationship, while the optic radiation is described relative to the absent temporal horn.','Population reference geometry does not establish individual anatomy or surgical safety.'],
    'A resident should present the named pathway, level and neighbouring structure, then state what the atlas cannot resolve. This supports anatomical discussion without treating a population reference as a clinical tool.',
    'Why is one direction word insufficient for the limen and temporal-stem stack?',
    'The pathways turn and change their relative positions along the corridor, so "deep" or "posterior" depends on the level and axis. Name the structures and relationship, then distinguish the population display from individual anatomy.',
    ['R3','Q4','V2','K5','V4','LC1','D2'],
    scene({side:'follow',surface:.06,camera:{view:'follow',tweenMs:650},bundles:['UF','IFOF','AC','OR'],ghost:['EMC'],deep:true,deepRegions:['GP','AMY','HIP'],regions:cortex(111,172,93)}),
    {regions:['lcLimenLayers','lcCommissuralLimbs'],evidenceClass:'schematic',targets:[bundle('UF','UF, Uncinate fasciculus'),bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),bundle('AC','AC, Anterior commissure'),bundle('OR','OR, Optic radiation'),bundle('EMC','EMC, Extreme-capsule family'),deep('GP','Globus pallidus'),parcel(111,'AVI, anterior ventral insula'),parcel(172,'TGv, ventral temporal cortex'),parcel(93,'OFC, orbitofrontal cortex')]}
  ),
],{regionCards:['lcLimenLayers','lcCommissuralLimbs']});

export const LESSONS=[l];
export const GUIDES={
  'limen-crossroads':{shortTitle:'Limen & temporal-stem stack',hemisphere:'L',question:'How do the UF, IFOF, anterior commissure and optic radiation change their relationships along the limen and temporal stem?',takeaways:[{step:0,text:'Name the level and axis before interpreting a visible crossing.'},{step:3,text:'Distinguish the anterior and posterior commissural limbs by their neighbours.'},{step:6,text:'Integrate the pathways while naming layers and landmarks absent from the scene.'}]},
};
