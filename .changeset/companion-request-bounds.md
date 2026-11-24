---
'@uppy/companion': patch
---

Bound the work a single client can queue in Companion. An upload socket is now closed when it has more than 16 actions pending or sends malformed JSON, and the standalone server answers with 429 once a connection has 100 HTTP requests pending. Redis messages are dispatched through one pattern listener, and a failed Redis command no longer crashes the process when nothing listens for its error. Standalone 500 responses no longer include the raw error or its message, in development as well as production.
