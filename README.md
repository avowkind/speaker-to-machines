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
- data/levels.json: level definitions and titles
- data/build_skills.py: taxonomy, skill metadata, examples and mappings; builds data/skills.json
- data/descriptors.py: level descriptions per skill code
- data/skills.json: generated framework data, in the same tree shape as the NIWA PD tool's json_source.json
- data/render_review.py: regenerates docs/skills-review.md
- data/profile.example.json: example personal profile (snapshots over time, evidence, targets for gap analysis)

## Build

    cd data && python3 build_skills.py && python3 render_review.py

The build fails if a skill's level descriptions do not exactly cover its level_range.

## Licence

The framework content and data are licensed CC BY-SA 4.0 (see LICENSE). A forked tool based on niwa/sfia-position-description-tool remains under that tool's own licence (CC BY-NC 3.0 NZ).
