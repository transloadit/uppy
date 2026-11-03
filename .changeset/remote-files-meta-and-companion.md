---
"@uppy/tus": patch
"@uppy/transloadit": patch
---

`@uppy/tus`: remote (Companion) files now send only the `allowedMetaFields` to Companion, like local files. `@uppy/transloadit`: remote files are moved to the Assembly's `companion_url` only when that URL is an `https` Transloadit Companion URL too (including regional hosts such as `api2-us-east-1`).
