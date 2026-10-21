# Landing page

## Sub-features
- Hero anatomy plate.
- One deep link per lesson (`[data-lessons] a`, 14 of them, each `./atlas?lesson=<id>`).
- Creator credit "Created by Dr. Erion de Andrade".

## How to get to it (user POV)
Open `/`.

## Driving it with verify.mjs
`--only=landing`. Opens `/`, waits for the hero `<img>` to decode (`naturalWidth>0`), counts lesson links, reads `.creator-credit`.

## Gotchas
- Lesson images are lazy; the page logs `requestfailed` if the preview server resets connections (use the bundled `serve.py`).
- Lesson count is hard-coded as 14 in the driver and in `hodos_publication.mjs`; change both when a lesson is added.
- Layout at six widths is not checked here; `hodos_publication.mjs` does it.
