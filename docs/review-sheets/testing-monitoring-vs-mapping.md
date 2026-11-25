# How to test it: Monitoring vs mapping

Guide id: `testing-monitoring-vs-mapping` · Version: 2026-11-25.1 · Review status: draft

## Monitoring vs mapping

- **Primary question:** Monitoring: Is this pathway still conducting or is systemic physiology stable right now? | Mapping: Is this specific cortical or subcortical point essential for the active task or motor output?
- **Timing and continuity:** Monitoring: Continuous or frequent surveillance throughout tissue removal. | Mapping: Intermittent focal probe checks at planned entry points and advancing margins.
- **Spatial resolution:** Monitoring: End-to-end pathway or network level; does not tell you which millimetre of the wall caused a drop. | Mapping: Millimetre to ~5 mm focal interrogation directly ahead of the probe tip.
- **Typical tools:** Monitoring: TES/DCS-MEP, SSEP, ECoG, and unpaced awake fluency or judgment tasks during resection. | Mapping: LF bipolar DES during <=4 s tasks, HF monopolar train-of-five for CST, and phase reversal for M1.
- **What a signal means:** Monitoring: Conduction change, vascular stress, retraction, fatigue, or anesthetic/physiological drift. | Mapping: Reproducible task arrest (>=2 to 3 separated trials) or low mA motor proximity.
- **Main blind spot:** Monitoring: Late warning (changes after injury or ischemia begins) and silent to untested non-motor networks. | Mapping: Only the task currently performed is tested; a negative site is conditional on current and baseline.
- **Immediate operative action:** Monitoring: Pause resection, irrigate, release retraction, raise MAP, check anesthesia/hardware; reverse corridor if persistent. | Mapping: Tag boundary with a sterile ticket, stop advancing along that vector, and redirect the corridor.

## Modalities

### LF bipolar DES (Mapping)

- **Question:** Is this cortical or subcortical point essential for the task performed right now?
- **Parameters:** 50-60 Hz, 1 ms biphasic pulse, 2-6(-7) mA, 5 mm probe, <=4 s train below after-discharge threshold.
- **Blind spot:** Protects only the task being tested. Single errors are noise until reproduced >=2-3 times.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **sanai2008** — Sanai N et al., 2008 · Functional outcome after language mapping for glioma resection (PMID 18172171) — association
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model

### HF monopolar train-of-five (Mapping)

- **Question:** How close is the advancing wall to intact corticospinal axons?
- **Parameters:** Anodal (cortical) or cathodal (subcortical), 5 pulses, 0.3-0.5 ms, 250-500 Hz, 0.5-2 Hz rep, 0-20 mA.
- **Blind spot:** Proximity is not injury, and 1 mA = 1 mm is only a rough rule; fluid, char, edema, and contact distort mA.
**Sources:**
- **seidel2013** — Seidel K et al., 2013 · Subcortical motor mapping thresholds and MEP warning (PMID 23198802) — functional_measurement
- **mikuni2007** — Mikuni N et al., 2007 · MEP recording and fiber tracking for estimating pyramidal tracts (PMID 17236498) — functional_measurement

### TES / DCS-MEP (Monitoring)

- **Question:** Is the corticospinal tract still conducting from cortex to muscle?
- **Parameters:** Stable TIVA baseline; disappearance is the hard sign, sustained >=50% amplitude drop is graded.
- **Blind spot:** Misses SMA initiation, non-motor networks, and delayed vascular or venous deficits with preserved MEPs.
**Sources:**
- **asnm2013** — Macdonald DB et al., 2013 · ASNM position statement on intraoperative MEP monitoring (PMID 24055297) — conceptual_model
- **giampiccolo2021** — Giampiccolo D et al., 2021 · Long-term motor deficit in brain tumour surgery with preserved MEPs (PMID 33615216) — association
- **seidel2013** — Seidel K et al., 2013 · Subcortical motor mapping thresholds and MEP warning (PMID 23198802) — functional_measurement

### SSEP (Monitoring)

- **Question:** Are dorsal column-lemniscal conduction and global perfusion/anesthesia stable?
- **Parameters:** Continuous median/tibial cortical potentials interpreted against MAP, temperature, and TIVA depth.
- **Blind spot:** Silent to motor CST injury, language, semantics, praxis, and visual fields.
**Sources:**
- **asnm2013** — Macdonald DB et al., 2013 · ASNM position statement on intraoperative MEP monitoring (PMID 24055297) — conceptual_model

### Central sulcus phase reversal (Mapping)

- **Question:** Which bank beneath the strip is primary motor vs somatosensory cortex?
- **Parameters:** Median-nerve N20/P20 polarity inversion across a subdural strip placed over the central region.
- **Blind spot:** Locates the central sulcus at the surface; does not map subcortical CST depth or premotor planning.
**Sources:**
- **asnm2013** — Macdonald DB et al., 2013 · ASNM position statement on intraoperative MEP monitoring (PMID 24055297) — conceptual_model
- **giampiccolo2021** — Giampiccolo D et al., 2021 · Long-term motor deficit in brain tumour surgery with preserved MEPs (PMID 33615216) — association

### Awake double task (Monitoring)

- **Question:** Are two concurrent networks beginning to fail under load during resection?
- **Parameters:** Continuous contralateral limb movement paired with naming, semantics, or line bisection.
- **Blind spot:** Pain, fatigue, sedation, or mechanical pull can cause false-positive dual-task breakdown.
**Sources:**
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **aboelnour2024** — Abo-Elnour DE et al., 2024 · Awake versus asleep mapped glioma resection meta-analysis (PMID 39560794) — association

### Preoperative fMRI / DTI / nTMS (Planning prior)

- **Question:** Where should we expect function and tracts, and which tasks belong in the OR battery?
- **Parameters:** Preoperative functional activation, tractography, and navigated TMS priors imported for planning.
- **Blind spot:** Planning priors, not intraoperative proof (language fMRI sensitivity ~66% vs DES; brain shift moves tracts).
**Sources:**
- **roux2003** — Roux FE et al., 2003 · Language fMRI vs direct cortical stimulation correlation (66%) (PMID 12762879) — functional_measurement
- **mikuni2007** — Mikuni N et al., 2007 · MEP recording and fiber tracking for estimating pyramidal tracts (PMID 17236498) — functional_measurement
- **yogarajah2009** — Yogarajah M et al., 2009 · Defining Meyer's loop, visual fields and tractography (PMID 19460796) — reconstruction

## Tasks (DuLIP & specialized)

### Repetition of words

- **Group / mode:** dulip-part-a · Awake mapping (DES)
- **Domain / timing:** Phonology, <=4 s DES train
- **Prompt / protocol:** Repeat 2- or 3-syllable words (clusters and phonemic pairs)
- **Caveat:** Probes phonological input-output route (left AF and inferior SMG); leaves ventral semantic route untested.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **maldonado2011** — Maldonado IL et al., 2011 · Left superior longitudinal fascicle and language electrostimulation (DOI 10.1007/s00429-011-0309-x) — functional_measurement

### Reading with phonological odd word out

- **Group / mode:** dulip-part-a · Awake mapping (DES)
- **Domain / timing:** Phonology, <=4 s DES train
- **Prompt / protocol:** Read aloud the non-rhyming word among 4 one-syllable words (25 slides)
- **Caveat:** DuLIP section 5.3 caveat: transparent rhymes (bal, hal, val, weg) allow visual matching without phonological processing unless orthography is non-transparent or presented auditorily.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **maldonado2011** — Maldonado IL et al., 2011 · Left superior longitudinal fascicle and language electrostimulation (DOI 10.1007/s00429-011-0309-x) — functional_measurement

### Reading with semantic odd word out

- **Group / mode:** dulip-part-a · Awake mapping (DES)
- **Domain / timing:** Semantics, <=4 s DES train
- **Prompt / protocol:** Read aloud the unrelated word among 4 written nouns (25 items)
- **Caveat:** Assesses lexical visual reading and semantic judgment across temporal, prefrontal, parietal, occipital cortex and UF, ILF, IFOF.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement

### Naming with semantic odd picture out

