/** Reading pathways. Population anatomy is kept separate from functional claims.
 */
import {source,parcel,bundle,cortex,scene,step,lesson} from './resident-anatomy.js';

export const SOURCES={
  RR1:source('RR1','Yeatman JD, et al., 2014 · the vertical occipital fasciculus','25404310','reconstruction','In vivo measurements characterise the VOF as an occipito-occipital pathway relating dorsal and ventral visual territories. They do not locate an individual reading function or tissue boundary.'),
  RR2:source('RR2','Makris N, et al., 2005 · superior longitudinal fascicle subdivisions','15590909','reconstruction','Quantitative in vivo DT-MRI segments the SLF into subcomponents. It supports naming population pathway branches, not an individual functional localisation or surgical corridor.'),
  RR3:source('RR3','Fernández-Miranda JC, et al., 2015 · arcuate fascicle segmentation','24633827','reconstruction','Human arcuate fascicle research addresses connectivity, segmentation and laterality. It supports a population pathway account, not an individual language map or reading function.'),
  RR4:source('RR4','Cohen L, et al., 2000 · visual word-form processing','10648437','functional_measurement','Functional and lesion observations characterise the spatial and temporal profile of an initial visual word-form stage. They do not make an atlas parcel an individual localiser or map the entire reading system.'),
  RR5:source('RR5','Makris N, et al., 2009 · middle longitudinal fascicle delineation','18669591','reconstruction','Quantitative in vivo DT-MRI delineates the MdLF in humans. It supports a pathway description, not a specific reading function or an individual boundary.'),
  RR6:source('RR6','Di Carlo DT et al., 2019 · Microsurgical anatomy of the sagittal stratum','31363919','experimental_anatomy','Fibre dissection of five formalin-fixed brains places the sagittal stratum medial to the AF/SLF complex and lateral to tapetal fibres, with superficial MdLF and ILF, middle IFOF and deep optic-radiation fibres. These regional relationships do not define an individual tissue plane or lesion boundary.'),
};

export const REGIONS={
  rrWordForm:Object.freeze({name:'Visual word-form evidence',text:'Cohen et al. studied an initial visual word-form stage in reading. VVC and FFC are HCP-MMP1 anatomical references here; their outlines do not reproduce the functional measurements or identify an individual word-form area.',sources:['RR4','M1'],evidenceClass:'functional_measurement'}),
  rrVofRoute:Object.freeze({name:'Vertical occipital pathway',text:'The VOF is an occipito-occipital reference pathway described through in vivo measurements and shown here in a population tract atlas. Its lines orient the dorsal-to-ventral occipital relation, not an individual reading circuit.',sources:['RR1','D2'],evidenceClass:'reconstruction'}),
  rrPosteriorRoutes:Object.freeze({name:'Posterior association pathway references',text:'The cited studies describe separate SLF branches, the arcuate fascicle, MdLF and ILF. Hodos displays population bundle geometry; the lines do not resolve individual tissue planes or assign a cognitive task to each pathway.',sources:['RR2','RR3','RR5','V6','N15','D2'],evidenceClass:'reconstruction'}),
};

