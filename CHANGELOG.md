Our combined changelog and roadmap. It contains todos as well as dones.

Items can be optionally be tagged tagged by GitHub owner issue if discussion
happened / is needed.

Please add your entries in this format:

 - `- [ ] (<plugin name>|website|core|meta|build|test): <Present tense verb> <subject> \(<list of associated owners/gh-issues>\)`.

In the current stage we aim to release a new version at least every month.

## Backlog

Ideas that will be planned and find their way into a release at one point.
PRs are welcome! Please do open an issue to discuss first if it's a big feature, priorities may have changed after something was added here.

- [ ] core: Add an option to force metafield data when uploading a file. Mark files with restriction errors in the UI. Having an icon showing close to the file to inform if it passed any rule would provide an awesome user experience. The user would be able to edit the file name or any meta tags necessary to pass validation via uppy dashboard, and anytime the user updates the file info, the validation runs again and the icon is updated. #1703
- [ ] core: Make sure Uppy works well in VR
- [ ] core: normalize file names when uploading from iOS? Can we do it with meta data? date? `image-${index}`? #678
- [ ] dashboard: add option to disable uploading from local disk #657
- [ ] dashboard: allow minimizing the Dashboard during upload (Uppy then becomes just a tiny progress indicator) (@arturi)
- [ ] dashboard: display data like image resolution on file cards. should be done by thumbnail generator maybe #783
- [ ] dashboard: possibility to edit/delete more than one file at once. example: add copyrigh info to 1000 files #118, #97
- [ ] dashboard: possibility to work on already uploaded / in progress files. We'll just provide the `fileId` to the `file-edit-complete` event so that folks can more easily roll out custom code for this themselves #112, #113, #2063
- [ ] dashboard: Show upload speed too if `showProgressDetails: true`. Maybe have separate options for which things are displayed, or at least have css-classes that can be hidden with `display: none` #766
- [ ] goldenretriever: make it work with aws multipart https://community.transloadit.com/t/resumable-aws-s3-multipart-integration/14888 (@goto-bus-stop)
- [ ] plugins: WordPress Front-end Gravity Forms Uppy plugin so one form field could be an Uppy-powered file input
- [ ] provider: add sorting (by date) #254
- [ ] qa: add one integration test (or add to existing test) that uses more exotic (tus) options such as `useFastRemoteRetry` or `removeFingerprintOnSuccess` https://github.com/transloadit/uppy/issues/1327 (@arturi, @ifedapoolarewaju)
- [ ] react: Add a React Hook to manage an Uppy instance https://github.com/transloadit/uppy/pull/1247#issuecomment-458063951 (@goto-bus-stop)
- [ ] rn: Uppy React Native works with Expo, now let's make it work without
- [ ] rn: Uppy React Native works with Url Plugin, now let's make it work with Instagram
- [ ] security: consider iframe / more security for Transloadit/Uppy integration widget and Uppy itself. Page can’t get files from Google Drive if its an iframe
- [ ] statusbar: Add a confirmation of the cancel action (https://github.com/transloadit/uppy/issues/1418) as well as ask the user if they really want to navigate away while an upload is in progress via `onbeforeunload` (@arturi)
- [ ] test: Add a prepublish test that checks if `npm pack` is not massive (@goto-bus-stop)
- [ ] test: add https://github.com/pa11y/pa11y for automated accessibility testing?
- [ ] test: add lighthouse for automated performance testing?
- [ ] test: Switch one existing e2e test to use Parcel (create-react-app already using webpack) (@arturi)
- [ ] uploaders: consider not showing progress updates from the server after an upload’s been paused. Perhaps the button can be disabled and say `Pausing..` until Companion has actually stopped transmitting updates (@arturi, @ifedapoolarewaju)
- [ ] website: add an example of a mini UI that features drop & progress (may involve a `mini: true` options for dashboard, may involve drop+progress) (@arturi)
- [ ] xhr: allow sending custom headers per file (as proposed in #785)

## 2.0

- [ ] chore: hunt down all `@TODO`s and either fix, or remove, or move to github issues/changelog backlog
- [ ] core: change the preprocessing --> uploading flow to allow for files to start uploading right away after their preprocessing step has finished. See #1738 (@goto-but-stop)
- [ ] core: consider removing Preact from `Plugin` (maybe have a `(ui)Plugin extends BasePlugin`?) as pointed out on Reddit https://www.reddit.com/r/javascript/comments/bhkx5k/uppy_10_your_best_friend_in_file_uploading/
- [ ] core: force the `new` keyword when instantiating Uppy — now we support both `mew Uppy()` and `Uppy()` which is harder to maintain and might lead to confusion
- [ ] core: maybe we remove `file.name` and only keep `file.meta.name`; we can change the file.name here actually because it's just a plain object. we can't change the file.data.name where data is a File instance from an input or something. For XHRUpload, where we put the File instance in a FormData object and it uses the unchangeable .name property.
- [ ] core: pass full file object to `onBeforeFileAdded`. Maybe also check restrictions before calling the callbacks: https://github.com/transloadit/uppy/pull/1594
- [ ] core: remove `debug`, we have `logger` and `logger: Uppy.debugLogger` for that now
- [ ] *: upgrade to Preact X
- [ ] dashboard: hiding pause/resume from the UI by default (with option) would be good too probably (we could auto pause and show a resume button when detecting a network change to a metered network using https://devdocs.io/dom/networkinformation/type)
- [ ] dashboard: showing links to files should be turned off by default (it's great for devs, they can opt-in, but for end-user UI it's weird and can even lead to problems though)
- [ ] docs: Completely drop soft IE10 (and IE11?) support
- [ ] form: make the `multipleResults` option `true` by default
- [ ] locales: Remove the old es_GL name alias for gl_ES. Keep gl_ES only.
- [ ] providers: remove `serverHeaders` https://github.com/transloadit/uppy/pull/1861
- [ ] redux-store: make action signatures flux-standard-action compatible #1642
- [ ] tus: set the `limit` option to a sensible default, like 10
- [ ] website: It would be nice in the long run to have a dynamic package builder here right on the website where you can select the plugins you need/want and it builds and downloads a minified version of them? Sort of like jQuery UI: https://jqueryui.com/download/
- [ ] xhr: change default name depending on wether `bundle` is set `files[]` (`true`) vs `file` (default) (#782)
- [ ] xhr: set the `limit` option to a sensible default, like 10

## 1.14

- [ ] plugins: WordPress Back-end plugin. Should be another Transloadit Integration based on Robodog Dashboard(?) we should add a provider, and possibly offer already-uploaded content
- [ ] webcam: Specify the resolution of the webcam images/video. We should add a way to specify any custom 'constraints' (aspect ratio, resolution, mimetype (`/video/mp4;codec=h264`), bits per second, etc) to the Webcam plugin #876

## 1.13

- [ ] dashboard: add option to use `body` or `window` or CSS selector as drop zone / paste zone as well, `DropPasteTarget` #1593 (@arturi)
- [ ] dashboard/dragndrop/fileinput: Add a `disabled` (`true`||`false`) option (https://github.com/transloadit/uppy/issues/1530)
- [ ] dashboard: Add Done button when upload is successfully finished (https://github.com/transloadit/uppy/issues/1510)
- [ ] dashboard: Add a Load More button so you don't have to TAB endlessly to get to the upload button (https://github.com/transloadit/uppy/issues/1419)
- [ ] provider: Image search (via Google or Bing or DuckDuckGo) (@arturi)
- [ ] core: add AngularJS wrapper component for the Dashboard (@arturi)
- [ ] dashboard: allow selecting folders (add separate hidden input button for folders) #447 #1027 (@arturi)
- [ ] dashboard: Customizable meta editor for the Dashboard. Some people want maps, some to disable autocomplete, some validation. Perhaps via jsx rendering. (See https://github.com/transloadit/uppy/issues/2007#issuecomment-573592859, https://github.com/transloadit/uppy/issues/809#issuecomment-417282743) (#617, #809, #454, @arturi)
- [ ] provider: MediaLibrary provider which shows you files that have already been uploaded #450, #1121, #1112 #362

## 1.12

- [ ] test: add deepFreeze to test that state in not mutated anywhere by accident, use default's store #320
- [ ] provider: add Box (@ife)
- [ ] plugins: audio/memo recording similar to Webcam #143 #198 (@arturi)
- [ ] test: add typescript with JSDoc for @uppy/core https://github.com/Microsoft/TypeScript/wiki/Type-Checking-JavaScript-Files (@arturi)
- [ ] core: add Vue.js wrapper component for the Dashboard (@arturi)
- [ ] goldenretriever: confirmation before restore, add “ghost” files #443 #257 (@arturi) (@arturi)
- [ ] dashboard: fix Dashboard issues with Angular — it’s incredibly slow presumably because of ResizeObserver. (See #1613) (@arturi)
- [ ] dashboard: add VirtualList, so it can render 5000 files without lag (@goto-bus-stop, @lakesare)
- [ ] dashboard: support for right-to-left languages (Arabic, Hebrew) (@arturi)

## 1.11

- [ ] plugins: Transformations, cropping, filters for images, study https://github.com/MattKetmo/darkroomjs/, https://github.com/fengyuanchen/cropperjs #151 #53 (@arturi)
- [ ] google-drive: Google Drive - Google Docs https://github.com/transloadit/uppy/issues/1554#issuecomment-554904049 (@ife)
- [ ] core: add maxTotalFileSize restriction #514 (@arturi)

# next

## 1.10

- [ ] dashboard: Dark Mode & Redesign by Alex & Artur (@arturi)
- [ ] webcam: Pick format based on `restrictions.allowedFileTypes`, eg. use PNG for snapshot instead of JPG if `allowedFileTypes: ['.png']` is set, you can probably ask for the correct filetype. In addition, we should stop recording video once the max allowed file size is exceeded. should be possible given how the MediaRecorder API works (@goto-bus-stop)
- [ ] plugins: review & merge screenshot+screencast support similar to Webcam #148 (@arturi)
- [ ] core: report information about the device --^ (@arturi)
- [ ] providers: Provider Browser don't handle uppy restrictions, can we hide things that don't match the restrictions in Google Drive and Instagram? #1827 (@arturi)
- [ ] providers: Get Facebook integration on its feet (@ife)
- [ ] companion: what happens if access token expires during/between an download & upload (@ife)

## 1.9.2

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
- uppy: Add onedrive to uppy package.json ([349247607513bc6b33bf2a90ab0b82f8f2e81d78](https://github.com/transloadit/uppy/commit/349247607513bc6b33bf2a90ab0b82f8f2e81d78 / @arturi))

## 1.9.1

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

## 1.9.0

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

## 1.8.0

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

## 1.7.0

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

## 1.6.0

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

## 1.5.2

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

## 1.5.0

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

## 1.4

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

## 1.3

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

## 1.2.0

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

## 1.1.0

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

## 1.0.2

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

## 1.0.1

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

## 1.0.0

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

## 0.30.5

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

## 0.30.4

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

## 0.30.3

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

## 0.30.1 - 0.30.2

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

## 0.30.0

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

## 0.29.1

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

## 0.29.0

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

## 0.28.0

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

## 0.27.5

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

## 0.27.4

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

- build: Add initial version table script [skip ci] (@goto-bus-stop)
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

## 0.27.3

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

## 0.27.2

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

## 0.27.1

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

## 0.27.0

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

## 0.26.0

Released: 2018-06-28.

- ⚠️ **breaking** split into many packages (#906 / @goto-bus-stop, @arturi)
- xhr-upload: Add `withCredentials` option (#874 / @tuoxiansp)
- utils: Move single-use utils into their appropriate packages. (#926 / @goto-bus-stop)
- core: Export Plugin class from @uppy/core (#924 / @goto-bus-stop)
- Typescript typings improvements (#923 / @goto-bus-stop)
- core: change focus to solid line for all elements (ade214e5aab822e1fc3ab8e0fac80c4fc04d7bc3 / @arturi)
- dashboard: fix Dashboards tabs overflow by adding scroll; improve scroll (b974244c7f4e01adcf2478b7f651dada63d342f1 / @arturi)

## 0.25.6

Released: 2018-06-25.

- core: ⚠️ **breaking** rename `host` option to `serverUrl` (#905 / @ifedapoolarewaju)
- dashboard: added browser back button listening (#575 / @zcallan)
- core: Split utils into separate files (#899 / @goto-bus-stop)
- providers: Better provider errors (#895 / @arturi)
- instagram: better thumbnail quality for ig (#901, #887 / @ifedapoolarewaju)
- core: add `types` to uppy npm package (#0c2d66e8ac005d6a4200948de1bc3a44057f0393 / @arturi)

## 0.25.5

Released: 2018-06-13.

- build: exclude and ignore `node_modules` from `test/endtoend` (@arturi, @kvz / #a60c2f0c641f7db580937ebbc0884e25c8ef8583, #355f696a74d8ec56381578f1fb5ad9c913fe8200)

## 0.25.4

Released: 2018-06-13.

- providers: hanging URL upload (#8e13f416f74e7a453e7bdc829e9618f3b7d68804 / @ifedapoolarewaju)
- url: fix input focus (#3f9aa3bb7fc7ce5814fe50268a6f88f5965d9f16 / @arturi)

## 0.25.3

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

## 0.25.2

Released: 2018-06-05.

- transloadit: `file.remote` --> `file.remote.host`, since `remote` is an object (aa8247b6e2aeffc5aa237b983d88faae53819133 / @ifedapoolarewaju, @arturi)
- dashboard: Move `poweredByUppy` inside the Dashboard (a5f23c7fd57a0a0a554580b5d5423f54b39c2444 / @arturi)

## 0.25.1

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

## 0.25.0

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

## 0.24.4

Released: 2018-05-14.

- core: Pass `allowedFileTypes` and `maxNumberOfFiles` to input[type=file] in UI components: Dashboard, DragDrop, FileInput (#814 / @arturi)
- transloadit: Update Transloadit plugin's Uppy Server handling (#804 / @goto-bus-stop)
- tus: respect `limit` option for upload parameter requests (#817 / @ap--)
- docs: Explain name `metadata` vs. `$_FILES[]["name"]` (#1c1bf2e / @goto-bus-stop)
- dashboard: improve “powered by” icon (#0284c8e / @arturi)
- statusbar: add default string for cancel button (#822 / @mrbatista)

## 0.24.3

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

## 0.24.2

Released: 2018-04-17.

- dashboard: Fix showLinkToFileUploadResult option (@arturi / #763)
- docs: Consistent shape for the getResponseData (responseText, response) (@arturi / #765)

## 0.24.1

Released: 2018-04-16.

- dashboard: ⚠️ **breaking** `maxWidth`, `maxHeight` --> `width` and `height`; update docs and React props too; regardless of what we call those internally, this makes more sense, I think (@arturi)
- core: Avoid important for those styles that need to be overriden by inline-styles + microtip (@arturi)
- tus & xhrupload: Retain uppy-server error messages, fixes #707 (@goto-bus-stop / #759)
- dragdrop: Link `<label>` and `<input>`, fixes #749 (@goto-bus-stop / #757)

## 0.24.0

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

## 0.23.3

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

## 0.23.2

- core: ⚠️ **breaking** Emit full file object instead of fileID in events like uppy.on('event', file, data) (#647 / @arturi)
- core: Fix merging locale strings in Core (#666 / @goto-bus-stop)
- s3: Check upload parameters shape, fixes #653 (#665 / @goto-bus-stop)
- docs: Add more Core events to docs (@arturi)
- xhrupload: Clear timer when upload is removed in XHRUpload (#647 / @arturi)
- xhrupload: Fix XHRUpload.js error handling (#656 / @rhymes)
- tus: Configure uploadUrl for uppy-server uploads (#643 / @goto-bus-stop)

## 0.23.1

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

## 0.23.0

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

## 0.22.1

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

## 0.22.0

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

## 0.21.1

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

## 0.21.0

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

## 0.20.3

Released: 2017-10-18.

- Start a completely new upload when retrying. (#390 / @goto-bus-stop)
- dashboard: Show errors that occurred during processing on the file items. (#391 / @goto-bus-stop)
- transloadit: Mark files as having errored if their assembly fails. (#392 / @goto-bus-stop)
- core: Clear file upload progress when an upload starts. (#393 / @goto-bus-stop)
- tus: Clean up `tus.Upload` instance and events when an upload starts, finishes, or fails. (#390 / @goto-bus-stop)

## 0.20.2

Released: 2017-10-11.

- docs: fix `getMetaFromForm` documentation (@arturi)
- core: fix generating thumbnails for images with transparent background (#380 / @goto-bus-stop)
- transloadit: use Translator class for localised strings (#383 / @goto-bus-stop)
- goldenretriever: don't crash when required server-side (#384 / @goto-bus-stop)

## 0.20.1

Released: 2017-10-05.

- redux: add plugin for syncing uppy state with a Redux store (#376 / @richardwillars)

## 0.20.0

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

## 0.19.1

Released: 2017-09-20.

- goldenretriever: fix restorefiles with id (#351 / @arturi)
- goldenretriever: Clean up blobs that are not related to a file in state (#349 / @goto-bus-stop)
- core: set the newState before emiting `core:state-update` (#341 / @sunil-shrestha, @arturi)
- docs: Document StatusBar plugin (#350 / @goto-bus-stop)

## 0.19.0

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

## 0.18.1

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

## 0.18.0

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

## 0.17.0

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

## 0.16.2

Released: 2017-05-31.

- core: update prettier-bytes to fix the IE support issue https://github.com/Flet/prettier-bytes/issues/3 (@arturi)
- core: use URL.createObjectURL instead of resizing thumbnails (@arturi, @goto-bus-stop / #199)
- dashboard: Fix ETA when multiple files are being uploaded (@goto-bus-stop, #197)
- transloadit: Fix receiving assembly results that are not related to an input file (@arturi, @goto-bus-stop / #201)
- transloadit: Use the `tus_upload_url` to reliably link assembly results with their input files (@goto-bus-stop / #207)
- transloadit: move user-facing strings into locale option (@goto-bus-stop / https://github.com/transloadit/uppy/commit/87a22e7ee37b6fa3754fa34868516a6700306b60)
- webcam: Mute audio in realtime playback (@goto-bus-stop / #196)

## 0.16.1

Released: 2017-05-13

- temporarily downgrade yo-yoify, until shama/yo-yoify#45 is resolved (@arturi / https://github.com/transloadit/uppy/commit/6292b96)

## 0.16.0

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
- react: [WIP] High-level React Components (@goto-bus-stop / #170)
- core: add `uppy.close()` for tearing down an Uppy instance (@goto-bus-stop / #182)
- core: replace `babel-preset-es2015-loose` by standard es2015 preset with `loose` option (@goto-bus-stop / #174)

## 0.15.0

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

## 0.14.0

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

## 0.13.0

To be released: December 23, 2016.
Theme: The release that wasn't 🎄.

## 0.12.0

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

## 0.11.0

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

## 0.10.0

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
- meta: update readme docs, add unpkg CDN links (https://transloadit.edgly.net/releases/uppy/v0.22.0/dist/uppy.min.css) (@arturi)
- meta: write 0.10 release blog post (@arturi)

## 0.9.0

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

## 0.8.0

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

## 0.7.0

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

## 0.6.4

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

## 0.0.5

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

## 0.0.4

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

## 0.0.3

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

## 0.0.2

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

## 0.0.1

Released: December 20, 2015.

- core: Individual progress (#24)
- core: Setup basic Plugin system (#1, #4, #20)
- core: Setup build System (#30, #13, @hedgerh)
- dragdrop: Add basic DragDrop plugin example (#7)
- dropbox: Add basic Dropbox plugin example (#31)
- website: Add CSS Framework (#14)
- website: Create Hexo site that also contains our playground (#5, #34, #12 #22, #44, #35, #15, #37, #40, #43)
