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

### @uppy/status-bar merged into @uppy/dashboard

The standalone `@uppy/status-bar` package has been merged into `@uppy/dashboard`. This change simplifies the architecture and reduces bundle size for most users.

**Breaking changes:**

- The `@uppy/status-bar` package no longer exists as a standalone plugin
- StatusBar is now a Preact component integrated directly into Dashboard, not a separate UIPlugin
- StatusBar-specific React, Vue, Svelte, and Angular wrapper components have been removed
- All StatusBar locale strings have been merged into Dashboard's locale file
- StatusBar options are now passed as Dashboard options (e.g., `showProgressDetails`, `hideUploadButton`, etc.)

**Migration:**

If you were using StatusBar as a standalone plugin:

```js
// Before - separate StatusBar plugin
import StatusBar from '@uppy/status-bar'
uppy.use(StatusBar, {
  target: '#status-bar',
  showProgressDetails: true
})

// After - use Dashboard instead
import Dashboard from '@uppy/dashboard'
uppy.use(Dashboard, {
  target: '#dashboard',
  showProgressDetails: true,
  // other StatusBar options are now Dashboard options
})
```