- **Group / mode:** dulip-part-a · Awake mapping (DES)
- **Domain / timing:** Semantics, <=4 s DES train
- **Prompt / protocol:** Name the unrelated drawing among 3 black-and-white pictures (25 items)
- **Caveat:** Tests non-verbal semantic judgment and naming across temporal/prefrontal regions, IFOF, and ILF without requiring word reading.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement

### Sentence completion (closed context)

- **Group / mode:** dulip-part-a · Awake mapping (DES)
- **Domain / timing:** Semantics, <=4 s DES train
- **Prompt / protocol:** Read stem aloud and add one elicited noun ("The baker sells..." -> bread)
- **Caveat:** Measures reading, speech initiation, and constrained lexical production across SMA, Broca area, insula, subcallosal fascicle/FAT, and ILF.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **krainik2001** — Krainik A et al., 2001 · Role of the supplementary motor area in motor deficit following medial frontal surgery (PMID 11552019) — association

### Verb generation

- **Group / mode:** dulip-part-a · Awake mapping (DES)
- **Domain / timing:** Syntax, <=4 s DES train
- **Prompt / protocol:** Produce a semantically related verb for a presented noun (50 items)
- **Caveat:** DuLIP section 5.3 notes verb generation blends lexical semantics and syntax; action naming tests grammatical inflection more directly.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **lubrano2014** — Lubrano V et al., 2014 · Category-specific cortical naming of objects and actions (DOI 10.1002/hbm.22189) — functional_measurement

### Action naming (3rd person singular)

- **Group / mode:** dulip-part-a · Awake mapping (DES)
- **Domain / timing:** Syntax, <=4 s DES train
- **Prompt / protocol:** Carrier phrase ("The man...") + conjugated finite verb (60 drawings)
- **Caveat:** Tests person/number verb agreement in Broca area and posterior MFG; carrier phrase separates stimulation seizures from verb anomia.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **lubrano2014** — Lubrano V et al., 2014 · Category-specific cortical naming of objects and actions (DOI 10.1002/hbm.22189) — functional_measurement

### Verbal diadochokinesis (DDK)

- **Group / mode:** dulip-part-a · Awake mapping (DES)
- **Domain / timing:** Articulation, <=4 s DES train
- **Prompt / protocol:** Repeat 9 syllable sequences 5x fast (PAF PAF PAF and DAF PAF LAF)
- **Caveat:** Sensitive to speech-motor planning in IFG, ventral premotor cortex (limited plasticity), anterior insula, SLF, and CST motor speech.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **vangeemen2013** — Van Geemen K et al., 2013 · Limited plastic potential of left ventral premotor cortex in speech articulation (DOI 10.1002/hbm.22275) — functional_measurement
- **maldonado2011** — Maldonado IL et al., 2011 · Left superior longitudinal fascicle and language electrostimulation (DOI 10.1007/s00429-011-0309-x) — functional_measurement

### Object naming (100 drawings)

- **Group / mode:** dulip-part-a · Awake mapping (DES)
- **Domain / timing:** Naming, <=4 s DES train
- **Prompt / protocol:** Carrier phrase ("This is a...") + 4 s beep (100 living/non-living drawings)
- **Caveat:** Carrier phrase separates speech arrest or seizure from pure anomia; intact object naming never excludes reading, action, or initiation deficits.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **sanai2008** — Sanai N et al., 2008 · Functional outcome after language mapping for glioma resection (PMID 18172171) — association
- **lubrano2014** — Lubrano V et al., 2014 · Category-specific cortical naming of objects and actions (DOI 10.1002/hbm.22189) — functional_measurement

### Semantic association (moved from 4 s DES)

- **Group / mode:** dulip-part-b · Awake monitoring (resection)
- **Domain / timing:** Semantics, Continuous resection monitoring (moved from 4 s DES)
- **Prompt / protocol:** Add a related word to 2 written nouns (car, bike ... -> bus, 25 items)
- **Caveat:** DuLIP section 5.3 caveat: healthy controls scored 83.44% within 4 s due to delayed answers; apply during subcortical IFOF resection rather than 4 s DES.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement

### Phonological fluency (D, A, T)

- **Group / mode:** dulip-part-b · Awake monitoring (resection)
- **Domain / timing:** Phonology, Unpaced (1 min per letter) during resection
- **Prompt / protocol:** Generate as many words as possible starting with D, A, or T
- **Caveat:** Measures internally driven language initiation in frontal cortex and SMA/FAT; too slow for a 4 s DES pulse.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **catani2013** — Catani M et al., 2013 · Frontal aslant tract and verbal fluency (DOI 10.1093/brain/awt163) — association

### Phonological sentence judgment

- **Group / mode:** dulip-part-b · Awake monitoring (resection)
- **Domain / timing:** Phonology, Unpaced during resection
- **Prompt / protocol:** Judge 30 auditory sentences containing non-words ("The hokkel eats a gersie")
- **Caveat:** Probes phonological decoding and verbal short-term memory across middle posterior temporal cortex, AF, SLF, and ILF.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **maldonado2011** — Maldonado IL et al., 2011 · Left superior longitudinal fascicle and language electrostimulation (DOI 10.1007/s00429-011-0309-x) — functional_measurement

### Semantic fluency (animals and jobs)

- **Group / mode:** dulip-part-b · Awake monitoring (resection)
- **Domain / timing:** Semantics, Unpaced (1 min per category) during resection
- **Prompt / protocol:** Generate as many animals or jobs as possible in one minute
- **Caveat:** Monitors conceptual semantic retrieval in temporal territories; sensitive to early postoperative decline.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement

### Semantic sentence judgment

- **Group / mode:** dulip-part-b · Awake monitoring (resection)
- **Domain / timing:** Semantics, Unpaced during resection
- **Prompt / protocol:** Judge 50 auditory sentences for semantic violations ("The watering-can prepares a sandwich")
- **Caveat:** Monitors auditory semantic comprehension in temporal cortical and subcortical corridors without visual cards.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement

### Sentence completion (broad context)

- **Group / mode:** dulip-part-b · Awake monitoring (resection)
- **Domain / timing:** Semantics, Unpaced during resection
- **Prompt / protocol:** Complete 25 open stems with a full conjugated phrase ("At 5 o'clock...")
- **Caveat:** Assesses language dynamics and grammatical phrase production across SMA, temporoparietal cortex, insula, FAT, and ILF.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **krainik2001** — Krainik A et al., 2001 · Role of the supplementary motor area in motor deficit following medial frontal surgery (PMID 11552019) — association

### Syntactic fluency (verbs)

- **Group / mode:** dulip-part-b · Awake monitoring (resection)
- **Domain / timing:** Syntax, Unpaced (1 min) during resection
- **Prompt / protocol:** Generate as many verbs as possible in one minute
- **Caveat:** Tests grammatical flexibility in inferior/middle frontal and parietal areas; requires more grammatical encoding than noun fluency.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement

### Syntactic sentence judgment

- **Group / mode:** dulip-part-b · Awake monitoring (resection)
- **Domain / timing:** Syntax, Unpaced during resection
- **Prompt / protocol:** Judge 50 auditory sentences for word order, verb inflection, or pronoun errors
- **Caveat:** Probes receptive grammatical awareness in frontal regions when overt sentence production is paused.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement

### Automatic speech (counting)

- **Group / mode:** awake-specialized · Awake mapping (DES)
- **Domain / timing:** Articulation, <=4 s DES train
- **Prompt / protocol:** Count 1 to 10 aloud in a steady rhythm
- **Caveat:** Screens motor-speech output and FAT/SMA initiation arrest; normal counting never clears phonological, semantic, or syntactic cortex.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **vangeemen2013** — Van Geemen K et al., 2013 · Limited plastic potential of left ventral premotor cortex in speech articulation (DOI 10.1002/hbm.22275) — functional_measurement
- **catani2013** — Catani M et al., 2013 · Frontal aslant tract and verbal fluency (DOI 10.1093/brain/awt163) — association

### TES / DCS-MEP monitoring

