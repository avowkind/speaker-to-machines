# CLAUDE.md: Speaker-to-Machines

Context for continuing work on this repository. Read README.md and docs/framework-design.md first.

## What this is
This is an SFIA-style AI skills framework built for self-assessment. It lets candidates and workers state how far they know and use AI, record evidence over time and run gap analysis against a target. The owner (Andrew) will use it to document his own AI use. A fork of niwa/sfia-position-description-tool (a static HTML/JS app driven by JSON) will illustrate it.

## Decisions made (do not reopen without asking)
- Emulate SFIA, don't extend it. Never copy SFIA text, because SFIA licensing forbids derivatives. SFIA skill codes may be referenced.
- Licence is CC BY-SA 4.0, which allows reuse of appliedAI's CC BY-SA dataset (github.com/aai-institute/ai-skills-framework).
- The level scale is a hybrid across 7 levels: 1 know, 2–3 use, 4–5 adapt and build, 6–7 lead and advance. Plain names are Aware, Assisted, Practitioner, Integrator, Designer, Authority, Field shaper. Titles are Listener, Caller, Speaker, Shaper, Maker, Keeper, Namer.
- Skills have a level_range. It is fine for ranges to start late or stop early.
- Keep about 53 skills.
- Skill and level text is product-neutral. Tools go only in examples {as_of, items}, refreshed periodically.
- The name is "Speaker-to-Machines: an AI skills logbook". Plain level names go in formal outputs such as position descriptions; titles go in the profile and badge views.
- Levels must be observable and evidence-backed (following the IDDL defined-versus-demonstrated argument; see the literature review).
- Only AI-specific skills are included. Generic software, data and management skills are left to SFIA and referenced by code.
- Skill codes are 4 letters and must not collide with SFIA 7–9 codes (TEAC was renamed ENAB for this reason).

## Conventions for descriptors (data/descriptors.py)
- Each level says what the person does and produces, in 1–3 sentences with no product names.
- Level patterns: 1 knows and explains; 2 uses with guidance; 3 uses routinely and independently in own work; 4 builds repeatable things for self and team and coaches others; 5 designs things others rely on and sets team practice; 6 sets organisational policy and strategy; 7 advances the field beyond one organisation.
- After editing, run: cd data && python3 build_skills.py && python3 render_review.py

## Next steps (in rough order)
1. Andrew fills in a real profile against all 53 skills, to find mis-pitched levels and overlapping skills.
2. Do a consistency pass on the 277 descriptors: verb patterns per level, overlaps (e.g. SUPV/DELG, CTXM/INST, AUTV level 2/SUPV), and the thin INTP 6–7 and CLML 7 entries.
3. Fork the PD tool: read data/skills.json (same tree shape as json_source.json); show level text inline and the examples layer; add a profile mode (import/export profile JSON with dates and evidence); a target overlay for gap analysis; a history view of snapshots; a 12-month staleness flag on last_practised; and remove SFIA JSON from the fork.
4. Open questions: weighting of evidence types in gap analysis (built > used > learned); whether PERS and HOME should merge.
