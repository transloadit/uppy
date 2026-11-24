---
"@uppy/core": patch
"@uppy/s3": patch
---

Fix two provider search bugs and an ordering bug in provider folders.

- A search result whose path has no segments (such as `/`) no longer crashes the Dashboard with "Partial tree not complete".
- Search results that share a path (older Companion versions sent `undefined` for some Dropbox items) are now listed as one entry instead of repeating the first one.
- A file or folder that a search or an S3 deep link added to a folder before that folder listed it now stays below the loaded items while you scroll, until the page that contains it loads, instead of sitting between the first and second page.
