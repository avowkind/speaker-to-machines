# Spec: Speaker-to-Machines site and YAML framework data

Status: ready-for-agent

Vocabulary follows CONTEXT.md. Decisions follow ADRs 0001–0006.

## Problem Statement

A person who wants to say how far they know and use AI has no quick, objective way to do it, and no way to back the statement with evidence or show how it has grown. The Speaker-to-Machines framework defines the skills and levels, but today it exists only as Python source and a generated review document. Nobody can tick their levels, keep a logbook, earn badges, compare themselves with a role, or produce a profile from it.

The framework itself is also hard to maintain. Its skills, descriptors, examples and mappings live inside Python code, so contributors who don't code can't propose changes, wording and tool lists are tangled in the same files, and the only guard against bad edits is one assertion about level ranges.

## Solution

Two connected pieces.

**Framework data as YAML.** Each skill becomes its own hand-editable YAML file, alongside a taxonomy file, an examples-layer file and a levels file. A Node build validates every file against a schema and against the framework's rules, then generates a single bundle for the site and the review document. CI runs the validator on every pull request, so outside contributors can propose changes safely. The Python scripts are retired.

**A static site.** The site has no server-side storage and is used two ways:
- **Quick claims:** a person ticks one level per skill in a skill-by-level grid. The URL then holds that snapshot and can be shared.
- **Logbook:** a person adds evidence over time, kept in the browser and exported as a YAML file. Evidenced claims earn badges, shown with level titles. The person can make dated snapshots, see their history, flag stale claims, compare against targets for gaps, and generate a profile or position description as print-ready HTML or as YAML for machines and agents.

Badges can be embedded in other pages as web components.

## User Stories

### Quick claims

1. As a candidate, I want to see every skill in a grid against the seven levels, so that I can state my AI skills in a few minutes.
2. As a candidate, I want to tick at most one level per skill, so that each claim is unambiguous.
3. As a candidate, I want levels outside a skill's level range to be unavailable, so that I can't claim a level that doesn't exist.
4. As a candidate, I want to read the descriptor for a level inline before ticking it, so that I claim the level that actually describes me.
5. As a candidate, I want to see each skill's description and its current examples layer, so that I recognise the skill in terms of tools I know.
6. As a candidate, I want to collapse and expand categories and subcategories, so that I can focus on the parts of the framework that apply to me.
7. As a candidate, I want the URL to update as I tick levels, so that I can copy a link to my claims at any moment.
8. As a candidate, I want the URL to hold a date and my claims as compact code-level pairs, so that the link is short and readable.
9. As a candidate, I want the URL to never hold evidence, so that a link I paste anywhere can't leak private work.
10. As a recruiter opening a candidate's link, I want to see their claims laid out on the grid, so that I can read their AI skills at a glance.
11. As a recruiter opening a link, I want it made clear that claims from a link are plain claims, not badges, so that I'm not misled about evidence.
12. As a candidate, I want to switch between plain level names and titles, so that I can use plain names in formal contexts and titles in profile views.

### Logbook and evidence

13. As a worker, I want to start a logbook from my quick claims, so that ticking boxes leads straight into recording evidence.
14. As a worker, I want to import a claims link into my logbook as a snapshot, so that a link I made earlier isn't lost.
15. As a worker, I want my logbook saved in my browser automatically, so that I don't lose work between visits.
16. As a worker, I want nothing in my logbook sent to any server, so that my evidence stays private.
17. As a worker, I want to add an evidence item with a date, one or more skill codes, a type (learned, used, built, taught or published), a note, an optional link and optional tools, so that I record what I did in one place.
18. As a worker, I want to tag one evidence item with several skills, so that one deed doesn't have to be entered three times.
19. As a worker, I want to pick tools from the examples layer or type my own, so that recording tools is quick but not limited.
20. As a worker, I want to edit or delete an evidence item, so that I can fix mistakes or remove private work.
21. As a worker, I want badges to recompute when I change evidence, so that what I see always matches my log.
22. As a worker, I want to see first used and last practised for each skill, worked out from my evidence, so that I don't have to maintain dates by hand.
23. As a worker, I want to override first used or last practised for a skill, so that I can reflect experience from before I kept a logbook.
24. As a worker, I want learning evidence not to count towards first used or last practised, so that the dates reflect practice.
25. As a worker, I want to filter the evidence log by skill, type and date, so that I can find items quickly.

### Snapshots and history

