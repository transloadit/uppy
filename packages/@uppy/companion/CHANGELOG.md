# @uppy/companion

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

- @uppy/companion: switch from aws-sdk v2 to @aws-sdk/* (v3) (Scott Bessler / #4285)
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
