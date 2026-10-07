---
"@uppy/core": patch
---

Remote providers: if a selected folder fails to load after pressing "Done" (for example Companion returns an error), or the pick is cancelled while folders are loading, no files are added: the picker stays open with the selection kept, and the error is logged. Previously the files that did load were added and the selection was cleared, as if everything had succeeded.
