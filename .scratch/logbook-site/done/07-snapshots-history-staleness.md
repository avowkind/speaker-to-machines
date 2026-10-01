# 07: Snapshots, history and staleness

**What to build:** A worker records how their claims change over time with dated snapshots, sees their growth in a history view, and is told which claims are stale.

**Blocked by:** 05 (Badges)

**Status:** ready-for-agent

Spec: ../spec.md

- [x] A new snapshot starts as a copy of the latest; a skill absent from a snapshot means no claim
- [x] The core refuses edits to a dated snapshot's claims; a snapshot can be deleted
- [x] The history view shows each skill's level and badge at each snapshot's date
- [x] The core flags a claim stale when its skill was last practised more than 12 months before the snapshot's date, honouring overrides
- [x] Stale claims are flagged on the grid and in history
- [x] Core tests cover copy-on-new, refused edits, deletion, badges as at a date and staleness boundaries

## Comments

Shipped in 4f25111.
