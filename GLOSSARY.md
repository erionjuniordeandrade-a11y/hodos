# Hodos

Hodos is a public neuroanatomy teaching site. It teaches cortex and white-matter relationships through lessons, a reference 3D atlas, a lesion lab, fictional case conferences and one corridor exercise. It is an educational draft, not a clinical tool.

Each term below carries a `_Seen in_` pointer to one file where the term appears. Pointers locate the term; they do not specify behavior.

## Language

### Teaching content

**Lesson**:
One authored teaching unit on a single anatomical question, made of ordered Steps and tied to a Teaching guide. Identified by a kebab-case lesson id such as `motor-cst`.
_Avoid_: Module, chapter, course
_Seen in_: `viewer/lesson_content.js`

**Step**:
One numbered stage inside a Lesson with its own Claim, observation task, Question, Answer and Evidence class.
_Avoid_: Slide, page, section
_Seen in_: `docs/review-sheets/evidence-classes.md`

**Claim**:
The single statement a Step asks the learner to accept or test, bounded by the Evidence class that supports it.
_Avoid_: Finding, conclusion, fact
_Seen in_: `docs/review-sheets/evidence-classes.md`

**Curriculum**:
The ordered grouping of Lessons into three tracks: Foundations, Regional relationships, and Networks and behaviour.
_Avoid_: Syllabus, course list
_Seen in_: `viewer/lesson_briefings.js`

**Teaching guide**:
The per-Lesson framing: a short title, a guiding question, hemisphere and a few Takeaways.
_Avoid_: Briefing, lesson plan
_Seen in_: `viewer/lesson_briefings.js`

**Takeaway**:
One of the few points a learner should leave a Lesson with, each pinned to the Step that teaches it.
_Avoid_: Learning objective, key point
_Seen in_: `viewer/lesson_briefings.js`

**Teach-back**:
The "Explain it" exercise in which the learner writes or speaks an explanation that is matched against the Lesson's Takeaways.
_Avoid_: Self-explanation, quiz, recitation
_Seen in_: `viewer/teachback.js`

**Relationship**:
One authored anatomical connection (for example a Bundle linking two regions) shown in the connections graph and used as lesson evidence. Counts: 85 per `CLAUDE.md`.
_Avoid_: Link, edge, connection (when meaning the authored statement)
_Seen in_: `viewer/connections_data.js`

**Review sheet**:
A generated Markdown print of one Lesson or Case for the owner's review pass. Never hand-edited.
_Avoid_: Handout, lesson export
_Seen in_: `docs/review-sheets/README.md`

**Review status**:
The editorial state of a Lesson or Case, currently `draft`.
_Avoid_: Approval state, version
_Seen in_: `docs/review-sheets/evidence-classes.md`

**Resident kit**:
The Word template and converter through which residents author a Lesson that is then imported.
_Avoid_: Lesson template, authoring pack
_Seen in_: `scripts/resident-kit/docx_to_lesson.py`

### Evidence

**Evidence class**:
The label that states what kind of object supports a Claim. Nine values: atlas, reconstruction, association, schematic, recovery_overlay, functional_measurement, model_metric, experimental_anatomy, conceptual_model.
_Avoid_: Evidence level, evidence type, confidence
_Seen in_: `viewer/lesson_content.js`

**Source**:
A cited publication or credited image attached to a Step, Case or Quote, usually with a PMID and its own Evidence class.
_Avoid_: Reference, citation (use Reference only for dissection photographs)
_Seen in_: `viewer/lesson_references.js`

**Quote**:
A sentence lifted from a Source to back one statement in the Lesion lab, carrying its PMID, section and a contested flag.
_Avoid_: Excerpt, claim
_Seen in_: `viewer/lesion_evidence.js`

**Dissection plate**:
A credited cadaveric photograph from the Rhoton Collection shown unchanged beside a Lesson.
_Avoid_: Figure, dissection image, reference plate (the folder name only)
_Seen in_: `viewer/dissection_references.js`

### Atlas and anatomy

