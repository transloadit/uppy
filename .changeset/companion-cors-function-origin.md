---
'@uppy/companion': patch
---

Fix OAuth logins when `corsOrigins` is a function. Companion saved the function's answer (such as `true` or a list of origins) as the login's origin instead of the client's origin, so `send-token` refused the login unless the function answered with that exact origin string. It now saves the client's origin whenever the function allows it.
