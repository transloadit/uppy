---
"@uppy/angular": patch
---

Fix `<uppy-dashboard-modal [open]="true">` throwing `Cannot read properties of undefined (reading 'openModal')` on the first render. Angular runs `ngOnChanges` before `ngOnInit`, so the initial `open` value is now applied after the plugin is mounted.
