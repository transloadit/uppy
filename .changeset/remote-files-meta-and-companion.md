---
"@uppy/tus": patch
"@uppy/transloadit": patch
---

`@uppy/tus`: remote (Companion) files now send only the `allowedMetaFields` to Companion, like local files. `@uppy/transloadit`: remote files are moved to the Assembly's `companion_url` only when that URL is an `https` Transloadit Companion URL too (including regional hosts such as `api2-us-east-1`). If you restrict `allowedMetaFields` without `name` and `type`, remote files now reach Companion without them, so Companion names the upload `uppy-file-<uuid>` and sends no `filetype`; add `name` and `type` to `allowedMetaFields` to keep the real file names and types.
