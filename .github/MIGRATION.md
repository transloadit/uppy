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
