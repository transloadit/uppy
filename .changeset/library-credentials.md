---
'@uppy/companion': minor
---

Allow the native Transloadit Storage provider to resolve Workspace credentials from API2 at runtime,
using a server-only `credentialsSecret` instead of a static `workspaces` map. Existing static
configurations remain supported. This avoids a Companion restart when enabling another Workspace.
