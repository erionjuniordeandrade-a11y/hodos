# Hodos · two features borrowed from the Clinical Neuroanatomy Atlas pattern — 2026-09-14

Source reviewed: https://aycibatuhan.github.io/nervous-system-atlas/ (Ayci B., Apache-2.0 code,
CC BY-SA 4.0 content). Nothing was copied from it: no code, no meshes, no text. Two IDEAS were
borrowed and rebuilt for Hodos, with Hodos data and Hodos honesty rules. Bilingual UI: deferred
by the owner ("no bilingual now").

## 1. Fictional lesion markers in Case Conference (`viewer/case_lesions.js`)
- One illustrative sphere per case in atlas mm (MNI RAS, the tracts.json space), with a side, a
  Glasser focus set, bundle families, ghost families, surface opacity and a camera flight.
  Values authored here, not measured: 01 L medial frontal (-8,2,58) · 02 L insula (-38,0,2) ·
  03 L temporoparietal (-52,-46,20) · 04 R medial frontal (8,4,58); radius 16 mm.
- Scene grammar v4: `DEFAULT_SCENE.lesion` (null = a step says nothing), validated in
  `lesson_content.js`, passed through `resolveScene`, drawn by `atlas_scene.setLesion`
  (translucent sphere + wire halo, never picked), applied in `applySceneEffects`.
- Route: `atlas.html?caseReference=1&case=<id>` places the marker + focus set and shows the
  status line "Fictional lesion marker · … Not a tumour boundary …". Case Conference gained a
  "Lesion marker · …" reference button per case (`case_conference.js`), opening that route in
  the existing reference dialog. Nothing persisted.
- Verified in Playwright on the export: all four markers, bundles, focus parcels, status text,
  dialog iframe src, 0 console errors; renders eyeballed (scratchpad lesion/*.png).

## 2. Arterial-territory wash (`viewer/atlas_arterial.js`, `sets.arterial2`)
- Data: Liu CF et al., Digital 3D Brain MRI Arterial Territories Atlas, Sci Data 2023;10:74,
  PMID 36739282 (esummary-verified), CC BY-SA 4.0, level 2 collapsed to ACA/MCA/PCA/VB per
  hemisphere (side ids merged, lateral ventricle → 0). Sampled per vertex onto the shipped
  fs_LR 32k GLB vertex order (order proven by reproducing the shipped Glasser block byte-for-byte
  from the upstream label.gii through the same Draco permutation), nearest voxel then nearest
  labelled voxel within 4 mm. Unlabelled: L 326 · R 349 of 32,492.
- ⛔ The atlas NIfTI header has sform_code 2 with NO translation. Voxel→world used the FSL
  MNI152 1 mm affine [-1,0,0,90; 0,1,0,-126; 0,0,1,-72]; checked independently: 98 % of an
  FSL-space cortical atlas's voxels are covered in voxel-index space (shifts of 10 voxels drop it),
  and V1→PCA, SFL/8BM/6mp→ACA, PF/STV→MCA at 100 % purity. Recorded in surface.json.space_note.
- Files: `viewer/atlas/surface-labels.bin` = original 389,904 bytes unchanged + 129,968-byte
  block at offset 389904 (519,872 total); `surface.json` +sets.arterial2; `manifest.json`
  re-hashed with terms/modifications; `MANIFEST_SHA256` re-pinned in atlas_scene.js.
  Level-1 (14 sub-territories) sampled too but NOT shipped: scratchpad arterial/ (report.json,
  NOTES.md, raw_lvl1_*.npy, step*.py).
- UI: "Arterial territories" select + legend beside the network control; URL key `art=`
  (all | ACA | MCA | PCA | VB); exclusive with the Yeo-7 wash; per-vertex readout on click;
  readout copy names the template and the limits. Sources page gained a section.
- Verified: unit tests (69 pass, incl. new atlas_arterial.test.js majority checks), export builds,
  Playwright state checks (boot from URL, focus, exclusivity both directions, click note), renders
  eyeballed lateral/medial/MCA (scratchpad arterial/art-*.png).

## Not done / owner
- Not committed, not deployed (owner deploys). Diff: `git status` in ~/hodos.
- Owner clinical review of the four marker positions (illustrative, but they teach).
- Lesson steps could now carry `lesion:`; none do.
- Bilingual pattern (typed EN/pt-BR string tables) deferred.
