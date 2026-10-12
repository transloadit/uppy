---
"@uppy/audio": patch
"@uppy/components": patch
"@uppy/core": patch
"@uppy/dashboard": patch
"@uppy/drag-drop": patch
"@uppy/drop-target": patch
"@uppy/image-editor": patch
"@uppy/image-generator": patch
"@uppy/react": patch
"@uppy/screen-capture": patch
"@uppy/status-bar": patch
"@uppy/svelte": patch
"@uppy/url": patch
"@uppy/vue": patch
"@uppy/webcam": patch
"uppy": patch
---

Move the source map of the minified CSS into a separate file. The `.min.css` files, and `image-editor.css` in `@uppy/components`, `@uppy/react`, `@uppy/vue` and `@uppy/svelte`, embedded it inline and were larger than the unminified CSS. They now link to an external `.css.map` instead, at about half the gzipped size.