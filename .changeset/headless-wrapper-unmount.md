---
"@uppy/react": patch
"@uppy/vue": patch
"@uppy/svelte": patch
---

The headless components (`Dropzone`, `FilesGrid`, `FilesList`, `ProviderIcon`, `Thumbnail`, `UploadButton`) now unmount their inner Preact tree when they unmount. Before, its cleanup never ran, so `Thumbnail` never revoked the object URLs it created.
