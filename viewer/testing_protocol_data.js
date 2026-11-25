// Core protocol data for Hodos "How to test it? Monitoring vs Mapping" (educational draft).
// Modes, Monitoring vs Mapping comparison, modalities, and clinical trap drills.
// Keep UI strings free of em/en dashes and with at most one middle dot per line.
import {TESTING_SOURCES} from './testing_sources_data.js';
import {TESTING_TASKS} from './testing_tasks_data.js';

export {TESTING_SOURCES, TESTING_TASKS};

export const REVIEW_STATUS = 'draft';
export const TESTING_VERSION = '2026-11-25.1';

export const TESTING_MODES = Object.freeze([
  Object.freeze({
    id: 'asleep-monitoring',
    label: 'Asleep monitoring',
    badge: 'Monitor',
    summary: 'Continuous MEP and SSEP surveillance under TIVA while the patient cannot perform tasks.',
  }),
  Object.freeze({
    id: 'asleep-mapping',
    label: 'Asleep mapping',
    badge: 'Map',
    summary: 'Direct electrical localization of M1 and HF monopolar CST proximity thresholds under GA.',
  }),
  Object.freeze({
    id: 'awake-mapping-des',
    label: 'Awake mapping (DES)',
    badge: 'Map',
    summary: 'LF bipolar direct electrical stimulation during <=4 s tasks to establish essentiality.',
  }),
  Object.freeze({
    id: 'awake-monitoring-resection',
    label: 'Awake monitoring (resection)',
    badge: 'Monitor',
    summary: 'Continuous unpaced task performance during tissue removal between stimulation checks.',
  }),
  Object.freeze({
    id: 'untestable-anatomy-only',
    label: 'Untestable (anatomy only)',
    badge: 'Corridor only',
    summary: 'Pathway lacks a reliable intraoperative probe; protection depends on corridor geometry.',
  }),
]);

export const COMPARISON_ROWS = Object.freeze([
  Object.freeze({
    id: 'primary-question',
    dimension: 'Primary question',
    monitoring: 'Is this pathway still conducting or is systemic physiology stable right now?',
    mapping: 'Is this specific cortical or subcortical point essential for the active task or motor output?',
  }),
  Object.freeze({
    id: 'timing',
    dimension: 'Timing and continuity',
    monitoring: 'Continuous or frequent surveillance throughout tissue removal.',
    mapping: 'Intermittent focal probe checks at planned entry points and advancing margins.',
  }),
  Object.freeze({
    id: 'spatial-resolution',
    dimension: 'Spatial resolution',
    monitoring: 'End-to-end pathway or network level; does not tell you which millimetre of the wall caused a drop.',
    mapping: 'Millimetre to ~5 mm focal interrogation directly ahead of the probe tip.',
  }),
  Object.freeze({
    id: 'tools',
    dimension: 'Typical tools',
    monitoring: 'TES/DCS-MEP, SSEP, ECoG, and unpaced awake fluency or judgment tasks during resection.',
    mapping: 'LF bipolar DES during <=4 s tasks, HF monopolar train-of-five for CST, and phase reversal for M1.',
  }),
  Object.freeze({
    id: 'signal-meaning',
    dimension: 'What a signal means',
    monitoring: 'Conduction change, vascular stress, retraction, fatigue, or anesthetic/physiological drift.',
    mapping: 'Reproducible task arrest (>=2 to 3 separated trials) or low mA motor proximity.',
  }),
  Object.freeze({
    id: 'blind-spot',
    dimension: 'Main blind spot',
    monitoring: 'Late warning (changes after injury or ischemia begins) and silent to untested non-motor networks.',
    mapping: 'Only the task currently performed is tested; a negative site is conditional on current and baseline.',
  }),
  Object.freeze({
    id: 'immediate-action',
    dimension: 'Immediate operative action',
    monitoring: 'Pause resection, irrigate, release retraction, raise MAP, check anesthesia/hardware; reverse corridor if persistent.',
    mapping: 'Tag boundary with a sterile ticket, stop advancing along that vector, and redirect the corridor.',
  }),
]);

