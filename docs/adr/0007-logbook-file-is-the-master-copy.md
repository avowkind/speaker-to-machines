# The logbook file is the master copy, not the browser

Supersedes the storage part of ADR 0002.

A person's logbook is a YAML logbook file kept wherever they choose: a private repository, a local folder or a synced drive. The site opens that file, works on a copy in localStorage, and saves back to it. Agents (an installable logbook skill run from Claude, Slack or similar) read sources such as a CV, repositories, invoices and posts, and write evidence items straight into the same file. The person reviews the agent's changes where the agent works, as a diff or a chat confirmation, so the domain has no "proposed evidence" state.

The rest of ADR 0002 stands. The site stores nothing on any server, has no accounts or sync, and a URL still never carries evidence.

We considered keeping the browser as the master copy and having agents produce files of new items for the person to import. That keeps two copies that drift, and the person who most needs agent logging is the one who won't add evidence through the site. We also considered supporting both modes equally. Two master copies would double the import, merge and export paths for little gain, since the browser-only user can still open and save a logbook file.
