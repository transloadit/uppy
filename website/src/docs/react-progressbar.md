---
title: "&lt;ProgressBar />"
type: docs
module: "@uppy/react"
permalink: docs/react/progress-bar/
alias: docs/react/progressbar/
order: 4
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

## Props

The `<ProgressBar />` component supports all [`@uppy/progress-bar`][] options as props.

```js
<ProgressBar
  fixed
  hideAfterFinish
/>
```

[`@uppy/progress-bar`]: /docs/progress-bar/
