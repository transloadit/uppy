---
"@uppy/core": patch
"@uppy/google-drive-picker": minor
---

`@uppy/google-drive-picker`: add a `selectFolders` option (default `false`) to control whether folders can be _selected_ in the picker. Folders remain visible for navigation. Folder selection now defaults to **off**: under the `drive.file` scope the picker could offer folder selection that returned few or no files. Set `selectFolders: true` to restore folder selection. When enabled and a picked folder yields no accessible files, the user is shown a warning.
