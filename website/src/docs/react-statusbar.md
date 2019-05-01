---
title: "&lt;StatusBar />"
type: docs
permalink: docs/react/status-bar/
alias: docs/react/statusbar/
order: 1
category: 'React'
---

The `<StatusBar />` component wraps the [`@uppy/status-bar`][] plugin.

## Installation

Install from NPM:

```shell
npm install @uppy/react
```

```js
// Either:
import StatusBar from '@uppy/react/lib/StatusBar'
// Or:
import { StatusBar } from '@uppy/react'
```

## CSS

The `StatusBar` component requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/status-bar/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Status Bar styles from `@uppy/status-bar/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

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
    return <StatusBar uppy={this.uppy} />
  }
}
```

## Props

The `<StatusBar />` component supports all [`@uppy/status-bar`][] options as props.

```js
<StatusBar
  hideUploadButton
  hideAfterFinish={false}
  showProgressDetails
/>
```

[`@uppy/status-bar`]: /docs/status-bar/