26. As a worker, I want to make a new dated snapshot that starts as a copy of my latest one, so that I only change what has moved.
27. As a worker, I want a skill missing from a snapshot to mean I don't claim it, so that history is never ambiguous.
28. As a worker, I want a snapshot's claims to be fixed once it has a date, so that my history stays honest.
29. As a worker, I want to delete a snapshot, so that I can remove one made by mistake.
30. As a worker, I want a history view showing each skill's claimed level across snapshots, so that I can see how my AI use has grown.
31. As a worker, I want the history view to show badges as they stood at each snapshot's date, so that I can see when claims became evidenced.

### Badges

32. As a worker, I want a claim to earn a badge when qualifying evidence dated on or before the snapshot exists, so that badges mean something.
33. As a worker, I want any type of evidence to qualify at level 1, so that a course or demonstration counts for awareness.
34. As a worker, I want level 2 to need used, built, taught or published evidence, so that it reflects real use.
35. As a worker, I want level 3 to need used, built, taught or published items spanning at least three months, so that it reflects routine use, and built evidence counts for no less than used.
36. As a worker, I want levels 4–5 to need built or taught evidence, and levels 6–7 taught or published evidence, so that higher badges reflect building and leading.
37. As a worker, I want a claim higher than its evidence to show a badge at the highest level the evidence supports, so that I see exactly how much is evidenced.
38. As a worker, I want the unevidenced part of a claim shown clearly, so that I know which evidence to add next.
39. As a worker, I want badges shown with the level title (e.g. Shaper in INST), so that the logbook speaks the framework's language.
40. As a worker, I want to see the evidence a badge rests on, so that I can check and show why I earned it.
41. As a worker, I want to embed a badge in my own web page with one script tag and an element, so that I can show it on my personal site.
42. As a visitor to someone's site, I want an embedded badge to show its skill, level, title and the evidence cited, so that I can judge its credibility.

### Staleness

43. As a worker, I want a claim flagged as stale when its skill was last practised more than 12 months before the snapshot's date, so that I know which claims are out of date.
44. As a worker, I want staleness in old snapshots measured from that snapshot's date, so that history shows claims that were already stale when made.
45. As a worker, I want my overrides of last practised to count in staleness, so that experience I record by hand isn't flagged wrongly.

### Targets and gaps

46. As a worker, I want to create a personal goal target with target levels per skill, so that I can plan what to learn next.
47. As a hiring manager, I want to build a role template by ticking target levels and marking each essential or desirable, so that I can describe the AI skills a job needs.
48. As a hiring manager, I want to share a role template as a link or a YAML file, so that candidates can compare themselves against it.
49. As a worker, I want to import a target from a link or file into my logbook, so that I can compare myself against roles I'm considering.
50. As a worker, I want a target overlay on the grid showing target levels against my claims, so that I can see gaps visually.
51. As a worker, I want a ranked gap list, essential before desirable and then by size, so that I know what matters most.
52. As a worker, I want evidence gaps listed separately, where my claim meets the target but my badge doesn't, so that I know where evidence, not learning, is missing.
53. As a worker, I want to keep several targets in my logbook and switch between them, so that I can compare against more than one role.

### Outputs

54. As a worker, I want to generate my profile as print-ready HTML, giving each skill's current claim and badge with its evidence and the earlier snapshots where the level changed, so that I can attach it to a CV or application.
55. As a worker, I want the profile to use titles, and an option to use plain level names for formal use, so that it suits its audience.
56. As a worker, I want to export my profile as YAML, so that I can hand it to an agent or keep it in my own repository.
57. As a hiring manager, I want to render a role template as a print-ready position description using plain level names and descriptors, so that I can publish the role.
58. As a hiring manager, I want a position description without needing a logbook, so that I can describe a role I'm not applying for.
59. As a worker, I want to save to PDF from the browser's print dialog, so that no server is needed to make documents.

### Logbook files

60. As a worker, I want to export my whole logbook as a YAML file, so that I have a backup I can read and edit.
61. As a worker, I want to import a logbook YAML file, so that I can restore it or move it to another browser.
62. As a worker, I want the site to show when I last exported and nudge me when there are unexported changes, so that I don't lose work if browser storage is cleared.
63. As a worker, I want dates and codes in exported files written as quoted strings, so that a YAML parser never turns them into something else.
64. As a worker, I want an import to report clear errors for a malformed or invalid file, so that I can fix it rather than lose data.
65. As a worker, I want my logbook to record the framework version it was made against, so that I can see what changed since.
66. As a worker, I want retired skill codes in an old logbook, link or target mapped to their replacements on import, so that my claims survive framework changes.
67. As a worker, I want evidence items to keep the code they were logged under, so that my history stays true to what I recorded.
68. As a worker, I want to see my logbook's framework version next to the current one, so that I know when to review my claims.

### Framework maintenance

