# @uppy/locales

## 5.3.3

### Patch Changes

- 31a49e4: Give upload action buttons more specific screen reader labels. The per-file remove, pause, resume and cancel buttons now include the file name (for example "Pause upload photo.jpg"), and the cancel, pause and resume buttons that act on every file now say "Cancel all uploads", "Pause all uploads" and "Resume all uploads". Visible text and tooltips are unchanged. Adds the `removeFileWithFilename`, `pauseUploadWithFilename`, `resumeUploadWithFilename`, `cancelUploadWithFilename`, `cancelAllUploads`, `pauseAllUploads` and `resumeAllUploads` strings.
- 6fe4558: @uppy/locales: update Turkish (tr_TR)
- 1430c20: When a listing reports a different bucket than the one before it (a renewed grant for another bucket, or a reconnect, without logging out), the plugin now starts over at the root: the loaded folders and the selection are dropped and the user is told to select the files again. Before, files and folders selected in the first bucket could be imported, or expanded, from the second one, where the same key can be another file.
- 060ebf8: Transloadit Storage: uploads no longer land in the folder the user just left. Toolbar actions (such as "Upload files" and "New folder") are disabled while a folder is still listing, and with `storeUploads` the panel takes no dropped files then. Queued files are stored in the folder they were added in, even if the panel shows another folder by the time they upload; the panel takes no new files in another folder until those are uploaded or removed.
  
  Failed storage or encoding attempts keep their destination when retried. Files queued before connecting no longer prevent later files from being pinned to their folder.
  
  Manually configured `createStoreAssemblyOptions` pipelines use the same folder-dependent drop guards as `storeUploads`.
  
  The destination is reserved when a drop is accepted, so navigating while Dashboard reads dropped files or folders cannot redirect them.
  
  Uploads added before connecting reserve their first signed destination for retries. Files added outside the panel during navigation bind to the folder once its listing settles.
  
  Multi-folder navigation is treated as one operation. Local selections and picker imports reserve their folder before the panel can reset, and all panel upload actions honor an existing queue’s destination.
  
  Toolbar actions also wait during paginated path navigation. Dismissing a file picker without a cancel event no longer leaves a folder reservation behind.
  
  Empty or rejected additions do not bind a previously unbound queue; provisional reservations are kept only after adding files or preparing an Assembly signature.
  
  Picker imports reserve their destination before reading selected directories. Headless managers report navigation as busy. Assembly-option failures remain retryable, and empty upload completions do not clear queued files.
  
  Successful uploads invalidate cached destination listings even when the panel has moved to another folder.
  
  Queued destinations reset on logout or a change of bucket or grant prefix. Signing never reuses a destination outside the current session’s root.
  
  Automatic reopening preserves failed files from earlier batches and files added before the deferred cleanup runs.
  
  Refreshing the uploaded destination preserves selections in unrelated folders.
  
  Refilling an invalidated checked folder reuses cached child IDs and lists each child folder once, preventing duplicate imports and incorrect file-count restrictions.
- Updated dependencies [b2bb6f5]
- Updated dependencies [b2198a0]
- Updated dependencies [0ada2c6]
- Updated dependencies [dba59ab]
- Updated dependencies [7d7e72c]
- Updated dependencies [294fd47]
- Updated dependencies [22fa75c]
- Updated dependencies [c52f0c2]
- Updated dependencies [2a383b6]
- Updated dependencies [3ca841b]
- Updated dependencies [4c7fed6]
- Updated dependencies [20d0e51]
- Updated dependencies [060ebf8]
- Updated dependencies [1f3e4c3]
  - @uppy/core@6.4.0

## 5.3.2

### Patch Changes

- 62e4970: Define package exports.
- Updated dependencies [628b3c0]
- Updated dependencies [f58058d]
- Updated dependencies [f58058d]
- Updated dependencies [f58058d]
- Updated dependencies [a16a4bf]
  - @uppy/core@6.3.1

## 5.3.1

### Patch Changes

