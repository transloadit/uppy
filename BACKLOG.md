# Backlog

<!--lint disable no-literal-urls no-undefined-references-->

These are ideas that are planned for specific versions or act as a backlog without a clear date.
PRs are welcome! Please do open an issue to discuss first if it's a big feature, priorities may have changed after something was added here.

## `2.0.0`

- [x] Drop IE10 (officially), drop IE11 polyfills? (@aduh95)
- [x] *: upgrade to Preact X (@murderlon)
- [x] chore: hunt down most `@TODO`s and either fix, or remove, or move to github issues/changelog backlog (@murderlon)
- [x] core: consider removing Preact from `Plugin` (maybe have a `(ui)Plugin extends BasePlugin`?) as pointed out on Reddit https://www.reddit.com/r/javascript/comments/bhkx5k/uppy_10_your_best_friend_in_file_uploading/ (@murderlon)
- [x] core: force the `new` keyword when instantiating Uppy — now we support both `new Uppy()` and `Uppy()` which is harder to maintain and might lead to confusion (@arturi)
- [ ] core: maybe we remove `file.name` and only keep `file.meta.name`; we can change the file.name here actually because it's just a plain object. we can't change the file.data.name where data is a File instance from an input or something. For XHRUpload, where we put the File instance in a FormData object and it uses the unchangeable .name property (@arturi)
- [x] core: pass full file object to `onBeforeFileAdded`. Maybe also check restrictions before calling the callbacks: https://github.com/transloadit/uppy/pull/1594 (@arturi)
- [x] core/dashboard: replace `poweredBy` and `exceedsSize` locale keys by word order aware versions, see PR #2077 (@goto-bus-stop)
- [x] dashboard: set default `trigger: null`, see https://github.com/transloadit/uppy/pull/2144#issuecomment-600581690 (@arturi)
- [x] form: make the `multipleResults` option `true` by default (@arturi)
- [x] locales: Remove the old es_GL name alias for gl_ES. Keep gl_ES only (@arturi)
- [x] providers: remove `serverHeaders` https://github.com/transloadit/uppy/pull/1861 (@mifi)
- [x] transloadit: remove `UPPY_SERVER` constant (@mifi)
- [x] tus: set the `limit` option to a sensible default, like 5 (10?) (@arturi)
- [x] xhr: set the `limit` option to a sensible default, like 5 (10?) (@arturi)
- [x] xhr: change default name depending on whether `bundle` is set `files[]` (`true`) vs `file` (default) (#782) (@aduh95)
- [x] providers: allow changing provider name title through locale https://github.com/transloadit/uppy/issues/2279 (@goto-bus-stop)
- [x] tus: remove `autoRetry` option (throw error at runtime if it is explicitly given) (@aduh95)
- [x] dashboard: showing links to files should be turned off by default (it's great for devs, they can opt-in, but for end-user UI it's weird and can even lead to problems) (@arturi)

## `3.0.0`

- [ ] Switch to ES Modules (ESM)
- [ ] @uppy/image-editor: Remove silly hack to work around non-ESM.

## `4.0.0`

- [ ] core: change the preprocessing --> uploading flow to allow for files to start uploading right away after their preprocessing step has finished. See #1738 (@goto-but-stop)
- [ ] companion: add more reliable tests to catch edge cases in companion. For example testing that oauth works for multiple companion instances that use a master Oauth domain.

## Unplanned

### Core

- [ ] Add an option to force metafield data when uploading a file. Mark files with restriction errors in the UI. Having an icon showing close to the file to inform if it passed any rule would provide an awesome user experience. The user would be able to edit the file name or any meta tags necessary to pass validation via uppy dashboard, and anytime the user updates the file info, the validation runs again and the icon is updated. #1703
- [ ] Make sure Uppy works well in VR
- [ ] normalize file names when uploading from iOS? Can we do it with meta data? date? `image-${index}`? #678

### Dashboard

- [ ] Allow minimizing the Dashboard during upload (Uppy then becomes just a tiny progress indicator) (@arturi)
- [ ] Display data like image resolution on file cards. should be done by thumbnail generator maybe #783
- [ ] Possibility to edit/delete more than one file at once. example: add copyrigh info to 1000 files #118, #97
- [ ] Possibility to work on already uploaded / in progress files. We'll just provide the `fileId` to the `file-edit-complete` event so that folks can more easily roll out custom code for this themselves #112, #113, #2063
- [ ] Focus jumps weirdly if you remove a file https://github.com/transloadit/uppy/pull/2161#issuecomment-613565486
- [ ] A mini UI that features drop & progress (may involve a `mini: true` options for dashboard, may involve drop+progress or new plugin) (@arturi)
- [ ] Add a Load More button so you don't have to TAB endlessly to get to the upload button (https://github.com/transloadit/uppy/issues/1419)

### New plugins

- [ ] WordPress Back-end plugin. Should be another Transloadit Integration based on Robodog Dashboard(?) we should add a provider, and possibly offer already-uploaded content
- [ ] WordPress Front-end Gravity Forms Uppy plugin so one form field could be an Uppy-powered file input
- [ ] A WakeLock based plugin that keeps your phone from going to sleep while an upload is ongoing https://github.com/transloadit/uppy/issues/1725
- [ ] plugin: audio/memo recording similar to Webcam #143 #198 (@arturi)
- [ ] compressor: add to Uppy repo, add resizing (@arturi)

### New providers

- [ ] Google Photos (#2163)
- [ ] MediaLibrary provider which shows you files that have already been uploaded #450, #1121, #1112 #362
- [ ] Giphy image search (on top of Unsplash plugin) ()
- [ ] Image search (via Google or Bing or DuckDuckGo): use duckduckgo-images-api or Google Search API (@arturi)
- [ ] Vimeo #2872
- [ ] unsplash: Unsplash re-design (#2635 / @arturi, @nqst)
- [ ] box: add to https://uppy.io/examples/dashboard/ (@mifi)

### Miscellaneous

- [ ] goldenretriever: make it work with aws multipart https://community.transloadit.com/t/resumable-aws-s3-multipart-integration/14888 (@goto-bus-stop)
- [ ] provider: add sorting (by date) #254
- [ ] qa: add one integration test (or add to existing test) that uses more exotic (tus) options such as `useFastRemoteRetry` or `removeFingerprintOnSuccess` https://github.com/transloadit/uppy/issues/1327 (@arturi, @ifedapoolarewaju)
- [ ] react: Add a React Hook to manage an Uppy instance https://github.com/transloadit/uppy/pull/1247#issuecomment-458063951 (@goto-bus-stop)
- [ ] rn: Uppy React Native works with Expo, now let's make it work without
- [ ] rn: Uppy React Native works with Url Plugin, now let's make it work with Instagram
- [ ] security: consider iframe / more security for Transloadit/Uppy integration widget and Uppy itself. Page can’t get files from Google Drive if its an iframe
- [ ] statusbar: Add a confirmation of the cancel action (https://github.com/transloadit/uppy/issues/1418) as well as ask the user if they really want to navigate away while an upload is in progress via `onbeforeunload` (@arturi)
- [ ] uploaders: consider not showing progress updates from the server after an upload’s been paused. Perhaps the button can be disabled and say `Pausing..` until Companion has actually stopped transmitting updates (@arturi, @ifedapoolarewaju)
- [ ] xhr: allow sending custom headers per file (as proposed in #785)
- [ ] website: It would be nice in the long run to have a dynamic package builder here right on the website where you can select the plugins you need/want and it builds and downloads a minified version of them? Sort of like jQuery UI: https://jqueryui.com/download/
- [ ] webcam: Specify the resolution of the webcam images/video. We should add a way to specify any custom 'constraints' (aspect ratio, resolution, mimetype (`/video/mp4;codec=h264`), bits per second, etc) to the Webcam plugin #876
- [ ] robodog: finishing touches on Companion dynamic Oauth #2802 (@goto-bus-stop)

### Needs research

- [ ] Add a prepublish test that checks if `npm pack` is not massive (@goto-bus-stop)
- [ ] Add https://github.com/pa11y/pa11y for automated accessibility testing?
- [ ] Add lighthouse for automated performance testing?
- [ ] Switch one existing e2e test to use Parcel (create-react-app already using webpack) (@arturi)
- [ ] Add typescript with JSDoc for @uppy/core https://github.com/Microsoft/TypeScript/wiki/Type-Checking-JavaScript-Files (@arturi)
