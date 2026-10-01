# 01: Move the framework data to YAML with a Node build

**What to build:** Framework data stops living in Python. The taxonomy, the 53 skills, the examples layer and the levels become hand-editable YAML files (one file per skill), as described in the spec and design §5. A shared Node framework module loads them, and a single build command writes the site bundle and regenerates the review document. This is the prefactor every other ticket builds on. Content must not change: the YAML-built bundle has to match what the Python build produced.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

Spec: ../spec.md

- [x] Taxonomy, per-skill, examples and levels YAML files exist and hold all 53 skills, 277 descriptors, examples, SFIA and appliedAI mappings (including the extra appliedAI mappings) and the framework's name, version and licence
- [x] The levels file has an empty list of retired codes, ready for ADR 0004
- [x] The shared framework module loads the parsed files and returns a framework or a list of errors; for now it enforces only that descriptors exactly cover the level range
- [x] One build command writes the site bundle (git-ignored) and regenerates the review document, with output unchanged in content
- [x] A one-off test, run against a bundle captured from the Python build before deletion, shows the new bundle is equal ignoring key order
- [x] A Node test using the built-in runner shows a fixture skill with a missing level fails with an error naming the file, field and rule
- [x] The Python build and render scripts, the generated skills JSON and the levels JSON are deleted
- [x] CLAUDE.md (build command and descriptor conventions) and the README layout describe the YAML files and Node commands

## Comments

Shipped in 59f0dcd.