- 6088195: Google Drive Picker: close Google's picker dialog and show an error toast when it fails to load (e.g. because third-party cookies are blocked), instead of leaving an un-closable overlay over the page.
- 54d543c: **Experimental** manager mode is now headless: a file library renders it with `useS3Manager`. In manager mode the plugin no longer mounts into the Dashboard (no tab, no file drops, no `reopenAfterUpload` panel), and closing a Dashboard panel no longer resets its state or aborts its requests. `useS3Manager` warns when given a plugin in picker mode. Removed: the item detail dialog (opened by a click on a file) and S3's `getPreviewUrl`; the "Select multiple" toggle and the bulk-actions footer, with the `selectionActive` plugin state and `ProviderView.toggleSelectionMode()`; the core strings `openFileNamed`, `itemsSelected`, `selectMultiple`, `cancelSelection`, `close`, `detailSize`, `detailType` and `detailModified`; and the `--uppy-color-secondary` theming variable. `useS3Manager` and `createS3ManagerController` no longer have `state.selectionActive` or `toggleSelectionMode()`: a headless UI keeps its own selection mode and clears the selection with `cancelSelection()`.

  The `standalone` option is removed: the Dashboard shows its "Import from …" bar with Cancel, and the panel its Log out row, again. TransloaditStorage plugins that relied on `standalone` for manager mode now start in picker mode: pass `mode: 'manager'`.

  With the panel gone, so is what only it needed: the progress screen's Stop button (and the `stopOperation` string), and the busy state that disabled the header, filter and breadcrumbs during a long operation. Long operations, their progress text and `cancelLongOperation()` remain for `useS3Manager`. Picker mode is unchanged, including the item menu, toolbar actions and dialogs that Transloadit Storage's picker actions use.

  If an app runs manager mode inside a Dashboard with `@uppy/s3` 0.1.x or `@uppy/transloadit-storage` 0.1.x, the panel will be empty once its `^6.2.0` range picks up `@uppy/core` 6.3. Those plugins stay on 0.1.x, because a caret range on a 0.x version doesn't cross minors. Nothing throws. Render manager mode with `useS3Manager`, or keep `@uppy/core` on 6.2 until then. Picker mode is unaffected.

- Updated dependencies [b47ca2d]
- Updated dependencies [715eb80]
- Updated dependencies [6088195]
- Updated dependencies [54d543c]
- Updated dependencies [a7a7997]
- Updated dependencies [a17c84d]
  - @uppy/core@6.3.0

## 5.3.0

### Minor Changes

- 480e44c: **Experimental:** both plugins, and the Companion endpoints they use, will change incompatibly
  (also in minor releases) as they make way for a standalone file manager. Both log a warning when
  installed.

  New `@uppy/s3` plugin: browse an S3-compatible bucket from the Dashboard and pick files from it (`autoConnect`, `keepStateOnClose`), or, with `mode: 'manager'`, manage it: rename/move, delete, new folder, bulk move/delete. Picker mode never changes existing files. What the user may see and change comes from Companion, either from the bucket it is configured with or from the storage grant your server issued. Moving a folder runs item by item from the client, so progress is visible and a failure stops at a known point. New `@uppy/transloadit-storage` plugin: the same browser pointed at a Transloadit Storage workspace, with a "Copy Smart CDN URL" action supplied by the application's authenticated server callback. Secrets stay on the server.

  Storage uploads default to refusing collisions. Opt into renaming or overwriting explicitly, and
  save the returned Workspace, asset ID, version ID and final path. The package README explains how
  to use canonical stored results and version-pinned Viewer delivery without treating S3 listing
  paths as immutable references.

### Patch Changes

- Updated dependencies [480e44c]
  - @uppy/core@6.1.0

## 5.2.1

### Patch Changes

- c2982bc: Add the Azerbaijani (`az_AZ`) locale.
- Updated dependencies [c011da4]
  - @uppy/core@6.0.2

## 5.2.0

### Minor Changes

- 1230ab6: Add Mongolian locale support
- 12de077: Remove @uppy/instagram references from all the packages
- 2608043: @uppy/locales: add Norwegian Nynorsk (nn_NO) locale, and reword `uploadStalled` in Norwegian Bokmål (nb_NO)

### Patch Changes

- c3c7cef: Bump shared runtime dependencies (preact, nanoid, lodash, classnames, shallow-equal, pretty-bytes, p-queue, tus-js-client, @transloadit/types @transloadit/prettier-bytes v1, is-mobile, exifr, compressorjs, rxjs, tslib). Also includes type-only fixes in `@uppy/companion`'s `jwt.ts` and `request.ts` to track `@types/jsonwebtoken` v9 and `@types/node`.
- 32b9f06: @uppy/locales: update Norwegian Bokmål (nb_NO)
- 2608044: Fix the smart_count placeholder in the ja_JP folderAdded string.
- Updated dependencies [675697d]
- Updated dependencies [7e8e04f]
- Updated dependencies [c3c7cef]
- Updated dependencies [ddffd2c]
- Updated dependencies [2608032]
- Updated dependencies [260804f]
- Updated dependencies [7ac2623]
- Updated dependencies [ad4050b]
- Updated dependencies [4a0e6c9]
- Updated dependencies [84ad853]
- Updated dependencies [1a1aef3]
  - @uppy/core@6.0.0

## 5.1.1

### Patch Changes

- 37f69d0: Update cs_CZ dropPaste keys to use the correct variables.

## 5.1.0

### Minor Changes

- 5684efa: Introduce @uppy/image-generator to generate images based on a prompt using Transloadit

## 5.0.1

### Patch Changes

