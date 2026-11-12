---
"@uppy/core": patch
---

Remote providers:

- If a selected folder fails to load after pressing "Done", no files are added and the picker stays open with the selection kept. Previously the files that did load were added and the selection was cleared, as if everything had succeeded. Cancelling while folders load (`uppy.cancelAll()`) also adds nothing; closing the panel adds nothing and clears the selection.
- A failed Companion request now shows "Connection with Companion failed" through `uppy.info()`, which the Dashboard displays, when pressing "Done", opening a folder, loading more items, searching, logging out, or logging in with a username and password (WebDAV). A failed OAuth login is still only logged. Previously only Companion's user-facing errors were shown, and the rest were only logged. Errors that did not come from Companion are still only logged, and an expired login still shows the login screen.
