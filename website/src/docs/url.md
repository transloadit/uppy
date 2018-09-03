---
type: docs
order: 34
title: "Import From URL"
module: "@uppy/url"
permalink: docs/url/
---

The `@uppy/url` plugin allows users to import files from the internet. Paste any URL and it will be added!

An Companion instance is required for the `@uppy/url` plugin to work. Companion will download the files and upload them to their destination. This saves bandwidth for the user (especially on mobile connections) and helps to avoid CORS restrictions.

```js
const Url = require('@uppy/url')

uppy.use(Url, {
  // Options
})
```

[Try live!](/examples/dashboard/)

## Installation

This plugin is published as the `@uppy/url` package.

Install from NPM:

```shell
npm install @uppy/url
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const Url = Uppy.Url
```

## Options

The `@uppy/url` plugin has the following configurable options:

```js
uppy.use(Url, {
  target: Dashboard,
  serverUrl: 'https://companion.uppy.io/',
  locale: {}
})
```

### `id: 'Url'`

A unique identifier for this plugin. It defaults to `'Url'`.

### `title: 'Link'`

Configures the title / name shown in the UI, for instance, on Dashboard tabs. It defaults to `'Link'`.

### `target: null`

DOM element, CSS selector, or plugin to mount the URL provider into. This should normally be the Dashboard.

### `serverUrl: null`

URL to an Companion instance.

### `locale: {}`

Localize text that is shown to the user.

The default English strings are:

```js
strings: {
  // Label for the "Import" button.
  import: 'Import',
  // Placeholder text for the URL input.
  enterUrlToImport: 'Enter URL to import a file',
  // Error message shown if Companion could not load a URL.
  failedToFetch: 'Companion failed to fetch this URL, please make sure it’s correct',
  // Error message shown if the input does not look like a URL.
  enterCorrectUrl: 'Incorrect URL: Please make sure you are entering a direct link to a file'
}
```

