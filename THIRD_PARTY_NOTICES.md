# Third-party notices

Original Hodos software and documentation are MIT licensed; see LICENSE.
The third-party assets and software below retain their own terms and are
excluded from the original-work license grant.

## human-brain tract pulse technique

Hodos derives from the TractLab teaching atlas and acknowledges
[human-brain](https://github.com/amyleesterling/human-brain), including the
reference geometry preparation and MIT-licensed picking approach below.

MIT License

Copyright (c) 2026 Amy Sterling

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Reference atlas package

The separate atlas viewer includes public reference assets prepared by Amy
Sterling, pinned at human-brain commit
`e02876655d0216995340a9c153d37d49ff649078`. These assets have their upstream
data terms, separate from the software MIT license. The vertex correspondence
and nearest-corner picking technique are adapted from her MIT-licensed
`js/brain-surface.js`. No H01 assets or copied lesson prose are included.

- HCP S1200 cortex and paired HCP-MMP1 labels: [HCP Open Access Data Use
  Terms](viewer/atlas/licenses/hcp-data-use-terms.txt). Van Essen et al., 2013,
  doi:10.1016/j.neuroimage.2013.05.041; Glasser et al., 2016,
  doi:10.1038/nature18933. The compressed vertex order is preserved; only the
  Glasser block is extracted from the label container.
- HCP1065 sampled tract geometry: Yeh, 2022,
  doi:10.1038/s41467-022-32595-4, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
  This binary and its metadata remain under CC BY-SA 4.0. The sample has at
  most 220 streamlines per bundle, resampled to 28 points by the reference
  preparation pipeline. [Upstream terms](https://brain.labsolver.org/hcp_trk_atlas.html).
- Melbourne Subcortex scale 1 geometry: Tian et al., 2020,
  doi:10.1038/s41593-020-00711-6, [Melbourne license](viewer/atlas/licenses/melbourne-subcortex.txt).
  Label surfaces were smoothed by the reference pipeline; thalamic subdivisions
  are merged. No precise nuclei or biological routes are inferred.
- Inferior template context derived from the MNI152NLin2009cAsym brain mask:
  Fonov et al., 2011, doi:10.1016/j.neuroimage.2010.07.033,
  [MNI permission notice](viewer/atlas/licenses/mni-template-license.txt).
  This is a mask remainder, not a named cerebellar or brainstem segmentation.

Data were provided in part by the Human Connectome Project, WU-Minn Consortium
(Principal Investigators: David Van Essen and Kamil Ugurbil; 1U54MH091657)
funded by the 16 NIH Institutes and Centers that support the NIH Blueprint for
Neuroscience Research; and by the McDonnell Center for Systems Neuroscience
at Washington University.

The exact source/output hashes and modifications are recorded in
`viewer/atlas/manifest.json`. Different reference constructions share an MNI
display convention; this juxtaposition supplies no cross-atlas quantitative
registration or patient-to-atlas mapping.

## Three.js and Draco

Three.js 0.185.0 and its bundled Draco decoder are vendored in `viewer/vendor/`.
The Three.js MIT license is in `viewer/vendor/LICENSE.md`; Draco's license
and author notices are in `viewer/vendor/addons/libs/draco/LICENSE` and
`viewer/vendor/addons/libs/draco/AUTHORS`, retrieved from the official
google/draco repository on 2026-09-11. Runtime files are served locally;
no external CDN or telemetry is used.

## vis-network and vis-data

vis-network 9.1.9 and vis-data 7.1.9 (peer UMD builds, from the npm registry on 2026-09-26) are
vendored in `viewer/vendor/` and draw the graph on the Connections page. They are dual licensed
Apache-2.0 OR MIT and are used under MIT; the license text is in `viewer/vendor/vis-LICENSE.md`.
Served locally; no external CDN.

## Archivo

Archivo, Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo). SIL Open Font License 1.1. Shipped as a Latin variable subset (`viewer/vendor/fonts/archivo-latin.woff2`); licence text in `viewer/vendor/fonts/Archivo-OFL.txt`.

## Hodos dissection references

The five source PNGs in `viewer/reference-plates/` retain their original
watermarks and highlighting. K. Yagmurlu. Courtesy of the Rhoton Collection,
American Association of Neurological Surgeons (AANS)/Neurosurgical Research and
Education Foundation (NREF).

Educational reuse terms: https://www.aans.org/education-publications/references/the-rhoton-collection/
(checked 2026-09-11). See `viewer/reference-plates/README.md` and `manifest.json`
for source locators, hashes, limitations and other-use conditions. The terms for
these photographs are separate from the atlas data and software licences above.


