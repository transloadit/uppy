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

If you are not using a bundler, you can also import the Transloadit Preset using an HTML script tag.

```html
<link rel="stylesheet" href="https://transloadit.edgly.net/TODO_INSERT_URL.css">
<script src="https://transloadit.edgly.net/TODO_INSERT_URL.js"></script>
```

## File Picker

Show a modal UI that allows users to pick files from their device and from the web. It uploads files to Transloadit for processing.

```js
const resultPromise = transloadit.pick('body', {
  params: {
    auth: { key: '' },
    template_id: ''
  }
})
```

**ADD IMAGE OR GIF HERE**

<a class="MoreButton" href="/docs/transloadit-preset/picker">View Documentation</a>

## Form

Add resumable uploads and Transloadit's processing to your existing HTML upload forms. Selected files will be uploaded to Transloadit, and the Assembly information will be submitted to your form endpoint.

```html
<form id="myForm" method="POST" action="/upload">
  <input type="file" multiple>
  <!-- Will be inserted by `transloadit.form()`: -->
  <!-- <input type="hidden" name="transloadit" value="{...json...}"> -->
  <button type="submit">Upload</button>
</form>
<script>
transloadit.form('form#myForm', {
  params: {
    auth: { key: '' },
    template_id: ''
  }
})
</script>
```

<a class="MoreButton" href="/docs/transloadit-preset/form">View Documentation</a>

## Programmatic Uploads

Upload files straight to Transloadit from your own custom UI. Give us an array of files, and we'll give you an array of results!

```js
const resultPromise = transloadit.upload(files, {
  params: {
    auth: { key: '' },
    template_id: ''
  }
})
```

<a class="MoreButton" href="/docs/transloadit-preset/upload">View Documentation</a>

[transloadit]: https://transloadit.com/
[browserify]: https://browserify.org
[webpack]: https://webpack.js.org