- c3c16ae: Improve zh-CN and zh-TW locale
- 8744c4d: Improve Dutch locale
- Updated dependencies [ac12f35]
  - @uppy/utils@7.1.4

## 5.0.0

### Major Changes

- c5b51f6: ### Export maps for all packages

  All packages now have export maps. This is a breaking change in two cases:
  1. The css imports have changed from `@uppy[package]/dist/styles.min.css` to `@uppy[package]/css/styles.min.css`
  2. You were importing something that wasn't exported from the root, for instance `@uppy/core/lib/foo.js`. You can now only import things we explicitly exported.

  #### Changed imports for `@uppy/react`, `@uppy/vue`, and `@uppy/svelte`

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

### Patch Changes

- Updated dependencies [d301c01]
- Updated dependencies [c5b51f6]
  - @uppy/utils@7.0.0

## 4.8.4

### Patch Changes

- ea04a4d: Add "files" in package.json to only publish what's needed

## 4.8.3

### Patch Changes

- 1a0beb9: Add all locales to globalThis.Uppy.locales.[locale-name]

## 4.8.2

### Patch Changes

- 1b1a9e3: Define "files" in package.json
- Updated dependencies [1b1a9e3]
  - @uppy/utils@6.2.2

## 4.8.0

### Minor Changes

- 28f0886: Move dev dependencies from "dependencies" to "devDependencies"

## 4.7.0

### Minor Changes

- 0c24c5a: Update Swedish translations
- 0c24c5a: Use TypeScript compiler instead of Babel

### Patch Changes

- Updated dependencies [0c24c5a]
  - @uppy/utils@6.2.0

## 4.6.0

Released: 2025-06-30
Included in: Uppy v4.18.0