69. As a contributor, I want each skill in its own YAML file, so that my pull request touches one small, readable file.
70. As a contributor, I want the examples layer in its own file, so that a quarterly tool refresh can't change a skill's meaning.
71. As a contributor, I want to run one validation command locally, so that I find problems before opening a pull request.
72. As a maintainer, I want CI to validate every pull request, so that bad edits never reach the main branch.
73. As a maintainer, I want validation to fail when a skill's descriptors don't exactly cover its level range, so that every level in range is described.
74. As a maintainer, I want validation to fail on a code that isn't four capital letters, duplicates another, or collides with an SFIA 7–9 code, so that codes stay safe.
75. As a maintainer, I want validation to fail when a retired code's replacement doesn't exist, or a retired code is reused, so that old logbooks still map correctly.
76. As a maintainer, I want validation to fail when a descriptor names a product listed in the examples layer, so that skill text stays product-neutral.
77. As a maintainer, I want validation to fail when a skill names a category or subcategory not in the taxonomy, so that the tree stays consistent.
78. As a maintainer, I want error messages that name the file, the field and the rule broken, so that contributors can fix problems themselves.
79. As a maintainer, I want the review document regenerated from the YAML, so that reviewers keep a readable copy of every skill and level.
80. As a maintainer, I want the site's bundle generated from the YAML and never edited by hand, so that there is one source of truth.
81. As a maintainer, I want framework versions cut as tagged releases (major for retired codes or changed level meanings, minor for added skills or levels, patch for wording or examples), so that logbooks can say which version they used.
82. As a maintainer, I want the 53 skills and 277 descriptors migrated from Python to YAML with no change to content, so that the move is safe to review.

## Implementation Decisions

### Framework data (ADR 0005)

- The source of truth is YAML, in four kinds of file:
  - **Taxonomy file:** ordered categories and subcategories with display names.
  - **Skill files:** one per skill, holding code, name, category, subcategory, description, level range, a level-to-descriptor map, and mappings (SFIA codes and appliedAI ids).
  - **Examples file:** keyed by skill code, with one `as_of` date.
  - **Levels file:** the seven levels (number, plain name, title, mode, description, evidence hint), plus the framework's name, subtitle, version, licence and retired codes. Each retired code lists the code that replaced it.
- The migration is a one-off conversion of the current Python data, including the extra appliedAI mappings, into these files. It must produce an identical bundle (ignoring ordering), so it can be checked by comparing outputs. Afterwards the Python build and render scripts are deleted, along with the committed generated JSON and the old example logbook.
- A JSON Schema exists for each file type and for logbook files.

### Build (ADR 0006)

- The build is written in Node with no dependencies beyond a YAML parser that defaults to YAML 1.2 and a JSON Schema validator.
- **Framework module:** a pure module that loads parsed framework files and returns either a framework (an ordered tree of skills with levels, examples, mappings and retired codes) or a list of errors. Each error names the file, a field path and the rule broken. It is shared by the build, the site and any future maintenance interface.
- **Rules beyond the schema:**
  - descriptors exactly cover the level range;
  - codes are four capital letters and unique;
  - no code collides with an SFIA 7–9 code, taken from a reference list kept in the repo;
  - every `replaced_by` code exists, and no retired code is reused;
  - every skill's category and subcategory exist in the taxonomy;
  - no descriptor or skill description contains a product name from the examples layer (case-insensitive, whole word).
- The build has one command. It validates, writes the site bundle (one JSON file, generated and git-ignored, or committed only on release) and regenerates the review document. A validate-only mode is used by CI and contributors.
- CI runs validation, the tests and the type check on every pull request.

### Logbook core

- The logbook core is a pure module with no DOM and no storage. Its inputs are the framework, a logbook and today's date. It is the only place domain rules live.
- **Logbook shape (schema id `stm-logbook/0.1`; the exported file is called a logbook file):**
  - schema id, person, framework version;
  - an evidence log of items, each with an id, date, one or more codes, type, note, optional link and optional tools;
  - snapshots, each a date and a set of claims (code and level);
  - targets, each a name and target levels (code, level, and priority: essential or desirable);
  - per-skill overrides of first used and last practised.
- Dates are year-month or year-month-day strings. Comparisons treat a year-month as the first of that month.
- **What the core derives:**
  - **First used / last practised:** the earliest and latest non-learned evidence per skill, unless overridden.
  - **Badge level per claim:** the highest level, up to the claim, whose rule from ADR 0003 is met by evidence for that skill dated on or before the snapshot.
  - **Unevidenced levels:** the gap between the claim and the badge.
  - **Stale flag:** last practised more than 12 months before the snapshot date.
  - **Gaps:** target level minus the latest claim, ranked by priority then size.
  - **Evidence gaps:** the claim meets the target but the badge doesn't.
  - **History:** per skill, across snapshots.
