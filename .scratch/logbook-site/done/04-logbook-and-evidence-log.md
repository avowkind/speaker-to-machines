# 04: Logbook and evidence log

**What to build:** A worker turns their quick claims into a logbook kept in their browser and records what they've done: evidence items tagged with one or more skills. The logbook shows first used and last practised for each skill, worked out from the evidence.

**Blocked by:** 03 (Quick-claims grid)

**Status:** ready-for-agent

Spec: ../spec.md

- [x] A worker can start a logbook from the current quick claims, which become its first snapshot
- [x] Only a storage adapter touches localStorage; one logbook per browser persists across visits
- [x] A worker can add, edit and delete evidence items with a date (year-month or full date), one or more codes, a type, a note, an optional link and optional tools
- [x] Tools can be picked from the examples layer or typed freely
- [x] The evidence log can be filtered by skill, type and date
- [x] The core derives first used and last practised per skill from non-learned evidence; year-month dates compare as the first of the month
- [x] A worker can override first used or last practised per skill, and overrides win
- [x] Core tests cover derivation with and without overrides, and with learning excluded

## Comments

Shipped in 8fbf420.
