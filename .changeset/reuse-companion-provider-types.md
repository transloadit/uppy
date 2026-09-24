---
"@uppy/companion": patch
---

Reuse shared option and response types for all Companion provider methods. Some provider method types were widened to match the base `Provider` class:

- `logout()` of Box, Dropbox and Facebook now returns `{ revoked: boolean }` instead of `{ revoked: true }`.
- Zoom `deauthorizationCallback()` headers may now be `string | string[]`.
- Zoom `list()` query is now the generic `Query` type instead of `{ cursor?: string | null }`.
