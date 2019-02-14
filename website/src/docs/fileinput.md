---
type: docs
order: 32
title: "File Input"
module: "@uppy/file-input"
permalink: docs/file-input/
alias: docs/fileinput/

---

`@uppy/file-input` is the most barebones UI for selecting files — it shows a single button that, when clicked, opens up the browser's file selector.

```js
const FileInput = require('@uppy/file-input')

uppy.use(FileInput, {
  // Options
})
```

<a class="TryButton" href="/examples/xhrupload/">Try it live</a>

The `@uppy/xhr-upload` example uses `@uppy/file-input` with the [`pretty`](#pretty-true) option enabled.

## Installation

This plugin is published as the `@uppy/file-input` package.

Install from NPM:

```shell
npm install @uppy/file-input
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const FileInput = Uppy.FileInput
```

## CSS

The `@uppy/file-input` plugin includes some simple styles for use with the [`pretty`](#pretty-true) option, like shown in the [example](/examples/xhrupload). You can also choose not to use it and provide your own styles instead.

```js
import '@uppy/core/dist/style.css'
import '@uppy/file-input/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the File Input styles from `@uppy/file-input/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

## Options

The `@uppy/file-input` plugin has the following configurable options:

```js
uppy.use(FileInput, {
  target: null,
  pretty: true,
  inputName: 'files[]',
  locale: {
  }
})
```

> Note that certain [restrictions set in Uppy’s main options](/docs/uppy#restrictions), namely `maxNumberOfFiles` and `allowedFileTypes`, affect the system file picker dialog. If `maxNumberOfFiles: 1`, users will only be able to select one file, and `allowedFileTypes: ['video/*', '.gif']` means only videos or gifs (files with `.gif` extension) will be selectable.

### `id: 'FileInput'`

A unique identifier for this plugin. It defaults to `'FileInput'`. Use this if you need to add multiple FileInput instances.

### `target: null`

DOM element, CSS selector, or plugin to mount the file input into.

### `pretty: true`

When true, display a styled button (see [example](/examples/xhrupload)) that, when clicked, opens the file selector UI. When false, a plain old browser `<input type="file">` element is shown.

### `inputName: 'files[]'`

The `name` attribute for the `<input type="file">` element.

### `locale: {}`

When `pretty` is set, specify a custom label for the button.

```js
strings: {
  chooseFiles: 'Choose files'
}
```
