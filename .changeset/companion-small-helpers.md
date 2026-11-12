---
"@uppy/companion": patch
---

Drop eight small dependencies: `express-interceptor`, `helmet`, `node-schedule`, `cookie-parser`, `serialize-javascript`, `escape-goat`, `escape-string-regexp` and `p-map`. Companion now sets the same four security headers, runs the daily clean-up job at 23:00 with a timer, parses cookies itself and has small local equivalents of the rest. The grant error interceptor is removed: grant 5 never sends the response body it rewrote. `shouldInterceptGrantError` is deprecated but still exported.
