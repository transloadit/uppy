---
'@uppy/aws-s3': patch
---

A blank `key` returned by `signRequest` is now treated as no override; the requested key is used instead.
