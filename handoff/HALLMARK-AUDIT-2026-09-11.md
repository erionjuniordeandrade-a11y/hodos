# Hodos: Hallmark audit (2026-09-11)

Scope: home (library), lesson workspace (brief, orient, compare, explain, recap), Explore with
Layers, sources page. Rendered at 1440, 1280, 768, 414, 390, 375, 320 px from the working
tree on port 51040, after the pre-production audit fixes of the same day. Read-only; nothing
below has been changed yet.

Design read: redesign in preserve mode. Genre editorial, tone luxury (owner choice), dark
paper locked page-wide, one ice accent, Playfair Display display face, logo A. Dials:
variance 5, motion 3, density 5. The lesson workspace is product UI; landing-page rules
apply to the home and sources pages only.

## Critical (ships as slop)

1. Two-line clickable text (gate 49). "Review final relationship" wraps at every width
   including 1440; "Start learning · 01 Read the evidence" and "Explore anatomy" wrap at
   320 to 768; the profile select truncates to "Present · p".
   Where: `anatomy_lesson_player.js` (labels), `atlas.html` select options.
   Fix: shorten labels ("Start lesson 01", "Explore", "Final relationship", "Study" /
   "Present"), `white-space:nowrap` on nav buttons.
2. Five stacked palettes. `lesson_player.css` (navy/gold), `atlas.css` (navy/gold),
   `atlas-theme.css` (light cream/plum), `anatomy_workbench.css`, `atlas-design.css`
   (graphite/ice) load in sequence and override each other: 283 inline hex values, focus
   rings gold in one sheet and ice in another, `--reading` defined twice with different
   serifs. Mid-render token improvisation (gate 48) at file scale.
   Fix: one token block, one workbench sheet; retire the light theme sheet from the atlas
   pages.
3. Mono as a third display face (gates 37, 38). Lesson titles on the home catalogue,
   outline summaries, stage subheads, kickers and catalogue meta all render in the system
   monospace: 27 mono declarations across 5 sheets. The most important text on the home
   page is set in mono.
   Fix: mono only for atlas codes and coordinates (two slots); everything else in the body
   face.
4. Split header / floating top-right lede on the home hero. "Anatomy, in context." left,
   explainer floating at the right margin with no alignment partner.
   Where: `atlas.html` `.intro`, `anatomy_workbench.css` `.intro{align-items:end}`.
   Fix: stack headline and lede in one column, measure 45 to 60 ch.

## Major (reads as generated)

5. Eyebrow on every surface: A COURSEBOOK FOR NEUROSURGICAL RESIDENTS, THE HODOS COURSEBOOK,
   REFERENCE ANATOMY, ATLAS PARCEL · HCP–MMP1, ORIENT · Regional anatomy, TAKE IT INTO YOUR
   NEXT DISCUSSION, PROVENANCE & USE TERMS · RESEARCH ONLY · NOT NAVIGATION. Seven uppercase
   tracked labels, all in the accent colour, so the accent is everywhere and emphasises
   nothing.
   Fix: zero eyebrows on home and sources; keep one small phase label inside the lesson.
6. Middle-dot as universal separator: 86 in the UI strings, up to four per line
   ("Hodos · Brain networks & white matter tracts · intra-axial surgery", "Educational
   draft 2026-09-11.2 · anatomical review pending").
   Fix: one per line at most; use line breaks, columns or sentences.
7. Card-in-card. Bordered workspace containing a bordered stage; the brief's question and
   the explain block sit in tinted cards inside the bordered panel inside the workspace.
   Fix: one containment layer (the stage). Panel content uses rules and space.
8. AI nav fingerprint (gate 42): wordmark left, four inline text buttons, a select and a
   link right, hairline bottom border. "Find anatomy" and "Layers" are atlas tools, not
   destinations.
   Fix: N9 edge-aligned minimal. Left wordmark; right a two-way mode switch (Learn / Explore)
   and Sources. Atlas tools move onto the stage toolbar.
9. Layers is a fixed overlay that covers the readout and the scene key; on Explore the
   right column is empty while the controls float over the atlas.
   Fix: dock Layers in the right column in Explore mode; no overlay at desktop.
10. Redundant readouts: phase tab "01 Orient" directly above kicker "ORIENT · Regional
    anatomy"; parcel named three times ("Left · area 4", callout "L · 4", Layers select).
    Fix: drop the kicker; readout shows the parcel once with its role.
11. Radius drift: 0, 2, 3, 4, 5, 6, 8 and 999 px across the sheets (shape lock, 4.4).
    Fix: one 2 px radius everywhere, pills nowhere.
12. Display face inconsistency: sources page h1 and the drawer heading are bold system sans;
    home and lessons use Playfair.
    Fix: Playfair for every h1/h2, roman only.
13. Body face is the OS default while the owner's house body is Inter. Inter's OFL declares
    no Reserved Font Name, so a subset woff2 can ship (Playfair's OFL does declare one,
    which is why it stays a full TTF).
    Fix: vendor Inter Latin woff2, weights 400/500/600, `font-display:swap`.
14. Numbered step tabs "01 Orient / 02 Compare / 03 Explain" (generic step numbering).
    Fix: "Orient / Compare / Explain".
15. Marketing sentence in the footer of a resident tool ("Neurosurgeon · brain tumors,
    pituitary tumors & skull base surgery · Porto Alegre"). Owner decision; the sources page
    already carries the bio.
16. Presenter mode changes only type size; the option label promises a projector mode.
    Fix: presenter hides the stage toolbar and outline, enlarges the readout, keeps type.

## Minor (taste)

17. En dashes in glossary names ("frontal–parahippocampal") and "HCP–MMP1"; use hyphens.
18. Arrow glyph "↗" at the end of every catalogue row (decorative dot pattern).
19. Ad-hoc spacing (no scale): 16, 20, 22, 23, 24, 28, 36 px paddings in one sheet.
20. Stage subhead truncates with an ellipsis on phones ("Both hemispheres · left la…").
21. "Educational draft" line repeated on every step, brief, footer and sources page (owner
    decision on wording; repetition is a design issue).
22. Explore scene key opens as a popover that covers the brain instead of sitting in the
    readout band.

## Passes

Dark theme locked page-wide. No pure black or white. No gradients, no glow, no
`transition:all`, no bouncy easings, no scroll-triggered reveals. No horizontal scroll at
320 to 1920. Focus-visible rings everywhere. Reduced motion honoured. Real 3D content the
user manipulates, so three.js is justified. Loading, empty and error states present.
Callout colours match the mesh. Sources page provenance is exemplary.

Summary: 4 critical · 12 major · 6 minor. Verdict: reads as generated in the chrome (nav,
eyebrows, mono, separators) while the content and the stage are already strong.
