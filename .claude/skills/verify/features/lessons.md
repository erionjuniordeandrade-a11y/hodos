# Lessons index and lesson pages

## Sub-features
- `/lessons` static index linking every lesson.
- `/lessons/<id>` static page per lesson (heading, content, link into the atlas).

## How to get to it (user POV)
Open `/lessons`, click a lesson.

## Driving it with verify.mjs
`--only=lessons`. Collects `a[href^="/lessons/"]` (expects 14 distinct), opens the first, requires a non-trivial `<h1>`.

## Gotchas
- Only the first lesson page is opened. `hodos_publication.mjs` checks every page's heading against `LESSONS`.
- These routes need the extensionless mapping: `serve.py` provides it; plain `python3 -m http.server` redirects `/lessons` to a directory listing.
