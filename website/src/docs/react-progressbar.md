---
title: "&lt;ProgressBar />"
type: docs
module: "@uppy/react"
permalink: docs/react/progress-bar/
alias: docs/react/progressbar/
order: 4
category: "React"
---

The `<ProgressBar />` component wraps the \[`@uppy/progress-bar`]\[@uppy/progress-bar] plugin.

## Installation

Install from NPM:

```shell
npm install @uppy/react
```

```js
import { ProgressBar } from '@uppy/react'

// Alternatively, you can also use a default import:
// import ProgressBar from '@uppy/react/lib/ProgressBar'
```

## CSS

The `ProgressBar` plugin requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/progress-bar/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Progress Bar styles from `@uppy/progress-bar/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

## Props

The `<ProgressBar />` component supports all \[`@uppy/progress-bar`]\[@uppy/progress-bar] options as props. Additionally, an Uppy instance must be provided in the `uppy={}` prop: see [Initializing Uppy](/docs/react/initializing) for details.

```js
import React from 'react'
import { ProgressBar } from '@uppy/react'

  <ProgressBar
    uppy={uppy}
    fixed
    hideAfterFinish
  />
```

[`@uppy/progress-bar`]: /docs/progress-bar/
