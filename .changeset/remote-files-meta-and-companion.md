---
"@uppy/tus": patch
"@uppy/transloadit": patch
---

`@uppy/tus`: remote (Companion) files now send only the `allowedMetaFields` to Companion, plus `name` and `type`, which local files always send too. `@uppy/transloadit`: remote files are moved to the Assembly's `companion_url` only when that URL is a Transloadit Companion too (including regional hosts such as `api2-us-east-1`).
