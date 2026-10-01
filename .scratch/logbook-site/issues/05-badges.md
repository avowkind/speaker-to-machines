# 05: Badges

**What to build:** Evidenced claims earn badges. A worker sees on the grid which claims are evidenced, at what level, with the level title and the evidence behind each badge, and which part of a claim is still unevidenced.

**Blocked by:** 04 (Logbook and evidence log)

**Status:** ready-for-agent

Spec: ../spec.md

- [ ] The core computes each claim's badge as the highest level, up to the claimed level, whose ADR 0003 rule is met by evidence for that skill dated on or before the snapshot
- [ ] Rules: any type at 1; used, built, taught or published at 2–3, with such items spanning at least three months at 3; built or taught at 4–5; taught or published at 6–7
- [ ] Core tests cover each rule's boundaries, including the three-month span, built evidence counting at 3, and a claim of 5 with a year of use giving a badge at 3
- [ ] The grid shows badges with the level title, marks the unevidenced levels, and lets the worker see the cited evidence
- [ ] Badges recompute when evidence is edited or deleted
