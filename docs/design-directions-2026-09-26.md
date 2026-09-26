# Hodos design directions (2026-09-26)

The owner unlocked the 2026-09-10 palette ("I don't want the locked design. We can do better").
Process follows the official `frontend-design` skill: ground in the subject, plan tokens,
review each plan against the generic defaults, build, critique from screenshots.

**Subject.** A neuroanatomy coursebook of white matter pathways for neurosurgical residents
(hodos: Greek for path). **Audience.** Residents, mostly on a laptop in a reading room or on a
phone between cases. **Primary job.** Make a resident explain a tract relationship on a live
3D atlas. **Vernacular to draw from:** myelin-stained sections (Weigert, Luxol fast blue),
nineteenth-century neuroanatomy plates (Dejerine), direction-encoded tractography colour
(red left-right, green front-back, blue up-down), the operating room (drape green, 5-ALA
fluorescence in glioma surgery, which is Hodos's intra-axial audience).

In every direction the 3D atlas and hero renders keep a dark stage: they are photographs of
dark-background renders, and a dark specimen window is honest to how they were captured.

## A. Myelin plate (light)
- Colour: slide glass `#E8EBEC` (page), section white `#F6F7F6` (raised), myelin ink
  `#1A1E36` (text; Weigert blue-black), Luxol blue `#2F4FA3` (links, focus, active state),
  cresyl violet `#7B4F8E` (secondary data only), graticule `#BFC5CB` (rules).
- Type: Newsreader, one family, optical sizes (display at 72 opsz, body at 14 opsz).
- Layout: a book plate. Headline and text on the light page; the atlas and every render sit
  in a dark specimen window with a figure caption beneath, as a plate would.
- Principle: the page is the stained section; colour means stain.
- Review against defaults: a light page with a serif is trait 1 (warm cream, terracotta).
  Kept because the stain palette is cool (glass grey, blue-black, Luxol blue), not cream and
  clay, and the plate is the subject's own genre.

## B. Direction-encoded (dark graphite)
- Colour: scanner graphite `#1E2227` (page), console `#262B31` (raised), film white
  `#E4E6E3` (text), DEC red `#E0605A`, DEC green `#62B97A`, DEC blue `#6A93E8`.
  Links are film white with an underline; no decorative accent.
- Type: Archivo, one family with its width axis: expanded semibold for display, normal
  width for body.
- Layout: a reading console. The three DEC colours are the only colour, and only as
  meaning: commissural red, association green, projection blue. Families, lesson rows and the
  hero legend carry their fibre direction.
- Principle: colour is data, never decoration.
- Review against defaults: dark with one bright accent is trait 2. Avoided: graphite, not
  near-black, and three colours with fixed meanings rather than one accent.

## C. Drape and fluorescence (coloured dark)
- Colour: drape green `#17362F` (page), scrub `#21453C` (raised), gauze `#EEF1EA` (text),
  instrument steel `#9DB0A8` (muted), 5-ALA pink `#F0679A` (links, focus, active state),
  suture `#3F6358` (rules).
- Type: Schibsted Grotesk, one family; heavy display, regular body.
- Layout: the operating field. Content sits on the drape; the atlas is the lit field.
- Principle: pink means "look here", as fluorescence does in glioma resection.
- Review against defaults: a coloured dark ground and a pink accent are not in the default
  list. Risk: a strong ground reads as branding over teaching; judged on screenshots.

## Owner choice
Each direction is deployed to a Cloudflare Pages preview branch. The chosen one becomes the
new `design.md` and replaces the tokens site-wide.