**Atlas**:
The reference 3D scene of cortical surface, parcels, deep structures and Bundles in a shared MNI/RAS space. It is population-level, never an individual brain.
_Avoid_: Viewer, brain model, TractLab (a separate product)
_Seen in_: `viewer/atlas_scene.js`

**Bundle**:
One named white-matter pathway in the Atlas, with a hemisphere suffix, for example `CST_L`.
_Avoid_: Tract (in code and ids), fiber, pathway, fasciculus (as a generic word)
_Seen in_: `viewer/atlas_glossary.js`

**Bundle family**:
A Bundle with its hemisphere suffix removed, so left and right count as one (`CST`).
_Avoid_: Tract group, bundle type
_Seen in_: `viewer/lesion_model.js`

**Lab group**:
The three-way class of a Bundle used by the Lesion lab: Association, Projection or Commissural.
_Avoid_: Bundle category, tract type
_Seen in_: `viewer/lesion_model.js`

**Streamline**:
One reconstructed line inside a Bundle. A displayed sample of streamlines is a drawing choice, not an axon count.
_Avoid_: Fiber, axon, track
_Seen in_: `viewer/atlas_scene.js`

**Sampling**:
The choice of how many Streamlines of a Bundle are drawn or tested.
_Avoid_: Density, coverage
_Seen in_: `docs/review-sheets/sampling-support.md`

**Parcel**:
One atlas-defined cortical region (HCP-MMP1) whose boundary is an atlas boundary, not an individual functional edge.
_Avoid_: Area, region (when the HCP-MMP1 unit is meant), gyrus
_Seen in_: `docs/review-sheets/evidence-classes.md`

**Deep structure**:
A subcortical nucleus from the Melbourne subcortex atlas, shown apart from cortical Parcels.
_Avoid_: Subcortex region, nucleus (generic)
_Seen in_: `viewer/atlas/subcortex.json`

**Network**:
One of the seven Yeo cortical networks (VIS, SMN, DAN, VAN, LIM, FPN, DMN), shown as a coloured wash over Parcels.
_Avoid_: Circuit, system, functional area
_Seen in_: `viewer/atlas_networks.js`

**Slice**:
A 2D cut through the Atlas along an axial, coronal or sagittal plane.
_Avoid_: Section, plane view, cut
_Seen in_: `viewer/atlas_slice.js`

**Scene**:
The saved camera, side, Bundle, Parcel and overlay selection that a Lesson Step asks the Atlas to show.
_Avoid_: View, state, preset
_Seen in_: `viewer/lesson_content.js`

**Study mode / Present mode**:
The two Atlas display modes: Study for reading size with animation, Present for projector-size type with animation off.
_Avoid_: Reading mode, projector mode, presenter mode (the code id `presenter` is internal)
_Seen in_: `viewer/atlas.html`

**Explore anatomy**:
The free-navigation entry into the Atlas from a Lesson, after which the learner can restore the Lesson Scene.
_Avoid_: Free mode, sandbox
_Seen in_: `viewer/anatomy_lesson_player.js`

### Lesion lab

**Lesion lab**:
The exercise in which a learner places a sphere in the Atlas and reads which sampled Streamlines it cuts and what the literature says about them.
_Avoid_: Lesion simulator, lesion planner, resection tool
_Seen in_: `viewer/lesion_lab.js`

**Lesion**:
The illustrative sphere (centre and radius) placed in Atlas space. It is never a tumour boundary or a registered volume.
_Avoid_: Tumour, target (a Target is the MIPS point), cavity
_Seen in_: `viewer/lesion_model.js`

**Cut / Margin / Spared**:
The three states of a Streamline against a Lesion: inside the sphere, inside the added Margin shell, or outside both.
_Avoid_: Damaged, affected, transected, intact
_Seen in_: `viewer/lesion_model.js`

**Margin**:
The extra shell of millimetres added around a Lesion to show which Streamlines lie close to it.
_Avoid_: Buffer, safety margin, resection margin
_Seen in_: `viewer/lesion_model.js`

