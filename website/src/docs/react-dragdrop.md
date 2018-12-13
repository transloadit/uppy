---
title: "&lt;DragDrop />"
type: docs
permalink: docs/react/drag-drop/
alias: docs/react/dragdrop/
order: 92
---

The `<DragDrop />` component wraps the [`@uppy/drag-drop`][] plugin.

## Installation

Install from NPM:

```shell
npm install @uppy/react
```

```js
import DragDrop from '@uppy/react/lib/DragDrop';
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

The `<DragDrop />` component supports all [DragDrop][] options as props.

```js
<DragDrop
  width="100%"
  height="100%"
  note="Images up to 200×200px"
/>
```

[`@uppy/drag-drop`]: /docs/drag-drop/