- **Group / mode:** motor-asleep · Asleep monitoring
- **Domain / timing:** Motor conduction, Continuous surveillance
- **Prompt / protocol:** Baseline train stimulation under stable TIVA
- **Caveat:** Protects primary CST conduction only; blind to SMA initiation and non-motor networks.
**Sources:**
- **asnm2013** — Macdonald DB et al., 2013 · ASNM position statement on intraoperative MEP monitoring (PMID 24055297) — conceptual_model
- **giampiccolo2021** — Giampiccolo D et al., 2021 · Long-term motor deficit in brain tumour surgery with preserved MEPs (PMID 33615216) — association

### HF monopolar subcortical threshold

- **Group / mode:** motor-asleep · Asleep mapping
- **Domain / timing:** Motor proximity, Intermittent margin probing
- **Prompt / protocol:** Train-of-five escalation 0-20 mA ahead of cut
- **Caveat:** Measures electrical proximity, not injury; 1 mA = 1 mm is a rough guide only.
**Sources:**
- **seidel2013** — Seidel K et al., 2013 · Subcortical motor mapping thresholds and MEP warning (PMID 23198802) — functional_measurement
- **mikuni2007** — Mikuni N et al., 2007 · MEP recording and fiber tracking for estimating pyramidal tracts (PMID 17236498) — functional_measurement

### SSEP & central sulcus phase reversal

- **Group / mode:** motor-asleep · Asleep mapping
- **Domain / timing:** Central localization, Cortical localization + continuous SSEP
- **Prompt / protocol:** Median-nerve N20/P20 inversion across strip
- **Caveat:** Identifies central sulcus surface banks; provides no subcortical tract distance.
**Sources:**
- **asnm2013** — Macdonald DB et al., 2013 · ASNM position statement on intraoperative MEP monitoring (PMID 24055297) — conceptual_model

### Awake double task (motor + language)

- **Group / mode:** awake-specialized · Awake monitoring (resection)
- **Domain / timing:** Dual network load, Continuous during resection
- **Prompt / protocol:** Rhythmic contralateral arm flexion + naming or fluency
- **Caveat:** Fatigue, pain, or sedation can cause generalized slowing that mimics focal disconnection.
**Sources:**
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model
- **aboelnour2024** — Abo-Elnour DE et al., 2024 · Awake versus asleep mapped glioma resection meta-analysis (PMID 39560794) — association

### Line bisection (spatial attention)

- **Group / mode:** awake-specialized · Awake mapping (DES)
- **Domain / timing:** Spatial attention, <=4 s DES or rapid trials
- **Prompt / protocol:** Mark midpoint of horizontal lines on tablet or cards
- **Caveat:** Essential on right parietal / SLF II resections; untested cases risk left spatial neglect.
**Sources:**
- **roux2011** — Roux FE et al., 2011 · Electrostimulation mapping of spatial neglect and line bisection (PMID 22067336) — functional_measurement
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model

### Awake reading (orthographic / word-form)

- **Group / mode:** awake-specialized · Awake mapping (DES)
- **Domain / timing:** Reading, <=4 s DES train
- **Prompt / protocol:** Read regular and irregular words aloud within 4 s
- **Caveat:** Object naming can stay intact while left ILF/VOF disconnection causes pure alexia.
**Sources:**
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement

### Visual field dual-quadrant task

- **Group / mode:** awake-specialized · Awake mapping (DES)
- **Domain / timing:** Vision, <=4 s DES train
- **Prompt / protocol:** Name two items simultaneously (foveal + target quadrant)
- **Caveat:** Prevents gaze cheating; requires strict fixation and awake patient cooperation.
**Sources:**
- **grascombe2012** — Gras-Combe G et al., 2012 · Intraoperative subcortical electrical mapping of optic radiations (DOI 10.3171/2012.6.JNS111981) — functional_measurement
- **yogarajah2009** — Yogarajah M et al., 2009 · Defining Meyer's loop, visual fields and tractography (PMID 19460796) — reconstruction

### Vision-guided reaching (optic ataxia)

- **Group / mode:** awake-specialized · Awake mapping (DES)
- **Domain / timing:** Visuomotor, <=4 s DES train
- **Prompt / protocol:** Reach to peripheral visual target with contralateral hand
- **Caveat:** Probes superior parietal / SLF I visuomotor integration missed by strength testing alone.
**Sources:**
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model

### Prosody & emotion recognition

- **Group / mode:** awake-specialized · Awake mapping (DES)
- **Domain / timing:** Social cognition, <=4 s DES or short block
- **Prompt / protocol:** Affective prosody, distant semantic meaning, or emotion from eyes
- **Caveat:** Right frontoparietal and ventral network functions invisible to standard motor/naming batteries.
**Sources:**
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement

### Calculation (simple arithmetic)

- **Group / mode:** awake-specialized · Awake mapping (DES)
- **Domain / timing:** Calculation, <=4 s DES train
- **Prompt / protocol:** Solve single-step arithmetic within 4 s
- **Caveat:** Probes inferior parietal / angular territory; fails if verbal working memory is overloaded.
**Sources:**
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement

## Anatomical protocols

### Left arcuate fasciculus (AF)

- **Kind / side:** tract (L) · Families: AF · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Repetition of words, Reading with phonological odd word out, Object naming (100 drawings)
- **Monitoring tasks:** Phonological fluency (D, A, T), Phonological sentence judgment
- **Execution:** Stimulate the advancing dorsal wall with LF bipolar DES in alternating order using word repetition, phonological odd word out, and naming; monitor auditory phonological judgment during removal.
- **Error signature:** Phonemic paraphasias, repetition breakdown, or reproducible speech arrest.
- **Blind spot:** Object naming alone can miss pure phonological/repetition disconnection; asleep MEP/SSEP leaves AF completely blind.
- **Matching lesson:** language-networks
**Sources:**
- **maldonado2011** — Maldonado IL et al., 2011 · Left superior longitudinal fascicle and language electrostimulation (DOI 10.1007/s00429-011-0309-x) — functional_measurement
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **trinh2013** — Trinh VT et al., 2013 · Subcortical injury predicts worsening deficits following awake craniotomy (DOI 10.1227/NEU.0b013e31827b9a11) — association

### Right arcuate fasciculus (AF)

- **Kind / side:** tract (R) · Families: AF · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Prosody & emotion recognition, Repetition of words
- **Monitoring tasks:** Awake double task (motor + language), Phonological fluency (D, A, T)
- **Execution:** Test awake in right-dominant or prosody-at-risk cases with affective prosody, emotion recognition, and repetition checks.
- **Error signature:** Aprosodia, impaired emotion recognition, or repetition arrest in atypical dominance.
- **Blind spot:** Assuming left language dominance without checking prosody or atypical right-sided language risk.
- **Matching lesson:** language-networks
**Sources:**
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model
- **aboelnour2024** — Abo-Elnour DE et al., 2024 · Awake versus asleep mapped glioma resection meta-analysis (PMID 39560794) — association
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement

### Left IFOF (ventral semantic route)

- **Kind / side:** tract (L) · Families: IFOF · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Naming with semantic odd picture out, Reading with semantic odd word out, Object naming (100 drawings)
- **Monitoring tasks:** Semantic association (moved from 4 s DES), Semantic sentence judgment, Semantic fluency (animals and jobs)
- **Execution:** Map deep insular/temporal stem and frontal opercular floor with <=4 s semantic odd picture/word out and naming; run semantic association and semantic sentence judgment during resection.
- **Error signature:** Semantic paraphasias or non-verbal semantic selection errors reproduced >=2-3 times.
- **Blind spot:** Using DuLIP semantic association as a 4 s DES test fails due to >4 s normative delays (83.44% accuracy); move it to resection monitoring.
- **Matching lesson:** ventral-stream
**Sources:**
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **trinh2013** — Trinh VT et al., 2013 · Subcortical injury predicts worsening deficits following awake craniotomy (DOI 10.1227/NEU.0b013e31827b9a11) — association

### Right IFOF (ventral semantic & social route)