const readingScene=(extra={})=>scene({side:'L',network:null,surface:.18,camera:{view:'left',tweenMs:650},...extra});
const l=lesson('reading-route','The reading route: VOF, MdLF and SLF III',15,
  'Follow visual word-form evidence into occipital and posterior temporal pathway relationships, then compare the SLF branches and arcuate while keeping anatomy separate from function.',
  ['Orient the ventral occipitotemporal reference and the VOF.','Compare MdLF and posterior temporal relationships, then compare the SLF branches by their described axes.','Separate a praxis hypothesis in teaching accounts from pathway anatomy.'],[
  step('Anchor reading in the ventral visual cortex',
    'Cohen et al. characterised an initial visual word-form stage in reading, while this scene shows HCP-MMP1 parcels rather than a functional localiser. Use VVC and FFC to orient the ventral occipitotemporal surface before describing the study results.',
    'Select FFC and VVC in the left lateral view, then rotate to inspect their ventral occipitotemporal position. State which objects are atlas parcels and which claim comes from the reading study.',
    ['Cohen et al. studied the spatial and temporal profile of an initial visual word-form stage.','FFC and VVC are population cortical labels in HCP-MMP1.','A parcel outline does not reproduce a task response or individual functional localisation.'],
    'For resident teaching, keep the visible cortical references separate from the reading measurement. The atlas can orient the discussion, but it cannot identify an individual word-form site.',
    'Can the FFC outline be called the visual word-form area because it lies in ventral cortex?',
    'No. FFC is an HCP-MMP1 parcel, while Cohen et al. report functional measurements. A local functional claim needs evidence at that level.',
    ['RR4','M1'],
    readingScene({regions:cortex(18,163),surface:.82}),
    {regions:['rrWordForm'],evidenceClass:'functional_measurement',targets:[parcel(18,'FFC, fusiform face complex'),parcel(163,'VVC, ventral visual complex')]}
  ),
  step('Trace the vertical occipital bridge',
    'The vertical occipital fasciculus (VOF) relates dorsal and ventral occipital territories. Yeatman et al. characterised this pathway with in vivo measurements as part of visual anatomy.',
    'Show VOF with V3A and VVC as orientation references. Rotate between lateral and superior views, then compare its dorsal-to-ventral course with the front-to-back cortical axis.',
    ['The VOF is a distinct occipito-occipital pathway in the cited in vivo account.','V3A and VVC orient dorsal and ventral occipital cortex in this view.','The installed HCP1065 bundle is population reference geometry.'],
    'In a resident anatomy discussion, describe the VOF as a route reference within the visual system. Do not treat the rendered course as an individual reading map.',
    'What relation does the VOF add to a lateral occipital view?',
    'It adds a pathway connecting dorsal and ventral occipital territories. Its geometry supplies an anatomical comparison, not an individual functional result.',
    ['RR1','D2','M1'],
    readingScene({bundles:['VOF'],regions:cortex(13,163),surface:.16}),
    {regions:['rrVofRoute'],evidenceClass:'reconstruction',targets:[bundle('VOF','VOF, Vertical occipital fasciculus'),parcel(13,'V3A, dorsal occipital'),parcel(163,'VVC, ventral visual complex')]}
  ),
  step('Compare vertical and longitudinal occipital routes',
    'Follow VOF between dorsal occipital and ventral occipitotemporal territories. Follow ILF longitudinally towards anterior temporal cortex. These are different population pathway courses, not one visual route.',
    'Show VOF, then dim it and show ILF. Follow VOF between dorsal occipital and ventral occipitotemporal territories, then follow ILF longitudinally towards anterior temporal cortex.',
    ['Yeatman et al. describe the VOF as an occipito-occipital pathway between dorsal and ventral territories.','The ILF follows a longitudinal occipitotemporal course towards anterior temporal cortex.','Displayed overlap does not establish shared fibres or assign a reading operation.'],
    'For residents, describe the VOF and ILF by their distinct courses before adding a language or reading interpretation. This comparison concerns population anatomy and reconstruction.',
    'Which displayed pathway runs predominantly dorsoventrally, and which runs longitudinally towards anterior temporal cortex?',
    'VOF and ILF, respectively. This names their population reference courses; it does not establish an individual reading circuit.',
    ['RR1','V6','N15','D2','M1'],
    readingScene({bundles:['VOF'],ghost:['ILF'],regions:cortex(163,172),surface:.12}),
    {regions:['rrVofRoute','rrPosteriorRoutes'],evidenceClass:'reconstruction',targets:[bundle('VOF','VOF, Vertical occipital fasciculus'),bundle('ILF','ILF, Inferior longitudinal fasciculus'),parcel(163,'VVC, ventral visual complex'),parcel(172,'TGv, ventral temporal') ]}
  ),
  step('Find the middle longitudinal fascicle',
    'Makris reconstructed MdLF within superior temporal white matter, extending towards the temporal pole and angular region. STSdp and TE1p are neighbouring orientation parcels here, not demonstrated endpoints of the displayed sample. A pathway description alone does not identify a reading or language function.',
    'Show MdLF while dimming AF and ILF. Rotate between lateral and posterior views and follow its course beside the posterior temporal reference parcels.',
    ['Makris reconstructed MdLF within superior temporal white matter, extending towards the temporal pole and angular region.','STSdp and TE1p are neighbouring orientation parcels here, not demonstrated endpoints of the displayed sample.','A tract name alone does not specify a cognitive task.'],
    'For resident anatomy teaching, distinguish the reconstructed route from its neighbouring atlas parcels. The display does not establish the sample endpoints or a specific function.',
    'Are STSdp and TE1p demonstrated endpoints of the displayed MdLF sample?',
    'No. They are neighbouring orientation parcels in this scene. Makris described MdLF extending towards the temporal pole and angular region, not these displayed parcels as demonstrated endpoints.',
    ['RR5','D2','M1'],
    readingScene({bundles:['MdLF'],ghost:['AF','ILF'],regions:cortex(129,133),surface:.12}),
    {regions:['rrPosteriorRoutes'],evidenceClass:'reconstruction',targets:[bundle('MdLF','MdLF, Middle longitudinal fasciculus'),parcel(129,'STSdp, posterior superior temporal sulcus'),parcel(133,'TE1p, posterior temporal cortex')]}
  ),
  step('Map the posterior temporal wall samples',
    'In this dissection model, the sagittal stratum lies medial to the AF/SLF complex and contains superficial MdLF and ILF, intermediate IFOF and deep optic-radiation fibres. These are regional anatomical relationships; the scene supplies no segmented lesion wall or dissection plane.',
    'Show AF, then compare ILF, IFOF and MdLF before adding OR. Use the scene to orient the pathways, then describe the sagittal-stratum relationships from dissection teaching and name the wall and plane as absent from this display.',
    ['The sagittal stratum lies medial to the AF/SLF complex in this dissection model.','Within it, the described order is superficial MdLF and ILF, intermediate IFOF and deep optic-radiation fibres.','The scene has no segmented lesion wall or dissection plane.'],
    'For resident anatomy teaching, keep these regional dissection relationships separate from the displayed population pathway samples. The scene cannot establish an individual tissue plane, lesion boundary or operative corridor.',
    'In the dissection model, where is the sagittal stratum relative to AF/SLF, and which pathways are described as superficial, intermediate and deep within it?',
    'It lies medial to the AF/SLF complex. The described order is superficial MdLF and ILF, intermediate IFOF and deep optic-radiation fibres. The scene does not depict the tissue plane or an individual lesion wall.',
    ['RR6','RR5','D2'],
    readingScene({bundles:['AF'],ghost:['ILF','IFOF','MdLF','OR'],regions:cortex(129,133),surface:.1}),
    {evidenceClass:'experimental_anatomy',targets:[bundle('AF','AF, Arcuate fasciculus'),bundle('ILF','ILF, Inferior longitudinal fasciculus'),bundle('IFOF','IFOF, Inferior fronto-occipital fasciculus'),bundle('MdLF','MdLF, Middle longitudinal fasciculus'),bundle('OR','OR, Optic radiation'),parcel(129,'STSdp, posterior superior temporal sulcus'),parcel(133,'TE1p, posterior temporal cortex')]}
  ),
  step('Order the three SLF branches dorsoventrally',
    'Makris delineated SLF I, II and III, with AF counted as a fourth component in that classification. Here compare the three SLF branches by their dorsoventral and mediolateral positions, not as a uniform superficial-to-deep stack. This is a population anatomy description, not an individual functional localisation.',
    'Toggle SLF III, II and I in the left lateral view, then show all three together. Compare their dorsoventral and mediolateral positions without arranging them into one superficial-to-deep stack or assigning function from the line colour.',
    ['Makris delineated SLF I, II and III, with AF counted as a fourth component in that classification.','Compare the three SLF branches by their dorsoventral and mediolateral positions rather than as one uniform superficial-to-deep stack.','The displayed endpoints do not localise an individual cortical function.'],
    'For residents, describe the axes used to compare the branch geometry and keep the reference population-level. Do not infer an individual boundary or function from the displayed lines.',
    'What is the dorsoventral order of SLF I, II and III, and which cortical territories does each branch link?',
    'SLF I is the most dorsal branch, linking superior parietal and superior frontal territory; SLF II lies in the middle, between angular and intraparietal territory and middle frontal cortex; SLF III is the most ventral, between supramarginal and opercular frontal territory. Makris counted AF as a fourth component in that classification.',
    ['RR2','D2','M1'],
    readingScene({bundles:['SLF1','SLF2','SLF3'],regions:cortex(100,148),surface:.12}),
    {regions:['rrPosteriorRoutes'],evidenceClass:'reconstruction',targets:[bundle('SLF1','SLF I'),bundle('SLF2','SLF II'),bundle('SLF3','SLF III'),parcel(100,'OP4, parietal operculum'),parcel(148,'PF, supramarginal region')]}
  ),
  step('Relate SLF III and the arcuate in fibre-dissection teaching',
    'In fibre-dissection teaching, SLF III lies lateral to the arcuate in the frontoparietal operculum. The separate Hodos pathway samples show population geometry and do not establish that relationship in an individual.',
    'Show SLF III, then dim it and show AF. Rotate posteriorly to follow the AF around the posterior Sylvian region. Name the lateral relationship as fibre-dissection teaching, not a depth inferred from the displayed samples.',
    ['In fibre-dissection teaching, SLF III lies lateral to the arcuate in the frontoparietal operculum.','The separate pathway samples show population geometry, not individual tissue planes.','This relationship does not assign a function to either pathway.'],
    'For residents, keep the lateral relationship attached to its dissection-teaching context. The displayed population samples do not establish individual layer order or predict an exposure.',
    'According to fibre-dissection teaching, how does SLF III relate to the arcuate in the frontoparietal operculum?',
    'SLF III lies lateral to the arcuate in that teaching account. The Hodos scene compares population pathway samples and does not establish an individual tissue plane or depth.',
    ['RR2','D2','M1'],
    readingScene({bundles:['SLF3'],ghost:['AF'],regions:cortex(100,148),surface:.1,camera:{view:'posterior',tweenMs:650}}),
    {evidenceClass:'reconstruction',targets:[bundle('SLF3','SLF III'),bundle('AF','AF, Arcuate fasciculus'),parcel(100,'OP4, parietal operculum'),parcel(148,'PF, supramarginal region')]}
  ),
  step('Separate SLF III anatomy from praxis evidence',
    'In teaching accounts, SLF III and parietal anatomy are associated with a praxis hypothesis. Makris et al. provide structural segmentation, not a praxis measurement; this scene cannot establish that association.',
    'Keep SLF III, OP4 and PF visible. Identify which part of the claim is pathway geometry and what evidence would be needed to establish a functional relation; do not turn the scene into a task protocol.',
    ['SLF III anatomy is distinct from the function attributed to a pathway.','OP4 and PF are HCP-MMP1 reference parcels, not praxis localisers.','The cited studies in this lesson describe pathway anatomy rather than measuring praxis.'],
    'For residents, separate pathway anatomy from a praxis conclusion and name the missing functional evidence. The scene is an educational reference, not an individual localisation.',
    'What anatomical relationship can this scene show between SLF III and the parietal reference, and what does it establish about praxis?',
    'It can orient population SLF III beside OP4 and PF. It cannot establish praxis localisation or predict an individual’s performance, because the cited evidence here measures pathway anatomy rather than praxis.',
    ['RR2','D2','M1'],
    readingScene({bundles:['SLF3'],regions:cortex(100,148),surface:.12}),
    {regions:['rrPosteriorRoutes'],evidenceClass:'reconstruction',targets:[bundle('SLF3','SLF III'),parcel(100,'OP4, parietal operculum'),parcel(148,'PF, supramarginal region')]}
  ),
],{regionCards:['rrPosteriorRoutes']});

export const LESSONS=[l];
export const GUIDES={
  'reading-route':{shortTitle:'Reading pathways',hemisphere:'L',question:'How can a resident follow visual and association pathways while keeping an individual reading map separate from population anatomy?',takeaways:[{step:0,text:'Treat VVC and FFC as anatomical references, not an individual word-form localiser.'},{step:4,text:'Locate the sagittal stratum medial to AF/SLF and compare its superficial, intermediate and deep pathways without treating the scene as a tissue plane.'},{step:7,text:'Separate the SLF III anatomical reference from the praxis hypothesis in teaching accounts.'}]},
};
