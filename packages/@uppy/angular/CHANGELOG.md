# @uppy/angular

## 2.0.0

### Minor Changes

- 4fb2efb: Add Support for Angular 22
- 1e2d2ee: Add support for Angular 21

### Patch Changes

- c3c7cef: Bump shared runtime dependencies (preact, nanoid, lodash, classnames, shallow-equal, pretty-bytes, p-queue, tus-js-client, @transloadit/types @transloadit/prettier-bytes v1, is-mobile, exifr, compressorjs, rxjs, tslib). Also includes type-only fixes in `@uppy/companion`'s `jwt.ts` and `request.ts` to track `@types/jsonwebtoken` v9 and `@types/node`.
- 8c5814b: Upgrade runtime dependencies. Companion moves to `ws` 8.21.1, `morgan` 1.11.0,
  `helmet` 8.3.0, `ioredis` 5.11.1, `serialize-javascript` 7.0.7,
  `content-disposition` 2.0.1 and `p-map` 7.0.5. `@uppy/angular` moves to
  `zone.js` ~0.16.2, matching its Angular 21 peer range.
- Updated dependencies [675697d]
- Updated dependencies [7e8e04f]
- Updated dependencies [c3c7cef]
- Updated dependencies [ddffd2c]
- Updated dependencies [2608032]
- Updated dependencies [b9253f7]
- Updated dependencies [260804f]
- Updated dependencies [7ac2623]
- Updated dependencies [ad4050b]
- Updated dependencies [4a0e6c9]
- Updated dependencies [84ad853]
- Updated dependencies [1a1aef3]
  - @uppy/core@6.0.0
  - @uppy/status-bar@6.0.0
  - @uppy/dashboard@6.0.0

## 1.1.0

### Minor Changes

- 72d2d68: Remove @uppy/utils and add @uppy/status-bar to peerDependencies

## 1.0.1

### Patch Changes

- 975317d: Removed "main" from package.json, since export maps serve as the contract for the public API.
- Updated dependencies [4b6a76c]
- Updated dependencies [975317d]
- Updated dependencies [9bac4c8]
  - @uppy/core@5.0.2
  - @uppy/dashboard@5.0.2
  - @uppy/utils@7.0.2

## 1.0.0

### Patch Changes

- Updated dependencies [e869243]
- Updated dependencies [d301c01]
- Updated dependencies [c5b51f6]
  - @uppy/dashboard@5.0.0
  - @uppy/utils@7.0.0
  - @uppy/core@5.0.0

## 0.9.2

### Patch Changes

- 8f8ee09: Nothing changed, just a release to fix the broken previous release.

## 0.9.1

### Patch Changes

- 7eec173: Remove "files" array from package.json

## 0.9.0

### Minor Changes

- 8b8ab01: Declare components as standalone & support 20.x

### Patch Changes

- 1b1a9e3: Define "files" in package.json
- Updated dependencies [1b1a9e3]
  - @uppy/progress-bar@4.3.2
  - @uppy/status-bar@4.2.2
  - @uppy/dashboard@4.4.2
  - @uppy/drag-drop@4.2.2
  - @uppy/utils@6.2.2
  - @uppy/core@4.5.2

## 0.8.0

Released: 2025-04-14
Included in: Uppy v4.15.0

- @uppy/angular: Support Angular 19 (#5709) (Arnaud Flaesch / #5715)

## 0.7.0-beta.5

Released: 2024-06-04
Included in: Uppy v4.0.0-beta.10

- @uppy/angular: fix invalid char in `package.json` (Antoine du Hamel / #5224)
- @uppy/angular: upgrade to Angular 18 (Antoine du Hamel / #5215)

## 0.7.0-beta.2

Released: 2024-04-11
Included in: Uppy v4.0.0-beta.2

- @uppy/angular: fix Angular version requirement in peerDeps (Antoine du Hamel / #5067)

## 0.7.0-beta.1

Released: 2024-03-28
Included in: Uppy v4.0.0-beta.1

- @uppy/angular: upgrade to Angular 17.x and to TS 5.4 (Antoine du Hamel / #5008)
- @uppy/angular: fix build (Antoine du Hamel)

## 0.6.0

Released: 2023-09-05
Included in: Uppy v3.15.0

- @uppy/angular: upgrade to Angular 16.x (Antoine du Hamel / #4642)

## 0.5.0

Released: 2022-11-10
Included in: Uppy v3.3.0

- @uppy/angular,@uppy/utils: add `cause` support for `AbortError`s (Antoine du Hamel / #4198)

## 0.4.3

Released: 2022-10-19
Included in: Uppy v3.2.0

- @uppy/angular: remove unnecessary `console.log` call (Antoine du Hamel / #4139)

## 0.4.2

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/angular: Fix angular build error (Murderlon)

## 0.4.1

Released: 2022-08-30
Included in: Uppy v3.0.1

- @uppy/angular: fix compiler warning (Antoine du Hamel / #4064)
- @uppy/angular: fix peer dependencies (Antoine du Hamel / #4035)

## 0.4.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- @uppy/angular: upgrade to Angular 14 (Antoine du Hamel / #3997)

## 0.3.1

Released: 2022-05-30
Included in: Uppy v2.11.0

- @uppy/angular,@uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/onedrive,@uppy/progress-bar,@uppy/react,@uppy/redux-dev-tools,@uppy/robodog,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: doc: update bundler recommendation (Antoine du Hamel / #3763)

## 0.3.0

Released: 2022-03-02
Included in: Uppy v2.7.0

- @uppy/angular: update ng version (Antoine du Hamel / #3503)

## 0.2.8

Released: 2021-12-21
Included in: Uppy v2.3.2

- @uppy/angular,@uppy/companion,@uppy/svelte,@uppy/vue: add `.npmignore` files to ignore `.gitignore` when packing (Antoine du Hamel / #3380)
- @uppy/angular: Fix module field in `package.json` (Merlijn Vos / #3365)

## 0.2.6

Released: 2021-12-07
Included in: Uppy v2.3.0

- @uppy/angular: examples: update `angular-example` to Angular v13 (Antoine du Hamel / #3325)