- **Kind / side:** tract (R) · Families: IFOF · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Prosody & emotion recognition, Naming with semantic odd picture out
- **Monitoring tasks:** Semantic association (moved from 4 s DES), Awake double task (motor + language)
- **Execution:** Test awake during right insular or temporal stem dissections using non-verbal semantics, emotion recognition, and dual task.
- **Error signature:** Impaired emotion/mental-state recognition or non-verbal semantic judgment.
- **Blind spot:** Standard motor/naming screening leaves right ventral semantic and social cognition silent.
- **Matching lesson:** limen-crossroads
**Sources:**
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model
- **aboelnour2024** — Abo-Elnour DE et al., 2024 · Awake versus asleep mapped glioma resection meta-analysis (PMID 39560794) — association

### Left ILF & VOF (reading route)

- **Kind / side:** tract (L) · Families: ILF, VOF · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Awake reading (orthographic / word-form), Sentence completion (closed context), Object naming (100 drawings)
- **Monitoring tasks:** Sentence completion (broad context), Semantic fluency (animals and jobs), Semantic sentence judgment
- **Execution:** Pair awake reading and reading-based sentence completion with object naming along basal occipitotemporal and lateral occipital walls.
- **Error signature:** Reading arrest, letter-by-letter hesitation, or lexicalization errors with preserved spoken naming.
- **Blind spot:** Oral object naming often passes at sites whose disconnection causes pure alexia.
- **Matching lesson:** reading-route
**Sources:**
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model

### Left uncinate fasciculus (UF)

- **Kind / side:** tract (L) · Families: UF · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Object naming (100 drawings), Naming with semantic odd picture out, Reading with semantic odd word out
- **Monitoring tasks:** Semantic fluency (animals and jobs), Semantic association (moved from 4 s DES)
- **Execution:** Check anterior temporal stem / limen insulae with naming and semantic odd picture out; recognize frequent functional compensation after anterior temporal resection.
- **Error signature:** Proper-name or famous-face retrieval pauses and semantic hesitation at the limen transition.
- **Blind spot:** Confusing deeper IFOF semantic responses with superficial UF; both cross the limen insulae.
- **Matching lesson:** limen-crossroads
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement
- **duffau2013** — Duffau H, 2013 · Plastic potential of adult cortex vs limited white matter plasticity (DOI 10.1016/j.cortex.2013.08.005) — conceptual_model

### Left frontal aslant tract (FAT / subcallosal)

- **Kind / side:** tract (L) · Families: FAT · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Sentence completion (closed context), Automatic speech (counting), Verb generation
- **Monitoring tasks:** Phonological fluency (D, A, T), Syntactic fluency (verbs), Sentence completion (broad context), Awake double task (motor + language)
- **Execution:** Test speech initiation with closed sentence completion and counting during DES, and track fluency and broad sentence completion continuously during medial frontal removal.
- **Error signature:** Stuttering, speech initiation arrest, or loss of spontaneous phrasing with preserved comprehension.
- **Blind spot:** Asleep TES-MEPs remain completely normal during FAT/SMA injury, and picture naming alone often misses initiation arrest.
- **Matching lesson:** fat-language
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **catani2013** — Catani M et al., 2013 · Frontal aslant tract and verbal fluency (DOI 10.1093/brain/awt163) — association
- **krainik2001** — Krainik A et al., 2001 · Role of the supplementary motor area in motor deficit following medial frontal surgery (PMID 11552019) — association
- **giampiccolo2021** — Giampiccolo D et al., 2021 · Long-term motor deficit in brain tumour surgery with preserved MEPs (PMID 33615216) — association

### Right frontal aslant tract (FAT)

- **Kind / side:** tract (R) · Families: FAT · **Mode:** Awake monitoring (resection) (Secondary: Awake mapping (DES))
- **Mapping tasks:** Awake double task (motor + language)
- **Monitoring tasks:** Awake double task (motor + language), Phonological fluency (D, A, T)
- **Execution:** Monitor bimanual/contralateral motor initiation and executive control with continuous double task during right medial frontal resection.
- **Error signature:** Slowing of contralateral limb initiation or breakdown under dual-task executive load.
- **Blind spot:** Preserved asleep MEPs miss right SMA/FAT akinesia and executive initiation deficits.
- **Matching lesson:** fat-language
**Sources:**
- **garic2019** — Garic D et al., 2019 · Laterality of the frontal aslant tract and executive function (PMID 30159951) — association
- **krainik2001** — Krainik A et al., 2001 · Role of the supplementary motor area in motor deficit following medial frontal surgery (PMID 11552019) — association
- **giampiccolo2021** — Giampiccolo D et al., 2021 · Long-term motor deficit in brain tumour surgery with preserved MEPs (PMID 33615216) — association

### SLF I (dorsal visuomotor & control)

- **Kind / side:** tract (both) · Families: SLF1 · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Vision-guided reaching (optic ataxia)
- **Monitoring tasks:** Awake double task (motor + language)
- **Execution:** Test superior parietal / medial frontoparietal corridor awake with vision-guided reaching and dual motor-cognitive task.
- **Error signature:** Optic ataxia (misreaching to peripheral targets) or degraded contralateral limb coordination.
- **Blind spot:** Standard bedside strength and object naming appear normal despite visuomotor disconnection.
- **Matching lesson:** control-network
**Sources:**
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model
- **giampiccolo2021** — Giampiccolo D et al., 2021 · Long-term motor deficit in brain tumour surgery with preserved MEPs (PMID 33615216) — association

### Right SLF II (spatial attention)

- **Kind / side:** tract (R) · Families: SLF2 · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Line bisection (spatial attention)
- **Monitoring tasks:** Awake double task (motor + language)
- **Execution:** Perform <=4 s DES during repeated line bisection along right middle frontal to angular parietal white matter.
- **Error signature:** Reproducible rightward deviation on horizontal line bisection.
- **Blind spot:** Treating right hemisphere as non-eloquent under GA risks permanent left hemispatial neglect.
- **Matching lesson:** attention-networks
**Sources:**
- **roux2011** — Roux FE et al., 2011 · Electrostimulation mapping of spatial neglect and line bisection (PMID 22067336) — functional_measurement
- **aboelnour2024** — Abo-Elnour DE et al., 2024 · Awake versus asleep mapped glioma resection meta-analysis (PMID 39560794) — association
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model

### Left SLF III (articulatory loop)

- **Kind / side:** tract (L) · Families: SLF3 · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Verbal diadochokinesis (DDK), Repetition of words, Automatic speech (counting)
- **Monitoring tasks:** Phonological fluency (D, A, T), Awake double task (motor + language)
- **Execution:** Map supramarginal to ventral premotor subcortical wall with verbal diadochokinesis, word repetition, and counting.
- **Error signature:** Dysarthria, anarthria, or articulatory speech arrest.
- **Blind spot:** Silent pauses without checking tongue/lip movement can confuse articulatory arrest with motor arrest.
- **Matching lesson:** language-networks
**Sources:**
- **maldonado2011** — Maldonado IL et al., 2011 · Left superior longitudinal fascicle and language electrostimulation (DOI 10.1007/s00429-011-0309-x) — functional_measurement
- **vangeemen2013** — Van Geemen K et al., 2013 · Limited plastic potential of left ventral premotor cortex in speech articulation (DOI 10.1002/hbm.22275) — functional_measurement
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement

### Corticospinal tract (CST)

- **Kind / side:** tract (both) · Families: CST · **Mode:** Asleep mapping (Secondary: Asleep monitoring, Awake mapping (DES))
- **Mapping tasks:** HF monopolar subcortical threshold, SSEP & central sulcus phase reversal, Verbal diadochokinesis (DDK)
- **Monitoring tasks:** TES / DCS-MEP monitoring, Awake double task (motor + language)
- **Execution:** Combine cortical localization (DES or phase reversal) with HF monopolar subcortical threshold probing and continuous TES/DCS-MEP; add DDK/repetition when awake near motor-speech fibers.
- **Error signature:** Falling subcortical mA threshold into declared stop-band (1-3 mA red zone), sustained >=50% MEP drop/loss, or dysarthria.
- **Blind spot:** Treating 1 mA = 1 mm as exact, or assuming stable MEPs exclude SMA syndrome and delayed vascular ischemia.
- **Matching lesson:** motor-cst
**Sources:**
- **seidel2013** — Seidel K et al., 2013 · Subcortical motor mapping thresholds and MEP warning (PMID 23198802) — functional_measurement
- **asnm2013** — Macdonald DB et al., 2013 · ASNM position statement on intraoperative MEP monitoring (PMID 24055297) — conceptual_model
- **mikuni2007** — Mikuni N et al., 2007 · MEP recording and fiber tracking for estimating pyramidal tracts (PMID 17236498) — functional_measurement
- **giampiccolo2021** — Giampiccolo D et al., 2021 · Long-term motor deficit in brain tumour surgery with preserved MEPs (PMID 33615216) — association
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement

