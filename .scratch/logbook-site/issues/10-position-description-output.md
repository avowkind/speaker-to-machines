# 10: Position description output

**What to build:** A hiring manager renders a role template as a print-ready position description, with no logbook needed.

**Blocked by:** 08 (Targets and gaps)

**Status:** ready-for-agent

Spec: ../spec.md

- [x] The core builds a position description model from a target alone: each skill with its target level, plain level name, descriptor and priority
- [x] A print-ready HTML position description renders in the light DOM using plain level names, essential before desirable
- [x] It works from a target link or file with no logbook in the browser
- [x] Core tests cover the model
