# @uppy/angular

## 2.0.0

### Minor Changes

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
- Updated dependencies [2608032]
- Updated dependencies [b9253f7]
- Updated dependencies [7ac2623]
- Updated dependencies [ad4050b]
- Updated dependencies [84ad853]
  - @uppy/core@6.0.0
  - @uppy/status-bar@6.0.0
  - @uppy/dashboard@6.0.0