### Optic radiation (Meyer's loop & OR)

- **Kind / side:** tract (both) · Families: OR · **Mode:** Awake mapping (DES) (Secondary: Untestable (anatomy only))
- **Mapping tasks:** Visual field dual-quadrant task
- **Monitoring tasks:** Awake double task (motor + language)
- **Execution:** Map awake with dual-quadrant simultaneous visual task when preserving quadrant vision is a surgical priority.
- **Error signature:** Transient phosphenes, blurring, or shadowing reported in the contralateral visual quadrant.
- **Blind spot:** Untestable under GA (VEP is unreliable for quadrantanopia); preoperative DTI varies widely on Meyer's loop.
- **Matching lesson:** optic-radiation
**Sources:**
- **grascombe2012** — Gras-Combe G et al., 2012 · Intraoperative subcortical electrical mapping of optic radiations (DOI 10.3171/2012.6.JNS111981) — functional_measurement
- **yogarajah2009** — Yogarajah M et al., 2009 · Defining Meyer's loop, visual fields and tractography (PMID 19460796) — reconstruction

### Fornix (Papez memory loop)

- **Kind / side:** tract (both) · Families: F · **Mode:** Untestable (anatomy only)
- **Mapping tasks:** None
- **Monitoring tasks:** None
- **Execution:** Untestable in real time by DES or IOM; protect through preplanned intraventricular corridor geometry and microsurgical landmarks.
- **Error signature:** No reliable intraoperative warning sign; injury manifests postoperatively as episodic amnesia.
- **Blind spot:** Normal MEPs, SSEPs, and fluent awake speech give zero warning of forniceal memory injury.
- **Matching lesson:** medial-system
**Sources:**
- **aggleton2000** — Aggleton JP et al., 2000 · Differential cognitive effects of third-ventricle lesions involving the fornix (PMID 10734011) — association

### Anterior thalamic peduncle (TR_A)

- **Kind / side:** tract (both) · Families: TR_A · **Mode:** Untestable (anatomy only)
- **Mapping tasks:** None
- **Monitoring tasks:** None
- **Execution:** Untestable directly during resection; rely on thalamic safe-entry corridor selection and deep vascular preservation.
- **Error signature:** No direct DES/IOM threshold; injury risks delayed apathy, abulia, or thalamocapsular ischemia.
- **Blind spot:** Quiet cortical/CST monitoring does not protect deep anterior thalamic peduncle fibers.
- **Matching lesson:** internal-capsule
**Sources:**
- **serra2021** — Serra C et al., 2021 · Thalamic lesions and thalamic peduncle surgical series (PMID 33007756) — experimental_anatomy

### Proximal DRTT (dentatorubrothalamic tract)

- **Kind / side:** tract (both) · Families: DRTT · **Mode:** Untestable (anatomy only)
- **Mapping tasks:** None
- **Monitoring tasks:** None
- **Execution:** No validated intraoperative stimulation threshold; protect proximal SCP/DRTT anatomy through telovelar corridor choice.
- **Error signature:** No direct real-time probe; proximal disruption associates with postoperative cerebellar mutism syndrome.
- **Blind spot:** Brainstem MEPs and SSEPs remain stable while proximal DRTT is retracted or injured.
- **Matching lesson:** brainstem-corridors
**Sources:**
- **morris2009** — Morris EB et al., 2009 · Proximal dentatothalamocortical tract involvement in posterior fossa syndrome (PMID 19805491) — association

### Left inferior frontal gyrus (IFG)

- **Kind / side:** cortex (L) · Parcels: 44, 45, 47l, IFJp · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Verbal diadochokinesis (DDK), Repetition of words, Verb generation, Action naming (3rd person singular), Object naming (100 drawings)
- **Monitoring tasks:** Syntactic fluency (verbs), Syntactic sentence judgment
- **Execution:** Map pars opercularis (44) and triangularis (45) serially with DDK, repetition, verb generation, and action naming; monitor syntax during resection.
- **Error signature:** Speech arrest, articulatory disruption, grammatical agreement error, or verb/noun anomia reproduced >=2-3 times.
- **Blind spot:** Counting alone misses syntactic inflection and lexical selection sites in 45/47l.
- **Matching lesson:** language-networks
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **lubrano2014** — Lubrano V et al., 2014 · Category-specific cortical naming of objects and actions (DOI 10.1002/hbm.22189) — functional_measurement
- **sanai2008** — Sanai N et al., 2008 · Functional outcome after language mapping for glioma resection (PMID 18172171) — association

### Left posterior middle frontal gyrus (pMFG)

- **Kind / side:** cortex (L) · Parcels: 55b, IFJa, p9-46v, 8C · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Action naming (3rd person singular), Verb generation, Object naming (100 drawings)
- **Monitoring tasks:** Phonological fluency (D, A, T), Syntactic fluency (verbs), Awake double task (motor + language)
- **Execution:** Probe 55b and posterior MFG with action naming (DuLIP Table 3) and verb generation; track phonological/syntactic fluency during resection.
- **Error signature:** Action-naming block, verb inflection error, or word-finding arrest.
- **Blind spot:** Preoperative fMRI disagreed with DES in 3 of 4 stimulated DuLIP cases (Roux 2003: 66% correlation); negative fMRI never clears pMFG.
- **Matching lesson:** fat-language
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **roux2003** — Roux FE et al., 2003 · Language fMRI vs direct cortical stimulation correlation (66%) (PMID 12762879) — functional_measurement
- **lubrano2014** — Lubrano V et al., 2014 · Category-specific cortical naming of objects and actions (DOI 10.1002/hbm.22189) — functional_measurement

### Left SMA / posterior SFG

- **Kind / side:** cortex (L) · Parcels: SFL, 6ma, 6mp, SCEF · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Sentence completion (closed context), Automatic speech (counting)
- **Monitoring tasks:** Sentence completion (broad context), Phonological fluency (D, A, T), Syntactic fluency (verbs), Awake double task (motor + language)
- **Execution:** Map language initiation with closed sentence completion (DuLIP Table 3) and monitor broad completion, verbal fluency, and contralateral movement continuously.
- **Error signature:** Gradual speech or motor initiation slowdown and dynamic aphasia without primary motor twitches.
- **Blind spot:** Asleep MEP monitoring misses SMA/pre-SMA initiation deficits completely.
- **Matching lesson:** motor-beyond-m1
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **krainik2001** — Krainik A et al., 2001 · Role of the supplementary motor area in motor deficit following medial frontal surgery (PMID 11552019) — association
- **giampiccolo2021** — Giampiccolo D et al., 2021 · Long-term motor deficit in brain tumour surgery with preserved MEPs (PMID 33615216) — association

### Left precentral gyrus (M1 & vPMC)

- **Kind / side:** cortex (L) · Parcels: 4, 6v, 6d, 6r · **Mode:** Awake mapping (DES) (Secondary: Asleep mapping, Asleep monitoring)
- **Mapping tasks:** Repetition of words, Verbal diadochokinesis (DDK), SSEP & central sulcus phase reversal
- **Monitoring tasks:** TES / DCS-MEP monitoring, Awake double task (motor + language)
- **Execution:** Calibrate positive motor response in area 4 first; test 6v/6r with repetition and verbal diadochokinesis (DuLIP Table 3) because vPMC has limited plasticity.
- **Error signature:** Contralateral muscle twitch/movement or dysarthric articulatory arrest.
- **Blind spot:** Assuming adult cortex can always compensate for left ventral premotor (6v) resection.
- **Matching lesson:** motor-cst
**Sources:**
- **vangeemen2013** — Van Geemen K et al., 2013 · Limited plastic potential of left ventral premotor cortex in speech articulation (DOI 10.1002/hbm.22275) — functional_measurement
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **seidel2013** — Seidel K et al., 2013 · Subcortical motor mapping thresholds and MEP warning (PMID 23198802) — functional_measurement

