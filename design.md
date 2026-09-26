# Design — Hodos

The Hodos design system. Direction B2, "direction-encoded", approved by the owner on
2026-09-26 (it replaces the 2026-09-10 Playfair/Inter lock). Every page redesign reads this
file before emitting code. Extend or amend it when the system needs to grow; do not regenerate
per page. Tokens live in `viewer/tokens.css`; the page layers that consume them are
`viewer/hodos.css` and `viewer/landing.css`. The reasoning behind the direction is in
`docs/design-directions-2026-09-26.md`.

## Genre
A reading console for a neuroanatomy coursebook. Scanner graphite page, film white text, and
the tractography direction code (DEC) as the only colour. Principle: colour is data, never
decoration. Preserve: routes, copy, brand, ids, the draft wording, every credit and the
analytics-free markup.

## Macrostructure family
- Landing (/): viewport-sized hero on the plate colour with the atlas loop to the right and a
  plate-to-transparent scrim (the only gradient), a facts row, the four families as a bento with
  a DEC key, featured lessons plus an index with real durations, a lesson walkthrough, a practice
  grid, creator and data sections, an inverted closing band, the shared footer.
- Lesson workspace (app page): Workbench. The atlas is the frame; the lesson panel is the caption
  column. Small functional headings, one phase tab strip (Orient, Compare, Explain), no cards.
- Library, connections, MIPS: Index-First or Workbench within the same tokens.
- Sources and use terms (content page): Long Document. Single column, 62ch measure.

## Theme (tokens.css)
- Page `--color-paper` #1E2227 scanner graphite · raised `--color-paper-2` #262B31 ·
  `--color-paper-3` #2E343B · `--color-stage` #131619 · `--color-plate` #0A0E11 (the
  background of the captured atlas renders, so renders sit seamlessly on it).
- Text `--color-ink` #E4E6E3 film white · `--color-muted` #B2B9C0 · `--color-faint` #949DA7.
- Rules `--color-rule` #3A424B · `--color-rule-2` #5C6671.
- DEC, meaning only: `--color-dec-commissural` #E0605A red (left-right),
  `--color-dec-association` #62B97A green (front-back), `--color-dec-projection` #6A93E8 blue
  (up-down). Families, lesson rows and legends carry their fibre direction; never a button fill.
- No decorative accent: `--color-accent` and `--color-focus` are film white. Links are film white
  with an underline.
- Scientific pigments are not design tokens: parcel focus, context and hover, neutral cortex,
  Yeo-7 and pathway tints stay as the data renderers define them. The atlas renders keep their
  own pigments; DEC colours apply to interface chrome only.

## Typography
- One family: Archivo, vendored variable woff2 (weight 100 to 900, width 62% to 125%).
- Display: 700, expanded (`font-variation-settings:"wdth" 118 to 125`), tight tracking
  (-0.025em to -0.035em). Body: normal width, 400 and 500, 16 px, line-height 1.6.
- Outlier: system monospace, only for atlas codes, coordinates and hashes.
- Scale: major third from 16 px (`--text-xs` … `--text-2xl`, `--text-display`, `--text-title`).
- No em or en dashes in interface text. Middle dot at most once per line.

## Spacing
4-point named scale (`--space-3xs` … `--space-3xl`). Pages use tokens, never raw values.
Page gutter `clamp(1rem, 3vw, 2.5rem)`. One radius, 2 px. Controls share a 44 px height.

## Motion
- `--ease-out` cubic-bezier(0.16, 1, 0.3, 1) for entries, `--ease-in` for exits.
  Durations 120 / 220 / 420 ms. Only `transform` and `opacity` animate.
- Landing motion is pre-rendered video of the real atlas, never live WebGL on the landing:
  the hero loop, the four family loops and the lesson walkthrough (screens wider than 700 px).
  Every clip is muted, `playsinline`, `preload="none"`, loaded when near the viewport, plays
  only while on screen, sits over a still image and has a visible pause control.
- No video under reduced motion or Save-Data; the stills stay. Reduced motion also collapses
  transitions and disables the atlas fibre animation.
- Recordings of the interface must say so in their caption and mark the pointer.

## Microinteractions
- Silent success (a reviewed lesson changes its own label; no toast).
- Focus rings appear instantly, 2 px film white, 2 px offset, on every control.
- Buttons: active scales to 0.97; disabled uses opacity, cursor and the attribute.

## CTA voice
- Primary: film white fill with graphite text, 2 px radius, label ≤ 3 words, never wraps.
- Secondary: hairline outline in `--color-rule-2`, same height.

## What pages must share
Wordmark and mark; Archivo; film white links and focus; DEC colours with fixed meanings; CTA
voice; hairline rows; the footer colophon; the header (wordmark left, a quiet cluster right).

## What pages may differ on
Macrostructure within the family; the presence of the atlas (sources has none); measure.

## Exports
### tokens.css
See `viewer/tokens.css` (complete token block, the only source of colour and type values).
