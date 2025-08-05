# Migration

This is a temporary file that can be updated with any pending migration changes, before deleting them here and moving them to uppy.io. If we in the future decide to move uppy.io into this repo, then this file will not be needed anymore. See also https://github.com/transloadit/uppy/pull/5802

## Uppy 5.0

### Companion 5.x to 6.x

- Option `companionAllowedHosts` no longer wrapped in Regex start/end characters
  (`^` and `$`). You now need to provide these yourself if you want an exact
  match.
- Backwards compat token decryption removed: old Uppy auth tokens (created
  before
  [uppy%404.16.0](https://github.com/transloadit/uppy/releases/tag/uppy%404.16.0)
  06d9a7c689e5123d41b38191074eb8bbd4ff5325) will become invalid and users who
  have these old toknes will have to re-authenticate.
- Removed `token` param from `Provider` class methods: `list()`, `download()`,
  `logout()`, `thumbnail()`. Please use: `providerUserSession`.`accessToken`
  instead.


### @uppy/informer merged into @uppy/dashboard

The `@uppy/informer` plugin has been merged into `@uppy/dashboard` to reduce bundle size and improve maintainability. The `@uppy/informer` package is no longer maintained as a standalone package and should be removed from your dependencies.

### @uppy/progress-bar removed

The `@uppy/progress-bar` plugin has been removed as it provided minimal functionality that can be easily replicated with Uppy's built-in state management.

**Before:**
```js
import ProgressBar from '@uppy/progress-bar'

uppy.use(ProgressBar, { target: '#progress' })
```

**After:**
```js
// Custom progress bar using Uppy state
uppy.on('upload-progress', (file, progress) => {
  const progressElement = document.getElementById('progress')
  progressElement.style.width = `${progress.percentage}%`
  progressElement.textContent = `${progress.percentage}%`
})

// Or listen to total progress
uppy.on('progress', (progress) => {
  const progressElement = document.getElementById('progress')
  progressElement.style.width = `${progress}%`
  progressElement.textContent = `${progress}%`
})
```

**Migration steps:**
1. Remove `@uppy/progress-bar` from your dependencies
2. Create a custom progress indicator using Uppy's `progress` or `upload-progress` events.
3. Style your progress bar according to your design system.

### @uppy/drag-drop and @uppy/file-input removed

The `@uppy/drag-drop` and `@uppy/file-input` plugins have been removed in favor of more flexible, headless hooks. These hooks provide the same functionality but with maximum customization freedom.

**Before:**
```js
import DragDrop from '@uppy/drag-drop'
import FileInput from '@uppy/file-input'

uppy
  .use(DragDrop, { target: '#drag-drop' })
  .use(FileInput, { target: '#file-input' })
```

**After:**
```js
// React example
import { useDropzone, useFileInput } from '@uppy/react'

function MyUploader() {
  const { getRootProps, getInputProps, isDragging } = useDropzone()
  const { getButtonProps, getInputProps: getFileInputProps } = useFileInput()

  return (
    <div>
      <input {...getInputProps()} className="hidden" />
      <div {...getRootProps()} className={`dropzone ${isDragging ? 'dragging' : ''}`}>
        <input {...getFileInputProps()} className="hidden" />
        <button {...getButtonProps()}>Choose files</button>
        <p>or drag and drop files here</p>
      </div>
    </div>
  )
}
```

**Alternative: Use Dashboard**
```js
// If you want a complete UI solution, use Dashboard instead
import Dashboard from '@uppy/dashboard'

uppy.use(Dashboard, {
  target: '#uppy-dashboard',
  inline: true,
})
```

**Migration steps:**
1. Remove `@uppy/drag-drop` and `@uppy/file-input` from your dependencies
2. Choose one of these approaches:
   - Use the framework-specific hooks (`@uppy/react`, `@uppy/vue`, `@uppy/svelte`) for maximum flexibility
   - Use `@uppy/dashboard` for a complete, ready-to-use UI solution
3. Replace your existing components with custom implementations using the hooks or Dashboard
4. See [examples/](../examples/) for complete implementation examples

### Export maps for all packages

All packages now have export maps. This is a breaking change in two cases:

1. The css imports have changed from `@uppy[package]/dist/styles.min.css` to `@uppy[package]/css/styles.min.css`
2. You were importing something that wasn't exported from the root, for instance `@uppy/core/lib/foo.js`. You can now only import things we explicitly exported.

#### Changed imports for `@uppy/react`, `@uppy/vue`, and `@uppy/svelte`

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


### @uppy/status-bar merged into @uppy/dashboard

The `@uppy/status-bar` package has been merged into `@uppy/dashboard`. The plugin gave a false promise of flexibility as a standalone plugin but was always built tightly coupled for `@uppy/dashboard`. With the new headless components and hooks, we want go all in those components and remove the confusing, inflexible ones.

**Migration steps:**

1. Remove `@uppy/status-bar` from your dependencies
2. Replace StatusBar usage with Dashboard
3. Move all StatusBar options directly to Dashboard options

All StatusBar configuration options are now available as Dashboard options:
- `hideProgressDetails` - Hide detailed progress information
- `hideUploadButton` - Hide the upload button
- `hideAfterFinish` - Hide status bar after upload completion
- `hideRetryButton` - Hide the retry button
- `hidePauseResumeButton` - Hide pause/resume controls
- `hideCancelButton` - Hide the cancel button
- `doneButtonHandler` - Custom handler for the done button

```js
// Before - separate StatusBar plugin
import StatusBar from '@uppy/status-bar'
uppy.use(StatusBar, {
  target: '#status-bar',
  hideProgressDetails: true,
  hideUploadButton: false,
  hideAfterFinish: true
})

// After - use Dashboard with StatusBar options
import Dashboard from '@uppy/dashboard'
uppy.use(Dashboard, {
  target: '#dashboard',
  hideProgressDetails: false,
  hideUploadButton: false,
  hideAfterFinish: true
})
```