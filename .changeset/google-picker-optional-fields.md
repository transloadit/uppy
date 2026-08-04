---
"@uppy/core": patch
---

Type `name` and `mimeType` on `PickedItemBase` as optional, matching what the
Google Picker actually returns. `@types/google.picker` v0.0.52 corrected these
to be optional because views other than Drive documents may omit them. Files
picked without a name or mime type are passed through and resolved by Companion
rather than failing the whole selection.

`name` is now also optional on `MinimalRequiredUppyFile` (the type accepted by
`uppy.addFile()`/`addFiles()`), which matches the existing runtime behaviour —
`getFileName` already falls back to the mime type or `noname` when a file
descriptor has no name.
