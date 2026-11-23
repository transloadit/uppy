---
'@uppy/companion': minor
---

Tighten the OAuth flow:

- OAuth `/connect` requests with a `Content-Encoding` other than `identity` are rejected with 415, also when the host app already inflated the body.
- Grant input is limited to 32 flat string fields and 8 KiB. Requests to start a login accept only `state` and the provider's configured `dynamic` fields. When a callback is rejected, the waiting Uppy client is told right away.
- OAuth app credentials fetched through `credentialsURL` can no longer be overridden through the query string.
- The OAuth callback and `send-token` pages only answer browser navigations, not `fetch()`.
- `send-token` checks the origin saved at login against the current `corsOrigins`, and tells a waiting Uppy client when it refuses. An `Access-Control-Allow-Origin` header the host app set is only saved as the origin when `corsOrigins` allows it.
- Cookie-authenticated thumbnails refuse credentialed cross-origin fetches. Ordinary `<img>` loads keep working.
- An `uppyAuthToken` query parameter is only accepted by `send-token`.
- With `COMPANION_PROTOCOL=https`, the standalone server's session cookie is `SameSite=Lax` and `Secure` whenever the request is seen as HTTPS, including through `X-Forwarded-Proto`. `COMPANION_COOKIE_DOMAIN` is still applied.
- The standalone server no longer stores sessions for requests that never write to them.
