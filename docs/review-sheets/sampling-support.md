# Reading a sparse or incomplete tractogram

Lesson id: `sampling-support` · Minutes: 8 · Review status: draft

**Summary:** Distinguish visibility, reconstruction and quantitative support through practical display comparisons.

**Goals:**
  - Separate hidden anatomy from missing reconstruction.
  - Explain why displayed line count is not fibre count.
  - Describe an unresolved tract without declaring it absent.

**Audience:** Neurosurgical residents

## Opening question

A tract looks short and sparse. How do you describe the discrepancy without declaring it absent?

## Three takeaways

1. Check whether visibility and cortical opacity explain what is missing on screen. _(step 0: A hidden segment is not a missing segment)_
2. Displayed lines and vertices are sampling choices, not axon counts. _(step 1: Line count is a sampling choice)_
3. State the unresolved reconstruction question and the evidence needed to investigate it. _(step 3: Report an unresolved reconstruction honestly)_

## Steps

### Step 0: A hidden segment is not a missing segment

**Claim:** Cortex can obscure the bundle beneath it. Changing transparency is a display experiment: it tests visibility while preserving the reconstruction being viewed.

**Observe:** Open Explore anatomy and change Cortical surface from Defined toward Transparent. Compare the same CST sample, then restore the lesson scene.

**Anatomy:**
  - The cortical layer and the pathway are separate display objects.
  - Showing a previously obscured segment changes what you can see, not the underlying diffusion acquisition.

**Surgical:** Before explaining an apparent interruption biologically, establish whether the segment is hidden by display settings or absent from the reconstruction.

**Question:** What has been established when a segment appears after changing opacity?

**Answer:** That the previous display obscured it. This isolates a visibility issue. It does not demonstrate new fibres, improved reconstruction accuracy or functional preservation.

**Evidence Class:** schematic

**Notes:** Ask the learner to answer before opening the explanation. Compare the answer with the named structures and the cited method. Teaching point: That the previous display obscured it. This isolates a visibility issue. It does not demonstrate new fibres, improved reconstruction accuracy or functional preservation.

**Sources:**
- **D2** — Yeh, 2022 · population-based tract-to-region connectome of the human brain (PMID 35995773) — atlas
- **M10** — Farquharson et al., 2013 · why we need to move beyond DTI (PMID 23540269) — reconstruction
- **M11** — Maier-Hein et al., 2017 · the challenge of mapping the connectome with diffusion tractography (PMID 29116093) — reconstruction

### Step 1: Line count is a sampling choice

**Claim:** A dense bundle can look authoritative even when the apparent density is largely a display choice. Compare the named samples without treating their number of lines as an axon census.

**Observe:** Compare CST and OR as separately identified samples. Read the sampled-path caption and distinguish the displayed population from biological fibre number.

**Anatomy:**
  - The installed atlas caps the number of displayed paths per bundle.
  - A streamline can represent a model trajectory without corresponding one-for-one to an axon.

**Surgical:** Do not use a thicker-looking rendered bundle as a direct explanation of greater functional reserve. A quantitative claim needs an appropriate measurement model.

**Question:** Does twice as many displayed streamlines mean twice as many axons?

**Answer:** No. Seeding, reconstruction, selection and display sampling affect the count. The atlas caption describes sampled paths; it is not a histological measurement or a measure of functional reserve.

**Evidence Class:** model_metric

**Notes:** Ask the learner to answer before opening the explanation. Compare the answer with the named structures and the cited method. Teaching point: No. Seeding, reconstruction, selection and display sampling affect the count. The atlas caption describes sampled paths; it is not a histological measurement or a measure of functional reserve.

**Sources:**
- **D2** — Yeh, 2022 · population-based tract-to-region connectome of the human brain (PMID 35995773) — atlas
- **S8** — Smith et al., 2015 · SIFT2 (DOI 10.1016/j.neuroimage.2015.06.092) — model_metric
- **M10** — Farquharson et al., 2013 · why we need to move beyond DTI (PMID 23540269) — reconstruction
- **M11** — Maier-Hein et al., 2017 · the challenge of mapping the connectome with diffusion tractography (PMID 29116093) — reconstruction

