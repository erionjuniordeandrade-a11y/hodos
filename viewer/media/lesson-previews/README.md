# Featured lesson plates

Captured on 2026-09-19 from the installed Hodos reference atlas at source commit
`d0ae63c`, using `scripts/capture-lesson-previews.mjs`. Each image is the actual
atlas canvas, including its labels and orientation axes. Geometry, colours,
laterality and anatomical proportions were not edited. No generated anatomy or
Amy Sterling / Eyewire artwork is included.

All scenes use `step=0&phase=orient&hemi=L`. The lesson id selects the exact
authored camera and layers; viewport shape affects framing. The capture used a
1440 by 1000 CSS-pixel viewport, device scale factor 2, and reduced motion.

| Plate / lesson id | Captured anatomy | Dimensions | SHA-256 |
| --- | --- | --- | --- |
| `plate-motor-cst-20260919.jpg` / `motor-cst` | Left lateral central region, HCP-MMP1 4, 3b and 6d | 1796 x 1478 | `2dbc25dab0c51980768900d5524bc86495475094f8f7247d189525de4d2b026a` |
| `plate-fat-language-20260919.jpg` / `fat-language` | Left FAT sample, parcels 44, 6ma and 6mp | 1796 x 1478 | `bae7574daf57c957a28d2a797f071e5cf3fa53a7178f016490f3b5257c1458aa` |
| `plate-default-mode-network-20260919.jpg` / `default-mode-network` | Left medial Yeo-7 default network | 1796 x 1470 | `7c3752498eb6765f2649f89b582c654c61da74b2397e6a52d1a00b023c238bb6` |

Recaptured 2026-09-28 from the same scenes after the B2 CSS-token redesign, using the same
script and query params, against the current served build (branch
`feat/css-tokens-and-lesson-previews`). The 2026-09-19 files above are kept, not deleted; the
landing page now points at the rows below.

| Plate / lesson id | Captured anatomy | Dimensions | SHA-256 |
| --- | --- | --- | --- |
| `plate-motor-cst-20260928.jpg` / `motor-cst` | Left lateral central region, HCP-MMP1 4, 3b and 6d | 1796 x 1478 | `925ea3e27bbbb33ad575f553e28cc3805236ce0bc49c7b374a857b79402d25b4` |
| `plate-fat-language-20260928.jpg` / `fat-language` | Left FAT sample, parcels 44, 6ma and 6mp | 1796 x 1478 | `9b5573c9a45a7941e11450ee028922d4b2d129194666964eddf8134e31acbab6` |
| `plate-default-mode-network-20260928.jpg` / `default-mode-network` | Left medial Yeo-7 default network | 1796 x 1470 | `a90a71be2a0990a555ad1433ea232191603b8678f33ddbadeb37d142878dc23d` |

Source datasets and their terms remain those documented on Hodos's Sources
page and in `THIRD_PARTY_NOTICES.md`: HCP group surface and HCP-MMP1 parcels,
HCP1065 sampled tractography, and the Yeo-7 group network partition. These
derived reference images do not establish patient anatomy, measured function
or surgical safety. The original datasets' terms continue to apply.

To reproduce, run the capture script against a local source viewer server and
choose a fresh output directory. It writes images and a scene-state receipt;
inspect both before adopting a new versioned plate.
