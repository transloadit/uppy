---
"@uppy/companion": minor
---

Add an S3 provider (`/s3/*`) for browsing S3-compatible object storage (AWS S3, Cloudflare R2, MinIO, Transloadit Storage) with simple auth (`bucket[/prefix]`), plus optional mutations: delete, rename/move (files and folders) and create folder via `POST /:provider/mutate/{delete,move,create-folder}`. Browsing is off unless `s3.browsableBuckets` / `COMPANION_AWS_BROWSABLE_BUCKETS` allowlists buckets, and mutations are off unless `s3.mutableBuckets` / `COMPANION_AWS_MUTABLE_BUCKETS` does.

Also changes how the webdav provider classifies a 401. Moving its error mapping into `mapProviderError` turned the old assign-then-overwrite into early returns, and because the `webdav` package sets both `status` and `response` on every non-2xx response the auth branch used to be dead code. A 401 while listing or downloading now surfaces as an auth error (HTTP 401) rather than a generic `ProviderApiError` (HTTP 424), so the client drops the session and re-prompts instead of showing a plain failure.
