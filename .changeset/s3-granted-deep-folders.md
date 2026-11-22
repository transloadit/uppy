---
"@uppy/core": patch
"@uppy/s3": patch
---

S3: opening a granted deep folder such as `tenant/photos/2026/` now lists only that folder instead of the root and every folder above it. Empty or missing folders are still checked against their parent's listing, so a stale link still stops at the nearest existing folder. A path outside the grant shows the root.

Remote providers: a folder that was added to the tree before its parent was listed (for its breadcrumbs or as a search result) now appears in the parent's listing order once the parent is opened, and no longer appears twice when it is on a later page.
