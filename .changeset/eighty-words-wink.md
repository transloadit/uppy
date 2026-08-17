---
"@uppy/screen-capture": minor
"@uppy/dashboard": minor
"@uppy/core": minor
---

Narrow a number of `any` types to real types. Some affect the public interface.

This also fixes some bugs the new types revealed:

- The "copy link" helper now actually applies its styles to the temporary textarea it creates. Previously the style object was stringified to `"[object Object]"`, leaving the textarea unstyled and able to scroll the page when selected.
- Cancelling the file card now emits `dashboard:file-edit-complete` with the file being edited, instead of `undefined`.
- The "missing required meta fields" message now passes the file to a `metaFields` callback, which previously received `undefined`, and no longer throws when a field listed in the `requiredMetaFields` restriction has no matching entry in `metaFields`.
