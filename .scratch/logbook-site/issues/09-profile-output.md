# 09: Profile output

**What to build:** A worker generates their profile: for each claimed skill, the current claim and badge with its evidence, stale flags and the earlier snapshots where the level changed. They print it to PDF or export it as YAML for an agent.

**Blocked by:** 06 (Logbook YAML import and export), 07 (Snapshots, history and staleness)

**Status:** ready-for-agent

Spec: ../spec.md

- [x] The core builds a profile model from a logbook; core tests cover its content
- [x] A print-ready HTML profile renders in the light DOM with print styles, using titles by default and plain level names as an option
- [x] The profile exports as YAML with quoted dates and codes
- [x] Saving as PDF from the browser's print dialog gives a clean document
