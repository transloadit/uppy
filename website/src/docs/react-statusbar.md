---
title: "&lt;StatusBar />"
type: docs
module: "@uppy/react"
permalink: docs/react/status-bar/
alias: docs/react/statusbar/
order: 2
category: "React"
---

The `<StatusBar />` component wraps the \[`@uppy/status-bar`]\[@uppy/status-bar] plugin.

## Installation

Install from NPM:

```shell
npm install @uppy/react
```

```js
import { StatusBar } from '@uppy/react'

// Alternatively, you can also use a default import:
// import StatusBar from '@uppy/react/lib/StatusBar'
```

## CSS

The `StatusBar` component requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/status-bar/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Status Bar styles from `@uppy/status-bar/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

## Props

The `<StatusBar />` component supports all \[`@uppy/status-bar`]\[@uppy/status-bar] options as props. Additionally, an Uppy instance must be provided in the `uppy={}` prop: see [Initializing Uppy](/docs/react/initializing) for details.

```js
import React from 'react'
import { StatusBar } from '@uppy/react'

  <StatusBar
    uppy={uppy}
    hideUploadButton
    hideAfterFinish={false}
    showProgressDetails
  />
```

[`@uppy/status-bar`]: /docs/status-bar/
