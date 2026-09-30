# Speaker-to-Machines: an AI skills logbook

Design draft v0.1

Status: draft for review, 30 September 2026. Licence intent: CC BY-SA 4.0. That lets us reuse and map the appliedAI Institute dataset, and anything we derive from it has to carry the same licence.

## 1. Purpose

The framework lets a person make a quick, objective statement of how far they know and use AI, and keep that statement up to date over time. The main users are candidates, workers and self-assessors, not employers designing roles. The same data should still produce position descriptions, as the SFIA tool does.

It has to support three things:
1. A profile: a statement of the form "skill X at level N, with evidence, as of date D".
2. History: the same person's profile at several dates, showing how their use of AI has grown.
3. Gap analysis: the current profile compared with a target (a role, or a personal goal), giving a ranked list of what to learn next.

## 2. Design principles

1. Emulate SFIA, don't copy it. The structure is the same (category, subcategory, skill, then a description for each level), but every word is ours. SFIA skills are referenced by code only.
2. Only what is AI-specific. General software, data and management skills are left to SFIA and referenced by code. For example, "use version control" stays out, while "review and merge agent-produced change" is in.
3. Two layers. Skills and their level descriptions are written to last for years and never name a product. A separate examples layer lists current tools and models, carries an as_of date and can be updated every quarter without changing a skill's meaning.
4. Levels must be observable. Each level description says what the person does and what they produce, so a claim can be backed by evidence (following the IDDL idea of competence as defined versus capability as demonstrated).
5. Covers the whole range: from understanding, through personal and home use, delegating to agents, building with AI and building AI models, to physical AI and leadership.
6. Machine-readable first. The JSON is the source, and documents and the tool are generated from it.

## 3. Level scale

There are seven levels, the same count as SFIA, so the forked tool's seven columns still fit. A level blends three things: how independently you work (autonomy), how far your work reaches (scope: you, your team, your organisation, the field), and what you actually do (knowing, using, building, leading). Not every skill uses every level, and each skill has a level_range. Definitions are in data/levels.json.

Each level has a plain name for formal outputs such as position descriptions and CVs, and a title for the profile and badge views. The titles follow the Kzin naming custom in Larry Niven's Known Space stories: a Kzin goes from a description to an occupation title (Speaker-to-Animals) and then to a name, each earned by deeds. Here too, a level is earned through evidence, not claimed. A title can be written in full, as in Shaper-of-Machines.

1. Aware (Listener). Know. Can explain what it is, what it is for and its main limits. Has tried it with guidance or seen it demonstrated.
2. Assisted (Caller). Use. Uses it for simple, well-defined tasks by following examples, templates or instructions. Spots obvious failures.
3. Practitioner (Speaker). Use. Uses it routinely and independently in own work. Decides when to use it and when not to, checks results and handles the common failure modes. This is the level at which you have earned the framework's title.
4. Integrator (Shaper). Build. Adapts and combines techniques into repeatable workflows for self and team. Configures, customises and troubleshoots, and helps others adopt.
5. Designer (Maker). Build. Designs and builds solutions other people rely on. Balances quality, cost, risk and security. Sets team practice and reviews others' work.
6. Authority (Keeper). Lead. Recognised authority across an organisation. Sets strategy, standards and policy, and is accountable for outcomes and risk at scale.
7. Field shaper (Namer). Lead. Advances practice beyond one organisation through research, widely adopted tools, protocols or standards. Names the things others go on to use.

## 4. Taxonomy v0.1

There are 53 skills in 7 categories. All of them have level descriptions (277 in total, draft v0.1, 30 Sep 2026); see docs/skills-review.md.

Understanding AI
- Concepts: AILT AI literacy (1–4), MLFN Machine learning foundations (1–5), FMIN Foundation model concepts (1–6), AILS AI landscape awareness (2–6)
- Responsibility: AETH AI ethics and societal impact (1–7), AREG AI law and regulation (1–6), ASAF AI safety concepts (1–7)

Working with AI
- Communicating with AI: INST Instructing AI* (1–6), VERI Output verification (1–5), PRIV Information hygiene with AI (1–5)
- Applying AI to work: WRIT AI-assisted writing, RSRC AI-assisted research, ADAN AI-assisted data analysis, MEDI AI media creation, OFFC AI in workplace applications (all 1–5), LERN Learning with AI (1–4)
- Personal and home AI: PERS Personal AI assistants (1–5), HOME Home and device agent coordination (1–5)

Delegating to AI agents
- Delegation: DELG Task delegation (1–6), SUPV Agent supervision* (1–6)
- Configuration: ACFG Agent configuration (2–5), CTXM Context and memory management (2–6), WFAU AI workflow automation (2–6)

Building with AI
- AI-assisted development: AISD AI-assisted software development (1–6), AGSD Agentic software delivery (3–7)
- AI application engineering: LLMA LLM application engineering (2–6), RAGS Retrieval and knowledge systems (3–6), AGEN Agent engineering and orchestration (3–7), ACAP Agent capability design* (2–7)
- AI quality and operations: EVAL AI evaluation (2–7), AISC AI security (2–7), LOPS AI operations and observability (3–6), MSEL Model selection (2–6)

