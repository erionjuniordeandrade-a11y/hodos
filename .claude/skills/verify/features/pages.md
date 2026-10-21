# Static pages: sources and case conference

## Sub-features
- `/atlas-sources`: sources and use terms.
- `/case-conference`: case conference page.

## How to get to it (user POV)
Footer and atlas links; or open the routes directly.

## Driving it with verify.mjs
`--only=pages`. Opens each, checks status 200, title pattern, and body text longer than 200 characters, with no console errors.

## Gotchas
- Content is not compared; a page with the right title and any 200 characters passes.
- Case conference has its own tests only in `tests/perf/case_conference.mjs`.
