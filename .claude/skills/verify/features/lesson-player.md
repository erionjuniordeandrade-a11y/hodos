# Lesson player

## Sub-features
- Start a lesson from the curriculum, step through Orient, Compare, Explain.
- Reveal the answer (`#lessonAnswer>summary`), return home (`#learnHome`).

## How to get to it (user POV)
Open `/atlas`, press Start on a lesson row. Landing links open `/atlas?lesson=<id>` straight into a lesson.

## Driving it with verify.mjs
`--only=lessonPlayer`. Opens `/atlas?test=1`, expects 14 `.curriculum-row`, clicks the first `#lessonStart-*`, presses `#lessonNext` three times and reads `__atlasTest.learningPhase` (orient, compare, explain), opens the answer and requires text.

## Gotchas
- Only the first lesson is walked; `hodos_publication.mjs` walks all 14.
- The `?lesson=` deep link from the landing page is not driven here.