- @uppy/locales: Update pt_BR localization (Gabriel Pereira / #5780)

## 4.5.3

Released: 2025-06-02
Included in: Uppy v4.17.0

- @uppy/locales: Update cs_CZ.ts (Martin Štorek / #5749)

## 4.5.2

Released: 2025-04-08
Included in: Uppy v4.14.0

- @uppy/locales: Update nb_NO.ts (Tore Sinding Bekkedal / #5678)
- @uppy/locales: Update cs_CZ.ts (David Petrásek / #5658)

## 4.5.0

Released: 2025-01-06
Included in: Uppy v4.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive-picker,@uppy/google-drive,@uppy/google-photos-picker,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/webdav,@uppy/xhr-upload,@uppy/zoom: Remove "paths" from all tsconfig's (Merlijn Vos / #5572)

## 4.4.0

Released: 2024-12-17
Included in: Uppy v4.9.0

- @uppy/google-drive-picker,@uppy/google-photos-picker,@uppy/locales: Add missing Google Picker locale entries (Merlijn Vos / #5552)
- @uppy/locales: Add missing French locale entries (Steven SAN / #5549)

## 4.3.1

Released: 2024-12-05
Included in: Uppy v4.8.0

- @uppy/audio,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: cleanup tsconfig (Mikael Finstad / #5520)

## 4.3.0

Released: 2024-11-11
Included in: Uppy v4.7.0

- @uppy/locales: Add ms_MY (Malay) locale (Salimi / #5488)

## 4.2.1

Released: 2024-10-31
Included in: Uppy v4.6.0

- @uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/google-photos,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react-native,@uppy/react,@uppy/redux-dev-tools,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Fix links (Anthony Veaudry / #5492)

## 4.2.0

Released: 2024-10-15
Included in: Uppy v4.5.0

- @uppy/locales: Update packages/@uppy/locales/src/fr_FR.ts (Zéfyx / #5472)

## 4.1.0

Released: 2024-08-29
Included in: Uppy v4.3.0

- @uppy/locales: Fix locale-pack for en_US (Merlijn Vos / #5431)

## 4.0.0-beta.4

Released: 2024-06-18
Included in: Uppy v4.0.0-beta.12

- @uppy/locales: fix `fa_IR` export (Merlijn Vos / #5241)
- examples,@uppy/locales,@uppy/provider-views,@uppy/transloadit: Release: uppy@3.26.1 (github-actions[bot] / #5242)
- @uppy/locales: Added translation string (it_IT) (Samuel / #5237)

## 4.0.0-beta.2

Released: 2024-06-04
Included in: Uppy v4.0.0-beta.10

- @uppy/locales: remove hacks for legacy bundle (Mikael Finstad / #5200)

## 3.5.3

Released: 2024-05-03
Included in: Uppy v3.25.1

- @uppy/locales: Update ru_RU locale (Uladzislau Bodryi / #5120)

## 3.5.2

Released: 2024-02-20
Included in: Uppy v3.22.1

- @uppy/locales: update vi_VN translation (David Nguyen / #4930)

## 3.5.1

Released: 2024-02-19
Included in: Uppy v3.22.0

- @uppy/locales: fix "save" button translation in hr_hr.ts (žan žlender / #4830)

## 3.5.0

Released: 2023-11-24
Included in: Uppy v3.20.0

- @uppy/locales: Add missing translations to de_DE (Leonhard Melzer / #4800)
- @uppy/locales: use TypeScript for source files (Antoine du Hamel / #4779)

## 3.4.0

Released: 2023-11-08
Included in: Uppy v3.19.0

- @uppy/locales: locales: add ca_ES (ordago / #4772)

## 3.3.1

Released: 2023-09-18
Included in: Uppy v3.16.0

- @uppy/locales: Feature/updating i18n farsi (Parsa Arvaneh / #4638)

## 3.2.4

Released: 2023-07-20
Included in: Uppy v3.13.0

- @uppy/locales: update zh_TW translation (5idereal / #4583)

## 3.2.3

Released: 2023-07-13
Included in: Uppy v3.12.0

- @uppy/locales: fix expression and spelling errors in es_ES (Rubén / #4567)
- @uppy/locales: Add missing pt-BR locales for ImageEditor plugin (Mateus Cruz / #4558)

## 3.2.2

Released: 2023-06-19
Included in: Uppy v3.10.0

- @uppy/locales: update `fr_FR.js` (Samuel De Backer / #4499)

## 3.2.0

Released: 2023-04-18
Included in: Uppy v3.8.0

- @uppy/core,@uppy/locales,@uppy/provider-views: User feedback adding recursive folders take 2 (Mikael Finstad / #4399)

## 3.1.0

Released: 2023-04-04
Included in: Uppy v3.7.0

- @uppy/locales: locales: add es_MX (Kevin van Zonneveld / #4393)
- @uppy/locales: locales: add hi_IN (Kevin van Zonneveld / #4391)

## 3.0.7

Released: 2023-03-07
Included in: Uppy v3.6.0

- @uppy/locales: add missing entries after build (Murderlon)

## 3.0.6

Released: 2023-02-13
Included in: Uppy v3.5.0

- @uppy/locales: Update de_DE.js (Jörn Velten / #4297)
- @uppy/locales: minor enhancements and typo fixes for the hungarian translation (KergeKacsa / #4282)

## 3.0.5

Released: 2023-01-26
Included in: Uppy v3.4.0

- @uppy/locales: update zh_TW.js (5idereal / #4270)

## 3.0.4

Released: 2022-11-10
Included in: Uppy v3.3.0

- @uppy/locales: Fix UZ locale (Merlijn Vos / #4178)

## 3.0.2

Released: 2022-10-19
Included in: Uppy v3.2.0

- @uppy/locales: Fix duplicate keys in UK_UA.js (Murderlon)
- @uppy/locales: Add missing Ukrainian locale entries (Andrii Bodnar / #4145)
- @uppy/locales: Update pl_PL.js (Daniel Kamiński / #4136)

## 3.0.1

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/locales: Create uz_UZ (Ozodbek1405 / #4114)
- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 3.0.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- Switch to ESM

## 3.0.0-beta.4

Released: 2022-08-16
Included in: Uppy v3.0.0-beta.5

- @uppy/locales: Add compressor string translation to Japanese locale (kenken / #3963)

## 2.1.1

Released: 2022-07-06
Included in: Uppy v2.12.2

- @uppy/locales,@uppy/transloadit: Fix undefined error in in onTusError (Merlijn Vos / #3848)
- @uppy/locales: Add missing translations and reorder nl_NL locale (Kasper Meinema / #3839)

## 2.1.0

Released: 2022-05-14
Included in: Uppy v2.10.0

- @uppy/locales: Add `save` translation to Spanish locale (Juan Carlos Alonso / #3678)
- @uppy/locales: refactor to ESM (Antoine du Hamel / #3707)

## 2.0.9

Released: 2022-04-27
Included in: Uppy v2.9.4

- @uppy/locales: Plural translation in cs_CZ local (JakubHaladej / #3666)

## 2.0.8

Released: 2022-03-16
Included in: Uppy v2.8.0

- @uppy/locales: compressor cleanup (Antoine du Hamel / #3531)
- @uppy/locales: Update ru_RU.js (Sobakin Sviatoslav / #3529)

## 2.0.7

Released: 2022-03-02
Included in: Uppy v2.7.0

- @uppy/locales: Update zh_CN.js (linxunzyf / #3513)

## 2.0.6

Released: 2022-02-14
Included in: Uppy v2.5.0

- @uppy/locales: Add "save" to fr_FR.js (Charly Billaud / #3395)

## 2.0.4

Released: 2021-12-07
Included in: Uppy v2.3.0

- @uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/google-drive,@uppy/image-editor,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/url,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Refactor locale scripts & generate types and docs (Merlijn Vos / #3276)
