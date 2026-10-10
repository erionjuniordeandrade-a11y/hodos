import {source,parcel,bundle,cortex,scene,step,lesson} from './resident-anatomy.js';

export const SOURCES={
  CN1:source('CN1','Vincent et al., 2008 · frontoparietal control system','18799601','functional_measurement','Intrinsic functional connectivity supports a distributed frontoparietal control system in the studied groups. It does not supply an individual task map or patient-specific boundary.'),
  CN2:source('CN2','Cole et al., 2013 · flexible hubs for adaptive task control','23892552','functional_measurement','Multi-task connectivity supports flexible frontoparietal hub participation across adaptive control demands. It does not assign one fixed operation to a parcel or tract.'),
  CN3:source('CN3','Niendam et al., 2012 · cognitive control network meta-analysis','22282036','functional_measurement','The meta-analysis relates a superordinate cognitive-control network to diverse executive functions. It does not localise an individual deficit or establish whether a particular assessment covered every executive demand.'),
  CN4:source('CN4','Parlatini et al., 2017 · Functional segregation and integration within fronto-parietal networks','27639357','association','SLF tractography in 129 participants combined with 14 fMRI meta-analyses associated a dorsal spatial/motor network with SLF I and a ventral non-spatial/motor network with SLF III; all investigated functions activated a middle network mostly associated with SLF II. These group associations do not establish an exclusive connection for the Yeo-7 FPN.'),
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
    'Frontoparietal control is studied in relation to demands such as holding information, maintaining a goal and adapting to changing tasks. These demands come from cognitive-control research; this population scene can orient a network discussion but cannot measure a person’s function.',
    'Show the FPN wash in the left lateral view. Select areas 46 and 9-46d, then compare them with IP2 and IP1. Read the wash as a group network partition.',
    ['Intrinsic-connectivity research describes a distributed frontoparietal control system.','Multi-task connectivity studies examine flexible network participation during adaptive control.','A meta-analysis relates cognitive control to several executive functions; no single scene item measures them.','Middle-frontal areas 46 and 9-46d lie anterior to intraparietal parcels IP2 and IP1 on the lateral surface.'],
    'In a resident discussion, name the task demand and the observed performance separately from the atlas network label. The Hodos scene provides population orientation, not an individual functional result or a measure of surgical safety.',
    'In the left lateral view, how do middle-frontal 46 and 9-46d relate spatially to intraparietal IP2 and IP1?',
    'Areas 46 and 9-46d occupy lateral middle-frontal territory anterior to the intraparietal IP2 and IP1 references. The FPN wash is a population partition, so this spatial arrangement does not establish an individual executive map.',
    ['CN1','CN2','CN3','D1','M1','N1'],
    controlScene({network:'FPN',regions:cortex(84,86,144,145)}),
    {regions:['cnExecutiveEvidence'],evidenceClass:'functional_measurement',targets:[parcel(84,'46, middle frontal'),parcel(86,'9-46d, middle frontal'),parcel(144,'IP2, intraparietal'),parcel(145,'IP1, intraparietal')]}
  ),
  step('Compare control demands',
    'Compare the control demands of keeping a rule available and adjusting behaviour when that rule changes. Keep each interpretation attached to the defining experiment.',
    'Select 46, 9-46d, IP2 and IP1 as anatomical references. Compare a task that keeps a rule available with one that requires adjustment when it changes; do not infer task activation from the parcel highlights.',
    ['Keeping a rule available and adjusting behaviour when it changes are different control demands.','Cole et al. examined flexible network participation during adaptive control.','Dosenbach et al. distinguished adaptive frontoparietal control from more sustained cingulo-opercular task-set activity.'],
    'For resident education, describe the control demand and defining experiment before proposing a network account. Highlighted parcels remain anatomical references rather than task-specific functional localisers.',
    'Which change in task demand separates keeping a rule available from adjusting behaviour when that rule changes?',
    'The first demand maintains a current task rule, whereas the second requires adaptation after that rule changes. Each interpretation needs the experiment that defined it; a parcel highlight alone does not supply that evidence.',
    ['CN2','N13'],
    controlScene({network:'off',regions:cortex(84,86,144,145)}),
    {regions:['cnExecutiveEvidence'],evidenceClass:'functional_measurement',targets:[parcel(84,'46, middle frontal'),parcel(86,'9-46d, middle frontal'),parcel(144,'IP2, intraparietal'),parcel(145,'IP1, intraparietal')]}
  ),
  step('Locate lateral prefrontal references',
    'Compare middle-frontal references 46 and 9-46d with IFSp and IFSa along the inferior frontal sulcus. These parcel labels identify population cortical subdivisions and do not localise a particular executive task in one person.',
    'Select 46 and 9-46d, then IFSp and IFSa. Rotate slightly superiorly to see their relationship along the inferior frontal sulcus, then restore the FPN wash to compare the two atlas layers.',
    ['Areas 46 and 9-46d are middle-frontal HCP-MMP1 parcel labels.','IFSp and IFSa are HCP-MMP1 parcels along the inferior frontal sulcus.','HCP-MMP1 parcels are population references, not whole gyri or individual functional localisers.'],
    'Name each atlas parcel and its sulcal relationship before adding task evidence. Do not turn a highlighted parcel into a functional boundary.',
    'Along the inferior frontal sulcus, which two parcel references are compared with middle-frontal 46 and 9-46d?',
    'IFSp and IFSa. They are parcel references along the inferior frontal sulcus; the comparison orients the lateral prefrontal surface without assigning a task to any one parcel.',
    ['M1','CN1','CN2'],
    controlScene({network:'FPN',regions:cortex(84,86,81,82)}),
    {regions:['cnFpnPartition'],evidenceClass:'atlas',targets:[parcel(84,'46, middle frontal'),parcel(86,'9-46d, middle frontal'),parcel(81,'IFSp, inferior frontal sulcus'),parcel(82,'IFSa, inferior frontal sulcus')]}
  ),
  step('Find the parietal control territory',
    'Select IP2 and IP1 as intraparietal references that overlap predominantly with the installed FPN partition. Their parcel outlines remain distinct from network boundaries and do not identify an individual’s executive nodes.',
    'Select IP2 and IP1 separately in the left lateral view. Compare their distinct parcel outlines with the installed FPN wash, using the wash only as a group-level reference.',
    ['IP2 and IP1 are distinct HCP-MMP1 parcel labels.','They overlap predominantly with the installed FPN partition while retaining separate parcel contours.','Executive-control findings span multiple task and connectivity methods.'],
    'Report the cognitive demand and the measured response alongside the anatomical pointer. A parcel label alone does not say whether control performance was preserved.',
    'How do the IP2 and IP1 parcel outlines relate to the installed FPN partition?',
    'They overlap predominantly with the installed FPN partition while remaining distinct parcel outlines. That group-reference comparison does not identify an individual’s executive nodes or task performance.',
    ['M1','CN1','CN3','N1'],
    controlScene({network:'FPN',regions:cortex(144,145)}),
    {regions:['cnFpnPartition','cnExecutiveEvidence'],evidenceClass:'atlas',targets:[parcel(144,'IP2, intraparietal'),parcel(145,'IP1, intraparietal')]}
  ),
  step('Follow the lateral white-matter sample',
    'SLF II links intraparietal territory with superior and middle frontal regions, between the more dorsal SLF I and ventral SLF III systems. Parlatini and colleagues associated its projections with overlapping frontoparietal task territories, supporting an integrative role without establishing an exclusive connection for the Yeo-7 FPN.',
    'Display SLF II with SLF I and SLF III dimmed. Rotate between lateral and superior views, then compare the tract samples with the middle-frontal and intraparietal parcel references.',
    ['HCP1065 provides population-averaged tractography geometry.','The viewer presents SLF I, SLF II and SLF III as separate sampled bundle families.','Parlatini et al. associated the middle SLF II network with overlapping frontoparietal task territories, rather than an exclusive Yeo-7 FPN connection.','Their overlap on screen does not establish individual endpoints or a direct connection between the highlighted parcels.'],
    'Describe SLF II as the displayed population reference between SLF I and SLF III. Individual endpoint, connectivity and claims about surgical safety require individual evidence.',
    'In the displayed lateral white-matter comparison, where does SLF II lie relative to SLF I and SLF III?',
    'SLF II lies between the more dorsal SLF I and ventral SLF III systems. This population relationship does not establish individual endpoints or an exclusive connection for the Yeo-7 FPN.',
    ['D2','CN4','N1'],
    controlScene({network:'FPN',bundles:['SLF2'],ghost:['SLF1','SLF3'],regions:cortex(84,86,144,145),surface:.12}),
    {regions:['cnFpnPartition','cnSlf2Reference'],evidenceClass:'association',targets:[bundle('SLF2','SLF II, superior longitudinal fasciculus'),bundle('SLF1','SLF I, superior longitudinal fasciculus'),bundle('SLF3','SLF III, superior longitudinal fasciculus'),parcel(84,'46, middle frontal'),parcel(86,'9-46d, middle frontal'),parcel(144,'IP2, intraparietal'),parcel(145,'IP1, intraparietal')]}
  ),
  step('Read flexibility as a task finding',
    'Cole et al. examined frontoparietal connectivity across multiple tasks and related flexible hubs to adaptive control. Niendam et al. reviewed cognitive control across diverse executive functions, which argues against assigning one permanent operation to one highlighted parcel.',
    'Keep the FPN wash on, then toggle it off while the 46, 9-46d, IP2 and IP1 pointers remain. Describe the task demand before reopening the network view.',
    ['Cole et al. studied task-dependent connectivity in relation to adaptive control.','Niendam et al. synthesised evidence across several executive functions.','A functional network account and a cortical parcel map describe different evidence.'],
    'For resident education, describe the operation being tested before proposing a network account. The group-level scene cannot assign a fixed role or outcome to one parcel.',
    'Does a stable parcel outline guarantee a fixed executive role across tasks?',
    'No. The cited work relates frontoparietal connectivity to changing task demands. The outline remains an anatomical reference, not a task-by-task measure.',
    ['CN2','CN3','N13','M1'],
    controlScene({network:'FPN',regions:cortex(84,86,144,145)}),
    {regions:['cnExecutiveEvidence'],evidenceClass:'functional_measurement',targets:[parcel(84,'46, middle frontal'),parcel(86,'9-46d, middle frontal'),parcel(144,'IP2, intraparietal'),parcel(145,'IP1, intraparietal')]}
  ),
  step('Ask what a bedside screen leaves open',
    'Executive-control research considers demands such as maintaining information, updating it and adapting to a goal. This is a conceptual teaching point about what a task could examine, not a sourced bedside screening rule; the atlas contains no individual task measurement.',
    'Turn the FPN wash off and name the task demand involving maintaining and updating information. Then state what behavioural evidence would be needed to discuss it without treating the atlas as a functional test.',
    ['Executive-control research includes several cognitive operations.','Maintaining and updating information while pursuing a goal is different from observing motor and language performance.','The atlas contains no individual task measurement.'],
    'In a resident presentation, distinguish the task demand from anatomical labels. The hypothetical observation motivates assessment; it does not identify an injured parcel or tract.',
    'Hypothetical example: a person names objects and moves normally but loses intermediate results during a multistep calculation. Which additional demand needs assessment?',
    'Maintaining and updating information while pursuing a goal; the behaviour motivates assessment without identifying an injured parcel or tract. The atlas does not measure that demand.',
    ['CN3'],
    controlScene({network:'off',regions:cortex(84,144)}),
    {regions:['cnExecutiveEvidence'],evidenceClass:'conceptual_model',targets:[parcel(84,'46, middle frontal'),parcel(144,'IP2, intraparietal')]}
  ),
],{category:'Network lectures',regionCards:['cnFpnPartition']});

export const LESSONS=[l];
export const GUIDES={
  'control-network':{shortTitle:'Control network & SLF II',hemisphere:'L',question:'Which task evidence is needed to assess executive control beyond motor and language observations?',takeaways:[{step:0,text:'Name the task demand and the evidence used to assess it.'},{step:4,text:'Keep the FPN wash, parcel pointers and SLF II sample distinct.'},{step:6,text:'Describe the additional task demand and the behavioural evidence used to assess it.'}]},
};
