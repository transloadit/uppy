Our combined changelog and roadmap. It contains todos as well as dones.

Items can be optionally be tagged tagged by GitHub owner issue if discussion
happened / is needed.

Please add your entries in this format:

 - `- [ ] (<plugin name>|website|core|meta|build|test): <Present tense verb> <subject> \(<list of associated owners/gh-issues>\)`.

Following [SemVer spec item 4](http://semver.org/#spec-item-4),
we're `<1.0.0` and allowing ourselves to make breaking changes in minor
and patch levels.

In the current stage we aim to release a new version on the
first Friday of every new month.

## Backlog

Ideas that will be planned and find their way into a release at one point

- [ ] build: browsersync does 3 refreshes, can that be one? should be doable via cooldown/debounce?
- [ ] build: go over `package.json` togeteher and clean up npm run scripts (@arturi, @hedgerh, @kvz)
- [ ] build: investigate Rollup someday, for tree-shaking and smaller dist https://github.com/substack/node-browserify/issues/1379#issuecomment-183383199, https://github.com/nolanlawson/rollupify
- [ ] build: revisit sourcemaps for production. can we have them without a mandatory extra request?
- [ ] core: Decouple rendering from Plugins and try to make Uppy work with React (add basic example) to remain aware of possible issues (@hedgerh), look at https://github.com/akiran/react-slick
- [ ] core: test with real screen reader to identify accessibility problems
- [ ] core: Make sure Uppy works well in VR
- [ ] instagram: Add basic Instagram plugin example (#21)
- [ ] presets: Add basic preset that mimics Transloadit's jQuery plugin (#28)
- [ ] test: checkout http://www.webpagetest.org, use it sometimes to test our website & Uppy?
- [ ] test: setup an HTML page with all sorts of crazy styles, resets & bootstrap to see what brakes Uppy (@arturi)
- [ ] website: Make a gif/video of Uppy Modal or DragDrop demo (drag & drop a few files -> upload happens)

## 0.0.7

Theme: TBD

Scheduled to be released: TBD

## 0.0.6

<a name="next"></a>

Theme: TBD

Scheduled to be released: June 03, 2016

- [ ] build: minification of the bundle (@kvz)
- [ ] build: switch to https://www.npmjs.com/package/npm-run-all instead of parallelshell (@kvz)
- [ ] drive: Make sure uppy-server does not explode on special file types: https://dl.dropboxusercontent.com/s/d4dbxitjt8clo50/2016-05-06%20at%2022.41.png
- [ ] drive: Return `cb` after writing all files https://github.com/transloadit/uppy-server/commit/4f1795bc55869fd098a5c81a80edac504fa7324a#commitcomment-17385433
- [ ] drive: Show a visual indication that downloading has started after double-clicking. Prevent that 6 clicks = 3 downloads
- [x] meta: Create Uppy logos (@markstory)
- [ ] meta: Use <waffle.io> instead of Markdown task tracking. Some discussion [here](https://transloadit.slack.com/archives/general/p1455693654000062) (@kvz)
- [ ] modal: accessibility. focus on the first input field / button in tab panel (@arturi)
- [ ] modal: Maybe we need to have URL parameters carrying state as payload, so after returning from google, we're in the same tab again (@hedgerh)
- [ ] modal: polish on mobile
- [ ] modifier: A plugin to supply meta data (like width, tag, filename, user_id), belonging to the `modify` stage (or a different word we'll come up with) (@arturi)
- [ ] modifier: pass custom metadata with non-tus-upload. Maybe mimic meta behavior of tus here, too http://tus.io/protocols/resumable-upload.html (@arturi)
- [ ] modifier: pass custom metadata with tus-upload with tus-js-client (@arturi)
- [ ] presenter: make it work with new components/state (@arturi)
- [ ] progressdrawer: let user cancel uploads in progress (@arturi)
- [ ] progressdrawer: improve styles, add preview icons for all (@arturi)
- [ ] server: Implement the `SERVER-PLAN.md` so that Google Drive files are actually uploaded to the endpoint
- [ ] test: Get IE4 on windows 3.11 to run Uppy and see it fall back to regular form upload (@arturi)
- [ ] test: Add pass/fail Saucelabs flag to acceptance tests (@arturi)
- [ ] test: Make Edge and Safari work via the tunnel so we can test localhost instead of uppy.io, and test the current build, vs the previous deploy that way
- [ ] website: scrollbars on code samples (can’t reproduce!) (@arturi)
- [ ] website: Polish Saucelabs stats (social badge + stats layout) (@arturi)
- [x] website: Add Saucelabs badges to uppy.io (@kvz)
- [x] website: fix disappearing icons issue, `postcss-inline-svg` (@arturi)

## 0.0.5

Theme: Acceptance tests and Google Drive Polish

Released: May 07, 2016

- [x] test: Wire saucelabs and travis togeteher, make saucelabsl fails fatal to travis builds
- [x] test: Add `addFile`-hack so we can have acceptance tests on Safari as well as Edge (@arturi)
- [x] drive: possible UI polish (@hedgerh)
- [x] drive: write files to filesystem correctly (@hedgerh)
- [x] test: Fix 15s timeout image.jpg (@arturi)
- [x] test: Sign up for Browserstack.com Live account so we can check ourselves what gives and verify saucelabs isn't to blame (@arturi) <-- Turns out, Saucelabs already does that for us
- [x] test: Get tests to pass Latest version of Internet Explorer (Windows 10), Safari (OSX), Firefox (Linux), Opera (Windows 10) (@arturi) <-- IE 10, Chrome, Firefox on Windows and Linux, but not Safari and Microsoft Edge — Selenium issues
- [x] test: Get saucelabs to show what gives (errors, screenshots, anything) (@arturi)
- [x] build: sourcemaps for local development (@arturi) <-- Not adding it in production to save the extra request. For local dev, this was added already via Browserify
- [x] core: Add polyfill for `fetch` (@hedgerh)
- [x] core: Apply plugins when DOM elements aren't static (#25)
- [x] core: figure out the shelf thing https://transloadit.slack.com/archives/uppy/p1460054834000504 https://dl.dropboxusercontent.com/s/ypx6a0a82s65o0z/2016-04-08%20at%2010.38.png (@arturi, @hedgerh)
- [x] core: reduce the monstrous 157.74Kb prebuilt bundle footprint https://dl.dropboxusercontent.com/s/ypx6a0a82s65o0z/2016-04-08%20at%2010.38.png <-- we see no way to optimize at this stage
- [x] drive: add breadcrumb navigation (@hedgerh)
- [x] drive: convert google docs to office format (@hedgerh)
- [x] modal: Avoid duplicating event listeners <-- deprecated by yoyo
- [x] progressbar: make it great again (@arturi)
- [x] progressdrawer: figure out why the whole list is replaced with every update (dom diff problems) (@arturi)
- [x] test: Let Travis use the Remote WebDriver instead of the Firefox WebDriver (https://docs.travis-ci.com/user/gui-and-headless-browsers/#Using-Sauce-Labs), so Saucelabs can run our acceptance tests against a bunch of real browsers. Local acceptance tests keep using Firefox <-- need to add command to Travis (@arturi)
- [x] test: Move failing multipart test back from `v0.0.5` dir, make it pass (@arturi)
- [x] tus: Add support tus 1.0 uploading capabilities (#3) <-- works!
- [x] website: Make cycling through taglines pretty (in terms of code and a nice animation or sth) (@arturi)
- [x] website: Move the activity feed from http://uppy.io/stats to the Uppy homepage (@arturi)
- [x] website: Polish http://uppy.io/stats and undo its CSS crimes (@arturi)

## 0.0.4

Released: April 13, 2016

- [x] server: Upgrade to 0.0.4 (@kvz)
- [x] drive: Add Google Drive plugin unit test (@hedgerh)
- [x] drive: Add a barely working Google Drive example (without Modal, via e.g. `target: "div#on-my-page"`) (@hedgerh)
- [x] drive: Make sure http://server.uppy.io is targeted on uppy.io; and localhost is targeted elsewhere (also see https://github.com/hughsk/envify) (@kvz)
- [x] test: Setup one modal/dragdrop acceptance test (@arturi)
- [x] drive: Make sure http://server.uppy.io is targeted on uppy.io; and localhost is targeted elsewhere (also see https://github.com/hughsk/envify) (@kvz)
- [x] website: Add a http://uppy.io/stats page that inlines disc.html as well as displays the different bundle sizes, and an activity feed (@kvz)
- [x] dragdrop: refactor & improve (@arturi)
- [x] website: fix i18n & DragDrop examples (@arturi)
- [x] website: Provide simple roadmap in examples (#68, @kvz)
- [x] website: Upgrade Hexo (@kvz)
- [x] test: Make failing acceptance tests fatal (@kvz)
- [x] allow for continuous `acquiring`, even after all plugins have “run” (@arturi, @hedgerh)
- [x] build: clean up package.json. We've accumulated duplication and weirdness by hacking just for our current problem without keeping a wider view of what was already there (@arturi)
- [x] build: fix browsersync & browserify double reloading issue (@arturi)
- [x] build: sourcemaps for examples (@arturi)
- [x] complete: `Complete` Plugin of type/stage: `presenter`. "You have successfully uploaded `3 files`". Button: Close modal. (@arturi)
- [x] core: allow for continuous `acquiring`, even after all plugins have “run” (@arturi, @hedgerh)
- [x] core: come up with a draft standard file format for internal file handling (@arturi)
- [x] core: Pluralize collections (locales, just l like plugins) (@kvz)
- [x] core: re-think running architecture: allow for `acquiring` while `uploading` (@arturi)
- [x] core: Rename `progress` to `progressindicator` (@kvz)
- [x] core: Rename `selecter` to `acquirer` (@kvz)
- [x] core: Rename `view` to `orchestrator` (@kvz)
- [x] core: start on component & event-based state management with `yo-yo` (@arturi)
- [x] core: Upgrade from babel5 -> babel6 (@kvz)
- [x] dragdrop: Fix 405 Not Allowed, (error) handling when you press Upload with no files (#60, @arturi, thx @hpvd)
- [x] modal: `UppyModal [type=submit] { display: none }`, use Modal's own Proceed button to progress to next stage (@arturi)
- [x] modal: covert to component & event-based state management (@arturi)
- [x] modal: Make sure modal renders under one dom node — should everything else too? (@arturi, @hedgerh)
- [x] modal: refactor and improve (@arturi)
- [x] progressdrawer: show link to the uploaded file (@arturi)
- [x] progressdrawer: show file type names/icons for non-image files (@arturi)
- [x] progressdrawer: show uploaded files, display uploaded/selected count, disable btn when nothing selected (@arturi)
- [x] progressdrawer: implement basic version, show upload progress for individual files (@arturi)
- [x] progressdrawer: show previews for images (@arturi)
- [x] server: Add a deploy target for uppy-server so we can use it in demos (#39, @kvz)
- [x] test: Add a passing dummy i18n acceptance test, move failing multipart test to `v0.5.0` dir (@kvz)
- [x] test: Add acceptance tests to Travis so they are run on every change (@kvz)
- [x] test: Get Firefox acceptance tests up and running both local and on Travis CI. Currently both failing on `StaleElementReferenceError: Element not found in the cache - perhaps the page has changed since it was looked up` https://travis-ci.org/transloadit/uppy/builds/121175389#L478
- [x] test: Get saucelabs account https://saucelabs.com/beta/signup/OSS/None (@hedgerh)
- [x] test: Install chromedriver ()
- [x] test: Switch to using Firefox for acceptable tests as Travis CI supports that (https://docs.travis-ci.com/user/gui-and-headless-browsers/#Using-xvfb-to-Run-Tests-That-Require-a-GUI) (@kvz)
- [x] test: Write one actual test (e.g. Multipart) (#2, #23, @hedgerh)
- [x] tus: Resolve promise when all uploads are done or failed, not earlier (currently you get to see '1 file uploaded' and can close the modal while the upload is in progress) (@arturi)
- [x] website: Filter taglines (@kvz)
- [x] website: utilize browserify index exposers to rid ourselves of `../../../..` in examples (@kvz)

## 0.0.3

Released: March 01, 2016

- [x] core: push out v0.0.3 (@kvz)
- [x] build: release-(major|minor|patch): git tag && npm publish (@kvz)
- [x] core: Allow users to set DOM elements or other plugins as targets (@arturi)
- [x] core: Create a progressbar/spinner/etc plugin (#18, @arturi)
- [x] core: Decide on how we ship default styles: separate css file, inline (@kvz, @hedgerh, @arturi, @tim-kos)
- [x] core: Decide on single-noun terminology (npm, umd, dist, package, cdn, module -> bundler -> bundle), and call it that through-out (@kvz)
- [x] core: throw an error when one Plugin is `.use`d twice. We don't support that now, and will result in very confusing behavior (@kvz)
- [x] dragdrop: Convert `DragDrop` to adhere to `Dummy`'s format, so it's compatible with the new Modal (@arturi)
- [x] drive: Convert `GoogleDrive` to adhere to `Dummy`'s format, so it's compatible with the new Modal (@hedgerh)
- [x] modal: Add barely working Modal plugin that can be used as a target (#53, #50, @arturi)
- [x] modal: Improve Modal API (@arturi, @kvz)
- [x] modal: Make `ProgressBar` work with the new Modal (@kvz, @arturi)
- [x] modal: Make Modal prettier and accessible using Artur's research (@arturi)
- [x] modal: Make the Modal look like Harry's sketchup (@arturi)
- [x] modal: Rename FakeModal to Modal, deprecating our old one (@kvz)
- [x] modal: use classes instead of IDs and buttons instead of links (@arturi)
- [x] server: `package.json` (@hedgerh)
- [x] test: Fix and enable commented out `use plugins` & other core unit test (@arturi)

## 0.0.2

Released: February 11, 2016

- [x] build: Use parallelshell and tweak browserify to work with templates (@arturi)
- [x] core: Add basic i18n support via `core.translate()` and locale loading (#47, @arturi)
- [x] core: implement a non-blocking `install` method (for Progressbar, for example)  (@arturi, @kvz)
- [x] core: Implement ejs or es6 templating (@arturi, @hedgerh)
- [x] core: Improve on `_i18n` support, add tests (#47, @arturi)
- [x] core: Integrate eslint in our build procedure and make Travis fail on errors found in our examples, Core and Plugins, such as `> 100` char lines (@kvz)
- [x] docs: Fix build-documentation.js crashes, add more docs to Utils and Translator (@arturi, @kvz)
- [x] dragdrop: Use templates, autoProceed setting, show progress (#50, #18, @arturi)
- [x] meta: Implement playground to test things in, templates in this case
- [x] server: Create a (barely) working uppy-server (#39, @hedgerh)
- [x] website: Fix Uppy deploys (postcss-svg problem) (@arturi, @kvz)

## 0.0.1

Released: December 20, 2015

- [x] core: Individual progress (#24)
- [x] core: Setup basic Plugin system (#1, #4, #20)
- [x] core: Setup build System (#30, #13, @hedgerh)
- [x] dragdrop: Add basic DragDrop plugin example (#7)
- [x] dropbox: Add basic Dropbox plugin example (#31)
- [x] website: Add CSS Framework (#14)
- [x] website: Create Hexo site that also contains our playground (#5, #34, #12 #22, #44, #35, #15, #37, #40, #43)

## Component Owners:

Here are the go-to folks for each individual component or area of expertise:

- build (@hedgerh)
- complete (@hedgerh)
- core (@arturi)
- docs (@arturi)
- dragdrop (@arturi)
- dropbox (@hedgerh)
- drive (@hedgerh)
- instagram (@hedgerh)
- meta (@kvz)
- modal (@hedgerh)
- presets (@arturi)
- server (@hedgerh)
- test (@arturi)
- tus (@arturi)
- website (@arturi)
