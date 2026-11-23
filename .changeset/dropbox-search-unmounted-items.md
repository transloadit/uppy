---
"@uppy/companion": patch
"@uppy/core": patch
---

Fix the Dashboard crashing with "Partial tree not complete" when a Dropbox search
matched items that aren't mounted in the user's Dropbox (e.g. shared folders that
weren't added), which have no path. Companion now leaves such items out, since they
can't be browsed or addressed by path, instead of sending the request path
`undefined`. The search view also now uses the ids it gave the results in its tree,
so such a request path from an older Companion no longer breaks rendering.
