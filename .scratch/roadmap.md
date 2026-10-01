# Roadmap: Speaker-to-Machines after the logbook site

Vocabulary follows CONTEXT.md. The logbook site (`.scratch/logbook-site/`, tickets in `done/`) is shipped. Each milestone below starts with `/grill-with-docs`, then `/to-spec` and `/to-tickets` under its own `.scratch/<milestone>/` directory.

Audience: Andrew first, then other individuals. Organisations come later.

## v0.2 Agent-kept logbook

Andrew stops adding evidence through the site. An agent reads his sources and keeps the logbook file up to date. Unblocks the content track.

### Logbook file as master copy

Status: needs-triage

The site opens a logbook file, works on a copy in localStorage and saves back to it (ADR 0007). Today's import and export become open and save.

### Private evidence

Status: needs-triage

An evidence item can be marked private. It counts towards badges, but the profile and embedded badge show only its date, type and skill codes. Needs a logbook schema change (an optional field; importer accepts files without it).

### Logbook skill

Status: needs-triage

An installable skill, kept as a plugin in this repo, that reads sources (CV, GitHub repositories, invoices, blog posts, emails) through whatever connectors the host already has and writes evidence items into the logbook file. It tags codes and types, marks private evidence, and suggests claims and new snapshots, but never makes a claim without the person's yes. It runs the logbook core from this repo and fetches the framework from the live site, so its output is valid by construction. The person reviews changes as a diff or in chat; there is no proposed-evidence state.

## v0.3 Readable anywhere

Other people can read a logbook and the framework comfortably.

### Mobile-friendly view

Status: needs-triage

Every view usable on a phone, the claims grid especially.

### Docs menu tree

Status: needs-triage

A browsable reference for the framework: categories, subcategories, skills and their levels with descriptors and the examples layer, in a menu tree separate from the claims grid.

### Profile viewer by URL

Status: needs-triage

Point the site at a profile YAML hosted anywhere and render it read-only, as the embedded badge already can.

## v0.4 Keeping current

The logbook and the framework don't go stale.

### Evidence suggestions

Status: needs-triage

For each unevidenced level, say what evidence would qualify, e.g. "one built item reaches 4".

### Staleness nudges

Status: needs-triage

List claims that will become stale claims in the next three months.

### Framework-change review

Status: needs-triage

When a logbook's framework version is behind, show which skills and levels changed and prompt a new snapshot. Must ship before any framework release that retires a code (e.g. a PERS/HOME merge); move it to v0.3 if that merge is ready sooner.

### Examples-layer refresh workflow

Status: needs-triage

A checklist or script for the periodic tool refresh, flagging an examples layer whose `as_of` is older than a set number of months.

### Logbook skill answers questions

Status: needs-triage

The logbook skill answers gaps against a target, lists stale claims, and drafts a profile on request, through the logbook core.

## Content track (in parallel)

### Andrew's logbook

Status: needs-triage

Fill in a real logbook against all 53 skills using the v0.2 logbook skill, noting mis-pitched levels and overlapping skills.

### Descriptor consistency pass

Status: needs-triage

Verb patterns per level, overlaps (SUPV/DELG, CTXM/INST, AUTV level 2/SUPV), and the thin INTP 6–7 and CLML 7 entries. Informed by Andrew's logbook.

### PERS/HOME decision

Status: needs-triage

Decide whether to merge. A merge retires a code and is a major framework version, so it waits for framework-change review.

## Later

### Search skills

Status: needs-triage

Find skills by name, code or descriptor text.

### Sample role templates

Status: needs-triage

Ship a few role templates with the site. Currently out of scope in the logbook-site spec.

### Compare links

Status: needs-triage

Open two claims links or targets side by side, with no server.

### Accessibility pass

Status: needs-triage

Keyboard, screen reader and contrast review across all views.

## Cut

Status: wontfix

- CSV and Markdown export.
- Offline/PWA install.
- Framework editing interface (the layout still allows one later).
- Accounts, sync, endorsement or verification (ADRs 0002, 0003, 0007).
- More than one logbook per browser; translation.
