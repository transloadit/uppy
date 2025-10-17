---
"@uppy/core": patch
"@uppy/utils": patch
---

- Make `file.data` nullable - Because for ghosts it will be `undefined` and we don't have any type to distinguish ghosts from other (local) files. This caused a crash, because we didn't check for `undefined` everywhere (when trying to store a blob that was `undefined`)
- Introduce new field `progress`.`complete`: if there is a post-processing step, set it to `true` once post processing is complete. If not, set it to `true` once upload has finished.
- Throw a proper `Nonexistent upload` error message if trying to upload a non-existent upload, instead of TypeError
- Rewrite `Uppy.upload()` - this fixes two bugs:
  1. No more duplicate emit call when this.#restricter.validateMinNumberOfFiles throws (`#informAndEmit` and `this.emit('error')`)
  2. 'restriction-failed' now also gets correctly called when `checkRequiredMetaFields` check errors.
- Don't re-upload completed files #5930
- Split UppyFile into two intefaces distinguished by the `isRemote` boolean:
  - LocalUppyFile
  - RemoteUppyFile
- Remove TagFile type - Use UppyFile instead.
- Make `name` required on UppyFile (it is in reality always set)
- Fix bug: `RestrictionError` sometimes thrown with a `file` property that was *not* a `UppyFile`, but a `File`. This would happen if someone passed a `File` instead of a `MinimalRequiredUppyFile` into `core.addFile` (which is valid to do according to our API)
- Improve some log messages
- Simplify Uppy `postprocess-complete` handler
