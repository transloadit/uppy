---
"@uppy/companion": patch
---

Drop seven small dependencies: `express-interceptor`, `helmet`, `node-schedule`, `cookie-parser`, `serialize-javascript`, `escape-goat` and `escape-string-regexp`. Companion now sets the same four security headers itself, runs the daily clean-up job at 23:00 with a timer, and parses cookies with the `cookie` package that Express already uses, so cookie values always stay strings (no `j:` JSON cookies) and `req.signedCookies` is no longer set. The grant error interceptor is removed: grant 5 never sends the response body it rewrote. `shouldInterceptGrantError` is deprecated but still exported.
