# Cinematic view design decisions, 2026-11-06

Owner accepted every recommendation below. Terms follow `GLOSSARY.md`.
The source prototype is `~/hodos-cinematic-proto/`, which is not a git repo.

## Scope

1. Cinematic view lives on `/atlas` only. Lessons reach it through `/atlas?lesson=<id>`.
2. It is a view inside the Atlas, not a separate page. It keeps the selection, camera and deep link.
3. It is for looking and engagement. It adds no Claims.
4. All prototype features carry over except the intro flight: Lit streamlines, Direction colour, Peel, Shots, ambient occlusion, depth of field.
5. Phones get the Fast Quality tier.
6. The owner reviews the anatomy wording of Shot names and labels before deploy. The deploy stays owner-authorized.

## Naming

7. "Cinematic view", not "Cinematic mode". Study mode and Present mode remain the only modes.
8. "Shot", not "preset". A Shot is a camera position plus a Peel amount.

## Behaviour

9. A Shot moves only the camera and the Peel. It never changes the selected Bundles.
10. Lit streamlines use Direction colour, with a small legend.
11. A Peel slider; each Shot also sets it.
12. Entry is a Views menu item plus the URL parameter `view=cinematic`. The toolbar is unchanged.
13. Hover, picking and labels keep working. Opening the slice panel or a Lesson Scene leaves Cinematic view.
14. Quality steps from High to Fast when the median frame time exceeds 33 ms. Touch screens with a short side under 820 px start in Fast. A manual High/Fast switch exists.
15. With no Bundle selected, entry selects a default set of 12 Bundles suited to Shot 1. An existing selection stays untouched.
16. The "Educational draft" notice and the data credits stay visible.
17. With `prefers-reduced-motion`, Shots jump and the Peel changes without animation.
18. ~~No image export in v1.~~ The owner reversed this on 2026-11-06. Add Stills, which are PNGs up to 4K. Add Clips, which are MP4s rendered in the browser: a turntable, a Peel reveal or a flight through Shots, at 1920×1080 or 1080×1920, 5, 10 or 15 s long. Both are follow-up tickets after the core view. Both carry the credit line and the draft notice.
19. Five Shots, from prototype shots 1, 2, 3, 6 and an axial view. Claude drafts plain names; the owner corrects them at review.

## Constraints found in the code on 2026-11-06

- The four existing visual-regression scenes must stay pixel-identical, so Cinematic view is off by default.
- Hodos vendors three.js r186.1 with CameraControls. The prototype uses three 0.170 from a CDN with OrbitControls. Reuse its tube geometry, Peel shader, depth-of-field shader and Shot data. Rebuild the rest on `viewer/render_pipeline.js`.
- The GTAOPass class is not vendored yet. New modules must enter the exporter allowlist in `scripts/build-hodos.mjs`.
- `MAX_BUNDLES` is 12 at `viewer/bundle_picker.js:8`. A Bundle has 54 to 220 Streamlines.
- On an M5 Max at 1440×900, the prototype's High tier drew 2.14M triangles at a median 25 ms per frame. Fast drew 0.71M triangles at a median 8.4 ms. Nobody has measured it on a phone.
