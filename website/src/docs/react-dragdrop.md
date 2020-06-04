---
title: "&lt;DragDrop />"
type: docs
module: "@uppy/react"
permalink: docs/react/drag-drop/
alias: docs/react/dragdrop/
order: 2
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

## Initializing Uppy

Your Uppy instance must be initialized before passing it to an `uppy={}` prop, and should be cleaned up using `uppy.close()` when you are done with it. A simple approach is to initialize it in your React component's `constructor()` and destroy it in `componentWillUnmount()`.

> ⚠ Uppy instances are stateful, so the same instance must be used across different renders.
> Do **NOT** initialize Uppy in a `render()` method!
> Do **NOT** initialize Uppy in a function component!

```js
class MyComponent extends React.Component {
  constructor (props) {
    super(props)
    this.uppy = Uppy()
      .use(Transloadit, {})
  }

  componentWillUnmount () {
    this.uppy.close()
  }

  render () {
    return <DragDrop uppy={this.uppy} />
  }
}
```

## Props

The `<DragDrop />` component supports all [DragDrop](/docs/drag-drop/) options as props.

```js
// assuming `this.uppy` contains an Uppy instance:

<DragDrop
  width="100%"
  height="100%"
  note="Images up to 200×200px"
  uppy={this.uppy}
  locale={{
    strings: {
      // Text to show on the droppable area.
      // `%{browse}` is replaced with a link that opens the system file selection dialog.
      dropHereOr: "Drop here or %{browse}",
      // Used as the label for the link that opens the system file selection dialog.
      browse: "browse",
    },
  }}
/>
```
