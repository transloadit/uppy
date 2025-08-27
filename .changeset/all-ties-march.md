---
"@uppy/status-bar": major
"@uppy/drag-drop": major
---

All packages now have export maps. This is a breaking change in two cases:

1. The css imports have changed from `@uppy[package]/dist/styles.min.css` to `@uppy[package]/css/styles.min.css`
2. You were importing something that wasn't exported from the root, for instance `@uppy/core/lib/foo.js`. You can now only import things we explicitly exported.
