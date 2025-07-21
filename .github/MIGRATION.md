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
2. Create a custom progress indicator using Uppy's `progress` or `upload-progress` events
3. Style your progress bar according to your design system.