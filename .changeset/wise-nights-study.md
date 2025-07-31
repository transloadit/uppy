---
"@uppy/svelte": major
"@uppy/react": major
"@uppy/vue": major
"@uppy/google-photos-picker": minor
"@uppy/google-drive-picker": minor
"@uppy/thumbnail-generator": minor
"@uppy/companion-client": minor
"@uppy/golden-retriever": minor
"@uppy/provider-views": minor
"@uppy/remote-sources": minor
"@uppy/screen-capture": minor
"@uppy/store-default": minor
"@uppy/google-drive": minor
"@uppy/image-editor": minor
"@uppy/react-native": minor
"@uppy/drop-target": minor
"@uppy/transloadit": minor
"@uppy/components": minor
"@uppy/compressor": minor
"@uppy/status-bar": minor
"@uppy/xhr-upload": minor
"@uppy/companion": minor
"@uppy/dashboard": minor
"@uppy/instagram": minor
"@uppy/facebook": minor
"@uppy/onedrive": minor
"@uppy/unsplash": minor
"angular": minor
"@uppy/dropbox": minor
"@uppy/locales": minor
"@uppy/aws-s3": minor
"@uppy/webcam": minor
"@uppy/webdav": minor
"@uppy/audio": minor
"@uppy/utils": minor
"@uppy/core": minor
"@uppy/form": minor
"@uppy/zoom": minor
"example-sveltekit": minor
"@uppy/box": minor
"@uppy/tus": minor
"@uppy/url": minor
"uppy": minor
"example-vue": minor
---

### Changed imports for `@uppy/react`, `@uppy/vue`, and `@uppy/svelte`

Some components, like Dashboard, require a peer dependency to work but since all components were exported from a single file you were forced to install all peer dependencies. Even if you never imported, for instance, the status bar component.

Every component that requires a peer dependency has now been moved to a subpath, such as `@uppy/react/dashboard`, so you only need to install the peer dependencies you need.

**Example for `@uppy/react`:**

**Before:**
```javascript
import { Dashboard, StatusBar } from '@uppy/react'
```

**Now:**
```javascript
import Dashboard from '@uppy/react/dashboard'
import StatusBar from '@uppy/react/status-bar'
```

