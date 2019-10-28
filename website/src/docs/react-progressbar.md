---
title: "&lt;ProgressBar />"
type: docs
module: "@uppy/react"
permalink: docs/react/progress-bar/
alias: docs/react/progressbar/
order: 3
category: "React"
---

The `<ProgressBar />` component wraps the [`@uppy/progress-bar`][] plugin.

## Installation

Install from NPM:

```shell
npm install @uppy/react
```

```js
// Either:
import ProgressBar from '@uppy/react/lib/ProgressBar'
// Or:
import { ProgressBar } from '@uppy/react'
```

## CSS

The `ProgressBar` plugin requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/progress-bar/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Progress Bar styles from `@uppy/progress-bar/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

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
    return <ProgressBar uppy={this.uppy} />
  }
}
```

## Props

The `<ProgressBar />` component supports all [`@uppy/progress-bar`][] options as props.

```js
<ProgressBar
  fixed
  hideAfterFinish
/>
```

[`@uppy/progress-bar`]: /docs/progress-bar/
