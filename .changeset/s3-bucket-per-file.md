---
"@uppy/s3": patch
---

A selected file is imported from the bucket it was listed in, even when a later listing returns a different bucket. A key that was listed in two different buckets in one session is refused instead of guessing which one was selected; logging out clears this.