### Step 2: A model weight is not a truth probability

**Claim:** SIFT2 adjusts streamline contributions to make a tractogram agree more closely with a diffusion-derived fibre-density model. That is a different quantity from the chance that a connection is anatomically correct.

**Observe:** Inspect the sample without assigning significance to brightness. State what extra measurement would be needed to make a quantitative claim; no SIFT2 values are installed in this atlas.

**Anatomy:**
  - SIFT2 weights belong to a model fit and its tractogram.
  - The atlas display provides geometry and sampling information, not a probability of functional preservation.

**Surgical:** When a tractogram includes a numerical metric, ask what it measures before incorporating it into a clinical explanation. A familiar-looking score can answer a different question from the one you need.

**Question:** Can a high SIFT2 weight be read as a high probability that an entire connection is true?

**Answer:** No. It is a model-derived contribution to the fit, not a calibrated connection-truth probability. It also does not measure an individual pathway’s functional integrity. This atlas supplies no such weights to inspect.

**Evidence Class:** model_metric

**Notes:** Ask the learner to answer before opening the explanation. Compare the answer with the named structures and the cited method. Teaching point: No. It is a model-derived contribution to the fit, not a calibrated connection-truth probability. It also does not measure an individual pathway’s functional integrity. This atlas supplies no such weights to inspect.

**Sources:**
- **S8** — Smith et al., 2015 · SIFT2 (DOI 10.1016/j.neuroimage.2015.06.092) — model_metric

### Step 3: Report an unresolved reconstruction honestly

**Claim:** Teaching vignette: a tract is expected anatomically but appears short and sparse. Describe the discrepancy and identify the next kind of evidence needed, without turning absence on screen into absence in the brain.

**Observe:** Inspect OR from two views and alter transparency once. Separate a visibility finding from an unresolved question about the reconstruction.

**Anatomy:**
  - Tracking near complex fibre configurations is sensitive to the orientation model and method.
  - An absent reconstruction can coexist with anatomy or function that requires another form of assessment.

**Surgical:** A useful report says what was reconstructed, where it was incomplete and which limitation remains unresolved. It should not declare tissue expendable from a failed visualization.

**Question:** What is a better conclusion than “the tract is absent, so there is no risk”?

**Answer:** “The pathway was not adequately demonstrated by this reconstruction.” State the method and discrepancy, then reconcile them with individual structural and functional evidence. The statement preserves uncertainty without hiding the actual observation.

**Evidence Class:** reconstruction

**Notes:** Ask the learner to answer before opening the explanation. Compare the answer with the named structures and the cited method. Teaching point: “The pathway was not adequately demonstrated by this reconstruction.” State the method and discrepancy, then reconcile them with individual structural and functional evidence. The statement preserves uncertainty without hiding the actual observation.

**Sources:**
- **M10** — Farquharson et al., 2013 · why we need to move beyond DTI (PMID 23540269) — reconstruction
- **M11** — Maier-Hein et al., 2017 · the challenge of mapping the connectome with diffusion tractography (PMID 29116093) — reconstruction
- **D2** — Yeh, 2022 · population-based tract-to-region connectome of the human brain (PMID 35995773) — atlas

## Full source list

- **D2** — Yeh, 2022 · population-based tract-to-region connectome of the human brain (PMID 35995773) — atlas
- **M10** — Farquharson et al., 2013 · why we need to move beyond DTI (PMID 23540269) — reconstruction
- **M11** — Maier-Hein et al., 2017 · the challenge of mapping the connectome with diffusion tractography (PMID 29116093) — reconstruction
- **S8** — Smith et al., 2015 · SIFT2 (DOI 10.1016/j.neuroimage.2015.06.092) — model_metric

## Review checklist

- [ ] anatomy correct
- [ ] sources support claims
- [ ] wording OK
- [ ] approve to reviewed

Notes:
