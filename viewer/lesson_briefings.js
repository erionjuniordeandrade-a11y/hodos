/** Original editorial scaffolding for the mounted, cited lessons. Each takeaway
 * points back to the step supplying its anatomy and source qualifications.
 * Example sides describe presentation, never individual functional dominance. */
const point=(step,text)=>({step,text});
export const TEACHING_GUIDES={
  'motor-cst':{shortTitle:'Central region & motor pathways',hemisphere:'L',
    question:'How can you explain a motor deficit when the area-4 outline is preserved?',
    takeaways:[point(0,'Use the two banks of the central sulcus to establish the cortical relationship.'),point(4,'Read the posterior capsular corridor between thalamus and the lentiform complex.'),point(9,'Explain movement at cortical, projection-pathway and distributed-control levels.')],next:'fat-language'},
  'fat-language':{shortTitle:'Frontal aslant & speech planning',hemisphere:'L',
    question:'After a left medial frontal procedure, speech initiation and right-sided spontaneous movement fall despite stable MEPs. What would change your anatomical interpretation?',
    takeaways:[point(0,'Follow the oblique lateral-to-medial frontal relationship before assigning a role.'),point(1,'Compare the frontal aslant course with a descending projection pathway.'),point(4,'Describe initiation, phrasing, naming and articulation separately before proposing a mechanism.')],next:'language-networks'},
  'optic-radiation':{shortTitle:'Optic radiation & temporal stem',hemisphere:'L',
    question:'An expected anterior loop appears short in a reconstruction. What would you investigate first?',
    takeaways:[point(0,'Connect the gross thalamic, white-matter and medial occipital levels of the account.'),point(2,'Distinguish optic radiation, uncinate and IFOF by their temporal courses.'),point(4,'Separate a display discrepancy from reconstruction limits, variation and individual anatomy.')],next:'interoception'},
  interoception:{shortTitle:'Insula & central core',hemisphere:'L',
    question:'A left insular lesion extends toward the lentiform complex despite preserved naming. Which anatomical and functional observations are still needed?',
    takeaways:[point(0,'Orient the buried insular surface and its opercular relationships.'),point(2,'Describe the capsule, claustral and lentiform sequence while naming the layers absent from the scene.'),point(4,'Add projection-pathway and vascular questions when explaining medial extension.')],next:'salience-network'},
  'evidence-classes':{shortTitle:'Read the evidence',hemisphere:'L',
    question:'A highlighted parcel, a nearby tract and weakness appear in one report. What does each actually establish?',
    takeaways:[point(0,'Identify whether the object is a surface landmark, parcel label or reconstruction.'),point(2,'Attach a functional statement to its measurement and method.'),point(3,'Keep atlas anatomy, reconstructed course and examination findings distinguishable.')],next:'motor-cst'},
  'sampling-support':{shortTitle:'When the tractogram is incomplete',hemisphere:'L',
    question:'A tract looks short and sparse. How do you describe the discrepancy without declaring it absent?',
    takeaways:[point(0,'Check whether visibility and cortical opacity explain what is missing on screen.'),point(1,'Displayed lines and vertices are sampling choices, not axon counts.'),point(3,'State the unresolved reconstruction question and the evidence needed to investigate it.')],next:'optic-radiation'},
  'attention-networks':{shortTitle:'Attention & spatial awareness',hemisphere:'R',
    question:'A person omits items on the left during search despite useful hand strength. How would you localize the question?',
    takeaways:[point(1,'Distinguish preparatory orienting from reorienting toward a relevant event.'),point(2,'Compare the separate superior-longitudinal courses in a frontoparietal account.'),point(5,'Connect the observed spatial bias to a cortical or disconnection hypothesis and individual evidence.')],next:'salience-network',
    comparison:{title:'Orienting / reorienting / control',note:'Compare group network partitions in one right lateral view. These washes do not reproduce the task regions in the cited experiments.',view:'right',options:[{label:'Dorsal attention',network:'DAN'},{label:'Ventral attention',network:'VAN'},{label:'Frontoparietal control',network:'FPN'}]}},
  'language-networks':{shortTitle:'Language across pathways',hemisphere:'L',
    question:'Speech is fluent but meaning-related substitutions occur, with repetition better preserved than comprehension. Which relationships matter?',
    takeaways:[point(1,'Compare dorsal auditory–articulatory accounts with the anatomy of AF and SLF III.'),point(2,'Distinguish extreme-capsule and IFOF samples within ventral language accounts.'),point(4,'Add frontal initiation and phrase planning; characterize the actual language error.')],next:'fat-language',
    comparison:{title:'Dorsal / ventral / frontal',note:'Compare sampled anatomical courses from the same left lateral view. Routes and functional streams retain separate identities.',view:'left',options:[{label:'Dorsal · AF / SLF III',bundles:['AF'],ghost:['SLF3']},{label:'Ventral · IFOF / EMC',bundles:['IFOF','EMC'],ghost:['AF']},{label:'Frontal · FAT',bundles:['FAT'],ghost:['AF']}]}},
  'default-mode-network':{shortTitle:'Default mode & memory relationships',hemisphere:'L',
    question:'Motor examination and conversation seem preserved, but recalling familiar events is difficult. What further anatomical account is needed?',
    takeaways:[point(1,'Orient anterior medial, posterior cingulate and retrosplenial references.'),point(2,'Compare cingulum trajectories with functional coupling without equating them.'),point(3,'Relate medial-temporal anatomy to a specific cognitive operation rather than a broad network label.')],next:'salience-network',
    comparison:{title:'Group network / structural context',note:'Use a common medial view. Yeo-7 does not subdivide the DMN subsystems described in the lecture.',view:'medial',options:[{label:'DMN · group wash',network:'DMN'},{label:'Cingulum · anatomy',bundles:['C_FP','C_PHP'],ghost:[]}]}},
  'salience-network':{shortTitle:'Salience, insula & control',hemisphere:'R',
    question:'After a frontoinsular procedure, redirecting behaviour toward relevant events is difficult. What must a useful explanation include?',
    takeaways:[point(0,'Locate frontoinsular and dorsal cingulate reference territories.'),point(2,'Keep salience, ventral attention and cingulo-opercular definitions separate.'),point(5,'Describe the behaviour and task before advancing a switching or lesion-network hypothesis.')],next:'attention-networks',
    comparison:{title:'Anatomical references / network partition',note:'The AVI and p32pr references and the Yeo-7 ventral-attention partition have different definitions. No dedicated cingulo-opercular partition is installed.',view:'right',options:[{label:'Insula / cingulate references',regions:[{id:111,hemi:'follow'},{id:60,hemi:'follow'}]},{label:'Yeo-7 · ventral attention',network:'VAN'}]}},
};

export const CURRICULUM=[
  {title:'Foundations',description:'Read the image and the evidence.',ids:['evidence-classes','sampling-support']},
  {title:'Regional relationships',description:'Move from cortex into the deep corridors.',ids:['motor-cst','fat-language','optic-radiation','interoception']},
  {title:'Networks & behaviour',description:'Connect anatomy with a specific observation.',ids:['attention-networks','language-networks','default-mode-network','salience-network']},
];
