---
title: "&lt;StatusBar />"
type: docs
permalink: docs/react/status-bar/
alias: docs/react/statusbar/
order: 81
---

The `<StatusBar />` component wraps the [`@uppy/status-bar`][] plugin.

## Installation

```shell
npm install @uppy/react
```

```js
import StatusBar from '@uppy/react/lib/StatusBar'
import { StatusBar } from '@uppy/react'
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