### Left posterior STG (pSTG)

- **Kind / side:** cortex (L) · Parcels: A4, A5, PBelt · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Naming with semantic odd picture out, Object naming (100 drawings)
- **Monitoring tasks:** Semantic sentence judgment, Semantic fluency (animals and jobs)
- **Execution:** Map posterior STG semantics and naming of living objects with semantic odd picture out and object naming; monitor auditory semantic sentence judgment during removal (DuLIP Table 3).
- **Error signature:** Semantic paraphasias, living-object anomia, or auditory semantic comprehension failure.
- **Blind spot:** Automatic counting or isolated phonological repetition leaves temporal semantic comprehension untested.
- **Matching lesson:** language-networks
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement

### Left mid-posterior STS

- **Kind / side:** cortex (L) · Parcels: STSdp, STSvp, TPOJ1 · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Reading with phonological odd word out, Repetition of words
- **Monitoring tasks:** Phonological sentence judgment
- **Execution:** Test the mid-posterior STS phonological network with phonological odd word out during DES and auditory phonological sentence judgment during resection (DuLIP Table 3).
- **Error signature:** Phonological selection errors, non-word discrimination breakdown, or phonemic paraphasias.
- **Blind spot:** Written transparent rhymes allow visual matching without phonology (DuLIP section 5.3); fMRI alone misses critical STS sites.
- **Matching lesson:** language-networks
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **roux2003** — Roux FE et al., 2003 · Language fMRI vs direct cortical stimulation correlation (66%) (PMID 12762879) — functional_measurement
- **maldonado2011** — Maldonado IL et al., 2011 · Left superior longitudinal fascicle and language electrostimulation (DOI 10.1007/s00429-011-0309-x) — functional_measurement

### Left mid-inferior temporal gyrus (mid-ITG)

- **Kind / side:** cortex (L) · Parcels: TE1p, TE2a, TE2p, PHT · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Object naming (100 drawings), Awake reading (orthographic / word-form)
- **Monitoring tasks:** Semantic sentence judgment, Semantic fluency (animals and jobs)
- **Execution:** Test the phonological-semantic lexical interface (non-living objects) with object naming and semantic sentence judgment (DuLIP Table 3), plus awake reading along basal cortex.
- **Error signature:** Anomia (especially non-living objects), lexical-semantic errors, or reading arrest.
- **Blind spot:** Object naming alone misses adjacent basal temporal reading cortex.
- **Matching lesson:** reading-route
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model

### Left anterior MTG (aMTG)

- **Kind / side:** cortex (L) · Parcels: TE1a, TGd, STSda · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Object naming (100 drawings), Naming with semantic odd picture out
- **Monitoring tasks:** Semantic association (moved from 4 s DES), Semantic fluency (animals and jobs)
- **Execution:** Confirm cortical boundaries with naming (including famous-face naming per DuLIP Table 3) and switch to continuous semantic monitoring when deepening toward temporal stem.
- **Error signature:** Proper-name or famous-face anomia, delayed word retrieval, or speech arrest.
- **Blind spot:** Expecting anterior temporal cortex to always be silent; DuLIP Case 2 found positive naming sites in anterior MTG.
- **Matching lesson:** ventral-stream
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement
- **duffau2013** — Duffau H, 2013 · Plastic potential of adult cortex vs limited white matter plasticity (DOI 10.1016/j.cortex.2013.08.005) — conceptual_model

### Left supramarginal gyrus (SMG)

- **Kind / side:** cortex (L) · Parcels: PF, PFop, PFm, PSL · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Sentence completion (closed context), Object naming (100 drawings), Repetition of words
- **Monitoring tasks:** Semantic association (moved from 4 s DES), Sentence completion (broad context), Phonological sentence judgment
- **Execution:** Map SMG reading, naming, and semantics with reading-based sentence completion and object naming (DuLIP Table 3), adding repetition near inferior SMG/AF.
- **Error signature:** Reading delay, naming arrest, phonological paraphasia, or semantic association breakdown.
- **Blind spot:** Static naming without reading or repetition misses dorsal phonological and reading hubs.
- **Matching lesson:** language-networks
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **maldonado2011** — Maldonado IL et al., 2011 · Left superior longitudinal fascicle and language electrostimulation (DOI 10.1007/s00429-011-0309-x) — functional_measurement

### Left angular gyrus (ANG)

- **Kind / side:** cortex (L) · Parcels: PGi, PGs, PGp · **Mode:** Awake mapping (DES) (Secondary: Awake monitoring (resection))
- **Mapping tasks:** Sentence completion (closed context), Awake reading (orthographic / word-form), Calculation (simple arithmetic)
- **Monitoring tasks:** Sentence completion (broad context), Semantic association (moved from 4 s DES)
- **Execution:** Combine reading plus sentence completion (DuLIP Table 3) and calculation (DuLIP Case 5) during angular DES; monitor broad completion continuously.
- **Error signature:** Reading arrest or delay, acalculia, or impaired sentence completion.
- **Blind spot:** Testing only object naming skips angular reading and calculation territories.
- **Matching lesson:** reading-route
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model

## Clinical trap drills

### Preserved MEPs in medial frontal surgery

During a left medial frontal glioma resection, continuous TES-MEPs remain unchanged from baseline. Postoperatively the patient has severe akinesia and speech initiation arrest despite intact naming at closure. What was the monitoring blind spot?

- **Target protocol:** `fat-left`
- [x] TES-MEPs test primary CST conduction, not SMA/FAT motor and speech initiation networks. — Preserved MEPs confirm end-to-end CST continuity from M1 to muscle but are silent to medial premotor (SMA/pre-SMA) and FAT initiation pathways; awake fluency and double-task monitoring are required to detect initiation breakdown.
- [ ] MEP amplitude only drops when cortical area 4 is resected, never with subcortical injury. — MEPs are sensitive to both cortical and subcortical CST conduction failure, so a normal MEP reflects sparing of M1-CST rather than cortical vs subcortical specificity.
- [ ] SSEP phase reversal would have prevented SMA syndrome under asleep anesthesia. — Phase reversal localizes the central sulcus at the surface and provides no information on medial premotor initiation or FAT.
**Sources:**
- **giampiccolo2021** — Giampiccolo D et al., 2021 · Long-term motor deficit in brain tumour surgery with preserved MEPs (PMID 33615216) — association
- **krainik2001** — Krainik A et al., 2001 · Role of the supplementary motor area in motor deficit following medial frontal surgery (PMID 11552019) — association
- **catani2013** — Catani M et al., 2013 · Frontal aslant tract and verbal fluency (DOI 10.1093/brain/awt163) — association

### Left basal occipitotemporal naming pass

Along the inferior-lateral margin of a left temporo-occipital resection, LF bipolar DES at 3.5 mA causes zero errors on object naming. Which deficit can still occur if you clear the corridor on naming alone?

- **Target protocol:** `ilf-vof-left-reading`
- [x] Pure alexia from disconnecting left ILF/VOF visual word-form pathways. — A positive site is strictly task-specific. Oral object naming can remain intact while left ILF/VOF disconnection produces pure alexia unless awake reading is explicitly tested.
- [ ] Contralateral hemiplegia from posterior limb CST injury. — The basal occipitotemporal ILF/VOF corridor is distant from the posterior limb CST; reading is the specific local blind spot.
- [ ] Bilateral episodic amnesia from fornix disconnection. — Episodic amnesia tracks the fornix in medial/intraventricular corridors, not the lateral/basal ILF-VOF reading route.
**Sources:**
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model

### DuLIP semantic association 4-second delay

You attempt to map cortical and subcortical sites with the DuLIP semantic association task using 4-second DES trains, and the patient makes frequent delays past the 4-second beep even off stimulation. What does DuLIP section 5.3 prescribe?

