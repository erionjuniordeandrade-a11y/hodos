import {source,parcel,deep,bundle,cortex,scene,step,lesson} from './resident-anatomy.js';

export const SOURCES={
  MB1:source('MB1','Ruan et al., 2018 · supplementary and pre-supplementary probability maps','30187192','atlas','Human cytoarchitectonic and probability mapping distinguishes supplementary from pre-supplementary motor territories. Group maps do not establish an individual HCP parcel boundary.'),
  MB2:source('MB2','Kinoshita et al., 2015 · frontostriatal and frontal aslant pathways','25086832','experimental_anatomy','Axonal mapping examines frontostriatal and frontal aslant pathways in movement and speech. It supports distinguishing these relationships, not an exclusive initiation function or an installed individual circuit.'),
  MB3:source('MB3','Nachev et al., 2008 · supplementary and pre-supplementary motor function','18843271','conceptual_model','Review of functional contributions and interactions of SMA and pre-SMA in action control. It does not assign exclusive operations to atlas parcels or predict an individual outcome.'),
  MB4:source('MB4','Vergani et al., 2014 · supplementary motor area white matter connections','24741063','experimental_anatomy','Human anatomical study of SMA white matter connections. It supports a broader connectional account, not endpoint proportions or a causal recovery mechanism.'),
  MB5:source('MB5','Picard and Strick, 1996 · medial-wall motor areas','8670662','conceptual_model','Review of medial-wall motor area locations and functional activation, including somatotopic organisation. It does not provide individual effector borders for the displayed parcels.'),
};

export const REGIONS={
  mbMedialSequence:{name:'Medial motor sequence and function',text:'6ma, 6mp and 4 are population parcel references used to orient pre-SMA, SMA proper and M1. Cytoarchitectonic probability maps and HCP parcel outlines are different reference systems; functional accounts distinguish contributions without making each parcel an exclusive action stage.',sources:['M1','MB1','MB3'],evidenceClass:'atlas'},
  mbInitiationConnections:{name:'Candidate connections in an initiation account',text:'FAT and frontostriatal pathways are distinct anatomical relationships discussed in axonal mapping. FAT is available as a population bundle here, while the frontostriatal route is not a separate selectable sample; gross caudate and putamen meshes do not identify its endpoints.',sources:['MB2','R9','D2','D3'],evidenceClass:'experimental_anatomy'},
  mbLevelMap:{name:'A body-map claim belongs to a level and method',text:'The corona radiata, posterior limb and cerebral peduncle are separate levels in the body-map discussion. The sources cited here support population CST reconstructions and a method-specific capsular observation, but not a detailed corona-radiata or peduncular effector order.',sources:['D2','M4','M5','R8','D3'],evidenceClass:'reconstruction'},
};

