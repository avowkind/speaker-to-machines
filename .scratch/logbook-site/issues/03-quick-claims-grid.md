# 03: Quick-claims grid

**What to build:** A candidate opens the site, sees every skill against the seven levels, ticks one level per skill, and gets a shareable link. Anyone opening the link sees those claims as plain claims. This is the tracer bullet through the site: vendored Lit, the bundle, the logbook core, the URL adapter and the first view.

**Blocked by:** 01 (Move the framework data to YAML with a Node build)

**Status:** ready-for-agent

Spec: ../spec.md

- [x] The site is static files only: Lit vendored as ES modules, no bundler or site build step
- [x] The grid shows categories, subcategories and skills in taxonomy order, with categories collapsible
- [x] Levels outside a skill's level range cannot be ticked; at most one level per skill can be
- [x] Each level's descriptor, the skill's description and its examples layer (with as_of) can be read inline
- [x] A toggle switches between plain level names and titles
- [x] The logbook core encodes and decodes a snapshot as a date plus code-level pairs; round-trip tests pass
- [x] Only a URL adapter touches the location hash; it updates as levels are ticked
- [x] Opening a link shows its claims on the grid, clearly labelled as plain claims with no badges
- [x] JSDoc types are checked by tsc --noEmit in CI
