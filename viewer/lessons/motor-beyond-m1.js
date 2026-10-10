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
  mbLevelMap:{name:'A body-map claim belongs to a level and method',text:'The corona radiata, posterior limb and cerebral peduncle are separate levels in the lecture comparison. The supplied sources support population CST reconstructions and a method-specific capsular discussion, but do not support the detailed corona-radiata or peduncular effector order in this lesson.',sources:['D2','M4','M5','R8','D3'],evidenceClass:'reconstruction'},
};

const l=lesson('motor-beyond-m1','Motor beyond M1: SMA, initiation and the CST body map',16,
  'Relate medial frontal organisation to initiation, then audit what the available evidence can say about a CST body map at each named level.',
  ['Orient pre-SMA, SMA proper and M1 without treating parcel borders as exclusive functional stages.','Distinguish the visible FAT sample from the frontostriatal relationship in an initiation account.','Keep CST somatotopy claims attached to their anatomical level and evidence method.'],[
  step('Orient the medial sequence without making a pipeline',
    'The lecture moves from pre-SMA through SMA proper to M1 using 6ma, 6mp and area 4 as anterior-to-posterior references. Ruan’s cytoarchitectonic probability maps and the HCP parcel outlines are different reference systems. Functional reviews distinguish contributions across these regions without making each parcel an exclusive choose, start or execute stage.',
    'Select 6ma, 6mp and area 4 in turn on the medial surface, then state their anterior-to-posterior order before adding a functional description.',
    ['6ma, 6mp and area 4 are distinct population parcel references.','Ruan describes cytoarchitectonic probability maps for pre-SMA and SMA.','Functional accounts distinguish medial motor contributions while allowing interaction.','A parcel outline does not locate an individual functional border.'],
    'For resident teaching, name the reference territory and the action question separately. The displayed parcels are orientation aids, not individual functional or surgical boundaries.',
    'Why is it incomplete to label 6ma, 6mp and area 4 as three exclusive action stages?',
    'The sequence is a useful spatial orientation, but the functional accounts describe interacting contributions rather than one fixed operation per parcel. The atlas shows population reference boundaries, not an individual functional transition.',
    ['M1','MB1','MB3'],
    scene({side:'L',regions:cortex(44,55,8),surface:.9,camera:{view:'medial',tweenMs:650}}),
    {regions:['mbMedialSequence'],evidenceClass:'conceptual_model',targets:[parcel(44,'6ma, anterior medial premotor'),parcel(55,'6mp, posterior medial premotor'),parcel(8,'4, primary motor reference')]}
  ),
  step('Separate FAT from the frontostriatal relationship',
    'Axonal mapping examined frontal aslant and frontostriatal pathways in movement and speech, extending an initiation discussion beyond descending motor output. FAT is the selectable frontal association family in this scene; a distinct SMA/pre-SMA-to-striatum bundle is not installed. Caudate and putamen are gross references, not displayed endpoints of that route.',
    'Show FAT with caudate and putamen, then dim CST. Point out which pathway can be followed as a bundle and which relationship must be supplied by the cited study.',
    ['The cited axonal mapping distinguishes FAT from frontostriatal anatomy.','R9 describes frontal aslant connections involving medial and inferior frontal territories.','The scene contains no separate frontostriatal bundle sample.','Gross striatal meshes do not prove a connection to a selected cortical parcel.'],
    'In an initiation discussion, separate a visible population pathway from an anatomical relationship described by a study. Neither one alone localises initiation function in an individual.',
    'Which initiation-related relationship can you trace here as its own bundle?',
    'FAT is selectable. The frontostriatal relationship is described by axonal mapping but has no separate installed bundle in this scene; the gross striatal meshes do not fill that gap.',
    ['MB2','R9','D2','D3'],
    scene({side:'L',bundles:['FAT'],ghost:['CST'],regions:cortex(44,55),deep:true,deepRegions:['CAU','PUT'],surface:.13,camera:{view:'left',tweenMs:650}}),
    {regions:['mbInitiationConnections'],evidenceClass:'experimental_anatomy',targets:[bundle('FAT','FAT, frontal aslant tract'),bundle('CST','CST, corticospinal tract'),parcel(44,'6ma, anterior medial premotor'),parcel(55,'6mp, posterior medial premotor'),deep('CAU','Caudate nucleus'),deep('PUT','Putamen')]}
  ),
  step('Keep connectional anatomy separate from recovery',
    'Human anatomical work describes a wider set of SMA white-matter connections, while the lecture names callosal, frontal-association and descending relationships. CC, FAT and CST are population reference families here, not proof that every displayed line has a measured SMA endpoint. The SMA surgical series reports group motor-deficit and recovery patterns; it does not establish opposite-SMA recruitment as their cause.',
    'Show CC and FAT with CST dimmed, then add CST. Name the broad pathway relationship each family illustrates and identify which recovery mechanism is not measured by the display.',
    ['Vergani studies SMA white-matter connections.','CC, FAT and CST represent different broad pathway families.','The displayed population bundles do not identify every cortical endpoint.','The cited surgical series reports associations, not a causal recovery mechanism.'],
    'Use SMA syndrome as educational context for separating initiation and motor-output questions. Do not infer compensation or a personal recovery course from the callosal display.',
    'Does a visible callosal family show that the opposite SMA caused recovery in the surgical series?',
    'No. The family gives anatomical context for a possible interhemispheric relationship, while the series reports a group recovery pattern. The image does not measure recruitment or prove that mechanism.',
    ['MB4','M9','D2','R9','M4'],
    scene({side:'L',bundles:['CC','FAT'],ghost:['CST'],regions:cortex(44,55),surface:.1,camera:{view:'medial',tweenMs:650}}),
    {regions:['mbMedialSequence','mbInitiationConnections'],evidenceClass:'association',targets:[bundle('CC','CC, corpus callosum'),bundle('FAT','FAT, frontal aslant tract'),bundle('CST','CST, corticospinal tract'),parcel(55,'6mp, posterior medial premotor')]}
  ),
  step('Ask what SMA somatotopy adds to the parcel sequence',
    'The medial-wall review discusses functional activation and somatotopic organisation within supplementary motor territory. That is a different question from distinguishing pre-SMA, SMA and M1 along the cortical surface. This scene highlights 6mp as an atlas reference but does not subdivide it into face, arm or leg fields.',
    'Compare 6mp with area 4 from medial and superior views. Describe the selected territories, then name the effector measurement that would be needed before adding a body-part label.',
    ['Somatotopy within SMA is distinct from the pre-SMA/SMA regional distinction.','Picard and Strick review medial-wall functional activation and organisation.','The selected 6mp parcel carries no installed effector labels.','A group functional observation would still need to be distinguished from individual localisation.'],
    'A resident can discuss SMA body representation without painting unsupported face, arm or leg borders onto this population atlas.',
    'Does selecting a point in 6mp tell you which body part it represents?',
    'No. It identifies a point in a population parcel, while the body-part measurement comes from separate functional evidence and is not installed in this scene.',
    ['MB5','M1'],
    scene({side:'L',regions:cortex(55,8),surface:.86,camera:{view:'medial',tweenMs:650}}),
    {regions:['mbMedialSequence'],evidenceClass:'conceptual_model',targets:[parcel(55,'6mp, SMA territory reference'),parcel(8,'4, primary motor reference')]}
  ),
  step('At the corona radiata, audit the body-map evidence',
    'The corona radiata is one named level in the lecture’s somatotopy comparison. The permitted source scopes describe population CST reconstructions and descending contributions by cortical origin, but do not provide an effector-labelled corona-radiata order. The selected Hodos bundle therefore cannot tell you where face, hand or leg fibres lie at this level.',
    'Show the CST reference from a superior view and ask which part of the displayed data carries a face, hand or leg label; keep the answer tied to what is actually installed.',
    ['D2 identifies the displayed CST as a population-averaged reconstruction.','M4 compares descending contributions by cortical origin.','Neither source assigns the displayed corona-radiata lines to individual effectors.','The scene has no installed face, hand or leg subdivisions.'],
    'Teach the level and the evidence method before proposing an effector order. Here the useful conclusion is the limit of the sample, not a reconstructed individual body map.',
    'Can cortical-origin comparisons in M4 be converted into a face-to-leg order in this corona-radiata sample?',
    'No. M4 compares tractography contributions by cortical origin, while the displayed bundle has no effector labels. A body-part ordering at this level needs level-specific evidence beyond this scene.',
    ['D2','M4'],
    scene({side:'L',bundles:['CST'],regions:cortex(8),surface:.08,camera:{view:'superior',tweenMs:650}}),
    {regions:['mbLevelMap'],evidenceClass:'reconstruction',targets:[bundle('CST','CST, corticospinal tract'),parcel(8,'4, primary motor reference')]}
  ),
  step('At the posterior limb, attach the map to its method',
    'The posterior limb is the level for which this source set includes a paper specifically on CST somatotopy: an early DTI account by Holodny and colleagues. Its source scope notes that the account was published against prior reports, so it supports a method-specific comparison rather than a settled universal ordering. Restricted capsular lesion evidence is a different kind of observation and does not turn the atlas sample into an individual map.',
    'Show CST beside the gross thalamic and lentiform references. Compare the DTI and lesion-localisation source types, then state which of those methods is represented by the displayed bundle.',
    ['M5 is an early DTI tractography account of capsular organisation.','R8 is a restricted-lesion study of capsular motor localisation.','The scene displays population tractography, not a lesion map.','Neither group source labels this individual scene with hand, leg or face fibres.'],
    'When discussing capsular somatotopy, keep the level and method attached to the claim. Do not carry a group ordering into an individual capsule from this reference image.',
    'Which body-part order should you draw for an individual capsule from this display?',
    'None can be read from the display. M5 and R8 provide different group-level evidence, while the population CST has no effector subdivisions or individual registration.',
    ['M5','R8','D2','D3'],
    scene({side:'L',bundles:['CST'],deep:true,deepRegions:['THA','PUT','GP'],regions:cortex(8),surface:.06,camera:{view:'anterior',tweenMs:650}}),
    {regions:['mbLevelMap'],evidenceClass:'reconstruction',targets:[bundle('CST','CST, corticospinal tract'),deep('THA','Thalamus'),deep('PUT','Putamen'),deep('GP','Globus pallidus'),parcel(8,'4, primary motor reference')]}
  ),
  step('At the peduncle, leave the body-part order unresolved',
    'The cerebral peduncle is the third level in the lecture comparison, but the permitted sources do not provide an effector-specific peduncular order. The Hodos scene has no brainstem or peduncular target, and its CST remains a population-average sample without body-part subdivisions. Do not extend a capsular account below its studied level.',
    'Keep the CST and gross subcortical meshes in an anterior view. Name the peduncle as a level that needs separate evidence and note that it is absent as a selectable structure in this scene.',
    ['D2 describes the displayed bundles as population-averaged reconstructions.','D3 documents gross subcortical meshes without brainstem nuclei.','M4 compares descending contributions by cortical origin, not a peduncular effector map.','A capsular somatotopy source cannot establish an ordering at another level.'],
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
