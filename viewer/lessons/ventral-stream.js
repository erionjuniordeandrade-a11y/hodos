/** Ventral stream and temporal stem. Original educational draft using the
 * verified source set for this module. Scene names reference anatomy; they do
 * not supply individual functional localisation or operative limits.
 */
import {source,parcel,deep,bundle,cortex,scene,step,lesson} from './resident-anatomy.js';

export const VENTRAL_SOURCES={
  V2:source('V2','Martino J, et al., 2010, Anatomic dissection of the inferior fronto-occipital fasciculus revisited in the lights of brain stimulation data.','19775684','experimental_anatomy','Fibre dissection reappraisal of the IFOF trajectory through the temporal stem, discussed alongside semantic stimulation findings. It does not establish an individual tract boundary.'),
  V4:source('V4','Peuskens D, et al., 2004, Anatomy of the anterior temporal lobe and the frontotemporal region demonstrated by fiber dissection.','15509324','experimental_anatomy','Fibre dissection description of the temporal stem as a white matter corridor linking the temporal lobe with the insula and basal ganglia region.'),
  V6:source('V6','Catani M, et al., 2003, Occipito-temporal connections in the human brain.','12821517','reconstruction','Diffusion MRI virtual dissection of the ILF as a discrete occipito-temporal association pathway. It is a reconstruction, not physical fibre dissection or an individual functional map.'),
  V7:source('V7','Wen HT, et al., 1999, Microsurgical anatomy of the temporal lobe: part 1: mesial temporal lobe anatomy and its vascular relationships as applied to amygdalohippocampectomy.','10493377','experimental_anatomy','Mesial temporal and vascular relationships that provide anatomical context for the temporal stem, amygdala, hippocampus and anterior choroidal territory. No individual vessels, perforators or relevant deep vascular territory are rendered in this atlas.'),
};

