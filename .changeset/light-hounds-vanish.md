---
"@uppy/google-photos-picker": major
"@uppy/google-drive-picker": major
"@uppy/thumbnail-generator": major
"@uppy/companion-client": major
"@uppy/golden-retriever": major
"@uppy/provider-views": major
"@uppy/remote-sources": major
"@uppy/screen-capture": major
"@uppy/store-default": major
"@uppy/google-drive": major
"@uppy/image-editor": major
"@uppy/react-native": major
"@uppy/drop-target": major
"@uppy/transloadit": major
"@uppy/components": major
"@uppy/compressor": major
"@uppy/status-bar": major
"@uppy/xhr-upload": major
"@uppy/companion": major
"@uppy/dashboard": major
"@uppy/instagram": major
"@uppy/facebook": major
"@uppy/onedrive": major
"@uppy/unsplash": major
"@uppy/dropbox": major
"@uppy/locales": major
"@uppy/aws-s3": major
"@uppy/svelte": major
"@uppy/webcam": major
"@uppy/audio": major
"@uppy/react": major
"@uppy/utils": major
"@uppy/core": major
"@uppy/form": major
"@uppy/zoom": major
"@uppy/box": major
"@uppy/tus": major
"@uppy/url": major
"@uppy/vue": major
"uppy": major
---

Some components, like Dashboard, require a peer dependency to work but since all components were exported from a single file you were forced to install all peer dependencies. Even if you never imported, for instance, the status bar component.

Every component that requires a peer dependency has now been moved to a subpath, such as `@uppy/react/dashboard`, so you only need to install the peer dependencies you need.

**Example for `@uppy/react`:**

**Before:**

```javascript
import { Dashboard, StatusBar } from "@uppy/react";
```

**Now:**

```javascript
import Dashboard from "@uppy/react/dashboard";
import StatusBar from "@uppy/react/status-bar";
```
