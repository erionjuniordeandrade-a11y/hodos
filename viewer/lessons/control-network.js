/** Frontoparietal control and the SLF II reference. Population anatomy and
 * task evidence stay distinct; the scene does not localise an individual.
 */
import {source,parcel,bundle,cortex,scene,step,lesson} from './resident-anatomy.js';

export const SOURCES={
  CN1:source('CN1','Vincent et al., 2008 · frontoparietal control system','18799601','functional_measurement','Intrinsic functional connectivity supports a distributed frontoparietal control system in the studied groups. It does not supply an individual task map or patient-specific boundary.'),
  CN2:source('CN2','Cole et al., 2013 · flexible hubs for adaptive task control','23892552','functional_measurement','Multi-task connectivity supports flexible frontoparietal hub participation across adaptive control demands. It does not assign one fixed operation to a parcel or tract.'),
  CN3:source('CN3','Niendam et al., 2012 · cognitive control network meta-analysis','22282036','functional_measurement','The meta-analysis relates a superordinate cognitive-control network to diverse executive functions. It does not localise an individual deficit or show that a brief bedside screen assessed every executive demand.'),
};

export const REGIONS={
  cnFpnPartition:Object.freeze({
    name:'Frontoparietal control network definitions',
    text:'Yeo-7 FPN is a population resting-state partition. Seeley’s lateral frontoparietal executive-control network comes from a separate connectivity analysis. Similar labels do not make the boundaries identical or identify an individual network.',
    sources:['N1','N11'],
    evidenceClass:'atlas',
  }),
  cnExecutiveEvidence:Object.freeze({
    name:'Executive control as task evidence',
    text:'Working memory, goal maintenance and adaptive control are studied through task and connectivity methods. Group findings can frame a question, but the atlas does not report an individual’s performance on those demands.',
    sources:['CN1','CN2','CN3','N13'],
    evidenceClass:'functional_measurement',
  }),
  cnSlf2Reference:Object.freeze({
    name:'SLF II population reference',
    text:'The HCP1065 bundle set is a population-averaged tractography reference. Its SLF I, SLF II and SLF III samples support a comparison of displayed courses, not individual endpoints or a direct connection between selected parcels.',
    sources:['D2'],
    evidenceClass:'atlas',
  }),
};

const controlScene=(extra={})=>scene({
  side:'L',surface:.16,camera:{view:'left',tweenMs:650},
  bundles:[],ghost:[],regions:[],deep:false,deepRegions:[],network:'off',...extra,
});