const l=lesson('motor-beyond-m1','Motor beyond M1: SMA, initiation and the CST body map',16,
  'Relate medial frontal organisation to initiation, then audit what the available evidence can say about a CST body map at each named level.',
  ['Orient pre-SMA, SMA proper and M1 without treating parcel borders as exclusive functional stages.','Distinguish the visible FAT sample from the frontostriatal relationship in an initiation account.','Keep CST somatotopy claims attached to their anatomical level and evidence method.'],[
  step('Orient the medial sequence without making a pipeline',
    'Teaching sequences usually move from pre-SMA through SMA proper to M1 using 6ma, 6mp and area 4 as anterior-to-posterior references. Ruan’s cytoarchitectonic probability maps and the HCP parcel outlines are different reference systems. Functional reviews distinguish contributions across these regions without making each parcel an exclusive choose, start or execute stage.',
    'Select 6ma, 6mp and area 4 in turn on the medial surface, then state their anterior-to-posterior order before adding a functional description.',
    ['6ma, 6mp and area 4 are distinct population parcel references.','Ruan describes cytoarchitectonic probability maps for pre-SMA and SMA.','Functional accounts distinguish medial motor contributions while allowing interaction.','A parcel outline does not locate an individual functional border.'],
    'For resident teaching, name the reference territory and the action question separately. The displayed parcels are orientation aids, not individual functional or surgical boundaries.',
    'Why is it incomplete to label 6ma, 6mp and area 4 as three exclusive action stages?',
    'The sequence provides spatial orientation, but the functional accounts describe interacting contributions rather than one fixed operation per parcel. The atlas shows population reference boundaries, not an individual functional transition.',
    ['M1','MB1','MB3'],
    scene({side:'L',regions:cortex(44,55,8),surface:.9,camera:{view:'medial',tweenMs:650}}),
    {regions:['mbMedialSequence'],evidenceClass:'conceptual_model',targets:[parcel(44,'6ma, anterior medial premotor'),parcel(55,'6mp, posterior medial premotor'),parcel(8,'4, primary motor reference')]}
  ),
  step('Separate FAT from the frontostriatal relationship',
    'In a 19-patient awake glioma series, Kinoshita and colleagues associated resection close to the frontostriatal tract with transient movement-initiation disorders, whereas resection close to the left FAT was associated with transient speech-initiation disorders. These associations do not establish exclusive functions or predict individual outcomes. FAT is the selectable frontal association family here; a distinct frontostriatal bundle is not installed, and gross caudate and putamen meshes do not identify its endpoints.',
    'Keep CST dimmed. Compare the visible FAT bundle with the frontostriatal relationship described in the study, using the gross caudate and putamen meshes as orientation references.',
    ['Kinoshita’s awake glioma series included 19 patients.','Resection close to the frontostriatal tract was associated with transient movement-initiation disorders.','Resection close to the left FAT was associated with transient speech-initiation disorders.','These associations establish neither exclusive functions nor individual outcomes.'],
    'Teach these findings as group associations, not exclusive tract functions or individual outcome predictions. The visible FAT bundle and gross striatal meshes do not establish a frontostriatal endpoint here.',
    'Which transient initiation disorder was associated with resection close to the frontostriatal tract, and which with resection close to the left FAT?',
    'The series associated frontostriatal proximity with transient movement-initiation disorders and left FAT proximity with transient speech-initiation disorders. These group associations do not establish exclusive functions or predict an individual outcome.',
    ['MB2','R9','D2','D3'],
    scene({side:'L',bundles:['FAT'],ghost:['CST'],regions:cortex(44,55),deep:true,deepRegions:['CAU','PUT'],surface:.13,camera:{view:'left',tweenMs:650}}),
    {regions:['mbInitiationConnections'],evidenceClass:'experimental_anatomy',targets:[bundle('FAT','FAT, frontal aslant tract'),bundle('CST','CST, corticospinal tract'),parcel(44,'6ma, anterior medial premotor'),parcel(55,'6mp, posterior medial premotor'),deep('CAU','Caudate nucleus'),deep('PUT','Putamen')]}
  ),
  step('Keep connectional anatomy separate from recovery',
    'Vergani and colleagues describe SMA white-matter connections, while a surgical series reports a group recovery pattern. The anatomical relationships shown here do not establish opposite-SMA recruitment as the cause of recovery or explain an individual course.',
    'Show CC and FAT with CST dimmed, then rotate to the medial view and compare both with 6ma and 6mp.',
    ['Vergani and colleagues describe SMA white-matter connections.','Krainik and colleagues report a group recovery pattern after SMA-region surgery.','The surgical series does not establish opposite-SMA recruitment as its cause.','The population bundle display does not measure recruitment or explain an individual recovery course.'],
    'Separate anatomical context from a causal recovery account. Do not infer recruitment or an individual course from a population bundle display.',
    'Do the displayed callosal and frontal-aslant bundles establish that opposite-SMA recruitment caused recovery in the surgical series?',
    'No. The anatomy study describes SMA white-matter connections and the surgical series reports a group recovery pattern, but the display does not measure recruitment or show that the connections caused recovery.',
    ['MB4','M9','D2'],
    scene({side:'L',bundles:['CC','FAT'],ghost:['CST'],regions:cortex(44,55),surface:.1,camera:{view:'medial',tweenMs:650}}),
    {regions:['mbMedialSequence','mbInitiationConnections'],evidenceClass:'association',targets:[bundle('CC','CC, corpus callosum'),bundle('FAT','FAT, frontal aslant tract'),bundle('CST','CST, corticospinal tract'),parcel(44,'6ma, anterior medial premotor'),parcel(55,'6mp, posterior medial premotor')]}
  ),
  step('Ask what SMA somatotopy adds to the parcel sequence',
    'Reviews describe a rostral-to-caudal face, arm and leg sequence within SMA proper, mapped by stimulation and imaging studies. This is a study-level functional account, while the scene shows one 6mp parcel outline without that internal sequence or individual effector borders.',
    'Compare the single 6mp outline with the reported rostral-to-caudal sequence. Identify the functional methods behind the sequence and what the scene leaves unshown.',
    ['Reviews describe a rostral-to-caudal face, arm and leg sequence within SMA proper.','Stimulation and imaging studies contribute to these functional maps.','A single 6mp parcel outline does not display the within-SMA sequence.','Population parcel boundaries do not provide individual effector borders.'],
    'Keep evidence about within-SMA functional organisation distinct from an individual parcel map. Do not convert a group sequence into an individual functional or surgical boundary.',
    'What rostral-to-caudal face, arm and leg sequence is described within SMA proper, and what does the single 6mp outline leave unshown?',
    'Reviews describe a rostral-to-caudal face, arm and leg sequence within SMA proper, with functional evidence from stimulation and imaging studies. The displayed 6mp parcel is a single population outline and does not show those internal functional fields or an individual’s boundaries.',
    ['MB3','MB5'],
    scene({side:'L',regions:cortex(55,8),surface:.86,camera:{view:'medial',tweenMs:650}}),
    {regions:['mbMedialSequence'],evidenceClass:'conceptual_model',targets:[parcel(55,'6mp, SMA territory reference'),parcel(8,'4, primary motor reference')]}
  ),
  step('At the corona radiata, audit the body-map evidence',
    'The corona radiata is one named level in the body-map discussion. The displayed CST cannot identify upper- or lower-limb fibres. Facial motor pathways require a separate corticobulbar discussion. Cortical-origin comparisons do not assign these displayed lines to individual effectors.',
    'Show the CST reference from a superior view. Ask whether the display identifies upper- or lower-limb fibres, and keep facial motor pathways as a separate corticobulbar discussion.',
    ['The displayed CST is a population-averaged reconstruction.','It cannot identify upper- or lower-limb fibres at the corona radiata.','Facial motor pathways require a separate corticobulbar discussion.','Cortical-origin comparisons do not assign these displayed lines to individual effectors.'],
    'Name the displayed pathway and anatomical level, then make the separate evidence need explicit. Do not present a group bundle as an individual limb map.',
    'Can cortical-origin comparisons of descending tracts identify upper- or lower-limb fibres in this corona-radiata CST?',
    'No. Usuda and colleagues compared descending contributions by cortical origin, but the displayed CST cannot identify upper- or lower-limb fibres. Facial motor pathways require a separate corticobulbar discussion.',
    ['D2','M4'],
    scene({side:'L',bundles:['CST'],regions:cortex(8),surface:.08,camera:{view:'superior',tweenMs:650}}),
    {regions:['mbLevelMap'],evidenceClass:'reconstruction',targets:[bundle('CST','CST, corticospinal tract'),parcel(8,'4, primary motor reference')]}
  ),
  step('At the posterior limb, attach the map to its method',
    'In a small DTI study of ten people (20 reconstructed CSTs), Holodny and colleagues found hand fibres anterolateral to foot fibres in 17 tracts; in the other three, hand and foot fibres were intermixed. These study-specific observations do not label the displayed population CST or establish an individual capsular map. The posterior limb itself is not separately segmented here.',
    'Show the population CST beside the gross thalamic and lentiform references. State the hand–foot relationship reported in the DTI study, then note that the displayed scene does not provide an individual capsular map.',
    ['Holodny and colleagues reconstructed 20 CSTs in a DTI study of ten people.','Hand fibres lay anterolateral to foot fibres in 17 tracts.','Hand and foot fibres were intermixed in the other three tracts.','The posterior limb is not separately segmented here; the population CST does not establish an individual capsular map.'],
    'Report the hand–foot pattern as a study-specific finding. It does not establish a universal order or map an individual capsule.',
    'What hand–foot relationship did this study report, and why is it not universal?',
    'The study reported hand fibres anterolateral to foot fibres in 17 of 20 tracts and an intermixed arrangement in the other three. This study-specific variation prevents treating that arrangement as universal, and it does not label the displayed population CST or map an individual capsule.',
    ['M5','D2','D3'],
    scene({side:'L',bundles:['CST'],deep:true,deepRegions:['THA','PUT','GP'],regions:cortex(8),surface:.06,camera:{view:'anterior',tweenMs:650}}),
    {regions:['mbLevelMap'],evidenceClass:'reconstruction',targets:[bundle('CST','CST, corticospinal tract'),deep('THA','Thalamus'),deep('PUT','Putamen'),deep('GP','Globus pallidus'),parcel(8,'4, primary motor reference')]}
  ),
  step('At the peduncle, leave the body-part order unresolved',
    'The cerebral peduncle is a separate level from the posterior limb and requires level-specific evidence. The sources cited here do not provide an effector-specific peduncular order. The Hodos scene has no brainstem or peduncular target, and its CST remains a population-average sample without body-part subdivisions. Do not extend a capsular account below its studied level.',
    'Keep the CST and gross subcortical meshes in an anterior view. Name the peduncle as a level that needs separate evidence and note that it is absent as a selectable structure in this scene.',
    ['The displayed bundles are population-averaged reconstructions.','The subcortical meshes are gross references without brainstem nuclei.','Cortical-origin comparisons of descending tracts do not supply a peduncular effector map.','A capsular somatotopy source cannot establish an ordering at another level.'],
    'A resident explanation should name the level and the evidence required to support a body-part claim. This display cannot provide an individual peduncular boundary or surgical margin.',
    'Can the shape of this CST sample carry a capsular body map down to the cerebral peduncle?',
    'No. The scene has no peduncular structure or effector labels, and the cited capsular evidence is specific to its own level and method. A peduncular order remains a separate evidence question.',
    ['D2','D3','M4','M5'],
    scene({side:'L',bundles:['CST'],deep:true,deepRegions:['THA','PUT'],regions:cortex(8,55),surface:.04,camera:{view:'anterior',tweenMs:650}}),
    {regions:['mbLevelMap','atlasProvenance'],evidenceClass:'reconstruction',targets:[bundle('CST','CST, corticospinal tract'),deep('THA','Thalamus'),deep('PUT','Putamen'),parcel(8,'4, primary motor reference'),parcel(55,'6mp, posterior medial premotor')]}
  ),
],{regionCards:['mbMedialSequence','mbInitiationConnections','mbLevelMap']});

export const LESSONS=[l];
export const GUIDES={'motor-beyond-m1':{
  shortTitle:'SMA, initiation and CST body maps',hemisphere:'L',
  question:'How would you connect medial frontal initiation with descending motor anatomy while keeping every body-map claim tied to its level and evidence?',
  takeaways:[
    {step:0,text:'Orient 6ma, 6mp and area 4 without assigning one exclusive action stage to each parcel.'},
    {step:1,text:'Separate the visible FAT family from the frontostriatal relationship that is not rendered as its own bundle.'},
    {step:6,text:'Do not extend a capsular somatotopy claim to the peduncle or an individual CST sample.'},
  ],
}};
