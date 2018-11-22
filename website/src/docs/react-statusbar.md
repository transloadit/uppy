---
title: "&lt;StatusBar />"
type: docs
permalink: docs/react/status-bar/
alias: docs/react/statusbar/
order: 81
---

The `<StatusBar />` component wraps the [`@uppy/status-bar`][] plugin.

## Installation

Install from NPM:

```shell
npm install @uppy/react
```

```js
import StatusBar from '@uppy/react/lib/StatusBar'
import { StatusBar } from '@uppy/react'
```

## CSS

The `StatusBar` component requires the following CSS for styling:

```js
import '@uppy/core/dist/style.css'
import '@uppy/status-bar/dist/style.css'
```

Import general Core styles from `@uppy/core/dist/style.css` first, then add the Informer styles from `@uppy/status-bar/dist/style.css`. A minified version is also available as `style.min.css` at the same path. The way to do import depends on your build system.

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
