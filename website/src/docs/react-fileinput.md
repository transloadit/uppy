---
title: "&lt;FileInput />"
type: docs
module: "@uppy/react"
permalink: docs/react/file-input/
alias: docs/react/fileinput/
order: 4
category: "React"
---

The `<FileInput />` component wraps the [`@uppy/file-input`](/docs/file-input/) plugin.

## Installation

Install from NPM:

```shell
npm install @uppy/react
```

```js
import { FileInput } from '@uppy/react'

// Alternatively, you can also use a default import:
// import FileInput from '@uppy/react/lib/FileInput';
```

## CSS

The `FileInput` component includes some basic styles. You can also choose not to use it and provide your own styles instead:

```js
import '@uppy/core/dist/style.css'
import '@uppy/file-input/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Drag & Drop styles from `@uppy/file-input/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

## Props

The `<FileInput />` component supports all [FileInput](/docs/file-input/) options as props. Additionally, an Uppy instance must be provided in the `uppy={}` prop: see [Initializing Uppy](/docs/react/initializing) for details.

```js
import React from 'react'
import { FileInput } from '@uppy/react'

  <FileInput
    // assuming `this.uppy` contains an Uppy instance:
    uppy={this.uppy}
    pretty
    inputName="files[]"
  />
```
