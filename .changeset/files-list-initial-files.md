---
"@uppy/components": patch
---

`FilesList`, `FilesGrid` and the `status` and `progress` from `UppyContextProvider` now reflect files that were added before they mounted. Before, the lists stayed empty and the status stayed `init` until the next file change, for example after being hidden and shown again.
