---
"@uppy/core": patch
"@uppy/aws-s3": patch
---

Work in insecure contexts (plain HTTP on a host other than localhost), where browsers don't provide `crypto.randomUUID()`:

- @uppy/aws-s3: uploads with the default object key (`<uuid>-<file name>`) no longer fail.
- @uppy/core: logging in to a remote provider through Companion (OAuth) no longer fails.

Both now fall back to a version 4 UUID built from `crypto.getRandomValues()`, which is available in all contexts and is just as cryptographically secure. The helper is exported as `randomUUID` from `@uppy/core/utils`.
