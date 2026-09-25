# Reading a sparse or incomplete tractogram

Lesson id: `sampling-support` · Minutes: 8 · Review status: draft

## Opening question

A tract looks short and sparse. How do you describe the discrepancy without declaring it absent?

## Three takeaways

1. Check whether visibility and cortical opacity explain what is missing on screen. _(step 0: A hidden segment is not a missing segment)_
2. Displayed lines and vertices are sampling choices, not axon counts. _(step 1: Line count is a sampling choice)_
3. State the unresolved reconstruction question and the evidence needed to investigate it. _(step 3: Report an unresolved reconstruction honestly)_

## Steps

### Step 0: A hidden segment is not a missing segment

**Claim:** Cortex can obscure the bundle beneath it. Changing transparency is a display experiment: it tests visibility while preserving the reconstruction being viewed.

**Sources:**
- **D2** — Yeh, 2022 · population-based tract-to-region connectome of the human brain (PMID 35995773) — atlas
- **M10** — Farquharson et al., 2013 · why we need to move beyond DTI (PMID 23540269) — reconstruction
- **M11** — Maier-Hein et al., 2017 · the challenge of mapping the connectome with diffusion tractography (PMID 29116093) — reconstruction

### Step 1: Line count is a sampling choice

**Claim:** A dense bundle can look authoritative even when the apparent density is largely a display choice. Compare the named samples without treating their number of lines as an axon census.

**Sources:**
- **D2** — Yeh, 2022 · population-based tract-to-region connectome of the human brain (PMID 35995773) — atlas
- **S8** — Smith et al., 2015 · SIFT2 (DOI 10.1016/j.neuroimage.2015.06.092) — model_metric
- **M10** — Farquharson et al., 2013 · why we need to move beyond DTI (PMID 23540269) — reconstruction
- **M11** — Maier-Hein et al., 2017 · the challenge of mapping the connectome with diffusion tractography (PMID 29116093) — reconstruction

### Step 2: A model weight is not a truth probability

**Claim:** SIFT2 adjusts streamline contributions to make a tractogram agree more closely with a diffusion-derived fibre-density model. That is a different quantity from the chance that a connection is anatomically correct.

**Sources:**
- **S8** — Smith et al., 2015 · SIFT2 (DOI 10.1016/j.neuroimage.2015.06.092) — model_metric

### Step 3: Report an unresolved reconstruction honestly

**Claim:** Teaching vignette: a tract is expected anatomically but appears short and sparse. Describe the discrepancy and identify the next kind of evidence needed, without turning absence on screen into absence in the brain.

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