Building AI models
- Data and modelling: DPRE Data preparation for AI (2–6), CLML Predictive modelling (2–7), DLDV Deep learning development (3–7), MADP Model adaptation (3–7), INTP Model interpretability (3–7)
- Platforms and research: MLOP ML operations (3–6), ACMP AI compute and infrastructure (3–7), AIRS AI research (4–7)

Physical and embodied AI
- Sensing and perception: PERC Machine perception (1–7), EDGE Edge and IoT AI (2–6)
- Acting in the world: ROBO Robotics and embodied AI* (1–7), AUTV Autonomous vehicles and mobility (1–7), HRIS Human–robot interaction and safety (2–7), SIMU Simulation and digital twins (3–7)

Leading AI adoption
- Strategy and governance: ASTR AI strategy and value (4–7), AGOV AI governance and risk (3–7), APRO AI procurement (3–6)
- People and change: JOBR Work redesign for AI (3–7), ENAB Enabling others with AI (2–7), ACHG AI change leadership (4–7)

Codes were checked against every SFIA 7–9 code and none collide. TEAC was renamed ENAB because SFIA already uses TEAC.

Coverage check against appliedAI (161 components):
- 137 components map into these 53 skills.
- The other 24 are general programming, software design and data engineering (e.g. version control, design patterns, database schemas). They are left out deliberately because they aren't AI-specific.
- 12 of our skills have no appliedAI counterpart: FMIN, ASAF, LERN, PERS, HOME, AIRS and the six physical-AI skills.
- Another 8 match only one component: AILT, AILS, WRIT, RSRC, ACFG, AGSD, ACAP and APRO.
- Those 20 are where this framework adds something.

Mappings are held per skill in `map.sfia` and `map.appliedai`.

## 5. Data model

skills.json has the same tree shape as the NIWA tool's json_source.json (category, then subcategory, then skill name, then the record), so the fork needs minimal change. Each record adds these fields:
- level_range: [min, max]
- levels: {"1": "...", ...}, filled only within level_range
- examples: {as_of, items[]}, the current tools and models
- map: {sfia[], appliedai[]}

A personal profile is a separate file. The person owns it, and it lives in their repository or browser, never on a server. See data/profile.example.json. For each skill it records:
- claimed level
- first used and last practised dates
- evidence items: date, type (learned / used / built / taught / published), a note and an optional link
- tools used, taken from the examples layer or free text

Snapshots are dated copies of the profile, and history is the list of snapshots. Gap analysis compares the current snapshot with a target profile (a role template or a personal goal), giving per-skill differences ranked by size and by a priority weight.

Recency matters more for AI than for most skills. A level claimed from practice two model generations ago may be stale, so the tool should flag claims whose last practised date is more than 12 months old.

## 6. Tool (fork of niwa/sfia-position-description-tool)

Keep:
- the category/skill grid with seven checkbox columns
- the URL hash for state (CODE-LEVEL+...), which makes any profile a shareable link
- CSV and HTML export

Add:
1. Level text shown inline, and the examples layer shown per skill.
2. A profile mode: import and export a profile JSON, with evidence and dates.
3. A target overlay: load a target profile or role and highlight gaps.
4. A history view: snapshots over time.
5. Remove the SFIA JSON from the fork.

The tool's own licence is CC BY-NC 3.0 NZ with attribution to NIWA. That covers the code, and the framework data will be CC BY-SA.

## 7. Open decisions

- A. DECIDED (30 Sep 2026): the hybrid scale, where level 1 is knowing, 2–3 using, 4–5 adapting and building, 6–7 leading and advancing.
- B. DECIDED (30 Sep 2026): about 53 skills is the right granularity.
- C. DECIDED (30 Sep 2026): the name is "Speaker-to-Machines" with the subtitle "an AI skills logbook", and the level titles are Listener, Caller, Speaker, Shaper, Maker, Keeper and Namer. The generic name was dropped because it clashes with appliedAI's "AI Skills Framework" and societalai.org's "AI Skills Framework™". No trademark search has been done. The appliedAI Institute already uses "AI Skills Framework", and "agent skills" now means packaged capabilities for agents, so we need a distinct name.
- D. Evidence strength: whether to weight claims by evidence type (for example, built > used > learned) in gap analysis.
- E. Whether PERS and HOME should merge, and whether AUTV's user-side levels (supervising driver-assistance systems) belong with SUPV.

## 8. Next steps

1. Done: taxonomy, level model and name settled, and all level descriptions drafted.
2. Do a consistency pass across categories, including verb patterns per level and overlaps between similar skills.
3. Test by self-assessment: Andrew completes a profile, and we see where the scale or the skills don't fit.
4. Fork the tool and implement profile mode, then gap analysis.