const l=lesson('control-network','The control network: SLF II and the frontoparietal system',15,
  'Relate frontoparietal control evidence to lateral prefrontal and parietal atlas references. Compare the SLF II population sample with neighbouring SLF families while keeping network, parcel and task evidence separate.',
  ['Distinguish the Yeo-7 FPN partition from study-specific executive-control systems.','Locate lateral prefrontal and parietal HCP-MMP1 reference parcels.','Compare SLF II with neighbouring SLF I and SLF III samples without inferring individual function or connectivity.'],[
  step('Start with the control demand',
    'Frontoparietal control is studied in relation to demands such as holding information, maintaining a goal and adapting to changing tasks. These demands come from cognitive-control research; this population scene can orient a network discussion but cannot measure a learner’s function.',
    'Show the FPN wash in the left lateral view. Select areas 46 and 9-46d, then compare the parietal references in the next step. Read the wash as a group network partition.',
    ['Intrinsic-connectivity research describes a distributed frontoparietal control system.','Multi-task connectivity studies examine flexible network participation during adaptive control.','A meta-analysis relates cognitive control to several executive functions; no single scene item measures them.'],
    'In a resident discussion, name the task demand and the observed performance separately from the atlas network label. The Hodos scene provides population orientation, not an individual functional result or a measure of surgical safety.',
    'If the FPN wash is visible, what does it establish about one learner’s executive performance?',
    'It establishes no individual performance result. The wash is a population reference, so the task and the learner’s response need their own evidence.',
    ['CN1','CN2','CN3','D1'],
    controlScene({network:'FPN',regions:cortex(84,86)}),
    {regions:['cnExecutiveEvidence'],evidenceClass:'functional_measurement',targets:[parcel(84,'46, middle frontal'),parcel(86,'9-46d, middle frontal')]}
  ),
  step('Separate the map from the system',
    'The installed Yeo-7 FPN is a group resting-state partition. Seeley’s lateral frontoparietal executive-control network comes from a separate connectivity analysis, so the labels do not define identical boundaries.',
    'Toggle the FPN wash on and off without changing the left lateral view. Compare the network colour with the cortical parcel pointers, and keep the study definitions beside the display.',
    ['Yeo et al. supplied the seven-network cortical partition used here.','Seeley et al. distinguished a lateral frontoparietal control network from a frontoinsular and dorsal-cingulate network.','The two studies describe different network definitions; neither wash is an individual task activation map.'],
    'Keep each network name attached to its study definition when discussing executive function. A coloured group partition is not an individual functional localiser.',
    'Does the FPN label show that the highlighted parcels are this learner’s executive-control nodes?',
    'No. It shows the group partition used by the atlas. It does not establish an individual’s task-defined network boundaries or performance.',
    ['N1','N11'],
    controlScene({network:'FPN',regions:cortex(84,86,95,17)}),
    {regions:['cnFpnPartition'],evidenceClass:'atlas',targets:[parcel(84,'46, middle frontal'),parcel(86,'9-46d, middle frontal'),parcel(95,'LIPd, lateral intraparietal'),parcel(17,'IPS1, intraparietal sulcus')]}
  ),
  step('Locate lateral prefrontal references',
    'Use HCP-MMP1 areas 46 and 9-46d as lateral prefrontal references in a frontoparietal control discussion. The parcel labels identify population cortical subdivisions; they do not localise a particular executive task in one person.',
    'Select 46 and 9-46d in turn. Rotate slightly superiorly to see their position relative to the lateral surface, then restore the FPN wash to compare the two atlas layers.',
    ['Area 46 and area 9-46d are separate HCP-MMP1 parcel labels.','HCP-MMP1 parcels are population references, not whole gyri or individual functional localisers.','Connectivity studies describe a distributed control system rather than assigning every task to one parcel.'],
    'Name the atlas parcel and the task evidence as separate parts of the explanation. Do not turn a highlighted parcel into a functional boundary.',
    'If area 46 is highlighted, does that identify the tissue that held a plan during a task?',
    'No. The highlight identifies an atlas parcel. Task performance and its relationship to that parcel require separate evidence.',
    ['M1','CN1','CN2'],
    controlScene({network:'FPN',regions:cortex(84,86)}),
    {regions:['cnFpnPartition'],evidenceClass:'atlas',targets:[parcel(84,'46, middle frontal'),parcel(86,'9-46d, middle frontal')]}
  ),
  step('Find the parietal control territory',
    'Use LIPd and IPS1 as population atlas pointers for lateral parietal and intraparietal territory. Frontoparietal control studies describe distributed systems, while these parcel outlines retain their anatomical atlas definition.',
    'Select LIPd and IPS1 separately, then compare them with areas 46 and 9-46d from the same lateral view. Use the FPN wash only as a group-level reference.',
    ['LIPd and IPS1 are distinct HCP-MMP1 parcel labels.','A parcel outline does not define a complete task-responsive region.','Executive-control findings span multiple task and connectivity methods.'],
    'Report the cognitive demand and the measured response alongside the anatomical pointer. A parcel label alone does not say whether control performance was preserved.',
    'What does the IPS1 outline alone tell you about performance on an executive task?',
    'It identifies a population atlas parcel. It does not report the learner’s task performance or establish that IPS1 was active for that task.',
    ['M1','CN1','CN3','N1'],
    controlScene({network:'FPN',regions:cortex(95,17)}),
    {regions:['cnFpnPartition','cnExecutiveEvidence'],evidenceClass:'atlas',targets:[parcel(95,'LIPd, lateral intraparietal'),parcel(17,'IPS1, intraparietal sulcus')]}
  ),
  step('Follow the lateral white-matter sample',
    'The lateral route in this lesson is the SLF II sample, with SLF I and SLF III shown as neighbouring bundle families. Hodos uses HCP1065 population-averaged tractography, so this scene compares reference courses rather than an individual’s endpoints or connectivity.',
    'Display SLF II with SLF I and SLF III dimmed. Rotate between lateral and superior views, then compare the tract samples with the FPN wash and the frontal and parietal parcel pointers.',
    ['HCP1065 provides population-averaged tractography geometry.','The viewer presents SLF I, SLF II and SLF III as separate sampled bundle families.','The FPN wash and tract samples come from different atlas methods.','Their overlap on screen does not establish a direct connection between the highlighted parcels.'],
    'Describe SLF II as the displayed population reference and keep a proposed disconnection as a question for individual evidence. The atlas does not supply an individual tract endpoint or a surgical boundary.',
    'Does overlap between the FPN wash and the SLF II sample prove a direct connection between the highlighted parcels?',
    'No. The wash and tract sample represent different population methods. Their spatial overlap does not establish individual endpoints or a direct connection.',
    ['D2','N1'],
    controlScene({network:'FPN',bundles:['SLF2'],ghost:['SLF1','SLF3'],regions:cortex(84,95),surface:.12}),
    {regions:['cnFpnPartition','cnSlf2Reference'],evidenceClass:'reconstruction',targets:[bundle('SLF2','SLF II, superior longitudinal fasciculus'),bundle('SLF1','SLF I, superior longitudinal fasciculus'),bundle('SLF3','SLF III, superior longitudinal fasciculus'),parcel(84,'46, middle frontal'),parcel(95,'LIPd, lateral intraparietal')]}
  ),
  step('Read flexibility as a task finding',
    'Cole et al. examined frontoparietal connectivity across multiple tasks and related flexible hubs to adaptive control. Niendam et al. reviewed cognitive control across diverse executive functions, which argues against assigning one permanent operation to one highlighted parcel.',
    'Keep the FPN wash on, then toggle it off while the 46, 9-46d, LIPd and IPS1 pointers remain. Describe the task demand before reopening the network view.',
    ['Cole et al. studied task-dependent connectivity in relation to adaptive control.','Niendam et al. synthesised evidence across several executive functions.','A functional network account and a cortical parcel map describe different evidence.'],
    'For resident education, describe the operation being tested before proposing a network account. The group-level scene cannot assign a fixed role or outcome to one parcel.',
    'Does a stable parcel outline guarantee a fixed executive role across tasks?',
    'No. The cited work relates frontoparietal connectivity to changing task demands. The outline remains an anatomical reference, not a task-by-task measure.',
    ['CN2','CN3','N13','M1'],
    controlScene({network:'FPN',regions:cortex(84,86,95,17)}),
    {regions:['cnExecutiveEvidence'],evidenceClass:'functional_measurement',targets:[parcel(84,'46, middle frontal'),parcel(86,'9-46d, middle frontal'),parcel(95,'LIPd, lateral intraparietal'),parcel(17,'IPS1, intraparietal sulcus')]}
  ),
  step('Ask what a bedside screen leaves open',
    'Strength and naming observations describe motor and language performance, while executive-control studies examine demands such as working memory, goal maintenance and adapting to a task. A brief screen does not state whether each of those demands was assessed.',
    'Turn the FPN wash off and name one task demand the scene cannot measure. Then state what behavioural observation would be needed to discuss that demand without treating the atlas as a functional test.',
    ['Executive-control research covers more than one cognitive operation.','Motor strength and naming are different observations from working-memory or adaptive-control performance.','The atlas contains no individual task measurement.'],
    'In a resident presentation, keep motor, language and executive observations distinct. The atlas can orient anatomy but cannot establish intact or impaired executive control for an individual.',
    'If strength and naming are reported as preserved, has executive control been established?',
    'No. Those observations do not show whether working memory, goal maintenance or adaptive control was examined. The atlas cannot fill in individual behavioural evidence.',
    ['CN2','CN3','D1','N1'],
    controlScene({network:'off',regions:cortex(84,95)}),
    {regions:['cnExecutiveEvidence'],evidenceClass:'functional_measurement',targets:[parcel(84,'46, middle frontal'),parcel(95,'LIPd, lateral intraparietal')]}
  ),
],{regionCards:['cnFpnPartition']});

export const LESSONS=[l];
export const GUIDES={
  'control-network':{shortTitle:'Control network & SLF II',hemisphere:'L',question:'When basic strength and naming are preserved, what task evidence is still needed to assess executive control?',takeaways:[{step:0,text:'Name the task demand and the evidence used to assess it.'},{step:4,text:'Keep the FPN wash, parcel pointers and SLF II sample distinct.'},{step:6,text:'Describe executive behaviour separately from strength and naming observations.'}]},
};
