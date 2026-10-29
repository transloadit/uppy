---
'@uppy/companion': patch
---

@uppy/companion: make silent and swallowed error paths observable.

- The remote OAuth credentials handler (`getCredentialsOverrideMiddleware`) now
  logs the error and responds with a 424 when the credentials service fails or
  sends credentials Companion cannot use (a misconfigured Template Credential,
  or a bad `transloadit_gateway`), and with a 500 for any other error, instead
  of sending the "Could not fetch credentials" page with a default 200 status.
- The Redis pub/sub emitter no longer crashes Companion. A failed connection,
  publish or subscribe used to be emitted as `error` with no listener, which
  threw: an unhandled rejection or uncaught exception. Such failures are now
  logged and fail the call that caused them, including imports waiting for
  their socket, once ioredis gives up on the command (`maxRetriesPerRequest`:
  about 10 seconds with its default options). ioredis reconnects
  and retries on its own, so Companion recovers when Redis comes back, also
  when it was down at startup. A message on a subscribed channel that is not a
  JSON array is now logged and dropped, and no longer cancels a `once()`
  subscription. Logs carry only error names and messages and the start of a
  token, never Redis command arguments, request headers or message bodies.
- Failing to abort a tus upload (on pause or cancel) and failing to delete a
  temp file are now logged instead of being swallowed or left unhandled.
