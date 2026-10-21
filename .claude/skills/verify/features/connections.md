# Connections graph

## Sub-features
- Graph of teaching notes (structures, links, quotes) in `#graphCanvas`, view list, find box, inspector.

## How to get to it (user POV)
Open `/connections`.

## Driving it with verify.mjs
`--only=connections`. Waits for `#graphStats` text, prints it, screenshots `#graphCanvas` and requires more than a dozen distinct colours.

## Gotchas
- `#graphCanvas` is a `div` (DOM/SVG graph), not a `<canvas>`; the check is on its screenshot.
- Find, view switching and the inspector are not driven yet.
