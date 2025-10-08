# @uppy/companion

## 6.1.0

### Minor Changes

- 5ba2c1c: Introduce the concept of server-side search and add support for it for the Dropbox provider. Previously, only client-side filtering in the currently viewed folder was possible, which was limiting. Now users using Companion with Dropbox can perform a search across their entire account.

## 6.0.2

### Patch Changes

- 7e5acf1: fix the server crashing due a malformed json in a websocket message
- 975317d: Removed "main" from package.json, since export maps serve as the contract for the public API.

## 6.0.1

### Patch Changes

- 49522ec: Remove preact/compat imports in favor of preact, preventing JSX type issues in certain setups.

## 6.0.0

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

- acdc683: Make Companion ESM-only. As of Node.js 20.19.0, you can require(esm) if you haven't transitioned yet.

## 5.9.0

### Minor Changes

- 0c24c5a: Add provider name to metadata for observability

### Patch Changes

- 0c24c5a: Make StreamableBlob spec compliant for Node.js 24+

## 5.8.0

Released: 2025-06-02
Included in: Uppy v4.17.0

- @uppy/companion: add max filename length env var (Freeman / #5763)
- @uppy/companion: fix cookie maxAge to milliseconds (zolotarov@brights.io / #5746)
- @uppy/companion: improve Zoom folder structure (Merlijn Vos / #5739)

## 5.7.0

Released: 2025-05-18
Included in: Uppy v4.16.0

- @uppy/companion: implement credentials param `transloadit_gateway` (Mikael Finstad / #5725)
- @uppy/companion: Fix AES key wear-out (Florian Maury / #5724)

## 5.6.0

Released: 2025-04-08
Included in: Uppy v4.14.0

- @uppy/companion: implement dropbox business teams (Mikael Finstad / #5708)

## 5.5.2

Released: 2025-02-25
Included in: Uppy v4.13.3

- @uppy/companion: log when tus uploaded size differs (Mikael Finstad / #5647)
- @uppy/companion: remove redundant HEAD request for file size (Mikael Finstad / #5648)

## 5.5.1

Released: 2025-01-22
Included in: Uppy v4.13.1

- @uppy/companion: unify http error responses (Mikael Finstad / #5595)

## 5.5.0

Released: 2025-01-15
Included in: Uppy v4.13.0

- @uppy/companion: fix forcePathStyle boolean conversion (Mikael Finstad / #5308)
- @uppy/companion: add COMPANION_TUS_DEFERRED_UPLOAD_LENGTH (Dominik Schmidt / #5561)

## 5.4.1

Released: 2025-01-08
Included in: Uppy v4.12.1

- @uppy/companion: upgrade express & express-session (Merlijn Vos / #5582)

## 5.4.0

Released: 2025-01-06
Included in: Uppy v4.10.0

- @uppy/companion: pass fetched origins to window.postMessage() (Merlijn Vos / #5529)

## 5.2.0

Released: 2024-12-05
Included in: Uppy v4.8.0

- @uppy/companion,@uppy/google-drive-picker,@uppy/google-photos-picker: Google Picker (Mikael Finstad / #5443)

## 5.1.4

Released: 2024-11-11
Included in: Uppy v4.7.0

- @uppy/companion: Enable CSRF protection in grant (OAuth2) (Mikael Finstad / #5504)

## 5.1.3

Released: 2024-10-31
Included in: Uppy v4.6.0

- docs,@uppy/companion: disallow corsOrigins "\*" (Mikael Finstad / #5496)

## 5.1.2

Released: 2024-10-15
Included in: Uppy v4.5.0

- @uppy/companion: Fix redis emitter (Mikael Finstad / #5474)

## 5.1.0

Released: 2024-08-29
Included in: Uppy v4.3.0

- @uppy/companion: do not use unsafe call to `JSON.stringify` (Antoine du Hamel / #5422)

## 5.0.5

Released: 2024-08-15
Included in: Uppy v4.1.1

- @uppy/companion: fix code for custom providers (Mikael Finstad / #5398)

## 5.0.3

Released: 2024-07-15
Included in: Uppy v4.0.3

- @uppy/companion: Improve error message when `window.opener == null` (Mikael Finstad / #5340)

## 5.0.1

Released: 2024-07-15
Included in: Uppy v4.0.1

- @uppy/companion: bump `ws` from 8.17.0 to 8.17.1 (dependabot[bot] / #5324)

## 5.0.0

Released: 2024-07-10
Included in: Uppy v4.0.0

- @uppy/companion: make streaming upload default to `true` (Mikael Finstad / #5315)
- @uppy/companion: remove `oauthOrigin` (Antoine du Hamel / #5311)
- @uppy/companion: do not list Node.js 20.12 as compatible (Antoine du Hamel / #5309)
- examples,@uppy/companion: Release: uppy@3.27.3 (github-actions[bot] / #5304)
- @uppy/companion: fix `TypeError` when parsing request (Antoine du Hamel / #5303)

## 5.0.0-beta.12

Released: 2024-07-02
Included in: Uppy v4.0.0-beta.14

- @uppy/companion: make `oauthOrigin` option required (Mikael Finstad / #5276)

## 5.0.0-beta.11

Released: 2024-06-27
Included in: Uppy v4.0.0-beta.13

- @uppy/companion: implement facebook app secret proof (Mikael Finstad / #5249)

## 5.0.0-beta.10

Released: 2024-06-18
Included in: Uppy v4.0.0-beta.12

- @uppy/companion: coalesce options `bucket` and `getKey` (Mikael Finstad / #5169)
- @uppy/companion: improve companion logging (Mikael Finstad / #5250)

## 5.0.0-beta.9

Released: 2024-06-04
Included in: Uppy v4.0.0-beta.10

- @uppy/companion: invert some internal boolean options (Mikael Finstad / #5198)
- @uppy/companion: rename `authProvider` to `oauthProvider` (Mikael Finstad / #5198)
- @uppy/companion: remove unused headers (Mikael Finstad / #5198)
- @uppy/companion: remove sanitizing of metadata (Mikael Finstad / #5198)
- @uppy/companion: remove `error.extraData` (Mikael Finstad / #5198)
- @uppy/companion: capitalize POST (Mikael Finstad / #5198)
- @uppy/companion: simplify code by using modern Node.js APIs (Mikael Finstad / #5198)
- @uppy/companion: rename `getExtraConfig` to `getExtraGrantConfig` (Mikael Finstad / #5198)
- @uppy/companion: change `COMPANION_ENABLE_URL_ENDPOINT` default (Mikael Finstad / #5198)
- @uppy/companion: change default value for Redis session prefix (Mikael Finstad / #5198)

## 5.0.0-beta.8

Released: 2024-05-23
Included in: Uppy v4.0.0-beta.9

- @uppy/companion: remove `chalk` from dependencies (Antoine du Hamel / #5178)

## 5.0.0-beta.7

Released: 2024-05-22
Included in: Uppy v4.0.0-beta.8

- @uppy/companion: encode `uploadId` (Mikael Finstad / #5168)
- @uppy/companion: bump `express-session` (Antoine du Hamel / #5177)
- @uppy/companion: remove dependency on `express-request-id` (Antoine du Hamel / #5176)
- @uppy/companion: bump prom to v15 (Antoine du Hamel / #5175)
- @uppy/companion: upgrade deps (Antoine du Hamel / #5119)

## 5.0.0-beta.6

Released: 2024-05-14
Included in: Uppy v4.0.0-beta.7

- @uppy/companion: switch from `node-redis` to `ioredis` (Dominik Schmidt / #4623)

## 5.0.0-beta.5

Released: 2024-05-03
Included in: Uppy v4.0.0-beta.5

- @uppy/companion: coerce `requestUrl` to a string (Antoine du Hamel / #5128)

## 5.0.0-beta.4

Released: 2024-04-29
Included in: Uppy v4.0.0-beta.4

- @uppy/companion: bump Node.js version support matrix (Antoine du Hamel / #5035)
- @uppy/companion,@uppy/file-input: Release: uppy@3.24.1 (github-actions[bot] / #5069)
- @uppy/companion: upgrade redis (Mikael Finstad / #5065)
- @uppy/companion: Bump express from 4.18.1 to 4.19.2 (dependabot[bot] / #5037)

## 5.0.0-beta.1

Released: 2024-03-28
Included in: Uppy v4.0.0-beta.1

- @uppy/companion: improve error msg (Mikael Finstad / #5010)
- @uppy/companion: crash if trying to set path to / (Mikael Finstad / #5003)

## 4.15.1

Released: 2024-07-03
Included in: Uppy v3.27.3

- @uppy/companion: fix `TypeError` when parsing request (Antoine du Hamel / #5303)

## 4.15.0

Released: 2024-07-02
Included in: Uppy v3.27.2

- @uppy/companion: add `s3.forcePathStyle` option (Nadeem Reinhardt / #5066)
- @uppy/companion: add `oauthOrigin` option (Antoine du Hamel / #5297)

## 4.14.0

Released: 2024-06-18
Included in: Uppy v3.27.0

- @uppy/google-photos: add plugin (Mikael Finstad / #5061)
- @uppy/companion: Bump ws from 8.8.1 to 8.17.1 (#5256)

## 4.13.3

Released: 2024-05-22
Included in: Uppy v3.25.4

- @uppy/companion: fix google drive gsuite export large size (Milan Nakum / #5144)
- @uppy/companion: handle ws `'error'` event (Mikael Finstad / #5167)

## 4.13.2

Released: 2024-05-03
Included in: Uppy v3.25.1

- @uppy/companion: coerce `requestUrl` to a string (Antoine du Hamel / #5128)

## 4.13.1

Released: 2024-04-10
Included in: Uppy v3.24.1

- @uppy/companion: upgrade redis (Mikael Finstad / #5065)
- @uppy/companion: Bump express from 4.18.1 to 4.19.2 (dependabot[bot] / #5037)

## 4.13.0

Released: 2024-03-27
Included in: Uppy v3.24.0

- @uppy/companion: improve error msg (Mikael Finstad / #5010)
- @uppy/companion: crash if trying to set path to / (Mikael Finstad / #5003)

## 4.12.1

Released: 2024-02-19
Included in: Uppy v3.22.0

- @uppy/companion: fix companion dns and allow redirects from http->https again (mikael finstad / #4895)
- @uppy/companion,@uppy/tus: bump `tus-js-client` version range (merlijn vos / #4848)

## 4.12.0

Released: 2023-12-12
Included in: Uppy v3.21.0

- @uppy/companion: fix double tus uploads (Mikael Finstad / #4816)
- @uppy/companion: fix accelerated endpoints for presigned POST (Mikael Finstad / #4817)
- @uppy/companion: fix `authProvider` property inconsistency (Mikael Finstad / #4672)
- @uppy/companion: send certain onedrive errors to the user (Mikael Finstad / #4671)
- @uppy/companion: Provider user sessions (Mikael Finstad / #4619)

## 4.11.0

Released: 2023-11-08
Included in: Uppy v3.19.0

- @uppy/companion: Companion+client stability fixes, error handling and retry (Mikael Finstad / #4734)
- @uppy/companion: add getBucket metadata argument (Mikael Finstad / #4770)

## 4.10.1

Released: 2023-10-23
Included in: Uppy v3.18.1

- @uppy/companion: Bump jsonwebtoken from 8.5.1 to 9.0.0 in /packages/@uppy/companion (dependabot[bot] / #4751)

## 4.10.0

Released: 2023-10-20
Included in: Uppy v3.18.0

- @uppy/companion: Bucket fn also remote files (Mikael Finstad / #4693)

## 4.9.1

Released: 2023-09-29
Included in: Uppy v3.17.0

- @uppy/companion: upgrade TS target (Mikael Finstad / #4670)
- @uppy/companion: use deferred length for tus streams (Mikael Finstad / #4697)
- @uppy/companion: fix instagram/facebook auth error regression (Mikael Finstad / #4692)
- @uppy/companion: add test endpoint for dynamic oauth creds (Mikael Finstad / #4667)
- @uppy/companion: fix edge case for pagination on root (Mikael Finstad / #4689)
- @uppy/companion: fix onedrive pagination (Mikael Finstad / #4686)

## 4.9.0

Released: 2023-09-18
Included in: Uppy v3.16.0

- @uppy/companion: add missing credentialsURL for box (Mikael Finstad / #4681)
- @uppy/companion: remove s3 endpoints if s3 disabled (Mikael Finstad / #4675)
- @uppy/companion: Onedrive refresh tokens (Mikael Finstad / #4655)
- @uppy/companion: catch "invalid initialization vector" instead of crashing (Mikael Finstad / #4661)

## 4.8.2

Released: 2023-09-05
Included in: Uppy v3.15.0

- @uppy/companion: refactor `getProtectedHttpAgent` to make TS happy (Antoine du Hamel / #4654)
- @uppy/companion: Alias "removeListener" as "off" in Redis emitter (Elliot Dickison / #4647)

## 4.8.1

Released: 2023-08-23
Included in: Uppy v3.14.1

- @uppy/companion: harden lint rules (Antoine du Hamel / #4641)

## 4.8.0

Released: 2023-08-15
Included in: Uppy v3.14.0

- @uppy/companion: Fix typos and add env vars to .env.example (Dominik Schmidt / #4624)
- @uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/companion,@uppy/transloadit,@uppy/xhr-upload: use uppercase HTTP method names (Antoine du Hamel / #4612)
- @uppy/companion: make CSRF protection helpers available to providers (Dominik Schmidt / #4554)
- @uppy/companion: fix Redis key default TTL (Subha Sarkar / #4607)
- @uppy/companion: Fix Uploader.js metadata normalisation (Subha Sarkar / #4608)
- @uppy/companion: Unify redis initialization (Dominik Schmidt / #4597)
- @uppy/companion: allow dynamic S3 bucket (rmoura-92 / #4579)

## 4.7.0

Released: 2023-07-13
Included in: Uppy v3.12.0

- @uppy/companion: fix esm imports in production/transpiled builds (Dominik Schmidt / #4561)
- @uppy/box,@uppy/companion,@uppy/dropbox,@uppy/google-drive,@uppy/onedrive,@uppy/provider-views: Load Google Drive / OneDrive lists 5-10x faster & always load all files (Merlijn Vos / #4513)

## 4.6.0

Released: 2023-07-06
Included in: Uppy v3.11.0

- @uppy/companion: fix infinite recursion in uploader test (Mikael Finstad / #4536)
- @uppy/companion: bump semver from 7.3.7 to 7.5.3 (dependabot[bot] / #4529)
- @uppy/companion: fix part listing in s3 (Antoine du Hamel / #4524)
- @uppy/companion: implement refresh for authentication tokens (Mikael Finstad / #4448)

## 4.5.1

Released: 2023-06-19
Included in: Uppy v3.10.0

- @uppy/companion: switch from aws-sdk v2 to @aws-sdk/\* (v3) (Scott Bessler / #4285)
- @uppy/companion,@uppy/core,@uppy/dashboard,@uppy/golden-retriever,@uppy/status-bar,@uppy/utils: Migrate all lodash' per-method-packages usage to lodash. (LinusMain / #4274)
- @uppy/companion: revert randomness from file names (Mikael Finstad / #4509)
- @uppy/companion: Custom provider fixes (Mikael Finstad / #4498)
- @uppy/companion: fix 500 when file name contains non-ASCII chars (Antoine du Hamel / #4493)
- @uppy/companion: Use filename from content-disposition instead of relying on url, with fallback (Artur Paikin / #4489)
- @uppy/companion: fix companion implicitpath (Mikael Finstad / #4484)
- @uppy/companion: fix undefined protocol and example page (Mikael Finstad / #4483)

## 4.5.0

Released: 2023-04-18
Included in: Uppy v3.8.0

- @uppy/companion: increase max limits for remote file list operations (Mikael Finstad / #4417)

## 4.4.0

Released: 2023-04-04
Included in: Uppy v3.7.0

- @uppy/companion: add `service: 'companion'` to periodic ping (Mikael Finstad / #4383)
- @uppy/companion: add connection keep-alive to dropbox (Mikael Finstad / #4365)
- @uppy/companion: add missing env variable for standalone option (Mikael Finstad / #4382)
- @uppy/companion: add S3 prefix env variable (Mikael Finstad / #4320)
- @uppy/companion: allow local ips when testing (Mikael Finstad / #4328)
- @uppy/companion: fix typo in redis-emitter.js (Ikko Eltociear Ashimine / #4362)
- @uppy/companion: merge Provider/SearchProvider (Mikael Finstad / #4330)
- @uppy/companion: only body parse when needed & increased body size for s3 (Mikael Finstad / #4372)

## 4.3.0

Released: 2023-02-13
Included in: Uppy v3.5.0

- @uppy/companion: @uppy/companion upgrade grant dependency (Scott Bessler / #4286)

## 4.2.0

Released: 2023-01-26
Included in: Uppy v3.4.0

- @uppy/companion: allow customizing express session prefix (Mikael Finstad / #4249)
- @uppy/companion: Fix typo in KUBERNETES.md (Collin Allen / #4277)
- @uppy/companion: document how to run many instances (Mikael Finstad / #4227)

## 4.1.1

Released: 2022-11-16
Included in: Uppy v3.3.1

- @uppy/companion: send expire info for non-multipart uploads (Antoine du Hamel / #4214)

## 4.1.0

Released: 2022-11-10
Included in: Uppy v3.3.0

- @uppy/companion: change default S3 expiry from 300 to 800 seconds (Merlijn Vos / #4206)
- @uppy/companion: send expiry time along side S3 signed requests (Antoine du Hamel / #4202)

## 4.0.4

Released: 2022-10-19
Included in: Uppy v3.2.0

- @uppy/companion: add workaround for S3 accelerated endpoints (Mikael Finstad / #4140)
- @uppy/companion: fix error message (Mikael Finstad / #4125)

## 4.0.2

Released: 2022-09-25
Included in: Uppy v3.1.0

- @uppy/companion: Companion throttle progress by time (Mikael Finstad / #4101)
- @uppy/audio,@uppy/aws-s3-multipart,@uppy/aws-s3,@uppy/box,@uppy/companion-client,@uppy/companion,@uppy/compressor,@uppy/core,@uppy/dashboard,@uppy/drag-drop,@uppy/drop-target,@uppy/dropbox,@uppy/facebook,@uppy/file-input,@uppy/form,@uppy/golden-retriever,@uppy/google-drive,@uppy/image-editor,@uppy/informer,@uppy/instagram,@uppy/locales,@uppy/onedrive,@uppy/progress-bar,@uppy/provider-views,@uppy/react,@uppy/redux-dev-tools,@uppy/remote-sources,@uppy/screen-capture,@uppy/status-bar,@uppy/store-default,@uppy/store-redux,@uppy/svelte,@uppy/thumbnail-generator,@uppy/transloadit,@uppy/tus,@uppy/unsplash,@uppy/url,@uppy/utils,@uppy/vue,@uppy/webcam,@uppy/xhr-upload,@uppy/zoom: add missing entries to changelog for individual packages (Antoine du Hamel / #4092)

## 4.0.1

Released: 2022-08-30
Included in: Uppy v3.0.1

- @uppy/companion: Fix Companion license (Merlijn Vos / #4044)

## 4.0.0

Released: 2022-08-22
Included in: Uppy v3.0.0

- Switch to ESM

## 4.0.0-beta.4

Released: 2022-08-16
Included in: Uppy v3.0.0-beta.5

- @uppy/companion: Companion: bring back default upload protocol (Mikael Finstad / #3967)
- @uppy/companion: enforce usage of uploadUrls (Mikael Finstad / #3965)
- @uppy/companion: fix crash if redis disconnects (Mikael Finstad / #3954)
- @uppy/companion: upgrade `ws` version (Antoine du Hamel / #3949)
- @uppy/companion: sort Dropbox response & refactor to async/await (Mikael Finstad / #3897)
- @uppy/companion: fix default getKey for non-standalone too (Mikael Finstad / #3945)
- @uppy/companion: remove `isobject` from dependencies (Antoine du Hamel / #3948)
- @uppy/companion: show deprecation message when using legacy s3 options (Antoine du Hamel / #3944)

## 4.0.0-beta.3

Released: 2022-08-03
Included in: Uppy v3.0.0-beta.4

- @uppy/companion,@uppy/tus: Upgrade tus-js-client to 3.0.0 (Merlijn Vos / #3942)

## 4.0.0-beta.2

Released: 2022-07-27
Included in: Uppy v3.0.0-beta.3

- @uppy/companion: update minimal supported Node.js version in the docs (Antoine du Hamel / #3902)
- @uppy/companion: upgrade `redis` to version 4.x (Antoine du Hamel / #3589)
- @uppy/companion: remove unnecessary ts-ignores (Mikael Finstad / #3900)
- @uppy/companion: remove `COMPANION_S3_GETKEY_SAFE_BEHAVIOR` env variable (Antoine du Hamel / #3869)

## 4.0.0-beta.1

Released: 2022-07-06
Included in: Uppy v3.0.0-beta.2

- @uppy/companion: remove deprecated duplicated metrics (Mikael Finstad / #3833)
- @uppy/companion: Companion 3 default to no s3 acl (Mikael Finstad / #3826)
- @uppy/companion: rewrite companion.app() to return an object (Mikael Finstad / #3827)
- @uppy/companion: remove companion provider compat api (Mikael Finstad / #3828)
- @uppy/companion: rewrite code for node >=14 (Mikael Finstad / #3829)
- @uppy/companion: remove chunkSize backwards compatibility (Mikael Finstad / #3830)
- @uppy/companion: Companion: make `emitSuccess` and `emitError` private (Mikael Finstad / #3832)
- @uppy/companion: do not use a default upload protocol (Mikael Finstad / #3834)

## 4.0.0-beta

Released: 2022-05-30
Included in: Uppy v3.0.0-beta

- @uppy/companion: remove `searchProviders` wrapper & move `s3` options (Merlijn Vos / #3781)
- @uppy/companion: remove support for EOL versions of Node.js (Antoine du Hamel / #3784)

## 3.7.1

Released: 2022-07-27
Included in: Uppy v2.13.1

- @uppy/companion: Companion app type (Mikael Finstad / #3899)

## 3.7.0

Released: 2022-07-06
Included in: Uppy v2.12.2

- @uppy/companion: Getkey safe behavior (Mikael Finstad / #3592)
- @uppy/companion: doc: fix Google Drive example (Antoine du Hamel / #3855)
- @uppy/companion: build an ARM64 container (Stuart Auld / #3841)

## 3.6.0

Released: 2022-05-30
Included in: Uppy v2.11.0

- @uppy/companion: expire redis keys after 1 day (Mikael Finstad / #3771)
- @uppy/companion: fix some linter warnings (Antoine du Hamel / #3752)

## 3.5.2

Released: 2022-04-27
Included in: Uppy v2.9.5

- @uppy/companion: Bump moment from 2.29.1 to 2.29.2 (dependabot[bot] / #3635)

## 3.5.0

Released: 2022-03-24
Included in: Uppy v2.9.0

- @uppy/companion: Companion server upload events (Mikael Finstad / #3544)
- @uppy/companion: fix `yarn test` command (Antoine du Hamel / #3590)
- @uppy/companion: Allow setting no ACL (Mikael Finstad / #3577)
- @uppy/companion: Small companion code and doc changes (Mikael Finstad / #3586)

## 3.4.0

Released: 2022-03-16
Included in: Uppy v2.8.0

- @uppy/companion: always log errors with stack trace (Mikael Finstad / #3573)
- @uppy/companion: Companion refactor (Mikael Finstad / #3542)
- @uppy/companion: Fetch all Google Drive shared drives (Robert DiMartino / #3553)
- @uppy/companion: Order Google Drive results by folder to show all folders first (Robert DiMartino / #3546)
- @uppy/companion: upgrade node-redis-pubsub (Mikael Finstad / #3541)
- @uppy/companion: reorder reqToOptions (Antoine du Hamel / #3530)

## 3.3.1

Released: 2022-03-02
Included in: Uppy v2.7.0

- @uppy/companion: fix unstable test (Mikael Finstad)
- @uppy/companion: replace debug (Mikael Finstad)
- @uppy/companion: Fix COMPANION_PATH (Mikael Finstad / #3515)
- @uppy/companion: Upload protocol "s3-multipart" does not use the chunkSize option (Gabi Ganam / #3511)

## 3.3.0

Released: 2022-02-17
Included in: Uppy v2.6.0

- @uppy/companion: fix unpslash author meta, sanitize metadata to strings and improve companion tests (Mikael Finstad / #3478)

## 3.2.1

Released: 2022-02-16
Included in: Uppy v2.5.1

- @uppy/companion: fix periodicPingUrls oops (Mikael Finstad / #3490)

## 3.2.0

Released: 2022-02-14
Included in: Uppy v2.5.0

- @uppy/companion: add support for COMPANION_UNSPLASH_SECRET (Mikael Finstad / #3463)
- @uppy/companion-client,@uppy/companion,@uppy/provider-views,@uppy/robodog: Finishing touches on Companion dynamic Oauth (Renée Kooi / #2802)
- @uppy/companion: fix broken thumbnails for box and dropbox (Mikael Finstad / #3460)
- @uppy/companion: Implement periodic ping functionality (Mikael Finstad / #3246)
- @uppy/companion: fix callback urls (Mikael Finstad / #3458)
- @uppy/companion: Fix TypeError when invalid initialization vector (Julian Gruber / #3416)
- @uppy/companion: Default to HEAD requests when the Companion looks to get meta information about a URL (Zack Bloom / #3417)

## 3.1.5

Released: 2022-01-04
Included in: Uppy v2.3.3

- @uppy/companion: improve private ip check (Mikael Finstad / #3403)

## 3.1.4

Released: 2021-12-21
Included in: Uppy v2.3.2

- @uppy/angular,@uppy/companion,@uppy/svelte,@uppy/vue: add `.npmignore` files to ignore `.gitignore` when packing (Antoine du Hamel / #3380)
- @uppy/companion: Upgrade ws in companion (Merlijn Vos / #3377)

## 3.1.3

Released: 2021-12-09
Included in: Uppy v2.3.1

- @uppy/companion: fix Dockerfile and deploy automation (Mikael Finstad / #3355)
- @uppy/companion: don't pin Yarn version in `package.json` (Antoine du Hamel / #3347)

## 3.1.2

Released: 2021-12-07
Included in: Uppy v2.3.0

- @uppy/companion: fix deploy Yarn version (Antoine du Hamel / #3327)
- @uppy/companion: upgrade aws-sdk (Mikael Finstad / #3334)
- @uppy/companion: Remove references of incorrect `options` argument for `companion.socket` (Mikael Finstad / #3307)
- @uppy/companion: Upgrade linting to 2.0.0-0 (Kevin van Zonneveld / #3280)
