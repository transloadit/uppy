---
"@uppy/s3": patch
---

A folder move or delete stops handing out files after the first failure and waits for the files already in flight before it fails, instead of reporting the failure while its other workers keep going.
