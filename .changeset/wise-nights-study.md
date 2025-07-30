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

### Breaking Changes for `@uppy/react`, `@uppy/vue`, and `@uppy/svelte`

**WHAT:** Component imports for `@uppy/react`, `@uppy/vue`, and `@uppy/svelte` have been moved to subpaths. This change was made to resolve runtime errors caused by the monolithic `index.js` and to make peer dependencies truly optional.

**WHY:** Previously, all components were exported from a single entry point (e.g., `@uppy/react`). This forced users to install all peer dependencies (like `@uppy/status-bar`, `@uppy/dashboard`, etc.), even if they only needed one component.

**HOW TO UPDATE:** Update your import paths to use the new subpaths for each component.

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

This change allows you to only install the peer dependencies for the components you use, leading to a smaller bundle size and improved performance.
