---
type: docs
order: 8
title: "StatusBar"
permalink: docs/statusbar/
---

The StatusBar shows upload progress and speed, ETAs, pre- and post-processing information, and allows users to control (pause/resume/cancel) the upload.
Best used together with a simple file source plugin, such as [FileInput][] or [DragDrop][], or a custom implementation.

[Try it live](/examples/statusbar/)

## Options

### `target: null`

DOM element, CSS selector, or plugin to mount the StatusBar into.

[FileInput]: https://github.com/transloadit/uppy/blob/master/src/plugins/FileInput.js
[DragDrop]: /docs/dragdrop
