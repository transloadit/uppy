---
type: docs
order: 0
title: "Robodog"
menu: "Robodog Introduction"
module: "@uppy/robodog"
permalink: docs/robodog/
category: "File Processing"
tagline: "user friendly abstraction to do file processing with Transloadit"
---

[Transloadit][transloadit] is a service that helps you handle file uploads, resize, crop and watermark your images, make GIFs, transcode your videos, extract thumbnails, generate audio waveforms, and so much more. In short, [Transloadit][transloadit] is the Swiss Army Knife for your files.

Robodog is an Uppy-based library that helps you talk to the Transloadit API. It includes a modal UI file picker with support for imports from third-party services, integration with HTML forms, and more. Because it's based on Uppy, you can add any existing Uppy plugin to add more functionality.

## Install

Robodog can be downloaded from npm:

```shell
npm install --save @uppy/robodog
```

Then, with a bundler such as [webpack][webpack] or [Browserify][browserify], do:

```js
const robodog = require('@uppy/robodog')
require('@uppy/robodog/dist/robodog.css')
```

If you are not using a bundler, you can also import Robodog using an HTML script tag.

```html
<link rel="stylesheet" href="https://transloadit.edgly.net/releases/uppy/robodog/v1.5.2/robodog.min.css">
<script src="https://transloadit.edgly.net/releases/uppy/robodog/v1.5.2/robodog.min.js"></script>
<!-- you can now use: window.Robodog.pick() -->
```

## Methods

Robodog has several methods for different use cases.

If you want to have a modal UI that users can use to select files from their local device or from third party sources like Instagram, use the [File Picker API](#File-Picker). This can be used for one-off uploads _outside_ an HTML form, like profile avatars or images to embed in a blog post.

If you already have an HTML form, you can use the [Form API](#Form) to add Transloadit's encoding capabilities to it. Files will be uploaded to Transloadit, and the form will submit JSON information about the files and encoding results. You can also optionally show upload progress using Uppy's Status Bar UI, or even use the advanced Dashboard UI so users can import files from third party sources as well.

Finally, you can use the [Programmatic Upload API](#Programmatic-Uploads) with your custom UI implementation.

And if any of these methods are not flexible enough, you can always replace them with a custom Uppy setup using the [Transloadit Plugin](/docs/transloadit) instead!

## File Picker

Show a modal UI that allows users to pick files from their device and from the web. It uploads files to Transloadit for processing.

```js
const resultPromise = Robodog.pick({
  target: 'body',
  params: {
    auth: { key: '' },
    template_id: ''
  }
})
resultPromise.then((bundle) => {
  bundle.transloadit // Array of Assembly statuses
  bundle.results // Array of all Assembly results
})
```

<img src="/images/temp-robodog-demo.gif" alt="Robodog File Picker Demo GIF">

<a class="MoreButton" href="/docs/robodog/picker">View Documentation</a>

## Form

Add resumable uploads and Transloadit's processing to your existing HTML upload forms. Selected files will be uploaded to Transloadit, and the Assembly information will be submitted to your form endpoint.

```html
<form id="upload-form" method="POST" action="/upload">
  <input type="file" multiple>
  <!-- Will be inserted by `Robodog.form()`: -->
  <!-- <input type="hidden" name="transloadit" value="{...json...}"> -->
  <button type="submit">Upload</button>
</form>
<script>
Robodog.form('form#upload-form', {
  params: {
    auth: { key: '' },
    template_id: ''
  }
})
</script>
```

<a class="MoreButton" href="/docs/robodog/form">View Documentation</a>

## Programmatic Uploads

Upload files straight to Transloadit from your own custom UI. Give us an array of files, and we'll give you an array of results!

```js
const resultPromise = Robodog.upload(files, {
  params: {
    auth: { key: '' },
    template_id: ''
  }
})
resultPromise.then((bundle) => {
  bundle.transloadit // Array of Assembly statuses
  bundle.results // Array of all Assembly results
})
```

<a class="MoreButton" href="/docs/robodog/upload">View Documentation</a>

[transloadit]: https://transloadit.com/
[browserify]: https://browserify.org
[webpack]: https://webpack.js.org
