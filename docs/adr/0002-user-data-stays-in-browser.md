# User data never leaves the person's browser

Superseded in part by ADR 0007: the logbook file, not localStorage, is the master copy.

The site stores no profile data on any server, including GitHub. State lives in the URL (a shareable encoding of selected skills and levels) and in browser localStorage for persistence. Documents are exported to the person's own machine. This rules out accounts, sync and server-side rendering. It keeps the site a static page that needs no privacy review, because the person alone holds their evidence.

The URL holds a single snapshot only: its date and the CODE-LEVEL pairs of its claims. It never holds evidence, which can be long and personal and would travel wherever the link is pasted. A shared link therefore shows plain claims and never badges.
