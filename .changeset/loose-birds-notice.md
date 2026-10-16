---
"@uppy/companion": patch
---

Fix the return type of `server()`. It was inferred as `import("express-serve-static-core").Express`, a transitive dependency that consumers can't always resolve; it is now explicitly typed as `Express` from `express`.
