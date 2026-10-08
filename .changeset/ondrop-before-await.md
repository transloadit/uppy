---
'@uppy/dashboard': patch
'@uppy/drag-drop': patch
'@uppy/drop-target': patch
---

`onDrop` now runs before dropped files are read, while `event.dataTransfer`
still holds the dropped items. Dropped files are not in state yet at that point.