- **Target protocol:** `ifof-left`
- [x] Move semantic association to continuous resection monitoring (no 4 s limit) and use faster DES tasks like object naming or semantic odd picture out. — In DuLIP standardization (n=250), healthy adults averaged only 83.44% accuracy on semantic association within 4 s. Section 5.3 explicitly moves it to unpaced resection monitoring.
- [ ] Increase DES current above 10 mA until every trial stops cleanly. — Escalating current indiscriminately triggers after-discharges and seizures without fixing an unsuitable task timing window.
- [ ] Treat every >4 s delay as a hard positive language boundary. — Baseline normative delays exceed 4 s on this task, so calling >4 s delays positive under DES produces false positives.
**Sources:**
- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement

### Right parietal "non-eloquent" tumor

A cooperative patient has a right inferior parietal glioma adjacent to SLF II. Naming and motor exam are intact. Why does an asleep motor-only strategy carry a predictable blind spot here?

- **Target protocol:** `slf2-right`
- [x] Asleep motor IOM cannot detect spatial neglect; awake DES during line bisection directly maps right SLF II spatial attention. — A "non-eloquent" right-hemisphere label is an anatomical prior, not a functional measurement. Right SLF II disconnection causes contralesional spatial neglect unless tested awake with line bisection.
- [ ] Right-hemisphere tumors never benefit from awake mapping because language is always left-lateralized. — Awake mapping in the right hemisphere tests spatial attention, visuomotor control, praxis, and social cognition that asleep IOM leaves blind.
- [ ] Median-nerve SSEP detects hemispatial neglect reliably under TIVA. — SSEP monitors dorsal column-lemniscal conduction, not frontoparietal spatial attention.
**Sources:**
- **roux2011** — Roux FE et al., 2011 · Electrostimulation mapping of spatial neglect and line bisection (PMID 22067336) — functional_measurement
- **aboelnour2024** — Abo-Elnour DE et al., 2024 · Awake versus asleep mapped glioma resection meta-analysis (PMID 39560794) — association
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model

### Intraventricular corridor near fornix and TR_A

During an interhemispheric transcallosal approach to a third-ventricle lesion, the planned trajectory grazes the body of the fornix and anterior thalamic radiation (TR_A). How should intraoperative testing guide protection of these bundles?

- **Target protocol:** `fornix-bilateral`
- [x] Classify them as anatomy-only (untestable in real time) and protect them through preoperative corridor geometry rather than relying on DES or MEP silence. — Neither fornix episodic memory nor anterior thalamic cognitive loops can be reliably monitored by real-time DES or MEPs; silence on IOM provides false reassurance.
- [ ] Use HF monopolar train-of-five at 5 mA to measure exact distance to the fornix. — HF monopolar train-of-five elicits motor responses from CST axons and does not stimulate or measure proximity to the fornix.
- [ ] Rely on continuous counting under awake DES to detect acute fornix injury. — Automatic counting tests speech articulation, not hippocampal-forniceal episodic memory consolidation.
**Sources:**
- **aggleton2000** — Aggleton JP et al., 2000 · Differential cognitive effects of third-ventricle lesions involving the fornix (PMID 10734011) — association
- **serra2021** — Serra C et al., 2021 · Thalamic lesions and thalamic peduncle surgical series (PMID 33007756) — experimental_anatomy

## Lesion lab test lenses and surgical territory presets

All 26 anatomical testing cards are projected from HCP S1200/HCP1065 onto interactive 2D lateral and medial hemisphere diagrams on `/testing` (`testing_map.js`), and the 3D Lesion lab applies test lenses (`evaluateTestLens`) and custom batteries (`evaluateCustomBattery`) across 6 verified HCP1065 MNI surgical territories.

- **All cut** (`all`): Show every cut bundle at standard brightness. (Interrogates: all cut tracts (no dimming))
- **Asleep MEP only** (`asleep-mep`): Dims corticospinal conduction (CST) only; leaves language, initiation, spatial, reading, visual, and deep memory pathways bright as blind spots. (Interrogates: cst-bilateral)
- **Awake naming only** (`awake-naming`): Dims left spoken object-naming core (AF, IFOF, UF); leaves reading (VOF/ILF), initiation (FAT), articulatory (SLF III), spatial (right SLF II), motor (CST), visual (OR), and deep corridors bright. (Interrogates: af-left, ifof-left, uf-left)
- **Tailored battery** (`tailored`): Dims every pathway with a real-time DES or IOM probe; untestable deep corridors (Fornix, TR_A, proximal DRTT) remain bright. (Interrogates: af-left, af-right, ifof-left, ifof-right, ilf-vof-left-reading, uf-left, fat-left, fat-right, slf1-bilateral, slf2-right, slf3-left, cst-bilateral, or-bilateral)

### Custom Battery Builder tasks

- **HF subcortical CST** (`task-hf-subcortical-cst`, asleep)
- **TES / DCS-MEP** (`task-tes-dcs-mep`, asleep)
- **Object naming** (`dulip-object-naming`, awake)
- **Word repetition** (`dulip-repetition`, awake)
- **Phonological odd word** (`dulip-phonological-odd-word-out`, awake)
- **Semantic odd picture** (`dulip-semantic-odd-picture-out`, awake)
- **Awake reading** (`task-awake-reading`, awake)
- **Closed sentence completion** (`dulip-sentence-completion-closed`, awake)
- **Counting** (`task-counting`, awake)
- **Verbal DDK** (`dulip-ddk`, awake)
- **Verbal fluency** (`dulip-fluency-phonological`, awake)
- **Line bisection** (`task-line-bisection`, awake)
- **Vision-guided reaching** (`task-vision-guided-reaching`, awake)
- **Visual quadrant** (`task-visual-quadrant`, awake)
- **Prosody & emotion** (`task-prosody-social`, awake)
- **Double task** (`task-double-task`, awake)

### Primary interrogation tasks per tract

- `af-left`: dulip-repetition, dulip-phonological-odd-word-out
- `af-right`: task-prosody-social, dulip-repetition
- `ifof-left`: dulip-semantic-odd-picture-out, dulip-object-naming
- `ifof-right`: task-prosody-social, dulip-semantic-odd-picture-out
- `ilf-vof-left-reading`: task-awake-reading, dulip-sentence-completion-closed
- `uf-left`: dulip-object-naming, dulip-semantic-odd-picture-out
- `fat-left`: dulip-sentence-completion-closed, task-counting, dulip-fluency-phonological
- `fat-right`: task-double-task
- `slf1-bilateral`: task-vision-guided-reaching
- `slf2-right`: task-line-bisection
- `slf3-left`: dulip-ddk, dulip-repetition, task-counting
- `cst-bilateral`: task-hf-subcortical-cst, task-tes-dcs-mep
- `or-bilateral`: task-visual-quadrant
- `fornix-bilateral`: none (untestable corridor only)
- `tra-bilateral`: none (untestable corridor only)
- `drtt-bilateral`: none (untestable corridor only)

- **Left SMA** (`left-sma`): hemi L, MNI [-20, 2, 50], radius 14 mm, default lens `asleep-mep` — Medial frontal corridor crossing FAT and CST.
- **Left insula** (`left-insula`): hemi L, MNI [-30, 8, -4], radius 12 mm, default lens `asleep-mep` — Limen insulae crossroads over IFOF and UF.
- **Left temporoparietal** (`left-temporoparietal`): hemi L, MNI [-44, -36, 26], radius 13 mm, default lens `awake-naming` — Dorsal perisylvian arc crossing AF and SLF III.
- **Left occipitotemporal** (`left-occipitotemporal`): hemi L, MNI [-34, -72, -2], radius 14 mm, default lens `awake-naming` — Basal reading and optic corridor crossing VOF, ILF, IFOF, and OR.
- **Right parietal** (`right-parietal`): hemi R, MNI [34, -44, 34], radius 14 mm, default lens `asleep-mep` — Right spatial attention and prosody hub crossing SLF II and right AF.
- **Third ventricle** (`third-ventricle`): hemi L, MNI [-8, -6, 8], radius 11 mm, default lens `tailored` — Deep medial corridor crossing fornix, TR_A, and proximal DRTT.

## Full source list

