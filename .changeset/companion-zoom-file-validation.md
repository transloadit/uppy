---
'@uppy/companion': patch
---

List Zoom recording files that come without an `id`, such as closed captions, and the meetings that only have those. Validate Zoom responses against the documented shape so a missing or unexpected optional field no longer hides a recording, and list each meeting of a year once, in the right year, outside UTC.
