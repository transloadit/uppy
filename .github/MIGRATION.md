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


### @uppy/status-bar merged into @uppy/dashboard

The `@uppy/status-bar` package has been merged into `@uppy/dashboard` to simplify the architecture and reduce bundle size. StatusBar is now rendered as an integrated component within Dashboard rather than as a separate plugin. The standalone `@uppy/status-bar` package is no longer maintained.

**Migration steps:**

1. Remove `@uppy/status-bar` from your dependencies
2. Replace StatusBar usage with Dashboard
3. Move all StatusBar options directly to Dashboard options

All StatusBar configuration options are now available as Dashboard options:
- `hideProgressDetails` - Show detailed progress information
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
  hideProgressDetails: true,
  hideUploadButton: false,
  hideAfterFinish: true
})
```