# CLAUDE.md: Speaker-to-Machines

Context for continuing work on this repository. Read README.md and docs/framework-design.md first.

## What this is
This is an AI skills framework built for self-assessment. It lets candidates and workers state how far they know and use AI, record evidence over time and run gap analysis against a target. The owner (Andrew) will use it to document his own AI use. A static site, with no server-side storage, will present it (see docs/adr/).

## Decisions made (do not reopen without asking)
- Never copy SFIA text; its licence forbids derivatives. SFIA skill codes may be referenced, as in each skill's map.sfia.
- Licence is CC BY-SA 4.0, which allows reuse of appliedAI's CC BY-SA dataset (github.com/aai-institute/ai-skills-framework).
- The level scale is a hybrid across 7 levels: 1 know, 2–3 use, 4–5 adapt and build, 6–7 lead and advance. Plain names are Aware, Assisted, Practitioner, Integrator, Designer, Authority, Field shaper. Titles are Listener, Caller, Speaker, Shaper, Maker, Keeper, Namer.
- Skills have a level_range. It is fine for ranges to start late or stop early.
- Keep about 53 skills.
- Skill and level text is product-neutral. Tools go only in examples {as_of, items}, refreshed periodically.
- The name is "Speaker-to-Machines: an AI skills logbook". Plain level names go in formal outputs such as position descriptions; titles go in the profile and badge views.
- Levels must be observable and evidence-backed (following the IDDL defined-versus-demonstrated argument; see the literature review).
- Only AI-specific skills are included. Generic software, data and management skills are left to SFIA and referenced by code.
- Skill codes are 4 letters and must not collide with SFIA 7–9 codes (TEAC was renamed ENAB for this reason). Retired codes are never reused (ADR 0004).
- YAML files are the source of truth for framework data and logbooks; nothing generated is edited by hand (ADR 0005). Layout: docs/framework-design.md §5 and README.md.

## Conventions for descriptors (data/skills/CODE.yaml, under `levels`)
- Each level says what the person does and produces, in 1–3 sentences with no product names.
- Level patterns: 1 knows and explains; 2 uses with guidance; 3 uses routinely and independently in own work; 4 builds repeatable things for self and team and coaches others; 5 designs things others rely on and sets team practice; 6 sets organisational policy and strategy; 7 advances the field beyond one organisation.
- Tools and products go in data/examples.yaml, never in a skill file. Validation fails if skill text names an example item; if an item is an everyday word or generic technique, list it under generic_terms there.
- After editing, run: npm run build (or npm run validate to check only), then npm test

## Next steps
The logbook site is built (`.scratch/logbook-site/`). The roadmap is `.scratch/roadmap.md`: v0.2 agent-kept logbook (logbook file as master copy, ADR 0007; private evidence; an installable logbook skill), v0.3 readable anywhere, v0.4 keeping current, plus a content track (Andrew's logbook, the descriptor consistency pass, the PERS/HOME decision).

Domain terms are in CONTEXT.md (logbook, claim, evidenced claim, badge, snapshot, target, profile). Use them, not "profile site" or "tool".

## Agent skills

### Issue tracker

Local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five roles (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix), recorded as a `Status:` line. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