export const MODALITIES = Object.freeze([
  Object.freeze({
    id: 'lf-bipolar-des',
    name: 'LF bipolar DES',
    role: 'Mapping',
    question: 'Is this cortical or subcortical point essential for the task performed right now?',
    parameters: '50-60 Hz, 1 ms biphasic pulse, 2-6(-7) mA, 5 mm probe, <=4 s train below after-discharge threshold.',
    blindSpot: 'Protects only the task being tested. Single errors are noise until reproduced >=2-3 times.',
    sourceIds: ['dulip2015', 'sanai2008', 'coello2013'],
  }),
  Object.freeze({
    id: 'hf-monopolar-to5',
    name: 'HF monopolar train-of-five',
    role: 'Mapping',
    question: 'How close is the advancing wall to intact corticospinal axons?',
    parameters: 'Anodal (cortical) or cathodal (subcortical), 5 pulses, 0.3-0.5 ms, 250-500 Hz, 0.5-2 Hz rep, 0-20 mA.',
    blindSpot: 'Proximity is not injury, and 1 mA = 1 mm is only a rough rule; fluid, char, edema, and contact distort mA.',
    sourceIds: ['seidel2013', 'mikuni2007'],
  }),
  Object.freeze({
    id: 'tes-dcs-mep',
    name: 'TES / DCS-MEP',
    role: 'Monitoring',
    question: 'Is the corticospinal tract still conducting from cortex to muscle?',
    parameters: 'Stable TIVA baseline; disappearance is the hard sign, sustained >=50% amplitude drop is graded.',
    blindSpot: 'Misses SMA initiation, non-motor networks, and delayed vascular or venous deficits with preserved MEPs.',
    sourceIds: ['asnm2013', 'giampiccolo2021', 'seidel2013'],
  }),
  Object.freeze({
    id: 'ssep',
    name: 'SSEP',
    role: 'Monitoring',
    question: 'Are dorsal column-lemniscal conduction and global perfusion/anesthesia stable?',
    parameters: 'Continuous median/tibial cortical potentials interpreted against MAP, temperature, and TIVA depth.',
    blindSpot: 'Silent to motor CST injury, language, semantics, praxis, and visual fields.',
    sourceIds: ['asnm2013'],
  }),
  Object.freeze({
    id: 'phase-reversal',
    name: 'Central sulcus phase reversal',
    role: 'Mapping',
    question: 'Which bank beneath the strip is primary motor vs somatosensory cortex?',
    parameters: 'Median-nerve N20/P20 polarity inversion across a subdural strip placed over the central region.',
    blindSpot: 'Locates the central sulcus at the surface; does not map subcortical CST depth or premotor planning.',
    sourceIds: ['asnm2013', 'giampiccolo2021'],
  }),
  Object.freeze({
    id: 'awake-double-task',
    name: 'Awake double task',
    role: 'Monitoring',
    question: 'Are two concurrent networks beginning to fail under load during resection?',
    parameters: 'Continuous contralateral limb movement paired with naming, semantics, or line bisection.',
    blindSpot: 'Pain, fatigue, sedation, or mechanical pull can cause false-positive dual-task breakdown.',
    sourceIds: ['coello2013', 'dulip2015', 'aboelnour2024'],
  }),
  Object.freeze({
    id: 'preop-priors',
    name: 'Preoperative fMRI / DTI / nTMS',
    role: 'Planning prior',
    question: 'Where should we expect function and tracts, and which tasks belong in the OR battery?',
    parameters: 'Preoperative functional activation, tractography, and navigated TMS priors imported for planning.',
    blindSpot: 'Planning priors, not intraoperative proof (language fMRI sensitivity ~66% vs DES; brain shift moves tracts).',
    sourceIds: ['roux2003', 'mikuni2007', 'yogarajah2009'],
  }),
]);

