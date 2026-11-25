# 2. Two-tier visual honesty for intraoperative Test lenses

Date: 2026-11-25. Status: accepted.

## Context

In the Lesion lab, a Test lens filters Cut Bundles in 3D by whether a chosen intraoperative battery (`Asleep MEP`, `Awake naming`, `Tailored`, or custom task selection) interrogates them. Only a subset of HCP1065 bundles currently have curated Testing cards (13 per left hemisphere, 10 per right), and three curated pathways (`Fornix`, `TR_A`, proximal `DRTT`) have no validated real-time intraoperative warning probe at all. A three-tier visual encoding that partially dimmed uncurated bundles risked making un-evaluated pathways (such as `EMC`, `CC`, or `SLF2_L`) look tested or safe.

## Decision

Under any active Test lens, the 3D shader encodes strictly two states:

1. **Dimmed**: only Cut Bundles explicitly interrogated by the active battery. Every lens note must state that dimming means *interrogated by this battery, not guaranteed spared*.
2. **Bright**: everything not interrogated — Battery blind spots, Untestable pathways (`Corridor only`), and Uncurated bundles alike — with the three categories distinguished in the HUD readout and Testing drawer.

## Consequences

- Absence of a Testing card can never visually read as intraoperative coverage or safety.
- Per-bundle interrogation is a static function of `(hemisphere, battery)`, eliminating per-drag texture updates and keeping default `All cut` rendering identical to the baseline shader.
