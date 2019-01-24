---
type: docs
order: 10
title: "Transloadit Wrapper"
menu: "Introduction"
module: "@uppy/transloadit-wrapper"
permalink: docs/transloadit-wrapper/
---

[Transloadit][transloadit] is a service that helps you handle file uploads, resize, crop and watermark your images, make GIFs, transcode your videos, extract thumbnails, generate audio waveforms, and so much more. In short, [Transloadit][transloadit] is the Swiss Army Knife for your files.

The Transloadit Wrapper is an Uppy-based library that helps you talk to the Transloadit API. It includes a modal UI file picker with support for imports from third-party services, integration with HTML forms, and more. Because it's based on Uppy, you can add any existing Uppy plugin to add more functionality.

## Install

The Transloadit Wrapper can be downloaded from npm:

```shell
npm install --save @uppy/transloadit-wrapper
```

Then, with a bundler such as [webpack][webpack] or [Browserify][browserify], do:

```js
const transloadit = require('@uppy/transloadit-wrapper')
```

If you are not using a bundler, you can also import the Transloadit Wrapper using an HTML script tag.

```html
<link rel="stylesheet" href="https://transloadit.edgly.net/releases/transloadit-wrapper/v1.0.0/dist/style.min.css">
<script src="https://transloadit.edgly.net/releases/transloadit-wrapper/v1.0.0/dist/transloadit.min.js"></script>
```

## Methods

The Transloadit Wrapper has several methods for different use cases.

If you want to have a modal UI that users can use to select files from their local device or from third party sources like Instagram, use the [File Picker API](#File-Picker). This can be used for one-off uploads _outside_ an HTML form, like profile avatars or images to embed in a blog post.

If you already have an HTML form, you can use the [Form API](#Form) to add Transloadit's encoding capabilities to it. Files will be uploaded to Transloadit, and the form will submit JSON information about the files and encoding results. You can also optionally show upload progress using Uppy's Status Bar UI, or even use the advanced Dashboard UI so users can import files from third party sources as well.

Finally, you can use the [Programmatic Upload API](#Programmatic-Uploads) with your custom UI implementation.

And if any of these methods are not flexible enough, you can always replace them with a custom Uppy setup using the [Transloadit Plugin](/docs/transloadit) instead!

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

<a class="MoreButton" href="/docs/transloadit-wrapper/picker">View Documentation</a>

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

<a class="MoreButton" href="/docs/transloadit-wrapper/form">View Documentation</a>

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

<a class="MoreButton" href="/docs/transloadit-wrapper/upload">View Documentation</a>

[transloadit]: https://transloadit.com/
[browserify]: https://browserify.org
[webpack]: https://webpack.js.org
