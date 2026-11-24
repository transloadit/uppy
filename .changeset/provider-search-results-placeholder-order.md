---
"@uppy/core": patch
---

Fix two provider search bugs and an ordering bug in provider folders. A search result whose path has no segments (such as `/`) no longer crashes the Dashboard with "Partial tree not complete". Results that share a path, such as Dropbox items that older Companion versions sent with the path `undefined`, now show once instead of showing the first item twice. A file or folder you reached through a search or a deep link before its folder was listed now stays below the loaded items while you scroll, until the page that contains it loads, instead of sitting between the first and second page.
