---
"@uppy/aws-s3": major
---

`@uppy/aws-s3` has been rewritten from scratch ([#6345](https://github.com/transloadit/uppy/pull/6345)).

The plugin is now built on a standalone S3 client and configuration is reduced to three
mutually exclusive signing modes:

- `getCredentials` — client-side SigV4 signing with temporary credentials
- `signRequest` — bring your own signer
- `companionEndpoint` — Companion signing

Companion is no longer required in the data path, and any S3-compatible service (R2,
MinIO, DigitalOcean Spaces, …) works.

**Removed options:** `endpoint`, `getTemporarySecurityCredentials`, `getUploadParameters`,
`signPart`, `createMultipartUpload`, `listParts`, `abortMultipartUpload`,
`completeMultipartUpload`, `uploadPartBytes`, `retryDelays`.

**New options:** `s3Endpoint`, `region`, `getCredentials`, `signRequest`,
`companionEndpoint`, `generateObjectKey`.

**Unchanged:** `shouldUseMultipart`, `getChunkSize`, `allowedMetaFields`, `limit`.

See the migration guide for before/after examples for each signing mode.
