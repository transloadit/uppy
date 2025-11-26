---
"@uppy/aws-s3": patch
"@uppy/core": patch
"@uppy/tus": patch
"@uppy/utils": patch
"@uppy/xhr-upload": patch
---

Fix: Move completed uploads exclusion logic into uploaders. This fixes the problem where postprocessors would not run for already uploaded files.
