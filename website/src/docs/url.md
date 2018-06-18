---
type: docs
order: 54
title: "Url"
permalink: docs/url/
---

The Url plugin lets users import files from the Internet. Paste any URL and it'll be added!

An Uppy Server instance is required for the Url plugin to work. Uppy Server will download the files and upload them to their destination. This saves bandwidth for the user (especially on mobile connections) and helps avoid CORS restrictions.

```js
const Url = require('@uppy/url')

uppy.use(Url, {
  // Options
})
```

[Try live!](/examples/dashboard/)

## Options

```js
uppy.use(Url, {
  target: Dashboard,
  serverUrl: 'https://server.uppy.io/',
  locale: {}
})
```

### `id: 'Url'`

A unique identifier for this plugin. Defaults to `'Url'`.

### `target: null`

DOM element, CSS selector, or plugin to mount the Url provider into. This should normally be the Dashboard.

### `serverUrl: null`

URL to an Uppy Server instance.

### `locale: {}`

Localize text that is shown to the user.

The default English strings are:

```js
strings: {
  // Label for the "Import" button.
  import: 'Import',
  // Placeholder text for the URL input.
  enterUrlToImport: 'Enter URL to import a file',
  // Error message shown if Uppy Server could not load a URL.
  failedToFetch: 'Uppy Server failed to fetch this URL, please make sure it’s correct',
  // Error message shown if the input does not look like a URL.
  enterCorrectUrl: 'Incorrect URL: Please make sure you are entering a direct link to a file'
}
```