const ventralScene=(extra={})=>({side:'L',surface:.12,camera:{view:'left',tweenMs:650},...extra});
const ventral=lesson('ventral-stream','Ventral stream & the temporal stem',14,
  'Orient the uncinate fasciculus, compare neighbouring ventral pathways and read the temporal stem as a corridor linking anterior temporal, insular and mesial temporal anatomy.',
  ['Locate the left UF between anterior temporal and orbitofrontal references.','Compare UF, IFOF and ILF without collapsing their distinct courses.','Name the temporal stem relationships and distinguish anatomical evidence from semantic stimulation evidence.'],[
  step('Start at the limen insulae',
    'The uncinate fasciculus, or UF, hooks through the limen insulae between the anterior temporal pole and orbitofrontal cortex. In this left lateral scene, TGv and OFC are orientation parcels while low surface opacity keeps the curved association pathway visible beneath the cortex.',
    'Select TGv and OFC in turn, then follow the UF from the temporal pole towards orbitofrontal cortex. Say where the limen insulae would sit in the anterior Sylvian region, even though it is not a separate mesh in this atlas.',
    ['UF is an association pathway with an anterior temporal to frontal relationship.','The limen insulae is an anatomical landmark at the transition between temporal, frontal and insular regions; it is not an installed parcel or individual vessel.','TGv and OFC are HCP reference pointers, not individual language or memory localisers.','K8 provides general population-atlas context, while D2 identifies the installed HCP1065 bundle reference used by this viewer.'],
    'For a resident presentation, name the left side, anterior temporal pole, orbitofrontal reference and the intervening temporal stem relationship. The atlas supplies a population course for orientation, not an individual tissue boundary, vessel relationship or functional map.',
    'A resident calls every temporal streamline semantic. What two observations should you request before accepting that label for the UF?',
    'First establish the UF course between anterior temporal and orbitofrontal regions through the limen insulae. Then ask for a task-specific observation and evidence method before making a functional claim. The displayed course is a reference reconstruction, not an individual functional localiser.',
    ['K3','R3','K8','D2'],
    ventralScene({bundles:['UF'],regions:cortex(172,93)}),
    {regions:['ventralStream'],evidenceClass:'experimental_anatomy',targets:[parcel(172,'TGv, anterior temporal'),parcel(93,'OFC, orbitofrontal'),bundle('UF','UF, Uncinate fasciculus')]}
  ),
  step('Compare three ventral courses',
    'Compare the UF with the inferior fronto-occipital fasciculus, or IFOF, and the inferior longitudinal fasciculus, or ILF. In this teaching view, IFOF passes through the temporal stem and subinsular capsular region, UF curves anteriorly, and ILF runs along the temporal lobe towards occipital cortex. Martino described IFOF relationships that also include parietal and posterior temporobasal regions, so its name does not restrict the sampled family to an exclusive frontal to occipital endpoint pair.',
    'Show IFOF, UF and ILF together, with the extreme-capsule sample dimmed as context. Follow each path from two angles and state which one has an anterior temporal to orbitofrontal hook, which one has the longer fronto-occipital and temporobasal course, and which one is occipito-temporal.',
    ['IFOF, UF and ILF are distinct association pathways, even where their rendered courses overlap.','The temporal stem and subinsular capsular region are three-dimensional relationships, so a single lateral crossing does not establish shared fibres.','The displayed EMC comparison is the extreme-capsule family; it does not render the thin capsule layers or an IFOF subcomponent.','K8 supplies general population-atlas context, while D2 identifies the installed bundle geometry.'],
    'A resident should report the pathway family and anatomical level rather than calling every temporal line a semantic tract. Compare the course in more than one plane and preserve uncertainty where the render cannot show the thin capsule or the individual dissection layer.',
    'A lateral image makes EMC and IFOF look co-located. What should a resident say before treating them as the same pathway or layer?',
    'The resident should name EMC as the extreme-capsule comparison, name IFOF separately, and inspect the courses from another view. Visual overlap does not establish shared fibres or collapse the subinsular capsular relationships into one layer. Course and functional interpretation must remain separate.',
    ['V2','K3','V6','K8','D2'],
    ventralScene({bundles:['IFOF','UF','ILF'],ghost:['EMC'],regions:cortex(172),surface:.1}),
    {regions:['ventralStream'],evidenceClass:'experimental_anatomy',targets:[bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),bundle('UF','UF, Uncinate fasciculus'),bundle('ILF','ILF, Inferior longitudinal fasciculus'),bundle('EMC','EMC, Extreme capsule')]}
  ),
  step('Read the temporal stem as a corridor',
    'At the level used here, the temporal stem is the white matter bridge beneath the inferior limiting insular sulcus, above and lateral to the temporal horn, and continuous with central-core and subinsular white matter. The amygdala and hippocampus are regional medial temporal references. The anterior and inferior sweep called Meyer’s loop lies in this temporal stem relationship, while the displayed OR sample extends beyond that sweep.',
    'Use the medial camera to inspect the temporal relationship, keeping OR bright and UF and IFOF dimmed. Identify the left amygdala and hippocampus as gross medial references, then use an anterior projection as a second orientation rather than treating either view as a coronal section.',
    ['The temporal stem is a level-specific white matter bridge, not a separate installed mesh with one universal boundary.','AMY and HIP are coarse deep structures, so their outlines do not segment every mesial temporal nucleus or subfield.','Meyer’s loop is the anterior and inferior sweep of the optic radiation relevant to the temporal stem; the whole OR sample is not that loop alone.','The temporal horn, inferior limiting sulcus, thin capsule layers and individual vascular structures are not separately rendered.'],
    'When discussing an anterior temporal relationship, include the temporal stem and its neighbouring pathways before describing a cognitive or visual finding. Use the scene to orient the corridor and the cited dissections to qualify what the atlas cannot show.',
    'A report defines the temporal stem as any tissue between temporal lobe and insula. Which level markers should a resident ask for before accepting that definition?',
    'Ask for the inferior limiting insular sulcus, the temporal horn relationship and continuity with central-core and subinsular white matter. Meyer’s loop is the relevant anterior and inferior optic-radiation sweep in that relationship. The scene does not supply a sectional boundary for any of those structures.',
    ['V4','R3','V7','D2'],
    ventralScene({bundles:['OR'],ghost:['UF','IFOF'],regions:cortex(172),surface:.08,camera:{view:'medial',tweenMs:650},deep:true,deepRegions:['AMY','HIP']}),
    {regions:['temporalStem'],evidenceClass:'experimental_anatomy',targets:[bundle('OR','OR, Optic radiation'),bundle('UF','UF, Uncinate fasciculus'),deep('AMY','Amygdala'),deep('HIP','Hippocampus')]}
  ),
  step('Treat semantic paraphasia as evidence',
    'The Duffau study used cortico-subcortical stimulation and reported semantic paraphasias along a ventral pathway, supporting an IFOF-based semantic hypothesis. That is functional evidence under defined study conditions, not a generic label for every temporal streamline and not a procedural instruction.',
    'Keep IFOF visible beside STSdp and OFC orientation references. Before opening the answer, describe semantic paraphasia as a meaning-related substitution and distinguish the paper’s stimulation observation from the static atlas reconstruction. These parcels are contextual landmarks, not registered stimulation coordinates in this scene.',
    ['A semantic paraphasia is more specific than an undifferentiated failure to speak.','Stimulation evidence links a task-specific error to a tested site and method; it does not turn the atlas IFOF into an individual functional map.','Martino’s dissection reappraisal provides anatomical context for relating stimulation findings to the IFOF trajectory.','STSdp and OFC orient the discussion here; their highlighting does not reproduce the study’s experimental registration.'],
    'For a resident discussion, state the error type, task, side, reproducibility and evidence level. The stimulation finding can support a ventral semantic pathway hypothesis, but it is not a patient-specific prediction, a universal IFOF definition or a procedural rule.',
    'What does semantic paraphasia during stimulation support, and what does this scene leave unresolved?',
    'It supports a task-specific ventral semantic pathway hypothesis that partly corresponds to IFOF in the cited evidence. It does not prove that every displayed IFOF line is language-critical or that an individual has the same organisation. The method, task and individual anatomy remain essential.',
    ['N6','V2','D2'],
    ventralScene({bundles:['IFOF'],ghost:['UF'],regions:cortex(129,93),surface:.12}),
    {regions:['semanticEvidence'],evidenceClass:'functional_measurement',targets:[bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),parcel(129,'STSdp, posterior superior temporal'),parcel(93,'OFC, orbitofrontal')]}
  ),
  step('Read the anterior projection critically',
    'A coronal reference image would add section-specific information, but this lesson supplies an anterior 3D projection. It shows UF and IFOF as pathway references and AMY as a gross deep reference. Wen’s mesial temporal account adds the anterior choroidal artery relationship to the uncus and adjacent mesial temporal structures, not a vascular territory painted into this viewer.',
    'Use the anterior camera and compare UF with IFOF around the left anterior temporal region. Identify AMY, then say which named structure is a corridor rather than a bundle and which vascular relationship must be brought from the literature because no individual vessel or relevant deep vascular territory is rendered.',
    ['UF is the anterior temporal to orbitofrontal hook; IFOF is the longer ventral fronto-occipital and temporobasal relationship.','The temporal stem is the level-specific white matter bridge, not a fifth bundle button or a sectional mesh in this projection.','AMY is a gross medial temporal reference in the scene.','The anterior choroidal artery relationship to the uncus and adjacent mesial temporal structures is vascular anatomy from the mesial temporal literature; it cannot be inferred as a painted territory from bundle proximity.'],
    'A useful anterior account names the visible pathway and deep-grey references, then states which sectional and vascular relationships remain external to the render. This keeps the resident’s anatomical vocabulary precise without treating a projection as a coronal dissection.',
    'From this anterior projection, which relationships can you name directly, and which two require external anatomical evidence?',
    'The projection directly supports naming UF, IFOF and the gross AMY reference. The exact temporal-stem boundary and the anterior choroidal vascular relationship require sectional or vascular anatomical evidence that this scene does not render. The anterior camera is not itself a coronal slice.',
    ['V4','R3','V7','D2'],
    ventralScene({bundles:['UF','IFOF'],ghost:['OR'],regions:cortex(172,93),surface:.06,camera:{view:'anterior',tweenMs:650},deep:true,deepRegions:['AMY']}),
    {regions:['anteriorTemporal'],evidenceClass:'experimental_anatomy',targets:[bundle('UF','UF, Uncinate fasciculus'),bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),deep('AMY','Amygdala'),parcel(172,'TGv, anterior temporal')]}
  ),
  step('Contrast phonological and semantic deficits',
    'Use the existing language-networks lesson as the comparison point. A phonological deficit raises a dorsal pathway question centred on AF, whereas a reproducible semantic substitution raises a ventral pathway question centred on IFOF. The distinction is a hypothesis about task and pathway family, not a tract diagnosis.',
    'Show AF and IFOF together with UF as context. Imagine two residents reporting the same patient: one describes phonological errors during repetition, the other describes meaning substitutions with speech still produced. Ask which report carries the more specific dorsal or ventral question.',
    ['N5 relates repetition and comprehension tasks to different dorsal and ventral pathway hypotheses; it does not make either symptom a tract diagnosis.','AF is the dorsal comparison used in the coursebook’s language pathway teaching; IFOF is the ventral comparison developed here from the stimulation and dissection evidence.','Phonological and semantic errors are different observations and should not be collapsed into speech difficulty.','D2 identifies the installed bundle geometry, while K8 is retained only for the general population-atlas idea.'],
    'For a resident presentation, lead with the observed error and task, then name the pathway family being investigated. This keeps the new temporal stem relationship connected to the language lesson without treating a population bundle or one symptom as an individual map.',
    'Which pathway family does each pattern implicate as a first hypothesis: phonological errors during repetition, or semantic substitutions with speech still produced?',
    'Phonological errors during repetition implicate a dorsal AF question, while semantic substitutions with speech still produced implicate a ventral IFOF question. These are contrasting hypotheses, not proof of injury to either fascicle. The task conditions and individual anatomy determine how strongly either interpretation is supported.',
    ['N5','N6','K3','K8','D2'],
    ventralScene({bundles:['AF','IFOF'],ghost:['UF'],regions:cortex(75,129),surface:.12}),
    {regions:['ventralStream','semanticEvidence'],evidenceClass:'schematic',targets:[bundle('AF','AF, Arcuate fasciculus'),bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),parcel(75,'45, inferior frontal'),parcel(129,'STSdp, posterior superior temporal')]}
  ),
],{regionCards:['ventralStream']});

export const VENTRAL_LESSONS=[ventral];
