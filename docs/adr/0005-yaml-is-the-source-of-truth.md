# YAML files are the source of truth for framework data and logbooks

The framework's skills and levels are kept as YAML files that people edit directly, not generated from Python. That makes them reviewable in a pull request by outside contributors, and editable later by a maintenance interface without anyone touching code. Scripts may validate the files and generate other forms from them, such as the review document or a bundle for the site, but nothing generated is edited by hand.

Files a person holds (the exported logbook, a saved profile, a target) are also YAML, because people read them and hand them to agents. To guard against YAML's implicit typing, the site writes dates and skill codes as quoted strings, so that 2026-09 stays a string and a code such as ON never becomes a boolean.

We considered JSON, which browsers read natively, and keeping Python as the source with JSON as build output. JSON is harder for people to read and edit, and Python as the source shuts out contributors who don't code. The cost is a YAML parser in the site and a validation step in place of Python's structure.
