# 11: Retired codes

**What to build:** Old logbooks, links and targets keep working after the framework retires or merges a skill: retired codes are mapped to their replacements on import, and history stays true to what was recorded.

**Blocked by:** 02 (Full validation and CI), 06 (Logbook YAML import and export), 08 (Targets and gaps)

**Status:** ready-for-agent

Spec: ../spec.md

- [ ] On import of a link, logbook file or target, the core maps retired codes in claims and target levels to their replacement codes
- [ ] Evidence items keep the code they were logged under but count for the replacement skill (dates, badges)
- [ ] The worker is told which codes were mapped on import
- [ ] Core tests use a fixture framework that retires a code and cover links, logbook files and targets
