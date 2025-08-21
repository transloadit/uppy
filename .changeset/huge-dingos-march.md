---
"@uppy/dashboard": major
---

### Merge @uppy/status-bar into @uppy/dashboard

The `@uppy/status-bar` package has been merged into `@uppy/dashboard`. The plugin gave a false promise of flexibility as a standalone plugin but was always built tightly coupled for `@uppy/dashboard`. With the new headless components and hooks, we want go all in those components and remove the confusing, inflexible ones.

StatusBar is now rendered as an integrated component within Dashboard rather than as a separate plugin. The standalone `@uppy/status-bar` package is no longer maintained and should be removed from your dependencies.

#### Migration from standalone StatusBar to Dashboard

If you were using StatusBar as a separate plugin, you'll need to migrate to using Dashboard with the equivalent options.

**Before:**

```javascript
import StatusBar from '@uppy/status-bar'

uppy.use(StatusBar, {
  target: '#status-bar',
  showProgressDetails: true,
  hideUploadButton: false,
  hideAfterFinish: true
})
```

**Now:**

```javascript
import Dashboard from '@uppy/dashboard'

uppy.use(Dashboard, {
  target: '#dashboard',
  hideProgressDetails: false,
  hideUploadButton: false,
  hideAfterFinish: true
})
```

All StatusBar configuration options are now available directly as Dashboard options:
- `hideProgressDetails` - Hide detailed progress information (previously `showProgressDetails` with inverted logic)
- `hideUploadButton` - Hide the upload button
- `hideAfterFinish` - Hide status bar after upload completion
- `hideRetryButton` - Hide the retry button
- `hidePauseResumeButton` - Hide pause/resume controls
- `hideCancelButton` - Hide the cancel button
- `doneButtonHandler` - Custom handler for the done button