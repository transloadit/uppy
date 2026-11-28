---
'@uppy/transloadit': patch
---

Resume polling for Assembly status when the live event stream disconnects, so an upload can still finish when the stream cannot reconnect.

A cancellation observed through polling now settles the upload with `ASSEMBLY_CANCELED`, including when waiting only for metadata.
