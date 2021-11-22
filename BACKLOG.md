# Backlog

<!--lint disable no-literal-urls no-undefined-references-->

These are ideas that are planned for specific versions or act as a backlog without a clear date.
PRs are welcome! Please do open an issue to discuss first if it's a big feature, priorities may have changed after something was added here.

## `3.0.0`

- [ ] Switch to ES Modules (ESM)
- [ ] @uppy/image-editor: Remove silly hack to work around non-ESM.
- [ ] Consider updating the name of @uppy/aws-s3 and @uppy/aws-s3-multipart to reflect it also supports Google Cloud Storage, Wasabi, and other cloud providers. 
- [ ] Consider fixing all locale files to follow the bcp-47 standard (nl_NL --> nl-NL)

## `4.0.0`

- [ ] core: change the preprocessing --> uploading flow to allow for files to start uploading right away after their preprocessing step has finished. See #1738 (@goto-but-stop)
- [ ] companion: add more reliable tests to catch edge cases in companion. For example testing that oauth works for multiple companion instances that use a master Oauth domain.

## December 2021

## November 2021

To be released: 2021-11-29

- [ ] plugin: audio/memo recording similar to Webcam #143 #198 (@arturi)
- [ ] compressor: move to Uppy repo, add resizing (@arturi)
- [ ] providers: Box on hosted Companion
- [ ] robodog: research simplifing Robodog — yes to easy “few lines of code Dashboard+Providers+(?Transloadit) experience”, but currently it’s hard to choose between modes, decide what you need (@Murderlon)
- [ ] build: add release automations (@aduh95)

## Unplanned

### Core

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
