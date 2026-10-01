# Speaker-to-Machines: an AI skills logbook

An open framework for stating, objectively and quickly, how far a person knows and uses AI, and for tracking that over time. It is modelled on SFIA's structure (skills, each described at graded levels) but is written from scratch and does not reuse SFIA text.

- 53 skills in 7 categories: Understanding AI, Working with AI, Delegating to AI agents, Building with AI, Building AI models, Physical and embodied AI, Leading AI adoption.
- 7 levels, each with a plain name and a Kzin-style title (after Larry Niven's Known Space, where titles are earned by deeds): Aware (Listener), Assisted (Caller), Practitioner (Speaker), Integrator (Shaper), Designer (Maker), Authority (Keeper), Field shaper (Namer).
- Skill descriptions are written to last and never name a product. Current tools and models sit in a separate, dated examples layer.
- Mapped to SFIA 9 skill codes (by reference only) and to the appliedAI Institute AI Skills Framework component ids.

Status: draft v0.1 (30 Sep 2026). All 277 level descriptions are drafted and need a consistency pass.

## Layout

- docs/literature-review.md: prior art and positioning
- docs/framework-design.md: purpose, principles, level scale, taxonomy, data model, decisions
- docs/skills-review.md: generated, human-readable list of every skill and level
- data/levels.yaml: level definitions and titles, the framework's name, version and licence, and retired codes
- data/taxonomy.yaml: category and subcategory order and display names
- data/skills/CODE.yaml: one file per skill: description, level range, descriptors and mappings
- data/examples.yaml: the examples layer (current tools and models), keyed by skill code, with one as_of date
- site/schemas/: JSON Schemas for each kind of framework file
- site/core/framework.js: loads and checks the framework files; shared by the build and the site
- scripts/build.js: the build; writes site/framework.json (generated, git-ignored) and docs/skills-review.md

## Build

Needs Node 22 or later.

    npm install
    npm run build      # validate, write site/framework.json and docs/skills-review.md
    npm run validate   # validate only
    npm test

The build fails if a skill's descriptors do not exactly cover its level_range. Each error names the file, the field and the rule broken.

## Licence

The framework content and data are licensed CC BY-SA 4.0 (see LICENSE).

## Inspiration

The structure of skills described at graded levels follows SFIA (sfia-online.org); no SFIA text is reused. The skill-by-level grid with state in the URL follows NIWA's SFIA position description tool (github.com/niwa/sfia-position-description-tool); none of its code is used.
