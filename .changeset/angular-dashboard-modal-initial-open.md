---
"@uppy/angular": patch
---

Fix `<uppy-dashboard-modal [open]="true">` throwing `Cannot read properties of undefined (reading 'openModal')` on the first render. Angular runs `ngOnChanges` before `ngOnInit`, so the initial `open` value is now applied after the plugin is mounted.

Also keep an open `<uppy-dashboard-modal>` open when its `uppy` input is swapped for another instance; it used to close because the plugin is reinstalled on the new instance.
