---
'@uppy/companion': minor
---

Tighten the OAuth flow:

- Requests with a `Content-Encoding` other than `identity` are rejected with 415.
- Grant input is limited to 32 flat string fields and 8 KiB. Requests to start a login accept only `state` and the provider's configured `dynamic` fields.
- OAuth app credentials fetched through `credentialsURL` can no longer be overridden through the query string.
- The OAuth callback and `send-token` pages only answer browser navigations, not `fetch()`.
- `send-token` checks the origin saved at login against the current `corsOrigins`.
- Cookie-authenticated thumbnails refuse credentialed cross-origin fetches. Ordinary `<img>` loads keep working.
- An `uppyAuthToken` query parameter is only accepted by `send-token`.
- With `COMPANION_PROTOCOL=https`, the standalone server's session cookie is `SameSite=Lax` and `Secure` whenever the request is seen as HTTPS, including through `X-Forwarded-Proto`. `COMPANION_COOKIE_DOMAIN` is still applied.
- The standalone server no longer stores sessions for requests that never write to them.
