# 12: Embeddable badge element

**What to build:** A worker shows a badge on their own web page with one script tag and one element. Visitors see the skill, level, title and cited evidence.

**Blocked by:** 05 (Badges), 09 (Profile output)

**Status:** ready-for-agent

Spec: ../spec.md

- [x] A badge custom element renders in shadow DOM from attributes (code, level, evidence) or from a YAML profile it is pointed at
- [x] It makes no network request except to the given profile source
- [x] It shows the skill, level, title and cited evidence, and works on a page outside the site
- [x] An example page shows both ways of embedding

## Comments

Shipped in e834530.
