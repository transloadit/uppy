---
"@uppy/core": patch
"@uppy/dashboard": patch
---

Unmount UI plugins' Preact trees and remove the Dashboard modal's keyboard listener during uninstall. Removing an open DashboardModal now releases keyboard focus, restores focus to the element that had it before the modal opened (if that element is still on the page), and runs component cleanup, including pending panel transitions.
