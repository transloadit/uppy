# @uppy/google-drive-picker

<img src="https://uppy.io/img/logo.svg" width="120" alt="Uppy logo: a smiling puppy above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@uppy/google-drive-picker.svg?style=flat-square)](https://www.npmjs.com/package/@uppy/google-drive-picker)
![CI status for Uppy tests](https://github.com/transloadit/uppy/workflows/Tests/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/uppy/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/uppy/workflows/End-to-end%20tests/badge.svg)

The Google Drive Picker plugin for Uppy lets users import files from their
Google Drive account using the new Picker API.

Documentation for this plugin can be found on the
[Uppy website](https://uppy.io/docs/google-drive-picker).

## Options

### `selectFolders` (default: `false`)

Whether users can **select** folders in the picker. Defaults to `false`.
Folders are always shown so users can navigate into them to reach files; this
option only controls whether a folder itself can be picked.

> **Note on the `drive.file` scope:** This plugin uses Google's narrow
> `drive.file` OAuth scope (which avoids Google's CASA Tier 2 assessment).
> Under this scope, an app can only access files the user explicitly picks.
> When a user picks a _folder_, its contents are not "explicitly picked", so
> Google returns only the files the app already had access to — often none.
> For this reason folder selection is off by default. If you enable
> `selectFolders: true` and a picked folder yields no accessible files, the
> user is shown a warning, because "empty folder" and "no access to the
> folder's contents" are indistinguishable under `drive.file`.

```js
import GoogleDrivePicker from '@uppy/google-drive-picker'

uppy.use(GoogleDrivePicker, {
  companionUrl: 'https://your-companion.example.com',
  clientId: 'YOUR_CLIENT_ID',
  apiKey: 'YOUR_API_KEY',
  appId: 'YOUR_APP_ID',
  selectFolders: false, // set true to allow folder selection (see note above)
})
```

## License

The [MIT License](./LICENSE).
