# @uppy/webdav

## 1.1.1

### Patch Changes

- 5684efa: Refactor internal components
- Updated dependencies [5684efa]
  - @uppy/provider-views@5.2.1

## 1.1.0

### Minor Changes

- 79e6460: - Add PluginTypeRegistry and typed getPlugin overload in @uppy/core
  - Register plugin ids across packages so uppy.getPlugin('Dashboard' | 'Webcam') returns the concrete plugin type and removes the need to pass generics in getPlugin()

### Patch Changes

- Updated dependencies [e661348]
- Updated dependencies [79e6460]
- Updated dependencies [ac12f35]
- Updated dependencies [4817585]
  - @uppy/provider-views@5.2.0
  - @uppy/core@5.2.0
  - @uppy/utils@7.1.4

## 1.0.1

### Patch Changes

- 975317d: Removed "main" from package.json, since export maps serve as the contract for the public API.
- Updated dependencies [4b6a76c]
- Updated dependencies [975317d]
- Updated dependencies [9bac4c8]
  - @uppy/core@5.0.2
  - @uppy/companion-client@5.0.1
  - @uppy/provider-views@5.0.2
  - @uppy/utils@7.0.2

## 1.0.0

### Patch Changes

- Updated dependencies [d301c01]
- Updated dependencies [c5b51f6]
  - @uppy/utils@7.0.0
  - @uppy/companion-client@5.0.0
  - @uppy/provider-views@5.0.0
  - @uppy/core@5.0.0

## 0.4.2

### Patch Changes

- 1b1a9e3: Define "files" in package.json
- Updated dependencies [1b1a9e3]
- Updated dependencies [c66fd85]
  - @uppy/companion-client@4.5.2
  - @uppy/provider-views@4.5.2
  - @uppy/utils@6.2.2
  - @uppy/core@4.5.2

## 0.4.0

### Minor Changes

- 0c24c5a: Use TypeScript compiler instead of Babel

### Patch Changes

- Updated dependencies [0c24c5a]
- Updated dependencies [0c24c5a]
  - @uppy/core@4.5.0
  - @uppy/companion-client@4.5.0
  - @uppy/provider-views@4.5.0
  - @uppy/utils@6.2.0

## 0.3.3

Released: 2025-05-18
Included in: Uppy v4.16.0

- @uppy/audio,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/image-editor,@uppy/instagram,@uppy/onedrive,@uppy/remote-sources,@uppy/screen-capture,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/webcam,@uppy/webdav,@uppy/zoom: ts: make locale strings optional (Merlijn Vos / #5728)

## 0.3.0

Released: 2025-01-06
Included in: Uppy v4.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/webdav,@uppy/xhr-upload,@uppy/zoom: Remove "paths" from all tsconfig's (Merlijn Vos / #5572)

## 0.2.0

Released: 2025-01-06
Included in: Uppy v4.10.0

- @uppy/webdav: add plugin icon (Merlijn Vos / #5555)

## 0.1.0

Released: 2024-12-17
Included in: Uppy v4.9.0

- @uppy/webdav: Add @uppy/webdav (Merlijn Vos / #5551)
