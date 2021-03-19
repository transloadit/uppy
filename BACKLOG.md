# Backlog

<!--lint disable no-literal-urls-->

This is our roadmap which contains a list of todos.

These are ideas that are planned and find their way into a release at one point.
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
- [ ] xhr: allow sending custom headers per file (as proposed in #785)
- [ ] dashboard: focus jumps weirdly if you remove a file https://github.com/transloadit/uppy/pull/2161#issuecomment-613565486
- [ ] plugins: a WakeLock based plugin that keeps your phone from going to sleep while an upload is ongoing https://github.com/transloadit/uppy/issues/1725
- [ ] provider: Image search (via Google or Bing or DuckDuckGo): use duckduckgo-images-api or Google Search API (@arturi)
- [ ] provider: Google Photos (#2163)

### 2.0

- [ ] chore: hunt down all `@TODO`s and either fix, or remove, or move to github issues/changelog backlog
- [ ] core: change the preprocessing --> uploading flow to allow for files to start uploading right away after their preprocessing step has finished. See #1738 (@goto-but-stop)
- [ ] core: consider removing Preact from `Plugin` (maybe have a `(ui)Plugin extends BasePlugin`?) as pointed out on Reddit https://www.reddit.com/r/javascript/comments/bhkx5k/uppy_10_your_best_friend_in_file_uploading/
- [ ] core: force the `new` keyword when instantiating Uppy — now we support both `mew Uppy()` and `Uppy()` which is harder to maintain and might lead to confusion
- [ ] core: maybe we remove `file.name` and only keep `file.meta.name`; we can change the file.name here actually because it's just a plain object. we can't change the file.data.name where data is a File instance from an input or something. For XHRUpload, where we put the File instance in a FormData object and it uses the unchangeable .name property.
- [ ] core: pass full file object to `onBeforeFileAdded`. Maybe also check restrictions before calling the callbacks: https://github.com/transloadit/uppy/pull/1594
- [ ] core: remove `debug`, we have `logger` and `logger: Uppy.debugLogger` for that now
- [ ] core/dashboard: replace `poweredBy` and `exceedsSize` locale keys by word order aware versions, see PR #2077
- [ ] *: upgrade to Preact X
- [ ] dashboard: hiding pause/resume from the UI by default (with option) would be good too probably (we could auto pause and show a resume button when detecting a network change to a metered network using https://devdocs.io/dom/networkinformation/type)
- [ ] dashboard: showing links to files should be turned off by default (it's great for devs, they can opt-in, but for end-user UI it's weird and can even lead to problems)
- [ ] dashboard: set default `trigger: null`, see https://github.com/transloadit/uppy/pull/2144#issuecomment-600581690
- [ ] docs: Completely drop soft IE10 (and IE11?) support
- [ ] form: make the `multipleResults` option `true` by default
- [ ] locales: Remove the old es_GL name alias for gl_ES. Keep gl_ES only.
- [ ] providers: remove `serverHeaders` https://github.com/transloadit/uppy/pull/1861
- [ ] redux-store: make action signatures flux-standard-action compatible #1642
- [ ] tus: set the `limit` option to a sensible default, like 10
- [ ] website: It would be nice in the long run to have a dynamic package builder here right on the website where you can select the plugins you need/want and it builds and downloads a minified version of them? Sort of like jQuery UI: https://jqueryui.com/download/
- [ ] xhr: change default name depending on wether `bundle` is set `files[]` (`true`) vs `file` (default) (#782)
- [ ] xhr: set the `limit` option to a sensible default, like 10
- [ ] companion: add more reliable tests to catch edge cases in companion. For example testing that oauth works for multiple companion instances that use a master Oauth domain.
- [ ] transloadit: remove `UPPY_SERVER` constant
- [ ] providers: allow changing provider name title through locale? https://github.com/transloadit/uppy/issues/2279
- [ ] tus: remove `autoRetry` option (throw error at runtime if it is explicitly given)

## 1.x

- [ ] dashboard: a mini UI that features drop & progress (may involve a `mini: true` options for dashboard, may involve drop+progress or new plugin) (@arturi)
- [ ] dashboard: Add a Load More button so you don't have to TAB endlessly to get to the upload button (https://github.com/transloadit/uppy/issues/1419)
- [ ] dashboard: add option to use `body` or `window` or CSS selector as drop zone / paste zone as well, `DropPasteTarget` #1593 (@arturi)
- [ ] plugin: WordPress Back-end plugin. Should be another Transloadit Integration based on Robodog Dashboard(?) we should add a provider, and possibly offer already-uploaded content
- [ ] provider: Giphy image search (on top of Unsplash plugin) ()
- [ ] test: add typescript with JSDoc for @uppy/core https://github.com/Microsoft/TypeScript/wiki/Type-Checking-JavaScript-Files (@arturi)
- [ ] webcam: Specify the resolution of the webcam images/video. We should add a way to specify any custom 'constraints' (aspect ratio, resolution, mimetype (`/video/mp4;codec=h264`), bits per second, etc) to the Webcam plugin #876
- [ ] provider: MediaLibrary provider which shows you files that have already been uploaded #450, #1121, #1112 #362
