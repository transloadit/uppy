---
"@uppy/svelte": patch
---

Fix the `props` type of the `Dashboard` and `DashboardModal` components. The published declarations referred to undeclared type names, so `props` was unchecked; it is now typed as `DashboardOptions`.
