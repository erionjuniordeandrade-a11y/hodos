# 3. Zero-WebGL 2D anatomical projection for Testing guide paired with on-demand 3D Lesion lab

Date: 2026-11-25. Status: accepted.

## Context

Surgeons and residents use Hodos across two distinct moments: rapid pre-op or OR-corridor lookup on phones and hospital workstations (where a 2–5 s WebGL boot and ~20 MB atlas download create friction), and interactive 3D spatial rehearsal of white-matter crossings and battery blind spots. We considered booting Three.js directly on `/` and embedding live WebGL inside `/testing`.

## Decision

Keep `/` (pre-rendered hero) and `/testing` (2D anatomical brain territory map) strictly zero-WebGL, using static SVG anatomy pre-extracted from Hodos's own HCP S1200 cortical meshes, HCP-MMP1 parcel boundaries, and HCP1065 tract centerlines. Pair `/testing` and `/labs/lesion-lab` with direct cross-links (`2D Testing Map` ↔ `3D Lesion Lab`) carrying synchronized `?hemi=` and `?preset=`/`?territory=` URL state so 3D WebGL loads only when the learner steps into the 3D lab.

## Consequences

- `/testing` loads instantaneously on mobile and hospital networks while preserving exact anatomical fidelity from the same HCP reference data used in 3D.
- Both surfaces share one pure domain model (`viewer/testing_model.js`) and one canonical terminology (`GLOSSARY.md`) without duplicating WebGL lifecycle overhead on reference pages.
