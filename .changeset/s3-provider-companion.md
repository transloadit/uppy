---
"@uppy/companion": minor
---

Add an S3 provider (`/s3/*`) for browsing and managing S3-compatible object storage (AWS S3,
Cloudflare R2, MinIO, Transloadit Storage) from the Dashboard. It is configured under
`providerOptions.s3` (`COMPANION_S3_PROVIDER_*`), with its own optional credentials, region and
endpoint that fall back to the `s3` upload block, so browsing and uploading can use different
accounts and buckets.

The provider stays disabled until it is given one of two modes. Single-tenant: `bucket` (and
optionally `prefix`) names the one bucket everybody browses, so Companion has to sit behind your own
authentication. Multi-tenant: your server mints a short-lived storage grant per user after it
authenticated them, naming the bucket, the prefix they may see and whether they may write, and
Companion verifies it with `grantSecret` (HS256, several accepted so keys can be rotated) or
`grantPublicKey` (asymmetric, so Companion can verify grants but not mint them). The two modes are
exclusive: Companion refuses to start with both a grant key and `bucket`/`prefix`, or with neither. What the provider's credentials may reach at all
belongs in an IAM or bucket policy; Companion only enforces the prefix a grant carries.

Mutations — delete, rename/move a single file, and create folder — are exposed as
`POST /:provider/mutate/{delete,move,create-folder}` and are refused unless the grant carries write
scope. Moving a folder is orchestrated by the client, which walks the folder and moves its entries
one by one.

Single-file moves copy with `IfNoneMatch: *` and `CopySourceIfMatch`, and delete with `IfMatch`,
so an endpoint that honours conditional requests never overwrites a destination or deletes a
source that changed meanwhile (`s3Conflict`). User-facing failures are sent as `{ i18nKey }`, a
`@uppy/core` locale key the client translates; `{ message }` stays for text forwarded verbatim
from a provider's own API, which is all older Uppy versions read. Listings carry a `session` object (`bucket`, `prefix`, `canWrite`, `supportsMoveFolder`)
so the client can hide write actions and resolve typed paths. Downloads must name the bucket the
file was selected in (`?bucket=`), so a queued import cannot be read from a later session.

A second provider, `transloadit-storage` (configured under `providerOptions['transloadit-storage']`
with `apiEndpoint` and per-Workspace `workspaces` credentials, grants only), browses Transloadit
Storage over S3 and moves files and whole folders through the native catalog API, preserving asset
identity.
