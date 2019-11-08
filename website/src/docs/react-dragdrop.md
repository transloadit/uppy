---
title: "&lt;DragDrop />"
type: docs
module: "@uppy/react"
permalink: docs/react/drag-drop/
alias: docs/react/dragdrop/
order: 3
category: "React"
---

The `<DragDrop />` component wraps the [`@uppy/drag-drop`](/docs/drag-drop/) plugin.

## Installation

Install from NPM:

```shell
npm install @uppy/react
```

```js
// Either:
import DragDrop from '@uppy/react/lib/DragDrop';
// Or:
import { DragDrop } from '@uppy/react';
```

## CSS

The `DragDrop` component includes some simple styles, like shown in the [example](/examples/dragdrop). You can also choose not to use it and provide your own styles instead:

```js
import '@uppy/core/dist/style.css'
import '@uppy/drag-drop/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Drag & Drop styles from `@uppy/drag-drop/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

## Props

The `<DragDrop />` component supports all [DragDrop](/docs/drag-drop/) options as props.

```js
<DragDrop
  width="100%"
  height="100%"
  note="Images up to 200×200px"
/>
```
