---
"@uppy/utils": major
"@uppy/angular": patch
"@uppy/google-photos-picker": patch
"example-companion-custom-provider": patch
"@uppy/google-drive-picker": patch
"@uppy/thumbnail-generator": patch
"@uppy/companion-client": patch
"@uppy/golden-retriever": patch
"@uppy/provider-views": patch
"@uppy/remote-sources": patch
"@uppy/screen-capture": patch
"@uppy/store-default": patch
"@uppy/google-drive": patch
"@uppy/image-editor": patch
"@uppy/react-native": patch
"@uppy/drop-target": patch
"@uppy/transloadit": patch
"@uppy/components": patch
"@uppy/compressor": patch
"@uppy/xhr-upload": patch
"@uppy/companion": patch
"@uppy/dashboard": patch
"@uppy/instagram": patch
"@uppy/facebook": patch
"@uppy/onedrive": patch
"@uppy/unsplash": patch
"angular": patch
"@uppy/dropbox": patch
"@uppy/locales": patch
"@uppy/aws-s3": patch
"@uppy/svelte": patch
"@uppy/webcam": patch
"@uppy/webdav": patch
"example-transloadit": patch
"@uppy/audio": patch
"@uppy/react": patch
"example-xhr-bundle": patch
"@uppy/core": patch
"@uppy/form": patch
"@uppy/zoom": patch
"example-sveltekit": patch
"@uppy/box": patch
"@uppy/tus": patch
"@uppy/url": patch
"@uppy/vue": patch
"example-angular": patch
"uppy": patch
"example-vue": patch
"@uppy-dev/dev": patch
---

Updated export maps for @uppy/utils: removed nested subpath exports; all utilities are now exported from the root index.js.


**Before :**

```typescript

import getFileTypeExtension from '@uppy/utils/lib/getFileTypeExtension'

```

**After :**

```typescript

import { getFileTypeExtension } from '@uppy/utils'

```