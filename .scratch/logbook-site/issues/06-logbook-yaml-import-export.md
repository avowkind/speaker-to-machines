# 06: Logbook YAML import and export

**What to build:** A worker backs up their logbook as a readable YAML file and restores it, possibly in another browser. The site reminds them when they have unexported changes, and claims links can be pulled into the logbook.

**Blocked by:** 02 (Full validation and CI), 04 (Logbook and evidence log)

**Status:** ready-for-agent

Spec: ../spec.md

- [x] A JSON Schema exists for logbook files (schema id stm-logbook/0.1)
- [x] Export writes the whole logbook as YAML with dates and codes as quoted strings
- [x] Import validates against the schema and shows readable errors without touching the current logbook on failure
- [x] Core round-trip tests pass, including dates and codes that look like YAML booleans or timestamps (e.g. a code like ON)
- [x] The site shows when the logbook was last exported and nudges when there are unexported changes
- [x] The logbook's framework version is shown next to the current framework version
- [x] A worker can import a claims link into their logbook as a new snapshot
