---
"@uppy/companion": minor
---

Add an S3 provider (`/s3/*`) for browsing S3-compatible object storage (AWS S3, Cloudflare R2, MinIO, Transloadit Storage) with simple auth (`bucket[/prefix]`), plus optional mutations: delete, rename/move (files and folders) and create folder via `POST /:provider/mutate/{delete,move,create-folder}`. Browsing is off unless `s3.browsableBuckets` / `COMPANION_AWS_BROWSABLE_BUCKETS` allowlists buckets, and mutations are off unless `s3.mutableBuckets` / `COMPANION_AWS_MUTABLE_BUCKETS` does.
