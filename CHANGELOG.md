# Changelog

<!--lint disable no-literal-urls no-undefined-references-->

This is our changelog which contains planned todos and past dones.

Items can be optionally tagged by the GitHub issue's owner, if a discussion happened / is needed.

Please add your entries in this format:

- `- [ ] (<plugin name>|website|core|meta|build|test): <Present tense verb> <subject> \(<list of associated owners/gh-issues>\)`.

In the current stage we aim to release a new version at least every month.

## 3.22.1

Released: 2024-02-20

| Package                   | Version | Package                   | Version |
| ------------------------- | ------- | ------------------------- | ------- |
| @uppy/audio               |   1.1.6 | @uppy/remote-sources      |   1.1.2 |
| @uppy/aws-s3              |   3.6.2 | @uppy/status-bar          |   3.2.7 |
| @uppy/aws-s3-multipart    |  3.10.2 | @uppy/store-default       |   3.2.2 |
| @uppy/companion           |  4.12.2 | @uppy/store-redux         |   3.0.7 |
| @uppy/companion-client    |   3.7.2 | @uppy/svelte              |   3.1.3 |
| @uppy/compressor          |   1.1.1 | @uppy/thumbnail-generator |   3.0.8 |
| @uppy/core                |   3.9.1 | @uppy/transloadit         |   3.5.1 |
| @uppy/dashboard           |   3.7.3 | @uppy/tus                 |   3.5.2 |
| @uppy/drop-target         |   2.0.4 | @uppy/utils               |   5.7.2 |
| @uppy/form                |   3.1.1 | @uppy/vue                 |   1.1.2 |
| @uppy/golden-retriever    |   3.1.3 | @uppy/webcam              |   3.3.6 |
| @uppy/image-editor        |   2.4.2 | @uppy/xhr-upload          |   3.6.2 |
| @uppy/locales             |   3.5.2 | uppy                      |  3.22.1 |
| @uppy/provider-views      |   3.9.1 |                           |         |

- @uppy/locales: update vi_VN translation (David Nguyen / #4930)
- @uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/status-bar: bump `@transloadit/prettier-bytes` (Antoine du Hamel / #4933)


## 3.22.0

Released: 2024-02-19

| Package                   | Version | Package                   | Version |
| ------------------------- | ------- | ------------------------- | ------- |
| @uppy/audio               |   1.1.5 | @uppy/remote-sources      |   1.1.1 |
| @uppy/aws-s3              |   3.6.1 | @uppy/status-bar          |   3.2.6 |
| @uppy/aws-s3-multipart    |  3.10.1 | @uppy/store-default       |   3.2.1 |
| @uppy/companion           |  4.12.1 | @uppy/store-redux         |   3.0.6 |
| @uppy/companion-client    |   3.7.1 | @uppy/svelte              |   3.1.2 |
| @uppy/compressor          |   1.1.0 | @uppy/thumbnail-generator |   3.0.7 |
| @uppy/core                |   3.9.0 | @uppy/transloadit         |   3.5.0 |
| @uppy/dashboard           |   3.7.2 | @uppy/tus                 |   3.5.1 |
| @uppy/drop-target         |   2.0.3 | @uppy/utils               |   5.7.1 |
| @uppy/form                |   3.1.0 | @uppy/vue                 |   1.1.1 |
| @uppy/golden-retriever    |   3.1.2 | @uppy/webcam              |   3.3.5 |
| @uppy/image-editor        |   2.4.1 | @uppy/xhr-upload          |   3.6.1 |
| @uppy/locales             |   3.5.1 | uppy                      |  3.22.0 |
| @uppy/provider-views      |   3.9.0 |                           |         |

-  @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion-client,@uppy/tus,@uppy/xhr-upload: update `uppyfile` objects before emitting events (antoine du hamel / #4928)
- @uppy/transloadit: add `clientname` option (marius / #4920)
- @uppy/thumbnail-generator: fix broken previews after cropping (evgenia karunus / #4926)
- @uppy/compressor: upgrade compressorjs (merlijn vos / #4924)
- @uppy/companion: fix companion dns and allow redirects from http->https again (mikael finstad / #4895)
- @uppy/dashboard: autoopenfileeditor - rename "edit file" to "edit image" (evgenia karunus / #4925)
- meta: resolve jsx to preact in shared tsconfig (merlijn vos / #4923)
- @uppy/image-editor: image editor: make compressor work after the image editor, too (evgenia karunus / #4918)
- meta: exclude `tsconfig` files from npm bundles (antoine du hamel / #4916)
- @uppy/compressor: migrate to ts (mikael finstad / #4907)
- @uppy/provider-views: update uppy-providerbrowser-viewtype--list.scss (aditya patadia / #4913)
- @uppy/tus: migrate to ts (merlijn vos / #4899)
- meta: bump yarn version (antoine du hamel / #4906)
- meta: validate `defaultoptions` for stricter option types (antoine du hamel / #4901)
- @uppy/dashboard: Uncouple native camera and video buttons from the `disableLocalFiles` option (jake mcallister / #4894)
- meta: put experimental ternaries in .prettierrc.js (merlijn vos / #4900)
- @uppy/xhr-upload: migrate to ts (merlijn vos / #4892)
- @uppy/drop-target: refactor to typescript (artur paikin / #4863)
- meta: fix missing line return in js2ts script (antoine du hamel)
- meta: disable `@typescript-eslint/no-empty-function` lint rule (antoine du hamel / #4891)
- @uppy/companion-client: fix tests and linter (antoine du hamel / #4890)
- @uppy/companion-client: migrate to ts (merlijn vos / #4864)
- meta: prettier 3.0.3 -> 3.2.4 (antoine du hamel / #4889)
- @uppy/image-editor: migrate to ts (merlijn vos / #4880)
- meta: fix race condition in `e2e.yml` (antoine du hamel)
- @uppy/core: add utility type to help define plugin option types (antoine du hamel / #4885)
- meta: merge `output-watcher` and `e2e` workflows (antoine du hamel / #4886)
- @uppy/status-bar: fix `statusbaroptions` type (antoine du hamel / #4883)
- @uppy/core: improve types of .use() (merlijn vos / #4882)
- @uppy/audio: fix `audiooptions` (antoine du hamel / #4884)
- meta: upgrade vite and vitest (antoine du hamel / #4881)
- meta: fix `yarn build:clean` (antoine du hamel)
- @uppy/audio: refactor to typescript (antoine du hamel / #4860)
- @uppy/status-bar: refactor to typescript (antoine du hamel / #4839)
- @uppy/core: add `plugintarget` type and mark options as optional (antoine du hamel / #4874)
- meta: improve output watcher diff (antoine du hamel / #4876)
- meta: minify the output watcher diff further (antoine du hamel)
- meta: remove comments from output watcher (mikael finstad / #4875)
- @uppy/utils: improve types for `finddomelement` (antoine du hamel / #4873)
- @uppy/code: allow plugins to type `pluginstate` (antoine du hamel / #4872)
- meta: build(deps): bump follow-redirects from 1.15.1 to 1.15.4 (dependabot[bot] / #4862)
- meta: add `output-watcher` gha to help check output diff (antoine du hamel / #4868)
- meta: generate locale pack from output file (antoine du hamel / #4867)
- meta: comment on what we want to do about close, resetprogress, clearuploadedfiles, etc in the next major (artur paikin / #4865)
- meta: fix `yarn build:clean` (antoine du hamel / #4866)
- meta: use `explicit-module-boundary-types` lint rule (antoine du hamel / #4858)
- @uppy/form: use requestsubmit (merlijn vos / #4852)
- @uppy/provider-views: add referrerpolicy to images (merlijn vos / #4853)
- @uppy/core: add `debuglogger` as export in manual types (antoine du hamel / #4831)
- meta: fix `js2ts` script (antoine du hamel / #4846)
- @uppy/xhr-upload: show remove button (merlijn vos / #4851)
- meta: upgrade `@transloadit/prettier-bytes` (antoine du hamel / #4850)
- @uppy/core: add missing requiredmetafields key in restrictions (darthf1 / #4819)
- @uppy/companion,@uppy/tus: bump `tus-js-client` version range (merlijn vos / #4848)
- meta: build(deps): bump aws/aws-sdk-php from 3.272.1 to 3.288.1 in /examples/aws-php (dependabot[bot] / #4838)
- @uppy/dashboard: fix `typeerror` when `file.remote` is nullish (antoine du hamel / #4825)
- meta: fix `js2ts` script (antoine du hamel / #4844)
- @uppy/locales: fix "save" button translation in hr_hr.ts (žan žlender / #4830)
- meta: fix linting of `.tsx` files (antoine du hamel / #4843)
- @uppy/core: fix types (antoine du hamel / #4842)
- @uppy/utils: improve `preprocess` and `postprocess` types (antoine du hamel / #4841)
- meta: fix `yarn build:clean` (mikael finstad / #4840)
- meta: dev: remove extensions from vite aliases (antoine du hamel)
- meta: fix `"e2e"` script (antoine du hamel)
- @uppy/core: refactor to ts (murderlon)
- meta: fix typescript ci (antoine du hamel)
- meta: fix clean script (mikael finstad / #4820)
- @uppy/companion-client: fix `typeerror` (antoine du hamel)


## 3.21.0

Released: 2023-12-12

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/aws-s3           |   3.6.0 | @uppy/instagram        |   3.2.0 |
| @uppy/aws-s3-multipart |  3.10.0 | @uppy/onedrive         |   3.2.0 |
| @uppy/box              |   2.2.0 | @uppy/provider-views   |   3.8.0 |
| @uppy/companion        |  4.12.0 | @uppy/store-default    |   3.2.0 |
| @uppy/companion-client |   3.7.0 | @uppy/tus              |   3.5.0 |
| @uppy/core             |   3.8.0 | @uppy/url              |   3.5.0 |
| @uppy/dropbox          |   3.2.0 | @uppy/utils            |   5.7.0 |
| @uppy/facebook         |   3.2.0 | @uppy/xhr-upload       |   3.6.0 |
| @uppy/google-drive     |   3.4.0 | @uppy/zoom             |   2.2.0 |
| @uppy/image-editor     |   2.4.0 | uppy                   |  3.21.0 |

- @uppy/provider-views: fix uploadRemoteFile undefined (Mikael Finstad / #4814)
- @uppy/companion: fix double tus uploads (Mikael Finstad / #4816)
- @uppy/companion: fix accelerated endpoints for presigned POST  (Mikael Finstad / #4817)
- @uppy/companion: fix `authProvider` property inconsistency (Mikael Finstad / #4672)
- @uppy/companion:  send certain onedrive errors to the user (Mikael Finstad / #4671)
- meta: fix typo in `lockfile_check.yml` name (Antoine du Hamel)
- @uppy/aws-s3: change Companion URL in tests (Antoine du Hamel)
- @uppy/set-state: fix types (Antoine du Hamel)
- @uppy/companion: Provider user sessions (Mikael Finstad / #4619)
- meta: fix `js2ts` script on Node.js 20+ (Merlijn Vos / #4802)
- @uppy/companion-client: avoid unnecessary preflight requests (Antoine du Hamel / #4462)
- meta: Migrate to AWS-SDK V3 syntax (Artur Paikin / #4810)
- @uppy/utils: fix import in test files (Antoine du Hamel / #4806)
- @uppy/core: Fix onBeforeFileAdded with Golden Retriever (Merlijn Vos / #4799)
- @uppy/image-editor: respect `cropperOptions.initialAspectRatio` (Lucklj521 / #4805)


## 3.20.0

Released: 2023-11-24

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/companion-client |   3.6.1 | @uppy/store-default    |   3.1.0 |
| @uppy/locales          |   3.5.0 | uppy                   |  3.20.0 |

- meta: uppy CDN: Export UIPlugin and BasePlugin (Artur Paikin / #4774)
- @uppy/locales: Add missing translations to de_DE (Leonhard Melzer / #4800)
- @uppy/store-default: refactor to typescript (Antoine du Hamel / #4785)
- meta: improve js2ts script (Antoine du Hamel / #4786)
- @uppy/companion-client: fix log type error (Mikael Finstad / #4766)
- @uppy/companion-client: revert breaking change (Antoine du Hamel / #4801)
- @uppy/locales: use TypeScript for source files (Antoine du Hamel / #4779)
- meta: migrate AWS SDK v2 to v3 in `bin/uploadcdn` (Trivikram Kamat / #4776)


## 3.19.1

Released: 2023-11-12

| Package            | Version | Package            | Version |
| ------------------ | ------- | ------------------ | ------- |
| @uppy/core         |   3.7.1 | @uppy/react-native |   0.5.2 |
| @uppy/dashboard    |   3.7.1 | uppy               |  3.19.1 |
| @uppy/react        |   3.2.1 |                    |         |

- @uppy/react: Revert "@uppy/react: add useUppyState (#4711)" (Artur Paikin / #4789)
- @uppy/dashboard: fix(@uppy/dashboard): fix wrong option type in index.d.ts (dzcpy / #4788)
- meta: fix build of TypeScript plugins (Antoine du Hamel / #4784)
- @uppy/core,@uppy/dashboard,@uppy/react-native: Update Uppy's blue color to meet WCAG contrast requirements (Alexander Zaytsev / #4777)
- meta: fix JS2TS script (Antoine du Hamel / #4778)


## 3.19.0

Released: 2023-11-08

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/aws-s3           |   3.5.0 | @uppy/provider-views   |   3.7.0 |
| @uppy/aws-s3-multipart |   3.9.0 | @uppy/react            |   3.2.0 |
| @uppy/companion        |  4.11.0 | @uppy/transloadit      |   3.4.0 |
| @uppy/companion-client |   3.6.0 | @uppy/tus              |   3.4.0 |
| @uppy/core             |   3.7.0 | @uppy/url              |   3.4.0 |
| @uppy/dashboard        |   3.7.0 | @uppy/utils            |   5.6.0 |
| @uppy/image-editor     |   2.3.0 | @uppy/xhr-upload       |   3.5.0 |
| @uppy/locales          |   3.4.0 | uppy                   |  3.19.0 |

- @uppy/dashboard: Remove uppy-Dashboard-isFixed when uppy.close() is invoked (Artur Paikin / #4775)
- @uppy/core,@uppy/dashboard: don't cancel all files when clicking "done" (Mikael Finstad / #4771)
- @uppy/utils: refactor to TS (Antoine du Hamel / #4699)
- @uppy/locales: locales: add ca_ES (ordago / #4772)
- @uppy/companion: Companion+client stability fixes, error handling and retry (Mikael Finstad / #4734)
- @uppy/companion: add getBucket metadata argument (Mikael Finstad / #4770)
- @uppy/core: simplify types with class generic (JokcyLou / #4761)
- @uppy/image-editor: More image editor improvements (Evgenia Karunus / #4676)
- @uppy/react: add useUppyState (Merlijn Vos / #4711)


## 3.18.1

Released: 2023-10-23

| Package         | Version | Package         | Version |
| --------------- | ------- | --------------- | ------- |
| @uppy/companion |  4.10.1 | uppy            |  3.18.1 |
| @uppy/core      |   3.6.1 |                 |         |

- @uppy/companion: Bump jsonwebtoken from 8.5.1 to 9.0.0 in /packages/@uppy/companion (dependabot[bot] / #4751)
- meta: Bump react-devtools-core from 4.25.0 to 4.28.4 (dependabot[bot] / #4756)
- meta: Bump webpack from 5.74.0 to 5.88.2 (dependabot[bot] / #4740)
- meta: Bump @babel/traverse from 7.22.5 to 7.23.2 (dependabot[bot] / #4739)
- @uppy/core: fix `sideEffects` declaration (Antoine du Hamel / #4759)


## 3.18.0

Released: 2023-10-20

| Package                   | Version | Package                   | Version |
| ------------------------- | ------- | ------------------------- | ------- |
| @uppy/angular             |   0.6.1 | @uppy/progress-bar        |   3.0.4 |
| @uppy/audio               |   1.1.4 | @uppy/provider-views      |   3.6.0 |
| @uppy/aws-s3              |   3.4.0 | @uppy/react               |   3.1.4 |
| @uppy/aws-s3-multipart    |   3.8.0 | @uppy/remote-sources      |   1.1.0 |
| @uppy/box                 |   2.1.4 | @uppy/screen-capture      |   3.1.3 |
| @uppy/companion           |  4.10.0 | @uppy/status-bar          |   3.2.5 |
| @uppy/companion-client    |   3.5.0 | @uppy/store-default       |   3.0.5 |
| @uppy/compressor          |   1.0.5 | @uppy/store-redux         |   3.0.5 |
| @uppy/core                |   3.6.0 | @uppy/svelte              |   3.1.1 |
| @uppy/dashboard           |   3.6.0 | @uppy/thumbnail-generator |   3.0.6 |
| @uppy/drop-target         |   2.0.2 | @uppy/transloadit         |   3.3.2 |
| @uppy/dropbox             |   3.1.4 | @uppy/tus                 |   3.3.2 |
| @uppy/facebook            |   3.1.3 | @uppy/unsplash            |   3.2.3 |
| @uppy/file-input          |   3.0.4 | @uppy/url                 |   3.3.4 |
| @uppy/form                |   3.0.3 | @uppy/utils               |   5.5.2 |
| @uppy/golden-retriever    |   3.1.1 | @uppy/vue                 |   1.1.0 |
| @uppy/google-drive        |   3.3.0 | @uppy/webcam              |   3.3.4 |
| @uppy/image-editor        |   2.2.2 | @uppy/xhr-upload          |   3.4.2 |
| @uppy/informer            |   3.0.4 | @uppy/zoom                |   2.1.3 |
| @uppy/instagram           |   3.1.3 | uppy                      |  3.18.0 |
| @uppy/onedrive            |   3.1.4 |                           |         |

- @uppy/aws-s3-multipart: fix `TypeError` (Antoine du Hamel / #4748)
- meta: Bump tough-cookie from 4.1.2 to 4.1.3 (dependabot[bot] / #4750)
- meta: example: simplify code by using built-in `throwIfAborted` (Antoine du Hamel / #4749)
- @uppy/aws-s3-multipart: pass `signal` as separate arg for backward compat (Antoine du Hamel / #4746)
- meta: fix TS integration (Antoine du Hamel / #4741)
- meta: fix js2ts check (Antoine du Hamel)
- meta: add support for TypeScript plugins (Antoine du Hamel / #4640)
- @uppy/vue: export FileInput (mdxiaohu / #4736)
- meta: examples: update `server.py` (codehero7386 / #4732)
- @uppy/aws-s3-multipart: fix `uploadURL` when using `PUT` (Antoine du Hamel / #4701)
- @uppy/dashboard: auto discover and install plugins without target (Artur Paikin / #4343)
- meta: e2e: upgrade Cypress (Antoine du Hamel / #4731)
- @uppy/core: mark the package as side-effect free (Antoine du Hamel / #4730)
- meta: Bump postcss from 8.4.16 to 8.4.31 (dependabot[bot] / #4723)
- meta: test with the latest versions of Node.js (Antoine du Hamel / #4729)
- meta: e2e: update Parcel (Antoine du Hamel / #4726)
- meta: uppy: fix types (Antoine du Hamel / #4721)
- @uppy/core: type more events (Antoine du Hamel / #4719)
- @uppy/svelte: fix TS build command (Antoine du Hamel / #4720)
- @uppy/companion: Bucket fn also remote files (Mikael Finstad / #4693)
- @uppy/companion-client: fixup! Added Companion OAuth Key type (Murderlon / #4668)
- @uppy/companion-client: Added Companion OAuth Key type (Chris Pratt / #4668)
- meta: check for formatting in CI (Antoine du Hamel / #4714)
- meta: bump get-func-name from 2.0.0 to 2.0.2 (dependabot[bot] / #4709)
- meta: run Prettier on existing files (Antoine du Hamel / #4713)


## 3.17.0

Released: 2023-09-29

| Package                   | Version | Package                   | Version |
| ------------------------- | ------- | ------------------------- | ------- |
| @uppy/audio               |   1.1.3 | @uppy/store-default       |   3.0.4 |
| @uppy/aws-s3              |   3.3.1 | @uppy/store-redux         |   3.0.4 |
| @uppy/aws-s3-multipart    |   3.7.0 | @uppy/svelte              |   3.1.0 |
| @uppy/companion           |   4.9.1 | @uppy/thumbnail-generator |   3.0.5 |
| @uppy/companion-client    |   3.4.1 | @uppy/transloadit         |   3.3.1 |
| @uppy/compressor          |   1.0.4 | @uppy/tus                 |   3.3.1 |
| @uppy/core                |   3.5.1 | @uppy/utils               |   5.5.1 |
| @uppy/dashboard           |   3.5.4 | @uppy/webcam              |   3.3.3 |
| @uppy/image-editor        |   2.2.1 | @uppy/xhr-upload          |   3.4.1 |
| @uppy/remote-sources      |   1.0.4 | uppy                      |  3.17.0 |

- meta: add Prettier (Antoine du Hamel / #4707)
- @uppy/aws-s3-multipart: retry signature request (Merlijn Vos / #4691)
- meta: update linter config to cover more files (Mikael Finstad / #4706)
- @uppy/image-editor: ImageEditor.jsx - remove 1px black lines (Evgenia Karunus / #4678)
- meta: delete `.yarn/releases/yarn-3.4.1.cjs` (Antoine du Hamel)
- meta: fix linter errors (Antoine du Hamel / #4704)
- @uppy/utils: test: migrate to Vitest for Uppy core and Uppy plugins (Antoine du Hamel / #4700)
- meta: run corepack yarn (Mikael Finstad)
- @uppy/companion: upgrade TS target (Mikael Finstad / #4670)
- @uppy/companion: use deferred length for tus streams (Mikael Finstad / #4697)
- @uppy/companion-client: fix a refresh token race condition (Mikael Finstad / #4695)
- meta: add companion hotfix doc (Mikael Finstad / #4683)
- meta: run type checks also for companion and add files to docker (Mikael Finstad / #4688)
- @uppy/svelte: revert breaking change (Antoine du Hamel / #4694)
- meta: Update yarn.lock (Artur Paikin)
- @uppy/companion: fix instagram/facebook auth error regression (Mikael Finstad / #4692)
- @uppy/aws-s3-multipart: aws-s3-multipart - call `#setCompanionHeaders` in `setOptions` (jur-ng / #4687)
- @uppy/svelte: Upgrade Svelte to 4 (frederikhors / #4652)
- @uppy/companion: add test endpoint for dynamic oauth creds (Mikael Finstad / #4667)
- meta: fix VITE_COMPANION_ALLOWED_HOSTS (Mikael Finstad / #4690)
- @uppy/companion: fix edge case for pagination on root (Mikael Finstad / #4689)
- @uppy/companion: fix onedrive pagination (Mikael Finstad / #4686)


## 3.16.0

Released: 2023-09-18

| Package            | Version | Package            | Version |
| ------------------ | ------- | ------------------ | ------- |
| @uppy/companion    |   4.9.0 | @uppy/locales      |   3.3.1 |
| @uppy/compressor   |   1.0.3 | @uppy/tus          |   3.3.0 |
| @uppy/dashboard    |   3.5.3 | uppy               |  3.16.0 |
| @uppy/image-editor |   2.2.0 |                    |         |

- @uppy/tus: Fix: Utilize user-defined onSuccess, onError, and onProgress callbacks in @uppy/tus (choi sung keun / #4674)
- @uppy/dashboard: Make file-editor:cancel event fire when the Image Editor “cancel” button is pressed (Artur Paikin / #4684)
- @uppy/companion: add missing credentialsURL for box (Mikael Finstad / #4681)
- @uppy/companion: remove s3 endpoints if s3 disabled (Mikael Finstad / #4675)
- meta: use latest Node.js version for tests (Antoine du Hamel / #4662)
- meta: Improve Contributing.md (Evgenia Karunus / #4633)
- @uppy/compressor: update file.meta.name after compression, becase format/extension might have changed (Artur Paikin / #4645)
- @uppy/companion: Onedrive refresh tokens (Mikael Finstad / #4655)
- @uppy/companion: catch "invalid initialization vector" instead of crashing (Mikael Finstad / #4661)
- @uppy/image-editor: Improve image rotation (Evgenia Karunus / #4639)
- @uppy/locales: Feature/updating i18n farsi (Parsa Arvaneh / #4638)


## 3.15.0

Released: 2023-09-05

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/angular          |   0.6.0 | @uppy/dashboard        |   3.5.2 |
| @uppy/aws-s3           |   3.3.0 | @uppy/transloadit      |   3.3.0 |
| @uppy/aws-s3-multipart |   3.6.0 | @uppy/tus              |   3.2.0 |
| @uppy/companion        |   4.8.2 | @uppy/utils            |   5.5.0 |
| @uppy/companion-client |   3.4.0 | @uppy/xhr-upload       |   3.4.0 |
| @uppy/core             |   3.5.0 | uppy                   |  3.15.0 |

- @uppy/transloadit: Emit assembly progress events (Marius / #4603)
- @uppy/transloadit: remove Socket.io (Antoine du Hamel / #4281)
- meta: example: update Angular example to 16.x (Antoine du Hamel / #4642)
- @uppy/angular: upgrade to Angular 16.x (Antoine du Hamel / #4642)
- @uppy/companion: refactor `getProtectedHttpAgent` to make TS happy (Antoine du Hamel / #4654)
- @uppy/companion: Alias "removeListener" as "off" in Redis emitter (Elliot Dickison / #4647)
- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion-client,@uppy/core,@uppy/tus,@uppy/utils,@uppy/xhr-upload: Move remote file upload logic into companion-client (Merlijn Vos / #4573)
- @uppy/dashboard: when showAddFilesPanel  is true, aria-hidden should be the opposite (Artur Paikin / #4643)


## 3.14.1

Released: 2023-08-23

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/aws-s3           |   3.2.3 | @uppy/companion        |   4.8.1 |
| @uppy/aws-s3-multipart |   3.5.4 | uppy                   |  3.14.1 |

- @uppy/aws-s3-multipart: fix types when using deprecated option (Antoine du Hamel / #4634)
- @uppy/companion: harden lint rules (Antoine du Hamel / #4641)
- @uppy/aws-s3-multipart,@uppy/aws-s3: allow empty objects for `fields` types (Antoine du Hamel / #4631)
- meta: upgrade Node.js docker version (Antoine du Hamel / #4630)


## 3.14.0

Released: 2023-08-15

| Package                   | Version | Package                   | Version |
| ------------------------- | ------- | ------------------------- | ------- |
| @uppy/audio               |   1.1.2 | @uppy/locales             |   3.3.0 |
| @uppy/aws-s3              |   3.2.2 | @uppy/onedrive            |   3.1.3 |
| @uppy/aws-s3-multipart    |   3.5.3 | @uppy/progress-bar        |   3.0.3 |
| @uppy/box                 |   2.1.3 | @uppy/provider-views      |   3.5.0 |
| @uppy/companion           |   4.8.0 | @uppy/redux-dev-tools     |   3.0.3 |
| @uppy/companion-client    |   3.3.0 | @uppy/screen-capture      |   3.1.2 |
| @uppy/core                |   3.4.0 | @uppy/status-bar          |   3.2.4 |
| @uppy/dashboard           |   3.5.1 | @uppy/thumbnail-generator |   3.0.4 |
| @uppy/drag-drop           |   3.0.3 | @uppy/transloadit         |   3.2.1 |
| @uppy/dropbox             |   3.1.3 | @uppy/tus                 |   3.1.3 |
| @uppy/facebook            |   3.1.2 | @uppy/unsplash            |   3.2.2 |
| @uppy/file-input          |   3.0.3 | @uppy/url                 |   3.3.3 |
| @uppy/google-drive        |   3.2.1 | @uppy/webcam              |   3.3.2 |
| @uppy/image-editor        |   2.1.3 | @uppy/xhr-upload          |   3.3.2 |
| @uppy/informer            |   3.0.3 | @uppy/zoom                |   2.1.2 |
| @uppy/instagram           |   3.1.2 | uppy                      |  3.14.0 |

- meta: Readme improvements (Artur Paikin / #4622)
- @uppy/companion: Fix typos and add env vars to .env.example (Dominik Schmidt / #4624)
- @uppy/aws-s3-multipart: pass the `uploadURL` back to the caller (Antoine du Hamel / #4614)
- meta: update to node-18.17.0-alpine,  (odselsevier / #4617)
- @uppy/aws-s3,@uppy/aws-s3-multipart: update types (Antoine du Hamel / #4611)
- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion,@uppy/transloadit,@uppy/xhr-upload: use uppercase HTTP method names (Antoine du Hamel / #4612)
- meta: e2e: fix race condition in transloadit test (Antoine du Hamel / #4616)
- @uppy/aws-s3,@uppy/aws-s3-multipart: update types (bdirito / #4576)
- @uppy/core: allow duplicate files with onBeforeFileAdded (Merlijn Vos / #4594)
- @uppy/companion: make CSRF protection helpers available to providers (Dominik Schmidt / #4554)
- @uppy/companion: fix Redis key default TTL (Subha Sarkar / #4607)
- @uppy/companion: Fix Uploader.js metadata normalisation (Subha Sarkar / #4608)
- @uppy/companion-client,@uppy/provider-views: make authentication optional (Dominik Schmidt / #4556)
- @uppy/provider-views: fix ProviderView error on empty plugin.icon (Dominik Schmidt / #4553)
- @uppy/aws-s3,@uppy/tus,@uppy/xhr-upload:  Invoke headers function for remote uploads (Dominik Schmidt / #4596)
- @uppy/companion: Unify redis initialization (Dominik Schmidt / #4597)
- meta: lock node-js version on ci (Mikael Finstad / #4606)
- @uppy/companion: allow dynamic S3 bucket (rmoura-92 / #4579)
- @uppy/status-bar: e2e: add test for retrying and pausing uploads (Antoine du Hamel / #3599)
- meta: e2e: remove too short timeout (Antoine du Hamel / #4602)


## 3.13.1

Released: 2023-07-24

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/aws-s3-multipart |   3.5.2 | uppy                   |  3.13.1 |
| @uppy/utils            |   5.4.3 |                        |         |

- @uppy/utils: align version of `preact` with the UI plugins (Antoine du Hamel / #4599)
- @uppy/aws-s3-multipart: refresh file before calling user-defined functions (mjlumetta / #4557)
- @uppy/utils: align version of `preact` with the UI plugins (Antoine du Hamel / #4599)


## 3.13.0

Released: 2023-07-20

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/aws-s3-multipart |   3.5.1 | @uppy/provider-views   |   3.4.1 |
| @uppy/companion-client |   3.2.2 | @uppy/status-bar       |   3.2.3 |
| @uppy/dashboard        |   3.5.0 | @uppy/utils            |   5.4.2 |
| @uppy/locales          |   3.2.4 | uppy                   |  3.13.0 |

- meta: Add i18n to CONTRIBUTING.md (Mikael Finstad / #4591)
- @uppy/provider-views: Add VirtualList to ProviderView (Merlijn Vos / #4566)
- @uppy/provider-views: fix race conditions with folder loading (Mikael Finstad / #4578)
- @uppy/status-bar: fix ETA when status bar is installed during upload (Antoine du Hamel / #4588)
- @uppy/provider-views: fix infinite folder loading  (Mikael Finstad / #4590)
- meta: examples/aws: client-side signing (Antoine du Hamel / #4463)
- meta: Bump word-wrap from 1.2.3 to 1.2.4 (dependabot[bot] / #4586)
- meta: e2e: increase `requestTimeout` to 16s (Antoine du Hamel / #4587)
- @uppy/locales: update zh_TW translation (5idereal / #4583)
- @uppy/aws-s3-multipart: fix crash on pause/resume (Merlijn Vos / #4581)
- @uppy/aws-s3-multipart: do not access `globalThis.crypto` on the top-level (Bryan J Swift / #4584)


## 3.12.0

Released: 2023-07-13

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/aws-s3-multipart |   3.5.0 | @uppy/locales          |   3.2.3 |
| @uppy/box              |   2.1.2 | @uppy/onedrive         |   3.1.2 |
| @uppy/companion        |   4.7.0 | @uppy/provider-views   |   3.4.0 |
| @uppy/companion-client |   3.2.1 | @uppy/react            |   3.1.3 |
| @uppy/core             |   3.3.1 | @uppy/status-bar       |   3.2.2 |
| @uppy/dashboard        |   3.4.2 | @uppy/transloadit      |   3.2.0 |
| @uppy/dropbox          |   3.1.2 | @uppy/utils            |   5.4.1 |
| @uppy/google-drive     |   3.2.0 | uppy                   |  3.12.0 |

- @uppy/transloadit: fix error message (Antoine du Hamel / #4572)
- @uppy/provider-views: add support for remote file paths (Mikael Finstad / #4537)
- @uppy/transloadit: implement Server-sent event API (Antoine du Hamel / #4098)
- @uppy/aws-s3-multipart: add support for signing on the client (Antoine du Hamel / #4519)
- @uppy/react: allow `id` from props (Merlijn Vos / #4570)
- @uppy/aws-s3-multipart: fix lint warning (Antoine du Hamel / #4569)
- @uppy/status-bar: listen to `upload` event instead of button click (Antoine du Hamel / #4563)
- @uppy/aws-s3-multipart: fix support for non-multipart PUT upload (Antoine du Hamel / #4568)
- @uppy/companion: fix esm imports in production/transpiled builds (Dominik Schmidt / #4561)
- @uppy/locales: fix expression and spelling errors in es_ES (Rubén / #4567)
- meta: upgrade dev dependencies (dependabot\[bot\])
- meta: Don't use triage label (Artur Paikin / #4552)
- meta: update Cypress (Antoine du Hamel / #4562)
- @uppy/box,@uppy/companion,@uppy/dropbox,@uppy/google-drive,@uppy/onedrive,@uppy/provider-views: Load Google Drive / OneDrive lists 5-10x faster & always load all files (Merlijn Vos / #4513)
- @uppy/locales: Add missing pt-BR locales for ImageEditor plugin (Mateus Cruz / #4558)


## 3.11.0

Released: 2023-07-06

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/aws-s3           |   3.2.1 | @uppy/golden-retriever |   3.1.0 |
| @uppy/aws-s3-multipart |   3.4.1 | @uppy/status-bar       |   3.2.1 |
| @uppy/companion        |   4.6.0 | @uppy/tus              |   3.1.2 |
| @uppy/companion-client |   3.2.0 | @uppy/xhr-upload       |   3.3.1 |
| @uppy/core             |   3.3.0 | uppy                   |  3.11.0 |

- @uppy/companion: fix infinite recursion in uploader test (Mikael Finstad / #4536)
- @uppy/xhr-upload: export `Headers` type (Masum ULU / #4549)
- @uppy/aws-s3-multipart: increase priority of abort and complete (Stefan Schonert / #4542)
- @uppy/aws-s3: fix remote uploads (Antoine du Hamel / #4546)
- meta: use `corepack yarn` instead of `npm` to launch E2E (Antoine du Hamel / #4545)
- @uppy/aws-s3-multipart: fix upload retry using an outdated ID (Antoine du Hamel / #4544)
- @uppy/status-bar: remove throttled component (Artur Paikin / #4396)
- @uppy/aws-s3-multipart: fix Golden Retriever integration (Antoine du Hamel / #4526)
- examples/aws-nodejs: merge multipart and non-multipart examples (Antoine du Hamel / #4521)
- @uppy/companion: bump semver from 7.3.7 to 7.5.3 (dependabot[bot] / #4529)
- @uppy/aws-s3-multipart: add types to internal fields (Antoine du Hamel / #4535)
- examples/aws-nodejs: update README (Antoine du Hamel / #4534)
- examples/aws-nodejs: showcase an example without preflight requests (Antoine du Hamel / #4516)
- @uppy/aws-s3-multipart: fix pause/resume (Antoine du Hamel / #4523)
- @uppy/status-bar: fix ETA when Uppy recovers its state (Antoine du Hamel / #4525)
- @uppy/aws-s3-multipart: fix resume single-chunk multipart uploads (Antoine du Hamel / #4528)
- @uppy/companion: fix part listing in s3 (Antoine du Hamel / #4524)
- example/aws-php: make it forward-compatible with the next Uppy major (Antoine du Hamel / #4522)
- @uppy/golden-retriever: refactor to modernize the codebase (Antoine du Hamel / #4520)
- examples/aws-nodejs: upgrade to AWS-SDK v3 (Antoine du Hamel / #4515)
- @uppy/companion: implement refresh for authentication tokens (Mikael Finstad / #4448)
- @uppy/aws-s3-multipart: disable pause/resume for remote uploads in the UI (Artur Paikin / #4500)
- @uppy/tus: retry on 423 HTTP error code (Antoine du Hamel / #4512)


## 3.10.0

Released: 2023-06-19

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/aws-s3           |   3.2.0 | @uppy/status-bar       |   3.2.0 |
| @uppy/aws-s3-multipart |   3.4.0 | @uppy/transloadit      |   3.1.6 |
| @uppy/companion        |   4.5.1 | @uppy/tus              |   3.1.1 |
| @uppy/core             |   3.2.1 | @uppy/url              |   3.3.2 |
| @uppy/dashboard        |   3.4.1 | @uppy/utils            |   5.4.0 |
| @uppy/golden-retriever |   3.0.4 | @uppy/xhr-upload       |   3.3.0 |
| @uppy/locales          |   3.2.2 | uppy                   |  3.10.0 |
| @uppy/provider-views   |   3.3.1 |                        |         |

- @uppy/aws-s3-multipart: fix the chunk size calculation (Antoine du Hamel / #4508)
- @uppy/aws-s3: add `shouldUseMultipart` option (Antoine du Hamel / #4299)
- @uppy/companion: switch from aws-sdk v2 to @aws-sdk/* (v3) (Scott Bessler / #4285)
- @uppy/companion,@uppy/core,@uppy/dashboard,@uppy/golden-retriever,@uppy/status-bar,@uppy/utils: Migrate all lodash' per-method-packages usage to lodash. (LinusMain / #4274)
- @uppy/core: Don't set late (throttled) progress event on a file that is 100% complete (Artur Paikin / #4507)
- @uppy/companion: revert randomness from file names (Mikael Finstad / #4509)
- @uppy/companion: Custom provider fixes (Mikael Finstad / #4498)
- @uppy/transloadit: ensure `fields` is not nullish when there no uploaded files (Antoine du Hamel / #4487)
- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus,@uppy/utils,@uppy/xhr-upload: When file is removed (or all are canceled), controller.abort queued requests (Artur Paikin / #4504)
- @uppy/provider-views: Fix range selection not resetting and computing correctly (Terence C / #4415)
- meta: disallow use of `.only` in tests (Antoine du Hamel / #4494)
- @uppy/companion: fix 500 when file name contains non-ASCII chars (Antoine du Hamel / #4493)
- @uppy/locales: update `fr_FR.js` (Samuel De Backer / #4499)
- @uppy/aws-s3-multipart,@uppy/tus,@uppy/xhr-upload: Don't close socket while upload is still in progress (Artur Paikin / #4479)
- meta: bump `luxon` from 1.28.0 to 1.28.1 (dependabot[bot] / #4497)
- @uppy/utils: rename `EventTracker` -> `EventManager` (Stephen Wooten / #4481)
- meta: bump cookiejar from 2.1.3 to 2.1.4 (dependabot[bot] / #4496)
- meta: make `pre-commit` use `corepack yarn` instead of `npm run` (Antoine du Hamel / #4495)
- meta: bump ua-parser-js from 0.7.31 to 0.7.35 (dependabot[bot] / #4474)
- meta: bump @sideway/formula from 3.0.0 to 3.0.1 (dependabot[bot] / #4473)
- meta: bump http-cache-semantics from 4.1.0 to 4.1.1 (dependabot[bot] / #4472)
- @uppy/companion: Use filename from content-disposition instead of relying on url, with fallback (Artur Paikin / #4489)
- meta: bump `babel`, `esbuild`, and `vite` (dependabot[bot] / #4485)
- @uppy/dashboard: include the old state when setting new (Artur Paikin / #4490)
- @uppy/companion: fix companion implicitpath (Mikael Finstad / #4484)
- @uppy/companion: fix undefined protocol and example page (Mikael Finstad / #4483)
- meta: upgrade Cypress 12.9.0 -> 12.14.0 (Antoine du Hamel / #4491)
- @uppy/core: remove `state` getter from types (Antoine du Hamel / #4477)
- examples/php-xhr: Added filename sanitation and file size check before saving (neuronet77 / #4432)
- examples/php-xhr: update PHP dependencies (dependabot[bot])
- @uppy/xhr-upload: add support for arrays in metadata (Vasiliy Matyushin / #4431)
- @uppy/status-bar: Filtered ETA (stduhpf / #4458)
- @uppy/aws-s3-multipart: fix `getUploadParameters` option (Antoine du Hamel / #4465)


## 3.9.1

Released: 2023-05-15

| Package           | Version | Package           | Version |
| ----------------- | ------- | ----------------- | ------- |
| @uppy/transloadit |   3.1.5 | uppy              |   3.9.1 |

- @uppy/transloadit: clean up event listener to prevent cancelled assemblies (Merlijn Vos / #4447)


## 3.9.0

Released: 2023-05-02

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/aws-s3           |   3.1.1 | @uppy/status-bar       |   3.1.2 |
| @uppy/aws-s3-multipart |   3.3.0 | @uppy/transloadit      |   3.1.4 |
| @uppy/locales          |   3.2.1 | uppy                   |   3.9.0 |

- @uppy/aws-s3-multipart: allowedMetaFields: null means “include all” (Artur Paikin / #4437)
- @uppy/aws-s3-multipart: add `shouldUseMultipart ` option (Antoine du Hamel / #4205)
- @uppy/transloadit: Reset `tus` key in the file on error, so retried files are re-uploaded (Artur Paikin / #4421)
- meta: commit build file that was modified (Antoine du Hamel)
- meta: examples: add CORS settings for DigitalOcean Spaces (Antoine du Hamel / #4428)
- @uppy/aws-s3: deprecate `timeout` option (Antoine du Hamel / #4298)
- @uppy/aws-s3-multipart: make retries more robust (Antoine du Hamel / #4424)
- meta: fix badges on README (Antoine du Hamel / #4419)


## 3.8.0

Released: 2023-04-18

| Package                   | Version | Package                   | Version |
| ------------------------- | ------- | ------------------------- | ------- |
| @uppy/angular             |   0.5.2 | @uppy/progress-bar        |   3.0.2 |
| @uppy/audio               |   1.1.1 | @uppy/provider-views      |   3.3.0 |
| @uppy/aws-s3              |   3.1.0 | @uppy/react               |   3.1.2 |
| @uppy/aws-s3-multipart    |   3.2.0 | @uppy/react-native        |   0.5.1 |
| @uppy/box                 |   2.1.1 | @uppy/redux-dev-tools     |   3.0.2 |
| @uppy/companion           |   4.5.0 | @uppy/remote-sources      |   1.0.3 |
| @uppy/companion-client    |   3.1.3 | @uppy/screen-capture      |   3.1.1 |
| @uppy/compressor          |   1.0.2 | @uppy/status-bar          |   3.1.1 |
| @uppy/core                |   3.2.0 | @uppy/store-default       |   3.0.3 |
| @uppy/dashboard           |   3.4.0 | @uppy/store-redux         |   3.0.3 |
| @uppy/drag-drop           |   3.0.2 | @uppy/svelte              |   3.0.2 |
| @uppy/dropbox             |   3.1.1 | @uppy/thumbnail-generator |   3.0.3 |
| @uppy/facebook            |   3.1.1 | @uppy/transloadit         |   3.1.3 |
| @uppy/file-input          |   3.0.2 | @uppy/tus                 |   3.1.0 |
| @uppy/form                |   3.0.2 | @uppy/unsplash            |   3.2.1 |
| @uppy/golden-retriever    |   3.0.3 | @uppy/url                 |   3.3.1 |
| @uppy/google-drive        |   3.1.1 | @uppy/utils               |   5.3.0 |
| @uppy/image-editor        |   2.1.2 | @uppy/vue                 |   1.0.2 |
| @uppy/informer            |   3.0.2 | @uppy/webcam              |   3.3.1 |
| @uppy/instagram           |   3.1.1 | @uppy/xhr-upload          |   3.2.0 |
| @uppy/locales             |   3.2.0 | @uppy/zoom                |   2.1.1 |
| @uppy/onedrive            |   3.1.1 | uppy                      |   3.8.0 |

- @uppy/companion: increase max limits for remote file list operations (Mikael Finstad / #4417)
- @uppy/xhr-upload: fix type in README.md (Top Master / #4416)
- @uppy/core: improve performance of validating & uploading files (Mikael Finstad / #4402)
- @uppy/provider-views: Concurrent file listing (Mikael Finstad / #4401)
- @uppy/core,@uppy/locales,@uppy/provider-views: User feedback adding recursive folders take 2 (Mikael Finstad / #4399)
- @uppy/dashboard: Single File Mode: fix layout and make optional (Artur Paikin / #4374)
- @uppy/informer: add a check in `TransitionGroup` when component is null (Juan Belej / #4410)
- meta: Fix logos in all the readmes (Artur Paikin / #4407)
- meta: fix logo in readme (Kid / #4403)


## 3.7.0

Released: 2023-04-04

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/aws-s3           |   3.0.6 | @uppy/status-bar       |   3.1.0 |
| @uppy/aws-s3-multipart |   3.1.3 | @uppy/transloadit      |   3.1.2 |
| @uppy/companion        |   4.4.0 | @uppy/tus              |   3.0.6 |
| @uppy/companion-client |   3.1.2 | @uppy/unsplash         |   3.2.0 |
| @uppy/core             |   3.1.2 | @uppy/url              |   3.3.0 |
| @uppy/dashboard        |   3.3.2 | @uppy/utils            |   5.2.0 |
| @uppy/locales          |   3.1.0 | @uppy/xhr-upload       |   3.1.1 |
| @uppy/provider-views   |   3.2.0 | uppy                   |   3.7.0 |
| @uppy/react            |   3.1.1 |                        |         |

- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus,@uppy/xhr-upload: make sure that we reset serverToken when an upload fails (Mikael Finstad / #4376)
- @uppy/aws-s3-multipart: do not auto-open sockets, clean them up on abort (Antoine du Hamel)
- @uppy/aws-s3: Update types (Minh Hieu / #4294)
- @uppy/companion-client: do not open socket more than once (Artur Paikin)
- @uppy/companion: add `service: 'companion'` to periodic ping (Mikael Finstad / #4383)
- @uppy/companion: add connection keep-alive to dropbox (Mikael Finstad / #4365)
- @uppy/companion: add missing env variable for standalone option (Mikael Finstad / #4382)
- @uppy/companion: add S3 prefix env variable (Mikael Finstad / #4320)
- @uppy/companion: allow local ips when testing (Mikael Finstad / #4328)
- @uppy/companion: fix typo in redis-emitter.js (Ikko Eltociear Ashimine / #4362)
- @uppy/companion: merge Provider/SearchProvider (Mikael Finstad / #4330)
- @uppy/companion: only body parse when needed & increased body size for s3 (Mikael Finstad / #4372)
- @uppy/core: fix bug with `setOptions` (Nguyễn bảo Trung / #4350)
- @uppy/locales: locales: add es_MX (Kevin van Zonneveld / #4393)
- @uppy/locales: locales: add hi_IN (Kevin van Zonneveld / #4391)
- @uppy/provider-views: fix race condition when adding folders (Mikael Finstad / #4384)
- @uppy/provider-views: UI: Use form attribite with a form in doc root to prevent outer form submit (Artur Paikin / #4283)
- @uppy/transloadit: fix socket error message (Artur Paikin / #4352)
- @uppy/tus: do not auto-open sockets, clean them up on abort (Antoine du Hamel)
- meta: add version info in the bundlers CI (Antoine du Hamel / #4386)
- meta: deploy to Heroku on every companion commit (Mikael Finstad / #4367)
- meta: example: migrate `redux` to ESM (Antoine du Hamel / #4158)
- meta: fix all ESLint warnings and turn them into errors (Antoine du Hamel / #4398)
- meta: fixup! website: update links to work under the new URL (Antoine du Hamel / #4371)
- meta: remove duplicate outdated OSS support docs (Mikael Finstad, Artur Paikin / #4364)
- meta: use overrides to make sure no uppy package is fetch from npm (Antoine du Hamel / #4395)
- website: add a deprecation notice and a link to the new website (Antoine du Hamel / #4370)
- website: fix home page (Antoine du Hamel)
- website: Remove the website (Merlijn Vos / #4369)
- website: update links to work under the new URL (Antoine du Hamel / #4371)


## 3.6.1

Released: 2023-03-07

| Package         | Version | Package         | Version |
| --------------- | ------- | --------------- | ------- |
| @uppy/core      |   3.1.1 | uppy            |   3.6.1 |
| @uppy/dashboard |   3.3.1 |                 |         |

- @uppy/dashboard: Fix low-contrast hover styles (Alexander Zaytsev / #4347)


## 3.6.0

Released: 2023-03-07

| Package              | Version | Package              | Version |
| -------------------- | ------- | -------------------- | ------- |
| @uppy/audio          |   1.1.0 | @uppy/onedrive       |   3.1.0 |
| @uppy/box            |   2.1.0 | @uppy/provider-views |   3.1.0 |
| @uppy/core           |   3.1.0 | @uppy/screen-capture |   3.1.0 |
| @uppy/dashboard      |   3.3.0 | @uppy/unsplash       |   3.1.0 |
| @uppy/dropbox        |   3.1.0 | @uppy/url            |   3.2.0 |
| @uppy/facebook       |   3.1.0 | @uppy/utils          |   5.1.3 |
| @uppy/google-drive   |   3.1.0 | @uppy/webcam         |   3.3.0 |
| @uppy/image-editor   |   2.1.1 | @uppy/zoom           |   2.1.0 |
| @uppy/instagram      |   3.1.0 | uppy                 |   3.6.0 |
| @uppy/locales        |   3.0.7 |                      |         |

- @uppy/locales: add missing entries after build (Murderlon)
- @uppy/dashboard: update provider icon style (Alexander Zaytsev / #4345)
- @uppy/core: fix uppy.resetProgress() (Artur Paikin / #4337)
- @uppy/core: fix some types (Antoine du Hamel / #4332)
- @uppy/core: Fixed type of State.info to match reality being an array of info objects (Marc Bennewitz / #4321)
- @uppy/image-editor: Fix TypeScript error in image-editor types (Matthias Kunnen / #4334)
- meta: improve `importFromUploadURLs` docs (Mikael Finstad / #4323)
- @uppy/utils: workaround chrome crash (Mikael Finstad / #4310)


## 3.5.0

Released: 2023-02-13

| Package              | Version | Package              | Version |
| -------------------- | ------- | -------------------- | ------- |
| @uppy/audio          |   1.0.4 | @uppy/screen-capture |   3.0.2 |
| @uppy/companion      |   4.3.0 | @uppy/transloadit    |   3.1.1 |
| @uppy/core           |   3.0.6 | @uppy/xhr-upload     |   3.1.0 |
| @uppy/dashboard      |   3.2.2 | uppy                 |   3.5.0 |
| @uppy/locales        |   3.0.6 |                      |         |

- @uppy/transloadit: fix `assemblyOptions` option (Antoine du Hamel / #4316)
- meta: Remove Robodog advice, since it is deprecated (Artur Paikin)
- @uppy/dashboard: fix dashboard acquirers list (Mikael Finstad / #4306)
- @uppy/dashboard: Dashboard: disallow clicking on buttons and links in Dashboard disabled mode (Artur Paikin / #4292)
- @uppy/audio,@uppy/core,@uppy/dashboard,@uppy/screen-capture: Warn more instead of erroring (Artur Paikin / #4302)
- @uppy/locales: Update de_DE.js (Jörn Velten / #4297)
- meta: use load balancer for companion in e2e tests (Mikael Finstad / #4228)
- @uppy/companion: @uppy/companion upgrade grant dependency (Scott Bessler / #4286)
- @uppy/xhr-upload: add `'upload-stalled'` event (Antoine du Hamel / #4247)
- @uppy/locales: minor enhancements and typo fixes for the hungarian translation (KergeKacsa / #4282)


## 3.4.0

Released: 2023-01-26

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/audio            |   1.0.3 | @uppy/locales          |   3.0.5 |
| @uppy/aws-s3           |   3.0.5 | @uppy/react            |   3.1.0 |
| @uppy/aws-s3-multipart |   3.1.2 | @uppy/react-native     |   0.5.0 |
| @uppy/companion        |   4.2.0 | @uppy/transloadit      |   3.1.0 |
| @uppy/core             |   3.0.5 | @uppy/utils            |   5.1.2 |
| @uppy/dashboard        |   3.2.1 | uppy                   |   3.4.0 |

- @uppy/utils: better fallbacks for the drag & drop API (Antoine du Hamel / #4260)
- @uppy/core: fix metafields validation when used as function (Merlijn Vos / #4276)
- @uppy/companion: allow customizing express session prefix (Mikael Finstad / #4249)
- meta: Fix comment about COMPANION_PATH (Collin Allen / #4279)
- @uppy/companion: Fix typo in KUBERNETES.md (Collin Allen / #4277)
- @uppy/locales: update zh_TW.js (5idereal / #4270)
- meta: ci: make sure Yarn's global cache is disabled (Antoine du Hamel / #4268)
- @uppy/aws-s3-multipart: fix metadata shape (Antoine du Hamel / #4267)
- meta: example: add multipart support to `aws-nodejs` (Antoine du Hamel / #4257)
- @uppy/react-native: example: revive React Native example (Giacomo Cerquone / #4164)
- @uppy/utils: Fix getSpeed type (referenced `bytesTotal` instead of `uploadStarted`) (Pascal Wengerter / #4263)
- @uppy/companion: document how to run many instances (Mikael Finstad / #4227)
- @uppy/aws-s3-multipart: add support for `allowedMetaFields` option (Antoine du Hamel / #4215)
- meta: Fix indentation in generate-test.mjs (Youssef Victor / #4181)
- @uppy/react: deprecate `useUppy` (Merlijn Vos / #4223)
- meta: fix typo in README.md (Fuad Herac / #4254)
- meta: Don’t close stale issues automatically (Artur Paikin / #4246)
- meta: upgrade to Vite 4 and ESBuild 0.16 (Antoine du Hamel / #4243)
- @uppy/audio: @uppy/audio fix typo in readme (elliotsayes / #4240)
- @uppy/aws-s3: fix: add https:// to digital oceans link (Le Gia Hoang / #4165)
- website: Simplify Dashboard code sample (Artur Paikin / #4197)
- @uppy/transloadit: introduce `assemblyOptions`, deprecate other options (Merlijn Vos / #4059)
- @uppy/core: fix typo in Uppy.test.js (Ikko Ashimine / #4235)
- @uppy/aws-s3-multipart: fix singPart type (Stefan Schonert / #4224)


## 3.3.1

Released: 2022-11-16

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/angular          |   0.5.1 | @uppy/companion-client |   3.1.1 |
| @uppy/aws-s3-multipart |   3.1.1 | @uppy/utils            |   5.1.1 |
| @uppy/companion        |   4.1.1 | uppy                   |   3.3.1 |

- @uppy/aws-s3-multipart: handle slow connections better (Antoine du Hamel / #4213)
- @uppy/companion-client: treat `*` the same as missing header (Antoine du Hamel / #4221)
- @uppy/utils: fix types (Antoine du Hamel / #4212)
- @uppy/companion: send expire info for non-multipart uploads (Antoine du Hamel / #4214)
- docs: fix `allowedMetaFields` documentation (Antoine du Hamel / #4216)
- meta: add more bundlers for automated testing (Antoine du Hamel / #4100)
- @uppy/aws-s3-multipart: Fix typo in url check (Christian Franke / #4211)
- meta: use current version of packages when testing bundlers (Antoine du Hamel / #4208)
- meta: do not use the set-output command in workflows (Antoine du Hamel / #4175)


## 3.3.0

Released: 2022-11-10

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/angular          |   0.5.0 | @uppy/image-editor     |   2.1.0 |
| @uppy/aws-s3-multipart |   3.1.0 | @uppy/locales          |   3.0.4 |
| @uppy/companion        |   4.1.0 | @uppy/tus              |   3.0.5 |
| @uppy/companion-client |   3.1.0 | @uppy/utils            |   5.1.0 |
| @uppy/dashboard        |   3.2.0 | uppy                   |   3.3.0 |

- @uppy/companion: change default S3 expiry from 300 to 800 seconds (Merlijn Vos / #4206)
- @uppy/dashboard: Single file mode (Artur Paikin / #4188)
- @uppy/locales: Fix UZ locale (Merlijn Vos / #4178)
- @uppy/utils: update typings for `RateLimitedQueue` (Antoine du Hamel / #4204)
- @uppy/aws-s3-multipart: empty the queue when pausing (Antoine du Hamel / #4203)
- @uppy/image-editor: add checkered background (Livia Medeiros / #4194)
- @uppy/aws-s3-multipart: refactor rate limiting approach (Antoine du Hamel / #4187)
- @uppy/companion: send expiry time along side S3 signed requests (Antoine du Hamel / #4202)
- @uppy/companion-client: add support for `AbortSignal` (Antoine du Hamel / #4201)
- @uppy/companion-client: prevent preflight race condition (Mikael Finstad / #4182)
- @uppy/aws-s3-multipart: change limit to 6 (Antoine du Hamel / #4199)
- @uppy/utils: add `cause` support for `AbortError`s (Antoine du Hamel / #4198)
- meta: Fix bad example for setFileState (Tim Whitney / #4191)
- meta: Update code example for getFiles (Tim Whitney / #4189)
- meta: Fix issue with outdated comment. (Tim Whitney / #4192)
- @uppy/aws-s3-multipart: remove unused `timeout` option (Antoine du Hamel / #4186)
- meta: Remove dollar sign from command for easier copy/pasting (Youssef Victor / #4180)
- @uppy/aws-s3-multipart,@uppy/tus: fix `Timed out waiting for socket` (Antoine du Hamel / #4177)
- meta: Add note about facebook approval (Mikael Finstad / #4172)
- meta: add a manual deploy for website (Antoine du Hamel / #4171)


## 3.2.2

Released: 2022-10-24

| Package              | Version | Package              | Version |
| -------------------- | ------- | -------------------- | ------- |
| @uppy/aws-s3         |   3.0.4 | @uppy/tus            |   3.0.4 |
| @uppy/core           |   3.0.4 | @uppy/xhr-upload     |   3.0.4 |
| @uppy/provider-views |   3.0.2 | uppy                 |   3.2.2 |

- @uppy/aws-s3,@uppy/tus,@uppy/xhr-upload: replace `this.getState().files` with `this.uppy.getState().files` (Artur Paikin / #4167)
- @uppy/core: make cancel() and close() arguments optional in types (Merlijn Vos / #4161)
- @uppy/provider-views: Fix button and input inconsistent font and style (Artur Paikin / #4162)


## 3.2.1

Released: 2022-10-19

| Package         | Version | Package         | Version |
| --------------- | ------- | --------------- | ------- |
| @uppy/companion |   4.0.5 | uppy            |   3.2.1 |
| @uppy/locales   |   3.0.3 |                 |         |

- meta: fix CDN deploy (Antoine du Hamel)


## 3.2.0

Released: 2022-10-19

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/angular          |   0.4.3 | @uppy/tus              |   3.0.3 |
| @uppy/aws-s3           |   3.0.3 | @uppy/url              |   3.1.0 |
| @uppy/companion        |   4.0.4 | @uppy/webcam           |   3.2.1 |
| @uppy/core             |   3.0.3 | @uppy/xhr-upload       |   3.0.3 |
| @uppy/golden-retriever |   3.0.2 | uppy                   |   3.2.0 |
| @uppy/locales          |   3.0.2 |                        |         |

- @uppy/webcam: fix bug when Dashboard is using a custom id (Antoine du Hamel / #4099)
- @uppy/url: refactor `UrlUI` (Antoine du Hamel / #4143)
- @uppy/url: trim whitespace around user input (Andrew McIntee / #4143)
- @uppy/core: do not crash if a file is removed before the upload starts (Antoine du Hamel / #4148)
- @uppy/xhr-upload: fix `Timed out waiting for socket` (Antoine du Hamel / #4150)
- @uppy/golden-retriever: Fix retry upload with Golden Retriever (Merlijn Vos / #4155)
- @uppy/aws-s3,@uppy/xhr-upload: fix `Cannot mark a queued request as done` in `MiniXHRUpload` (Antoine du Hamel / #4151)
- meta: add a CI check to validate `yarn.lock` (Antoine du Hamel / #4154)
- meta: fix outdated `yarn.lock` (Antoine du Hamel / #4153)
- meta: fix `transloadit-xhr` dev example (Antoine du Hamel / #4149)
- meta: Add example for Uppy with S3 and a Node.js server (Raúl Ibáñez / #4129)
- @uppy/locales: Fix duplicate keys in UK_UA.js (Murderlon)
- @uppy/companion: add workaround for S3 accelerated endpoints (Mikael Finstad / #4140)
- @uppy/locales: Add missing Ukrainian locale entries (Andrii Bodnar / #4145)
- @uppy/angular: remove unnecessary `console.log` call (Antoine du Hamel / #4139)
- meta: fix bundlers workflow (Antoine du Hamel / #4144)
- meta: fix default sources (Mikael Finstad / #4134)
- @uppy/locales: Update pl_PL.js (Daniel Kamiński / #4136)
- @uppy/core: Fix Uppy.cancelAll and Uppy.close types (Sven Grunewaldt / #4128)
- @uppy/companion: fix error message (Mikael Finstad / #4125)
- @uppy/xhr-upload: queue requests for socket token for remote files (Daniel Jones / #4123)


## 3.1.1

Released: 2022-09-25

| Package         | Version | Package         | Version |
| --------------- | ------- | --------------- | ------- |
| @uppy/companion |   4.0.3 | uppy            |   3.1.1 |

- meta: Fix Companion release deploy (Antoine du Hamel)


## 3.1.0

Released: 2022-09-25

| Package                   | Version | Package                   | Version |
| ------------------------- | ------- | ------------------------- | ------- |
| @uppy/angular             |   0.4.2 | @uppy/onedrive            |   3.0.1 |
| @uppy/audio               |   1.0.2 | @uppy/progress-bar        |   3.0.1 |
| @uppy/aws-s3              |   3.0.2 | @uppy/provider-views      |   3.0.1 |
| @uppy/aws-s3-multipart    |   3.0.2 | @uppy/react               |   3.0.2 |
| @uppy/box                 |   2.0.1 | @uppy/redux-dev-tools     |   3.0.1 |
| @uppy/companion           |   4.0.2 | @uppy/remote-sources      |   1.0.2 |
| @uppy/companion-client    |   3.0.2 | @uppy/screen-capture      |   3.0.1 |
| @uppy/compressor          |   1.0.1 | @uppy/status-bar          |   3.0.1 |
| @uppy/core                |   3.0.2 | @uppy/store-default       |   3.0.2 |
| @uppy/dashboard           |   3.1.0 | @uppy/store-redux         |   3.0.2 |
| @uppy/drag-drop           |   3.0.1 | @uppy/svelte              |   3.0.1 |
| @uppy/drop-target         |   2.0.1 | @uppy/thumbnail-generator |   3.0.2 |
| @uppy/dropbox             |   3.0.1 | @uppy/transloadit         |   3.0.2 |
| @uppy/facebook            |   3.0.1 | @uppy/tus                 |   3.0.2 |
| @uppy/file-input          |   3.0.1 | @uppy/unsplash            |   3.0.1 |
| @uppy/form                |   3.0.1 | @uppy/url                 |   3.0.1 |
| @uppy/golden-retriever    |   3.0.1 | @uppy/utils               |   5.0.2 |
| @uppy/google-drive        |   3.0.1 | @uppy/vue                 |   1.0.1 |
| @uppy/image-editor        |   2.0.1 | @uppy/webcam              |   3.2.0 |
| @uppy/informer            |   3.0.1 | @uppy/xhr-upload          |   3.0.2 |
| @uppy/instagram           |   3.0.1 | @uppy/zoom                |   2.0.1 |
| @uppy/locales             |   3.0.1 | uppy                      |   3.1.0 |

- meta: Fix companion-deploy-yml (Mikael Finstad)
- website: fix tag for Activity Feed (Livia Medeiros / #4118)
- @uppy/golden-retriever: fix condition to load files from service worker (Merlijn Vos / #4115)
- website: remove references to the deleted `disc.html` page (Antoine du Hamel / #4119)
- @uppy/locales: Create uz_UZ (Ozodbek1405 / #4114)
- @uppy/golden-retriever: Fix endless webcam re-render with Golden Retriever (Merlijn Vos / #4111)
- @uppy/image-editor: image-editor: fix controls in small Dashboard (Livia Medeiros / #4113)
- website: add “what is Uppy” to the blog post (Artur Paikin)
- meta: fix Companion deploy (Antoine du Hamel / #4095)
- @uppy/dashboard: add dashboard:show-panel event (Jon-Pierre Sanchez / #4108)
- website: Small post fixes (Artur Paikin)
- @uppy/companion: Companion throttle progress by time (Mikael Finstad / #4101)
- meta: skip a few more unnecessary CI runs (Antoine du Hamel / #4106)
- meta: resolve e2e flakiness (Merlijn Vos / #4077)
- meta: run linters on almost every PRs (Antoine du Hamel / #4105)
- website: 3.0 blog post tweaks (Merlijn Vos / #4104)
- meta: Fix linter warnings in 3.0 post (Murderlon)
- website: Add 3.0 blog post (Artur Paikin / #4046)
- website: fix ESM import in example (Livia Medeiros / #4103)
- doc: Update "Dashboard typo" (Laban / #4096)
- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)
- meta: ci: add GHA to tryout bundling Uppy with popular bundlers (Antoine du Hamel / #4084)
- @uppy/core: Fix `Restrictor` counts ghost files against `maxNumberOfFiles` (Andrew McIntee / #4078)
- uppy: add a decoy `Core` export to warn users about the renaming (Antoine du Hamel / #4085)
- meta: run CI when modifying workflow files (Antoine du Hamel / #4091)
- meta: limit the number of unnecessary CI runs (Antoine du Hamel / #4086)
- meta: Update remote-sources.md (heocoi / #4087)
- uppy: remove all remaining occurrences of `Uppy.Core` (Antoine du Hamel / #4082)
- meta: fix typo in `e2e.yml` (Antoine du Hamel)
- meta: Restrict e2e CI runs (Merlijn Vos / #4075)
- @uppy/webcam: Set default videoConstraints (Artur Paikin / #4070)
- @uppy/angular: Fix angular build error (Murderlon)
- website: add `Known issues` section on Migration Guide (Antoine du Hamel / #4066)
- @uppy/core: fix types (Antoine du Hamel / #4072)
- doc: remove use of deprecated `metaFields` option (Antoine du Hamel / #4073)


## 3.0.1

Released: 2022-08-30

| Package                   | Version | Package                   | Version |
| ------------------------- | ------- | ------------------------- | ------- |
| @uppy/angular             |   0.4.1 | @uppy/store-default       |   3.0.1 |
| @uppy/audio               |   1.0.1 | @uppy/store-redux         |   3.0.1 |
| @uppy/aws-s3              |   3.0.1 | @uppy/svelte              |   3.0.0 |
| @uppy/aws-s3-multipart    |   3.0.1 | @uppy/thumbnail-generator |   3.0.1 |
| @uppy/companion           |   4.0.1 | @uppy/transloadit         |   3.0.1 |
| @uppy/companion-client    |   3.0.1 | @uppy/tus                 |   3.0.1 |
| @uppy/core                |   3.0.1 | @uppy/utils               |   5.0.1 |
| @uppy/dashboard           |   3.0.1 | @uppy/webcam              |   3.1.0 |
| @uppy/react               |   3.0.1 | @uppy/xhr-upload          |   3.0.1 |
| @uppy/remote-sources      |   1.0.1 | uppy                      |   3.0.1 |

- @uppy/dashboard,@uppy/webcam: add nativeCameraFacingMode to Webcam and Dashboard (Artur Paikin / #4047)
- meta: upgrade to Jest 29 (Antoine du Hamel / #4049)
- @uppy/svelte: update peer dependencies (Antoine du Hamel / #4065)
- @uppy/react: useUppy: fix unmount on NextJS dev mode (Matt Jesuele / #4062)
- @uppy/vue: fix missing component in docs (Antoine du Hamel / #4063)
- @uppy/angular: fix compiler warning (Antoine du Hamel / #4064)
- meta: improve CI npm install time (Antoine du Hamel / #4058)
- meta: example: fix Angular example package name (Antoine du Hamel / #4060)
- meta: upgrade to TypeScript 4.8 (Antoine du Hamel / #4048)
- @uppy/core,@uppy/dashboard,@uppy/thumbnail-generator: update definition type files for TS 4.8 compatibility (Antoine du Hamel / #4055)
- @uppy/transloadit: improve deprecation notice (Antoine du Hamel / #4056)
- @uppy/thumbnail-generator: fix `exifr` import (Antoine du Hamel / #4054)
- @uppy/utils: fix `relativePath` when drag&dropping a folder (Antoine du Hamel / #4043)
- @uppy/companion: Fix Companion license (Merlijn Vos / #4044)
- e2e: add tests for AWS (Antoine du Hamel / #3665)
- meta: Only publish Companion to Dockerhub on release (Merlijn Vos / #4037)
- meta: fix linter warnings (Antoine du Hamel / #4039)
- @uppy/utils: Post-release website fixes (Merlijn Vos / #4038)
- @uppy/angular: fix peer dependencies (Antoine du Hamel / #4035)
- meta: uppy.io homepage: Add Tus (Artur Paikin)
- meta: Fix uppy.io homepage example (Artur Paikin)


## 3.0.0

Released: 2022-08-22

**Migration guides:**
https://uppy.io/docs/migration-guides.html

| Package                   | Version | Package                   | Version |
| ------------------------- | ------- | ------------------------- | ------- |
| @uppy/angular             |   0.4.0 | @uppy/progress-bar        |   3.0.0 |
| @uppy/audio               |   1.0.0 | @uppy/provider-views      |   3.0.0 |
| @uppy/aws-s3              |   3.0.0 | @uppy/react               |   3.0.0 |
| @uppy/aws-s3-multipart    |   3.0.0 | @uppy/react-native        |   0.4.0 |
| @uppy/box                 |   2.0.0 | @uppy/redux-dev-tools     |   3.0.0 |
| @uppy/companion           |   4.0.0 | @uppy/remote-sources      |   1.0.0 |
| @uppy/companion-client    |   3.0.0 | @uppy/screen-capture      |   3.0.0 |
| @uppy/compressor          |   1.0.0 | @uppy/status-bar          |   3.0.0 |
| @uppy/core                |   3.0.0 | @uppy/store-default       |   3.0.0 |
| @uppy/dashboard           |   3.0.0 | @uppy/store-redux         |   3.0.0 |
| @uppy/drag-drop           |   3.0.0 | @uppy/svelte              |   2.0.0 |
| @uppy/drop-target         |   2.0.0 | @uppy/thumbnail-generator |   3.0.0 |
| @uppy/dropbox             |   3.0.0 | @uppy/transloadit         |   3.0.0 |
| @uppy/facebook            |   3.0.0 | @uppy/tus                 |   3.0.0 |
| @uppy/file-input          |   3.0.0 | @uppy/unsplash            |   3.0.0 |
| @uppy/form                |   3.0.0 | @uppy/url                 |   3.0.0 |
| @uppy/golden-retriever    |   3.0.0 | @uppy/utils               |   5.0.0 |
| @uppy/google-drive        |   3.0.0 | @uppy/vue                 |   1.0.0 |
| @uppy/image-editor        |   2.0.0 | @uppy/webcam              |   3.0.0 |
| @uppy/informer            |   3.0.0 | @uppy/xhr-upload          |   3.0.0 |
| @uppy/instagram           |   3.0.0 | @uppy/zoom                |   2.0.0 |
| @uppy/locales             |   3.0.0 | uppy                      |   3.0.0 |
| @uppy/onedrive            |   3.0.0 |                           |         |

- docs: Use RemoteSources in readme example (Artur Paikin / #4030)
- docs: Add migration guide for Uppy 3.x, Companion 4.x, and Robodog (Merlijn Vos / #3913)
- example: upgrade React example to use React 18 (Antoine du Hamel / #4002)
- meta: fix linter failures (Antoine du Hamel / #4029)
- @uppy/vue: move `@uppy/` packages to peer dependencies (Antoine du Hamel / #4024)
- @uppy/robodog: remove package (Antoine du Hamel / #3946)
- example: migrate `digitalocean-spaces` to ESM (Antoine du Hamel / #4015)
- example: replace Robodog example with Transloadit + RemoteSources + Form (Antoine du Hamel / #4027)
- website: replace Robodog example with Uppy plugins (Artur Paikin / #4026)
- @uppy/aws-s3,@uppy/tus,@uppy/xhr-upload: @uppy/tus, @uppy/xhr-upload, @uppy/aws-s3: `metaFields` -> `allowedMetaFields` (Merlijn Vos / #4023)
- example: showcase migration out of Robodog (Antoine du Hamel / #4021)
- example: fix Svelte dev mode (Antoine du Hamel / #4025)
- example: fix docs and env for Vite examples (Antoine du Hamel / #4018)
- @uppy/tus: avoid crashing when Tus client reports an error (Antoine du Hamel / #4019)
- @uppy/react: move `@uppy/` packages to peer dependencies (Antoine du Hamel / #4004)
- @uppy/core: core: uppy.addFile should accept browser File objects (Artur Paikin / #4020)
- example: fix svelte example (Antoine du Hamel / #4017)
- example: migrate `python-xhr` to ESM (Antoine du Hamel / #4010)
- example: migrate `php-xhr` to ESM (Antoine du Hamel / #4009)
- example: migrate `node-xhr` to ESM (Antoine du Hamel / #4008)
- example: migrate `xhr-bundle` to ESM (Antoine du Hamel / #4012)
- example: migrate `multiple-instances` to ESM (Antoine du Hamel / #4007)
- example: replace `transloadit-textarea` with `transloadit-markdown-bin` (Antoine du Hamel / #4013)
- example: add README to Svelte example (Antoine du Hamel / #4011)
- build: Remove size-limit for now (Artur Paikin / #4003)
- @uppy/core,@uppy/dashboard,@uppy/status-bar: Style tweaks: use all: initial + other resets (Artur Paikin / #3983)
- @uppy/aws-s3: aws-s3: fix incorrect comparison for `file-removed` (Merlijn Vos / #3962)
- example: update to new CDN export names (Antoine du Hamel / #4006)
- example: fix dependencies of `bundled` example (Antoine du Hamel / #4005)
- @uppy/tus: fix dependencies (Antoine du Hamel / #3923)
- @uppy/tus: add file argument to `onBeforeRequest` (Merlijn Vos / #3984)
- @uppy/utils: fix drop of multiple files on Chromium browsers (Antoine du Hamel / #3998)
- @uppy/angular: upgrade to Angular 14 (Antoine du Hamel / #3997)
- example: update Angular example to v14 (Antoine du Hamel / #3996)
- @uppy/utils: Fix @uppy/utils microtip.scss export (Merlijn Vos / #3995)
- docs: Companion: make streaming upload recommended & other docs tweaks (Mikael Finstad / #3994)

### 3.0.0-beta.5

Released: 2022-08-16

- meta: prepare release workflow for beta versions (Antoine du Hamel)
- @uppy/provider-views: Reset filter input correctly in provider views (Merlijn Vos / #3978)
- @uppy/aws-s3-multipart: Fix when using Companion (Merlijn Vos / #3969)
- @uppy/companion: Companion: bring back default upload protocol (Mikael Finstad / #3967)
- meta: Update CONTRIBUTING.md (Mikael Finstad / #3966)
- meta: fix contributing link (Mikael Finstad / #3968)
- @uppy/companion: enforce usage of uploadUrls (Mikael Finstad / #3965)
- @uppy/utils: Fix webp mimetype (Merlijn Vos / #3961)
- @uppy/locales: Add compressor string translation to Japanese locale (kenken / #3963)
- meta: Fix statement about cropping images in README.md (Mikael Finstad / #3964)
- @uppy/aws-s3-multipart: Fix race condition in `#uploadParts` (Morgan Zolob / #3955)
- @uppy/provider-views: core validateRestrictions: return error directly vs the result/reason obj (Artur Paikin / #3951)
- @uppy/aws-s3: Export AwsS3UploadParameters & AwsS3Options interfaces (Antonina Vertsinskaya / #3956)
- website: convert all website examples to ESM (Antoine du Hamel / #3957)
- @uppy/companion: fix crash if redis disconnects (Mikael Finstad / #3954)
- @uppy/companion: upgrade `ws` version (Antoine du Hamel / #3949)
- @uppy/companion: sort Dropbox response & refactor to async/await (Mikael Finstad / #3897)
- @uppy/utils: modernize `getDroppedFiles` (Antoine du Hamel / #3534)
- @uppy/companion: fix default getKey for non-standalone too (Mikael Finstad / #3945)
- @uppy/aws-s3-multipart: ignore exception inside `abortMultipartUpload` (Antoine du Hamel / #3950)
- @uppy/companion: remove `isobject` from dependencies (Antoine du Hamel / #3948)
- @uppy/compressor: Fix Compressor being broken when no name is in the compressed blob (Artur Paikin / #3947)
- @uppy/core,@uppy/react: Fix all breaking todo comments for 3.0 (Merlijn Vos / #3907)
- @uppy/companion: show deprecation message when using legacy s3 options (Antoine du Hamel / #3944)
- example: fix aws-companion example (Antoine du Hamel / #3850)

### 3.0.0-beta.4

Released: 2022-08-03

- @uppy/companion,@uppy/tus: Upgrade tus-js-client to 3.0.0 (Merlijn Vos / #3942)
- meta: fix release script (Antoine du Hamel)
- @uppy/aws-s3-multipart: Correctly handle errors for `prepareUploadParts` (Merlijn Vos / #3912)
- @uppy/store-default: export the class, don't expose `.callbacks` (Antoine du Hamel / #3928)
- @uppy/remote-sources: do not rely on `.name` property (Antoine du Hamel / #3941)
- @uppy/screen-capture: fix TODOs (Antoine du Hamel / #3930)
- @uppy/status-bar: rename internal modules (Antoine du Hamel / #3929)
- @uppy/transloadit: remove static properties in favor of exports (Antoine du Hamel / #3927)
- @uppy/informer: simplify `render` method (Antoine du Hamel / #3931)
- @uppy/url: remove private methods from public API (Antoine du Hamel / #3934)
- @uppy/dashboard: change `copyToClipboard` signature (Antoine du Hamel / #3933)
- @uppy/drop-target: remove `isFileTransfer` from the public API (Antoine du Hamel / #3932)
- meta: improve beta release script (Antoine du Hamel)

### 3.0.0-beta.3

Released: 2022-07-27

- @uppy/react: Fix exports in propTypes.js to fix website build (Murderlon)
- @uppy/dashboard,@uppy/webcam: Add support for `mobileNativeCamera` option to Webcam and Dashboard (Artur Paikin / #3844)
- @uppy/aws-s3-multipart: make `headers` part indexed too in `prepareUploadParts` (Merlijn Vos / #3895)
- @uppy/aws-s3,@uppy/core,@uppy/dashboard,@uppy/store-redux,@uppy/xhr-upload: upgrade `nanoid` to v4 (Antoine du Hamel / #3904)
- @uppy/companion: update minimal supported Node.js version in the docs (Antoine du Hamel / #3902)
- @uppy/companion: upgrade `redis` to version 4.x (Antoine du Hamel / #3589)
- @uppy/companion: remove unnecessary ts-ignores (Mikael Finstad / #3900)
- meta: use `node:` protocol when using Node.js built-in core modules (Antoine du Hamel / #3871)
- meta: upgrade to Vite v3 (Antoine du Hamel / #3882)
- @uppy/companion: remove `COMPANION_S3_GETKEY_SAFE_BEHAVIOR` env variable (Antoine du Hamel / #3869)
- meta: fix release script for major beta versions (Antoine du Hamel)

### 3.0.0-beta.2

Released: 2022-07-06

- example: fix `custom-provider` example (Antoine du Hamel / #3854)
- example: fix Vue3 example (Antoine du Hamel / #3774)
- @uppy/companion: remove deprecated duplicated metrics (Mikael Finstad / #3833)
- example: update CDN example (Antoine du Hamel / #3803)
- @uppy/companion: Companion 3 default to no s3 acl (Mikael Finstad / #3826)
- @uppy/companion: rewrite companion.app() to return an object (Mikael Finstad / #3827)
- @uppy/companion: remove companion provider compat api (Mikael Finstad / #3828)
- @uppy/companion: rewrite code for node >=14 (Mikael Finstad / #3829)
- @uppy/companion: remove chunkSize backwards compatibility (Mikael Finstad / #3830)
- @uppy/companion: Companion: make `emitSuccess` and `emitError` private (Mikael Finstad / #3832)
- @uppy/companion: do not use a default upload protocol (Mikael Finstad / #3834)

### 3.0.0-beta.1

Released: 2022-06-09

- meta: improve release process for beta branch (Antoine du Hamel / #3809)
- uppy: refactor to ESM (Antoine du Hamel / #3807)
- @uppy/core,@uppy/dashboard: fix types for some events (Antoine du Hamel / #3812)
- example: update Vue2 example (Antoine du Hamel / #3802)

### 3.0.0-beta

Released: 2022-05-30

- meta: temporary adjust release script for the beta (Antoine du Hamel)
- meta: disable ESM to CJS transform in dist files (Antoine du Hamel / #3773)
- @uppy/companion: remove `searchProviders` wrapper & move `s3` options (Merlijn Vos / #3781)
- meta: do not test on EOL versions of Node.js (Antoine du Hamel / #3786)
- @uppy/companion: remove support for EOL versions of Node.js (Antoine du Hamel / #3784)
- @uppy/react: refactor to ESM (Antoine du Hamel / #3780)
- @uppy/transloadit: remove IE 10 hack (Antoine du Hamel / #3777)

## 2.13.2

Released: 2022-08-02

| Package           | Version | Package           | Version |
| ----------------- | ------- | ----------------- | ------- |
| @uppy/transloadit |   2.3.6 | @uppy/robodog     |   2.9.2 |
| @uppy/tus         |   2.4.2 | uppy              |  2.13.2 |

- @uppy/transloadit: send `assembly-cancelled` only once (Antoine du Hamel / #3937)
- meta: `keepNames` in bundle (Antoine du Hamel / #3926)
- meta: e2e: fix Transloadit test suite with Cypress 10 (Antoine du Hamel / #3936)
- meta: Bump guzzlehttp/guzzle from 7.4.1 to 7.4.5 in /examples/aws-php (dependabot[bot] / #3842)
- @uppy/tus: fix dependencies (Antoine du Hamel / #3923)
- meta: doc: fix linter failure in `image-editor.md` (Antoine du Hamel / #3924)
- meta: doc: Fix typo in image-editor.md (Ikko Ashimine / #3921)
- website: Docs and header fix (Artur Paikin / #3920)


## 2.13.1

Released: 2022-07-27

| Package              | Version | Package              | Version |
| -------------------- | ------- | -------------------- | ------- |
| @uppy/companion      |   3.7.1 | @uppy/remote-sources |   0.1.1 |
| @uppy/compressor     |   0.3.1 | @uppy/transloadit    |   2.3.5 |
| @uppy/core           |   2.3.2 | @uppy/robodog        |   2.9.1 |
| @uppy/dashboard      |   2.4.1 | uppy                 |  2.13.1 |
| @uppy/image-editor   |   1.4.1 |                      |         |

- @uppy/compressor: fix upload causing meta name to reset (Justin / #3890)
- @uppy/transloadit: cancel assemblies when all its files have been removed (Antoine du Hamel / #3893)
- e2e: Add retries for flaky e2e test (Merlijn Vos / #3915)
- @uppy/dashboard,@uppy/image-editor,@uppy/remote-sources: Fix `uppy.close()` crashes when remote-sources or image-editor is installed (Merlijn Vos / #3914)
- @uppy/core: Add missing type for retry-all event (Luc Boissaye / #3901)
- @uppy/companion: Companion app type (Mikael Finstad / #3899)
- e2e: upgrade to Cypress 10 (Antoine du Hamel / #3896)
- meta: Fix website build (Murderlon)
- meta: Create new issue templates (Merlijn Vos / #3879)


## 2.13.0

Released: 2022-07-18

| Package            | Version | Package            | Version |
| ------------------ | ------- | ------------------ | ------- |
| @uppy/dashboard    |   2.4.0 | @uppy/robodog      |   2.9.0 |
| @uppy/image-editor |   1.4.0 | uppy               |  2.13.0 |
| @uppy/transloadit  |   2.3.4 |                    |         |

- @uppy/transloadit: fix outdated file ids and incorrect usage of files (Merlijn Vos / #3886)
- @uppy/image-editor: remove beta notice (Merlijn Vos / #3877)
- meta: Fix broken links in _posts/2019-08-1.3.md (YukeshShr / #3884)
- meta: Fix broken link in _posts/2017-03-0.15.md (YukeshShr / #3883)
- @uppy/image-editor: Add image editor cancel event (James R T / #3875)


## 2.12.3

Released: 2022-07-11

| Package           | Version | Package           | Version |
| ----------------- | ------- | ----------------- | ------- |
| @uppy/transloadit |   2.3.3 | uppy              |  2.12.3 |
| @uppy/robodog     |   2.8.3 |                   |         |

- @uppy/transloadit: fix TypeError when file is cancelled asynchronously (Antoine du Hamel / #3872)
- @uppy/robodog,@uppy/transloadit: use modern syntax to simplify code (Antoine du Hamel / #3873)
- meta: fix `release-beta` automation (Antoine du Hamel)


## 2.12.2

Released: 2022-07-06

| Package              | Version | Package              | Version |
| -------------------- | ------- | -------------------- | ------- |
| @uppy/companion      |   3.7.0 | @uppy/transloadit    |   2.3.2 |
| @uppy/locales        |   2.1.1 | @uppy/robodog        |   2.8.2 |
| @uppy/provider-views |   2.1.2 | uppy                 |  2.12.2 |

- @uppy/provider-views: improve logging (Mikael Finstad / #3638)
- docs: de-dupe companion dev docs (Mikael Finstad / #3852)
- @uppy/companion: Getkey safe behavior (Mikael Finstad / #3592)
- website: fix broken links (YukeshShr / #3861)
- @uppy/companion: doc: fix Google Drive example (Antoine du Hamel / #3855)
- @uppy/locales,@uppy/transloadit: Fix undefined error in in onTusError (Merlijn Vos / #3848)
- @uppy/companion: build an ARM64 container (Stuart Auld / #3841)
- @uppy/locales: Add missing translations and reorder nl_NL locale (Kasper Meinema / #3839)
- docs: Fix typo in aws-s3-multipart.md (Ikko Ashimine / #3838)
- meta: do not rebase when preparing beta candidates (Antoine du Hamel)
- meta: fix hard-coded branch name in release script (Antoine du Hamel)


## 2.12.1

Released: 2022-06-09

| Package           | Version | Package           | Version |
| ----------------- | ------- | ----------------- | ------- |
| @uppy/transloadit |   2.3.1 | uppy              |  2.12.1 |
| @uppy/robodog     |   2.8.1 |                   |         |

- @uppy/transloadit: fix `COMPANION_PATTERN` export (Antoine du Hamel / #3820)
- meta: fix URL generation in the release script (Antoine du Hamel)


## 2.12.0

Released: 2022-06-07

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/aws-s3           |   2.2.1 | @uppy/tus              |   2.4.1 |
| @uppy/aws-s3-multipart |   2.4.1 | @uppy/url              |   2.2.0 |
| @uppy/companion-client |   2.2.1 | @uppy/xhr-upload       |   2.1.2 |
| @uppy/core             |   2.3.1 | @uppy/robodog          |   2.8.0 |
| @uppy/react            |   2.2.2 | uppy                   |  2.12.0 |
| @uppy/remote-sources   |   0.1.0 |                        |         |

- @uppy/remote-sources: Add @uppy/remote-sources preset/plugin (Artur Paikin / #3676)
- @uppy/react: Reset uppy instance when React component is unmounted (Tomasz Pęksa / #3814)
- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/tus: queue socket token requests for remote files (Merlijn Vos / #3797)
- @uppy/xhr-upload: replace `ev.target.status` with `xhr.status` (Wes Sankey / #3782)
- @uppy/core: fix `TypeError` when file was deleted (Antoine du Hamel / #3811)
- @uppy/robodog: fix linter warnings (Antoine du Hamel / #3808)
- meta: fix GHA workflow for prereleases (Antoine du Hamel)
- @uppy/aws-s3-multipart: allow `companionHeaders` to be modified with `setOptions` (Paulo Lemos Neto / #3770)
- @uppy/url: enable passing optional meta data to `addFile` (Brad Edelman / #3788)
- @uppy/url: fix `getFileNameFromUrl` (Brad Edelman / #3804)
- @uppy/tus: make onShouldRetry type optional (Merlijn Vos / #3800)
- doc: fix React examples (Antoine du Hamel / #3799)
- meta: add GHA workflow for prereleases (Antoine du Hamel)


## 2.11.0

Released: 2022-05-30

| Package                   | Version | Package                   | Version |
| ------------------------- | ------- | ------------------------- | ------- |
| @uppy/angular             |   0.3.1 | @uppy/progress-bar        |   2.1.1 |
| @uppy/audio               |   0.3.2 | @uppy/provider-views      |   2.1.1 |
| @uppy/aws-s3              |   2.2.0 | @uppy/react               |   2.2.1 |
| @uppy/aws-s3-multipart    |   2.4.0 | @uppy/react-native        |   0.3.1 |
| @uppy/box                 |   1.0.7 | @uppy/redux-dev-tools     |   2.1.0 |
| @uppy/companion           |   3.6.0 | @uppy/screen-capture      |   2.1.1 |
| @uppy/companion-client    |   2.2.0 | @uppy/status-bar          |   2.2.1 |
| @uppy/compressor          |   0.3.0 | @uppy/store-default       |   2.1.0 |
| @uppy/core                |   2.3.0 | @uppy/store-redux         |   2.1.0 |
| @uppy/dashboard           |   2.3.0 | @uppy/thumbnail-generator |   2.2.0 |
| @uppy/drag-drop           |   2.1.1 | @uppy/transloadit         |   2.3.0 |
| @uppy/dropbox             |   2.0.7 | @uppy/tus                 |   2.4.0 |
| @uppy/facebook            |   2.0.7 | @uppy/unsplash            |   2.1.0 |
| @uppy/file-input          |   2.1.1 | @uppy/url                 |   2.1.1 |
| @uppy/form                |   2.0.6 | @uppy/utils               |   4.1.0 |
| @uppy/golden-retriever    |   2.1.0 | @uppy/vue                 |   0.4.8 |
| @uppy/google-drive        |   2.1.1 | @uppy/webcam              |   2.2.1 |
| @uppy/image-editor        |   1.3.0 | @uppy/xhr-upload          |   2.1.1 |
| @uppy/informer            |   2.1.0 | @uppy/zoom                |   1.1.1 |
| @uppy/instagram           |   2.1.1 | @uppy/robodog             |   2.7.0 |
| @uppy/onedrive            |   2.1.1 | uppy                      |  2.11.0 |

- doc: update bundler recommendation (Antoine du Hamel / #3763)
- @uppy/aws-s3-multipart: refactor to ESM (Antoine du Hamel / #3672)
- @uppy/aws-s3: fix JSDoc type error (Antoine du Hamel / #3785)
- @uppy/aws-s3: refactor to ESM (Antoine du Hamel / #3673)
- @uppy/companion-client: Revert "Revert "@uppy/companion-client: refactor to ESM"" (Antoine du Hamel / #3730)
- @uppy/companion: expire redis keys after 1 day (Mikael Finstad / #3771)
- @uppy/companion: fix some linter warnings (Antoine du Hamel / #3752)
- @uppy/compressor: Fix Compressor docs, pass files array to compressor:complete event (Artur Paikin / #3682)
- @uppy/core: refactor to ESM (Antoine du Hamel / #3744)
- @uppy/dashboard: refactor to ESM (Antoine du Hamel / #3701)
- @uppy/dashboard: use webkitRelativePath when querying a file's relative path (Eduard Müller / taktik / #3766)
- @uppy/golden-retriever: refactor to ESM (Antoine du Hamel / #3731)
- @uppy/image-editor: remove CJS-interop hack in the source code (Antoine du Hamel / #3778)
- @uppy/informer: @uppy/Informer: refactor to ESM (Antoine du Hamel / #3732)
- @uppy/informer: remove remaining `require` call (Antoine du Hamel / #3737)
- @uppy/provider-views: Add onKeyPress event handler to capture e.shiftKey, unavailable in onChange (Artur Paikin / #3768)
- @uppy/redux-dev-tools: refactor to ESM (Antoine du Hamel / #3733)
- @uppy/screen-capture: don't install when unsupported (Artur Paikin / #3795)
- @uppy/store-default: refactor to ESM (Antoine du Hamel / #3746)
- @uppy/store-redux: refactor to ESM (Antoine du Hamel / #3745)
- @uppy/thumbnail-generator: refactor to ESM (Antoine du Hamel / #3734)
- @uppy/transloadit: refactor to ESM (Antoine du Hamel / #3725)
- @uppy/transloadit: transloadit: propagate error details when creating Assembly fails (Renée Kooi / #3794)
- @uppy/tus: Add `onShouldRetry` as option to @uppy/tus (Merlijn Vos / #3720)
- @uppy/tus: fix broken import (Antoine du Hamel / #3729)
- @uppy/tus: fixup! @uppy/tus: wait for user promise on beforeRequest (Antoine du Hamel / #3712)
- @uppy/tus: wait for user promise on beforeRequest (Antoine du Hamel / #3712)
- @uppy/unsplash: refactor to ESM (Antoine du Hamel / #3728)
- @uppy/utils: refactor to ESM (Antoine du Hamel / #3721)
- dev: fix dev env Vite's config (Antoine du Hamel)
- dev: fix return type of generateSignatureIfSecret (Renée Kooi / #3793)
- dev: remove `vite-plugin-jsx-commonjs` plugin on dev env (Antoine du Hamel / #3749)
- dev: remove CJS-related hack in `build:locale-pack` script (Antoine du Hamel / #3764)
- meta: e2e: run CI on PRs that modify the workflow file (Antoine du Hamel / #3740)
- meta: fix linter warnings (Antoine du Hamel / #3753)
- meta: fix more linter warnings (Antoine du Hamel / #3757)
- meta: resolve warnings in `.d.ts` files (Antoine du Hamel / #3754)
- meta: uppy: add Zoom plugin to the bundle and fix ESM exports (Antoine du Hamel / #3747)
- test: Apply bin/update-yarn.sh (Merlijn Vos / #3775)
- test: fix e2e dependency conflict (Merlijn Vos / #3779)
- test: fixup! e2e: run CI on PRs that modify the workflow file (Antoine du Hamel / #3740)
- test: prepare internal script files for lint rune hardening (Antoine du Hamel / #3760)
- test: prepare test files for lint rule hardening (Antoine du Hamel / #3761)
- test: Setup Cypress Dashboard (Merlijn Vos / #3691)
- test: split Companion CI between Node.js legacy and supported versions (Antoine du Hamel / #3776)
- website: disable linter warnings (Antoine du Hamel / #3759)


## 2.10.0

Released: 2022-05-14

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/audio            |   0.3.1 | @uppy/provider-views   |   2.1.0 |
| @uppy/aws-s3           |   2.1.0 | @uppy/react            |   2.2.0 |
| @uppy/aws-s3-multipart |   2.3.0 | @uppy/react-native     |   0.3.0 |
| @uppy/companion-client |   2.1.0 | @uppy/screen-capture   |   2.1.0 |
| @uppy/core             |   2.2.0 | @uppy/status-bar       |   2.2.0 |
| @uppy/dashboard        |   2.2.0 | @uppy/svelte           |   1.0.8 |
| @uppy/drag-drop        |   2.1.0 | @uppy/transloadit      |   2.2.0 |
| @uppy/file-input       |   2.1.0 | @uppy/tus              |   2.3.0 |
| @uppy/google-drive     |   2.1.0 | @uppy/url              |   2.1.0 |
| @uppy/image-editor     |   1.2.0 | @uppy/webcam           |   2.2.0 |
| @uppy/instagram        |   2.1.0 | @uppy/xhr-upload       |   2.1.0 |
| @uppy/locales          |   2.1.0 | @uppy/zoom             |   1.1.0 |
| @uppy/onedrive         |   2.1.0 | @uppy/robodog          |   2.6.0 |
| @uppy/progress-bar     |   2.1.0 | uppy                   |  2.10.0 |

- @uppy/audio: fix types (Merlijn Vos / #3689)
- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/core,@uppy/react,@uppy/transloadit,@uppy/tus,@uppy/xhr-upload: proposal: Cancel assemblies optional (Mikael Finstad / #3575)
- @uppy/aws-s3-multipart: export interface AwsS3MultipartOptions (Matteo Padovano / #3709)
- @uppy/companion-client: refactor to ESM (Antoine du Hamel / #3693)
- @uppy/companion: Only deploy on companion changes (kiloreux / #3677)
- @uppy/core: add definition for addFiles method (Matteo Padovano / #3556)
- @uppy/core: wrap plugins in div.uppy-Root and set dir attrubute in UIPlugin (Artur Paikin / #3692)
- @uppy/google-drive: refactor to ESM (Antoine du Hamel / #3683)
- @uppy/image-editor: refactor to ESM (Antoine du Hamel / #3685)
- @uppy/instagram: refactor to ESM (Antoine du Hamel / #3696)
- @uppy/locales: Add `save` translation to Spanish locale (Juan Carlos Alonso / #3678)
- @uppy/locales: refactor to ESM (Antoine du Hamel / #3707)
- @uppy/onedrive: refactor to ESM (Antoine du Hamel / #3694)
- @uppy/progress-bar: refactor to ESM (Antoine du Hamel / #3706)
- @uppy/provider-views: refactor to ESM (Antoine du Hamel / #3715)
- @uppy/react: Support React 18 in @uppy/react (Merlijn Vos / #3680)
- @uppy/screen-capture: refactor to ESM (Antoine du Hamel / #3698)
- @uppy/status-bar: refactor to ESM (Antoine du Hamel / #3697)
- @uppy/transloadit: add rate limiting for assembly creation and status polling (Antoine du Hamel / #3718)
- @uppy/tus: refactor to ESM (Antoine du Hamel / #3724)
- @uppy/url: refactor to ESM (Antoine du Hamel / #3713)
- @uppy/webcam: refactor to ESM (Antoine du Hamel / #3686)
- @uppy/xhr-upload: refactor to ESM (Antoine du Hamel / #3695)
- @uppy/zoom: refactor to ESM (Antoine du Hamel / #3699)
- meta: e2e: fix failing test (Antoine du Hamel / #3722)
- test: harden linter rule for JSX/ESM validation (Antoine du Hamel / #3681)
- test: harden linter rules for ESM/CJS validation (Antoine du Hamel / #3674)
- test: Increase retries to trigger longer retryDelay in tus (Artur Paikin / #3726)
- test: Remove `it.only` from e2e test (Merlijn Vos / #3690)
- tests: Make Cypress more stable & add e2e test for error events when upload fails (Merlijn Vos / #3662)


## 2.9.5

Released: 2022-04-27

| Package         | Version | Package         | Version |
| --------------- | ------- | --------------- | ------- |
| @uppy/companion |   3.5.2 | @uppy/robodog   |   2.5.5 |
| @uppy/core      |  2.1.10 | uppy            |   2.9.5 |

- @uppy/companion: Bump moment from 2.29.1 to 2.29.2 (dependabot[bot] / #3635)
- @uppy/core: fix `TypeError` when file was removed (Antoine du Hamel / #3670)


## 2.9.4

Released: 2022-04-27

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/aws-s3-multipart |   2.2.2 | @uppy/file-input       |   2.0.6 |
| @uppy/box              |   1.0.6 | @uppy/form             |   2.0.5 |
| @uppy/companion        |   3.5.1 | @uppy/locales          |   2.0.9 |
| @uppy/compressor       |   0.2.5 | @uppy/transloadit      |   2.1.5 |
| @uppy/core             |   2.1.9 | @uppy/utils            |   4.0.7 |
| @uppy/drag-drop        |   2.0.7 | @uppy/vue              |   0.4.7 |
| @uppy/drop-target      |   1.1.3 | @uppy/robodog          |   2.5.4 |
| @uppy/dropbox          |   2.0.6 | uppy                   |   2.9.4 |
| @uppy/facebook         |   2.0.6 |                        |         |

- @uppy/locales: Plural translation in cs_CZ local (JakubHaladej / #3666)
- @uppy/vue: Add license field to package.json in @uppy/vue (Tobias Trumm / #3664)
- meta: Add todo comments (Murderlon)
- @uppy/facebook: refactor to ESM (Antoine du Hamel / #3653)
- meta: locale-pack: refactor to use more parallel processing (Antoine du Hamel / #3630)
- @uppy/file-input: refactor to ESM (Antoine du Hamel / #3652)
- meta: sign requests sent to Transloadit in e2e suite (Antoine du Hamel / #3656)
- meta: add `VITE_TRANSLOADIT_SECRET` for e2e (Antoine du Hamel)
- meta: Update BACKLOG.md (Artur Paikin)
- @uppy/form: refactor to ESM (Antoine du Hamel / #3654)
- @uppy/dropbox: refactor to ESM (Antoine du Hamel / #3651)
- meta: sign requests sent to Transloadit in dev env (Antoine du Hamel / #3517)
- @uppy/drop-target: refactor to ESM (Antoine du Hamel / #3648)
- @uppy/core: fix `TypeError` when file was removed (Antoine du Hamel / #3650)
- @uppy/drag-drop: refactor to ESM (Antoine du Hamel / #3647)
- meta: update outdated files (Antoine du Hamel / #3646)
- @uppy/compressor: Set meta on file compression (Camilo Forero / #3644)
- @uppy/transloadit: improve fetch error handling (Antoine du Hamel / #3637)
- @uppy/box: refactor to ESM (Antoine du Hamel / #3643)
- @uppy/utils: Fix getFileType for dicom images (Merlijn Vos / #3610)
- @uppy/aws-s3-multipart: Add `companionCookiesRule` type to @uppy/aws-s3-multipart (Mauricio Ribeiro / #3623)


## 2.9.3

Released: 2022-04-07

| Package       | Version | Package       | Version |
| ------------- | ------- | ------------- | ------- |
| @uppy/core    |   2.1.8 | uppy          |   2.9.3 |
| @uppy/robodog |   2.5.3 |               |         |

- @uppy/core: fix TypeError in event handler when file was removed (Antoine du Hamel / #3629)


## 2.9.2

Released: 2022-04-07

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/aws-s3           |   2.0.9 | @uppy/utils            |   4.0.6 |
| @uppy/companion-client |   2.0.6 | @uppy/robodog          |   2.5.2 |
| @uppy/compressor       |   0.2.4 | uppy                   |   2.9.2 |
| @uppy/transloadit      |   2.1.4 |                        |         |

- @uppy/aws-s3,@uppy/companion-client,@uppy/transloadit,@uppy/utils: Propagate `isNetworkError` through error wrappers (Renée Kooi / #3620)
- @uppy/compressor: Merge new name and type into compressed file (Camilo Forero / #3606)


## 2.9.1

Released: 2022-03-29

| Package       | Version | Package       | Version |
| ------------- | ------- | ------------- | ------- |
| @uppy/core    |   2.1.7 | @uppy/robodog |   2.5.1 |
| @uppy/tus     |   2.2.2 | uppy          |   2.9.1 |

- @uppy/tus: fix hasOwn (Mikael Finstad / #3604)
- meta: Increase test timeout for flaky e2e tests (Merlijn Vos / #3603)
- meta: upgrade GHA actions (Antoine du Hamel / #3602)
- @uppy/core: refactor: replace deprecated String.prototype.substr() (CommanderRoot / #3600)


## 2.9.0

Released: 2022-03-24

| Package           | Version | Package           | Version |
| ----------------- | ------- | ----------------- | ------- |
| @uppy/companion   |   3.5.0 | @uppy/webcam      |   2.1.0 |
| @uppy/status-bar  |   2.1.3 | @uppy/robodog     |   2.5.0 |
| @uppy/transloadit |   2.1.2 | uppy              |   2.9.0 |
| @uppy/tus         |   2.2.1 |                   |         |

- @uppy/transloadit: close assembly if upload is cancelled (Antoine du Hamel / #3591)
- @uppy/companion: Companion server upload events (Mikael Finstad / #3544)
- @uppy/tus: fix double requests sent when rate limiting (Antoine du Hamel / #3595)
- website: fix linter error on blog post (Antoine du Hamel / #3596)
- @uppy/companion: fix `yarn test` command (Antoine du Hamel / #3590)
- @uppy/webcam: Mime types in webcam options type (Sobakin Sviatoslav / #3593)
- website: Some polish and a better (?) intro for the recent update post (AJvanLoon / #3588)
- @uppy/companion: Allow setting no ACL (Mikael Finstad / #3577)
- @uppy/companion: Small companion code and doc changes (Mikael Finstad / #3586)
- @uppy/robodog: fix CDN bundle (Antoine du Hamel / #3587)
- website: Fix broken link (YukeshShr / #3581)

## 2.8.0

Released: 2022-03-16

| Package              | Version | Package              | Version |
| -------------------- | ------- | -------------------- | ------- |
| @uppy/audio          |   0.3.0 | @uppy/locales        |   2.0.8 |
| @uppy/aws-s3         |   2.0.8 | @uppy/provider-views |   2.0.8 |
| @uppy/companion      |   3.4.0 | @uppy/vue            |   0.4.6 |
| @uppy/compressor     |   0.2.3 | @uppy/robodog        |   2.4.0 |
| @uppy/core           |   2.1.6 | uppy                 |   2.8.0 |
| @uppy/drop-target    |   1.1.2 |                      |         |

- @uppy/aws-s3: fix wrong events being sent to companion (Mikael Finstad / #3576)
- @uppy/compressor: ignore remote files, calculate savings correctly (Artur Paikin / #3578)
- @uppy/companion: always log errors with stack trace (Mikael Finstad / #3573)
- meta: remove incorrect s3 documentation (Mikael Finstad / #3571)
- @uppy/companion: Companion refactor (Mikael Finstad / #3542)
- website: partial ooops (Artur Paikin)
- meta: run e2e workflow on the head branch instead of the base one (Antoine du Hamel / #3561)
- website: Use Plausible instead of Google Analytics (Artur Paikin / #3567)
- @uppy/vue: enforce use of file extension within the import path (Antoine du Hamel / #3560)
- @uppy/drop-target: ignore if dropped elements aren't files (Penar Musaraj / #3563)
- @uppy/core: Abstract restriction logic in a new Restricter class (Merlijn Vos / #3532)
- @uppy/companion: Fetch all Google Drive shared drives (Robert DiMartino / #3553)
- website: add blog post 2.4-2.7 (Artur Paikin / #3557)
- meta: fix e2e (Antoine du Hamel / #3562)
- meta: fix broken link (YukeshShr / #3559)
- meta: fix support of export declaration in source files (Antoine du Hamel / #3558)
- @uppy/companion: Order Google Drive results by folder to show all folders first (Robert DiMartino / #3546)
- meta: add corsOrigins to docs (Mikael Finstad / #3554)
- @uppy/audio: refactor to ESM (Antoine du Hamel / #3470)
- @uppy/locales: compressor cleanup (Antoine du Hamel / #3531)
- meta: fix CJS interop in Vite config (Antoine du Hamel / #3543)
- @uppy/companion: upgrade node-redis-pubsub (Mikael Finstad / #3541)
- @uppy/provider-views: provider-view: fix breadcrumbs (Artur Paikin / #3535)
- meta: Update BACKLOG.md (Artur Paikin)
- @uppy/locales: Update ru_RU.js (Sobakin Sviatoslav / #3529)
- @uppy/companion: reorder reqToOptions (Antoine du Hamel / #3530)
- meta: Fix yarn caching in github actions (Mikael Finstad / #3526)


## 2.7.0

Released: 2022-03-02

| Package                | Version | Package                | Version |
| ---------------------- | ------- | ---------------------- | ------- |
| @uppy/angular          |   0.3.0 | @uppy/locales          |   2.0.7 |
| @uppy/aws-s3-multipart |   2.2.1 | uppy                   |   2.7.0 |
| @uppy/companion        |   3.3.1 |                        |         |

- @uppy/companion: fix unstable test (Mikael Finstad)
- @uppy/companion: replace debug (Mikael Finstad)
- @uppy/companion: Fix COMPANION_PATH (Mikael Finstad / #3515)
- @uppy/angular: update ng version (Antoine du Hamel / #3503)
- @uppy/companion: Upload protocol "s3-multipart" does not use the chunkSize option (Gabi Ganam / #3511)
- @uppy/aws-s3-multipart: Add chunks back to prepareUploadParts, indexed by partNumber (Kevin West / #3520)
- @uppy/locales: Update zh_CN.js (linxunzyf / #3513)
- meta: update remark dependencies (Antoine du Hamel / #3502)
## 2.6.0

Released: 2022-02-17

| Package         | Version | Package         | Version |
| --------------- | ------- | --------------- | ------- |
| @uppy/companion |   3.3.0 | uppy            |   2.6.0 |
| @uppy/robodog   |   2.3.2 |                 |         |

- meta: warn about not merging PR manually (Artur Paikin / #3492)
- @uppy/companion: fix unpslash author meta, sanitize metadata to strings and improve companion tests (Mikael Finstad / #3478)
- meta: ensure README is correctly formatted when doing releases (Antoine du Hamel / #3499)
- meta: fix CDN bundle (Antoine du Hamel / #3494)
- meta: fix missing EOL and end of e2e test templates (Antoine du Hamel / #3484)
- meta: use a single `.env` file for config (Antoine du Hamel / #3498)
## 2.5.1

Released: 2022-02-16

| Package                   | Version | Package                   | Version |
| ------------------------- | ------- | ------------------------- | ------- |
| @uppy/companion           |   3.2.1 | @uppy/thumbnail-generator |   2.1.1 |
| @uppy/compressor          |   0.2.2 | @uppy/robodog             |   2.3.1 |
| @uppy/onedrive            |   2.0.6 | uppy                      |   2.5.1 |

- meta: Missing comma and wrong attribute name on cors example config (Edgar Santiago / #3465)
- @uppy/onedrive: Update README.md (Márton László Attila / #3489)
- @uppy/compressor: Add image compressor plugin (Artur Paikin / #3471)
- @uppy/companion: fix periodicPingUrls oops (Mikael Finstad / #3490)
- meta: add support for ESM sources in build script (Antoine du Hamel / #3468)
## 2.5.0

Released: 2022-02-14

| Package                   | Version | Package                   | Version |
| ------------------------- | ------- | ------------------------- | ------- |
| @uppy/companion           |   3.2.0 | @uppy/provider-views      |   2.0.7 |
| @uppy/companion-client    |   2.0.5 | @uppy/thumbnail-generator |   2.1.0 |
| @uppy/core                |   2.1.5 | @uppy/robodog             |   2.3.0 |
| @uppy/dashboard           |   2.1.4 | uppy                      |   2.5.0 |
| @uppy/locales             |   2.0.6 |                           |         |

- @uppy/companion: add support for COMPANION_UNSPLASH_SECRET (Mikael Finstad / #3463)
- @uppy/unsplash: fix nested meta (Artur Paikin / #3485)
- meta: fix(docs): typo in property `thumbnailType` (Dan Schalow / #3472)
- @uppy/robodog: add audio, box, unsplash, screen-capture to Robodog (Artur Paikin / #3483)
- meta: consolidate ENV files and fix contributing guidelines (Antoine du Hamel / #3475)
- @uppy/companion-client,@uppy/companion,@uppy/provider-views,@uppy/robodog: Finishing touches on Companion dynamic Oauth (Renée Kooi / #2802)
- meta: Improve companion docs (Mikael Finstad / #3479)
- meta: Make E2E Great Again (Merlijn Vos / #3444)
- meta: Add PostCSS handling to Vite (Artur Paikin / #3467)
- meta: Update CONTRIBUTING.md (Mikael Finstad / #3411)
- @uppy/companion: fix broken thumbnails for box and dropbox (Mikael Finstad / #3460)
- website: fix `Uppy is not defined` error (Antoine du Hamel / #3461)
- @uppy/companion: Implement periodic ping functionality (Mikael Finstad / #3246)
- @uppy/companion: fix callback urls (Mikael Finstad / #3458)
- @uppy/core,@uppy/dashboard,@uppy/thumbnail-generator: Add dashboard and UIPlugin types (Merlijn Vos / #3426)
- @uppy/locales: Add "save" to fr_FR.js (Charly Billaud / #3395)
- @uppy/companion: Fix TypeError when invalid initialization vector (Julian Gruber / #3416)
- meta: Upgrade size-limit to 7.0.5 (Artur Paikin / #3445)
- @uppy/provider-views: Unsplash: UI improvements (Artur Paikin / #3438)
- @uppy/thumbnail-generator: exifr: remove legacy IE support (Artur Paikin / #3382)
- @uppy/companion: Default to HEAD requests when the Companion looks to get meta information about a URL (Zack Bloom / #3417)
- @uppy/dashboard: check if info array is empty (Artur Paikin / #3442)
- meta: dev: fix Vite custom plugin (Antoine du Hamel / #3437)
- website: add legacy bundle to CDN example (Antoine du Hamel / #3433)
- meta: remove unused lerna and npm files (Antoine du Hamel / #3436)
- meta: replace browserify with esbuild (Antoine du Hamel / #3363)
## 2.4.1

Released: 2022-01-12

| Package           | Version | Package           | Version |
| ----------------- | ------- | ----------------- | ------- |
| @uppy/transloadit |   2.1.1 | uppy              |   2.4.1 |
| @uppy/robodog     |   2.2.1 |                   |         |

- @uppy/transloadit: fix handling of Tus errors and rate limiting (Antoine du Hamel / #3429)
- meta: Add Unsplash to website dashboard example (Merlijn Vos / #3431)
- meta: dev: move configuration to a `.env` file (Antoine du Hamel / #3430)
- meta: Update ci.yml (Kevin van Zonneveld / #3428)
- @uppy/transloadit: simplify `#onTusError` (Antoine du Hamel / #3419)
- meta: Force include babel numeric separator (Merlijn Vos / #3422)
## 2.4.0

Released: 2022-01-10

| Package              | Version | Package              | Version |
| -------------------- | ------- | -------------------- | ------- |
| @uppy/drag-drop      |   2.0.6 | @uppy/tus            |   2.2.0 |
| @uppy/image-editor   |   1.1.1 | @uppy/utils          |   4.0.5 |
| @uppy/screen-capture |   2.0.6 | @uppy/robodog        |   2.2.0 |
| @uppy/transloadit    |   2.1.0 | uppy                 |   2.4.0 |

- @uppy/transloadit: ignore rate limiting errors when polling (Antoine du Hamel / #3418)
- @uppy/tus: pause all requests in response to server rate limiting (Antoine du Hamel / #3394)
- @uppy/transloadit: better defaults for rate limiting (Antoine du Hamel / #3414)
- @uppy/companion: Fix Companion deploys (kiloreux / #3388)
- meta: update aws-php example to use esm (Antoine du Hamel / #3413)
- @uppy/image-editor: namespace input range css (Merlijn Vos / #3406)
- @uppy/screen-capture: Add missing option to the screen capture types (Mustafa Navruz / #3400)
- @uppy/drag-drop: fix `undefined is not a function` TypeError (Antoine du Hamel / #3397)
- website: update december 2021 blog post (Antoine du Hamel / #3396)
- website: Polished the latest update blog (AJvanLoon / #3390)
- website: docs: fix typo in audio.md (heocoi / #3389)
- website: 2.0-2.3 post draft (Artur Paikin / #3370)

## 2.3.3

Released: 2022-01-04

| Package         | Version | Package         | Version |
| --------------- | ------- | --------------- | ------- |
| @uppy/companion |   3.1.5 | uppy            |   2.3.3 |

- @uppy/companion: improve private ip check (Mikael Finstad / #3403)


## 2.3.2

Released: 2021-12-21

| Package         | Version | Package         | Version |
| --------------- | ------- | --------------- | ------- |
| @uppy/angular   |   0.2.8 | @uppy/vue       |   0.4.5 |
| @uppy/companion |   3.1.4 | uppy            |   2.3.2 |
| @uppy/svelte    |   1.0.7 |                 |         |

- meta: fix release script (Antoine du Hamel)
- @uppy/core: document file.name (Merlijn Vos / #3381)
- @uppy/angular,@uppy/companion,@uppy/svelte,@uppy/vue: add `.npmignore` files to ignore `.gitignore` when packing (Antoine du Hamel / #3380)
- meta: add VSCode workspace settings to `.gitignore` (Antoine du Hamel)
- @uppy/companion: Upgrade ws in companion (Merlijn Vos / #3377)
- meta: use ESBuild to bundle in E2E test suite (Antoine du Hamel / #3375)
- meta: update linter config to parse ESM files (Antoine du Hamel / #3371)
- meta: move dev workspace to `private/` (Antoine du Hamel / #3368)
- meta: use Vite for examples/dev (Antoine du Hamel / #3361)
- website: remove dependency on `crypto` in @uppy/transloadit example (Antoine du Hamel / #3367)
- meta: enable linter on website examples (Antoine du Hamel / #3366)
- meta: enable linter on mjs scripts (Antoine du Hamel / #3364)
- @uppy/angular: Fix module field in `package.json` (Merlijn Vos / #3365)
- meta: improve release script wording and formatting (Artur Paikin)


## 2.3.1

Released: 2021-12-09

| Package           | Version | Package           | Version |
| ----------------- | ------- | ----------------- | ------- |
| @uppy/angular     |   0.2.7 | @uppy/store-redux |   2.0.3 |
| @uppy/audio       |   0.2.1 | @uppy/svelte      |   1.0.6 |
| @uppy/aws-s3      |   2.0.7 | @uppy/vue         |   0.4.4 |
| @uppy/companion   |   3.1.3 | @uppy/xhr-upload  |   2.0.7 |
| @uppy/core        |   2.1.4 | @uppy/robodog     |   2.1.5 |
| @uppy/dashboard   |   2.1.3 | uppy              |   2.3.1 |
| @uppy/locales     |   2.0.5 |                   |         |

- meta: update npm deps (Antoine du Hamel / #3352)
- @uppy/companion: fix Dockerfile and deploy automation (Mikael Finstad / #3355)
- @uppy/companion: don’t pin Yarn version in `package.json` (Antoine du Hamel / #3347)
- @uppy/aws-s3,@uppy/core,@uppy/dashboard,@uppy/store-redux,@uppy/xhr-upload: deps: use `nanoid/non-secure` to workaround react-native limitation (Antoine du Hamel / #3350)
- @uppy/audio: showRecordingLength option was removed, always clearInterval (Artur Paikin / #3351)
- meta: drop `stringify-object` dependency to generate locales (Antoine du Hamel / #3344)
- meta: add release automations (Antoine du Hamel / #3304)


## 2.3.0

Released: 2021-12-07

| Package                   | Version | Package                   | Version |
| ------------------------- | ------- | ------------------------- | ------- |
| @uppy/angular             |   0.2.6 | @uppy/locales             |   2.0.4 |
| @uppy/audio               |   0.2.0 | @uppy/onedrive            |   2.0.5 |
| @uppy/aws-s3              |   2.0.6 | @uppy/provider-views      |   2.0.6 |
| @uppy/aws-s3-multipart    |   2.2.0 | @uppy/react               |   2.1.2 |
| @uppy/box                 |   1.0.5 | @uppy/screen-capture      |   2.0.5 |
| @uppy/companion           |   3.1.2 | @uppy/status-bar          |   2.1.2 |
| @uppy/companion-client    |   2.0.4 | @uppy/store-default       |   2.0.3 |
| @uppy/core                |   2.1.3 | @uppy/thumbnail-generator |   2.0.6 |
| @uppy/dashboard           |   2.1.2 | @uppy/transloadit         |   2.0.5 |
| @uppy/drag-drop           |   2.0.5 | @uppy/tus                 |   2.1.2 |
| @uppy/dropbox             |   2.0.5 | @uppy/url                 |   2.0.5 |
| @uppy/facebook            |   2.0.5 | @uppy/utils               |   4.0.4 |
| @uppy/file-input          |   2.0.5 | @uppy/webcam              |   2.0.5 |
| @uppy/golden-retriever    |   2.0.6 | @uppy/xhr-upload          |   2.0.6 |
| @uppy/google-drive        |   2.0.5 | @uppy/zoom                |   1.0.5 |
| @uppy/image-editor        |   1.1.0 | @uppy/robodog             |   2.1.4 |
| @uppy/informer            |   2.0.5 | uppy                      |   2.3.0 |
| @uppy/instagram           |   2.0.5 |                           |         |

- meta: add release automations (Antoine du Hamel / #3304)
- @uppy/dashboard: Save meta fields when opening the image editor (Merlijn Vos / #3339)
- @uppy/aws-s3-multipart: Drop `lockedCandidatesForBatch` and mark chunks as busy when preparing (Yegor Yarko / #3342)
- @uppy/webcam: fix broken links in `webcam.md` (Antoine du Hamel / #3346)
- @uppy/audio: new @uppy/audio plugin for recording with microphone (Artur Paikin / #2976)
- build: force use of `@babel/plugin-proposal-optional-chaining` (Antoine du Hamel / #3335)
- @uppy/companion: fix deploy Yarn version (Antoine du Hamel / #3327)
- @uppy/companion: upgrade aws-sdk (Mikael Finstad / #3334)
- @uppy/core: disable loose transpilation for legacy bundle (Antoine du Hamel / #3329)
- @uppy/angular: examples: update `angular-example` to Angular v13 (Antoine du Hamel / #3325)
- meta: Update BACKLOG.md (Artur Paikin, Merlijn Vos)
- meta: Add disableLocalFiles to options summary (Steve Barker / #3323)
- meta: Create SECURITY.md (Ziding Zhang / #3052)
- @uppy/image-editor: Pass croppedCanvasOptions to getCroppedCanvas (Mohamed Boudra / #3320)
- meta: finish `master`->`main` job (Mikael Finstad / #3315)
- website: update documents that were out of date (Antoine du Hamel / #3317)
- @uppy/status-bar: Status bar error state improvements (Merlijn Vos / #3299)
- doc: Fix typo in `docs/drag-drop.md` (Ash Allen / #3319)
- website: Update /support and docs about Transloadit-hosted Companion (Artur Paikin / #3243)
- @uppy/aws-s3,@uppy/box,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/google-drive,@uppy/image-editor,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/screen-capture,@uppy/status-bar,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/url,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: Refactor locale scripts & generate types and docs (Merlijn Vos / #3276)
- @uppy/companion: Remove references of incorrect `options` argument for `companion.socket` (Mikael Finstad / #3307)
- @uppy/companion: Upgrade linting to 2.0.0-0 (Kevin van Zonneveld / #3280)


## 2.2.1

Released: 2021-10-14

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/angular | 0.2.5 | @uppy/provider-views | 2.0.4 |
| @uppy/aws-s3-multipart | 2.1.1 | @uppy/react-native | 0.2.4 |
| @uppy/aws-s3 | 2.0.5 | @uppy/react | 2.1.1 |
| @uppy/box | 1.0.4 | @uppy/redux-dev-tools | 2.0.3 |
| @uppy/companion-client | 2.0.3 | @uppy/robodog | 2.1.1 |
| @uppy/companion | 3.1.1 | @uppy/screen-capture | 2.0.4 |
| @uppy/core | 2.1.1 | @uppy/status-bar | 2.1.1 |
| @uppy/dashboard | 2.1.1 | @uppy/store-default | 2.0.2 |
| @uppy/drag-drop | 2.0.4 | @uppy/store-redux | 2.0.2 |
| @uppy/drop-target | 1.1.1 | @uppy/svelte | 1.0.5 |
| @uppy/dropbox | 2.0.4 | @uppy/thumbnail-generator | 2.0.5 |
| @uppy/facebook | 2.0.4 | @uppy/transloadit | 2.0.4 |
| @uppy/file-input | 2.0.4 | @uppy/tus | 2.1.1 |
| @uppy/form | 2.0.4 | @uppy/unsplash | 2.0.1 |
| @uppy/golden-retriever | 2.0.5 | @uppy/url | 2.0.4 |
| @uppy/google-drive | 2.0.4 | @uppy/utils | 4.0.3 |
| @uppy/image-editor | 1.0.4 | @uppy/vue | 0.4.3 |
| @uppy/informer | 2.0.4 | @uppy/webcam | 2.0.4 |
| @uppy/instagram | 2.0.4 | @uppy/xhr-upload | 2.0.5 |
| @uppy/locales | 2.0.3 | @uppy/zoom | 1.0.4 |
| @uppy/onedrive | 2.0.4 | uppy | 2.2.1 |
| @uppy/progress-bar | 2.0.4 | - | - |

- @uppy/locale: Update ar_SA.js (issa.ahmd@gmail.com  / #3192)
- @uppy/status-bar: fix `calculateProcessingProgress` is not a function (@aduh95 / #3261)
- @uppy/status-bar: Progress object is nested (@arturi / #3262)
- build: Add retext to markdown linter (@aduh95 / #3024)
- build: Bump tar from 6.1.2 to 6.1.9 (dependabot / #3152)
- website: Revert "Remove broken link in `plugin_list.ejs` (@aduh95 / #3166)

## 2.2.0

Released: 2021-10-06

This release marks a major version for `@uppy/unsplash` plugin which is now production-ready. It also includes various fixes and improvements such as fix to `@uppy/transloadit` plugin and adds `onDrop` event to `@uppy/drop-target`.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/angular | 0.2.4 | @uppy/provider-views | 2.0.3 |
| @uppy/aws-s3-multipart | 2.1.0 | @uppy/react-native | 0.2.3 |
| @uppy/aws-s3 | 2.0.4 | @uppy/react | 2.1.0 |
| @uppy/box | 1.0.3 | @uppy/redux-dev-tools | 2.0.2 |
| @uppy/companion-client | 2.0.2 | @uppy/robodog | 2.1.0 |
| @uppy/companion | 3.1.0 | @uppy/screen-capture | 2.0.3 |
| @uppy/core | 2.1.0 | @uppy/status-bar | 2.1.0 |
| @uppy/dashboard | 2.1.0 | @uppy/store-default | 2.0.1 |
| @uppy/drag-drop | 2.0.3 | @uppy/store-redux | 2.0.1 |
| @uppy/drop-target | 1.1.0 | @uppy/svelte | 1.0.4 |
| @uppy/dropbox | 2.0.3 | @uppy/thumbnail-generator | 2.0.4 |
| @uppy/facebook | 2.0.3 | @uppy/transloadit | 2.0.3 |
| @uppy/file-input | 2.0.3 | @uppy/tus | 2.1.0 |
| @uppy/form | 2.0.3 | @uppy/unsplash | 2.0.0 |
| @uppy/golden-retriever | 2.0.4 | @uppy/url | 2.0.3 |
| @uppy/google-drive | 2.0.3 | @uppy/utils | 4.0.2 |
| @uppy/image-editor | 1.0.3 | @uppy/vue | 0.4.2 |
| @uppy/informer | 2.0.3 | @uppy/webcam | 2.0.3 |
| @uppy/instagram | 2.0.3 | @uppy/xhr-upload | 2.0.4 |
| @uppy/locales | 2.0.2 | @uppy/zoom | 1.0.3 |
| @uppy/onedrive | 2.0.3 | remark-lint-uppy | 0.0.3 |
| @uppy/progress-bar | 2.0.3 | uppy | 2.2.0 |

- @uppy/angular: fix component crash by loosening `package.json` version constraints (#3210 / @ajkachnic)
- @uppy/aws-s3-multipart: Retry `prepareUploadParts` on fail for `@uppy/aws-s3-multipart` (#3224 / @Murderlon)
- @uppy/aws-s3: Fix AWS S3 upload on React Native (#3064 / @Cretezy)
- @uppy/companion: `Object.fromEntries` is not available on Node.js v10.x (#3209 / @aduh95)
- @uppy/companion: Close window on auth callback error and show error to user (#3143 / @mifi)
- @uppy/companion: Default allow headers (#3167 / @mifi)
- @uppy/companion: docs: fix typo in companion.md (#3240 / @eltociear)
- @uppy/companion: Include status code in HTTP error message (#3212 / @mifi)
- @uppy/companion: Make uploadUrls recommended (#3182 / @mifi)
- @uppy/companion: Use GET instead of HEAD for getURLMeta + Cut off length of file names (#3048 / @mifi)
- @uppy/core: Fix typo in `@uppy/core` types (#3230 / @lucax88x)
- @uppy/core: move `Uppy` class to its own module (#3225 / @aduh95)
- @uppy/dashboard: Add info about include in the Dashboard (#3236 / @epexa)
- @uppy/dashboard: Fix i18n error in `CopyLinkButton` (#3235 / @Murderlon)
- @uppy/dashboard: fix linter (#3206 / @aduh95)
- @uppy/drop-target: expose `onDrop` events (#3238 / @Murderlon)
- @uppy/image-editor: add workaround for when `Cropper` is loaded as ESM (#3218 / @aduh95)
- @uppy/locales: added translate for missingRequiredMetafield es_ES (#3242 / @sebasegovia01)
- @uppy/react: propagate prop mutation (#3208 / @aduh95)
- @uppy/react: update HTMLAttributes filter (#3215 / @aduh95)
- @uppy/status-bar: Show all details on mobile when `showProgressDetails` is `true` (#3174 / @Murderlon)
- @uppy/store-redux: Improve docs on redux store integration (#3227 / @Murderlon)
- @uppy/transloadit: pass fields to transloadit (#3228 / @aduh95)
- @uppy/tus: Add support for `opts.headers` as a function in `@uppy/tus` (#3221 / @danilat)
- @uppy/unsplash: Make `@uppy/unsplash` production ready (#3196 / @Murderlon)
- @uppy/xhr-upload: fix `this.uppy is undefined` error (#3207 / @aduh95)
- ci: test on Node.js v16.x (#3205 / @aduh95)
- website: Remove broken link in `plugin_list.ejs` (#3166 / @YukeshShr)

## 2.1.1

Released: 2021-09-20

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/angular | 0.2.3 | @uppy/progress-bar | 2.0.2 |
| @uppy/aws-s3-multipart | 2.0.3 | @uppy/provider-views | 2.0.2 |
| @uppy/aws-s3 | 2.0.3 | @uppy/react-native | 0.2.2 |
| @uppy/box | 1.0.2 | @uppy/react | 2.0.3 |
| @uppy/companion-client | 2.0.1 | @uppy/robodog | 2.0.4 |
| @uppy/core | 2.0.3 | @uppy/screen-capture | 2.0.2 |
| @uppy/dashboard | 2.0.3 | @uppy/status-bar | 2.0.2 |
| @uppy/drag-drop | 2.0.2 | @uppy/svelte | 1.0.3 |
| @uppy/drop-target | 1.0.2 | @uppy/thumbnail-generator | 2.0.3 |
| @uppy/dropbox | 2.0.2 | @uppy/transloadit | 2.0.2 |
| @uppy/facebook | 2.0.2 | @uppy/tus | 2.0.2 |
| @uppy/file-input | 2.0.2 | @uppy/unsplash | 1.0.2 |
| @uppy/form | 2.0.2 | @uppy/url | 2.0.2 |
| @uppy/golden-retriever | 2.0.3 | @uppy/utils | 4.0.1 |
| @uppy/google-drive | 2.0.2 | @uppy/vue | 0.4.1 |
| @uppy/image-editor | 1.0.2 | @uppy/webcam | 2.0.2 |
| @uppy/informer | 2.0.2 | @uppy/xhr-upload | 2.0.3 |
| @uppy/instagram | 2.0.2 | @uppy/zoom | 1.0.2 |
| @uppy/locales | 2.0.1 | uppy | 2.1.1 |
| @uppy/onedrive | 2.0.2 | - | - |

- @uppy/unsplash: Fix "attempted to use private field on non-instance" in `SearchProvider` (#3201)
- @uppy/locales: Add 'done' to `nb_NO.js` (#3200)
- @uppy/transloadit: Fix unhandledPromiseRejection failures (#3197)
- @uppy/aws-s3-multipart: Fix AbortController is not defined on Node.js (Server Side Render) (#3169)
- @uppy/aws-s3-multipart: Fix `net::ERR_OUT_OF_MEMORY` (#3183)
- @uppy/dashboard: Fix `autoOpenFileEditor` (#3186)
- @uppy/dashboard: Update Google Drive for brand compliance (#3178)

## 2.1.0

Released: 2021-09-01

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/angular | 0.2.2 | @uppy/svelte | 1.0.2 |
| @uppy/aws-s3 | 2.0.2 | @uppy/thumbnail-generator | 2.0.2 |
| @uppy/core | 2.0.2 | @uppy/vue | 0.4.0 |
| @uppy/dashboard | 2.0.2 | @uppy/xhr-upload | 2.0.2 |
| @uppy/react | 2.0.2 | uppy | 2.1.0 |
| @uppy/robodog | 2.0.3 | - | - |

- @uppy/aws-s3: fix 'send' XMLHttpRequest (#3130 / @jhen0409)
- @uppy/aws-s3, @uppy/thumbnail-generator, @uppy/xhr-upload: fix `i18n` (#3142 / @jhen0409 / @aduh95)
- @uppy/react: fix `DashboardModal`'s `target` type (#3110 / @Murderlon)
- @uppy/xhr-upload: add types for methods (#3154 / @BePo65)
- @uppy/core: improve accuracy/compatibility of success/error callback types (#3141 / @Hawxy)
- @uppy/vue: add Vue FileInput component (#3125 / @valentinoli)

## 2.0.2

Released: 2021-08-26

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/angular | 0.2.2 | @uppy/robodog | 2.0.2 |
| @uppy/aws-s3-multipart | 2.0.2 | @uppy/robodog | 2.0.3 |
| @uppy/aws-s3 | 2.0.2 | @uppy/svelte | 1.0.2 |
| @uppy/companion | 3.0.1 | @uppy/thumbnail-generator | 2.0.2 |
| @uppy/vue | 0.4.0 | @uppy/core | 2.0.2 |
| @uppy/dashboard | 2.0.2 | uppy | 2.0.2 |
| @uppy/golden-retriever | 2.0.2 | @uppy/xhr-upload | 2.0.2 |
| @uppy/react | 2.0.2 | - | - |

- @uppy/aws-s3-multipart: fix route ordering and query parameters (#3132 / @rossng)
- @uppy/core: add types overload for `off` method (#3137 / @Hawxy)
- @uppy/golden-retriever: handle promise rejections (#3131 / @Murderlon)

## 2.0.1

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/angular | 0.2.1 | @uppy/react-native | 0.2.1 |
| @uppy/react | 2.0.1 | @uppy/provider-views | 2.0.1 |
| @uppy/aws-s3-multipart | 2.0.1 | @uppy/redux-dev-tools | 2.0.1 |
| @uppy/aws-s3 | 2.0.1 | @uppy/robodog | 2.0.1 |
| @uppy/box | 1.0.1 | @uppy/svelte | 1.0.1 |
| @uppy/companion | 3.0.1 | @uppy/screen-capture | 2.0.1 |
| @uppy/core | 2.0.1 | @uppy/status-bar | 2.0.1 |
| @uppy/dashboard | 2.0.1 | @uppy/svelte | 1.0.2 |
| @uppy/thumbnail-generator | 2.0.1 | @uppy/drag-drop | 2.0.1 |
| @uppy/drop-target | 1.0.1 | @uppy/transloadit | 2.0.1 |
| @uppy/dropbox | 2.0.1 | @uppy/tus | 2.0.1 |
| @uppy/facebook | 2.0.1 | @uppy/unsplash | 1.0.1 |
| @uppy/file-input | 2.0.1 | @uppy/url | 2.0.1 |
| @uppy/form | 2.0.1 | @uppy/vue | 0.3.1 |
| @uppy/golden-retriever | 2.0.1 | @uppy/vue | 0.4.0 | @uppy/webcam | 2.0.1 |
| @uppy/google-drive | 2.0.1 | @uppy/xhr-upload | 2.0.1 |
| @uppy/image-editor | 1.0.1 | @uppy/onedrive | 2.0.1 |
| @uppy/informer | 2.0.1 | @uppy/zoom | 1.0.1 |
| @uppy/instagram | 2.0.1 | uppy | 2.0.1 |
| @uppy/progress-bar | 2.0.1 | - | - |

Released: 2021-08-25

- Update peerDependencies to ^2.0.0 in all uppy packages @arturi (b39824819)

## 2.0.0

Released: 2021-08-24

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/angular | 0.2.0 | @uppy/provider-views | 2.0.0 |
| @uppy/aws-s3-multipart | 2.0.0 | @uppy/react-native | 0.2.0 |
| @uppy/aws-s3 | 2.0.0 | @uppy/react | 2.0.0 |
| @uppy/box | 1.0.0 | @uppy/redux-dev-tools | 2.0.0 |
| @uppy/companion-client | 2.0.0 | @uppy/robodog | 2.0.0 |
| @uppy/companion | 3.0.0 | @uppy/screen-capture | 2.0.0 |
| @uppy/core | 2.0.0 | @uppy/status-bar | 2.0.0 |
| @uppy/dashboard | 2.0.0 | @uppy/store-default | 2.0.0 |
| @uppy/drag-drop | 2.0.0 | @uppy/store-redux | 2.0.0 |
| @uppy/drop-target | 1.0.0 | @uppy/svelte | 1.0.0 |
| @uppy/dropbox | 2.0.0 | @uppy/thumbnail-generator | 2.0.0 |
| @uppy/facebook | 2.0.0 | @uppy/transloadit | 2.0.0 |
| @uppy/file-input | 2.0.0 | @uppy/tus | 2.0.0 |
| @uppy/form | 2.0.0 | @uppy/unsplash | 1.0.0 |
| @uppy/golden-retriever | 2.0.0 | @uppy/url | 2.0.0 |
| @uppy/google-drive | 2.0.0 | @uppy/utils | 4.0.0 |
| @uppy/image-editor | 1.0.0 | @uppy/vue | 0.3.0 |
| @uppy/informer | 2.0.0 | @uppy/webcam | 2.0.0 |
| @uppy/instagram | 2.0.0 | @uppy/xhr-upload | 2.0.0 |
| @uppy/locales | 2.0.0 | @uppy/zoom | 1.0.0 |
| @uppy/onedrive | 2.0.0 | uppy | 2.0.0 |
| @uppy/progress-bar | 2.0.0 | - | - |

### ⚠️ Breaking changes

- build: Remove IE polyfills and special casing — Uppy officially drops IE 11 support. You can manually include the polyfills, and we have an `uppy.legacy.js` bundle, but we are not (#2947 / @aduh95)
- @uppy/core: Upgraded Preact to latest Preact 10 — all custom Uppy plugins should now use new version too (#2926 / @Murderlon)
- @uppy/core: force `new` keyword — please 1always use `const uppy = new Uppy()` now (#2949 / @arturi)
- @uppy/core: renamed `allowMultipleUploads` to `allowMultipleUploadBatches` (#3115 / @arturi)
- @uppy/core: Split `Plugin` into `BasePlugin` and extended `UIPlugin` (#2944 / @Murderlon)
- @uppy/core: Set plugin titles from locale packs (#3023 / @arturi)
- @uppy/informer: Support multiple messages in informer (#3017 / @Murderlon)
- @uppy/xhr-upload, @uppy/tus: Set default concurrent file upload limit to 5 (#2993 / @arturi)
- @uppy/core: Strictly type uppy events (#3085 / @Hawxy)
- @uppy/core: always enable strict types and remove `.run` method (#2957 / @Murderlon)
- @uppy/dashboard: Removed backwards compatibility hacks in locales (#2969 / @goto-bus-stop)
- @uppy/companion Removed `oldHtmlContent` from Companion’s `send-token` option (#2967 / @Murderlon)
- @uppy/provider-views: Removed `isTeamDrive` from `@uppy/google-drive` option (#2967 / @Murderlon)
- @uppy/tus: Removed timeout for `resetUploaderReferences` option (#2967 / @Murderlon)
- @uppy/tus: Removed `resume` option (#2967 / @Murderlon)


### Misc

- @uppy/angular: fix uppy dependencies @aduh95
- @uppy/angular: upgrade to Angular 12.1 (d61113979 / @aduh95 )
- @uppy/aws-s3-multipart: add support for presigned URL batching (#3056 / @martin-brennan)
- @uppy/aws-s3: refactor to private fields (#3076 / @aduh95)
- @uppy/aws-s3: refactor to use private fields (#3094 / @aduh95)
- @uppy/companion-client: migrate to private properties (#3057 / @aduh95)
- @uppy/companion: Companion improve logging (#3103 / @mifi)
- @uppy/companion: fix build (960cfa5ba / @aduh95)
- @uppy/companion: remove `lodash` dependency (#3036 / @aduh95)
- @uppy/companion: Remove deprecated `serverHeaders` in favour of `companionHeaders` (#2995 / @arturi)
- @uppy/core: add types for `logger` (#3090 / @bencergazda)
- @uppy/core: avoid binding methods to instance in constructor (#3043 / @aduh95)
- @uppy/core: Create `getObjectOfFilesPerState` in core for plugins (#2961 / @Murderlon)
- @uppy/core: Create `onUnmount` in `UIPlugin` for plugins that require clean up (#3093 / @Murderlon)
- @uppy/core: detach event listeners on close (#3035 / @aduh95)
- @uppy/core: do not expose `plugins` property (#3045 / @aduh95)
- @uppy/core: fix i18n binding (4ab06907c / @aduh95)
- @uppy/core: fix types (dcaef3173 / @aduh95)
- @uppy/core: move event emitter to private properties (#3042 / @aduh95)
- @uppy/core: move more internals to private properties (#3041 / @aduh95)
- @uppy/core: `onBeforeFileAdded` — pass full file object with extension, detected type, meta, size, etc (#2941 / @arturi)
- @uppy/core: reject empty string as valid value for required meta fields (#3119 / @aduh95) (0b801ccba)
- @uppy/core: Remove `sync` option from `VirtualList` & update `UIPlugin` render @Murderlon
- @uppy/core: remove more IE hacks (#3015 / @aduh95)
- @uppy/core: remove use of `Array.prototype.reduce` where possible (#3016 / @aduh95)
- @uppy/core: Resolve all type `TODO`'s (#2963 / @Murderlon)
- @uppy/core: UIPlugin fix: prevent Preact replacing contents of body element by using `createDocumentFragment` (#3072 / @arturi)
- @uppy/core: use private fields (#3013 / @aduh95)
- @uppy/core: use privater properties in `UIPlugin` (#3073 / @aduh95)
- @uppy/core: validateRestrictions was failing due to being unbound, fixed with arrow function (1c7ac56d8 / @arturi)
- @uppy/dashboard, @uppy/status-bar: call core methods directly (#3062 / @arturi)
- @uppy/dashboard: don’t show informer for individual required meta fields errors (#3060 / @arturi)
- @uppy/dashboard: fileSource string is unused (2b52d9f9a / @arturi)
- @uppy/dashboard: Fix `editFile` locale usage (#3108 / @Murderlon)
- @uppy/dashboard: fix metafield form validation (#3113 / @aduh95)
- @uppy/dashboard: set default trigger: null (#2942 / @arturi)
- @uppy/dashboard: `showLinkToFileUploadResult: false` by default (#2994 / @arturi)
- @uppy/form: deprecate multipleResults option (#2996 / @arturi)
- @uppy/image-editor: Add `croppedCanvasOptions` to image editor `opts` (#3037 / @Murderlon)
- @uppy/image-editor: fix SASS deprecation warning (#3009 / @aduh95)
- @uppy/informer: remove dependency to `preact-transition-group` (#3055 / @aduh95)
- @uppy/locales: Fix locales — point to CDN v1.31.0 (198f23649 / @arturi)
- @uppy/locales: remove es_GL that was kept for backwards-compat (#2943 / @arturi)
- @uppy/locales: remove unused strings (@arturi)
- @uppy/locales: Sync and enhance locale de_DE (#3071 / @paescuj)
- @uppy/provider-views: Improve checkbox for screenreaders 2 (#2980 / @Murderlon)
- @uppy/provider-views: Sort Google Drive list by name (#3069 / @Murderlon)
- @uppy/provider-views: Tweak breadcrump styling (#3030 / @Murderlon)
- @uppy/robodog: fix types @aduh95 (d9ff0030a)
- @uppy/store-redux: force `new` keyword (17f71da67 / @aduh95)
- @uppy/transloadit: fix tests on v16.x (@aduh95)
- @uppy/transloadit: fix unhandled promise rejections (#2948 / @aduh95)
- @uppy/transloadit: refactor to use private properties (#3019 / @aduh95)
- @uppy/transloadit: upgrade `socket.io-client` version (#3065 / @aduh95)
- @uppy/tus: remove `autoRetry` option (#2938 / @aduh95)
- @uppy/utils: avoid creating throw-away `<div>` in `isDragDropSupported` (#3080 / @aduh95)
- @uppy/utils: improve support of data URI in `dataURItoBlob` (#3080 / @aduh95) (0cccb686f)
- @uppy/utils: refactor `prettyETA` (#3080 / @aduh95)
- @uppy/utils: refactor `truncateString` (#3080 / @aduh95)
- @uppy/utils: remove ponyfill for `Array#findIndex` (#3080 / @aduh95)
- @uppy/utils: resolve remaining linter errors (#3091 / @aduh95)
- @uppy/utils: simplify `canvasToBlob` (#3080 / @aduh95)
- @uppy/utils: simplify `getTimeStamp` (#3080 / @aduh95)
- @uppy/utils: simplify code using optional chaining (#3080 / @aduh95)
- @uppy/utils: use `Array.from` insterad of custom utils (#3080 / @aduh95)
- @uppy/utils: use private fields in `EventTracker` (#3080 / @aduh95)
- @uppy/utils: use private fields in `ProgressTimeout` (#3080 / @aduh95)
- @uppy/utils: use private fields in `RateLimitedQueue` (#3080 / @aduh95)
- @uppy/webcam, @uppy/screen-capture: expect built-in support for `MediaDevices` API (#2945 / @aduh95)
- @uppy/webcam: Fix webcam mirror option (#3074 / @Murderlon) (b7210b137)
- @uppy/xhr-upload: Call `upload-started` for every file instead of all at once in `xhr-upload` (#3005 / @Murderlon)
- @uppy/xhr-upload: change default name depending on whether `bundle` is set (#2933 / @aduh95)
- @uppy/xhr-upload: fix import path (#3080 / @aduh95)
- @uppy/xhr-upload: use symbol for internal options (#2934 / @aduh95)
- @uppy/locales: Add new added phrases and some improvment to fa_IR translation file (#3050 / @ghasrfakhri)
- build: Add `@babel/plugin-proposal-nullish-coalescing-operator` babel plugin (4bbd3b97b / @aduh95)
- build: add stylelint (#3124 / @arturi) (dbe3ed25b)
- build: Bootstrap without package-lock files (#3029 / @Murderlon)
- build: don't run markdown tests in type tests (a4e2da159 / @aduh95)
- build: don’t run IE tests for 2.0 (e4eb502f2 / @arturi)
- build: enable linter for TypeScript (#2997 / @aduh95) (5630f7dc0)
- build: enforce `no-unused-vars` linter rule (#3118 / @aduh95) (ec87b232e)
- build: fix `package.json` imports to be inlined by Babel (#3047 / @aduh95)
- build: fix building on Node.js v14.x LTS (#3061 / @aduh95)
- build: fix legacy bundle (#3112 / @aduh95)
- build: Fix lint warnings in bin/locale-packs.js (#3028 / @goto-bus-stop)
- build: harden locale pack check for unused or duplicate key (#3081 / @aduh95)
- build: lint JS code snippets inside blog posts (#2992 / @aduh95)
- build: remove `@babel/polyfill` in favor of `core-js@3` (#3025 / @aduh95)
- build: remove Node.js v10.x, add v16.x (#2932 / @aduh95)
- build: remove use of `promisify` where possible (#3010 / @aduh95)
- build: Set node version in `workflows/cdn.yml` to 16.x @Murderlon (35697d18d)
- build: Stricter linter (#3095 / @aduh95)
- doc, deps: clean up polyfill inconsistencies (#3020 / @aduh95)
- doc: lint JS code snippets (#2954 / @aduh95)
- docs: Fix typo in `docs/companion.md` (3632a55c6 / @Murderlon)
- docs: use ESM syntax in code snippets (#2953 / @aduh95)
- Improve a11y of remove button in dashboard (#3088 / @Murderlon)
- meta: rename master branch to main (08cac3beb / @arturi)
- meta: Resolve or remove miscellaneous todos (#2967 / @Murderlon)
- @uppy/companion: Safely escape `<script>` injected code in companion `send-token.js` (#3101 / @mifi) (3059d733f)
- test: fix end2end test suite (#3008 / @aduh95)
- test: remove npm warning on Node.js v14.x (1666f8918 / @aduh95)
- website: Disable box (#3087 / @mifi)
- website: hide Box from examples for now (0b9092527 / @arturi)
- website: set background color on root element (#3078 / @aduh95)
- website: update jquery to latest (c70b9d71b / @arturi)
- docs: update example to use `i18nInit` (#3122 / @aduh95) (2a93874e3)

### Dependency upgrades

- deps: remove unused `cheerio-select-tmp` @aduh95 (367ec5099 / @aduh95)
- deps: remove unused `karma-*` @aduh95 (d2a4c9e84 / @aduh95)
- deps: update `browserify` to v17 @aduh95 (79611cc8d / @aduh95)
- deps: upgrade eslint plugins @aduh95 (ce5414d3b / @aduh95)
- deps: upgrade `adm-zip` to v0.5 @aduh95 (0e8ab0d6d / @aduh95)
- deps: upgrade `typescript` version @aduh95 (d6fb14dfb)
- deps: upgrade `verdaccio` to v5 @aduh95 (135c64a26)
- deps: upgrade `tsd` to v0.17 @aduh95 (7f6c3fcc4)
- deps: update `temp-write` to v5 @aduh95 (d01422937)
- deps: upgrade `tar` to v6 @aduh95 (2a1512288)
- deps: upgrade `remark-cli` to v9 @aduh95 (def967d5e)
- deps: upgrade `pacote` to v11 @aduh95 (431f437d1)
- deps: upgrade `onchange` to v7 @aduh95 (91f056e9e)
- deps: upgrade `npm-packlist` to v2 @aduh95 (047261ca8)
- deps: upgrade `nodemon`to v2 @aduh95 (115fa101f)
- @uppy/companion: upgrade `helmet` to v4 @aduh95 (7330d21b8)
- deps: update `lerna` to v4 @aduh95 (469e2e5df)
- deps: remove `execa` and refactor `update-contributors` script @aduh95 (95a8d871e)
- deps: update `cssname` to v5 @aduh95 (51af8668f)
- deps: upgrade `chalk` to v4 @aduh95 (8e2833546)
- deps: update `autoprefixer` to v10 @aduh95 (0481f5d9b)
- deps: remove unused `webpack` deps @aduh95 (f251c5705)
- deps: upgrade `webdriverio` to v7 @aduh95 (96b9e74f7)
- deps: re-organize React dependencies @aduh95 (f3b90b072)
- deps: remove `mkdirp` in favor of the built-in `fs.mkdir` @aduh95 (06d5b3e25)
- deps: remove unused `json3` @aduh95 (811acddfa)
- deps: upgrade `isomorphic-fetch` @aduh95 (d5d34fd12)
- deps: upgrade `globby` @aduh95 (0964e9a16)
- deps: upgrade `fakefile` @aduh95 (b7e939d1d)
- deps: upgrade `exircist` @aduh95 (51f28ab95)
- deps: remove `rimraf` in favor of built-in `fs.rm` @aduh95 (e4c53bdad)
- test: update `jest` to v27 @aduh95 (bbf04e4bd)
- deps: upgrade `nock` to v13 @aduh95 (38388b175)
- deps: replace `cuid` with `nanoid` (#3053 / @aduh95)
- deps: nanoid to 3.1.25 to fix missing commonjs issue (6e8b1d50d / @arturi)
- deps: Bump tar from 6.1.0 to 6.1.2 (#3070)
- deps: remove `qs-stringify` from dependencies (#3077 / @aduh95)
- deps: upgrade create-react-app to 4.0.3 (0760be8cc / @arturi)
- deps: update Webdriverio packages (#3027 / @aduh95)
- deps: update `package-lock.json` (4497557a3 / @aduh95)

## 1.31.0

Released: 2021-07-29

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/angular | 0.1.3 | @uppy/react | 1.12.1 |
| @uppy/aws-s3 | 1.8.0 | @uppy/robodog | 1.11.0 |
| @uppy/companion | 2.12.0 | @uppy/screen-capture | 1.1.0 |
| @uppy/core | 1.20.0 | @uppy/svelte | 0.1.13 |
| @uppy/dashboard | 1.21.0 | @uppy/transloadit | 1.7.0 |
| @uppy/drag-drop | 1.4.31 | @uppy/vue | 0.2.6 |
| @uppy/image-editor | 0.4.0 | @uppy/webcam | 1.8.13 |
| @uppy/locales | 1.22.0 | uppy | 1.31.0 |

- @uppy/companion: Fix invalid referrer crashing the process (a785f7deebe5ad75bb2e7ea0874198784c19fea1 / @juliangruber)
- @uppy/companion: Fix typescript error (6dbaddc09d36308821b842ed13a847f5d655cbf4 / @juliangruber)
- @uppy/angular: Fix broken packaging (#3007 / @ajkachnic)
- @uppy/robodog: Add Robodog Types (#2989 / @Hawxy)
- @uppy/core: Tighten duck type check for file objects (#3006 / @goto-bus-stop)
- @uppy/core: tighten duck type check for file objects (#3006 / @goto-bus-stop)
- @uppy/core: Set file size from progress data when null (#2778 / @mejiaej)
- @uppy/core: Mark state as deprecated (#3044 / @aduh95)
- @uppy/locales: Update de_DE.js (#3012 / @paescuj)
- @uppy/dashboard: Rename Done to Cancel, add Save to Image Editor (#3033 / @arturi)
- @uppy/box: Add Box (#3004 / @mifi)
- @uppy/dashboard: Add required option to metaFields (#2896 / @aduh95)
- build: Fix package.json imports to be inlined by Babel (#3047 / @aduh95)
- docs: Add instagram development notes (#2984 / @mifi)
- docs: Update CONTRIBUTING.md (#3011 / @aduh95)
- website: fix linter errors in JS code snippets inside blog posts (#2991 / @aduh95)

## Companion Patch 2.12.2

| Package | Version |
|-|-|
| @uppy/companion@2.12.2 | 2.12.2 |

- @uppy/companion: Improve logging (#3103 / @mifi)

### Patch release

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/angular | 0.1.2 | @uppy/companion | 2.11.1 |

## June 2021

## 1.30.0

Released: 2021-07-01

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/angular | 0.1.1 | @uppy/progress-bar | 1.3.30 |
| @uppy/aws-s3-multipart | 1.8.17 | @uppy/provider-views | 1.12.2 |
| @uppy/aws-s3-multipart | 1.8.18 | @uppy/provider-views | 1.12.3 |
| @uppy/aws-s3 | 1.7.11 | @uppy/react-native | 0.1.8 |
| @uppy/aws-s3 | 1.7.12 | @uppy/react-native | 0.1.9 |
| @uppy/box | 0.3.11 | @uppy/react | 1.11.10 |
| @uppy/box | 0.3.12 | @uppy/react | 1.12.0 |
| @uppy/companion-client | 1.10.1 | @uppy/redux-dev-tools | 1.3.9 |
| @uppy/companion-client | 1.10.2 | @uppy/robodog | 1.10.11 |
| @uppy/companion | 2.10.1 | @uppy/robodog | 1.10.12 |
| @uppy/companion | 2.11.0 | @uppy/screen-capture | 1.0.20 |
| @uppy/core | 1.19.1 | @uppy/screen-capture | 1.0.21 |
| @uppy/core | 1.19.2 | @uppy/status-bar | 1.9.5 |
| @uppy/dashboard | 1.20.1 | @uppy/status-bar | 1.9.6 |
| @uppy/dashboard | 1.20.2 | @uppy/store-default | 1.2.7 |
| @uppy/drag-drop | 1.4.29 | @uppy/store-redux | 1.2.7 |
| @uppy/drag-drop | 1.4.30 | @uppy/store-redux | 1.2.8 |
| @uppy/drop-target | 0.2.3 | @uppy/svelte | 0.1.11 |
| @uppy/drop-target | 0.2.4 | @uppy/svelte | 0.1.12 |
| @uppy/dropbox | 1.5.1 | @uppy/thumbnail-generator | 1.7.10 |
| @uppy/dropbox | 1.5.2 | @uppy/thumbnail-generator | 1.7.11 |
| @uppy/facebook | 1.2.1 | @uppy/transloadit | 1.6.25 |
| @uppy/facebook | 1.2.2 | @uppy/transloadit | 1.6.26 |
| @uppy/file-input | 1.5.1 | @uppy/tus | 1.9.1 |
| @uppy/file-input | 1.5.2 | @uppy/tus | 1.9.2 |
| @uppy/form | 1.3.30 | @uppy/unsplash | 0.1.12 |
| @uppy/form | 1.3.31 | @uppy/unsplash | 0.1.13 |
| @uppy/golden-retriever | 1.4.1 | @uppy/url | 1.5.22 |
| @uppy/golden-retriever | 1.4.2 | @uppy/url | 1.5.23 |
| @uppy/google-drive | 1.7.1 | @uppy/utils | 3.6.1 |
| @uppy/google-drive | 1.7.2 | @uppy/utils | 3.6.2 |
| @uppy/image-editor | 0.2.6 | @uppy/vue | 0.2.4 |
| @uppy/image-editor | 0.3.0 | @uppy/vue | 0.2.5 |
| @uppy/informer | 1.6.5 | @uppy/webcam | 1.8.11 |
| @uppy/informer | 1.6.6 | @uppy/webcam | 1.8.12 |
| @uppy/instagram | 1.5.1 | @uppy/xhr-upload | 1.7.4 |
| @uppy/instagram | 1.5.2 | @uppy/xhr-upload | 1.7.5 |
| @uppy/locales | 1.20.1 | @uppy/zoom | 0.1.17 |
| @uppy/locales | 1.21.0 | @uppy/zoom | 0.1.18 |
| @uppy/onedrive | 1.2.1 | remark-lint-uppy | 0.0.1 |
| @uppy/onedrive | 1.2.2 | uppy | 1.29.1 |
| @uppy/progress-bar | 1.3.29 | uppy | 1.30.0 |

- @uppy/companion: add `logClientVersion` option (#2855 / @mifi)
- @uppy/angular: add Angular integration (#2871 / @ajkachnic)
- @uppy/core: add types for uppy.once method (#2965 / @a-kriya)
- @uppy/core: enrich error event for use from postproocessor (#2909 / @aduh95)
- @uppy/react-native: refactor takePictureWithExpo (#2946 / @aduh95)
- @uppy/companion: fixed standalone server to initiate itself on explicit function (#2920 / @Cruaier)
- @uppy/google-drive: Google drive shortcuts (#2917 / @mifi)
- @uppy/react: allowed HTML Attributes to be passed via props (#2891 / @ajkachnic)
- @uppy/drag-drop: Expose drag-drop events (#2914 / @Murderlon)
- @uppy/image-editor: Add more granular image rotation control (#2838 / @aduh95)
- @uppy/utils: Translator: refactor interpolate (#2903 / @aduh95)
- @uppy/url: return fileId or error in plugin.addFile (#2919 / @nil1511)
- @uppy/locales: Mention the file name in exceedsSize error message (#2918 / @Murderlon)
- build: Fix eslint uppy package imports (#2915 / @Murderlon)
- docs: fix typo in docs/progressbar.md (#2962 / @a-kriya)
- docs: add props example (#2959 / @jmontoyaa)

## May 2021

## 1.29.1

Released: 2021-05-28

This release features a significant refactor of the Golden Retriever plugin, among with some Companion and Typescript improvements.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.17 | @uppy/react-native | 0.1.8 |
| @uppy/aws-s3 | 1.7.11 | @uppy/react | 1.11.10 |
| @uppy/box | 0.3.11 | @uppy/redux-dev-tools | 1.3.9 |
| @uppy/companion-client | 1.10.1 | @uppy/robodog | 1.10.11 |
| @uppy/companion | 2.10.1 | @uppy/screen-capture | 1.0.20 |
| @uppy/core | 1.19.1 | @uppy/status-bar | 1.9.5 |
| @uppy/dashboard | 1.20.1 | @uppy/store-default | 1.2.7 |
| @uppy/drag-drop | 1.4.29 | @uppy/store-redux | 1.2.7 |
| @uppy/drop-target | 0.2.3 | @uppy/svelte | 0.1.11 |
| @uppy/dropbox | 1.5.1 | @uppy/thumbnail-generator | 1.7.10 |
| @uppy/facebook | 1.2.1 | @uppy/transloadit | 1.6.25 |
| @uppy/file-input | 1.5.1 | @uppy/tus | 1.9.1 |
| @uppy/form | 1.3.30 | @uppy/unsplash | 0.1.12 |
| @uppy/golden-retriever | 1.4.1 | @uppy/url | 1.5.22 |
| @uppy/google-drive | 1.7.1 | @uppy/utils | 3.6.1 |
| @uppy/image-editor | 0.2.6 | @uppy/vue | 0.2.4 |
| @uppy/informer | 1.6.5 | @uppy/webcam | 1.8.11 |
| @uppy/instagram | 1.5.1 | @uppy/xhr-upload | 1.7.4 |
| @uppy/locales | 1.20.1 | @uppy/zoom | 0.1.17 |
| @uppy/onedrive | 1.2.1 | remark-lint-uppy | 0.0.1 |
| @uppy/progress-bar | 1.3.29 | uppy | 1.29.1 |
| @uppy/provider-views | 1.12.2 | - | - |

- @uppy/golden-retriever: Confirmation before restore, add “ghost” files #443 #257 (#2701 / @arturi)
- @uppy/golden-retriever: Golden retriever 2 fixes (#2895 / @arturi)
- @uppy/companion-client: rethrow original error objects (#2889 / @goto-bus-stop)
- @uppy/dashboard: Fix incorrect font in Chrome on the Dashboard (#2887 / @nqst)
- @uppy/url: Add missing companionCookiesRule option (#2898 / @jhen0409)
- @uppy/companion: fix NRP typescript errors (#2884 / @mifi)
- @uppy/companion: support relative redirect URLs in responses (#2901 / @ goto-bus-stop)
- @uppy/core: Add logout, Translator.translate and Translator.translateArray (#2899 / @arturi)

## 1.29.0

Released: 2021-05-27

⚠️ This release was deprecated — the `dist` folder with CSS files is missing in most of the released packages, due to a build error. Please upgrade to `1.29.1`.

## 1.28.1

Released: 2021-05-11

In this release the individual file progress in Dashboard was fixed.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/companion | 2.9.0 | @uppy/robodog | 1.10.9 |
| @uppy/core | 1.18.1 | @uppy/svelte | 0.1.9 |
| @uppy/dashboard | 1.19.1 | @uppy/vue | 0.2.2 |
| @uppy/react | 1.11.8 | uppy | 1.28.1 |

- @uppy/companion: add chunkSize companion option (#2881 / @mifi)
- @uppy/dashboard: fix individual progress by renaming camelCased svg properties (#2882 / @arturi)

## 1.28.0

Released: 2021-05-05

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/box | 0.3.9 | @uppy/robodog | 1.10.8 |
| @uppy/companion | 2.8.0 | @uppy/screen-capture | 1.0.18 |
| @uppy/core | 1.18.0 | @uppy/svelte | 0.1.8 |
| @uppy/dashboard | 1.19.0 | @uppy/vue | 0.2.1 |
| @uppy/drop-target | 0.2.1 | @uppy/webcam | 1.8.9 |
| @uppy/locales | 1.19.0 | uppy | 1.28.0 |
| @uppy/react | 1.11.7 | - | - |

In this release we’ve added `disableLocalFiles` option to Dashboard, `uppy.logout()` API to log out of all providers at once, upgraded TypeScript and Redis.

- @uppy/companion: Smaller heroku deployment (#2845 / @goto-bus-stop)
- @uppy/companion: Pull out metric middleware logic (#2854 / @mifi)
- @uppy/companion: Bump redis from 2.8.0 to 3.1.1 (#2865 / @dependabot, @ kiloreux)
- @uppy/core: Add uppy.logout() that logs user out of all cloud providers (#2850 / @arturi)
- @uppy/core: Use AggregateError when available (#2869 / @aduh95)
- @uppy/dashboard: Implement disableLocalFiles option — disables drag & drop, hides “browse” and “My Device” buttons (#2852 / @arturi)
- @uppy/webcam: improve MIME type detection to solve issue in iOS Safari (#2851 / @dominiceden)
- @uppy/box: This PR added companion cookies rule to every provider except Box (#2864 / @mazoruss)
- @uppy/react: Add function as allowed prop type (#2873 / @GreenJimmy)
- @uppy/webcam: Add preview for videos made with webcam (#2837 / @Murderlon)
- @uppy/drop-target: Fix npm package name for drop-target (#2857 / @jszobody)
- @uppy/core: Remove outdated comment (#2868 / @aduh95)
- build: Upgrade TypeScript (#2856 / @ajkachnic)
- docs: Update transloadit.md (#2859 / @JimmyLv)

## March 2021

## 1.27.0

Released: 2021-03-31

⚠️ We’ve switched to npm 7 and Workspaces in this one, you need to upgrade to npm 7 to contribute to Uppy. Thanks!

In this release we’ve improved testing DX and CORS handling in Companion, added “shared with me” documents in Google Drive and a new `@uppy/drop-target` plugin.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.15 | @uppy/react-native | 0.1.6 |
| @uppy/aws-s3 | 1.7.9 | @uppy/react | 1.11.6 |
| @uppy/box | 0.3.8 | @uppy/redux-dev-tools | 1.3.8 |
| @uppy/companion-client | 1.9.0 | @uppy/robodog | 1.10.7 |
| @uppy/companion | 2.7.0 | @uppy/screen-capture | 1.0.17 |
| @uppy/core | 1.17.0 | @uppy/status-bar | 1.9.3 |
| @uppy/dashboard | 1.18.0 | @uppy/store-default | 1.2.6 |
| @uppy/drag-drop | 1.4.27 | @uppy/store-redux | 1.2.6 |
| @uppy/drop-target | 0.2.0 | @uppy/svelte | 0.1.7 |
| @uppy/dropbox | 1.4.26 | @uppy/thumbnail-generator | 1.7.8 |
| @uppy/facebook | 1.1.26 | @uppy/transloadit | 1.6.23 |
| @uppy/file-input | 1.4.25 | @uppy/tus | 1.8.7 |
| @uppy/form | 1.3.28 | @uppy/unsplash | 0.1.10 |
| @uppy/golden-retriever | 1.3.27 | @uppy/url | 1.5.20 |
| @uppy/google-drive | 1.6.0 | @uppy/utils | 3.5.0 |
| @uppy/image-editor | 0.2.4 | @uppy/vue | 0.2.0 |
| @uppy/informer | 1.6.3 | @uppy/webcam | 1.8.8 |
| @uppy/instagram | 1.4.26 | @uppy/xhr-upload | 1.7.2 |
| @uppy/locales | 1.18.0 | @uppy/zoom | 0.1.15 |
| @uppy/onedrive | 1.1.26 | remark-lint-uppy | 0.0.0 |
| @uppy/progress-bar | 1.3.27 | uppy | 1.27.0 |
| @uppy/provider-views | 1.12.0 | - | - |

- @uppy/aws-s3-multipart: Aws-s3-multipart sends outdated file info to upload-success event (#2828 / @goto-bus-stop)
- @uppy/aws-s3: removeUploader triggered on uninstall (#2824 / @slawexxx44)
- @uppy/companion: Add additional Google Drive Metadata (#2795 / @ajh-sr)
- @uppy/companion: Feature: add redis pubsub scope setting (#2804 / @coreprocess)
- @uppy/companion: fix running on a subpath (#2841, #2797 / @coreprocess, @goto-bus-stop) 
- @uppy/companion: Fix videoMediaMetadata property name (6cb90c613c5d3b256194e039bfce30d6de6a6dac / @goto-bus-stop)
- @uppy/companion: Improve companion unit testing DX (#2827 / @mifi)
- @uppy/companion: Use `cors` module instead of custom cors logic (#2823 / @mifi)
- @uppy/dashboard: Add dynamic metaFields option (#2834 / @aduh95)
- @uppy/dashboard: add missing doneButtonHandler type to dashboard (#2821 / @Dogfalo)
- @uppy/drop-target — drag and drop files on any existing DOM element (#2836 / @arturi)
- @uppy/google-drive: Google drive shared with me (#2758 / @mifi)
- @uppy/image-editor: Fix flipHorizontal string (#2815 / @suchoproduction)
- @uppy/locales: Update sk_SK.js (#2814 / @suchoproduction)
- @uppy/vue: Vue 3 support (#2755 / @ajkachnic, @arturi)
- @uppy/webcam: Fix issue where the modes: `['audio-only']` option was ignored when getting tracks from the media stream (#2810 / @dominiceden)
- @uppy/xhr-upload: Set headers just before the upload in case options changed (#2781 / @rart)
- docs: uploadStarted should say true (#2829 / @timodwhit)
- docs: Add a README.md specific to bundles (#2816 / @kvz)
- docs: Corrected hanging sentence in Svelte documentation, added an example (#2842 / @Abourass)
- website: Website improvements (#2803 / @nqst)
- build: Upgrade to eslint-config-transloadit@1.2.0 (#2830 / @kvz)
- build: Update Linter (#2796 / @kvz)
- build: error on import lint failure + some misc lint fixes (#2813 / @goto-bus-stop)
- build: Workspaces and NPM 7 (#2835 / @goto-bus-stop)

## 1.26.1

Released: 2021-03-10

⚠️ This release fixes a DOS vulnerability in Companion if you were *not* using S3 uploads.
We recommend updating ASAP if you run your own Companion instance.

It also adds typescript typings for Companion.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.14 | @uppy/progress-bar | 1.3.26 |
| @uppy/aws-s3 | 1.7.8 | @uppy/provider-views | 1.11.2 |
| @uppy/box | 0.3.7 | @uppy/react | 1.11.5 |
| @uppy/companion-client | 1.8.3 | @uppy/robodog | 1.10.6 |
| @uppy/companion | 2.6.0 | @uppy/screen-capture | 1.0.16 |
| @uppy/core | 1.16.2 | @uppy/status-bar | 1.9.2 |
| @uppy/dashboard | 1.17.1 | @uppy/svelte | 0.1.6 |
| @uppy/drag-drop | 1.4.26 | @uppy/thumbnail-generator | 1.7.7 |
| @uppy/dropbox | 1.4.25 | @uppy/transloadit | 1.6.22 |
| @uppy/facebook | 1.1.25 | @uppy/tus | 1.8.6 |
| @uppy/file-input | 1.4.24 | @uppy/unsplash | 0.1.9 |
| @uppy/form | 1.3.27 | @uppy/url | 1.5.19 |
| @uppy/golden-retriever | 1.3.26 | @uppy/utils | 3.4.2 |
| @uppy/google-drive | 1.5.25 | @uppy/vue | 0.1.7 |
| @uppy/image-editor | 0.2.3 | @uppy/webcam | 1.8.7 |
| @uppy/informer | 1.6.2 | @uppy/xhr-upload | 1.7.1 |
| @uppy/instagram | 1.4.25 | @uppy/zoom | 0.1.14 |
| @uppy/onedrive | 1.1.25 | uppy | 1.26.1 |

- @uppy/companion: fix crash when S3 is not configured (#2798 / @goto-bus-stop)
- @uppy/companion: generate type declaration file (#2749 / @goto-bus-stop)
- @uppy/core: support Vue 3's proxied objects in `removePlugin()` (#2793 / @arturi)

## February 2021

## 1.26.0

Released: 2021-02-26

This release adds a new `disabled` option for the Dashboard, some build system improvements and a fix for Transloadit plugin.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/box | 0.3.6 | @uppy/robodog | 1.10.5 |
| @uppy/dashboard | 1.17.0 | @uppy/screen-capture | 1.0.15 |
| @uppy/dropbox | 1.4.24 | @uppy/svelte | 0.1.5 |
| @uppy/facebook | 1.1.24 | @uppy/transloadit | 1.6.21 |
| @uppy/google-drive | 1.5.24 | @uppy/unsplash | 0.1.8 |
| @uppy/image-editor | 0.2.2 | @uppy/url | 1.5.18 |
| @uppy/instagram | 1.4.24 | @uppy/vue | 0.1.6 |
| @uppy/locales | 1.17.2 | @uppy/webcam | 1.8.6 |
| @uppy/onedrive | 1.1.24 | @uppy/zoom | 0.1.13 |
| @uppy/react | 1.11.4 | uppy | 1.26.0 |

- build: set legacy-peer-deps for npm 7. We have some peerDependency mismatches in our install tree. In npm 6 this was OK (maybe reason for a warning) but in npm 7 they hard fail the install
- build: added npm version check (33e656cad32b865f960dbd88abf4d3839c8377f0 / @goto-bus-stop)
- @uppy/locales: fix Dutch spelling mistake (#2775 / @janwilts)
- @uppy/transloadit: make url concatenation more robust (#2777 /@ethanwillis)
- @uppy/companion: Docker tag release (#2771 / @kiloreux)
- @uppy/image-editor: Added missing @uppy/utils dependency in @uppy/image-editor package.json (#2770 / @mrogelja)
- @uppy/dashboard: Added `opts.disabled` for the Dashboard (#2768, #1530 / @arturi, @nqst)

## 1.25.2

Released: 2021-02-12

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/robodog | 1.10.4 | uppy | 1.25.2 |
| @uppy/transloadit | 1.6.20 | - | - |

- @uppy/transloadit: fix a case where the plugin used stale file data. (@goto-bus-stop)

## 1.25.1

Released: 2021-02-10

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.13 | @uppy/provider-views | 1.11.1 |
| @uppy/aws-s3 | 1.7.7 | @uppy/react | 1.11.3 |
| @uppy/box | 0.3.5 | @uppy/robodog | 1.10.3 |
| @uppy/companion-client | 1.8.2 | @uppy/screen-capture | 1.0.14 |
| @uppy/companion | 2.5.1 | @uppy/status-bar | 1.9.1 |
| @uppy/core | 1.16.1 | @uppy/svelte | 0.1.4 |
| @uppy/dashboard | 1.16.1 | @uppy/thumbnail-generator | 1.7.6 |
| @uppy/drag-drop | 1.4.25 | @uppy/transloadit | 1.6.19 |
| @uppy/dropbox | 1.4.23 | @uppy/tus | 1.8.5 |
| @uppy/facebook | 1.1.23 | @uppy/unsplash | 0.1.7 |
| @uppy/file-input | 1.4.23 | @uppy/url | 1.5.17 |
| @uppy/form | 1.3.26 | @uppy/utils | 3.4.1 |
| @uppy/golden-retriever | 1.3.25 | @uppy/vue | 0.1.5 |
| @uppy/google-drive | 1.5.23 | @uppy/webcam | 1.8.5 |
| @uppy/informer | 1.6.1 | @uppy/xhr-upload | 1.7.0 |
| @uppy/instagram | 1.4.23 | @uppy/zoom | 0.1.12 |
| @uppy/onedrive | 1.1.23 | uppy | 1.25.1 |
| @uppy/progress-bar | 1.3.25 | - | - |

- @uppy/companion: Companion should respect previously set value for Accesss-Control-Allow-Methods (#2726 / @tim-kos, @mifi, @so-steve)
- @uppy/xhr-upload: accept a `headers: (file) => {}` function (#2747, #2299 / @goto-but-stop)
- @uppy/transloadit: fix polling fallback bugs (#2759 / @goto-bus-stop)
- @uppy/dashboard: fix showing showProgressDetails on md and up (#2760 / @goto-bus-stop)
- @uppy/utils: added mp4 file type support — Safari 14.0 on Mac records audio using audio/mp4 MIME type which isn't currently recognised by Uppy (#2753 / @dominiceden)

## January 2021

### 1.25.0

Released: 2021-01-28

This release adds support for right-to-left scripts, and includes Box in the Uppy CDN.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.12 | @uppy/provider-views | 1.11.0 |
| @uppy/aws-s3 | 1.7.6 | @uppy/react | 1.11.2 |
| @uppy/box | 0.3.4 | @uppy/robodog | 1.10.2 |
| @uppy/companion-client | 1.8.1 | @uppy/screen-capture | 1.0.13 |
| @uppy/core | 1.16.0 | @uppy/status-bar | 1.9.0 |
| @uppy/dashboard | 1.16.0 | @uppy/svelte | 0.1.3 |
| @uppy/drag-drop | 1.4.24 | @uppy/thumbnail-generator | 1.7.5 |
| @uppy/dropbox | 1.4.22 | @uppy/transloadit | 1.6.18 |
| @uppy/facebook | 1.1.22 | @uppy/tus | 1.8.4 |
| @uppy/file-input | 1.4.22 | @uppy/unsplash | 0.1.6 |
| @uppy/form | 1.3.25 | @uppy/url | 1.5.16 |
| @uppy/golden-retriever | 1.3.24 | @uppy/utils | 3.4.0 |
| @uppy/google-drive | 1.5.22 | @uppy/vue | 0.1.4 |
| @uppy/informer | 1.6.0 | @uppy/webcam | 1.8.4 |
| @uppy/instagram | 1.4.22 | @uppy/xhr-upload | 1.6.10 |
| @uppy/onedrive | 1.1.22 | @uppy/zoom | 0.1.11 |
| @uppy/progress-bar | 1.3.24 | uppy | 1.25.0 |

- @uppy/dashboard, @uppy/core: improve support for right-to-left scripts (Arabic, Hebrew) (#2705 / @goto-bus-stop)
- uppy: add Box to Uppy CDN (cfb29dda085c0cf76f7c7f9df42d8fe727c33da3 / @arturi)

### 1.24.1

Released: 2021-01-27

In this release Companion gains support for setting 3rd party credentials in runtime and will now pass metadata to S3. Ukrainian locale has been added.

This releases also fixes an issue with image-editor package being unavailable in the previous `uppy@1.24.0` package.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.11 | @uppy/react-native | 0.1.5 |
| @uppy/aws-s3 | 1.7.5 | @uppy/react | 1.11.1 |
| @uppy/box | 0.3.3 | @uppy/redux-dev-tools | 1.3.7 |
| @uppy/companion-client | 1.8.0 | @uppy/robodog | 1.10.1 |
| @uppy/companion | 2.5.0 | @uppy/screen-capture | 1.0.12 |
| @uppy/core | 1.15.1 | @uppy/status-bar | 1.8.2 |
| @uppy/dashboard | 1.15.0 | @uppy/store-default | 1.2.5 |
| @uppy/drag-drop | 1.4.23 | @uppy/store-redux | 1.2.5 |
| @uppy/dropbox | 1.4.21 | @uppy/svelte | 0.1.2 |
| @uppy/facebook | 1.1.21 | @uppy/thumbnail-generator | 1.7.4 |
| @uppy/file-input | 1.4.21 | @uppy/transloadit | 1.6.17 |
| @uppy/form | 1.3.24 | @uppy/tus | 1.8.3 |
| @uppy/golden-retriever | 1.3.23 | @uppy/unsplash | 0.1.5 |
| @uppy/google-drive | 1.5.21 | @uppy/url | 1.5.15 |
| @uppy/image-editor | 0.2.1 | @uppy/utils | 3.3.1 |
| @uppy/informer | 1.5.15 | @uppy/vue | 0.1.3 |
| @uppy/instagram | 1.4.21 | @uppy/webcam | 1.8.3 |
| @uppy/locales | 1.17.1 | @uppy/xhr-upload | 1.6.9 |
| @uppy/onedrive | 1.1.21 | @uppy/zoom | 0.1.10 |
| @uppy/progress-bar | 1.3.23 | uppy | 1.24.1 |
| @uppy/provider-views | 1.10.0 | - | - |

- uppy: added @uppy/image-editor to package.json (2f11dcc65307d23a43fdaa669bc92cd6f912b54f/ @arturi, @koenvu)
- @uppy/companion: configurable oauth 3rd party credentials — provide your own Google Drive, Instagram application key/secret at request time (#2622 / @ife)
- @uppy/companion: delete tus error's originalRequest field before propagating error (#2733 / @ife)
- @uppy/companion: pass-through metadata to S3, fixes #2531 (goto-bus-stop / #2742)
- @uppy/companion: use multi-stage docker build (#2732 / @kiloreux)
- @uppy/locales: added Ukrainian localization (uk-UA) (#2713 / @DenysNosov)
- @uppy/locales: fixed Russian grammar (#2714 / @DenysNosov)
- @uppy/dashboard: emit fileId on both file-edit-start and file-edit-complete events (#2729 / @arturi)
- build: fixes around Github actions and Companion deploys (#2717 / @kiloreux)
- docs: Add Integration Guide (#2696 / @ajkachnic)
- docs: list required permissions to upload S3 files using companion (#1825 / @mkopinsky)
- docs: remove warning about multiple uploads on S3 which is now fixed (#2720 / @Jbithell)
- docs: update xhrupload.md (#2731 / @hxgf)
- @uppy/companion-client: support options cookies send rule (#2618 / @ifedapoolarewaju)
- meta: add all the CI badges (#2725 / @goto-bus-stop, @arturi)


## December 2020

### 1.24.0

Released: 2020-12-23

This release adds new Svelte wrapper components, a React FileInput component, and an `autoOpenFileEditor` option for the Dashboard.

The `uppy@1.24.0` package was deprecated due to @uppy/image-editor missing from package.json, it is fixed in v1.24.1. This only affects the “bundled/CDN” `uppy` package.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.10 | @uppy/progress-bar | 1.3.22 |
| @uppy/aws-s3 | 1.7.4 | @uppy/provider-views | 1.9.2 |
| @uppy/box | 0.3.2 | @uppy/react | 1.11.0 |
| @uppy/companion-client | 1.7.0 | @uppy/robodog | 1.10.0 |
| @uppy/companion | 2.4.0 | @uppy/screen-capture | 1.0.11 |
| @uppy/core | 1.15.0 | @uppy/status-bar | 1.8.1 |
| @uppy/dashboard | 1.14.0 | @uppy/svelte | 0.1.1 |
| @uppy/drag-drop | 1.4.22 | @uppy/thumbnail-generator | 1.7.3 |
| @uppy/dropbox | 1.4.20 | @uppy/transloadit | 1.6.16 |
| @uppy/facebook | 1.1.20 | @uppy/tus | 1.8.2 |
| @uppy/file-input | 1.4.20 | @uppy/unsplash | 0.1.4 |
| @uppy/form | 1.3.23 | @uppy/url | 1.5.14 |
| @uppy/golden-retriever | 1.3.22 | @uppy/utils | 3.3.0 |
| @uppy/google-drive | 1.5.20 | @uppy/vue | 0.1.2 |
| @uppy/image-editor | 0.2.0 | @uppy/webcam | 1.8.2 |
| @uppy/informer | 1.5.14 | @uppy/xhr-upload | 1.6.8 |
| @uppy/instagram | 1.4.20 | @uppy/zoom | 0.1.9 |
| @uppy/onedrive | 1.1.20 | uppy | 1.24.0 |

- @uppy/svelte: add Svelte integration (#2671 / @ajkachnic, @adammedford)
- @uppy/core: new event `files-added` with all files added in one batch (#2681 / @arturi)
- @uppy/react: add useUppy() hook (#2666 / @goto-bus-stop)
- @uppy/react: add FileInput component to React (#2706 / @ajkachnic)
- @uppy/status-bar: corrected StatusBar types (#2697 / @ajkachnic)
- @uppy/utils: Add archive mime types (#2703 / @ahmedkandel)
- @uppy/dashboard: add autoopen for file editors (@uppy/image-editor) (#2681 / @arturi)
- meta: use `tusd.tusdemo.net` (#2691 / @goto-bus-stop)

### 1.23.3

Released: 2020-12-11

This release fixes a peerDependency mismatch in `@uppy/companion` and a mistake in the return type for `uppy.addFile()`.

And thanks to @elkebab, Norwegian (bokmål) translations are now available!

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.9 | @uppy/provider-views | 1.9.1 |
| @uppy/box | 0.3.1 | @uppy/react | 1.10.12 |
| @uppy/companion | 2.3.1 | @uppy/robodog | 1.9.13 |
| @uppy/core | 1.14.2 | @uppy/thumbnail-generator | 1.7.2 |
| @uppy/dashboard | 1.13.1 | @uppy/transloadit | 1.6.15 |
| @uppy/dropbox | 1.4.19 | @uppy/tus | 1.8.1 |
| @uppy/facebook | 1.1.19 | @uppy/unsplash | 0.1.3 |
| @uppy/google-drive | 1.5.19 | @uppy/vue | 0.1.1 |
| @uppy/instagram | 1.4.19 | @uppy/zoom | 0.1.8 |
| @uppy/locales | 1.17.0 | uppy | 1.23.3 |
| @uppy/onedrive | 1.1.19 | - | - |

- @uppy/aws-s3-multipart: expand result as body on success (#2623 / @abannach)
- @uppy/companion: fix crash when Dropbox API returns an error (#2687 / @ifedapoolarewaju)
- @uppy/companion: remove unnecessary `fs.stat()` call (#2683 / @mejiaej)
- @uppy/companion: upgrade express-prom-bundle to v6 (#2689 / @goto-bus-stop)
- @uppy/core: `addFile()` returns `string`, not `void` (#2685 / @arturi)
- @uppy/locales: add Norwegian (bokmål) (#2677 / @elkebab)
- @uppy/thumbnail-generator: upgrade exifr to v6 (#2667 / @goto-bus-stop)
- @uppy/unsplash: needs @uppy/core to be `^1.13.3` (#2676 / @ifedapoolarewaju)

## November 2020

### 1.23.2

Released: 2020-11-27

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3 | 1.7.3 | @uppy/robodog | 1.9.12 |
| @uppy/companion | 2.3.0 | @uppy/status-bar | 1.8.0 |
| @uppy/core | 1.14.1 | @uppy/vue | 0.1.0 |
| @uppy/dashboard | 1.13.0 | @uppy/xhr-upload | 1.6.7 |
| @uppy/react | 1.10.11 | uppy | 1.23.2 |

This release brings Vue.js support to Uppy! 💥 Plus a “Done” button for Status Bar, to close the Dashboard modal when an upload is finished.

- @uppy/vue: add Vue.js wrapper component for the Dashboard (#2500 / @ajkachnic)
- @uppy/core: pass files array to _checkRestrictions (#2655 / @arturi)
- @uppy/status-bar, @uppy/dashboard: Added “Done” button for when upload is successfully finished (#2653 / @arturi, @nqst)
- @uppy/dashboard: show the edit button only when !uploadInProgressOrComplete (55d38e7b5fd0d1031caa5b3316fc7c85407ffac7 / @arturi)
- @uppy/xhr-upload: Add missing option types to XHRUploadOptions (#2639 / @wbaaron)
- docs: Updated website docs, added total upload progress event (#2637 / @mkabatek)
- test: added test DeepFrozenStore with deepFreeze to try and assert that state in not mutated anywhere by accident (#2607 / @arturi)
- build: switched from Travis to GitHub Actions (@goto-bus-stop)
- meta: separated backlog from CHANGELOG.md into BACKLOG.md (#2646 / @azizk)

### 1.23.1

Released: 2020-11-16

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/box | 0.3.0 | @uppy/transloadit | 1.6.14 |
| @uppy/companion | 2.2.0 | @uppy/tus | 1.8.0 |
| @uppy/image-editor | 0.1.8 | uppy | 1.23.1 |
| @uppy/robodog | 1.9.11 | - | - |

This release introduces a new Box provider plugin.

- @uppy/box: Box provider implementation (#2549 / @cartfisk, @ifedapoolarewaju)
- @uppy/box: Fix the thumbnail for Box provider (#2630 / @ifedapoolarewaju)
- @uppy/image-editor: zoom button and types fix (#2632 / @arturi)
- @uppy/companion: fix box provider tests + remove unused e2e test files (#2628 / @ifedapoolarewaju)
- @uppy/tus: tus: add `onBeforeRequest` option (#2611 / @bedgerotto, @Acconut)
- @uppy/companion: catch errors when fetching dropbox user email (#2627 /@ifedapoolarewaju)

### 1.23.0

Released: 2020-11-13

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.8 | @uppy/progress-bar | 1.3.21 |
| @uppy/aws-s3 | 1.7.2 | @uppy/provider-views | 1.9.0 |
| @uppy/companion-client | 1.6.1 | @uppy/react | 1.10.10 |
| @uppy/companion | 2.1.1 | @uppy/redux-dev-tools | 1.3.6 |
| @uppy/core | 1.14.0 | @uppy/robodog | 1.9.10 |
| @uppy/dashboard | 1.12.10 | @uppy/screen-capture | 1.0.10 |
| @uppy/drag-drop | 1.4.21 | @uppy/status-bar | 1.7.8 |
| @uppy/dropbox | 1.4.18 | @uppy/thumbnail-generator | 1.7.1 |
| @uppy/facebook | 1.1.18 | @uppy/transloadit | 1.6.13 |
| @uppy/file-input | 1.4.19 | @uppy/tus | 1.7.9 |
| @uppy/form | 1.3.22 | @uppy/unsplash | 0.1.2 |
| @uppy/golden-retriever | 1.3.21 | @uppy/url | 1.5.13 |
| @uppy/google-drive | 1.5.18 | @uppy/utils | 3.2.5 |
| @uppy/image-editor | 0.1.7 | @uppy/webcam | 1.8.1 |
| @uppy/informer | 1.5.13 | @uppy/xhr-upload | 1.6.6 |
| @uppy/instagram | 1.4.18 | @uppy/zoom | 0.1.7 |
| @uppy/locales | 1.16.10 | uppy | 1.23.0 |
| @uppy/onedrive | 1.1.18 | - | - |

Optional buttons for the Image Editor, @uppy/core `infoTimeout` option and Robodog fixes.

- @uppy/image-editor: Image Editor optional buttons (#2615 / @lamartire, @arturi)
- @uppy/image-editor: show “edit” icon even when metaFields are not specified (#2614 / @arturi)
- @uppy/dashboard: Uppy console logging within hideAllPanels (#2597 / @onassar)
- @uppy/robodog: Update addTransloaditPlugin.js to include missing configurable Transloadit plugin options (#2612 / @ethanwillis)
- @uppy/provider-views: add `uppy.validateRestrictions(file, files)` and disallow selecting files that don’t pass restrictions in providers (#2602 / @arturi, @lakesare)
- @uppy/core: add `uppy.opts.infoTimeout` (#2619 / @arturi)
- @uppy/onedrive: fix OneDrive for Business (#2536 / @szh)
- build: use new releases domain (#2608 / @kvz)
- website: switch to xhr-server.herokuapp.com endpoint (@arturi)

## October 2020

### 1.22.0

Released: 2020-10-29

- @uppy/companion: add option to hide welcome and metrics (#2521 / @szh)
- @uppy/companion: add more test cases to companion tests (#2585 / @ifedapoolarewaju)
- @uppy/companion: upgrade prometheus (fixes memory leak) (#2600 / @ifedapoolarewaju)
- @uppy/unsplash: add Unsplash provider (#2431 / @ifedapoolarewaju)
- @uppy/locales: update th_TH.js (#2571 / @dogrocker)
- @uppy/locales: add missing camera translations to de_DE (#2574 / @ferdiusa)
- @uppy/locales: update el_GR.js with more proper wording for Drag'n'Drop (#2578 / @aalepis)
- @uppy/core: core: add maxTotalFileSize restriction #514 (#2594 / @arturi)
- @uppy/core: add postprocess progress when upload success (#2535 / @mejiaej)
- @uppy/webcam: add video source selector (#2492 / @goto-bus-stop, @arturi)
- @uppy/react: Webpack5: Fix react imports (#2589 / @olemoign)
- @uppy/thumbnail-generator: Add support for png thumbnails (#2603 / @SxDx)
- website: mobile issues fixes + compact Companion migration table (#2593 / @nqst)

### 1.21.2

Released: 2020-10-02

Fixed nesting folder uploading from third-party providers, included Zoom meeting name in the file name.

- website: Fix XHR upload demos, fixes #2517 (#2537 / @goto-bus-stop)
- docs: Corrected localhost URL to actual URL (#2543 / @adritasharma)
- docs: Include required CSS import (#2548 / @Gkleinereva)
- @uppy/provider-views: szh fix username not updating when switching OneDrive accounts (#2538 / @szh)
- @uppy/provider-views: Add support for uploading nested folders (#2557 / @mokutsu-coursera)
- @uppy/dashboard: Fix missing `preact.h` import, enable lint for that (25b232eccc04795a869ff60eb6453180e41cdd03 / @goto-bus-stop)
- @uppy/tus: add withCredentials, fix #2518 (#2544 / @szh)
- @uppy/zoom: Include meeting name in file name, and include meeting data in response object so it is available in later uppy lifecycle methods when interacting with file object (#2547 / @mokutsu-coursera)

## September 2020

### 1.21.1

Released: 2020-09-16

Zoom fixes and  preact-css-transition-group removed.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/companion | 2.0.1 | @uppy/onedrive | 1.1.15 |
| @uppy/dashboard | 1.12.7 | @uppy/provider-views | 1.7.6 |
| @uppy/dropbox | 1.4.15 | @uppy/react | 1.10.7 |
| @uppy/facebook | 1.1.15 | @uppy/robodog | 1.9.7 |
| @uppy/google-drive | 1.5.15 | @uppy/transloadit | 1.6.10 |
| @uppy/instagram | 1.4.15 | @uppy/zoom | 0.1.4 |
| @uppy/locales | 1.16.7 | uppy | 1.21.1 |

- @uppy/locales: added pt_PT and fixed some typos in pt_BR (#2510 / @Jmales)
- @uppy/locales: fixed translation of uploadingX in french locale (#2523 / @phil714)
- @uppy/zoom: omit timeline files and fix cc type files for zoom provider (#2508 / @mokutsu-coursera)
- @uppy/zoom: update the pagination limit / boundary on the zoom provider (#2511 / @mokutsu-coursera)
- @uppy/zoom: fix cases where a meeting UUID has slashes (#2526 / @mokutsu-coursera)
- @uppy/zoom: fix meeting timestamp for user timezones and explicitly include moment-timezone dependency (#2525 / @mokutsu-coursera)
- @uppy/dashboard: fix truncation and ellipses for very long file names (#2533 / @mokutsu-coursera)
- @uppy/dashboard: remove preact-css-transition-group (#2444 / @goto-bus-stop)
- @uppy/provider-views: fix mutating state where not intended (#2504 / @johnnyperkins)
- docs: Update readme pages for npm (#2527 / @mokutsu-coursera)
- build: fix overeager regex in website examples build (@goto-bus-stop)

### 1.21.0

Released: 2020-09-07

This is mostly a Companion 2.0 release 🎉

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.6 | @uppy/provider-views | 1.7.5 |
| @uppy/aws-s3 | 1.7.0 | @uppy/react-native | 0.1.4 |
| @uppy/companion-client | 1.5.4 | @uppy/react | 1.10.6 |
| @uppy/companion | 2.0.0 | @uppy/redux-dev-tools | 1.3.5 |
| @uppy/core | 1.13.2 | @uppy/robodog | 1.9.6 |
| @uppy/dashboard | 1.12.6 | @uppy/screen-capture | 1.0.8 |
| @uppy/drag-drop | 1.4.19 | @uppy/status-bar | 1.7.6 |
| @uppy/dropbox | 1.4.14 | @uppy/store-default | 1.2.4 |
| @uppy/facebook | 1.1.14 | @uppy/store-redux | 1.2.4 |
| @uppy/file-input | 1.4.17 | @uppy/thumbnail-generator | 1.6.7 |
| @uppy/form | 1.3.20 | @uppy/transloadit | 1.6.9 |
| @uppy/golden-retriever | 1.3.19 | @uppy/tus | 1.7.6 |
| @uppy/google-drive | 1.5.14 | @uppy/url | 1.5.11 |
| @uppy/image-editor | 0.1.6 | @uppy/utils | 3.2.3 |
| @uppy/informer | 1.5.11 | @uppy/webcam | 1.7.0 |
| @uppy/instagram | 1.4.14 | @uppy/xhr-upload | 1.6.4 |
| @uppy/locales | 1.16.6 | @uppy/zoom | 0.1.3 |
| @uppy/onedrive | 1.1.14 | uppy | 1.21.0 |
| @uppy/progress-bar | 1.3.19 | - | - |

- @uppy/webcam: add `videoConstraints` option (#2362 / @ksouthworth)
- @uppy/screen-capture: fix translations for capturing (#2482 / @leaanthony)
- @uppy/companion: add calculated content-length for multipart uploads (#2466 / @ifedapoolarewaju, @mejiaej)
- @uppy/companion: validate url for truthy value (#2484 / @ifedapoolarewaju)
- @uppy/companion: Support running standalone with custom options (#2428 / @cyu)
- @uppy/react-native: Fix react native expo permissions (#2418 / @ajkachnic)
- @uppy/companion: fix multipart upload (#2490 / @ifedapoolarewaju)
- @uppy/companion: exclude non downloadable files in fetched list for dropbox (#2493 / @johnnyperkins)
- @uppy/aws-s3-multipart: fix stuck upload with `limit: 1` (#2475 / @goto-bus-stop)
- @uppy/aws-s3: add default locale for MiniXHRUpload, fixes #2459 (#2477 / @goto-bus-stop)
- @uppy/locales: fix missleading strings for zh_CN (#2498 / @sparanoid)
- @uppy/locales: Improve fa_IR Translations (#2494 / @ghasrfakhri)
- @uppy/aws-s3: Improved validateParameters() error message (#2480 / @kode-ninja)
- @uppy/companion: remove support for legacy instagram API (#2499 / @ifedapoolarewaju)
- @uppy/react-native: fix lint (@goto-bus-stop)
- Update Jest to v26, raise Companion requirements to Node.js >= 10.20.1 (#2472 / @goto-bus-stop)

### 1.20.2

Released: 2020-08-17

This release adds a `deauthorization callback` endpoint to Companion.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.5 | @uppy/provider-views | 1.7.4 |
| @uppy/companion | 2.0.0-alpha.11 | @uppy/react | 1.10.5 |
| @uppy/core | 1.13.1 | @uppy/robodog | 1.9.5 |
| @uppy/dashboard | 1.12.5 | @uppy/screen-capture | 1.0.7 |
| @uppy/dropbox | 1.4.13 | @uppy/status-bar | 1.7.5 |
| @uppy/facebook | 1.1.13 | @uppy/thumbnail-generator | 1.6.6 |
| @uppy/google-drive | 1.5.13 | @uppy/transloadit | 1.6.8 |
| @uppy/image-editor | 0.1.5 | @uppy/tus | 1.7.5 |
| @uppy/instagram | 1.4.13 | @uppy/webcam | 1.6.11 |
| @uppy/locales | 1.16.5 | @uppy/zoom | 0.1.2 |
| @uppy/onedrive | 1.1.13 | uppy | 1.20.2 |

- @uppy/companion: remove ouath scopes for zoom (#2464 / @ifedapoolarewaju)
- @uppy/companion: add deauthorization callback endpoint (#2470 / @ifedapoolarewaju)

### 1.20.1

Released: 2020-08-13

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.4 | @uppy/provider-views | 1.7.3 |
| @uppy/dashboard | 1.12.4 | @uppy/react | 1.10.4 |
| @uppy/dropbox | 1.4.12 | @uppy/robodog | 1.9.4 |
| @uppy/facebook | 1.1.12 | @uppy/transloadit | 1.6.7 |
| @uppy/google-drive | 1.5.12 | @uppy/tus | 1.7.4 |
| @uppy/instagram | 1.4.12 | @uppy/zoom | 0.1.1 |
| @uppy/onedrive | 1.1.12 | uppy | 1.20.1 |

- @uppy/aws-s3-multipart: enable uploading zero-sized files (#2451 / @vedran555)
- @uppy/provider-views: fix incorrect files added count when adding folders (#2439 / @ajkachnic)
- @uppy/transloadit: add auth.expires type (#2457 / @just-mitch, @goto-bus-stop)
- @uppy/tus: docs-deprecate autoRetry (#2347 / @goto-bus-stop)
- @uppy/tus: fix fallback to default `fingerprint` implementation (#2456 / @Acconut, @goto-bus-stop)
- docs: add add-on section to Zoom docs (#2452 / @ifedapoolarewaju)
- docs: add documentation for zoom plugin (#2448 / @ifedapoolarewaju)

### 1.20.0

Released: 2020-08-10

This release fixes the localized text on the Dashboard (again), fixes an issue when repeatedly uploading the same file using the Transloadit plugin, and adds a new restriction, `minFileSize`, thanks to @anthony0030!

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.3 | @uppy/react | 1.10.3 |
| @uppy/companion | 2.0.0-alpha.10 | @uppy/robodog | 1.9.3 |
| @uppy/core | 1.13.0 | @uppy/status-bar | 1.7.4 |
| @uppy/dashboard | 1.12.3 | @uppy/transloadit | 1.6.6 |
| @uppy/image-editor | 0.1.4 | uppy | 1.20.0 |
| @uppy/locales | 1.16.4 | - | - |

- @uppy/aws-s3-multipart: handle server returning numbers as strings (@goto-bus-stop)
- @uppy/companion: make npm run test work on windows (#2399 / @goto-bus-stop)
- @uppy/core: adds minFileSize option (#2394 / @anthony0030)
- @uppy/dashboard: use correct strings on AddFiles UI (#2426 / @goto-bus-stop)
- @uppy/status-bar: specify default string for `retryUpload` (#2442 / @goto-bus-stop)
- @uppy/transloadit: fully disable Tus fingerprinting (#2425 / @goto-bus-stop)
- docs: make global companion install bash line copy-pasteable (#2438 / @goto-bus-stop)
- test: re-enable Safari on Sauce (#2430 / @goto-bus-stop)
- website: enable zoom example conditionally + remove conditional instagram graph example (#2422 / @ifedapoolarewaju)
- website: various fixes (#2433 / @nqst)

### 1.19.2

Released: 2020-07-30

This mostly introduces patches to accommodate for the new `@uppy/zoom` plugin! 🎉

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.2 | @uppy/progress-bar | 1.3.18 |
| @uppy/aws-s3 | 1.6.9 | @uppy/provider-views | 1.7.2 |
| @uppy/companion-client | 1.5.3 | @uppy/react | 1.10.2 |
| @uppy/companion | 2.0.0-alpha.9 | @uppy/redux-dev-tools | 1.3.4 |
| @uppy/core | 1.12.2 | @uppy/robodog | 1.9.2 |
| @uppy/dashboard | 1.12.2 | @uppy/screen-capture | 1.0.6 |
| @uppy/drag-drop | 1.4.18 | @uppy/status-bar | 1.7.3 |
| @uppy/dropbox | 1.4.11 | @uppy/store-default | 1.2.3 |
| @uppy/facebook | 1.1.11 | @uppy/store-redux | 1.2.3 |
| @uppy/file-input | 1.4.16 | @uppy/thumbnail-generator | 1.6.5 |
| @uppy/form | 1.3.19 | @uppy/transloadit | 1.6.5 |
| @uppy/golden-retriever | 1.3.18 | @uppy/tus | 1.7.3 |
| @uppy/google-drive | 1.5.11 | @uppy/url | 1.5.10 |
| @uppy/image-editor | 0.1.3 | @uppy/utils | 3.2.2 |
| @uppy/informer | 1.5.10 | @uppy/webcam | 1.6.10 |
| @uppy/instagram | 1.4.11 | @uppy/xhr-upload | 1.6.3 |
| @uppy/locales | 1.16.3 | @uppy/zoom | 0.1.0 |
| @uppy/onedrive | 1.1.11 | uppy | 1.19.2 |

- @uppy/utils: Add support for AVIF images in thumbnails (#2406 / @ajkachnic)
- @uppy/companion,@uppy/zoom: add implementation for Zoom plugin and Zoom Provider (#2342 / @mokutsu-coursera, @goto-bus-stop)
- @uppy/companion: fix zoom logout endpoint (#2414 / @ifedapoolarewaju)
- @uppy/companion: add extensions to zoom file names (#2415 / @ifedapoolarewaju)

### 1.19.1

Released: 2020-07-29

This is a bugfix release. The breaking change mentioned in 1.19.0 was much more severe than anticipated, because it affected the primary user-facing translation string. 1.19.1 hopes to restore backwards compatibility with all previous 1.x versions. Thanks to [@yaegor](https://github.com/yaegor) for pointing this out and to [@jonathanarbely](https://github.com/jonathanarbely) and [@fingul](https://github.com/fingul) for submitting translations for the new strings for German and Korean!

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.1 | @uppy/provider-views | 1.7.1 |
| @uppy/aws-s3 | 1.6.8 | @uppy/react | 1.10.1 |
| @uppy/companion-client | 1.5.2 | @uppy/redux-dev-tools | 1.3.3 |
| @uppy/core | 1.12.1 | @uppy/robodog | 1.9.1 |
| @uppy/dashboard | 1.12.1 | @uppy/screen-capture | 1.0.5 |
| @uppy/drag-drop | 1.4.17 | @uppy/status-bar | 1.7.2 |
| @uppy/dropbox | 1.4.10 | @uppy/store-default | 1.2.2 |
| @uppy/facebook | 1.1.10 | @uppy/store-redux | 1.2.2 |
| @uppy/file-input | 1.4.15 | @uppy/thumbnail-generator | 1.6.4 |
| @uppy/form | 1.3.18 | @uppy/transloadit | 1.6.4 |
| @uppy/golden-retriever | 1.3.17 | @uppy/tus | 1.7.2 |
| @uppy/google-drive | 1.5.10 | @uppy/url | 1.5.9 |
| @uppy/informer | 1.5.9 | @uppy/utils | 3.2.1 |
| @uppy/instagram | 1.4.10 | @uppy/webcam | 1.6.9 |
| @uppy/locales | 1.16.2 | @uppy/xhr-upload | 1.6.2 |
| @uppy/onedrive | 1.1.10 | uppy | 1.19.1 |
| @uppy/progress-bar | 1.3.17 | - | - |

- @uppy/aws-s3: tighten type checks in default `getUploadParameters()` implementation (#2388 / @johnnyperkins)
- @uppy/dashboard: restore backwards compatibility for the locales (#2397 / @goto-bus-stop)
- @uppy/dashboard: revert Preact X version conflict fix, which was causing new bugs (#2405 / @goto-bus-stop)
- @uppy/locales: add stub value for `browseFiles` for all remaining translations (#2397 / @goto-bus-stop)
- @uppy/locales: add stub value for `browseFiles` for the German translation (#2396 / @jonathanarbely)
- @uppy/locales: tweak Korean wording and add the new `dropPaste*` strings (#2395 / @fingul)
- docs: document shape of file objects (#2371 / @goto-bus-stop)
- docs: document transloadit `waitForXYZ` options better (#2371 / @goto-bus-stop)
- docs: prefer constructor syntax `new Uppy()` over plain call syntax `Uppy()` (#2371 / @goto-bus-stop)
- website: fix a couple of cases where user-provided values were output to HTML unescaped. Thanks [Shivprsad Sammbhare](https://linkedin.com/in/shivprasadsambhare) for the report!

### 1.19.0

Released: 2020-07-21

Note that this release includes a very minor breaking change. If you are using custom translations for the `dropPaste` or `dropPasteImport` locale strings, you need to append the file selection style to the key name. Use `dropPasteFiles`, `dropPasteFolders`, or `dropPasteBoth`, or `dropPasteImportFiles`, `dropPasteImportFolders`, or `dropPasteImportBoth` depending on your dashboard and provider configuration.

- @uppy/image-editor: fix crop/rotate/zoom buttons on mobile (@arturi)
- uppy: remove unstable `ImageEditor` export (@goto-bus-stop)
- docs: document preact required version when writing custom plugins (@jrschumacher)
- @uppy/dashboard: fix preact version conflicts if outer app uses Preact X (#2379 / @goto-bus-stop)
- @uppy/dashboard: add `fileManagerSelectionType` option, allowing users to select folders (#2334 / @bdirito)

### 1.18.0

Released: 2020-07-19

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/companion | 2.0.0-alpha.8 | @uppy/react | 1.9.1 |
| @uppy/dashboard | 1.11.0 | @uppy/robodog | 1.8.0 |
| @uppy/image-editor | 0.1.1 | uppy | 1.18.0 |
| @uppy/locales | 1.16.0 | - | - |

- @uppy/image-editor: 🎉 add long-awaited image cropping, rotation, flipping and zooming (in beta!) (#2370 / @arturi)
- @uppy/companion: override grant's default redirect_uri for consistent provider options (#2364 / @ifedapoolarewaju)

### 1.17.0

Released: 2020-07-15

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.8.0 | @uppy/onedrive | 1.1.9 |
| @uppy/aws-s3 | 1.6.7 | @uppy/progress-bar | 1.3.16 |
| @uppy/companion-client | 1.5.1 | @uppy/provider-views | 1.7.0 |
| @uppy/companion | 2.0.0-alpha.7 | @uppy/react | 1.9.0 |
| @uppy/core | 1.12.0 | @uppy/robodog | 1.7.2 |
| @uppy/dashboard | 1.10.2 | @uppy/screen-capture | 1.0.4 |
| @uppy/drag-drop | 1.4.16 | @uppy/status-bar | 1.7.1 |
| @uppy/dropbox | 1.4.9 | @uppy/thumbnail-generator | 1.6.3 |
| @uppy/facebook | 1.1.9 | @uppy/transloadit | 1.6.2 |
| @uppy/file-input | 1.4.14 | @uppy/tus | 1.7.0 |
| @uppy/form | 1.3.17 | @uppy/url | 1.5.8 |
| @uppy/golden-retriever | 1.3.16 | @uppy/utils | 3.2.0 |
| @uppy/google-drive | 1.5.9 | @uppy/webcam | 1.6.8 |
| @uppy/informer | 1.5.8 | @uppy/xhr-upload | 1.6.1 |
| @uppy/instagram | 1.4.9 | uppy | 1.17.0 |
| @uppy/locales | 1.15.1 | - | - |

- ⚠️ @uppy/companion: rename `microsoft` and `google` providerOptions to `onedrive` and `drive` respectively (#2346 / @ifedapoolarewaju)
- @uppy/aws-s3-multipart: do not store completed parts in state, fixes a resuming bug (#2326 / @yaegor)
- @uppy/aws-s3-multipart: retry uploading failed parts (#2312 / @goto-bus-stop)
- @uppy/companion: dependency updates (#2333 / @goto-bus-stop)
- @uppy/companion: send custom headers to tus uploads (#2338 / @ifedapoolarewaju)
- @uppy/core: add `reason` parameter to the `uppy.removeFile()` method and the `uppy.on('file-removed')` event (#2323 / @arturi)
- @uppy/core: do not create an empty upload in retryAll() if there were no errors (#2361 / @goto-bus-stop)
- @uppy/locales: add missing strings for Simplified Chinese (#2335 / @sparanoid)
- @uppy/tus: update tus-js-client to v2 (#2239 / @Acconut, @goto-bus-stop)
- docs: add authentication setup instructions for Dropbox and Google Drive (#2345 / @goto-bus-stop)
- docs: explain how to use Uppy with React Hooks (#1936 / @pedrofs)

### 1.16.1

Released: 2020-06-19

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/companion | 2.0.0-alpha.6 | - | - |

- @uppy/companion: Import url (#2328 / @ifedapoolarewaju)

Released: 2020-06-18

⚠️ This release patches a Server Side Request Forgery (SSRF) Security vulnerability on `@uppy/companion`

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/companion | 1.13.2, 2.0.0-alpha.5 | @uppy/onedrive | 1.1.8 |
| @uppy/dashboard | 1.10.1 | @uppy/provider-views | 1.6.8 |
| @uppy/drag-drop | 1.4.15 | @uppy/react | 1.8.1 |
| @uppy/dropbox | 1.4.8 | @uppy/robodog | 1.7.1 |
| @uppy/facebook | 1.1.8 | @uppy/thumbnail-generator | 1.6.2 |
| @uppy/google-drive | 1.5.8 | @uppy/transloadit | 1.6.1 |
| @uppy/instagram | 1.4.8 | uppy | 1.16.1 |

- @uppy/thumbnail-generator: upgrade exifr (@goto-bus-stop)
- @uppy/companion: set grant related options for custom providers (#2317 / @ifedapoolarewaju)
- @uppy/provider-views: handle all plugin state in provider-views (#2318 / @ifedapoolarewaju)
- @uppy/drag-drop: Add uppy-DragDrop-input class name back (ab88612dff3ce24b001acb3b626516f0e2f7fd0c / @arturi)
- @uppy/companion: block redirects to urls with different protocol (#2322 / @ifedapoolarewaju)

### 1.16.0

Released: 2020-06-13

This release fixes Drag Drop plugin bug introduced in the previous release (@uppy/drag-drop@1.4.13) and adds NetworkError reporting and `error.isNetworkError` to the Transloadit plugin.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.7.1 | @uppy/onedrive | 1.1.7 |
| @uppy/aws-s3 | 1.6.6 | @uppy/progress-bar | 1.3.15 |
| @uppy/companion-client | 1.5.0 | @uppy/provider-views | 1.6.7 |
| @uppy/companion | 2.0.0-alpha.4 | @uppy/react | 1.8.0 |
| @uppy/core | 1.11.0 | @uppy/robodog | 1.7.0 |
| @uppy/dashboard | 1.10.0 | @uppy/screen-capture | 1.0.3 |
| @uppy/drag-drop | 1.4.14 | @uppy/status-bar | 1.7.0 |
| @uppy/dropbox | 1.4.7 | @uppy/thumbnail-generator | 1.6.1 |
| @uppy/facebook | 1.1.7 | @uppy/transloadit | 1.6.0 |
| @uppy/file-input | 1.4.13 | @uppy/tus | 1.6.0 |
| @uppy/form | 1.3.16 | @uppy/url | 1.5.7 |
| @uppy/golden-retriever | 1.3.15 | @uppy/utils | 3.1.0 |
| @uppy/google-drive | 1.5.7 | @uppy/webcam | 1.6.7 |
| @uppy/informer | 1.5.7 | @uppy/xhr-upload | 1.6.0 |
| @uppy/instagram | 1.4.7 | uppy | 1.16.0 |
| @uppy/locales | 1.15.0 | - | - |

- @uppy/dashboard: Refactor FileProgress component (#2303, #2292 / @arturi, @atsawin)
- @uppy/dashboard:  Move the FileItem’s new ErrorButton, it was overlapping the edit button (0e78e32e4cf50b276ee4a48f1bf57e6be279b539 / @arturi)
- @uppy/drag-drop: Fix the issue with click event occuring twice, try hiding the input altogether (#2307 / @arturi)
- @uppy/transloadit: Add NetworkError handling to Transloadit plugin, refactor things, update docs about `error.isNetworkError` (#2291 / @arturi)
- @uppy/companion: Companion 2.0 (pre-released as alpha for now) (#2273 / @ifedapoolarewaju)
- @uppy/locales: Update of Galician i18n strings. (#2308 / @jarey)
- build: chores: catch custom version suffices (alpha, beta etc.) (#2311 / ifedapoolarewaju)

### 1.15.0

Released: 2020-05-25

This release features Bug Fixes And Performance Improvements™ (actually significant ones), two new languages, and a handful of nifty new Dashboard features.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.7.0 | @uppy/onedrive | 1.1.6 |
| @uppy/aws-s3 | 1.6.5 | @uppy/progress-bar | 1.3.14 |
| @uppy/companion-client | 1.4.5 | @uppy/provider-views | 1.6.6 |
| @uppy/companion | 2.0.0-alpha.3 | @uppy/react | 1.7.0 |
| @uppy/core | 1.10.5 | @uppy/robodog | 1.6.7 |
| @uppy/dashboard | 1.9.0 | @uppy/screen-capture | 1.0.2 |
| @uppy/drag-drop | 1.4.13 | @uppy/status-bar | 1.6.6 |
| @uppy/dropbox | 1.4.6 | @uppy/thumbnail-generator | 1.6.0 |
| @uppy/facebook | 1.1.6 | @uppy/transloadit | 1.5.11 |
| @uppy/file-input | 1.4.12 | @uppy/tus | 1.5.13 |
| @uppy/form | 1.3.15 | @uppy/url | 1.5.6 |
| @uppy/golden-retriever | 1.3.14 | @uppy/utils | 3.0.0 |
| @uppy/google-drive | 1.5.6 | @uppy/webcam | 1.6.6 |
| @uppy/informer | 1.5.6 | @uppy/xhr-upload | 1.5.11 |
| @uppy/instagram | 1.4.6 | uppy | 1.15.0 |
| @uppy/locales | 1.14.0 | - | - |

- @uppy/aws-s3-multipart: make chunk size configurable (#2253 / @goto-bus-stop)
- @uppy/aws-s3: add missing `cuid` dependency (#2236 / @tmaier)
- @uppy/aws-s3: fix accidental overwrite of file metadata (#2276 / @goto-bus-stop)
- @uppy/companion-client: add missing `@uppy/utils` dependency (#2266 / @goto-bus-stop)
- @uppy/companion: fix crash if provider returns an empty error response (#2264 / @ifedapoolarewaju)
- @uppy/companion: ignore environment variables that contain the empty string (#2283 / @ifedapoolarewaju)
- @uppy/companion: validate options when using the Node.js API (#2275 / @ifedapoolarewaju)
- @uppy/core: add more suggestions to console warning when incorrect `target` option is provided (#2242 / @goto-bus-stop)
- @uppy/dashboard: add option to let users remove already uploaded files, UI only (#2284 / @arturi)
- @uppy/dashboard: display error message for individual files (#2224 / @lafe)
- @uppy/dashboard: render only visible files to the DOM (VirtualList) to drastically improve performance (#2161 / @goto-bus-stop)
- @uppy/drag-drop: add a more accessible `<label>` element for the hidden input (#2257 / @arturi)
- @uppy/locales: add Bulgarian `bg_BG` (#2280 / @intenzive)
- @uppy/locales: add Slovakian `sk_SK` (#2261 / @suchoproduction)
- @uppy/progress-bar: hide the progress bar if no upload is in progress (#2252 / @nicojones)
- @uppy/thumbnail-generator: generate 80% quality JPEGs instead of high-quality PNGs for a 30% perf win (#2246 / @goto-bus-stop)
- @uppy/thumbnail-generator: support optional lazy thumbnail generation (#2161 / @goto-bus-stop)
- @uppy/transloadit: add typings for Companion URL constants (#2244 / @goto-bus-stop)
- @uppy/transloadit: fix typo that caused outdated Assembly data in `'complete'` event (#2287 / @goto-bus-stop)
- @uppy/transloadit: when cancelling all uploads, only cancel assemblies that belong to an ongoing upload (#2277 / @goto-bus-stop)
- @uppy/tus: fix tus uploads getting terminated if the file is removed from Uppy after the upload completed (#2262 / @zachconner)
- @uppy/utils: fix typescript typings for the `Translator` constructor (#2263 / @goto-bus-stop)
- @uppy/utils: remove `@uppy/utils/lib/prettyBytes`, use `@transloadit/prettier-bytes` instead (#2231 / @kvz)
- @uppy/webcam: show an "Enable Camera" screen if no camera device is available (#2282 / @arturi)
- website: list Robodog size and sort size stats by plugin name (#2259 / @goto-bus-stop)

### 1.14.1

Released: 2020-05-01

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/companion | 2.0.0-alpha.2 | - | - |

- @uppy/companion: make it node 8 compatible (temporarily) (#2234 / @ifedapoolarewaju)

Released: 2020-04-30

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.6.4 | @uppy/locales | 1.13.3 |
| @uppy/aws-s3 | 1.6.4 | @uppy/onedrive | 1.1.5 |
| @uppy/companion-client | 1.4.4 | @uppy/progress-bar | 1.3.13 |
| @uppy/companion | 2.0.0-alpha.1 | @uppy/react | 1.6.5 |
| @uppy/core | 1.10.4 | @uppy/robodog | 1.6.6 |
| @uppy/dashboard | 1.8.5 | @uppy/screen-capture | 1.0.1 |
| @uppy/drag-drop | 1.4.12 | @uppy/status-bar | 1.6.5 |
| @uppy/dropbox | 1.4.5 | @uppy/thumbnail-generator | 1.5.12 |
| @uppy/facebook | 1.1.5 | @uppy/transloadit | 1.5.10 |
| @uppy/file-input | 1.4.11 | @uppy/tus | 1.5.12 |
| @uppy/form | 1.3.14 | @uppy/url | 1.5.5 |
| @uppy/golden-retriever | 1.3.13 | @uppy/utils | 2.4.4 |
| @uppy/google-drive | 1.5.5 | @uppy/webcam | 1.6.5 |
| @uppy/informer | 1.5.5 | @uppy/xhr-upload | 1.5.10 |
| @uppy/instagram | 1.4.5 | uppy | 1.14.1 |
| @uppy/provider-views | 1.6.5 | - | - |

- @uppy/companion: catch download failures via response status codes (#2223 / @ifedapoolarewaju)
- @uppy/companion: mask secrets present in log messages (#2214 / @ifedapoolarewaju)

### 1.14

Released: 2020-04-29

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.6.3 | @uppy/onedrive | 1.1.4 |
| @uppy/aws-s3 | 1.6.3 | @uppy/progress-bar | 1.3.12 |
| @uppy/companion-client | 1.4.3 | @uppy/provider-views | 1.6.4 |
| @uppy/companion | 2.0.0-alpha.0 | @uppy/react | 1.6.4 |
| @uppy/core | 1.10.3 | @uppy/robodog | 1.6.5 |
| @uppy/dashboard | 1.8.4 | @uppy/screen-capture | 1.0.0 |
| @uppy/drag-drop | 1.4.11 | @uppy/status-bar | 1.6.4 |
| @uppy/dropbox | 1.4.4 | @uppy/thumbnail-generator | 1.5.11 |
| @uppy/facebook | 1.1.4 | @uppy/transloadit | 1.5.9 |
| @uppy/file-input | 1.4.10 | @uppy/tus | 1.5.11 |
| @uppy/form | 1.3.13 | @uppy/url | 1.5.4 |
| @uppy/golden-retriever | 1.3.12 | @uppy/utils | 2.4.3 |
| @uppy/google-drive | 1.5.4 | @uppy/webcam | 1.6.4 |
| @uppy/informer | 1.5.4 | @uppy/xhr-upload | 1.5.9 |
| @uppy/instagram | 1.4.4 | uppy | 1.14.0 |
| @uppy/locales | 1.13.2 | - | - |

- @uppy/aws-s3: fix double encoding of the upload params (#2220 / @romain-preston)
- @uppy/aws-s3: fixing URL constructor use in Safari (#2207 / @NaxYo)
- @uppy/companion: improve obscuring sensitive values in standalone server (#2219 / @goto-bus-stop)
- @uppy/companion: upgrade Companion version used in Heroku setup instructions (#2206 / @zacharylawson)
- @uppy/dashboard: move from white to off-white in Dark Mode (#2222 / @arturi)
- @uppy/locales: various updates to French translation (#2203 / @louim, #2216 / dtrucs)
- @uppy/screen-capture: add a new plugin for recording your device screen (#2132 / @jukakoski & @arturi)
- @uppy/thumbnail-generator: use new exifr.rotation() API  (#2230 / @goto-bus-stop)
- @uppy/utils: remove duplicate check of element type (#2210 / @jrschumacher)

### 1.13.2

Released: 2020-04-15

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.6.2 | @uppy/progress-bar | 1.3.11 |
| @uppy/aws-s3 | 1.6.2 | @uppy/provider-views | 1.6.3 |
| @uppy/companion | 1.13.1 | @uppy/react | 1.6.3 |
| @uppy/core | 1.10.2 | @uppy/robodog | 1.6.4 |
| @uppy/dashboard | 1.8.3 | @uppy/status-bar | 1.6.3 |
| @uppy/drag-drop | 1.4.10 | @uppy/thumbnail-generator | 1.5.10 |
| @uppy/dropbox | 1.4.3 | @uppy/transloadit | 1.5.8 |
| @uppy/facebook | 1.1.3 | @uppy/tus | 1.5.10 |
| @uppy/file-input | 1.4.9 | @uppy/url | 1.5.3 |
| @uppy/form | 1.3.12 | @uppy/utils | 2.4.2 |
| @uppy/golden-retriever | 1.3.11 | @uppy/webcam | 1.6.3 |
| @uppy/google-drive | 1.5.3 | @uppy/xhr-upload | 1.5.8 |
| @uppy/informer | 1.5.3 | remark-lint-uppy | 0.1.1 |
| @uppy/instagram | 1.4.3 | uppy | 1.13.2 |
| @uppy/onedrive | 1.1.3 | - | - |

- @uppy/companion: mimetype could be undefined (#2201 / @ifedapoolarewaju)

### 1.13.1

Released 2020-04-14

Mainly fixes for the Dashboard provider/tab list in IE10 and correct Gsuit file extensions in Companion.

- @uppy/dashboard: Dashboard tablist IE10 flex fix and refactor (#2192 / @arturi)
- @uppy/companion: set debug based on `NODE_ENV` only if the env var is available (#2189 / @ifedapoolarewaju)
- @uppy/companion: fix uploader protocol validation (#2197 / @ifedapoolarewaju)
- @uppy/companion: set GSuite file extensions (#2194 / @ifedapoolarewaju)
- docs: fix minor typo in Dashboard docs (#2193 / @mhulet)
- website: add markdown linting using remark (#2181 / @goto-bus-stop)

### 1.13.0

Released 2020-04-08

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.6.0 | @uppy/onedrive | 1.1.1 |
| @uppy/aws-s3 | 1.6.0 | @uppy/progress-bar | 1.3.9 |
| @uppy/companion | 1.12.0 | @uppy/provider-views | 1.6.1 |
| @uppy/core | 1.10.0 | @uppy/react | 1.6.1 |
| @uppy/dashboard | 1.8.1 | @uppy/robodog | 1.6.2 |
| @uppy/drag-drop | 1.4.8 | @uppy/status-bar | 1.6.1 |
| @uppy/dropbox | 1.4.1 | @uppy/thumbnail-generator | 1.5.8 |
| @uppy/facebook | 1.1.1 | @uppy/transloadit | 1.5.6 |
| @uppy/file-input | 1.4.7 | @uppy/tus | 1.5.8 |
| @uppy/form | 1.3.10 | @uppy/url | 1.5.1 |
| @uppy/golden-retriever | 1.3.9 | @uppy/utils | 2.4.0 |
| @uppy/google-drive | 1.5.1 | @uppy/webcam | 1.6.1 |
| @uppy/informer | 1.5.1 | @uppy/xhr-upload | 1.5.6 |
| @uppy/instagram | 1.4.1 | uppy | 1.13.0 |
| @uppy/locales | 1.13.1 | - | - |

This Release improves Google Drive's GSuite files support to export files to more flexible + popular formats

- @uppy/companion: favor xlsx, docx, ppt formats when export gsuite files (#2182 / @ifedapoolarewaju)
- @uppy/locales: remove legacy translations that have been re-translated (@goto-bus-stop)
- @uppy/companion: use full path for provider URL when the root path depends on user input (#2176 / @ifedapoolarewaju)
- @uppy/aws-s3: handle upload internally instead of deferring to xhr-upload (#2060 / @goto-bus-stop)
- @uppy/aws-s3: fix missing typescript type for `metaFields` option (#1866 / @goto-bus-stop)
- @uppy/robodog: Pass hideUploadButton to Dashboard in Robodog too (#2169 / @arturi)
- @uppy/dashboard: add `theme` option to typescript typings (@goto-bus-stop)
- @uppy/aws-s3-multipart: emit upload-error when companion returns error during upload instantiation (#2168 / @ifedapoolarewaju)

### 1.12.1

Released 2020-04-01

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3 | 1.5.5 | @uppy/tus | 1.5.7 |
| @uppy/robodog | 1.6.1 | @uppy/xhr-upload | 1.5.5 |
| @uppy/transloadit | 1.5.5 | uppy | 1.12.1 |

Patch release to add OneDrive and Facebook to Robodog’s package.json 🙈

- @uppy/tus, @uppy/xhr-upload: emit error when companion returns error during upload creation (#2166 / @ifedapoolarewaju)
- @uppy/robodog: Add facebook and onedrive to package.json (#2167 / @arturi)

### 1.12.0

Released 2020-04-01

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3 | 1.5.4 | @uppy/robodog | 1.6.0 |
| @uppy/companion | 1.11.1 | @uppy/thumbnail-generator | 1.5.7 |
| @uppy/dashboard | 1.8.0 | @uppy/transloadit | 1.5.4 |
| @uppy/locales | 1.13.0 | @uppy/xhr-upload | 1.5.4 |
| @uppy/react | 1.6.0 | uppy | 1.12.0 |

This release adds the Romanian language, more input validation in Companion, and a way to render custom metadata fields in the Dashboard UI.

- @uppy/companion: validate all client provided upload data. (#2160 / @ifedapoolarewaju)
- @uppy/dashboard: allow custom metadata fields when editing files (#2147 / @galli-leo)
- @uppy/locales: Remove obsolete strings from language files. (894c739 / @goto-bus-stop)
- @uppy/locales: Romanian (ro_RO) language pack added. (#2162 / @akizor)
- @uppy/robodog: Add Facebook and OneDrive to the bundle. (#2165 / @arturi)
- @uppy/transloadit: fix progress with very different Assembly runtimes (#2143 / @agreene-coursera)
- build: Fix locale pack test output (#2153 / @goto-bus-stop)
- docs: Fix fragment URL (#2156 / @ishendyweb)
- docs: document `XHRUpload#validateStatus` option. (#2154 / @goto-bus-stop)
- examples: document `npm run build` step. (697ad04 / @goto-bus-stop)

### 1.11.0

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.5.3 | @uppy/onedrive | 1.1.0 |
| @uppy/aws-s3 | 1.5.3 | @uppy/progress-bar | 1.3.8 |
| @uppy/companion | 1.11.0 | @uppy/provider-views | 1.6.0 |
| @uppy/core | 1.9.0 | @uppy/react | 1.5.0 |
| @uppy/dashboard | 1.7.0 | @uppy/robodog | 1.5.4 |
| @uppy/drag-drop | 1.4.7 | @uppy/status-bar | 1.6.0 |
| @uppy/dropbox | 1.4.0 | @uppy/thumbnail-generator | 1.5.6 |
| @uppy/facebook | 1.1.0 | @uppy/transloadit | 1.5.3 |
| @uppy/file-input | 1.4.6 | @uppy/tus | 1.5.6 |
| @uppy/form | 1.3.9 | @uppy/url | 1.5.0 |
| @uppy/golden-retriever | 1.3.8 | @uppy/utils | 2.3.0 |
| @uppy/google-drive | 1.5.0 | @uppy/webcam | 1.6.0 |
| @uppy/informer | 1.5.0 | @uppy/xhr-upload | 1.5.3 |
| @uppy/instagram | 1.4.0 | uppy | 1.11.0 |
| @uppy/locales | 1.12.0 | - | - |

This Release offers Dashboard redesign (Dark mode), and support for Google Docs in Companion.

- @uppy/webcam: Try to respect restrictions (#2090 / @goto-bus-stop)
- @uppy/dashboard: 2020 redesign 🍿 (#2015 / @arturi)
- @uppy/companion: drop parallel down/upload for S3 multipart (#2114 / @goto-bus-stop)
- @uppy/core: add typings for `setOptions()`. (#2135 / @goto-bus-stop)
- @uppy/react: fix typescript proptypes for DashboardModal, fixes #2124 (#2136 / @goto-bus-stop)
- @uppy/companion: emit error to client if download fails (#2139 / @ifedapoolarewaju)
- @uppy/dashboard: Log warning instead of an error when trigger is not found (#2144 / @arturi)
- @uppy/locales: Polish language pack. (#2138 / @alfatv)
- @uppy/companion: add support to download gsuite (google docs, google spreadsheet) files (#2145 / @ifedapoolarewaju)
- @uppy/locales: Croatian translations added (#2150 / @dkisic)
- @uppy/core: Only _startIfAutoProceed if some files were actually added (#2146 / @arturi)
- @uppy/thumbnail-generator: replace exif-js with exifr in thumbnail-generator (#2140 / @MikeKovarik)

### 1.10.1

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/companion | 1.10.0 | uppy | 1.10.1 |
| @uppy/facebook | 1.0.0

This release moves `@uppy/facebook` out of beta to a `1.0.0` and adds `Uppy.Facebook` to the Uppy CDN bundle:

```
https://releases.transloadit.com/uppy/v1.10.1/uppy.min.js
https://releases.transloadit.com/uppy/v1.10.1/uppy.min.css
```

- uppy: add @uppy/facebook to `uppy` NPM and CDN bundles
- @uppy/facebook: Get Facebook integration on its feet (@ifedapoolarewaju)
- website: Add featured customers logos (#2120 / @nqst)

You can optionally download `1.10.1` release bundle: https://releases.transloadit.com/uppy/v1.10.1/uppy-v1.10.1.zip

### 1.10.0

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/companion | 1.10.0 | uppy | 1.10.0 |

This release offers a bunch of Companion improvements and bug fixes.

- @uppy/companion: pass `endpoint` and `region` to AWS SDK constructor (#2113 / @goto-bus-stop)
- @uppy/companion: Allow S3 ACL to be specified in Companion Standalone (#2111 / @jasonbosco)
- @uppy/companion: return 401 early if token is not set (#2118 / @ifedapoolarewaju)
- @uppy/companion: allow providing any S3 option, closes #1388 (#2030 / @goto-bus-stop)
- @uppy/companion:: don’t log redundant errors in production (#2112 / @ifedapoolarewaju)
- docs: Add S3 ACL option to companion docs (#2109 / @jasonbosco)

### 1.9.4

Released 2020-02-28

This release rolls out a fix for companion an issue introduced after [this PR](https://github.com/transloadit/uppy/pull/1668). See [#2096](https://github.com/transloadit/uppy/pull/2096) for more details.

| Package | Version |
|-|-|
| @uppy/companion | 1.9.5 |

- @uppy/companion: read state from session in oauth-redirect controller (#2096 / @ifedapoolarewaju)

Released: 2020-02-27

Previous `1.9.3` release has been deprecated due to broken URL Provider (see [#2094](https://github.com/transloadit/uppy/pull/2094)).

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/companion | 1.9.4 | @uppy/locales | 1.11.5 |

- @uppy/companion: return the right httpAgent when protocol value contains ":" (#2094 / @ifedapoolarewaju)
- @uppy/locales: fix pluralization in pt_BR (#2093 / @fgallinari)

### 1.9.3

Released: 2020-02-26

⚠️ This release patches a Server Side Request Forgery (SSRF) Security vulnerability on `@uppy/companion`

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/companion | 1.9.3 | @uppy/robodog | 1.5.3 |
| @uppy/drag-drop | 1.4.6 | @uppy/webcam | 1.5.5 |
| @uppy/locales | 1.11.4 | uppy | 1.9.3 |
| @uppy/react | 1.4.6 | - | - |

- @uppy/companion: ⚠️ patch SSRF Security vulnerability (#2083 / @ifedapoolarewaju)
- @uppy/webcam: Check the availability isTypeSupported api before calling (#2072 / @naveed-ahmad)
- @uppy/locales: Locale DE_de added new keys. (#2084 / @SpazzMarticus)
- @uppy/locales: Update zh_TW.js (#2075 / @cellvinchung)
- @uppy/drag-drop: add a type test and document shared props (#2003 / @andychongyz)
- @uppy/companion: make s3 signed url expiry configurable in companion (#2085 / @adamelmore)
- build: contributors:save fix — the node.js version (#2078 / @arturi)

### 1.9.2

Released: 2020-02-14

This release adds `@uppy/onedrive` to `uppy`’s `package.json`, fixing the bug reported at https://github.com/transloadit/uppy/commit/f291688fb813c55ff905abb334eff61c1c5a9dd0#commitcomment-37278041, and introduces more robust type checking in #1918.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.5.2 | @uppy/progress-bar | 1.3.7 |
| @uppy/aws-s3 | 1.5.2 | @uppy/provider-views | 1.5.5 |
| @uppy/companion-client | 1.4.2 | @uppy/react | 1.4.5 |
| @uppy/companion | 1.9.2 | @uppy/redux-dev-tools | 1.3.2 |
| @uppy/core | 1.8.2 | @uppy/robodog | 1.5.2 |
| @uppy/dashboard | 1.6.2 | @uppy/status-bar | 1.5.2 |
| @uppy/drag-drop | 1.4.5 | @uppy/store-default | 1.2.1 |
| @uppy/dropbox | 1.3.8 | @uppy/store-redux | 1.2.1 |
| @uppy/facebook | 0.2.5 | @uppy/thumbnail-generator | 1.5.5 |
| @uppy/file-input | 1.4.5 | @uppy/transloadit | 1.5.2 |
| @uppy/form | 1.3.8 | @uppy/tus | 1.5.5 |
| @uppy/golden-retriever | 1.3.7 | @uppy/url | 1.4.5 |
| @uppy/google-drive | 1.4.2 | @uppy/utils | 2.2.2 |
| @uppy/informer | 1.4.2 | @uppy/webcam | 1.5.4 |
| @uppy/instagram | 1.3.8 | @uppy/xhr-upload | 1.5.2 |
| @uppy/locales | 1.11.3 | uppy | 1.9.2 |
| @uppy/onedrive | 1.0.2 | - | - |

- build: Actually check types. Use tsd so our typings test files can actually assert that types are correct (#1918 / @goto-bus-stop )
- @uppy/companion: Only set cookies for providers that need it (#2055 / @ifedapoolarewaju)
- docs: Add Content-Type header to presigned url example (#2061 / @scherroman)
- uppy: Add onedrive to uppy package.json ([349247607513bc6b33bf2a90ab0b82f8f2e81d78](https://github.com/transloadit/uppy/commit/349247607513bc6b33bf2a90ab0b82f8f2e81d78) / @arturi)

### 1.9.1

Released: 2020-02-12

Previous `1.9.0` release has been deprecated due to an incorrect Lerna/npm published release. Please update all packages to the next patch version (or @latest), see the table below.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.5.1 | @uppy/onedrive | 1.0.1 |
| @uppy/aws-s3 | 1.5.1 | @uppy/progress-bar | 1.3.6 |
| @uppy/companion | 1.9.1 | @uppy/provider-views | 1.5.4 |
| @uppy/core | 1.8.1 | @uppy/react | 1.4.4 |
| @uppy/dashboard | 1.6.1 | @uppy/robodog | 1.5.1 |
| @uppy/drag-drop | 1.4.4 | @uppy/status-bar | 1.5.1 |
| @uppy/dropbox | 1.3.7 | @uppy/thumbnail-generator | 1.5.4 |
| @uppy/facebook | 0.2.4 | @uppy/transloadit | 1.5.1 |
| @uppy/file-input | 1.4.4 | @uppy/tus | 1.5.4 |
| @uppy/form | 1.3.7 | @uppy/url | 1.4.4 |
| @uppy/golden-retriever | 1.3.6 | @uppy/utils | 2.2.1 |
| @uppy/google-drive | 1.4.1 | @uppy/webcam | 1.5.3 |
| @uppy/informer | 1.4.1 | @uppy/xhr-upload | 1.5.1 |
| @uppy/instagram | 1.3.7 | uppy | 1.9.1 |
| @uppy/locales | 1.11.2 | - | - |

- @uppy/companion: return more accurate error status codes (#2053 /@ifedapoolarewaju)

### 1.9.0

Released: 2020-02-11

⚠️ `1.9.0` and all related packages have been deprecated due to an incorrect Lerna/npm published release. Please update all packages to the next patch version, see #1.9.1.

This release adds support for the new Instagram API, image and archive icons to the Dashboard, fixes upload retries and moves OneDrive out of beta.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.5.0 | @uppy/onedrive | 1.0.0 |
| @uppy/aws-s3 | 1.5.0 | @uppy/progress-bar | 1.3.5 |
| @uppy/companion | 1.9.0 | @uppy/provider-views | 1.5.3 |
| @uppy/core | 1.8.0 | @uppy/react | 1.4.3 |
| @uppy/dashboard | 1.6.0 | @uppy/robodog | 1.5.0 |
| @uppy/drag-drop | 1.4.3 | @uppy/status-bar | 1.5.0 |
| @uppy/dropbox | 1.3.6 | @uppy/thumbnail-generator | 1.5.3 |
| @uppy/facebook | 0.2.3 | @uppy/transloadit | 1.5.0 |
| @uppy/file-input | 1.4.3 | @uppy/tus | 1.5.3 |
| @uppy/form | 1.3.6 | @uppy/url | 1.4.3 |
| @uppy/golden-retriever | 1.3.5 | @uppy/utils | 2.2.0 |
| @uppy/google-drive | 1.4.0 | @uppy/webcam | 1.5.2 |
| @uppy/informer | 1.4.0 | @uppy/xhr-upload | 1.5.0 |
| @uppy/instagram | 1.3.6 | uppy | 1.9.0 |
| @uppy/locales | 1.11.1 | - | - |

- @uppy/companion: support new Instagram Graph API (#1966 / @ifedapoolarewaju)
- @uppy/companion: add option to set http method for remote multipart uploads (#2047 / @ifedapoolarewaju)
- @uppy/core: core: setState(modifiedFiles) in onBeforeUpload (#2028 / @arturi)
- @uppy/core: always log errors (#2029 / @arturi)
- @uppy/core: clear state.error after the last file is removed (#2041 / @arturi)
- @uppy/core: fix mime type checking bug (#2004 / @shahimclt)
- @uppy/core: add noNewAlreadyUploading and noDuplicates locale strings (#2057 / @arturi)
- @uppy/core, @uppy/transloadit: allow new uploads when retrying; improve error handling (#1960 / @arturi)
- @uppy/core: add .tsv and .tab: text/tab-separated-values (#2056 / @arturi)
- @uppy/google-drive: remove conditional to replace `google` with `drive` (#2044 / @ifedapoolarewaju)
- @uppy/dashboard: add image and archive icons (#2027 / @arturi)
- @uppy/dashboard: change aria-level attribute to correct syntax (#2032 / @efbautista)
- @uppy/onedrive: make encryption shorter + enable onedrive on website (#2034 / @ifedapoolarewaju)
- @uppy/aws-s3: remove encodeURIComponent to avoid encoding characters twice (#2033 / @yoann-hellopret)
- @uppy/informer, @uppy/status-bar: display a browser alert when an error question mark button is clicked (#2031 / @arturi)
- build: upload downloadable zip archive of releases to CDN (#2052 / @kvz)
- providers: remove redundant use of options (#2046 / @ifedapoolarewaju)
- website: switch from Discourse to Disqus for comments ([c4af95d98cdd5c3727ee5c14dfd07af227c59b9e](https://github.com/transloadit/uppy/commit/c4af95d98cdd5c3727ee5c14dfd07af227c59b9e) / @kvz)

### 1.8.0

Released: 2020-01-15

This release adds Korean and Vietnamese localizations, fixes bugs, and significantly improves the performance of adding and removing lots of files. More performance improvements are on the way in the next few releases, too! Thanks to all contributors listed below.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.4.0 | @uppy/onedrive | 0.1.4 |
| @uppy/aws-s3 | 1.4.1 | @uppy/progress-bar | 1.3.4 |
| @uppy/companion | 1.8.0 | @uppy/provider-views | 1.5.2 |
| @uppy/core | 1.7.1 | @uppy/react | 1.4.2 |
| @uppy/dashboard | 1.5.2 | @uppy/robodog | 1.4.2 |
| @uppy/drag-drop | 1.4.2 | @uppy/status-bar | 1.4.2 |
| @uppy/dropbox | 1.3.5 | @uppy/thumbnail-generator | 1.5.2 |
| @uppy/facebook | 0.2.2 | @uppy/transloadit | 1.4.2 |
| @uppy/file-input | 1.4.2 | @uppy/tus | 1.5.2 |
| @uppy/form | 1.3.5 | @uppy/url | 1.4.2 |
| @uppy/golden-retriever | 1.3.4 | @uppy/utils | 2.1.2 |
| @uppy/google-drive | 1.3.5 | @uppy/webcam | 1.5.1 |
| @uppy/informer | 1.3.4 | @uppy/xhr-upload | 1.4.2 |
| @uppy/instagram | 1.3.5 | uppy | 1.8.0 |
| @uppy/locales | 1.11.0 | - | - |

- @uppy/aws-s3-multipart: add optional headers for signed url (@ardeois, #1985)
- @uppy/aws-s3: fix crash when S3 response does not have a Content-Type header (@roenschg, #2012)
- @uppy/companion: also pass metadata to `getKey` for multipart S3 uploads (@goto-bus-stop, #2022)
- @uppy/companion: dependency updates (@goto-bus-stop, #1983)
- @uppy/companion: rename internal S3 upload functions for clarity (@goto-bus-stop, [fec7d7d](https://github.com/transloadit/uppy/commit/fec7d7db3a742b347d6c64ee92fa96be73b3a8b1))
- @uppy/core: improve performance of adding and removing files (@goto-bus-stop, #1949)
- @uppy/locales: add Korean (@jdssem, #1986)
- @uppy/locales: add Vietnamese (@thanhthot, #2010)
- @uppy/locales: update French translations (@olemoign, #2023)
- @uppy/provider-views: improve instagram video thumbnail display (@arturi, [1d7a584](https://github.com/transloadit/uppy/commit/1d7a58481d9974e0d98cc1a710c5d8ac6ac038e0))
- @uppy/react: use `componentDidUpdate` instead of `componentWillReceiveProps` (@cryptic022, #1999)
- @uppy/thumbnail-generator: fix strict mode compatibility (@rlebosse, #1995)
- @uppy/tus: update TusOptions typings (@darthf1, #1989)
- @uppy/xhr-upload: do not emit limit warning if an existing rate limit queue was passed (@goto-bus-stop, [3c1a2af](https://github.com/transloadit/uppy/commit/3c1a2afb09576f75e91a19604aa64235710d9238))
- @uppy/xhr-upload: free item from rate limit queue when upload times out (@rtaieb, #2018)
- examples: add `npm run example $examplename` script (@goto-bus-stop, [7b2283d](https://github.com/transloadit/uppy/commit/7b2283d8ef25a18dcfa5c618caa50222b8c7e243))

### 1.7.0

Released: 2019-12-16

This release adds Hebrew translations and smoothes out some rough edges in Companion. The Webcam plugin now supports showing the duration of recordings while in progress.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.3.5 | @uppy/onedrive | 0.1.3 |
| @uppy/aws-s3 | 1.4.0 | @uppy/progress-bar | 1.3.3 |
| @uppy/companion | 1.7.0 | @uppy/provider-views | 1.5.1 |
| @uppy/core | 1.7.0 | @uppy/react | 1.4.1 |
| @uppy/dashboard | 1.5.1 | @uppy/robodog | 1.4.1 |
| @uppy/drag-drop | 1.4.1 | @uppy/status-bar | 1.4.1 |
| @uppy/dropbox | 1.3.4 | @uppy/thumbnail-generator | 1.5.1 |
| @uppy/facebook | 0.2.1 | @uppy/transloadit | 1.4.1 |
| @uppy/file-input | 1.4.1 | @uppy/tus | 1.5.1 |
| @uppy/form | 1.3.4 | @uppy/url | 1.4.1 |
| @uppy/golden-retriever | 1.3.3 | @uppy/utils | 2.1.1 |
| @uppy/google-drive | 1.3.4 | @uppy/webcam | 1.5.0 |
| @uppy/informer | 1.3.3 | @uppy/xhr-upload | 1.4.1 |
| @uppy/instagram | 1.3.4 | uppy | 1.7.0 |
| @uppy/locales | 1.10.0 | - | - |

- @uppy/aws-s3: add some tests (@bambii7, #1934)
- @uppy/companion: add onedrive domain validation for the demo deployment (@ifedapoolarewaju, #1959)
- @uppy/companion: change demo deployment type to stable API (@kiloreux, #1938)
- @uppy/companion: log error if exists during token verification (@ifedapoolarewaju, #1937)
- @uppy/companion: mask auth tokens from logged referrer URLs (@ifedapoolarewaju, #1951)
- @uppy/companion: only generate `uppyToken` if `access_token` was received from provider (@ifedapoolarewaju, #1946)
- @uppy/companion: pass metadata to Companion `getKey()` option for S3 uploads (@goto-bus-stop, #1866)
- @uppy/companion: rename uppy occurrences to companion (@ifedapoolarewaju, #1926)
- @uppy/companion: run CI tests on Node 6 to ensure compatibility (@ifedapoolarewaju, #1953)
- @uppy/companion: upgrade `helmet` (@goto-bus-stop, [6b006ac](https://github.com/transloadit/uppy/commit/6b006ac42c20062c37bdcaf6a77e07b304da7957))
- @uppy/companion: use original file name in S3 Multipart uploads (@goto-bus-stop, #1965)
- @uppy/core: make `uppy.on()` work better with IntelliSense (@bambii7, #1923)
- @uppy/dashboard: hide top bar cancel button when `hideCancelButton: true` (@goto-bus-stop, #1955)
- @uppy/dashboard: move dropEffect assignment to dragover (@goto-bus-stop, #1982)
- @uppy/drag-drop: move dropEffect assignment to dragover (@goto-bus-stop, #1982)
- @uppy/locales: add Hebrew (@YehudaKremer, #1932)
- @uppy/locales: rename `es_GL` → `gl_ES` (@goto-bus-stop, #1929)
- @uppy/thumbnail-generator: add webp to the list of supported types (@arturi, #1961)
- @uppy/thumbnail-generator: vendor exif-js source in Uppy (@mskelton, #1940)
- @uppy/webcam: add `showRecordingLength: true` option (@dominiceden, #1947)
- docs: FB and OneDrive are not yet in the CDN bundle (@goto-bus-stop, [61b54b9](https://github.com/transloadit/uppy/commit/61b54b914dd437d2e60362c4ece1429943b32555))
- docs: add `companionHeaders` to s3-multipart docs (@goto-bus-stop, [a6e44a9](https://github.com/transloadit/uppy/commit/a6e44a953114e385466dcce884d37e433f030549))
- docs: add reset-progress event to docs (@bambii7, #1922)
- docs: make Robodog naming more consistent (@goto-bus-stop, #1935)
- docs: make react sample code more standalone (@uxitten, #1864)
- examples: remove `UPPYSERVER_` references (@goto-bus-stop, [e74690e](https://github.com/transloadit/uppy/commit/e74690e20cc0a1afd9156ce03b1ca6a5358cc7d9))
- website: add facebook to dashboard example (@ifedapoolarewaju, #1930)
- website: add plugin versions (@arturi, #1952)
- website: enable onedrive on the website example (@ifedapoolarewaju, #1975)

### 1.6.0

Released: 2019-11-04

This release adds Icelandic translations and a long-awaited `setOptions` API to change configuration (including language) at runtime.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.3.4 | @uppy/onedrive | 0.1.2 |
| @uppy/aws-s3 | 1.3.3 | @uppy/progress-bar | 1.3.2 |
| @uppy/companion | 1.6.0 | @uppy/provider-views | 1.5.0 |
| @uppy/core | 1.6.0 | @uppy/react | 1.4.0 |
| @uppy/dashboard | 1.5.0 | @uppy/robodog | 1.4.0 |
| @uppy/drag-drop | 1.4.0 | @uppy/status-bar | 1.4.0 |
| @uppy/dropbox | 1.3.3 | @uppy/thumbnail-generator | 1.5.0 |
| @uppy/facebook | 0.2.0 | @uppy/transloadit | 1.4.0 |
| @uppy/file-input | 1.4.0 | @uppy/tus | 1.5.0 |
| @uppy/form | 1.3.3 | @uppy/url | 1.4.0 |
| @uppy/golden-retriever | 1.3.2 | @uppy/utils | 2.1.0 |
| @uppy/google-drive | 1.3.3 | @uppy/webcam | 1.4.0 |
| @uppy/informer | 1.3.2 | @uppy/xhr-upload | 1.4.0 |
| @uppy/instagram | 1.3.3 | uppy | 1.6.0 |
| @uppy/locales | 1.9.0 | - | - |

- @uppy/companion: Add S3 useAccelerateEndpoint option (@steverob, #1884)
- @uppy/companion: only set `Access-Control-Allow-Credentials` header when origin is whitelisted (@ifedapoolarewaju, #1901)
- @uppy/companion: set a more visible thumbnail size for dropbox (@ifedapoolarewaju, #1917)
- @uppy/companion: upgrade connect-redis (@ifedapoolarewaju, #1911)
- @uppy/core: Allow passing meta type to upload-success and complete events (@MatthiasKunnen, #1879)
- @uppy/core: add UppyFile.response typing (@superhawk610, #1882)
- @uppy/core: add `setOptions` API (@arturi, #1728)
- @uppy/core: skip upload-success event for a file that has been removed (@julianocomg, #1875)
- @uppy/facebook: use grid view with big image previews for album folders (@ifedapoolarewaju, #1886)
- @uppy/locales: Added Icelandic :iceland: (@olitomas, #1916)
- @uppy/provider-views: Fix sizes for smaller images in grid layout (@arturi, #1897)
- @uppy/provider-views: provider views breadcrumbs is failed to render (@huydod, #1914)
- @uppy/transloadit: send Transloadit-Client header with HTTP API requests (@goto-bus-stop, #1919)
- @uppy/tus: terminate tus upload when cancelling instead of just pausing and letting it expire (@ifedapoolarewaju, #1909)
- @uppy/utils: accept sync functions in `wrapPromiseFunction()` (@goto-bus-stop, #1910)
- docs: README.md wording and formatting changes (@sercraig, #1900)
- docs: clarify that 'upload-success' and 'upload-error' `response` parameter is specific to some uploaders (@bambii7, #1921)
- docs: add OneDrive to Companion documentation (@ifedapoolarewaju, #1925)
- examples: support `COMPANION_AWS_ENDPOINT` in aws-companion example so it can be used with other S3-compatible services (@goto-bus-stop, [1ab63aa](https://github.com/transloadit/uppy/commit/1ab63aa395859815871c4e1e62dda6e9ca66595f))
- website: improve support page design (@arturi, #1913)

### 1.5.2

Released: 2019-10-14

This release contains a new Thai locale, and some critical fixes for the 1.5 release, especially the S3 plugins.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3 | 1.3.2 | @uppy/locales | 1.8.0 |
| @uppy/aws-s3-multipart | 1.3.3 | @uppy/onedrive | 0.1.1 |
| @uppy/companion-client | 1.4.1 | @uppy/react | 1.3.2 |
| @uppy/core | 1.5.1 | @uppy/robodog | 1.3.3 |
| @uppy/dashboard | 1.4.1 | @uppy/transloadit | 1.3.2 |
| @uppy/dropbox | 1.3.2 | @uppy/tus | 1.4.2 |
| @uppy/facebook | 0.1.1 | @uppy/url | 1.3.2 |
| @uppy/form | 1.3.2 | @uppy/xhr-upload | 1.3.2 |
| @uppy/google-drive | 1.3.2 | uppy | 1.5.2 |
| @uppy/instagram | 1.3.2 | - | - |

- @uppy/aws-s3-multipart: advance queue after local file upload completes (@goto-bus-stop, #1887)
- @uppy/core: provide default error message (@goto-bus-stop, #1880)
- @uppy/dashboard: fix retry icons on individual files (@goto-bus-stop, #1888)
- @uppy/locales: add Thai (@dogrocker, #1873)
- build: update lerna, eslint, and jest (@goto-bus-stop)
- docs: add css require to robodog docs (@arturi, fea453b7a99359ef409f57face62c8eeffc16fda)

### 1.5.0

Released: 2019-10-09

This release features new remote providers for Facebook and OneDrive, new languages, and a more robust approach to simultaneous upload limiting and cancellation.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.3.1 | @uppy/onedrive | 0.1.0 |
| @uppy/aws-s3 | 1.3.1 | @uppy/progress-bar | 1.3.1 |
| @uppy/companion-client | 1.4.0 | @uppy/provider-views | 1.4.0 |
| @uppy/companion | 1.5.0 | @uppy/react-native | 0.1.3 |
| @uppy/core | 1.5.0 | @uppy/react | 1.3.1 |
| @uppy/dashboard | 1.4.0 | @uppy/redux-dev-tools | 1.3.1 |
| @uppy/drag-drop | 1.3.1 | @uppy/robodog | 1.3.1 |
| @uppy/dropbox | 1.3.1 | @uppy/status-bar | 1.3.1 |
| @uppy/facebook | 0.1.0 | @uppy/thumbnail-generator | 1.4.0 |
| @uppy/file-input | 1.3.1 | @uppy/transloadit | 1.3.1 |
| @uppy/form | 1.3.1 | @uppy/tus | 1.4.1 |
| @uppy/golden-retriever | 1.3.1 | @uppy/url | 1.3.1 |
| @uppy/google-drive | 1.3.1 | @uppy/utils | 2.0.0 |
| @uppy/informer | 1.3.1 | @uppy/webcam | 1.3.1 |
| @uppy/instagram | 1.3.1 | @uppy/xhr-upload | 1.3.1 |
| @uppy/locales | 1.7.0 | uppy | 1.5.0 |

- @uppy/companion: revoke companion's provider access on "logout" (@ifedapoolarewaju, #1843)
- @uppy/companion-client: rename serverHeaders to companionHeaders (@goto-bus-stop, #1861)
- @uppy/core: avoid overwriting duplicate files by a) throwing a warning instead and b) adding the relative-path of files to a new tus fingerprint function (we might use file.id as a fingerprint instead) (#754, #1606) (@arturi, #1767)
- @uppy/dashboard: add missing fields to DashboardOptions typescript typings (@MatthiasKunnen, #1830)
- @uppy/facebook: add facebook remote provider (@ifedapoolarewaju, #1794)
- @uppy/locales: add Czech (@tvaliasek, #1842)
- @uppy/locales: add Danish (@Pzoco, #1837)
- @uppy/onedrive: add OneDrive remote provider (@ifedapoolarewaju, #1831)
- @uppy/thumbnail-generator: add waitForThumbnailsBeforeUpload option, false by default (@arturi, #1803)
- @uppy/transloadit: pin socket.io version to ES5 compatible one (@goto-bus-stop, https://github.com/transloadit/uppy/commit/5839b655f093edaa778d49b719f7dda063ef79cb)
- @uppy/xhr-upload,tus,aws-s3: use more cancellation-friendly strategy for `limit: N` uploads (@goto-bus-stop, #1736)
- @uppy/aws-s3-multipart: fix queueing behaviors, especially interaction with cancellation (@goto-bus-stop, #1855)
- @uppy/locales: fix typo in Persian locale (@uxitten, #1865)
- @uppy/locales: improve Swedish translation (@marcusforberg, #1859)
- @uppy/aws-s3: replace browser-only resolve-url by isomorphic url-parse (@goto-bus-stop, #1854)
- docs: remove pre 1.0 notice from changelog (@mskelton, #1858)
- docs: fix typo (@leftdevel, #1852)
- test: add end-to-end test with retries (@ifedapoolarewaju, #1766)

### 1.4

Released: 2019-08-30

In this release we’ve focused on issue busting on GitHub, nearly halving them. Uppy also learned how to bark in Swedish, Greek, Indonesian, Serbian (Latin), and improved on its Finnish and French. The Transloadit plugin gained a `limit` option. The Docs and the website have been improved.

⚠️ With recent Lerna improvements, you no longer need to do `npm run bootstrap` when developing Uppy — `npm install` does all the work now!

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.3.0 | @uppy/provider-views | 1.3.0 |
| @uppy/aws-s3 | 1.3.0 | @uppy/react | 1.3.0 |
| @uppy/companion-client | 1.3.0 | @uppy/redux-dev-tools | 1.3.0 |
| @uppy/companion | 1.4.0 | @uppy/robodog | 1.3.0 |
| @uppy/core | 1.4.0 | @uppy/status-bar | 1.3.0 |
| @uppy/dashboard | 1.3.0 | @uppy/store-default | 1.2.0 |
| @uppy/drag-drop | 1.3.0 | @uppy/store-redux | 1.2.0 |
| @uppy/dropbox | 1.3.0 | @uppy/thumbnail-generator | 1.3.0 |
| @uppy/file-input | 1.3.0 | @uppy/transloadit | 1.3.0 |
| @uppy/form | 1.3.0 | @uppy/tus | 1.4.0 |
| @uppy/golden-retriever | 1.3.0 | @uppy/url | 1.3.0 |
| @uppy/google-drive | 1.3.0 | @uppy/utils | 1.3.0 |
| @uppy/informer | 1.3.0 | @uppy/webcam | 1.3.0 |
| @uppy/instagram | 1.3.0 | @uppy/xhr-upload | 1.3.0 |
| @uppy/locales | 1.6.0 | uppy | 1.4.0 |
| @uppy/progress-bar | 1.3.0 | - | - |

- @uppy/companion: bump lodash.merge to 4.6.2 to fix audit warning (#1796 / @rettgerst)
- @uppy/companion: Fix s3 uploads for URL plugins (#1784 / @@ifedapoolarewaju)
- @uppy/companion: set allowed http methods internally (#1754 / @ifedapoolarewaju)
- @uppy/companion: whenever an error is returned from companion: the auth screen will be displayed if the user was never authenticated, if the user is authenticated, the last screen on display before the error will be displayed (#1743 / @ifedapoolarewaju)
- @uppy/core: fix "Cannot read property 'log' of undefined" (#1785 / @theJoeBiz)
- @uppy/core: Made sure we can upload new files if we cancel last file (allowMultipleUploads: false) (#1764 / @lakesare)
- @uppy/core: use setFileState inside retryUpload (#1759 / @goto-bus-stop)
- @uppy/dashboard, @uppy/drag-drop: getDroppedFiles.js: handle exceptions better (#1797 / @lakesare)
- @uppy/dashboard: ⚠️ Add `data` attribute with file source, hide the file source icon (where the file was selected from) in the Dashboard with CSS. If you really want this back, please look in the PR and set your custom CSS to `.uppy-DashboardItem-sourceIcon { display: inline-block; }` (#1809 / @arturi)
- @uppy/dashboard: add dashboard:file-edit-start and dashboard:file-edit-complete events (#1776 / @arturi)
- @uppy/dashboard: Fix log duplication and excessive ResizeObserver log (#1747 / @lakesare)
- @uppy/dashboard: fix wrong typescript definition for metaFields property (#1763 / @mrbatista)
- @uppy/form: try/catch parsing, set updatedResult to an empty array when not an array (#1800 / @arturi)
- @uppy/locales: Add id_ID (indonesia) locale (#1778 / @achmiral)
- @uppy/locales: Add translations in Swedish (#1771 / @arggh)
- @uppy/locales: Adding support for Greek language (#1802 / @Tashows)
- @uppy/locales: correct some fr_FR localization strings (#1807 / @czj)
- @uppy/locales: Create sr_RS_Cyrillic.js (#1748 / @nndevstudio)
- @uppy/locales: Finnish semantics improved and fixed some typos (#1744 / @@jukakoski)
- @uppy/locales: Update sr_RS_Latin.js (#1749 / @nndevstudio)
- @uppy/transloadit: add limit option, warn about using limit when it’s set to 0. In Uppy 2.0 we’ll set the limit to something sensible (like 10 files) by default. (#1789 / @arturi)
- @uppy/xhr-upload: Throw an error when trying to upload a remote file with `bundle: true` (#1769 / @arturi)
- build: ci: tweak job run order (#1740 / @goto-bus-stop)
- build: Fix statefulset update: statefulsets image only should be updated. (#1821 / @kiloreux)
- build: Lerna link convert. This installs dependencies of all packages, the website, and all examples into the root node_modules folder. After an npm install, no further lerna bootstrap is required. (#1730 / @goto-bus-stop)
- build: Update eslint to v6 (#1777 / @goto-bus-stop)
- core: Made addFile return the file id (#1739 / @eliOcs)
- docs: add “force metafield” to docs and changelog (ab053e7ab266d3a4838069ed23675bb9211e4d1a / @arturi)
- docs: explicitly document supported tus-js-client options (#1755 / @goto-bus-stop)
- docs: Link to Transloadit plugin from Robodog Form page (#1810 / @janko)
- docs: redux - mentioned that we can't persist Uppy state (#1793 / @lakesare)
- docs: talk about marking some files as “already uploaded” (c345cbd58992f7bea9525629c28d38420c6b36a3 / @arturi)
- docs: Talk about using a custom file input, instead of the file-input plugin (#1765 / @arturi)
- tests: e2e: reintroduce e2e test for providers locally (#1706 / @ifedapoolarewaju)
- website: /examples/dragdrop - added more obvious 'file was uploaded' indicator (#1750 / @lakesare)
- website: /examples/xhrupload - more obvious UI, added a list of uploaded files (#1768 / @lakesare)
- website: add new version of hexo-filter-github-emojis (#1783 / @lakesare)
- website: fix docs/locales code escaping and css overflow (5a0055c15d04d97e8a0feb784daa7abe8da1d72d / @arturi)

### 1.3

Released: 2019-07-19

This release fixes id generation for non-latin characters, significantly improves accessibility in Dashboard and all around, logs versions of every plugin, changes how debug logs work, and more.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.2.0 | @uppy/progress-bar | 1.2.0 |
| @uppy/aws-s3 | 1.2.0 | @uppy/provider-views | 1.2.0 |
| @uppy/companion-client | 1.2.0 | @uppy/react | 1.2.0 |
| @uppy/companion | 1.3.0 | @uppy/redux-dev-tools | 1.2.0 |
| @uppy/core | 1.2.0 | @uppy/robodog | 1.2.0 |
| @uppy/dashboard | 1.2.0 | @uppy/status-bar | 1.2.0 |
| @uppy/drag-drop | 1.2.0 | @uppy/thumbnail-generator | 1.2.0 |
| @uppy/dropbox | 1.2.0 | @uppy/transloadit | 1.2.0 |
| @uppy/file-input | 1.2.0 | @uppy/tus | 1.3.0 |
| @uppy/form | 1.2.0 | @uppy/url | 1.2.0 |
| @uppy/golden-retriever | 1.2.0 | @uppy/utils | 1.2.0 |
| @uppy/google-drive | 1.2.0 | @uppy/webcam | 1.2.0 |
| @uppy/informer | 1.2.0 | @uppy/xhr-upload | 1.2.0 |
| @uppy/instagram | 1.2.0 | uppy | 1.3.0 |
| @uppy/locales | 1.5.0 | - | - |

- @uppy/aws-s3-multipart: Add metadata support for S3 MultiPart (#1698 / @davekiss)
- @uppy/aws-s3: Allow overriding of getResponseData() (#1647 / @eman8519)
- @uppy/aws-s3: prevent unnecessary delete multiparts request for completed files (#1650 / @twarlop)
- @uppy/companion-client: send correct versions to companion (#1694 / @ifedapoolarewaju)
- @uppy/companion, @uppy/companion-client: ⚠️send uppy-versions header to companion: please see [how to avoid errors if you are using Companion but NOT as standalone](https://github.com/transloadit/uppy/pull/1612#issuecomment-515117137) (#1612 / @ifedapoolarewaju)
- @uppy/companion: add colors to logs (#1648 / @ifedapoolarewaju)
- @uppy/companion: Change cloud in gcloud-deploy (#1729 / @kiloreux)
- @uppy/companion: change oauth access token transport method (#1668 / @ifedapoolarewaju)
- @uppy/companion: display truer error during oauth failure (#1702 /  @ifedapoolarewaju)
- @uppy/companion: don’t log uppyAuthToken (#1663 / @ifedapoolarewaju)
- @uppy/companion: don’t send error stack to client (#1649 / @ifedapoolarewaju)
- @uppy/companion: prevent logging uppyAuthToken (#1663 / @ifedapoolarewaju)
- @uppy/companion: properly load instagram username (#1651 / @ifedapoolarewaju)
- @uppy/companion: remove deprecated dropbox field (#1692 / @ifedapoolarewaju)
- @uppy/companion: return nextPagePath for drive/dropbox (#1652 / @stephentuso)
- @uppy/core: _calculateTotalProgress results in incorrectly high (1038%) progress with files that don’t have size (like from Instagram) (#1610 / @goto-bus-stop)
- @uppy/core: ⚠️ Add an option to supply logger with debug, warn and error methods: ⚠️ this switches to `console.debug` from `console.log` by default, you might need to change settings in your dev tools to see Uppy logs! (#1661 / @arturi, @goto-bus-stop, @kvz)
- @uppy/core: Added heic file type, refactor getFileType (#1734 / @arturi)
- @uppy/core: adjust ID generation to keep non-latin characters: now, non-latin characters are encoded as their charcode in base 32, so files that only differ by name in a non-latin language will generate different IDs. (#1722 / @goto-bus-stop)
- @uppy/core: Check for existing upload (#1367 / @superandrew213)
- @uppy/core: check option types early, like making sure `allowedFileTypes` is an array, in cases where JS would not be able to auto-fix via typecasting (otherwise it's BC-breaking)
- @uppy/core: Enable partial assignment of restrictions passed as options (#1654 / @janklimo)
- @uppy/core: Log versions of Uppy plugins for debugging (#1640 / @arturi)
- @uppy/core: make `meta.name` not required in addFile() (#1629 / @goto-bus-stop)
- @uppy/core: Restrictions improvements — set file.type to the one detected by Uppy, before calling onBeforeFileAdded callback, emit restriction-failed for minNumberOfFiles, too (so in uppy.upload (#1726 / @arturi)
- @uppy/dashboard: ⚠️ More design improvements: Add more button, improved focus styles, Replaced "Copy link" & "Edit" links with icons (#1574 / @nqst, @lakesare, @arturi)
- @uppy/dashboard: ⚠️ Moved all provider-views translation strings from Dashboard to Core, this eliminates a dependency of provider-views upon Dashboard (#1712/ @lakesare)
- @uppy/dashboard: add modal open and close events (#1664 / @arturi)
- @uppy/dashboard: Change select button to just say `Select 11` instead of `Select 11 files`, because there can be folders (https://github.com/transloadit/uppy/issues/1422)
- @uppy/dashboard: connected labels to inputs in FileCard.js (#1715 / @lakesare)
- @uppy/dashboard: Dashboard performance improvements (#1671 / @goto-bus-stop)
- @uppy/dashboard: Fix header bar css in ie11 (#1700 / @lakesare)
- @uppy/dashboard: Ie11 filecard preview fix (#1718 / @lakesare)
- @uppy/dashboard: Refactor FileCard component to fix loosing metadata state on re-renders (#1656 / @arturi)
- @uppy/drag-drop: make DragDrop entirely clickable (#1633 / @lakesare)
- @uppy/form: exclude own metadata, append result instead of overwriting (#1686 / @arturi)
- @uppy/locales: add Arabic, Saudi Arabia (#1673 / @HussainAlkhalifah)
- @uppy/locales: add Turkish (#1667 / @ayhankesicioglu)
- @uppy/locales: added Finnish (#1719 / @jukakoski)
- @uppy/provider-views: Add translations for aria labels in provider views (#1696 / @lakesare)
- @uppy/provider-views: Persist selected checkboxes when moving between folders (#1672 / @arturi)
- @uppy/provider-views: Select 5 files --> Select 5, because there are also folders (#1697 / @arturi)
- @uppy/robodog: allow customizing `triggerUploadOnSubmit` (#1691 / @goto-bus-stop)
- @uppy/robodog: fix `form({ modal: true })` not enabling modal options (#1690 / @goto-bus-stop)
- @uppy/robodog: use chooseFiles string like @uppy/file-input (#1669 / @goto-bus-stop)
- @uppy/status-bar: Show `total file size / total uploaded of all started` vs `total / total upload of those not complete` (#1685 / @arturi)
- @uppy/thumbnail-generator: rotate according to EXIF metadata (#1532 / @Botz)
- @uppy/transloadit: expand on resume: false reasons (afd30a43b8106d0ca79c6f95de0673b69f3edcb5 / @goto-bus-stop)
- @uppy/transloadit: reduce excessive polling (#1689 / @goto-bus-stop)
- @uppy/utils: ⚠️ prettyBytes 1000 --> 1024: we’ve decided to move prettier-bytes to @uppy/utils/lib/prettyBytes and divide by 1024 instead of 1000 to justify KB vs kB (#1732 / @arturi)
- @uppy/webcam: Allow definition of MediaRecorder mimeType (#1708 / @davekiss)
- @uppy/webcam: Change webcam file name so that it fits on one line in Dashboard (#1660 / @arturi)
- @uppy/xhr-upload: send global metadata when `bundle: true` (#1677 / @goto-bus-stop)
- @uppy/xhr-upload: Set type and name from file.meta, re-create blob (#1616 / @arturi)
- \*: Accessibility follow-up PR: make all svgs not focusable in IE11 (#1662 / @lakesare)
- \*: Added focus styles for all elements (#1701 / @lakesare)
- \*: Log error in uppy.addFile try/catch (#1680 / @arturi)
- \*: use `opts.id` as the plugin ID for all plugins, fixes #1674 (https://github.com/transloadit/uppy/commit/e6c52f7681dad5a73c85bac2c7986293eda76a85 / @goto-bus-stop)
- build: ci — use a fancy matrix (#1709 / @goto-bus-stop)
- build: deps: get rid of eslint-config-standard-preact (#1678 / @goto-bus-stop)
- build: Update webdriverio to v5 (#1675 / @goto-bus-stop)
- dashboard/providers: many-many-many accessibility improvements, introduced superfocus (#1507 / @lakesare, @arturi)
- docs: add custom plugin example (#1623 / @arturi)
- docs: document redux store wart (9948a841b7a3dac17dc0c24fb347baf5f2b2ab72 / @goto-bus-stop)
- docs: Fix docs navigation (#1717 / @larowlan)
- docs: Missing build step from readme, npm start will fail without this (#1735 / magumbo)
- website: add Community projects (#1620 / @kvz)
- website: Add signature authentication to Transloadit example on the website (#1705 / @goto-bus-stop)
- website: Add support for arguments in website’s console.log hack (@arturi / #1641)
- website: IE10: note we are stll running tests with it, but not actively supporting it (7c9b55ce2e3b7021ad60bffe94e3587231c2de6a / @arturi)
- website: Improve website transloadit example (#1659 / @arturi)
- website: make passing options to partials/docs_menu optional (6ac7f4825b9fd714b5564b7cedb21fb199f5a1e7 / @arturi)
@uppy/dashboard - made Add More always stick to the right (#1733 / @lakesare)

### 1.2.0

Released: 2019-06-07

This release fixes an issue when using Transloadit and the @uppy/form plugin. To do so, a new `metaFields` option was added to the @uppy/tus plugin.

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/companion | 1.2.0 | @uppy/transloadit | 1.1.1 |
| @uppy/locales | 1.4.0 | @uppy/tus | 1.2.0 |
| @uppy/robodog | 1.1.1 | uppy | 1.2.0 |

- @uppy/companion: ability to load secret keys from files (#1632 / @dargmuesli)
- @uppy/locales: add Japanese (#1643 / @johnmanjiro13, @s-jcs)
- @uppy/tus: add `metaFields` option (#1644 / @goto-bus-stop)

### 1.1.0

Released: 2019-06-05

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.1.0 | @uppy/provider-views | 1.1.0 |
| @uppy/aws-s3 | 1.1.0 | @uppy/react-native | 0.1.2 |
| @uppy/companion-client | 1.1.0 | @uppy/react | 1.1.0 |
| @uppy/companion | 1.1.0 | @uppy/redux-dev-tools | 1.1.0 |
| @uppy/core | 1.1.0 | @uppy/robodog | 1.1.0 |
| @uppy/dashboard | 1.1.0 | @uppy/status-bar | 1.1.0 |
| @uppy/drag-drop | 1.1.0 | @uppy/store-default | 1.1.0 |
| @uppy/dropbox | 1.1.0 | @uppy/store-redux | 1.1.0 |
| @uppy/file-input | 1.1.0 | @uppy/thumbnail-generator | 1.1.0 |
| @uppy/form | 1.1.0 | @uppy/transloadit | 1.1.0 |
| @uppy/golden-retriever | 1.1.0 | @uppy/tus | 1.1.0 |
| @uppy/google-drive | 1.1.0 | @uppy/url | 1.1.0 |
| @uppy/informer | 1.1.0 | @uppy/utils | 1.1.0 |
| @uppy/instagram | 1.1.0 | @uppy/webcam | 1.1.0 |
| @uppy/locales | 1.3.0 | @uppy/xhr-upload | 1.1.0 |
| @uppy/progress-bar | 1.1.0 | uppy | 1.1.0 |

- @uppy/robodog: actually support specifying Dashboard options (#1504 / @goto-bus-stop)
- @uppy/aws-s3: Do not extract keys from empty `fields` (#1569 / @alexnj)
- docs: Thumbnail Generator – Update arguments in "thumbnail:generated" callback docs (#1567 / @janko)
- docs: polyfills are already included in the CDN bundle (#1576 / @arturi)
- docs: xhr-upload: Update the `upload-success` event docs (#1573 / @janko)
- build: Upgrade build dependencies: Babel to v7, Eslint to v5, Jest to v24, Typescript to v3, Postcss to v7 (#1549 / @goto-bus-stop)
- build: Update iOS version in integration tests (#1548 / @goto-bus-stop)
- build: New `uploadcdn` script (#1586 / @goto-bus-stop)
- @uppy/locales: Added Hungarian translations (#1580 / @nagyv)
- build: Fix tags for docker build (#1579 / @kiloreux)
- build: Fix npm and github security warnings (#1601 / @goto-bus-stop)
- build: New sync version (#1600 / @goto-bus-stop)
- @uppy/companion: set upload filename from metadata during uploads (#1587 / @ifedapoolarewaju)
- @uppy/dashboard: fix for file previews being partially invisible sometimes in safari (#1584 / @lakesare)
@uppy/dashboard: made added-files previews look more proportional (#1588 / @lakesare, @arturi)
- @uppy/dashboard, @uppy/drag-drop, @uppy/file-input: Fix/on before file added not called (#1597 / @lakesare, @arturi)
- @uppy/react: dashboard react component prop typings updated (#1598 / @sagar7993)
- @uppy/informer: Remove color-related code and docs (#1596 / @arturi)
- @uppy/companion: Add remote-url to emit-success, fix #1607 (#1608 / @Zyclotrop-j)
- @uppy/golden-retriever: Use this.opts instead of opts (#1618 / @arturi)
- @uppy/locales: Create sr_Latn_RS.js for Serbian (Latin, Serbia) (#1614 / @arturi)
- @uppy/locales: Support locale variants, see #1614 (f9f4b5d74b9b3fb2e24aaf935fed4d79ecae42ab / @kvz)
- @uppy/dashboard: made paste work while we're focused on buttons (#1619 / @lakesare)
- @uppy/companion: return mimetypes for dropbox files (#1599 / @ifedapoolarewaju)
- @uppy/locales: Add Portuguese (brazil) language pack (pt_BR) (#1621 / @willycamargo)
- website: fix demo not working in IE 11 (es5), add Dropbox too (07397ed88bed140cdca1f3cf19e2eaab2726bbb2 / @arturi)
- docs: examples: mention that you need to install & bootstrap  (513ba53c378766e2d1e9c2885fd0311184b67c1d / @goto-bus-stop)
- docs: Fix error in documentation of AWS S3 Multipart::prepareUploadPart(file, partData) (c4e739b90a06499918f737c6cdcdfd9b413c69b2 / @kvz, @mattes3)
- docs: Explain how to not send any meta fields with xhr-upload (#1617 / @arturi)
- @uppy/core: use `uploadStarted: null` instead of false (#1628 / @goto-bus-stop)
- @uppy/utils - made getDroppedFiles.js work for IE11, fixes #1622 (#1630 / @lakesare)
- @uppy/provider-views: make trailing slash optional when validating auth origin (#1589 / @ifedapoolarewaju)
- @uppy/drag-drop: Feature/replace dnd in drag drop package (#1565 / @lakesare)

### 1.0.2

Released: 2019-05-17

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.0.2 | @uppy/progress-bar | 1.0.2 |
| @uppy/aws-s3 | 1.0.2 | @uppy/provider-views | 1.0.2 |
| @uppy/companion | 1.0.2 | @uppy/react | 1.0.2 |
| @uppy/core | 1.0.2 | @uppy/redux-dev-tools | 1.0.2 |
| @uppy/dashboard | 1.0.2 | @uppy/robodog | 1.0.2 |
| @uppy/drag-drop | 1.0.2 | @uppy/status-bar | 1.0.2 |
| @uppy/dropbox | 1.0.2 | @uppy/thumbnail-generator | 1.0.2 |
| @uppy/file-input | 1.0.2 | @uppy/transloadit | 1.0.2 |
| @uppy/form | 1.0.2 | @uppy/tus | 1.0.2 |
| @uppy/golden-retriever | 1.0.2 | @uppy/url | 1.0.2 |
| @uppy/google-drive | 1.0.2 | @uppy/utils | 1.0.2 |
| @uppy/informer | 1.0.2 | @uppy/webcam | 1.0.2 |
| @uppy/instagram | 1.0.2 | @uppy/xhr-upload | 1.0.2 |
| @uppy/locales | 1.2.0 | uppy | 1.0.2 |

- @uppy/companion, @uppy/provider-views: ⚠️Send version header: This fix restores backwards-compatibility with Uppy Client ^1.0.0, by introducing `uppyVersions` param (in the future also an `uppy-versions` header). If this param is present, the authentication token is sent in a new way, as a string, otherwise it’s sent the old way, as JSON object (incompatible with IE). Please use @uppy/companion@1.0.2 for backwards-compatibility, @uppy/companion@1.0.1 is deprecated (#1564 / @ifedapoolarewaju)
- @uppy/core: mimeTypes.js - added pdf file type (#1558 / @lakesare)
- @uppy/locales: Add zh_TW translation (#1562 / @green-mike)
- companion: remove deprecated "authorized" endpoint (33add61b613c5fc38c7cbace2f140c97dedc8b73 / @ifedapoolarewaju)
- companion: remove fallback `UPPYSERVER_*` env options (bf2220ab9f95a0794b8e46fe6ff50af9e4b955d9 / @ifedapoolarewaju)
- docs: add docs on locales — how to use from NPM and CDN, auto-generated list of languages that are supported already, invitation to add more (#1553 / @arturi, @kvz)
- docs: document Companions Auth and Token mechanism (#1540 / @ifedapoolarewaju)
- docs: update AWS S3 Multipart documentation wrt CORS settings (#1539 / @manuelkiessling)
- website: cleanup (#1536 / @nqst)
- website: output console logs in order (#1547 / @goto-bus-stop)

### 1.0.1

Released: 2019-05-08

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.0.1 | @uppy/progress-bar | 1.0.1 |
| @uppy/aws-s3 | 1.0.1 | @uppy/provider-views | 1.0.1 |
| @uppy/companion-client | 1.0.1 | @uppy/react-native | 0.1.1 |
| @uppy/companion | 1.0.1 | @uppy/react | 1.0.1 |
| @uppy/core | 1.0.1 | @uppy/redux-dev-tools | 1.0.1 |
| @uppy/dashboard | 1.0.1 | @uppy/robodog | 1.0.1 |
| @uppy/drag-drop | 1.0.1 | @uppy/status-bar | 1.0.1 |
| @uppy/dropbox | 1.0.1 | @uppy/thumbnail-generator | 1.0.1 |
| @uppy/file-input | 1.0.1 | @uppy/transloadit | 1.0.1 |
| @uppy/form | 1.0.1 | @uppy/tus | 1.0.1 |
| @uppy/golden-retriever | 1.0.1 | @uppy/url | 1.0.1 |
| @uppy/google-drive | 1.0.1 | @uppy/utils | 0.30.6 |
| @uppy/informer | 1.0.1 | @uppy/webcam | 1.0.1 |
| @uppy/instagram | 1.0.1 | @uppy/xhr-upload | 1.0.1 |
| @uppy/locales | 1.1.0 | uppy | 1.0.1 |

⚠️ `@uppy/companion@1.0.1` from this release has been deprecated, because it accidentally broke backwards-compatibility with Uppy Client `^1.0.0`. It is now fixed in `@uppy/companion@1.0.2`, please update. See https://github.com/transloadit/uppy/pull/1564 for details. Sorry about the trouble!

This includes some important fixes for webpack, create-react-app, and Internet Explorer support, as well as a bunch of new languages! :sparkles:

- pin preact to v8.2.9, fixes build problems with webpack and create-react-app (#1513 / @goto-bus-stop)
- @uppy/companion, @uppy/companion-client: pass token through postMessage as JSON, fixes #1424 (@serverdevil, @goto-bus-stop)
- @uppy/react: add thumbnailWidth prop type for Dashboard components, fixes #1524 (@goto-bus-stop)
- @uppy/status-bar: hide seconds if ETA more than 1 hour (#1501 / @Tiarhai)
- @uppy/locales: Add `es_ES` translation (#1502 / @jorgeepc)
- @uppy/locales: Add `zh_CN` translation (#1503 / @Quorafind)
- @uppy/locales: Add `fa_IR` translation (#1514 / @hrsh)
- @uppy/locales: Add `it_IT` translation (#1516 / @tinny77)

### 1.0.0

Released: 2019-04-25

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 1.0.0 | @uppy/locales | 1.0.0 |
| @uppy/aws-s3 | 1.0.0 | @uppy/progress-bar | 1.0.0 |
| @uppy/companion-client | 1.0.0 | @uppy/provider-views | 1.0.0 |
| @uppy/companion | 1.0.0 | @uppy/react | 1.0.0 |
| @uppy/core | 1.0.0 | @uppy/redux-dev-tools | 1.0.0 |
| @uppy/dashboard | 1.0.0 | @uppy/robodog | 1.0.0 |
| @uppy/drag-drop | 1.0.0 | @uppy/status-bar | 1.0.0 |
| @uppy/dropbox | 1.0.0 | @uppy/thumbnail-generator | 1.0.0 |
| @uppy/file-input | 1.0.0 | @uppy/transloadit | 1.0.0 |
| @uppy/form | 1.0.0 | @uppy/tus | 1.0.0 |
| @uppy/golden-retriever | 1.0.0 | @uppy/url | 1.0.0 |
| @uppy/google-drive | 1.0.0 | @uppy/webcam | 1.0.0 |
| @uppy/informer | 1.0.0 | @uppy/xhr-upload | 1.0.0 |
| @uppy/instagram | 1.0.0 | uppy | 1.0.0 |

- @uppy/companion-client: Don’t show informer for an auth error for now (#1478 / @arturi)
- @uppy/companion: Disable Tus parallel upload/download to solve pause/resume issues, until we figure out a better solution — (#1497 / @ifedapoolarewaju)
- @uppy/companion: detect bytes upload mismatch for multipart uploads (#1470 / @ifedapoolarewaju)
- @uppy/locales: Add Dutch locale (nl_NL) (#1462 / @clerx)
- @uppy/locales: Add French language pack (#1481 / @kiloreux)
- @uppy/locales: Add German language pack (#1475 / @tim-kos)
- @uppy/locales: Add Russian language pack (ru_RU), make more strings translatable (#1467 / @arturi)
- @uppy/react-native: Add custom file reader example for tus: this example uses expo-file-system, which does in reading file chunks for the case of ios. However, for the case of android, it seems to read the entire file. Publishing this example merely as a PoC so that other users can create their own fileReaders based on this example (#1489 / @ifedapoolarewaju)
- @uppy/robodog: Add support for submitOnSuccess option (#1491 / @tim-kos)
- @uppy/transloadit: Add assembly status property to assembly errors (#1488 / @goto-bus-stop)
- @uppy/transloadit: Add connection error reporting (#1484 / @goto-bus-stop)
- @uppy/tus: update tus-js-client to 1.8.0-0(057fb6200d9a7c6af452c5a79870fa74e362ec2c / @ifedapoolarewaju)
- @uppy/xhr-upload: Add filename to FormData with `bundle: true` (#1487 / @goto-bus-stop)
- @uppy/companion: investigate 423 and 500 issues with React Native + Url plugin when pause/resuming an upload (@ifedapoolarewaju)
- docs: Add basic @uppy/react-native docs (#1494 / @arturi)
- docs: Add docs for Thumbnail Generator plugin (#1468 / @arturi)
- website: New website re-design by Alex (#1483 / @nqst, @arturi)

### 0.30.5

Released: 2019-04-19

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 0.30.5 | @uppy/progress-bar | 0.30.5 |
| @uppy/aws-s3 | 0.30.5 | @uppy/provider-views | 0.30.5 |
| @uppy/companion-client | 0.28.5 | @uppy/react-native | 0.0.3 |
| @uppy/companion | 0.17.5 | @uppy/react | 0.30.5 |
| @uppy/core | 0.30.5 | @uppy/redux-dev-tools | 0.30.5 |
| @uppy/dashboard | 0.30.5 | @uppy/robodog | 0.30.5 |
| @uppy/drag-drop | 0.30.5 | @uppy/status-bar | 0.30.5 |
| @uppy/dropbox | 0.30.5 | @uppy/thumbnail-generator | 0.30.5 |
| @uppy/file-input | 0.30.5 | @uppy/transloadit | 0.30.5 |
| @uppy/form | 0.30.5 | @uppy/tus | 0.30.5 |
| @uppy/golden-retriever | 0.30.5 | @uppy/url | 0.30.5 |
| @uppy/google-drive | 0.30.5 | @uppy/utils | 0.30.5 |
| @uppy/informer | 0.30.5 | @uppy/webcam | 0.30.5 |
| @uppy/instagram | 0.30.5 | @uppy/xhr-upload | 0.30.5 |
| @uppy/locales | 0.30.5 | uppy | 0.30.5 |

- @uppy/companion-client: ⚠️ breaking: rename serverUrl to companionUrl and serverPattern to companionAllowedHosts (#1446 / @ifedapoolarewaju)
- @uppy/companion-client: Issue a warning if an outdated `serverUrl` or `serverPattern` option is used (#1459 / @arturi)
- @uppy/companion: ⚠️ breaking: send illusive upload progress when multipart downloads are on (#1454 / @ifedapoolarewaju)
- @uppy/companion: Fix serverless example (#1408 / @kiloreux)
- @uppy/core: fire a `restriction-failed` event when restriction-failed (#1436 / @allenfantasy)
- @uppy/core: fix logging objects (#1451 / @goto-bus-stop)
- @uppy/core: Remove console.dir (#1411 / @arturi)
- @uppy/dashboard: ⚠️ breaking: Improve drag to upload state: This uncovered a few drag-drop issues we have, it comes down to us needing something other than the drag-drop library (#1440 / @lakesare, @nqst)
- @uppy/dashboard: ⚠️ breaking: new `getDroppedFiles` module that is an improvement over `drag-drop` we’ve been using (#1440 / @lakesare)
- @uppy/dashboard: Design facelift — round 2: various improvements and fixes to the Dashboard UI (#1452 / @nqst)
- @uppy/dashboard: Design facelift: various improvements and fixes to the Dashboard UI (#1442 / @nqst)
- @uppy/locales: Default locale for all plugins (#1443 / @arturi, @kvz)
- @uppy/react-native: Basic React Native support (#988 / @arturi, @ifedapoolarewaju, @kvz)
- @uppy/robodog: add Dashboard API (#1450 / @goto-bus-stop)
- @uppy/transloadit: Support assembly cancellation (#1431 / @goto-bus-stop)
- @uppy/tus: ⚠️ breaking: will depend on ifedapoolarewaju’s fork for now, so it’s in sync with @uppy/companion and Lerna doesn’t have conflicts (11cb6504012655883ccfa202b5add55529152728 / @ifedapoolarewaju)
- @uppy/tus: fix cannot start more uploads after cancel (#1429 / @ap--)
- @uppy/website: Remove Plugins subsection, create Contributing subsection (#1435 / @kvz)
- examples: Added node-xhr, php-xhr, python-xhr (#1389 / @samuelayo, @arturi)
- website: New doc menu structure (#1405 / @kvz)

### 0.30.4

Released: 2019-04-04

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 0.30.4 | @uppy/progress-bar | 0.30.4 |
| @uppy/aws-s3 | 0.30.4 | @uppy/provider-views | 0.30.4 |
| @uppy/companion-client | 0.28.4 | @uppy/react | 0.30.4 |
| @uppy/companion | 0.17.4 | @uppy/redux-dev-tools | 0.30.4 |
| @uppy/core | 0.30.4 | @uppy/robodog | 0.30.4 |
| @uppy/dashboard | 0.30.4 | @uppy/status-bar | 0.30.4 |
| @uppy/drag-drop | 0.30.4 | @uppy/thumbnail-generator | 0.30.4 |
| @uppy/dropbox | 0.30.4 | @uppy/transloadit | 0.30.4 |
| @uppy/file-input | 0.30.4 | @uppy/tus | 0.30.4 |
| @uppy/form | 0.30.4 | @uppy/url | 0.30.4 |
| @uppy/golden-retriever | 0.30.4 | @uppy/utils | 0.30.4 |
| @uppy/google-drive | 0.30.4 | @uppy/webcam | 0.30.4 |
| @uppy/informer | 0.30.4 | @uppy/xhr-upload | 0.30.4 |
| @uppy/instagram | 0.30.4 | uppy | 0.30.4 |

- build: ⚠️ remove !important (postcss-safe-important) (#1344 / @arturi)
- @uppy/core: un-hardcode concat in `youCanOnlyUploadFileTypes` locale: In some languages, it probably doesn't make much sense to put the list
of allowed file types at the end. The list of mime types/extensions may not be desired at all, so now you can omit %{types} to not show it. (#1374 / @goto-bus-stop)
- @uppy/core: ⚠️ YMPT™: Yet More Progress Tweaks — #1093 accidentally omitted file size reporting for GDrive/Dropbox uploads, this adds it back.
Unsized files (like instagram photos) now are stored with size: null instead of 0 (#1376 / @goto-bus-stop)
- @uppy/core: make allowedFileTypes extensions case insensitive (#1341 / @goto-bus-stop)
- @uppy/companion: ⚠️ fix instagram hanging uploads (#1274 / @ifedapoolarewaju)
- @uppy/companion-client: remove the use of window.location for React Native support (#1393 / @ifedapoolarewaju)
- typescript: ⚠️ fix uppy package use with allowSyntheticImports: false (#1396 / @goto-bus-stop)
- @uppy/core: ⚠️ remove console.dir, since it’s probably unnessesary now and not supported in React Native (@arturi / a4f94a8d6b475657837f7c51dfb0670cc77fc3de)
- @uppy/xhr-upload: allow customized option to set upload status (#1360 / @Mactaivsh)
- @uppy/dashboard: fix icons jiggling on hover in safari (#1410 / @lakesare)
- @uppy/dashboard: the list items are now even out (#1398 / @lakesare)
- @uppy/dashboard: remove jumpiness (mobile --> desktop) when uppy loads (#1383 / @lakesare)
- @uppy/dashboard: Protect some more styles from bleeding (#1362 / @arturi)
- build: Refactor npm scripts, clean up unused ones (#1392 / @kvz, @arturi)
- build: Speed up website deploys (73f89f08d9dde9e096285a952528976a69d923cf / @kvz)
- @uppy/xhr-upload: ⚠️ load CompanionClient appropriately (c1abfea33d0c3e80809814c1048b156028c8fcf9 / @ifedapoolarewaju)
- @uppy/companion: ⚠️ send null when download is complete (@ifedapoolarewaju / de04c7978c6713995cbf1717f6ca7ffd292cdeb1)
- @uppy/companion: overwrite bytestotal for only tus uploads (d9ec8d28f4c97da4c0dcb46fbf5804a0ee484eeb / @ifedapoolarewaju)
- @uppy/companion: install git so we can fetch tus-js-client fork (#1404 / @goto-bus-stop)
- @uppy/companion-client: ⚠️ return 401 for invalid access token (#1298 / @ifedapoolarewaju)
- @uppy/companion-client: ⚠️ add asyn wrapper around token storage (#1369 / @ifedapoolarewaju)
- @uppy/companion: Updated the callback URIs to reflect their correct location (#1366 / @HughbertD)
- @uppy/companion: do not use Uploader instance if options validation failed #1354
- @uppy/status-bar: fix StatusBar error tooltip positioning (f83b4b06d958a1f7e78885a61b645c3371feb1ae / @arturi)
- @uppy/google-drive Show thumbnails instead of a generic icon in Google Drive (#1363 / @arturi)
- @uppy/dropbox: HTTP-header-safe JSON for dropbox (#1371 / @yonahforst)
- @uppy/informer: made the tooltip not overflow the uppy container (#1382 / @lakesare)
- @uppy/aws-s3-multipart: for remote aws-s3 uploads (#1350 / @ifedapoolarewaju)
- examples: use template + demo key for transloadit-textarea example (#1375 / @goto-bus-stop)
- website: add markdown snippets example (#1379 / @arturi)
- website: provide simple framework for doing blog post series (#1373 / @kvz)
- locales: Remove outdated locales for now (#1355 / @arturi)
- @uppy/thumbnail-generator: do not export tainted canvas, fixes #1321 (#1343 / @goto-bus-stop)
- @uppy/companion: replace text only when text is valid (985fd62ed6017ea3786eefd2c222caeb26d7998e / @ifedapoolarewaju)

### 0.30.3

Released: 2019-03-08

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 0.30.3 | @uppy/provider-views | 0.30.3 |
| @uppy/aws-s3 | 0.30.3 | @uppy/react | 0.30.3 |
| @uppy/companion-client | 0.28.3 | @uppy/redux-dev-tools | 0.30.3 |
| @uppy/companion | 0.17.3 | @uppy/robodog | 0.30.3 |
| @uppy/core | 0.30.3 | @uppy/status-bar | 0.30.3 |
| @uppy/dashboard | 0.30.3 | @uppy/store-default | 0.28.3 |
| @uppy/drag-drop | 0.30.3 | @uppy/store-redux | 0.28.3 |
| @uppy/dropbox | 0.30.3 | @uppy/thumbnail-generator | 0.30.3 |
| @uppy/file-input | 0.30.3 | @uppy/transloadit | 0.30.3 |
| @uppy/form | 0.30.3 | @uppy/tus | 0.30.3 |
| @uppy/golden-retriever | 0.30.3 | @uppy/url | 0.30.3 |
| @uppy/google-drive | 0.30.3 | @uppy/utils | 0.30.3 |
| @uppy/informer | 0.30.3 | @uppy/webcam | 0.30.3 |
| @uppy/instagram | 0.30.3 | @uppy/xhr-upload | 0.30.3 |
| @uppy/progress-bar | 0.30.3 | uppy | 0.30.3 |

- @uppy/dashboard: Dashboard a11y improvements: trap focus in the active panel only (#1272 / @arturi)
- @uppy/companion: Make providers support react native (#1286 / @ifedapoolarewaju)
- @uppy/xhr-upload: Reject cancelled uploads (#1316 / @arturi)
- @uppy/aws-s3: Avoid throwing error when file has been removed (#1318 / @craigjennings11)
- @uppy/companion: Remove resources requirements for companion (#1311 / @kiloreux)
- @uppy/webcam: Don’t show Smile! if countdown is false (#1324 / @arturi)
- docs: update webpack homepage URLs, update Robodog readme (#1323 / @goto-bus-stop)

### 0.30.1 - 0.30.2

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 0.30.2 | @uppy/provider-views | 0.30.2 |
| @uppy/aws-s3 | 0.30.2 | @uppy/react | 0.30.2 |
| @uppy/companion-client | 0.28.2 | @uppy/redux-dev-tools | 0.30.2 |
| @uppy/companion | 0.17.2 | @uppy/robodog | 0.30.2 |
| @uppy/core | 0.30.2 | @uppy/status-bar | 0.30.2 |
| @uppy/dashboard | 0.30.2 | @uppy/store-default | 0.28.2 |
| @uppy/drag-drop | 0.30.2 | @uppy/store-redux | 0.28.2 |
| @uppy/dropbox | 0.30.2 | @uppy/thumbnail-generator | 0.30.2 |
| @uppy/file-input | 0.30.2 | @uppy/transloadit | 0.30.2 |
| @uppy/form | 0.30.2 | @uppy/tus | 0.30.2 |
| @uppy/golden-retriever | 0.30.2 | @uppy/url | 0.30.2 |
| @uppy/google-drive | 0.30.2 | @uppy/utils | 0.30.2 |
| @uppy/informer | 0.30.2 | @uppy/webcam | 0.30.2 |
| @uppy/instagram | 0.30.2 | @uppy/xhr-upload | 0.30.2 |
| @uppy/progress-bar | 0.30.2 | uppy | 0.30.2 |

- @uppy/robodog: Add Robodog to CDN (#1304 / @kvz, @arturi)

### 0.30.0

- @uppy/robodog: 📣⚠️Add Robodog — Transloadit browser SDK (#1135 / @goto-bus-stop)
- @uppy/core: Set response in Core rather than in upload plugins (#1138 / @arturi)
- @uppy/core: Don’t emit a complete event if an upload has been canceled (#1271 / @arturi)
- @uppy/companion: Support redis option (auth_pass, etc...) (#1215 / @tranvansang)
- @uppy/companion: sanitize text before adding to html (f77a102 / @ifedapoolarewaju)
- @uppy/dashboard: Update pause-resume-cancel icons (#1241 / @arturi, @nqst)
- @uppy/dashboard: Fix issues with multiple modals (#1258 / @goto-bus-stop, @arturi)
- @uppy/dashboard: Dashboard ui fixes: fix icon animation jiggling, inherit font, allow overriding outline, fix breadcrumbs, bug with x button being stuck, fix an issue with long note margin on mobile (#1279 / @arturi)
- @uppy/provider-views: update instagram nextPagePath after every fetch  (25e31e5 / @ifedapoolarewaju)
- @uppy/react: Allow changing instance in `uppy` prop (#1247 / @goto-bus-stop)
- @uppy/react: Typescript: Make DashboardModal.target prop optional (#1254 / @mattes3)
- @uppy/aws-s3: Use user provided filename / type for uploaded object, fixes #1238 (#1257 / @goto-bus-stop)
- @uppy/tus: Update to tus-js-client@1.6.0 with React Native support (#1250 / @arturi)
- build: Improve dev npm script: Use Parcel for bundled example, re-build lib automatically, don’t open browser and no ghosts mode, start companion when developing (but there’s optional npm run dev:no-companion) (#1280 / @arturi)

### 0.29.1

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 0.29.1 | @uppy/provider-views | 0.29.1 |
| @uppy/aws-s3 | 0.29.1 | @uppy/react | 0.29.1 |
| @uppy/companion-client | 0.27.3 | @uppy/redux-dev-tools | 0.29.1 |
| @uppy/companion | 0.16.1 | @uppy/status-bar | 0.29.1 |
| @uppy/core | 0.29.1 | @uppy/store-default | 0.27.1 |
| @uppy/dashboard | 0.29.1 | @uppy/store-redux | 0.27.1 |
| @uppy/drag-drop | 0.29.1 | @uppy/thumbnail-generator | 0.29.1 |
| @uppy/dropbox | 0.29.1 | @uppy/transloadit | 0.29.1 |
| @uppy/file-input | 0.29.1 | @uppy/tus | 0.29.1 |
| @uppy/form | 0.29.1 | @uppy/url | 0.29.1 |
| @uppy/golden-retriever | 0.29.1 | @uppy/utils | 0.29.1 |
| @uppy/google-drive | 0.29.1 | @uppy/webcam | 0.29.1 |
| @uppy/informer | 0.29.1 | @uppy/xhr-upload | 0.29.1 |
| @uppy/instagram | 0.29.1 | uppy | 0.29.1 |
| @uppy/progress-bar | 0.29.1 | - | - |

- @uppy/react: ⚠️ Make Uppy’s React components usable from Typescript (#1131 / @mattes3)
- build: ⚠️ CJSify @uppy/core typings + add more typings tests (#1194 / @goto-bus-stop)
- build: ⚠️ Added Promise and Fetch polyfills to uppy bundle (#1187 / @arturi)
- build: ⚠️ Only rebuild changed files with `npm run build:lib` (#1237 / @goto-bus-stop)
- build: ⚠️ Remove jsnext:main since it’s been deprecated https://github.com/stereobooster/package.json#jsnextmain (#1242 / @arturi)
- @uppy/companion: ⚠️ Fix: return next page path for ig only when posts exist (e5a2694a2d95e1923dd2ca515e7d37132a5828ba / @ifedapoolarewaju)
- @uppy/status-bar: Account for MS Edge’s missing progress updates, fixes #945. Previously, upload progress would be stuck at 0% until everything is finished. With this patch, in the affected MS Edge versions, the status bar is transformed into an “indeterminate” progress state (#1184 / @goto-bus-stop)
- @uppy/dashboard: Log error if `trigger` is not found (#1217 / @goto-bus-stop)
- @uppy/xhr-upload: Fix `responseType` in IE 11, fixes #1228: The same restriction applies to responseType as to withCredentials. Both must be set after the open() call in Internet Explorer. (#1231 / @goto-bus-stop)
- @uppy/xhr-upload: Postpone timeout countdown until upload has started (i.e. has left browser concurrency queue (fixes #1190) (#1195 / @davilima6)
- website: Add polyfills to website examples that do not use prebundled uppy.js (#1229 / @goto-bus-stop)
- docs: Add privacy policy (#1196 / @arturi)
- docs: Update aws-s3.md wrt S3 public access settings (#1236 / @manuelkiessling)
- @uppy/companion: deprecate deprecate debugLogger (8f9946346904217e714e256db06b759cc3bb66b0 / @ifedapoolarewaju)
- @uppy/companion: Update morgan dependency, fixes #1227 (#1232 / @goto-bus-stop)

### 0.29.0

| Package | Version | Package | Version |
|-|-|-|-|
| @uppy/aws-s3-multipart | 0.29.0 | @uppy/progress-bar | 0.29.0 |
| @uppy/aws-s3 | 0.29.0 | @uppy/provider-views | 0.29.0 |
| @uppy/companion | 0.16.0 | @uppy/react | 0.29.0 |
| @uppy/core | 0.29.0 | @uppy/redux-dev-tools | 0.29.0 |
| @uppy/dashboard | 0.29.0 | @uppy/status-bar | 0.29.0 |
| @uppy/drag-drop | 0.29.0 | @uppy/thumbnail-generator | 0.29.0 |
| @uppy/dropbox | 0.29.0 | @uppy/transloadit | 0.29.0 |
| @uppy/file-input | 0.29.0 | @uppy/tus | 0.29.0 |
| @uppy/form | 0.29.0 | @uppy/url | 0.29.0 |
| @uppy/golden-retriever | 0.29.0 | @uppy/utils | 0.29.0 |
| @uppy/google-drive | 0.29.0 | @uppy/webcam | 0.29.0 |
| @uppy/informer | 0.29.0 | @uppy/xhr-upload | 0.29.0 |
| @uppy/instagram | 0.29.0 | uppy | 0.29.0 |

- @uppy/core: ⚠️ **breaking** Separate Core and Plugin styles — @uppy/core styles and plugins (@uppy/webcam, for example) now have to be included separately (#1167 / @arturi)
- @uppy/core: Don't pass removed file IDs to next upload step, fixes (#1148 / @goto-bus-stop)
- @uppy/core: Fixed getFileType() when passed a file with an upper case extension (#1169 / @jderrough)
- @uppy/xhr-upload: Add `responseType` option — allows configuring the XMLHttpRequest `.responseType` value (#1150 / @goto-bus-stop)
- @uppy/companion: Use `createCipheriv` instead of deprecated `createCipher` (#1149 / @goto-bus-stop)
- @uppy/companion: Store Provider instances on `this.provider` instead of `this[this.id]` (@goto-bus-stop / #1174)
- @uppy/companion: Pin grant to known stable version (@ifedapoolarewaju / #1165)
- @uppy/companion: Fix — socket does not handle server.path option (#1142 / @tranvansang)
- @uppy/status-bar: Use file sizes for progress calculations (#1153 / @goto-bus-stop)
- @uppy/webcam: Fix a bug with Webcam video overflowing its container (68730f8a1bf731898d46883e00fed937d3ab54ab / @arturi)
- docs: Add `triggerUploadOnSubmit` to Form docs, add docs about options of hiding upload/pause/resume/cancel buttons; talk about bundler-less polyfill use (@goto-bus-stop, @arturi)
- @uppy/dashboard: Better center pause/resume/cancel icons (@arturi / 5112ecf1f48bec9c67309244120fce5f005241ce)
- @uppy/react: Allow Dashboard props width and height to accept a string for 100% (#1129 / craigcbrunner)
- Added note about uppy bundle polyfils in uppy readme.md (@goto-bus-stop)

### 0.28.0

| Package | Version | Package | Version |
|-|-|-|-|
| uppy | 0.28.0 | @uppy/xhr-upload | 0.28.0 |
| @uppy/core | 0.28.0 | @uppy/react | 0.28.0 |
| @uppy/dashboard | 0.28.0 | @uppy/transloadit | 0.28.0 |
| @uppy/dropbox | 0.28.0 | @uppy/tus | 0.28.0 |
| @uppy/form | 0.28.0 | @uppy/url | 0.28.0 |
| @uppy/informer | 0.28.0 | @uppy/webcam | 0.28.0 |
| @uppy/utils | 0.28.0 | @uppy/url | 0.28.0 |
| @uppy/thumbnail-generator | 0.28.0 | @uppy/status-bar | 0.28.0 |
| @uppy/redux-dev-tools | 0.28.0 | @uppy/react | 0.28.0 |
| @uppy/provider-views | 0.28.0 | @uppy/progress-bar | 0.28.0 |
| @uppy/instagram | 0.28.0 | @uppy/informer | 0.28.0 |
| @uppy/google-drive | 0.28.0 | @uppy/golden-retriever | 0.28.0 |
| @uppy/form | 0.28.0 | @uppy/file-input | 0.28.0 |
| @uppy/dropbox | 0.28.0 | @uppy/drag-drop | 0.28.0 |
| @uppy/dashboard | 0.28.0 | @uppy/companion | 0.15.0 |
| @uppy/aws-s3 | 0.28.0 | @uppy/aws-s3-multipart | 0.28.0 |

- @uppy/core: bring back i18n locale packs (#1114 / @goto-bus-stop, @arturi)
- @uppy/companion: option validation (can use https://npm.im/ajv + JSON schema)
- @uppy/companion: Remove duplicate typescript dependency (#1119 / @goto-bus-stop)
- @uppy/companion: ⚠️ **breaking** Migrate provider adapter to Companion: saves 5KB on the frontend, all heavy lifting moved to the server side (#1093 / @ifedapoolarewaju)
- @uppy/core: single-use Uppy instance: adds an `allowMultipleUploads` option to @uppy/core. If set to false, uppy.upload() can only be called once. Afterward, no new files can be added and no new uploads can be started. This is intended to serve the `<form>`-like use case. (#1064 / @goto-bus-stop)
- @uppy/dashboard: Auto close after finish using `closeAfterFinish: true` (#1106 / @goto-bus-stop)
- @uppy/dashboard: call `hideAllPanels` after a file is added in Dashboard, instead of `toggleAddFilesPanel(false)` that didn’t hide some panels
- @uppy/status-bar: ⚠️ **breaking** Add spinner, pause/resume as small round buttons, different color for encoding; Added separate options for hiding pause/resume and cancel button; Added more statuses to the Dashboard, like “Upload complete”, “Upload paused” and “Uploading 5 files” (#1097 / @arturi)
- @uppy/url: add end2end test for Url plugin (#1120 / @ifedapoolarewaju)
- @uppy/transloadit: add end2end test for @uppy/transloadit (#1086 / @arturi)
- @uppy/thumbnail-generator: Add thumbnail generation integration test (#970 / @goto-bus-stop)
- @uppy/thumbnail-generator: Allow to constrain thumbnail height, fixes #979 (@richartkeil / #1096)
- @uppy/thumbnail-generator: Fix JPG previews on Edge (#1092 / @goto-bus-stop)
- @uppy/aws-s3: use RequestClient, it contains the Uppy Companion specific stuff, so we don't have to think about that when working on the S3 plugin. (#1091 / @goto-bus-stop)
- @uppy/transloadit: Add `COMPANION_PATTERN` constant (#1104 / @goto-bus-stop)
- @uppy/transloadit: Error tweaks (#1103 / @goto-bus-stop)
- @uppy/webcam: Fix getting data from Webcam recording if mime type includes codec metadata (#1094 / @goto-bus-stop)
- @uppy/core: remove upload-cancel event, file-removed should be enough (#1069 / @arutri)
- meta: document events, deprecate unused (#1069 / @arturi)
- meta: New demo video/gif and website frontpage code sample (#1099 / @arturi)
- meta: Update react.md (#1110 / @asmt3)
- meta: Add missing addMoreFiles string to locale (#1111 / @FWirtz)
- meta: Release script improvements: generate nicer releases and a nicer commit history. (#1122 / @goto-bus-stop)
- meta: Add release documentation. eg: test on transloadit website, check examples on the uppy.io website (@goto-bus-stop)

### 0.27.5

Released: 2018-09-27

| Package | Version | Package | Version |
|-|-|-|-|
| uppy | 0.27.5 | @uppy/instagram | 0.27.5 |
| @uppy/core | 0.27.3 | @uppy/react | 0.27.5 |
| @uppy/dashboard | 0.27.5 | @uppy/transloadit | 0.27.5 |
| @uppy/dropbox | 0.27.4 | @uppy/tus | 0.27.5 |
| @uppy/form | 0.27.4 | @uppy/url | 0.27.5 |
| @uppy/informer | 0.27.4 | @uppy/webcam | 0.27.4 |

- core: Add `onMount()` and `this.parent` to Plugin (#1062 / @arturi)
- core: Call `removeFile` on each file when doing `cancelAll` (#1058 / @arturi)
- dashboard: Fixing “ResizeObserver is not a constructor”, issue #1070, by doing `require('resize-observer-polyfill').default || require('resize-observer-polyfill')` (#1078 / @yoldar, @arturi, @goto-bus-stop)
- dashboard: Only show the plus button if `props.totalFileCount < props.maxNumberOfFiles` (#1063 / @arturi)
- status-bar: use `uppy-Root` in Status Bar when it’s mounted in DOM (#1081 / @arturi)
- docs: added `uppy.off()` info (#1077 / @dviry)
- docs: quick start guide, add simple HTML page snippet with Uppy https://community.transloadit.com/t/quick-start-guide-would-be-really-helpful/14605 (#1068 / @arturi)

### 0.27.4

Released: 2018-09-18

New versions in this release:

| Package | Version | Package | Version |
|-|-|-|-|
| uppy | 0.27.4 | @uppy/instagram | 0.27.4 |
| @uppy/companion | 0.14.4 | @uppy/react | 0.27.4 |
| @uppy/core | 0.27.2 | @uppy/transloadit | 0.27.4 |
| @uppy/dashboard | 0.27.4 | @uppy/tus | 0.27.4 |
| @uppy/dropbox | 0.27.3 | @uppy/url | 0.27.4 |
| @uppy/form | 0.27.3 | @uppy/webcam | 0.27.3 |
| @uppy/informer | 0.27.3 | - | - |

Changes:

- build: Add initial version table script (@goto-bus-stop)
- build: Add more checks to release script (#1050 / @goto-bus-stop)
- build: start companion once in tests (#1052 / @ifedapoolarewaju)
- buid: set companion config values when running test (@ifedapoolarewaju)
- @uppy/core: Note that the `<script>` tag should come at the bottom of the page (#1043 / @arturi)
- @uppy/dashboard: Add paddings and remove outline-offset for tab buttons so that the outline is visible (26037ac145111d3c636a63840bb4daa61304bae5 / @arturi)
- @uppy/dashboard: Replace updateDashboardElWidth with ResizeObserver (using resize-observer-polyfill) (#1053 / @arturi)
- @uppy/dashboard: Add showSelectedFiles option (#1055 / @arturi)
- @uppy/dashboard: Fix incorrect title (tooltip) message on file preview by refactoring (#1056 / @arturi)
- @uppy/companion: Google Drive: Support Team Drives (#978 / @pauln)
- @uppy/companion: Provider integration test fixes #(1013 / @goto-bus-stop)
- @uppy/companion: Fix bug: oauth always redirects to root path (#1030 / @tranvansang)
- @uppy/companion: Fix certificate generation for companion (#1041 / @kiloreux)

### 0.27.3

Released: 2018-09-03.

New versions in this release:

| Package | Version | Package | Version |
|-|-|-|-|
| uppy | 0.27.3 | @uppy/instagram | 0.27.3 |
| @uppy/aws-s3-multipart | 0.27.2 | @uppy/progress-bar | 0.27.2 |
| @uppy/aws-s3 | 0.27.2 | @uppy/provider-views | 0.27.2 |
| @uppy/companion-client | 0.27.2 | @uppy/react | 0.27.3 |
| @uppy/companion | 0.14.3 | @uppy/redux-dev-tools | 0.27.2 |
| @uppy/core | 0.27.1 | @uppy/status-bar | 0.27.2 |
| @uppy/dashboard | 0.27.3 | @uppy/thumbnail-generator | 0.27.2 |
| @uppy/drag-drop | 0.27.2 | @uppy/transloadit | 0.27.3 |
| @uppy/dropbox | 0.27.2 | @uppy/tus | 0.27.3 |
| @uppy/file-input | 0.27.2 | @uppy/url | 0.27.3 |
| @uppy/form | 0.27.2 | @uppy/utils | 0.27.1 |
| @uppy/golden-retriever | 0.27.2 | @uppy/webcam | 0.27.2 |
| @uppy/google-drive | 0.27.3 | @uppy/xhr-upload | 0.27.2 |
| @uppy/informer | 0.27.2 | - | - |

Changes:

- build: Update readme contributors list before publish (#1023 / @goto-bus-stop)
- build: Enable cssnano safe mode. Fixes `z-index` primarily. (@goto-bus-stop)
- @uppy/status-bar: Show number of started uploads, fixes #983 (@goto-bus-stop)
- @uppy/thumbnail-generator: Remove image clear code, fixes #1025. (#1028 / @goto-bus-stop)
- @uppy/aws-s3-multipart: Proper cleanup on cancellation, fixes #992 (#1021 / @goto-bus-stop)
- @uppy/utils: Add fallback to `getFileType` (#1022 / @goto-bus-stop)
- @uppy/transloadit: Lazy load socket.io-client, avoiding `buffer` warnings in IE10 when using the `uppy` CDN package. (#1019 / @goto-bus-stop)
- @uppy/webcam: Fix for Cordova mangling new File instances (#1034 / @firesharkstudios)
- @uppy/xhr-upload: Add file name to Blob instance uploads (#1034 / @firesharkstudios)
- @uppy/transloadit: Only use socket.io's WebSocket transport. (#1029 / @goto-bus-stop)
- @uppy/companion: Rename `UPPYSERVER_` environment variables to `COMPANION_` + more. The old names still work for now but will be dropped in a future release (#1037 / @kvz)
- ⚠️ **breaking** @uppy/transloadit: Change hosted Companion URLs to `https://api2.transloadit.com/companion`, using the hosted uppy-server URLs will now throw an error (#1038 / @goto-bus-stop)

### 0.27.2

Released: 2018-08-23.

New versions in this release:

| Package | Version | Package | Version |
|-|-|-|-|
| uppy | 0.27.2 | @uppy/react | 0.27.2 |
| @uppy/companion | 0.14.2 | @uppy/transloadit | 0.27.2 |
| @uppy/dashboard | 0.27.2 | @uppy/tus | 0.27.2 |
| @uppy/google-drive | 0.27.2 | @uppy/url | 0.27.2 |
| @uppy/instagram | 0.27.2 | - | - |

Changes:

- @uppy/companion: Auto deploy Companion. (#1008 / @kiloreux)
- @uppy/transloadit: Refactors and add fallback if socket connection fails. (#1011 / @goto-bus-stop)
- ci: No need to web:install if we're not deploying. (#1012 / @goto-bus-stop)

### 0.27.1

Released: 2018-08-16.

New versions in this release:

| Package | Version | Package | Version |
|-|-|-|-|
| uppy | 0.27.1 | @uppy/instagram | 0.27.1 |
| @uppy/aws-s3-multipart | 0.27.1 | @uppy/progress-bar | 0.27.1 |
| @uppy/aws-s3 | 0.27.1 | @uppy/provider-views | 0.27.1 |
| @uppy/companion-client | 0.27.1 | @uppy/react | 0.27.1 |
| @uppy/companion | 0.14.1 | @uppy/redux-dev-tools | 0.27.1 |
| @uppy/dashboard | 0.27.1 | @uppy/status-bar | 0.27.1 |
| @uppy/drag-drop | 0.27.1 | @uppy/thumbnail-generator | 0.27.1 |
| @uppy/dropbox | 0.27.1 | @uppy/transloadit | 0.27.1 |
| @uppy/file-input | 0.27.1 | @uppy/tus | 0.27.1 |
| @uppy/form | 0.27.1 | @uppy/url | 0.27.1 |
| @uppy/golden-retriever | 0.27.1 | @uppy/webcam | 0.27.1 |
| @uppy/google-drive | 0.27.1 | @uppy/xhr-upload | 0.27.1 |
| @uppy/informer | 0.27.1 | - | - |

Changes:

- @uppy/companion: use explicit typescript devDependency.
- @uppy/companion: rename Server → Companion in documentation (#1007 / @goto-bus-stop)
- website: Load all prism languages (#1004 / @goto-bus-stop)
- @uppy/core: Fix peerDependencies of plugin packages. (#1005 / @goto-bus-stop)
- @uppy/companion-client: Send cookies with fetch requests (#1000 / @geoffappleford)
- Add e2e test for providers (#990 / @ifedapoolarewaju)
- website: attempt to fix font sizes on mobile vs desktop (@arturi)
- @uppy/dashboard:  show note and “powered by” when no acquire/sources plugins are used too (@arturi)
- Update dependencies. (#995 / @goto-bus-stop)

### 0.27.0

Released: 2018-08-11.

- @uppy/aws-s3-multipart: Check for file existance (#981 / @bartvde)
- @uppy/aws-s3: Abort all chunk requests when aborting the multipart upload (#967 / @pekala)
- @uppy/aws-s3: Catch and handle errors in prepareUploadPart (#966 / @pekala)
- @uppy/companion: ⚠️ **breaking** rename uppy-server to @uppy/companion (#953 / @ifedapoolarewaju)
- @uppy/companion: google Drive — move to v3 API (#977 / @pauln)
- @uppy/core: allow editing plugin titles (names) so that e.g. “Camera” can be translated into different languages, fixes #920 (#942 / @arturi)
- @uppy/core: fix `setPluginState` (#968 / @goto-bus-stop)
- @uppy/core: make Uppy run in React Native (by adding `window !== undefined` check) (@arturi / #960)
- @uppy/core: remove all: initial — was causing issues when multiple uppy stylesheets are used (#942 / @arturi)
- @uppy/core: ⚠️ **breaking**  default `autoProceed` to `false` (#961 / @arturi)
- @uppy/dashboard: downgrade `drag-drop` module to support folders again (#942 / @arturi)
- @uppy/dashboard: fix animation — wait for closing animation to finish before opening modal (#942 / @arturi)
- @uppy/dashboard: ⚠️ **breaking** Introduce `.uppy-size--md` and `.uppy-size--lg` breakpoint classes; throttle the function that checks for width (#942 / @arturi)
- @uppy/dashboard: ⚠️ **breaking** UI overhaul: AddFiles panel, significantly improved mobile styles,  (#942 / @arturi, @nqst)
- @uppy/informer: ⚠️ **breaking** make it monochrome and round. always gray, no status colors (#942 / @arturi)
- @uppy/provider-views: fix wrong 'no files available' msg flash (#938 / @ifedapoolarewaju)
- @uppy/url: fix Url plugin reacting to wrong drop/paste events, add ignoreEvent (#942 / @arturi)
- @uppy/webcam: add webcam permission screen i18 strings, fixes #931 (#942 / @arturi)
- build: Add object rest spread transform (#965 / @goto-bus-stop)
- build: Split integration tests and add one using create-react-app (#952 / @goto-bus-stop)
- build: Upload to CDN when commit starts with “Release” (#989 / @arturi)
- website: docs fixes and improvements @@AJvanLoon)
- website: list bundle sizes for each package on stats page (#962 / @goto-bus-stop)

### 0.26.0

Released: 2018-06-28.

- ⚠️ **breaking** split into many packages (#906 / @goto-bus-stop, @arturi)
- xhr-upload: Add `withCredentials` option (#874 / @tuoxiansp)
- utils: Move single-use utils into their appropriate packages. (#926 / @goto-bus-stop)
- core: Export Plugin class from @uppy/core (#924 / @goto-bus-stop)
- Typescript typings improvements (#923 / @goto-bus-stop)
- core: change focus to solid line for all elements (ade214e5aab822e1fc3ab8e0fac80c4fc04d7bc3 / @arturi)
- dashboard: fix Dashboards tabs overflow by adding scroll; improve scroll (b974244c7f4e01adcf2478b7f651dada63d342f1 / @arturi)

### 0.25.6

Released: 2018-06-25.

- core: ⚠️ **breaking** rename `host` option to `serverUrl` (#905 / @ifedapoolarewaju)
- dashboard: added browser back button listening (#575 / @zcallan)
- core: Split utils into separate files (#899 / @goto-bus-stop)
- providers: Better provider errors (#895 / @arturi)
- instagram: better thumbnail quality for ig (#901, #887 / @ifedapoolarewaju)
- core: add `types` to uppy npm package (#0c2d66e8ac005d6a4200948de1bc3a44057f0393 / @arturi)

### 0.25.5

Released: 2018-06-13.

- build: exclude and ignore `node_modules` from `test/endtoend` (@arturi, @kvz / #a60c2f0c641f7db580937ebbc0884e25c8ef8583, #355f696a74d8ec56381578f1fb5ad9c913fe8200)

### 0.25.4

Released: 2018-06-13.

- providers: hanging URL upload (#8e13f416f74e7a453e7bdc829e9618f3b7d68804 / @ifedapoolarewaju)
- url: fix input focus (#3f9aa3bb7fc7ce5814fe50268a6f88f5965d9f16 / @arturi)

### 0.25.3

Released: 2018-06-12.

- core: fix/refactor `uppy.close()` and `uppy.removePlugin(plugin)`: Remove plugins immutably when uppy.close() is called, not just uninstall; emit event `plugin-remove` before removing plugin; remove plugins from Dashboard when they are removed from Uppy; check if plugin exists in Uppy before re-rendering, since debounced re-render can happen after a plugin is removed, that’s been causing issues in #890 (#898 / @arturi)
- tests: run integration tests with npm-installed uppy (#880 / @ifedapoolarewaju)
- xhrupload: add withCredentials option (#874 / @tuoxiansp, @b1ncer)
- xhrupload: Move .withCredentials assignment to after open(): IE 10 doesn't allow setting it before open() is called (#2698b599d716743bbf7ed3ac70c648fef0fd8976 / @goto-bus-stop)
- thumbnailgenerator: Polyfill Math.log2 since IE11 doesn't support this method (#4ddc9da47b13c9dfe49155d8c3bcd76b9fa494f2. #892 / @DJWassink)
- core: add eslint-plugin-compat (@goto-bus-stop, #894)
- dashboard: remove Dashboard bottom margin, since “powered by” has been moved (#a561e4e7a2c18f5092ba03185e0836ffa6796d04 / @arturi)
- dashboard: fix Dashboard open/close animation on small screen (#982d27f62693c0eb026e381d10157afffe1eeb64 / @arturi)
- awss3: Don't set uploadURL when success_action_status was missing (#900 / @goto-bus-stop)
- thumbnailgenerator: Add id option to ThumbnailGenerator (#8cded8160b19d3324d9e14be122c4038ed0b9403 / @arturi)
- react: tiny improvement for Uppy React example (645e15166a6bd100351de131982df080bc71aac6 / @arturi)

### 0.25.2

Released: 2018-06-05.

- transloadit: `file.remote` --> `file.remote.host`, since `remote` is an object (aa8247b6e2aeffc5aa237b983d88faae53819133 / @ifedapoolarewaju, @arturi)
- dashboard: Move `poweredByUppy` inside the Dashboard (a5f23c7fd57a0a0a554580b5d5423f54b39c2444 / @arturi)

### 0.25.1

Released: 2018-06-05.

- provider: fix — match origin pattern for non-static hosts, add `hostPattern` option — a regular expression, for Uppy Server running on `server1.example.com` and `server2.example.com`, you should set `hostPattern: '.example.com$'` (644da749dfb4ecc5c32c744f155fc4c1b07fce13 / @ifedapoolarewaju)
- provider: fix — check for non protocol defined urls in provider requests (5af90f4fe5c10ee4f32cc4471458cea994ef519a / @ifedapoolarewaju)
- provider: fix — strip protocol before comparing urls (a22c897013e3de5b324bb31683706e8390169978 / @ifedapoolarewaju)
- provider: feature: display username in provider view by @ifedapoolarewaju, this is a fix, got lost in PR merge/rebase (1f3a2bb7ddce2b6f1eaa5476be28cebb4529a3bd / @ifedapoolarewaju)
- provider: Tolerate trailing slashes in `host` options (having a trailing slash in a host option used to break providers) (#885 / @goto-bus-stop)
- s3: Fix uploadURL for presigned PUT uploads — strips the query string from the URL used for a successful PUT upload to determine the `uploadURL` (#886 / @goto-bus-stop)
- dashboard: fix line-height in Dashboard tabs (3a7ee860340afcf7abf61be38b0e1398fbe75923 / @arturi)
- docs: typos and polish (@AJvanLoon)
- website: improve syntax highlighting on the website — uses prismjs for syntax highlighting instead of highlight.js; the primary motivation is that highlight.js does not support JSX, while prism does (#884 / @goto-bus-stop)

### 0.25.0

Released: 2018-06-01.

- core: ⚠️ **breaking** Removed `.run()` (to solve issues like #756), just `.use()` all the way (#793 / goto-bus-stop)
- core: ⚠️ **breaking** Changed some of the strings that we were concatenating in Preact, now their interpolation is handled by the Translator instead. This is important for languages that have different word order than English. (#845 / @goto-bus-stop)
Changed strings:
  - core: `failedToUpload` needs to contain `%{file}`, substituted by the name of the file that failed
  - dashboard: `dropPaste` and `dropPasteImport` need to contain `%{browse}`, substituted by the "browse" text button
  - dashboard: `editing` needs to contain `%{file}`, substituted by the name of the file being edited
  - dashboard: `fileSource` and `importFrom` need to contain `%{name}`, substituted by the name of the provider
  - dragdrop: `dropHereOr` needs to contain `%{browse}`, substituted by the "browse" text button
- providers: ⚠️ **breaking** select files only after “select” is pressed, don’t add them right away when they are checked — better UI + solves issue with autoProceed uploading in background, which is weird; re-read https://github.com/transloadit/uppy/pull/419#issuecomment-345210519(#826 / @goto-bus-stop, @arturi)
- core: Add error if trying to setFileState() for a file that’s been removed; clear error on cancelAll (#864 / @goto-bus-stop, @arturi)
- core: Debounce render calls again, fixes #669 (#796 / @goto-bus-stop)
- core: add more mime-to-extension mappings from https://github.com/micnic/mime.json/blob/master/index.json (#806 /@arturi, @goto-bus-stop)
- core: addFile not passing restrictions shouldn’t throw when called from UI (@arturi)
- core: set `bytesUploaded = bytesTotal` when upload is complete (#f51ab0f / @arturi)
- core: use uppy.getState() instead of uppy.state (#863 / @goto-bus-stop)
- dashboard & statusbar: allow to hide cancel, pause-resume and retry buttons: hideUploadButton: false, hideRetryButton: false, hidePauseResumeCancelButtons: false (#821, #853 / @mrbatista, @arturi)
- dashboard: Dashboard open/close animation; move ESC and TAB event listener, improve FOCUSABLE_ELEMENTS, update docs (#852 / @arturi)
- dashboard: Don’t use h1-h6 tags (add role=heading), might solve some styling issues for embedded Uppy; fix weird artifacts instead of ellipsis issue (#868 / @arturi)
- dashboard: Use i18n for save/cancel in Dashboard file card (#841 / @arturi)
- dashboard: disallow removing files if bundle: true in XHRUpload (#853 / @arturi)
- docs: improve on React docs https://uppy.io/docs/react/, add small example for each component: Dashboard, DragDrop, ProgressBar, etc; more plugin options, better group (#845 / @goto-bus-stop)
- provider: Fix an issue where .focus() is scrolling the page, same as in UrlUI (#51df805 / @arturi)
- provider: show message for empty provider files (#ff628b6 / @ifedapoolarewaju)
- providers: Add user/account names to Uppy provider views (61bf0a7 / @ifedapoolarewaju)
- providers: display username in provider view (61bf0a7 / @ifedapoolarewaju)
- react: Added tests for mounting/unmounting React components (#854 / @goto-bus-stop)
- react: Fixed plugin ID mismatch in React components, fixes #850 (#854 / @goto-bus-stop)
- s3: implement multipart uploads (#726 / @goto-bus-stop)
- tus: add `filename` and `filetype`, so that tusd servers knows what headers to set (#844 / @vith)
- ui-plugins: Add try/catch to `addfile()` calls from UI plugins (@arturi / #867)
- uppy-server: benchmarks / stress test, large file, uppy-server / tus / S3 (10 GB) (@ifedapoolarewaju)
- uppy-server: document docker image setup for uppy-server (@ifedapoolarewaju)
- url: Add support for drag-dropping urls, links or images from webpages (#836 / @arturi)
- webcam: swap record/stop button icons, fixes #859 (#fdcca95 / @arturi)
- xhrupload: fix bytesUploaded and bytesTotal for bundled progress (#864 / @arturi)
- xhrupload: fix retry/timer issues, add timer.done() to `cancel-all` events; disable progress throttling in Core; Ignore progress events in timeout tracker after upload was aborted (#864 / @goto-bus-stop, @arturi)
- Server: Allow custom headers to be set for remote multipart uploads (@ifedapoolarewaju)
- Server: Add type to metadata as `filetype`
- uppy/uppy-server: refactor oauth flow tonot use cookies anymore (@ifedapoolarewaju)

### 0.24.4

Released: 2018-05-14.

- core: Pass `allowedFileTypes` and `maxNumberOfFiles` to `input[type=file]` in UI components: Dashboard, DragDrop, FileInput (#814 / @arturi)
- transloadit: Update Transloadit plugin's Uppy Server handling (#804 / @goto-bus-stop)
- tus: respect `limit` option for upload parameter requests (#817 / @ap--)
- docs: Explain name `metadata` vs. `$_FILES[]["name"]` (#1c1bf2e / @goto-bus-stop)
- dashboard: improve “powered by” icon (#0284c8e / @arturi)
- statusbar: add default string for cancel button (#822 / @mrbatista)

### 0.24.3

Released: 2018-05-10.

- core: add `uppy.getFiles()` method (@goto-bus-stop / #770)
- core: merge meta data when add file (#810 / @mrbatista)
- dashboard: fix duplicate plugin IDs, see #702 (@goto-bus-stop)
- dashboard/statusbar: fix some unicode characters showing up as gibberish (#787 / @goto-bus-stop)
- dashboard: Fix grid item height in remote providers with few files (#791 / @goto-bus-stop)
- dashboard: Add `rel="noopener noreferrer"` to links containing `target="_blank"` (#767 / @kvz)
- instagram: add extensions to instagram files (@ifedapoolarewaju)
- transloadit: More robust failure handling for Transloadit, closes #708 (#805 / @goto-bus-stop)
- docs: Document "headers" upload parameter in AwsS3 plugin (#780 / @janko-m)
- docs: Update some `uppy.state` docs to align with the Stores feature (#792 / @goto-bus-stop)
- dragdrop: Add `inputName` option like FileInput has, set empty value="", closes #729 (#778 / @goto-bus-stop, @arturi)
- docs: Google Cloud Storage setup for the AwsS3 plugin (#777 / goto-bus-stop)
- react: Update React component PropTypes (#776 / @arturi)
- statusbar: add some spacing between text elements (#760 / @goto-bus-stop)

### 0.24.2

Released: 2018-04-17.

- dashboard: Fix showLinkToFileUploadResult option (@arturi / #763)
- docs: Consistent shape for the getResponseData (responseText, response) (@arturi / #765)

### 0.24.1

Released: 2018-04-16.

- dashboard: ⚠️ **breaking** `maxWidth`, `maxHeight` --> `width` and `height`; update docs and React props too; regardless of what we call those internally, this makes more sense, I think (@arturi)
- core: Avoid important for those styles that need to be overriden by inline-styles + microtip (@arturi)
- tus & xhrupload: Retain uppy-server error messages, fixes #707 (@goto-bus-stop / #759)
- dragdrop: Link `<label>` and `<input>`, fixes #749 (@goto-bus-stop / #757)

### 0.24.0

Released: 2018-04-12.

- core: ⚠️ **breaking** !important styles to be immune to any environment/page, look at screenshots in #446. Use `postcss-safe-important` (look into http://cleanslatecss.com/ or https://github.com/maximkoretskiy/postcss-autoreset or increasing specificity with .uppy prefix) (#744 / @arturi)
- core: ⚠️ **breaking** `onBeforeFileAdded()`, `onBeforeUpload()` and `addFile()` are now synchronous. You can no longer return a Promise from the `onBefore*()` functions. (#294, #746, @goto-bus-stop, @arturi)
- statusbar: ⚠️ **breaking** Move progress details to second line and make them optional (#682 / @arturi)
- core: Add uppy-Root to a DOM el that gets mounted in mount (#682 / @arturi)
- core: Fix all file state was included in progress accidentally (#682 / @arturi)
- dashboard: Options to disable showLinkToFileUploadResult and meta editing if metaFields is not provided (#682 / @arturi)
- dashboard: Remove dashed file icon for now (#682 / @arturi)
- dashboard: Add optional whitelabel “powered by uppy.io” (@nqst, @arturi)
- dashboard: Huge UI redesign, update provider views, StatusBar, Webcam, FileCard (@arturi, @nqst)
- docs: Update uppy-server docs to point to Kubernetes (#706 / @kiloreux)
- docs: Talk about success_action_status for POST uploads (#728 / @goto-bus-stop)
- docs: Add custom provider example (#743 / @ifedapoolarewaju)
- docs: Addmore useful events, i18n strings, typos, fixes and improvements following Tim’s feedback (#704 / @arturi)
- goldenretriever: Regenerate thumbnails after restore (#723 / @goto-bus-stop)
- goldenretriever: Warn, not error, when files cannot be saved by goldenretriever (#641 / @goto-bus-stop)
- instagram: Use date&time as file name for instagram files (#682 / @arturi)
- providers: Fix logging out of providers (#742 / @goto-bus-stop)
- providers: Refactor Provider views: Filter, add showFilter and showBreadcrumbs (#682 / @arturi)
- react: Allow overriding `<DashboardModal />` `target` prop (#740, @goto-bus-stop)
- s3: Support fake XHR from remote uploads (#711, @goto-bus-stop)
- s3: Document Digital Ocean Spaces
- s3: Fix xhr response handlers (#625, @goto-bus-stop)
- statusbar: Cancel button for any kind of uploads (@arturi, @goto-bus-stop)
- url: Add checks for protocols, assume `http` when no protocol is used (#682 / @arturi)
- url: Refactor things into Provider, see comments in  https://github.com/transloadit/uppy/pull/588; exposing the Provider module and the ProviderView to the public API (#727 / @ifedapoolarewaju, @arturi)
- webcam: Styles updates: adapt for mobile, better camera icon, move buttons to the bottom bar (#682 / @arturi)
- server: Fixed security vulnerability in transient dependency [#70](https://github.com/transloadit/uppy-server/issues/70) (@ifedapoolarewaju)
- server: Auto-generate tmp download file name to avoid Path traversal (@ifedapoolarewaju)
- server: Namespace redis key storage/lookup to avoid collisions (@ifedapoolarewaju)
- server: Validate callback redirect url after completing OAuth (@ifedapoolarewaju)
- server: Reduce the permission level required by Google Drive (@ifedapoolarewaju)
- server: Auto-generate Server secret if none is provided on startup (@ifedapoolarewaju)
- server: We implemented a more standard logger for Uppy Server (@ifedapoolarewaju)
- server: Added an example project to run Uppy Server on Serverless (@ifedapoolarewaju)

### 0.23.3

- docs: add “Writing Plugins” (@goto-bus-stop)
- docs: Update aws-s3.md, xhrupload.md (#692 / @bertho-zero)
- docs: Typos, fixes and improvements (@tim-kos, @ifedapoolarewaju, @arturi / #704)
- core: add Google Drive to S3 + uppy-server example, update docs (@goto-bus-stop / #711)
- s3: Support fake XHR from remote uploads (@goto-bus-stop / #711)
- dashboard: fix FileItem titles (#696 / @bertho-zero)
- form: Fix `get-form-data` being undefined when built with Rollup (#698 / @goto-bus-stop)
- transloadit: Capitalise Assembly in user facing messages (#699 / @goto-bus-stop)
- core: Add yaml file type (#710 / @jessica-coursera)
- core: Clear uploads on `cancelAll` (#664 / @goto-bus-stop)
- core: Remove Redux state sync plugin (#667 / @goto-bus-stop)
- core: merge of restrictions (#677 / @richmeij)
- core: Check for empty URL (#681 / @arturi)
- build: Use babel-preset-env, drop modules transform, use CommonJS in test files (#714 / @goto-bus-stop)
- dashboard: Remove semiTransparent for good (#704 / @arturi)
- url: Prevent scrolling when focusing on input when Url tab is opened (#179bdf7 / @arturi)

### 0.23.2

- core: ⚠️ **breaking** Emit full file object instead of fileID in events like uppy.on('event', file, data) (#647 / @arturi)
- core: Fix merging locale strings in Core (#666 / @goto-bus-stop)
- s3: Check upload parameters shape, fixes #653 (#665 / @goto-bus-stop)
- docs: Add more Core events to docs (@arturi)
- xhrupload: Clear timer when upload is removed in XHRUpload (#647 / @arturi)
- xhrupload: Fix XHRUpload.js error handling (#656 / @rhymes)
- tus: Configure uploadUrl for uppy-server uploads (#643 / @goto-bus-stop)

### 0.23.1

- xhrupload: ⚠️ **breaking** Revamped XHR response handling: This adds a response key to files when the upload completed (regardless of whether it succeeded). file.response contains a status and a data property. data is the result of getResponseData. One change here is that getResponseData is also called if there was an error, not sure if that's a good idea; Also changed events to emit file objects instead of IDs here because it touches many of the same places. (#612 / @goto-bus-stop)
- transloadit: ⚠️ **breaking** Embeded tus plugin: When importFromUploadURLs is not set, add the Tus plugin with the right configuration. (#614 / @goto-bus-stop)
- transloadit: Allow easy passing of form fields (#593 / @goto-bus-stop)
- s3: Updated XHR response handling, fixes (#624 / @goto-bus-stop)
- core: Revamped `addFile()` rejections (#604 / @goto-bus-stop)
- core: Added wrapper function for emitter.on, so you can chain uppy.on().run()... (#597 / @arturi)
- core: Fix progress events causing errors for removed files (#638 / @arturi)
- statusbar: Use translations for Uploading / Paused text, fixes #629 (#640 / goto-bus-stop)
- thumbnailgenerator: Upsizing image if smaller than thumbnail size, fix infinite loop (#637 / @phitranphitranphitran)
- website: Added Transloadit example to website (#603 / @arturi)

### 0.23.0

Released: 2018-02-11.

- core: Allow plugins to add data to result object. Return `processing` results among with `upload` results in `complete` event and `upload()` promise (#527 / @goto-bus-stop)
- core: Move limiting to different point, to fix StatusBar and other UI issues #468 (#524, #526 / @goto-bus-stop)
- core: Add uploadID to complete event (#569 / @richardwillars)
- core: Allow chanining after .on() and .off() to improve ergonomics (#597 / @arturi)
- core: Allow user to override sass variables (#555 / @chao)
- core: Move preview generation to separate plugin, add queuing (#431 / @richardwillars)
- core: Third-party extension, uppy-store-ngrx https://github.com/rimlin/uppy-store-ngrx/ (#532 / @rimlin)
- core: Warn, not error, when file cannot be added due to restrictions? (#604, #492 / @goto-bus-stop)
- dashboard: Add more i18n strings (#565 / @arturi)
- dashboard: Fix modal and page scroll (#564 / @arturi)
- dashboard: Refactor provider views (#554 / @arturi)
- dashboard: Restore focus after modal has been closed (#536 / @arturi)
- dashboard: Use empty input value so same file can be selected multiple times (@arturi / #534)
- dashboard: Use more accessible tip lib microtip (#536 / @arturi)
- docs: Add PHP snippets to XHRUpload docs (#567 / @goto-bus-stop)
- meta: Added instruction to fork the repo first (#512 / muhammadInam)
- meta: Automatically host releases on edgly and use that as our main CDN (#558 / @kvz)
- meta: Dependency version updates (#523 / @goto-bus-stop)
- meta: Remove unused files from published package (#586 / @goto-bus-stop)
- s3: Respect `limit` option for upload parameter requests too; fix isXml() check when no content-type is available (#545, #544, #528 / @goto-bus-stop)
- statusbar: Fix status text still showing when statusbar is hidden (#525 / @goto-bus-stop)
- test: Alter jest testPathPattern to current dir, add chai (#583 / @arturi)
- thumbnail: Add thumbnail generation plugin (#461 / @richardwillars)
- thumbnail: Fix blank preview thumbnails for images in Safari; use slightly different stap scaling (#458, #584 / @arturi)
- transloadit: Add `transloadit:assembly-executing` event (#547 / @goto-bus-stop)
- transloadit: Add assembly results to to the `complete` callback (#527 / @goto-bus-stop)
- transloadit: Easily pass form fields (#593 / @goto-bus-stop)
- tus: `resume: false` — don’t store url (@arturi / #507)
- uppy-server: Detect file upload size from the server (@ifedapoolarewaju)
- uppy-server: Fix circular json stringify error (@ifedapoolarewaju)
- uppy-server: Load standalone server options via config path (@ifedapoolarewaju)
- uppy-server: Pass response from uppy-server upload’s endpoint (#591 / @ifedapoolarewaju)
- uppy-server: Schedule job to delete stale upload files (@ifedapoolarewaju)
- uppy-server: Security audit, ask @acconut
- uppy-server: Support localhost urls as endpoints (@ifedapoolarewaju)
- url: New plugin that imports files from urls (#588 / @arturi, @ifedapoolarewaju)
- webcam: Font styling for Webcam option (#509 / @muhammadInam)
- webcam: Mirror image preview, add option to select which camera is used to capture, try filling the whole Dashboard with webcam preview image, remove URL.createObjectURL() (#574 / @arturi, @nqst)
- website: Add Transloadit example to website (#603 / @arturi)
- website: Doc fixes (#563 / @arturi)
- website: Improve the Contributing guide (#578 / @arturi)
- xhrupload: Add bundle option to send multiple files in one request (#442 / @goto-bus-stop)
- xhrupload: Prevent files from being uploaded multiple times in separate uploads (#552 / @richardwillars)
- xhrupload: Refactor response and error handling (#591 / @goto-bus-stop, @arturi, @ifedapoolarewaju)

### 0.22.1

Released: 2018-01-09.

- core: Fix remote uploads (#474 / @arturi)
- statusbar, progressbar: Add option to hide progress bar after upload finish (#485 / @wilkoklak)
- s3: Allow passing on XHRUpload options, such as "limit" to AwsS3 Plugin (#471 / @ogtfaber)
- XHRUpload: Fix progress with `limit`ed XHRUploads (#505 / @goto-bus-stop)
- core: fix error when `file.type === null`, shouldn’t pass that to match (@arturi)
- dashboard: input hidden="true" should not be focusable too (@arturi)
- webcam: Font styling for Webcam option (#509 / @muhammadInam)
- docs: fix reference to incorrect width/height options (#475 / @xhocquet)
- docs: Documentation fixes and improvements (#463 / @janko-m)
- docs: Fixed several typos in docs/server and docs/uppy (#484 / @martiuslim)

### 0.22.0

Released: 2017-12-21.
Theme: 🎄 Christmas edition

- **⚠️ Breaking** core: rendering engine switched from `Yo-Yo` to `Preact`, and all views from `html` hyperx template strings to `JSX` (#451 / @arturi)
- **⚠️ Breaking** core: large refactor of Core and Plugins: `setFileState`, merge `MetaData` plugin into `Dashboard`, prefix "private" core methods with underscores (@arturi / #438)
- **⚠️ Breaking** core: renamed `core` to `uppy` in plugins and what not. So instead of `this.core.state` we now use `this.uppy.state` (#438 / @arturi)
- **⚠️ Breaking** core: renamed events to remove `core:` prefix, as been suggested already. So: `success`, `error`, `upload-started` and so on, and prefixed event names for plugins sometimes, like `dashboard:file-card` (#438 / @arturi)
- **⚠️ Breaking** core: CSS class names have been altered to use `uppy-` namespace, so `.UppyDashboard-files` --> `.uppy-Dashboard-files` and so on
- **⚠️ Breaking** dashboard: added `metaFields` option, pass an array of settings for UI field objects `{ id: 'caption', name: 'Caption', placeholder: 'describe what the image is about' }` (#438 / @arturi, @goto-bus-stop)
- **⚠️ Breaking** core: deprecate `getMetaFromForm` in favor of new `Form` plugin (#407 / @arturi)
- form: added `Form`, a new plugin that is used in conjunction with any acquirer, responsible for: 1. acquiring the metadata from `<form>` when upload starts in Uppy; 2. injecting result array of succesful and failed files back into the form (#407 / @arturi)
- core: add more extensions for mimetype detection (#452 / @ifedapoolarewaju)
- docs: more docs for plugins (#456 / @goto-bus-stop)
- core: misc bugs fixes and improvements in Webcam, Dashboard, Provider and others (#451 / @arturi)
- dashboard: improved Dashboard UI (@arturi)
- uppy-server: remove pause/resume socket listeners when upload is done (@ifedapoolarewaju)
- uppy/uppy-server: remote server error handler (#446 / @ifedapoolarewaju)
- provider: fix dropbox thumbnail view (@ifedapoolarewaju)
- uppy-server: link uppy-server with https://snyk.io/ to aid vulnerability spotting (@ifedapoolarewaju)
- uppy-server: use typescript to compile code for a type safe servers (@ifedapoolarewaju)

### 0.21.1

Released: 2017-12-10.

- **⚠️ Breaking** core: Set `this.el` in `Plugin` class (#425 / @arturi)
- StatusBar, Dashboard and Provider UI improvements place upload button into StatusBar, use Alex’s suggestions for retry button; other UI tweaks (#434 / @arturi)
- XHRUpload: fix fields in XHR remote uploader (#424 / @sadovnychyi)
- XHRUpload: option to limit simultaneous uploads #360 (#427 / goto-bus-stop)
- core: Add `isSupported()` API for providers (#421 / @goto-bus-stop, @arturi)
- core: Add stores. Improve on Redux PR #216 to allow using Redux (or any other solution) for all Uppy state management, instead of proxy-only (#426 / @goto-bus-stop)
- core: add ability to disable thumbnail generation (#432 / @richardwillars)
- core: allow to select multiple files at once from remote providers (#419 / @sadovnychyi)
- core: use `setPluginState` and `getPluginState` in Providers (#436 / @arturi)
- docs: uppy-server docs for s3 `getKey` option (#444 / @goto-bus-stop)
- goldenretriever: Fix IndexedDB store initialisation when not cleaning up (#430 / @goto-bus-stop)
- provider: folder deselection did not remove all files (#439 / @ifedapoolarewaju)
- s3: Use Translator for localised strings (420 / @goto-bus-stop )
- transloadit: Port old tests from tape (#428 / @goto-bus-stop)
- tus: Restore correctly from paused state (#443 / @goto-bus-stop)

### 0.21.0

Released: 2017-11-14.

- accessibility: add tabindex="0" to buttons and tabs, aria-labels, focus (#414 / @arturi)
- core: allow setting custom `id` for plugins to allow a plugin to be used multiple times (#418 / @arturi)
- core: do not check isPreviewSupported for unknown filetypes (#417 / @sadovnychyi)
- core: refactor `uppy-base` (#382 / @goto-bus-stop)
- core: remove functions from state object (#408 / @goto-bus-stop)
- core: return `{ successful, failed }` from `uppy.upload()` (#404 / @goto-bus-stop)
- core: update state with error messages rather than error objects (#406 / @richardwillars)
- core: use `tinyify` for the unpkg bundle. (#371 / @goto-bus-stop)
- dashboard: Fix pasting files, default `image` file name, add type to meta, file type refactor (#395 / @arturi)
- dragdrop: Fix of the .uppy-DragDrop-inner spacing on small screens (#405 / @nqst)
- react: fix `uppy` PropType, closes (#416 / @goto-bus-stop)
- s3: automatically wrap XHRUpload. **Users should remove `.use(XHRUpload)` when using S3.** (#408 / @goto-bus-stop)
- test: refactored end-to-end tests to not use website, switched to Webdriver.io, added tests for Edge, Safari, Android and iOS (#410 / @arturi)
- tus: Rename Tus10 → Tus (#285 / @goto-bus-stop)
- uppy-serer: mask sensitive data from request logs (@ifedapoolarewaju)
- uppy-server: add request body validators (@ifedapoolarewaju)
- uppy-server: migrate dropbox to use v2 API (#386 / @ifedapoolarewaju)
- uppy-server: store tokens in user’s browser only (@ifedapoolarewaju)
- webcam: only show the webcam tab when browser support is available (media recorder API) (#421 / @arturi, @goto-bus-stop)
- webcam: simplify and refactor webcam plugin (modern browser APIs only) (#382 / @goto-bus-stop)
- xhrupload: set a timeout in the onprogress event handler to detect stale network (#378 / @goto-bus-stop)
- uppy-server: allow flexible whitelist endpoint protocols (@ifedapoolarewaju)

### 0.20.3

Released: 2017-10-18.

- Start a completely new upload when retrying. (#390 / @goto-bus-stop)
- dashboard: Show errors that occurred during processing on the file items. (#391 / @goto-bus-stop)
- transloadit: Mark files as having errored if their assembly fails. (#392 / @goto-bus-stop)
- core: Clear file upload progress when an upload starts. (#393 / @goto-bus-stop)
- tus: Clean up `tus.Upload` instance and events when an upload starts, finishes, or fails. (#390 / @goto-bus-stop)

### 0.20.2

Released: 2017-10-11.

- docs: fix `getMetaFromForm` documentation (@arturi)
- core: fix generating thumbnails for images with transparent background (#380 / @goto-bus-stop)
- transloadit: use Translator class for localised strings (#383 / @goto-bus-stop)
- goldenretriever: don't crash when required server-side (#384 / @goto-bus-stop)

### 0.20.1

Released: 2017-10-05.

- redux: add plugin for syncing uppy state with a Redux store (#376 / @richardwillars)

### 0.20.0

Released: 2017-10-03.
Theme: React and Retry

- core: retry/error when upload can’t start or fails (offline, connection lost, wrong endpoint); add error in file progress state, UI, question mark button (#307 / @arturi)
- core: support for retry in Tus plugin (#307 / @arturi)
- core: support for retry in XHRUpload plugin (#307 / @arturi)
- core: Add support for Redux DevTools via a plugin (#373 / @arturi)
- core: improve and merge the React PR (#170 / @goto-bus-stop, @arturi)
- core: improve core.log method, add timestamps (#372 / @arturi)
- dragdrop: redesign, add note, width/height options, arrow icon (#374 / @arturi)
- uploaders: upload resolution changes, followup to #323 (#347 / @goto-bus-stop)
- uploaders: issue warning when no uploading plugins are used (#372 / @arturi)
- core: fix `replaceTargetContent` and add tests for `Plugin` (#354 / @gavboulton)
- goldenretriever: Omit completed uploads from saved file state—previously, when an upload was finished and the user refreshed the page, all the finished files would still be there because we saved the entire list of files. Changed this to only store files that are part of an in-progress upload, or that have yet to be uploaded (#358, #324 / @goto-bus-stop)
- goldenretriever: Remove files from cache when upload finished—this uses the deleteBlobs function when core:success fires (#358, #324 / @goto-bus-stop)
- goldenretriever: add a timestamp to cached blobs, and to delete old blobs on boot (#358, #324 / @goto-bus-stop)
- s3: have some way to configure content-disposition for uploads, see #243 (@goto-bus-stop)
- core: move `setPluginState` and add `getPluginState` to `Plugin` class (#363 / @goto-bus-stop)

### 0.19.1

Released: 2017-09-20.

- goldenretriever: fix restorefiles with id (#351 / @arturi)
- goldenretriever: Clean up blobs that are not related to a file in state (#349 / @goto-bus-stop)
- core: set the newState before emiting `core:state-update` (#341 / @sunil-shrestha, @arturi)
- docs: Document StatusBar plugin (#350 / @goto-bus-stop)

### 0.19.0

Released: 2017-09-15.
Theme: Tests and better APIs

- goldenretriever: allow passing options to `IndexedDbStore` (#339 / sunil-shrestha)
- core: add Uppy instance ID option, namespace serviceWorker action types, add example using multiple Uppy instances with Goldenretriever (#333 / @goto-bus-stop)
- core: fix `calculateTotalProgress` - NaN (#342 / @arturi)
- core: fix and refactor restrictions (#345 / @arturi)
- core: Better `generateFileID` (#330 / @arturi)
- core: improve `isOnline()` (#319 / @richardwillars)
- core: remove unused bootstrap styles (#329 / @arturi)
- core: experiment with yo-yo --> preact and picodom (#297 / @arturi)
- dashboard: fix FileItem source icon position and copy (@arturi)
- dashboard: expose and document the show/hide/isOpen API (@arturi)
- dashboard: allow multiple `triggers` of the same class `.open-uppy` (#328 / @arturi)
- plugins: add `aria-hidden` to all SVG icons for accessibility (#4e808ca3d26f06499c58bb77abbf1c3c2b510b4d / @arturi)
- core: Handle sync returns and throws in possibly-async function options (#315 / @goto-bus-stop)
- core: switch to Jest tests, add more tests for Core and Utils (#310 / @richardwillars)
- website: Minify bundle for `disc` (#332 / @goto-bus-stop)
- transloadit: remove `this.state` getter (#331 / @goto-bus-stop)
- server: option to define valid upload urls (@ifedapoolarewaju)
- server: more automated tests (@ifedapoolarewaju)

### 0.18.1

Released: 2017-09-05.
Note: this version was released as a `@next` npm tag to unblock some users.

- core: gradually resize image previews #275 (@goto-bus-stop)
- informer: support “explanations”, a (?) button that shows more info on hover / click (#292 / @arturi)
- fix webcam video recording (@goto-bus-stop)
- bundle: add missing plugins (s3, statusbar, restoreFiles) to unpkg bundle (#301 / @goto-bus-stop)
- xhrupload: Use error messages from the endpoint (#305 / @goto-bus-stop)
- dashboard: prevent submitting outer form when pressing enter key while editing metadata (#306 / @goto-bus-stop)
- dashboard: save metadata edits when pressing enter key (#308 / @arturi)
- transloadit: upload to S3, then import into :tl: assembly using `/add_file?s3url=${url}` (#280 / @goto-bus-stop)
- transloadit: add `alwaysRunAssembly` option to run assemblies when no files are uploaded (#290 / @goto-bus-stop)
- core: use `iteratePlugins` inside `updateAll` (#312 / @richardwillars)
- core: improve error when plugin does not have ID (#309 / @richardwillars)
- tus: Clear stored `uploadUrl` on `uppy.resetProgress()` call (#314 / @goto-bus-stop)
- website: simplify examples and code samples, prevent sidebar subheading links anywhere but in docs (@arturi)
- website: group plugin docs together in the sidebar (@arturi)

### 0.18.0

Released: 2017-08-15.
Theme: Dogumentation and The Golden retriever.

- goldenretriever: use Service Woker first, then IndexedDB, add file limits for IndexedDB, figure out what restores from where, add throttling for localStorage state sync (@goto-bus-stop @arturi)
- dashboard: flag to hide the upload button, for cases when you want to manually stat the upload (@arturi)
- dashboard: place close btn inside the Dashboard, don’t close on click outside, place source icon near the file size (@arturi)
- core: informer becomes a core API, `uppy.info('Smile! 📸', 'warning', 5000)` so its more concise with `uppy.log('my msg')` and supports different UI implementations (@arturi, #271)
- docs: first stage — on using plugins, all options, list of plugins, i18n, uppy-server (@arturi, @goto-bus-stop, @ifedapoolarewaju)
- provider: file size sorting (@ifedapoolarewaju)
- provider: show loading screen when checking auth too (@arturi)
- uploaders: add direct-to-s3 upload plugin (@goto-bus-stop)
- core: ability to re-upload all files, even `uploadComplete` ones, reset progress (@arturi)
- goldenretriever: recover selected or in progress files after a browser crash or closed tab: alpha-version, add LocalStorage, Service Worker and IndexedDB (@arturi @goto-bus-stop @nqst #268)
- xhrupload: add XHRUpload a more flexible successor to Multipart, so that S3 plugin can depend on it (@goto-bus-stop #242)
- core: add getFile method (@goto-bus-stop, #263)
- provider: use informer to display errors (@ifedapoolarewaju)
- provider: flatten instagram carousels #234 (@ifedapoolarewaju)
- server: add uppy-server url as `i-am` header (@ifedapoolarewaju)
- server: disable socket channel from restarting an already completed file download (@ifedapoolarewaju)
- server: make uppy client whitelisting optional. You may use wildcard instead (@ifedapoolarewaju)
- server: master oauth redirect uri for multiple uppy-server instances
- server: options support for redis session storage on standalone server (@ifedapoolarewaju)
- server: start uppy-server as binary `uppy-server` (@ifedapoolarewaju)
- server: store downloaded files based on uuids (@ifedapoolarewaju)
- server: store upload state on redis (@ifedapoolarewaju)
- server: use uppy informer for server errors (@ifedapoolarewaju, #272)
- server: whitelist multiple uppy clients (@ifedapoolarewaju)
- transloadit: emit an event when an assembly is created (@goto-bus-stop / #244)
- transloadit: function option for file-dependent `params` (@goto-bus-stop / #250)
- tus: Save upload URL early on (@goto-bus-stop #261)
- tus: return immediately if no files are selected (@goto-bus-stop #245)
- uppy-server: add uppy-server metrics to Librato (@ifedapoolarewaju @kiloreux)
- webcam: add 1, 2, 3, smile! to webcam, onBeforeSnapshothook (@arturi, #187, #248)
- website: live example on the homepage, “try me” button, improve /examples (@arturi)

### 0.17.0

Released: 2017-07-02

- core: restrictions — by file type, size, number of files (@arturi)
- provider: improve UI: improve overall look, breadcrumbs, more responsive (@arturi)
- core: css-in-js demos, try template-css (@arturi @goto-bus-stop #239)
- core: add `uppy.reset()` as discussed in #179 (@arturi)
- core: add nanoraf https://github.com/yoshuawuyts/choo/pull/135/files?diff=unified (@goto-bus-stop, @arturi)
- core: file type detection: archives, markdown (possible modules: file-type, identify-filetype) example: http://requirebin.com/?gist=f9bea9602030f1320a227cf7f140c45f, http://stackoverflow.com/a/29672957 (@arturi)
- dashboard: make file icons prettier: https://uppy.io/images/blog/0.16/service-logos.png (@arturi, @nqst / #215)
- fileinput: allow retriving fields/options from form (@arturi #153)
- server: configurable server port (@ifedapoolarewaju)
- server: support for custom providers (@ifedapoolarewaju)
- statusbar: also show major errors, add “error” state (@goto-bus-stop)
- statusbar: pre/postprocessing status updates in the StatusBar (@goto-bus-stop, #202)
- statusbar: show status “Upload started...” when the remote upload has begun, but no progress events received yet (@arturi)
- statusbar: work towards extracting StatusBar to a separate plugin, bundle that with Dashboard? (@goto-bus-stop, @arturi)
- tus/uppy-server: Support metadata in remote tus uploads (@ifedapoolarewaju, @goto-bus-stop / #210)
- uploaders: add direct-to-s3 upload plugin and test it with the flow to then upload to transloadit, stage 1, WIP (@goto-bus-stop)
- uppy/uppy-server: Make a barely working Instagram Plugin (@ifedapoolarewaju / #21)
- uppy/uppy-server: Make a barely working Instagram Plugin (@ifedapoolarewaju / #21)
- uppy/uppy-server: allow google drive/dropbox non-tus (i.e multipart) remote uploads (@arturi, @ifedapoolarewaju / #205)
- uppy/uppy-server: some file types cannot be downloaded/uploaded on google drive (e.g google docs). How to handle that? (@ifedapoolarewaju)
- uppy: fix google drive uploads on mobile (double click issue) (@arturi)

### 0.16.2

Released: 2017-05-31.

- core: update prettier-bytes to fix the IE support issue https://github.com/Flet/prettier-bytes/issues/3 (@arturi)
- core: use URL.createObjectURL instead of resizing thumbnails (@arturi, @goto-bus-stop / #199)
- dashboard: Fix ETA when multiple files are being uploaded (@goto-bus-stop, #197)
- transloadit: Fix receiving assembly results that are not related to an input file (@arturi, @goto-bus-stop / #201)
- transloadit: Use the `tus_upload_url` to reliably link assembly results with their input files (@goto-bus-stop / #207)
- transloadit: move user-facing strings into locale option (@goto-bus-stop / https://github.com/transloadit/uppy/commit/87a22e7ee37b6fa3754fa34868516a6700306b60)
- webcam: Mute audio in realtime playback (@goto-bus-stop / #196)

### 0.16.1

Released: 2017-05-13

- temporarily downgrade yo-yoify, until shama/yo-yoify#45 is resolved (@arturi / https://github.com/transloadit/uppy/commit/6292b96)

### 0.16.0

Released: 2017-05-12.
Theme: Transloadit integration, getting things in order.
Favorite Uppy Server version: 0.5.0.

- uploaders: make sure uploads retry/resume if started when offline or disconnected, retry when back online / failed https://github.com/transloadit/uppy/pull/135 (@arturi, @ifedapoolarewaju)
- transloadit: add basic (beta) version of Transloadit plugin (@goto-bus-stop, @kvz, @tim-kos / #28)
- transloadit: emit an upload event w/ tl data when a file upload is complete (#191 @goto-bus-stop)
- webcam: implement reading audio+video from Webcam (@goto-bus-stop / #175)
- webcam: Make the webcam video fill the available space as much as possible (@goto-bus-stop / #190)
- tus: Merge tus-js-client options with uppy-tus. Hence, enable custom headers support (@goto-bus-stop)
- multipart/tus: Remove Promise.all() calls with unused results (@goto-bus-stop / #121)
- dashboard: fix Dashboard modal close button position (@goto-bus-stop / #171)
- core: pass through errors (@goto-bus-stop / #185)
- core: accept a DOM element in `target:` option (@goto-bus-stop / #169)
- core: Remove the last few potentially buggy uses of `document.querySelector` (@goto-bus-stop)
- dashboard: Fix dashboard width when multiple instances exist (@goto-bus-stop / #184)
- dashboard: add service logo / name to the selected file in file list (@arturi)
- server: begin adding automated tests, maybe try https://facebook.github.io/jest (@ifedapoolarewaju)
- server: add image preview / thumbnail for remote files, if its in the API of services ? (@ifedapoolarewaju)
- server: research parallelizing downloading/uploading remote files: start uploading chunks right away, while still storing the file on disk (@ifedapoolarewaju)
- server: delete file from local disk after upload is successful (@ifedapoolarewaju)
- website: try on a Github ribbon http://tholman.com/github-corners/ (@arturi / #150)
- website: different meta description for pages and post (@arturi)
- server: well documented README (@ifedapoolarewaju)
- react: High-level React Components (@goto-bus-stop / #170)
- core: add `uppy.close()` for tearing down an Uppy instance (@goto-bus-stop / #182)
- core: replace `babel-preset-es2015-loose` by standard es2015 preset with `loose` option (@goto-bus-stop / #174)

### 0.15.0

Released: 2017-03-02.
Theme: Speeding and cleaning.
Favorite Uppy Server version: 0.4.0.

- build: update dependencies and eslint-plugin-standard, nodemon --> onchange, because simpler and better options (@arturi)
- build: fix `Function.caller` issue in `lib` which gets published to NPM package, add babel-plugin-yo-yoify (@arturi #158 #163)
- provider: show error view for things like not being able to connect to uppy server should this be happening when uppy-server is unavailable http://i.imgur.com/cYJakc9.png (@arturi, @ifedapoolarewaju)
- provider: loading indicator while the GoogleDrive / Dropbox files are loading (@arturi, @ifedapoolarewaju)
- provider: logout link/button? (@arturi, @ifedapoolarewaju)
- provider: fix breadcrumbs (@ifedapoolarewaju)
- server: refactor local/remote uploads in tus, allow for pause/resume with remote upload (@arturi, @ifedapoolarewaju)
- server: throttle progress updates sent through websockets, sometimes it can get overwhelming when uploads are fast (@ifedapoolarewaju)
- server: pass file size from Google Drive / Dropbox ? (@ifedapoolarewaju)
- server: return uploaded file urls (from Google Drive / Dropbox) ? (@ifedapoolarewaju)
- server: research having less permissions, smaller auth expiration time for security (@ifedapoolarewaju)
- dashboard: basic React component (@arturi)
- core: experiment with `nanoraf` and `requestAnimationFrame` (@arturi)
- core: add throttling of progress updates (@arturi)
- dashobard: fix Missing `file.progress.bytesTotal` property  (@arturi #152)
- dashboard: switch to prettier-bytes for more user-friendly progress updates (@arturi)
- dashboard: fix `updateDashboardElWidth()` not firing in time, causing container width to be 0 (@arturi)
- multipart: treat all 2xx responses as successful, return xhr object in `core:upload-success` (@arturi #156 #154)
- dashboard: throttle StatusBar numbers, so they update only once a second (@arturi, @acconut)
- dashboard: add titles to pause/resume/cancel in StatusBar (@arturi)
- dashboard: precise `circleLength` and `stroke-dasharray/stroke-dashoffset` calculation for progress circles on FileItem (@arturi)
- dashboard: don’t show per-file detailed progress by default — too much noise (@arturi)
- website: blog post and images cleanup (@arturi)

### 0.14.0

Released: January 27, 2017.
Theme: The new 13: Responsive Dashboard, Standalone & Pluggable Server, Dropbox.
Uppy Server version: 0.3.0.

- dashboard: use `isWide` prop/class instead of media queries, so that compact/mobile version can be used in bigger screens too (@arturi)
- dashboard: basic “list” view in addition to current “grid” view (@arturi)
- dashboard: more icons for file types (@arturi)
- dashboard: add totalSize and totalUploadedSize to StatusBar (@arturi)
- dashboard: figure out where to place Informer, accounting for StatusBar — over the StatusBar for now (@arturi)
- dashboard: add `<progress>` element for progressbar, like here https://overcast.fm/+BtuxMygVg/. Added hidden for now, for semantics/accessibility (@arturi)
- dragdrop: show number of selected files, remove upload btn (@arturi)
- build: exclude locales from build (@arturi)
- core: i18n for each plugin in options — local instead of global (@arturi)
- core: add default pluralization (can be overrinden in plugin options) to Translator (@arturi)
- core: use yo-yoify to solve [Function.caller / strict mode issue](https://github.com/shama/bel#note) and make our app faster/smaller by transforming template strings into pure and fast document calls (@arturi)
- server: a pluggable uppy-server (express / koa for now) (@ifedapoolarewaju)
- server: standalone uppy-server (@ifedapoolarewaju)
- server: Integrate dropbox plugin (@ifedapoolarewaju)
- server: smooth authentication: after auth you are back in your app where you left, no page reloads (@ifedapoolarewaju)
- tus: fix upload progress from uppy-server (@arturi, @ifedapoolarewaju)
- core: basic React component — DnD (@arturi)
- core: fix support for both ES6 module import and CommonJS requires with `add-module-exports` babel plugin (@arturi)

### 0.13.0

To be released: December 23, 2016.
Theme: The release that wasn't 🎄.

### 0.12.0

Released: November 25, 2016.
Theme: Responsive. Cancel. Feedback. ES6 Server.
Uppy Server version: 0.2.0.

- meta: write 0.12 release blog post (@arturi)
- core: figure out import/require for core and plugins — just don’t use spread for plugins (@arturi)
- meta: create a demo video, showcasing Uppy Dashboard for the main page, like https://zeit.co/blog/next (@arturi)
- meta: update Readme, update screenshot (@arturi)
- server: add pre-commit and lint-staged (@arturi)
- server: re-do build setup: building at `deploy` and `prepublish` when typing `npm run release:patch` 0.0.1 -> 0.0.2 (@ifedapoolarewaju)
- server: re-do build setup: es6 `src` -> es5 `lib` (use plugin packs from Uppy)
- server: re-do build setup: `eslint --fix ./src` via http://standardjs.com (@ifedapoolarewaju)
- server: re-do build setup: `babel-node` or `babel-require` could do realtime transpiling for development (how does that hook in with e.g. `nodemon`?) (@ifedapoolarewaju)
- server: refacor: remove/reduce file redundancy (@ifedapoolarewaju)
- server: error handling: 404 and 401 error handler (@ifedapoolarewaju)
- server: bug fix: failing google drive (@ifedapoolarewaju)
- webcam: stop using the webcam (green light off) after the picture is taken / tab is hidden (@arturi)
- core: allow usage without `new`, start renaming `Core()` to `Uppy()` in examples (@arturi)
- core: api — consider Yosh’s feedback and proposals https://gist.github.com/yoshuawuyts/b5e5b3e7aacbee85a3e61b8a626709ab, come up with follow up questions (@arturi)
- dashboard: local mode — no acquire plugins / external services, just DnD — ActionBrowseTagline (@arturi)
- dashboard: only show pause/resume when tus is used (@arturi)
- dashboard: cancel uploads button for multipart (@arturi)
- dashboard: responsive design — stage 1 (@arturi)
- meta: write 0.11 release blog post (@arturi)

### 0.11.0

Released: November 1, 2016. Releasemaster: Artur.
Theme: StatusBar and API docs.

- core: log method should have an option to throw error in addition to just logging (@arturi)
- experimental: PersistentState plugin that saves state to localStorage — useful for development (@arturi)
- dashboard: implement new StatusBar with progress and pause/resume buttons https://github.com/transloadit/uppy/issues/96#issuecomment-249401532 (@arturi)
- dashboard: attempt to throttle StatusBar, so it doesn’t re-render too often (@arturi)
- dashboard: refactor — only load one acquire panel at a time (activeAcquirer or empty), change focus behavior, utilize onload/onunload
- experimental: create a Dashboard UI for Redux refactor (@hedgerh)
- dashboard: make trigger optional — not needed when rendering inline (@arturi)
- fileinput: pretty input element #93 (@arturi)
- meta: document current Uppy architecture and question about the future (@arturi, @hedgerh)
- test: see about adding tests for autoProceed: true (@arturi)
- website: and ability to toggle options in Dashboard example: inline/modal, autoProceed, which plugins are enabled #89 (@arturi)
- website: finish https upgrade for uppy.io, uppy-server and tus, set up pingdom notifications (@arturi, @kvz, @hedgerh)
- website: update guide, API docs and main page example to match current actual API (@arturi)
- uppy-server: Make uppy server have dynamic controllers (@hedgerh)

### 0.10.0

Released: Septermber 23, 2016. Releasemaster: Artur.
Theme: Getting together.

- core: expose some events/APIs/callbacks to the user: `onFileUploaded`, `onFileSelected`, `onAllUploaded`, `addFile` (or `parseFile`), open modal... (@arturi, @hedgerh)
- core: how would Uppy work without the UI, if one wants to Uppy to just add files and upload, while rendering preview and UI by themselves #116 — discussion Part 1 (@arturi, @hedgerh)
- core: refactor towards react compatibility as discussed in https://github.com/transloadit/uppy/issues/110 (@hedgerh)
- core: CSS modules? allow bundling of CSS in JS for simple use in NPM? See #120#issuecomment-242455042, try https://github.com/rtsao/csjs — verdict: not yet, try again later (@arturi, @hedgerh)
- core: try Web Workers and FileReaderSync for image resizing again — still slow, probably message payload between webworker and regular thread is huge (@arturi)
- core: i18n strings should extend default en_US dictionary — if a certain string in not available in German, English should be displayed (@arturi)
- dashboard: refactor to smaller components, pass props down (@arturi)
- dashboard: option to render Dashboard inline instead of a modal dialog (@arturi)
- dashboard: global circular progress bar, try out different designs for total upload speed and ETA (@arturi)
- dashboard: show total upload speed and ETA, for all files (@arturi)
- dashboard: copy link to uploaded file button, cross-browser (@arturi) (http://i.imgur.com/b1Io34n.png) (@arturi)
- dashobard: refreshed design and grand refactor (@arturi)
- dashboard: improve file paste the best we can http://stackoverflow.com/a/22940020 (@arturi)
- provider: abstract google drive into provider plugin for reuse (@hedgerh)
- google drive: improve UI (@hedgerh)
- tus: add `resumable` capability flag (@arturi)
- tus: start fixing pause/resume issues and race conditions (@arturi)
- test: working Uppy example on Require Bin — latest version straight from NPM http://requirebin.com/?gist=54e076cccc929cc567cb0aba38815105 (@arturi @acconut)
- meta: update readme docs, add unpkg CDN links (https://releases.transloadit.com/uppy/v0.22.0/dist/uppy.min.css) (@arturi)
- meta: write 0.10 release blog post (@arturi)

### 0.9.0

Released: August 26, 2016. Releasemaster: Harry.

Theme: Making Progress, Then Pause & Resume.

- dashboard: informer interface: message when all uploads are "done" (@arturi)
- meta: write 0.9 release blog post (@hedgerh)
- webcam: a barely working webcam record & upload (@hedgerh)
- metadata: Uppy + tus empty metadata value issue in Safari https://github.com/tus/tus-js-client/issues/41 --> tus issue — nailed down, passed to @acconut (@arturi, @acconut)
- core: experiment with switching to `virtual-dom` in a separate branch; experiment with rollup again (@arturi)
- core: figure out race conditions (animations not completing because file div gets re-added to the dom each time) with `yo-yo`/`morphdom` https://github.com/shama/bel/issues/26#issuecomment-238004130 (@arturi)
- core: switch to https://github.com/sethvincent/namespace-emitter — smaller, allows for `on('*')` (@arturi)
- dashboard: add aria-labels and titles everywhere to improve accessibility #114 (@arturi)
- dashboard: file name + extension should fit on two lines, truncate in the middle (maybe https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText) (@arturi)
- dashboard: implement a circular progress indicator on top of the fileItem with play/pause (@arturi)
- dashboard: refactor to smaller components, as discussed in #110 (@arturi)
- dashboard: show upload remaining time and speed, option to disable (@arturi)
- google drive: refactor to smaller components, as discussed in #110 (@hedgerh)
- meta: reach out to choo author (@arturi)
- meta: write 0.8 release blog post (@arturi)
- metadata: add labels to fields in fileCard (@arturi)
- metadata: the aftermath — better UI (@arturi)
- test: Get IE6 on Win XP to run Uppy and see it fall back to regular form upload #108 (@arturi)
- test: refactor tests, add DragDrop back (@arturi)
- tus: update uppy to tus-js-client@1.2.1, test on requirebin (@arturi)
- tus: add ability to pause/resume all uploads at once (@arturi)
- tus: add ability to pause/resume upload (@arturi)

### 0.8.0

Released: July 29, 2016. Releasemaster: Artur.
Theme: The Webcam Edition.

- core: fix bug: no meta information from uppy-server files (@hedgerh)
- core: fix bug: uppy-server file is treated as local and directly uploaded (@hedgerh)
- uppy-server: hammering out websockets/oauth (@hedgerh, @acconut)
- debugger: introduce MagicLog as a way to debug state changes in Uppy (@arturi)
- modifier: A MetaData plugin to supply meta data (like width, tag, filename, user_id) (@arturi)
- modifier: pass custom metadata with non-tus-upload. Maybe mimic meta behavior of tus here, too (@arturi)
- modifier: pass custom metadata with tus-upload with tus-js-client (@arturi)
- webcam: initial version: webcam light goes on (@hedgerh)
- progress: better icons, styles (@arturi)
- core: better mime/type detection (via mime + extension) (@arturi)
- core: add deep-freeze to getState so that we are sure we are not mutating state accidentally (@arturi)
- meta: release “Uppy Begins” post (@arturi @kvz)
- meta: better readme on GitHub and NPM (@arturi)
- test: add pre-commit & lint-staged (@arturi)
- test: add next-update https://www.npmjs.com/package/next-update to check if packages we use can be safely updated (@arturi)
- website: blog polish — add post authors and their gravatars (@arturi)
- dashboard: UI revamp, more prototypes, background image, make dashboard nicer (@arturi)
- dashboard: try a workflow where import from external service slides over and takes up the whole dashboard screen (@arturi)
- modal: merge modal and dashboard (@arturi)

### 0.7.0

Released: July 11, 2016.
Theme: Remote Uploads, UI Redesign.

- core: Investigate if there is a way to manage an oauth dialog and not navigate away from Uppy; Put entire(?) state into oauth redirect urls / LocalStorage with an identifier ? (@hedgerh)
- core: Rethink UI: Part I (interface research for better file selection / progress representation) (@arturi)
- core: let user cancel uploads in progress (@arturi)
- core: resize image file previews (to 100x100px) for performance (@arturi)
- server: add tus-js-client when it's node-ready (@hedgerh)
- server: make uppy-server talk to uppy-client in the browser, use websockets. (@hedgerh)
- dashboard: new “workspace” plugin, main area that allows for drag & drop and shows progress/actions on files, inspired by ProgressDrawer
- website: add new logos and blog (@arturi)
- drive: Return `cb` after writing all files https://github.com/transloadit/uppy-server/commit/4f1795bc55869fd098a5c81a80edac504fa7324a#commitcomment-17385433 (@hedgerh)
- server: Make Google Drive files to actually upload to the endpoint (@hedgerh)
- build: browsersync does 3 refreshes, can that be one? should be doable via cooldown/debounce? -> get rid of require shortcuts (@arturi)
- build: regular + min + gzipped versions of the bundle (@arturi)
- build: set up a simple and quick dev workflow — watch:example (@arturi)

### 0.6.4

Released: June 03, 2016.
Theme: The aim low release.

- build: minification of the bundle (@arturi)
- build: revisit sourcemaps for production. can we have them without a mandatory extra request?
- build: supply Uppy es5 and es6 entry points in npm package (@arturi)
- build: switch to https://www.npmjs.com/package/npm-run-all instead of parallelshell (@arturi)
- drive: Make sure uppy-server does not explode on special file types: https://dl.dropboxusercontent.com/s/d4dbxitjt8clo50/2016-05-06%20at%2022.41.png (@hedgerh)
- modal: accessibility. focus on the first input field / button in tab panel (@arturi)
- progressdrawer: figure out crazy rerendering of previews by yoyo/bel: https://github.com/shama/bel/issues/26, https://github.com/shama/bel/issues/27 (@arturi)
- core: substantial refactor of mount & rendering (@arturi)
- core: better state change logs for better debugging (@arturi)
- progressdrawer: improve styles, add preview icons for all (@arturi)
- server: Start implementing the `SERVER-PLAN.md`, remote files should be added to `state.files` and marked as `remote` (@hedgerh)
- test: Add pass/fail Saucelabs flag to acceptance tests (@arturi)
- website: Polish Saucelabs stats (social badge + stats layout) (@arturi)
- meta: Create Uppy logos (@markstory)
- website: fix examples and cleanup (@arturi)
- website: Add Saucelabs badges to uppy.io (@kvz)
- website: fix disappearing icons issue, `postcss-inline-svg` (@arturi)

### 0.0.5

Released: May 07, 2016.
Theme: Acceptance tests and Google Drive Polish.

- test: Wire saucelabs and travis togeteher, make saucelabs fail fatal to travis builds
- test: Add `addFile`-hack so we can have acceptance tests on Safari as well as Edge (@arturi)
- drive: possible UI polish (@hedgerh)
- drive: write files to filesystem correctly (@hedgerh)
- test: Fix 15s timeout image.jpg (@arturi)
- test: Sign up for Browserstack.com Live account so we can check ourselves what gives and verify saucelabs isn't to blame (@arturi) <-- Turns out, Saucelabs already does that for us
- test: Get tests to pass Latest version of Internet Explorer (Windows 10), Safari (OSX), Firefox (Linux), Opera (Windows 10) (@arturi) <-- IE 10, Chrome, Firefox on Windows and Linux, but not Safari and Microsoft Edge — Selenium issues
- test: Get saucelabs to show what gives (errors, screenshots, anything) (@arturi)
- build: sourcemaps for local development (@arturi) <-- Not adding it in production to save the extra request. For local dev, this was added already via Browserify
- core: Add polyfill for `fetch` (@hedgerh)
- core: Apply plugins when DOM elements aren't static (#25)
- core: figure out the shelf thing https://transloadit.slack.com/archives/uppy/p1460054834000504 https://dl.dropboxusercontent.com/s/ypx6a0a82s65o0z/2016-04-08%20at%2010.38.png (@arturi, @hedgerh)
- core: reduce the monstrous 157.74Kb prebuilt bundle footprint https://dl.dropboxusercontent.com/s/ypx6a0a82s65o0z/2016-04-08%20at%2010.38.png <-- we see no way to optimize at this stage
- drive: add breadcrumb navigation (@hedgerh)
- drive: convert google docs to office format (@hedgerh)
- modal: Avoid duplicating event listeners <-- deprecated by yoyo
- progressbar: make it great again (@arturi)
- progressdrawer: figure out why the whole list is replaced with every update (dom diff problems) (@arturi)
- test: Let Travis use the Remote WebDriver instead of the Firefox WebDriver (https://docs.travis-ci.com/user/gui-and-headless-browsers/#Using-Sauce-Labs), so Saucelabs can run our acceptance tests against a bunch of real browsers. Local acceptance tests keep using Firefox <-- need to add command to Travis (@arturi)
- test: Move failing multipart test back from `v0.0.5` dir, make it pass (@arturi)
- tus: Add support tus 1.0 uploading capabilities (#3) <-- works!
- website: Make cycling through taglines pretty (in terms of code and a nice animation or sth) (@arturi)
- website: Move the activity feed from http://uppy.io/stats to the Uppy homepage (@arturi)
- website: Polish http://uppy.io/stats and undo its CSS crimes (@arturi)

### 0.0.4

Released: April 13, 2016.

- server: Upgrade to 0.0.4 (@kvz)
- drive: Add Google Drive plugin unit test (@hedgerh)
- drive: Add a barely working Google Drive example (without Modal, via e.g. `target: "div#on-my-page"`) (@hedgerh)
- drive: Make sure http://server.uppy.io is targeted on uppy.io; and localhost is targeted elsewhere (also see https://github.com/hughsk/envify) (@kvz)
- test: Setup one modal/dragdrop acceptance test (@arturi)
- drive: Make sure http://server.uppy.io is targeted on uppy.io; and localhost is targeted elsewhere (also see https://github.com/hughsk/envify) (@kvz)
- website: Add a http://uppy.io/stats page that inlines disc.html as well as displays the different bundle sizes, and an activity feed (@kvz)
- dragdrop: refactor & improve (@arturi)
- website: fix i18n & DragDrop examples (@arturi)
- website: Provide simple roadmap in examples (#68, @kvz)
- website: Upgrade Hexo (@kvz)
- test: Make failing acceptance tests fatal (@kvz)
- allow for continuous `acquiring`, even after all plugins have “run” (@arturi, @hedgerh)
- build: clean up package.json. We've accumulated duplication and weirdness by hacking just for our current problem without keeping a wider view of what was already there (@arturi)
- build: fix browsersync & browserify double reloading issue (@arturi)
- build: sourcemaps for examples (@arturi)
- complete: `Complete` Plugin of type/stage: `presenter`. "You have successfully uploaded `3 files`". Button: Close modal. (@arturi)
- core: allow for continuous `acquiring`, even after all plugins have “run” (@arturi, @hedgerh)
- core: come up with a draft standard file format for internal file handling (@arturi)
- core: Pluralize collections (locales, just l like plugins) (@kvz)
- core: re-think running architecture: allow for `acquiring` while `uploading` (@arturi)
- core: Rename `progress` to `progressindicator` (@kvz)
- core: Rename `selecter` to `acquirer` (@kvz)
- core: Rename `view` to `orchestrator` (@kvz)
- core: start on component & event-based state management with `yo-yo` (@arturi)
- core: Upgrade from babel5 -> babel6 (@kvz)
- dragdrop: Fix 405 Not Allowed, (error) handling when you press Upload with no files (#60, @arturi, thx @hpvd)
- modal: `UppyModal [type=submit] { display: none }`, use Modal's own Proceed button to progress to next stage (@arturi)
- modal: covert to component & event-based state management (@arturi)
- modal: Make sure modal renders under one dom node — should everything else too? (@arturi, @hedgerh)
- modal: refactor and improve (@arturi)
- progressdrawer: show link to the uploaded file (@arturi)
- progressdrawer: show file type names/icons for non-image files (@arturi)
- progressdrawer: show uploaded files, display uploaded/selected count, disable btn when nothing selected (@arturi)
- progressdrawer: implement basic version, show upload progress for individual files (@arturi)
- progressdrawer: show previews for images (@arturi)
- server: Add a deploy target for uppy-server so we can use it in demos (#39, @kvz)
- test: Add a passing dummy i18n acceptance test, move failing multipart test to `v0.5.0` dir (@kvz)
- test: Add acceptance tests to Travis so they are run on every change (@kvz)
- test: Get Firefox acceptance tests up and running both local and on Travis CI. Currently both failing on `StaleElementReferenceError: Element not found in the cache - perhaps the page has changed since it was looked up` https://travis-ci.org/transloadit/uppy/builds/121175389#L478
- test: Get saucelabs account https://saucelabs.com/beta/signup/OSS/None (@hedgerh)
- test: Install chromedriver ()
- test: Switch to using Firefox for acceptable tests as Travis CI supports that (https://docs.travis-ci.com/user/gui-and-headless-browsers/#Using-xvfb-to-Run-Tests-That-Require-a-GUI) (@kvz)
- test: Write one actual test (e.g. Multipart) (#2, #23, @hedgerh)
- tus: Resolve promise when all uploads are done or failed, not earlier (currently you get to see '1 file uploaded' and can close the modal while the upload is in progress) (@arturi)
- website: Filter taglines (@kvz)
- website: utilize browserify index exposers to rid ourselves of `../../../..` in examples (@kvz)

### 0.0.3

Released: March 01, 2016.

- core: push out v0.0.3 (@kvz)
- build: release-(major|minor|patch): git tag && npm publish (@kvz)
- core: Allow users to set DOM elements or other plugins as targets (@arturi)
- core: Create a progressbar/spinner/etc plugin (#18, @arturi)
- core: Decide on how we ship default styles: separate css file, inline (@kvz, @hedgerh, @arturi, @tim-kos)
- core: Decide on single-noun terminology (npm, umd, dist, package, cdn, module -> bundler -> bundle), and call it that through-out (@kvz)
- core: throw an error when one Plugin is `.use`d twice. We don't support that now, and will result in very confusing behavior (@kvz)
- dragdrop: Convert `DragDrop` to adhere to `Dummy`'s format, so it's compatible with the new Modal (@arturi)
- drive: Convert `GoogleDrive` to adhere to `Dummy`'s format, so it's compatible with the new Modal (@hedgerh)
- modal: Add barely working Modal plugin that can be used as a target (#53, #50, @arturi)
- modal: Improve Modal API (@arturi, @kvz)
- modal: Make `ProgressBar` work with the new Modal (@kvz, @arturi)
- modal: Make Modal prettier and accessible using Artur's research (@arturi)
- modal: Make the Modal look like Harry's sketchup (@arturi)
- modal: Rename FakeModal to Modal, deprecating our old one (@kvz)
- modal: use classes instead of IDs and buttons instead of links (@arturi)
- server: `package.json` (@hedgerh)
- test: Fix and enable commented out `use plugins` & other core unit test (@arturi)

### 0.0.2

Released: February 11, 2016.

- build: Use parallelshell and tweak browserify to work with templates (@arturi)
- core: Add basic i18n support via `core.translate()` and locale loading (#47, @arturi)
- core: implement a non-blocking `install` method (for Progressbar, for example)  (@arturi, @kvz)
- core: Implement ejs or es6 templating (@arturi, @hedgerh)
- core: Improve on `_i18n` support, add tests (#47, @arturi)
- core: Integrate eslint in our build procedure and make Travis fail on errors found in our examples, Core and Plugins, such as `> 100` char lines (@kvz)
- docs: Fix build-documentation.js crashes, add more docs to Utils and Translator (@arturi, @kvz)
- dragdrop: Use templates, autoProceed setting, show progress (#50, #18, @arturi)
- meta: Implement playground to test things in, templates in this case
- server: Create a (barely) working uppy-server (#39, @hedgerh)
- website: Fix Uppy deploys (postcss-svg problem) (@arturi, @kvz)

### 0.0.1

Released: December 20, 2015.

- core: Individual progress (#24)
- core: Setup basic Plugin system (#1, #4, #20)
- core: Setup build System (#30, #13, @hedgerh)
- dragdrop: Add basic DragDrop plugin example (#7)
- dropbox: Add basic Dropbox plugin example (#31)
- website: Add CSS Framework (#14)
- website: Create Hexo site that also contains our playground (#5, #34, #12 #22, #44, #35, #15, #37, #40, #43)
