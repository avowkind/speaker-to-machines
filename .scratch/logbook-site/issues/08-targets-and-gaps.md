# 08: Targets and gaps

**What to build:** A worker compares their logbook against personal goals and role templates. A hiring manager builds a role template and shares it. The worker sees target levels over their claims and a ranked list of what to learn or evidence next.

**Blocked by:** 05 (Badges), 06 (Logbook YAML import and export)

**Status:** ready-for-agent

Spec: ../spec.md

- [ ] A worker or hiring manager can create a target by ticking target levels and marking each essential or desirable
- [ ] Targets can be shared and imported as a URL (name plus code-level pairs with priority marks) or a YAML file
- [ ] A logbook keeps several targets and the worker can switch between them
- [ ] The grid overlays the selected target's levels on the current claims
- [ ] The core ranks gaps (target level minus latest claim) by priority, then size
- [ ] The core lists evidence gaps, where the claim meets the target but the badge does not, separately
- [ ] Core tests cover gap ranking, evidence gaps and target URL and YAML round-trips
