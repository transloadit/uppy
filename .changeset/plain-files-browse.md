---
"@uppy/components": minor
"@uppy/react": minor
"@uppy/core": patch
---

Add an experimental `useStorageManager` hook and `createStorageManagerController` for manager-mode storage plugins such as `@uppy/s3`, so apps can render their own file manager instead of the ProviderView UI. ProviderView now exposes `submitDialog`, `cancelDialog` and `cancelLongOperation` for headless UIs.
