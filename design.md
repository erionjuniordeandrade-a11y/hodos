# Design — Hodos

A locked design system for the Hodos coursebook. Every page redesign reads this file before
emitting code. Extend or amend this file when the system needs to grow; do not regenerate per
page. Tokens live in `viewer/tokens.css`; the page layer that consumes them is `viewer/hodos.css`.

## Genre
Editorial, tone luxury. Dark paper locked page-wide. Owner palette of 2026-09-10 (graphite,
bone, one ice accent, sand for context parcels) and the logo A. Preserve mode: routes, copy,
brand, ids and analytics-free markup stay.

## Macrostructure family
- Home (library): Index-First. One stacked paragraph introduces the index; the live atlas is the
  only enrichment, sticky beside a categorised list with hairline rows.
- Lesson workspace (app page): Workbench. The atlas is the frame; the lesson panel is the caption
  column. Small functional headings, one phase tab strip, no cards.
- Sources and use terms (content page): Long Document. Single column, 62ch measure, inline
  section heads, typographic links.

## Theme (tokens.css)
- `--color-paper` oklch(18% 0.008 248) · `--color-paper-2` oklch(21.5% 0.010 248) ·
  `--color-stage` oklch(16.2% 0.008 248)
- `--color-ink` oklch(92.9% 0.012 85) · `--color-muted` oklch(74.2% 0.009 248) ·
  `--color-faint` oklch(60.4% 0.012 248)
- `--color-rule` oklch(34.9% 0.015 248) · `--color-rule-2` oklch(52.9% 0.021 246)
- `--color-accent` oklch(86.8% 0.073 213) ice · `--color-accent-ink` oklch(18.8% 0.017 225) ·
  `--color-focus` = accent
- Scientific pigments are not design tokens: parcel focus (ice), context (sand), neutral cortex,
  Yeo-7 palette and pathway tints stay as the data renderers define them.

## Typography
- Display: Playfair Display 500, roman only, tracking -0.01em. Wordmark 600.
- Body: Inter 400 and 500, vendored Latin woff2 (OFL, no reserved name). 16 px, line-height 1.6.
- Outlier: system monospace, only for atlas codes, coordinates and hashes. Two slots per page.
- Scale: major third from 16 px. Display `clamp(2.5rem, 3.2vw + 1rem, 4rem)`, lesson title
  `clamp(1.75rem, 1.4vw + 1rem, 2.25rem)`. No page uses more than five sizes.
- Zero eyebrows on home and sources. One small phase label may sit inside the lesson.
- Middle dot at most once per line. No em or en dashes in interface text.

## Spacing
4-point named scale (`--space-3xs` … `--space-3xl`). Pages use tokens, never raw values.
Page gutter `clamp(1rem, 3vw, 2.5rem)`. One radius, 2 px. Controls share a 44 px height.

## Motion
- `--ease-out` cubic-bezier(0.16, 1, 0.3, 1) for entries, `--ease-in` for exits.
- Durations 120 / 220 / 420 ms. Only `transform` and `opacity` animate.
- No page reveal; the page is just there. Fibre animation is the only loop and is user-started.
- Reduced motion: transitions collapse to 150 ms; the fibre animation is disabled.

## Microinteractions
- Silent success (a reviewed lesson changes its own label; no toast).
- Focus rings appear instantly, 2 px accent, 2 px offset, on every control.
- Buttons: hover lifts 1 px, active returns to 0; disabled uses opacity, cursor and the attribute.
- Search closes on selection; the Layers panel docks in Explore and overlays elsewhere.

## CTA voice
- Primary: bone ink fill with paper text, 2 px radius, label ≤ 3 words, never wraps.
- Secondary: hairline outline in `--color-rule-2`, same height.
- Accent is a highlighter: links, active tab underline, focus ring, focus parcel. Never a fill.

## What pages must share
Wordmark and mark; the accent and its placement; Playfair + Inter; CTA voice; the hairline
row rhythm; the footer colophon (Ft4); the header (N9: wordmark left, a quiet cluster right).

## What pages may differ on
Macrostructure within the family; the presence of the atlas (sources has none); measure.

## Exports
### tokens.css
See `viewer/tokens.css` (complete token block, the only source of colour and type values).
