Our combined changelog and roadmap. It contains todos as well as dones.

Items can be optionally be tagged tagged by GitHub owner issue if discussion
happened / is needed.

Please add your entries in this format:

 - `- [ ] (<plugin name>|website|core|meta|build|test): <Present tense verb> <subject> \(<list of associated owners/gh-issues>\)`.

Following [SemVer spec item 4](http://semver.org/#spec-item-4),
we're `<1.0.0` and allowing ourselves to make breaking changes in minor
and patch levels.

In the current stage we aim to release a new version on the
first Tuesday of every new month.

## Backlog

Ideas that will be planned and find their way into a release at one point

- [ ] build: go through it together again, remove unnecessary commands, simplify (related to “clean up package.json”). Discuss how contributors might use it, add to contributing and/or readme (https://github.com/sapegin/social-likes/blob/next/Contributing.md#building-and-running-tests) (@arturi, @hedgerh, @kvz)
- [ ] build: investigate Rollup someday, for tree-shaking and smaller dist https://github.com/substack/node-browserify/issues/1379#issuecomment-183383199,
try https://github.com/nolanlawson/rollupify
- [ ] build: look into using https://www.npmjs.com/package/npm-run-all instead of parallelshell
- [ ] build: minification of the bundle
- [ ] build: sourcemaps for everything (compiled es6->es5 module as well as bundle) (@arturi)
- [ ] core: Apply plugins when DOM elements aren't static (#25)
- [ ] core: Add polyfill for `fetch`
- [ ] core: consider `virtual-dom` + `main-loop` or `yo-yo` for rendering and state management
- [ ] instagram: Add basic Instagram plugin example (#21)
- [ ] presets: Add basic preset that mimics Transloadit's jQuery plugin (#28)
- [ ] test: setup an HTML page with all sorts of crazy styles, resets & bootstrap to see what brakes Uppy (@arturi)
- [ ] test: checkout http://www.webpagetest.org, use it sometimes to test our website & Uppy?
- [ ] tus: Add support tus 1.0 uploading capabilities (#3)
- [ ] website: Make cycling through taglines pretty (in terms of code and a nice animation or sth)
- [ ] core: Make sure Uppy works well in VR
- [ ] modal: State: which tab is open? get parameters?
- [ ] modal: Avoid duplicating event listeners
- [ ] meta: Create an Uppy logo

## 0.0.5 (May 03, 2016)

- [ ] meta: Consider using <waffle.io> instead of Markdown task tracking. Some discussion [here](https://transloadit.slack.com/archives/general/p1455693654000062) (@hedgerh, @arturi, @tim-kos, @kvz)
- [ ] modal: polish on mobile
- [ ] core: Try to make Uppy work with React (add basic example) to remain aware of possible issues (@hedgerh), look at https://github.com/akiran/react-slick

## 0.0.4 (April 05, 2016)

- [ ] core: component & event-based state management with `yo-yo` (@arturi, @hedgerh)
- [ ] core: re-think running architecture: allow for `acquiring` while `uploading`,
allow for continuous `acquiring`, even after all plugins have “run” (@arturi, @hedgerh)
- [ ] core: come up with standard file format for uploading (@arturi, @hedgerh)
- [x] build: sourcemaps for examples (@arturi)
- [ ] build: try adding rollupify transform to “tree-shake” bundles
- [x] build: fix browsersync & browserify double reloading issue (@arturi)
- [ ] core: clean up package.json. We've accumulated duplication and weirdness by hacking just for our current problem without keeping a wider view of what was already there (@arturi)
- [x] dragdrop: Fix 405 Not Allowed, (error) handling when you press Upload with no files (#60, @arturi, thx @hpvd)
- [ ] google: Add basic Google Drive plugin example (working both in Modal, as without, via `target: "div#on-my-page"` (@hedgerh)
- [ ] server: Add a deploy target for uppy-server so we can use it in demos (#39, @kvz)
- [ ] test: Fix and enable Saucelabs acceptance test. Write one actual test (e.g. Multipart). Enable it in `npm run test` so it's ran on Travis automatically (#2, #23, @hedgerh)
- [ ] test: Get saucelabs account https://saucelabs.com/beta/signup/OSS/None (@hedgerh)
- [x] tus: Resolve promise when all uploads are done or failed, not earlier (currently you get to see '1 file uploaded' and can close the modal while the upload is in progress) (@arturi)
- [ ] website: Polish taglines (@arturi)
- [ ] website: scrollbars on code samples [can’t reproduce] (@arturi)
- [x] website: Filter taglines (@kvz)
- [x] core: Rename `view` to `orchestrator` (@kvz)
- [x] core: Rename `progress` to `progressindicator` (@kvz)
- [x] website: utilize browserify index exposers to rid ourselves of `../../../..` in examples (@kvz)
- [x] core: Pluralize collections (locales, just l like plugins) (@kvz)
- [x] core: Rename `selecter` to `acquirer` (@kvz)
- [x] complete: `Complete` Plugin of type/stage: `presenter`. "You have successfully uploaded `3 files`". Button: Close modal. (@arturi)
- [ ] modal: show selected files, show uploaded files preview in presenter (@arturi)
- [ ] modal: `focus` on the first input field / button in tab panel (@arturi)
- [x] modal: refactor and improve (@arturi)
- [x] modal: `UppyModal [type=submit] { display: none }`, use Modal's own Proceed button to progress to next stage (@arturi)
- [x] modal: Make sure modal renders under one dom node (@arturi, @hedgerh) — modal does, should everything else too?

## 0.0.3 (March 01, 2016)

- [x] core: push out v0.0.3 (@kvz)
- [x] build: release-(major|minor|patch): git tag && npm publish (@kvz)
- [x] core: Allow users to set DOM elements or other plugins as targets (@arturi)
- [x] core: Create a progressbar/spinner/etc plugin (#18, @arturi)
- [x] core: Decide on how we ship default styles: separate css file, inline (@kvz, @hedgerh, @arturi, @tim-kos)
- [x] core: Decide on single-noun terminology (npm, umd, dist, package, cdn, module -> bundler -> bundle), and call it that through-out (@kvz)
- [x] core: throw an error when one Plugin is `.use`d twice. We don't support that now, and will result in very confusing behavior (@kvz)
- [x] dragdrop: Convert `DragDrop` to adhere to `Dummy`'s format, so it's compatible with the new Modal (@arturi)
- [x] google: Convert `GoogleDrive` to adhere to `Dummy`'s format, so it's compatible with the new Modal (@hedgerh)
- [x] modal: Add barely working Modal plugin that can be used as a target (#53, #50, @arturi)
- [x] modal: Improve Modal API (@arturi, @kvz)
- [x] modal: Make `ProgressBar` work with the new Modal (@kvz, @arturi)
- [x] modal: Make Modal prettier and accessible using Artur's research (@arturi)
- [x] modal: Make the Modal look like Harry's sketchup (@arturi)
- [x] modal: Rename FakeModal to Modal, deprecating our old one (@kvz)
- [x] modal: use classes instead of IDs and buttons instead of links (@arturi)
- [x] server: `package.json` (@hedgerh)
- [x] test: Fix and enable commented out `use plugins` & other core unit test (@arturi)

## 0.0.2 (February 11, 2016)

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

## 0.0.1 (December 20, 2015)

- [x] core: Individual progress (#24)
- [x] core: Setup basic Plugin system (#1, #4, #20)
- [x] core: Setup build System (#30, #13, @hedgerh)
- [x] dragdrop: Add basic DragDrop plugin example (#7)
- [x] dropbox: Add basic Dropbox plugin example (#31)
- [x] website: Add CSS Framework (#14)
- [x] website: Create Hexo site that also contains our playground (#5, #34, #12 #22, #44, #35, #15, #37, #40, #43)


## Component Owners:

Here are the go-to folks for each individual component or area of expertise:

- build ()
- complete ()
- core ()
- docs (@arturi)
- dragdrop (@arturi)
- dropbox (@hedgerh)
- google (@hedgerh)
- instagram (@hedgerh)
- meta (@kvz)
- modal ()
- presets ()
- server (@hedgerh)
- test (@arturi)
- tus ()
- website (@arturi)
