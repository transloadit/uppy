---
type: docs
order: 4
title: "Transloadit Preset"
module: "@uppy/transloadit-preset"
permalink: docs/transloadit-preset/
---

[Transloadit][transloadit] is a service that helps you handle file uploads, resize, crop and watermark your images, make GIFs, transcode your videos, extract thumbnails, generate audio waveforms, and so much more. In short, [Transloadit][transloadit] is the Swiss Army Knife for your files.

The Transloadit Preset is an Uppy-based library that helps you talk to the Transloadit API. It includes a modal UI file picker with support for imports from third-party services, integration with HTML forms, and more. Because it's based on Uppy, you can add any existing Uppy plugin to add more functionality.

## Install

The Transloadit Preset can be downloaded from npm:

```shell
npm install --save @uppy/transloadit-preset
```

Then, with a bundler such as [webpack][webpack] or [Browserify][browserify], do:

```js
const transloadit = require('@uppy/transloadit-preset')
```

## File Picker

## Form

## Programmatic Uploads

[transloadit]: https://transloadit.com/
[browserify]: https://browserify.org
[webpack]: https://webpack.js.org