export const SCENARIO_DRILLS = Object.freeze([
  Object.freeze({
    id: 'drill-sma-fat-mep',
    targetId: 'fat-left',
    title: 'Preserved MEPs in medial frontal surgery',
    stem: 'During a left medial frontal glioma resection, continuous TES-MEPs remain unchanged from baseline. Postoperatively the patient has severe akinesia and speech initiation arrest despite intact naming at closure. What was the monitoring blind spot?',
    options: Object.freeze([
      Object.freeze({
        id: 'a',
        label: 'TES-MEPs test primary CST conduction, not SMA/FAT motor and speech initiation networks.',
        correct: true,
        rationale: 'Preserved MEPs confirm end-to-end CST continuity from M1 to muscle but are silent to medial premotor (SMA/pre-SMA) and FAT initiation pathways; awake fluency and double-task monitoring are required to detect initiation breakdown.',
      }),
      Object.freeze({
        id: 'b',
        label: 'MEP amplitude only drops when cortical area 4 is resected, never with subcortical injury.',
        correct: false,
        rationale: 'MEPs are sensitive to both cortical and subcortical CST conduction failure, so a normal MEP reflects sparing of M1-CST rather than cortical vs subcortical specificity.',
      }),
      Object.freeze({
        id: 'c',
        label: 'SSEP phase reversal would have prevented SMA syndrome under asleep anesthesia.',
        correct: false,
        rationale: 'Phase reversal localizes the central sulcus at the surface and provides no information on medial premotor initiation or FAT.',
      }),
    ]),
    sourceIds: ['giampiccolo2021', 'krainik2001', 'catani2013'],
  }),
  Object.freeze({
    id: 'drill-ilf-vof-reading',
    targetId: 'ilf-vof-left-reading',
    title: 'Left basal occipitotemporal naming pass',
    stem: 'Along the inferior-lateral margin of a left temporo-occipital resection, LF bipolar DES at 3.5 mA causes zero errors on object naming (DO 80). Which deficit can still occur if you clear the corridor on naming alone?',
    options: Object.freeze([
      Object.freeze({
        id: 'a',
        label: 'Pure alexia from disconnecting left ILF/VOF visual word-form pathways.',
        correct: true,
        rationale: 'A positive site is strictly task-specific. Oral object naming can remain intact while left ILF/VOF disconnection produces pure alexia unless awake reading is explicitly tested.',
      }),
      Object.freeze({
        id: 'b',
        label: 'Contralateral hemiplegia from posterior limb CST injury.',
        correct: false,
        rationale: 'The basal occipitotemporal ILF/VOF corridor is distant from the posterior limb CST; reading is the specific local blind spot.',
      }),
      Object.freeze({
        id: 'c',
        label: 'Bilateral episodic amnesia from fornix disconnection.',
        correct: false,
        rationale: 'Episodic amnesia tracks the fornix in medial/intraventricular corridors, not the lateral/basal ILF-VOF reading route.',
      }),
    ]),
    sourceIds: ['moritz2013', 'dulip2015', 'coello2013'],
  }),
  Object.freeze({
    id: 'drill-dulip-semantic-assoc',
    targetId: 'ifof-left',
    title: 'DuLIP semantic association 4-second delay',
    stem: 'You attempt to map cortical and subcortical sites with the DuLIP semantic association task using 4-second DES trains, and the patient makes frequent delays past the 4-second beep even off stimulation. What does DuLIP section 5.3 prescribe?',
    options: Object.freeze([
      Object.freeze({
        id: 'a',
        label: 'Move semantic association to continuous resection monitoring (no 4 s limit) and use faster DES tasks like object naming or semantic odd picture out.',
        correct: true,
        rationale: 'In DuLIP standardization (n=250), healthy adults averaged only 83.44% accuracy on semantic association within 4 s. Section 5.3 explicitly moves it to unpaced resection monitoring.',
      }),
      Object.freeze({
        id: 'b',
        label: 'Increase DES current above 10 mA until every trial stops cleanly.',
        correct: false,
        rationale: 'Escalating current indiscriminately triggers after-discharges and seizures without fixing an unsuitable task timing window.',
      }),
      Object.freeze({
        id: 'c',
        label: 'Treat every >4 s delay as a hard positive language boundary.',
        correct: false,
        rationale: 'Baseline normative delays exceed 4 s on this task, so calling >4 s delays positive under DES produces false positives.',
      }),
    ]),
    sourceIds: ['dulip2015', 'moritz2013'],
  }),
  Object.freeze({
    id: 'drill-right-slf2-neglect',
    targetId: 'slf2-right',
    title: 'Right parietal "non-eloquent" tumor',
    stem: 'A cooperative patient has a right inferior parietal glioma adjacent to SLF II. Naming and motor exam are intact. Why does an asleep motor-only strategy carry a predictable blind spot here?',
    options: Object.freeze([
      Object.freeze({
        id: 'a',
        label: 'Asleep motor IOM cannot detect spatial neglect; awake DES during line bisection directly maps right SLF II spatial attention.',
        correct: true,
        rationale: 'A "non-eloquent" right-hemisphere label is an anatomical prior, not a functional measurement. Right SLF II disconnection causes contralesional spatial neglect unless tested awake with line bisection.',
      }),
      Object.freeze({
        id: 'b',
        label: 'Right-hemisphere tumors never benefit from awake mapping because language is always left-lateralized.',
        correct: false,
        rationale: 'Awake mapping in the right hemisphere tests spatial attention, visuomotor control, praxis, and social cognition that asleep IOM leaves blind.',
      }),
      Object.freeze({
        id: 'c',
        label: 'Median-nerve SSEP detects hemispatial neglect reliably under TIVA.',
        correct: false,
        rationale: 'SSEP monitors dorsal column-lemniscal conduction, not frontoparietal spatial attention.',
      }),
    ]),
    sourceIds: ['roux2011', 'aboelnour2024', 'coello2013'],
  }),
  Object.freeze({
    id: 'drill-untestable-corridor',
    targetId: 'fornix-bilateral',
    title: 'Intraventricular corridor near fornix and TR_A',
    stem: 'During an interhemispheric transcallosal approach to a third-ventricle lesion, the planned trajectory grazes the body of the fornix and anterior thalamic radiation (TR_A). How should intraoperative testing guide protection of these bundles?',
    options: Object.freeze([
      Object.freeze({
        id: 'a',
        label: 'Classify them as anatomy-only (untestable in real time) and protect them through preoperative corridor geometry rather than relying on DES or MEP silence.',
        correct: true,
        rationale: 'Neither fornix episodic memory nor anterior thalamic cognitive loops can be reliably monitored by real-time DES or MEPs; silence on IOM provides false reassurance.',
      }),
      Object.freeze({
        id: 'b',
        label: 'Use HF monopolar train-of-five at 5 mA to measure exact distance to the fornix.',
        correct: false,
        rationale: 'HF monopolar train-of-five elicits motor responses from CST axons and does not stimulate or measure proximity to the fornix.',
      }),
      Object.freeze({
        id: 'c',
        label: 'Rely on continuous counting under awake DES to detect acute fornix injury.',
        correct: false,
        rationale: 'Automatic counting tests speech articulation, not hippocampal-forniceal episodic memory consolidation.',
      }),
    ]),
    sourceIds: ['aggleton2000', 'serra2021'],
  }),
]);
