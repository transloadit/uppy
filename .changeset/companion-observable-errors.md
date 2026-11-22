---
'@uppy/companion': patch
---

@uppy/companion: make silent and swallowed error paths observable.

- The remote OAuth credentials handler (`getCredentialsOverrideMiddleware`) now
  logs the error and responds with a 424 when the credentials service fails or
  sends credentials Companion cannot use (a misconfigured Template Credential,
  or a bad `transloadit_gateway`), and with a 500 for any other error, instead
  of sending the "Could not fetch credentials" page with a default 200 status.
- The Redis pub/sub emitter recovers when Redis comes back, also when it was
  down at startup: it no longer waits on a single connection attempt, and
  ioredis reconnects and re-subscribes on its own. A failed connection, publish
  or subscribe fails the call that caused it, including imports waiting for
  their socket, once ioredis gives up on the command (`maxRetriesPerRequest`:
  about 10 seconds with its default options). With `maxRetriesPerRequest: null`
  commands never fail, and such an import ends with the
  `clientSocketConnectTimeout` (60 seconds by default) instead. A failed `on()`
  no longer leaves its listener behind. A message on a subscribed channel that
  is not a JSON array is now logged and dropped instead of failing every import
  waiting to start, and no longer cancels a `once()` subscription. A failed
  connect is logged with the reason for each address. Logs carry only error
  names, codes and messages and the start of a token, never Redis command
  arguments, request headers or message bodies.
- Failing to abort a tus upload (on pause or cancel) and failing to delete a
  temp file are now logged instead of being swallowed or left unhandled.
