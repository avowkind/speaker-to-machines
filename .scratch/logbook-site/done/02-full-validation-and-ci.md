# 02: Full validation and CI

**What to build:** Outside contributors can propose framework changes safely. Every framework file is checked against a JSON Schema and against the framework rules, errors say exactly what to fix, and CI runs the checks on every pull request.

**Blocked by:** 01 (Move the framework data to YAML with a Node build)

**Status:** ready-for-agent

Spec: ../spec.md

- [x] JSON Schemas exist for the taxonomy, skill, examples and levels files, and the framework module validates against them
- [x] Codes must be four capital letters and unique
- [x] No code may collide with an SFIA 7–9 code, taken from a codes-only reference list kept in the repo
- [x] Every skill's category and subcategory must exist in the taxonomy
- [x] Every retired code's replaced_by must exist, and no retired code may be used by a current skill
- [x] No descriptor or skill description may contain a product name from the examples layer (case-insensitive, whole word)
- [x] Each error names the file, a field path and the rule broken
- [x] A validate-only command exists for contributors and CI
- [x] Fixture data directories, one per rule, each produce exactly the expected errors; the real data passes
- [x] A CI workflow runs validation and all tests on every pull request

## Comments

Shipped in 8c34583.
