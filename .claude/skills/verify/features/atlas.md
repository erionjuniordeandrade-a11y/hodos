# 3D atlas

## Sub-features
- HCP surface, parcels, tract bundles rendered in WebGL (Three.js).
- Pathway toggles, parcel selection, Study and Present modes, curriculum list.

## How to get to it (user POV)
Open `/atlas`. The curriculum list is on the left, the brain canvas fills the stage.

## Driving it with verify.mjs
`--only=atlas`. Opens `/atlas?test=1`, waits for `__atlasTest.ready`, records `__atlasTest.frames`, toggles the AF_L bundle via `__atlasTest.togglePathway`, waits for `bundles` to include it and for `frames` to increase, then screenshots `canvas` and requires more than a dozen distinct colours.

## Gotchas
- `ready` fires before the scene is drawn; the new-frame wait is the proof.
- The bundle picker lives in a collapsed tools panel and is not a supported test surface, hence the hook.
- First load fetches large GLB and `tracts.bin` files: allow 45 s under SwiftShader.
