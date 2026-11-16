---
"@uppy/companion": patch
---

The errors for `accessKeyId`/`secretAccessKey` in the S3 options no longer point at `providerOptions.s3`. The same check runs for the top-level `s3` upload option and for the S3 providers, so the messages now name only the `key` and `secret` options.
