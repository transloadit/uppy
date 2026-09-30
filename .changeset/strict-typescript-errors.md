---
"@uppy/core": minor
"@uppy/audio": patch
"@uppy/aws-s3": patch
"@uppy/dashboard": patch
"@uppy/s3": patch
"@uppy/screen-capture": patch
"@uppy/thumbnail-generator": patch
"@uppy/transloadit": patch
"@uppy/url": patch
"@uppy/webcam": patch
"@uppy/xhr-upload": patch
---

Stricter TypeScript: caught errors are typed as `unknown`, and `noImplicitOverride` and `noImplicitReturns` are enabled for all packages.

- `@uppy/core/utils`: add `toError`, `getErrorMessage`, `isAbortError` and `isRestrictionError` helpers. `@uppy/core/companion-client`: export `isAuthError`.
- `@uppy/webcam`: `icon` is now public, like on other acquirer plugins. `start()` now returns a promise that settles once the camera is ready, instead of `undefined`.
- `@uppy/url`: `handleRootDrop` and `handleRootPaste` are now public, as Dashboard and DropTarget call them. The failed-fetch notification's `details` is now the error message instead of the Error object.
