---
'@uppy/companion': patch
---

@uppy/companion: make silent and swallowed error paths observable.

- The remote OAuth credentials handler (`getCredentialsOverrideMiddleware`) now
  logs the error and responds with a 500 instead of sending the "Could not fetch
  credentials" page with a default 200 status, so a failed credential fetch (a
  misconfigured Template Credential, or a bad `transloadit_gateway`) is no longer
  invisible to logs and monitoring.
- The Redis pub/sub emitter now logs connection, publish/subscribe and
  invalid-message failures, which were routed to a listenerless `error` event and
  dropped; the emit is now guarded so it only fires when a listener exists.
- The tus abort-on-cancel path and the temp-file cleanup now log on failure
  instead of silently swallowing the error.
