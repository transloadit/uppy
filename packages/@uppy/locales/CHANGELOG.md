# @uppy/locales

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
