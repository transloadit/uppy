---
type: docs
order: 23
title: "ProgressBar"
permalink: docs/progressbar/
---

ProgressBar is a minimalist plugin that shows the current upload progress in a thin bar element, similar to the ones used by YouTube and GitHub when navigating between pages.

[Try it live](/examples/dragdrop/) - The DragDrop example uses ProgressBars to show progress.

## Options

```js
uppy.use(ProgressBar, {
  target: '.UploadForm',
  fixed: false
})
```

### `target: null`

DOM element, CSS selector, or plugin to mount the progress bar into.

### `fixed: false`

When true, show the progress bar at the top of the page with `position: fixed`. When false, show the progress bar inline wherever it is mounted.

```js
uppy.use(ProgressBar, {
  target: 'body',
  fixed: true
})
```