**Lesion story**:
The plain-language summary the Lesion lab composes from the cut counts and the matching Quotes.
_Avoid_: Report, result text, interpretation
_Seen in_: `viewer/lesion_story.js`

### Case Conference

**Case Conference**:
The practice exercise in which a senior resident rehearses an anatomical interpretation of a fictional glioma case and compares it with an expert debrief.
_Avoid_: Case study, quiz, simulation, MDT
_Seen in_: `viewer/case_conference.js`

**Case**:
One fictional patient vignette with its known and unknown facts, a new finding, a debrief, a rubric and optionally a Decision.
_Avoid_: Patient, scenario, real case
_Seen in_: `viewer/case_content.js`

**Stage**:
One of the ordered screens of a Case: Case, Interpret, Explore, Reconsider, Respond, Debrief, with Decide inserted before Respond when the Case has a Decision.
_Avoid_: Phase (reserved for the MIPS exercise), Step (reserved for Lessons)
_Seen in_: `viewer/case_state.js`

**Decision**:
The optional multiple-choice question in a Case (two to four options) asking which inference best fits the evidence so far.
_Avoid_: Poll, choice, answer
_Seen in_: `viewer/case_content.js`

**Rubric**:
The four self-assessment dimensions of a Case, each rated addressed, partly addressed or revisit.
_Avoid_: Grade, score, marking scheme
_Seen in_: `viewer/case_content.js`

**Review only**:
A path that shows the Debrief without recording a response; it does not count as completing the exercise.
_Avoid_: Skip, preview, read mode
_Seen in_: `viewer/case_state.js`

**Case lesion**:
The labelled illustrative sphere that marks a Case's location in the Atlas.
_Avoid_: Tumour, lesion mask
_Seen in_: `viewer/case_lesions.js`

### MIPS exercise

**MIPS**:
The separate teaching destination that compares two illustrative access corridors to one fictional deep frontal target. The name abbreviates minimally invasive parafascicular surgery.
_Avoid_: Approach planner, surgical planner
_Seen in_: `viewer/mips_content.js`

**Target**:
The one fictional point (centre and radius) that both MIPS corridors aim at.
_Avoid_: Lesion (used in the Lesion lab), tumour
_Seen in_: `viewer/mips_content.js`

**Corridor**:
An illustrative tube from an entry point to the Target, identified as A or B, whose width can be reference or wide.
_Avoid_: Approach, trajectory, route, access volume
_Seen in_: `viewer/corridor_geometry.js`

**Phase**:
One of the three MIPS exercise screens: orient, compare, explain.
_Avoid_: Stage (Case Conference), Step (Lesson)
_Seen in_: `viewer/mips_content.js`

### Product shell

**Landing**:
The public front page at `/` that sends visitors to the Atlas, Lessons, Case Conference and the other destinations.
_Avoid_: Home, index
_Seen in_: `viewer/landing.js`

**Release**:
One immutable exported build in `dist/hodos/` with a file allowlist and content hashes.
_Avoid_: Deploy (a deploy publishes a Release), bundle (reserved for white matter), artifact
_Seen in_: `scripts/build-hodos.mjs`

## Open questions

1. **Bundle vs tract.** Code and ids say "bundle" while the owner's prose, the review sheets and the file names (`tract_ranges.js`, `tracts.bin`) say "tract". Which is canonical?
2. **Phase vs Stage vs Step.** The MIPS exercise uses Phase, Case Conference uses Stage, Lessons use Step, and all three are ordered screens. Should one word cover them?
3. **Relationship counts and "lesson" counts.** `README.md` says 10 lessons and 58 relationships; `CLAUDE.md` says 14 lessons and 85 relationships. Which count is current, and does a Relationship mean a graph row or a lesson-cited pair?
4. **Teach-back vs "Explain it".** The code and tests say teachback; the interface says "Explain it", and the MIPS Phase called "explain" is a different thing. What is the canonical name for the learner-explains exercise?
5. **Lesion vs Target vs Case lesion.** Three illustrative spheres share one shape but have three names across the Lesion lab, MIPS and Case Conference. Are they one concept?
