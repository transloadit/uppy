---
"@uppy/transloadit": minor
---

Keep `assemblyStatus` in plugin state accurate: advance `ok` to `ASSEMBLY_EXECUTING` when SSE reports that uploading finished, keep `progress_combined` across full status refetches, expose the assembly error as `error` in plugin state, and close the assembly and clear its state as soon as `cancel-all` fires (even if the cancel request fails).
