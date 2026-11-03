---
"@uppy/core": patch
"@uppy/box": patch
"@uppy/dropbox": patch
"@uppy/facebook": patch
"@uppy/google-drive": patch
"@uppy/google-drive-picker": patch
"@uppy/google-photos-picker": patch
"@uppy/onedrive": patch
"@uppy/s3": patch
"@uppy/unsplash": patch
"@uppy/webdav": patch
"@uppy/zoom": patch
---

Only access `localStorage` when a provider plugin's default token storage is used, so the plugins can be constructed during server-side rendering again.
