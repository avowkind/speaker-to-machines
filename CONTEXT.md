# Speaker-to-Machines

An AI skills logbook: a framework of AI-specific skills described at graded levels, and a person's evidence-backed record of their level in each skill over time.

**Speaker-to-Machines**:
The framework and the static site that presents it, where a person keeps their logbook.
_Avoid_: profile site, tool, PD tool

## Framework

**Skill**:
An AI-specific capability, identified by a four-letter code and described at each level in its level range.
_Avoid_: competency, component

**Level**:
One of seven grades of a skill, from Aware (1) to Field shaper (7). Each level has a plain name for formal outputs and a title (Listener … Namer) for profile views.
_Avoid_: grade, tier, rank

**Level range**:
The consecutive levels at which a particular skill is defined; many skills start above 1 or stop below 7.

**Descriptor**:
The product-neutral text saying what a person does and produces at one level of one skill.
_Avoid_: level description, definition

**Retired code**:
A skill code no longer in the framework, mapped to the code that replaced it. Codes are never reused.

**Framework version**:
A tagged release of the framework: major when a code is retired or a level's meaning changes, minor when a skill or level is added, patch for wording or examples only. A logbook records the version it was made against.

**Examples layer**:
The dated list of current tools and models attached to a skill, refreshed without changing the skill's meaning.

## Logbook

**Logbook**:
One person's record against the framework: their evidence log, snapshots and targets.
_Avoid_: profile, account, user data

**Logbook file**:
The YAML file holding a whole logbook. It is the master copy, kept wherever the person chooses; the site and agents both read and write it, and the browser holds only a working copy.
_Avoid_: export, backup

**Evidence item**:
A dated record of something the person did, tagged with one or more skill codes, typed as learned, used, built, taught or published, optionally naming the tools used.
_Avoid_: proof, artefact

**Private evidence**:
An evidence item the person marks private. It counts towards badges like any other item, but outputs show only its date, type and skill codes, never its note, link or tools.
_Avoid_: hidden evidence, confidential

**Evidence log**:
The list of all evidence items in a logbook. The person may edit or delete items; badges are recomputed.

**Claim**:
A level a person asserts for one skill as of a snapshot's date. A claim needs no evidence; it is a statement, not a credential.
_Avoid_: rating, score, self-rating

**Evidenced claim**:
A claim with at least one qualifying evidence item for its skill dated on or before the snapshot.

**Qualifying evidence**:
Evidence whose type fits the level: any type at level 1; used, built, taught or published at 2–3 (and at 3, such items spanning at least three months); built or taught at 4–5; taught or published at 6–7.

**Badge**:
A self-issued mark for one skill at one level, shown with the level's title. A claim's badge is at the highest level, up to the claimed level, whose qualifying-evidence rule is met. Its credibility rests on the evidence it cites.
_Avoid_: certificate, credential

**Snapshot**:
The set of claims a person made as of one date; a logbook's history is its sequence of snapshots. A snapshot's claims are not edited after its date; a changed claim goes in a new snapshot.
_Avoid_: version, assessment

**First used**:
The date of the earliest evidence item for a skill of type used, built, taught or published, unless the person overrides it for that skill.

**Last practised**:
The date of the most recent evidence item for a skill of type used, built, taught or published (learning does not count), unless the person overrides it for that skill.

**Stale claim**:
A claim whose skill was last practised more than 12 months before the snapshot's date.

## Targets

**Target**:
A named set of target levels that a person compares their logbook against; either a role template or a personal goal. Targets travel by URL or file like snapshots.
_Avoid_: goal profile, target profile

**Target level**:
The level a target asks for in one skill, marked essential or desirable. It is not a claim and carries no evidence.

**Role template**:
A target describing the AI skills a job needs.
_Avoid_: role profile, job spec

**Position description**:
A role template rendered as a document using plain level names.
_Avoid_: PD (in prose)

**Gap**:
The difference between a target level and the current claim for the same skill. Gaps rank by priority, then size.

**Evidence gap**:
Where the current claim meets a target level but its badge does not.

## Outputs

**Profile**:
A document generated from a logbook that, for each skill, gives the current claim and badge with the evidence behind it, and the earlier snapshots where the level changed.
_Avoid_: stage (use level or snapshot), summary