- **Snapshot operations:** a new snapshot copies the latest one. A dated snapshot's claims are read-only, and the core refuses edits to them. Deletion is allowed. A missing skill means no claim.
- **Serialisation:**
  - **URL:** encode and decode a snapshot or target as a date or name plus code-level pairs, with a priority mark on target levels. It never carries evidence. A decoded link is a plain snapshot or target.
  - **YAML:** export and import of logbooks, targets and profiles. Dates and codes are always written as quoted strings. Imports are validated against the logbook schema, with readable errors.
  - **Retired codes:** on import, retired codes in claims and targets are mapped to their replacements. Evidence items keep their original codes, but count for the replacement skill (ADR 0004).
- **Profile model:** for each claimed skill, the current claim, badge, cited evidence, stale flag, and earlier snapshots where the level changed. The same model drives both the HTML and the YAML profile.
- **Position description model:** from a target alone, each skill with its target level, plain level name, descriptor and priority.

### Site (ADRs 0001, 0002, 0006)

- Static files only. Lit and the YAML library are vendored as ES modules, with no bundler and no build step for the site. JSDoc types are checked by `tsc` in CI.
- Components are thin. They render what the logbook core derives, and send user actions to it.
- **Storage adapter:** the only place that touches localStorage. It holds one logbook per browser, plus a last-exported timestamp and an unexported-changes flag.
- **URL adapter:** the only place that reads and writes the location hash, using the core's encoding.
- **Views:**
  - claims grid (with level text inline, the examples layer, the name/title toggle and a target overlay);
  - evidence log (with add, edit, delete and filters);
  - snapshots and history;
  - targets and gaps;
  - profile;
  - position description;
  - import/export.
- **DOM rules:** print views and forms render in the light DOM. The embeddable badge element uses shadow DOM, and takes its data from attributes or from a YAML profile it is pointed at. It never makes a network request to anywhere except the given source.
- The site can be hosted on any static host, for example GitHub Pages.

## Testing Decisions

- **Only external behaviour is tested.** A test feeds inputs through a public entry point and asserts on the outputs: derived results, errors, files written. Tests never look at internal helpers or data structures. A good test reads like a domain rule, for example "a claim of 5 backed only by a year of use shows a badge at 3".
- **Seam 1, the framework build:**
  - Tests run the build entry point against small fixture data directories, each breaking one rule: a five-letter code, a gap in a level range, an SFIA collision, a dangling `replaced_by`, a product name in a descriptor, an unknown subcategory, a schema violation. Each asserts the exact errors, naming file, field and rule.
  - One test runs against the real data and must pass.
  - A one-off migration test checks that the YAML-built bundle equals the bundle from the old Python build, captured before the Python is deleted.
- **Seam 2, the logbook core:**
  - Tests drive the core's public functions with framework fixtures and logbooks. They cover:
    - each badge rule and its boundaries (the three-month span, built counting at level 3, highest level up to the claim);
    - first used and last practised, with and without overrides, with learning excluded;
    - staleness measured from the snapshot date;
    - complete snapshots and refused edits to dated snapshots;
    - gap ranking and evidence gaps;
    - URL round-trips;
    - YAML round-trips, including quoted dates and codes that look like YAML booleans;
    - invalid-import errors;
    - retired-code mapping that preserves the original codes on evidence;
    - the profile and position description models.
- **Tooling:** Node's built-in test runner with no extra test dependencies. The core is plain ES modules, so the same tests run against the code the site loads.
- **UI:** components and the storage and URL adapters are not unit-tested. They're kept thin and checked by hand in a browser.
- **Prior art:** none in the repo. The only existing check is the level-range assertion in the Python build, which carries over as a validation rule.

## Out of Scope

- A maintenance interface for editing framework files. The layout and the shared framework module must allow one later.
- Any server, account, sync, endorsement by others, or verification of evidence (ADRs 0002, 0003).
- More than one logbook per browser.
- CSV and Markdown exports.
- Sample role templates shipped with the site.
- Changes to descriptor content, the consistency pass, and the PERS/HOME merge question.
- Translating the site into other languages.

## Further Notes

- `CLAUDE.md` build instructions and descriptor conventions point at the Python files. The migration ticket must update them, and the README layout, to the YAML layout and the Node commands.
- The schema id was agreed as `stm-profile/0.1` before "profile" came to mean the generated document. It's `stm-logbook/0.1` here to match the glossary. Nothing has been published under either id.
- The SFIA 7–9 code list used for collision checks is a list of codes only, which SFIA's terms allow. It is not SFIA text.
- Open decision E (PERS/HOME, and AUTV's user-side levels) may later retire codes. That will be the first real use of the retired-code path.
