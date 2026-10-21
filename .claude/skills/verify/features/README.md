# Hodos feature map

Each file: what the feature is, how a visitor reaches it, how `verify.mjs` drives it, and what end state proves it. Update the file in the same change that alters the feature. The driver's feature name is in brackets.

| Feature | Route | Driver name | File |
|---|---|---|---|
| Landing page | `/` | `landing` | [landing.md](landing.md) |
| Lessons index and lesson pages | `/lessons`, `/lessons/<id>` | `lessons` | [lessons.md](lessons.md) |
| 3D atlas | `/atlas` | `atlas` | [atlas.md](atlas.md) |
| Lesson player (Orient, Compare, Explain) | `/atlas` | `lessonPlayer` | [lesson-player.md](lesson-player.md) |
| MIPS two-corridor exercise | `/mips` | `mips` | [mips.md](mips.md) |
| Connections graph | `/connections` | `connections` | [connections.md](connections.md) |
| Static pages: sources, case conference | `/atlas-sources`, `/case-conference` | `pages` | [pages.md](pages.md) |

Not driven by `verify.mjs` yet (covered by `tests/perf/*.mjs`): Study/Present modes, parcel picking by URL (`/atlas?area=147&areaHemi=L`), dissection photograph panels (`atlas_dissection.mjs`), the views menu (`views_menu.mjs`), tract ranges (`tract_ranges.mjs`), landing layout at six widths (`hodos_publication.mjs`), pixel baselines (`visual_regression.mjs`).
