---
"@uppy/transloadit": minor
---

Keep `assemblyStatus` in plugin state accurate: advance `ok` to `ASSEMBLY_EXECUTING` when SSE reports that uploading finished, keep `progress_combined` across full status refetches, expose the assembly error as `error` in plugin state (typed as `AssemblyStateError`, which includes the API response fields spread onto it), and close the assembly and clear its state as soon as `cancel-all` fires (even if the cancel request fails). `transloadit:assembly-cancelled` now fires after the assembly has been cleared, with the status as it was at the moment of cancelling. An errored assembly no longer keeps its previous `ok`, so check `error` rather than `ok` to detect failure. `transloadit:complete` is no longer emitted for an assembly that was cancelled or replaced while its final-status request was still in flight.