- **dulip2015** — De Witte E et al., 2015 · The Dutch Linguistic Intraoperative Protocol (DuLIP) (DOI 10.1016/j.bandl.2014.10.011) — functional_measurement
  - _Scope:_ Standardized on 250 native Dutch-speaking healthy adults (cutoffs at 7th percentile = -1.5 SD clinical and 2nd percentile = -2.0 SD pathological, age 18-54 vs >55 and education <=12 vs >12 y). Norms are Dutch-only; task taxonomy, 4-second DES vs resection-monitoring split, and caveats transfer.
- **dewitt2012** — De Witt Hamer PC et al., 2012 · Impact of intraoperative stimulation brain mapping on glioma surgery outcome (PMID 22529254) — association
  - _Scope:_ Meta-analysis reporting late severe deficit 3.4% with mapping vs 8.2% without and GTR 75% vs 58%. Observational pooling across cohorts; does not randomize wakefulness against asleep mapping.
- **sanai2008** — Sanai N et al., 2008 · Functional outcome after language mapping for glioma resection (PMID 18172171) — association
  - _Scope:_ Broad negative language mapping series reporting 1.6% permanent language deficit at 6 months. Negative mapping requires adequate current, normothermia, and cooperative task baseline.
- **seidel2013** — Seidel K et al., 2013 · Subcortical motor mapping thresholds and MEP warning (PMID 23198802) — functional_measurement
  - _Scope:_ Subcortical motor threshold gives an early spatially specific proximity warning; MEP change is a later conduction warning. Threshold-to-distance relationship varies with fluid, char, edema, and contact.
- **asnm2013** — Macdonald DB et al., 2013 · ASNM position statement on intraoperative MEP monitoring (PMID 24055297) — conceptual_model
  - _Scope:_ Consensus statement: MEP disappearance is the hard sign; sustained amplitude drop is graded and context-dependent. Anesthetic, hemodynamic, thermal, and hardware mimics must be triaged.
- **aboelnour2024** — Abo-Elnour DE et al., 2024 · Awake versus asleep mapped glioma resection meta-analysis (PMID 39560794) — association
  - _Scope:_ Comparable extent of resection when both arms are mapped (92.2% vs 92.5%); awake surgery adds direct testing of non-motor networks. Non-randomized case selection limits causal claims.
- **giampiccolo2021** — Giampiccolo D et al., 2021 · Long-term motor deficit in brain tumour surgery with preserved MEPs (PMID 33615216) — association
  - _Scope:_ Most early peri-Rolandic motor deficits occurred with preserved MEPs; lasting deficits related to dorsal premotor and anterior cingulate extension. Stable MEPs do not exclude non-CST motor deficits.
- **krainik2001** — Krainik A et al., 2001 · Role of the supplementary motor area in motor deficit following medial frontal surgery (PMID 11552019) — association
  - _Scope:_ Surgical series correlating medial frontal / SMA resection with transient akinesia and speech initiation deficit; recovery pattern belongs to that cohort.
- **coello2013** — Coello AF et al., 2013 · Selection of intraoperative tasks for awake mapping (DOI 10.3171/2013.6.JNS122470) — conceptual_model
  - _Scope:_ Framework matching tumor location and white matter networks to tailored awake tasks; expert synthesis rather than a controlled outcome trial.
- **trinh2013** — Trinh VT et al., 2013 · Subcortical injury predicts worsening deficits following awake craniotomy (DOI 10.1227/NEU.0b013e31827b9a11) — association
  - _Scope:_ Retrospective awake-craniotomy series finding subcortical injury independently predicts neurological worsening beyond cortical mapping.
- **maldonado2011** — Maldonado IL et al., 2011 · Left superior longitudinal fascicle and language electrostimulation (DOI 10.1007/s00429-011-0309-x) — functional_measurement
  - _Scope:_ Direct subcortical stimulation separating dorsal phonological/articulatory SLF/AF responses from ventral semantic responses in left-hemisphere gliomas.
- **moritz2013** — Moritz-Gasser S et al., 2013 · Mapping multimodal verbal and non-verbal semantic processing (DOI 10.1016/j.neuropsychologia.2013.06.007) — functional_measurement
  - _Scope:_ Intraoperative stimulation using verbal naming and non-verbal semantic association along IFOF and ILF in a left-hemisphere surgical series.
- **grascombe2012** — Gras-Combe G et al., 2012 · Intraoperative subcortical electrical mapping of optic radiations (DOI 10.3171/2012.6.JNS111981) — functional_measurement
  - _Scope:_ Awake subcortical DES with dual-quadrant visual presentation eliciting phosphenes or visual distortion along optic radiations; requires patient report.
- **yogarajah2009** — Yogarajah M et al., 2009 · Defining Meyer's loop, visual fields and tractography (PMID 19460796) — reconstruction
  - _Scope:_ DTI tractography and visual-field outcome series showing wide inter-individual variation in Meyer's loop anterior extent.
- **aggleton2000** — Aggleton JP et al., 2000 · Differential cognitive effects of third-ventricle lesions involving the fornix (PMID 10734011) — association
  - _Scope:_ Lesion-behavior series linking fornix damage to episodic memory impairment; no real-time intraoperative DES test guards this pathway.
- **serra2021** — Serra C et al., 2021 · Thalamic lesions and thalamic peduncle surgical series (PMID 33007756) — experimental_anatomy
  - _Scope:_ Anatomical and microsurgical corridor series for thalamic lesions; guides corridor planning rather than direct cognitive mapping.
- **morris2009** — Morris EB et al., 2009 · Proximal dentatothalamocortical tract involvement in posterior fossa syndrome (PMID 19805491) — association
  - _Scope:_ Clinical-imaging correlation in pediatric posterior fossa surgery linking proximal DRTT disruption to mutism; observational correlation, not an intraoperative stimulation rule.
- **garic2019** — Garic D et al., 2019 · Laterality of the frontal aslant tract and executive function (PMID 30159951) — association
  - _Scope:_ Diffusion imaging and behavioral correlation relating bilateral FAT asymmetry to executive control and attention; cohort association, not DES proof.
- **vangeemen2013** — Van Geemen K et al., 2013 · Limited plastic potential of left ventral premotor cortex in speech articulation (DOI 10.1002/hbm.22275) — functional_measurement
  - _Scope:_ Stimulation and outcome series showing low plastic reorganization potential of left ventral premotor cortex compared with surrounding association cortex.
- **lubrano2014** — Lubrano V et al., 2014 · Category-specific cortical naming of objects and actions (DOI 10.1002/hbm.22189) — functional_measurement
  - _Scope:_ Direct cortical stimulation showing dissociable frontal and temporal sites for noun vs action naming in left-hemisphere gliomas.
- **duffau2013** — Duffau H, 2013 · Plastic potential of adult cortex vs limited white matter plasticity (DOI 10.1016/j.cortex.2013.08.005) — conceptual_model
  - _Scope:_ Synthesis contrasting cortical reorganization with minimal subcortical white matter plasticity; motivates subcortical functional boundaries.
- **catani2013** — Catani M et al., 2013 · Frontal aslant tract and verbal fluency (DOI 10.1093/brain/awt163) — association
  - _Scope:_ Tractography and behavioral correlation in primary progressive aphasia linking FAT microstructure to verbal fluency; cohort association.
- **mikuni2007** — Mikuni N et al., 2007 · MEP recording and fiber tracking for estimating pyramidal tracts (PMID 17236498) — functional_measurement
  - _Scope:_ Combined preoperative DTI and subcortical MEP stimulation series showing tractography alone underestimates functional proximity without electrical testing.
- **roux2003** — Roux FE et al., 2003 · Language fMRI vs direct cortical stimulation correlation (66%) (PMID 12762879) — functional_measurement
  - _Scope:_ Direct comparison showing preoperative language fMRI sensitivity near 66% against DES; establishes fMRI as a planning prior rather than intraoperative proof.
- **roux2011** — Roux FE et al., 2011 · Electrostimulation mapping of spatial neglect and line bisection (PMID 22067336) — functional_measurement
  - _Scope:_ Awake cortical and subcortical stimulation during line bisection eliciting rightward spatial deviation in right parietal and SLF II sites.

## Review checklist

- [ ] anatomy correct
- [ ] sources support claims
- [ ] wording OK
- [ ] approve to reviewed

Notes:
