---
type: docs
order: 61
title: "Progress Bar"
module: "@uppy/progress-bar"
permalink: docs/progress-bar/
alias: docs/progressbar/
---

`@uppy/progress-bar` is a minimalist plugin that shows the current upload progress in a thin bar element, similar to the ones used by YouTube and GitHub when navigating between pages.

```js
const ProgressBar = require('@uppy/progress-bar')

uppy.use(ProgressBar, {
  // Options
})
```

<a class="TryButton" href="/examples/dragdrop/">Try it live</a>

The `@uppy/drag-drop` example uses a Progress Bar to show progress.

## Installation

This plugin is published as the `@uppy/progress-bar` package.

Install from NPM:

```shell
npm install @uppy/progress-bar
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const ProgressBar = Uppy.ProgressBar
```

## Options

The `@uppy/progress-bar` plugin has the following configurable options:

```js
uppy.use(ProgressBar, {
  target: '.UploadForm',
  fixed: false,
  hideAfterFinish: true
})
```

### `id: 'ProgressBar'`

A unique identifier for this Progress Bar. It defaults to `'ProgressBar'`. Use this if you need to add multiple ProgressBar instances.

### `target: null`

DOM element, CSS selector, or plugin to mount the progress bar into.

### `fixed: false`

When set to true, show the progress bar at the top of the page with `position: fixed`. When set to false, show the progress bar inline wherever it is mounted.

```js
uppy.use(ProgressBar, {
  target: 'body',
  fixed: true
})
```

### `hideAfterFinish: true`

When set to true, hides the progress bar after the upload has finished. If set to false, it remains visible.

### `replaceTargetContent: false`

Remove all children of the `target` element before mounting the Progress Bar. By default, Uppy will append any UI to the `target` DOM element. This is the least dangerous option. However, you may have some fallback HTML inside the `target` element in case JavaScript or Uppy is not available. In that case, you can set `replaceTargetContent: true` to clear the `target` before appending.
