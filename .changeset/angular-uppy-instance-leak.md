---
"@uppy/angular": patch
---

Fix a memory leak in `DashboardComponent`, `DashboardModalComponent` and `StatusBarComponent`.
Their `uppy` input defaulted to `new Uppy()`, and since Uppy registers `online`/`offline`
listeners on `window` in its constructor and only removes them in `destroy()`, every one of
those default instances stayed reachable from `window` for the lifetime of the page - including
the ones that were immediately replaced by a `[uppy]` binding and never used.

The components no longer create a default eagerly. The wrapper creates an instance in `onMount`
only when nothing was passed in, and destroys that one (and only that one) on teardown; instances
passed in from the outside remain the caller's responsibility. Note that reading `component.uppy`
before `ngOnInit` now returns `undefined` instead of a throwaway instance.
