---
"@uppy/core": patch
---

Validate Google Picker responses before importing them. `@types/google.picker`
v0.0.52 correctly types `docs`, `name` and `mimeType` as optional, so the picker
now throws a descriptive error instead of importing a file with an undefined
name or mime type. Shortcut metadata on the picked document is preserved.
