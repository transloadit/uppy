---
title: "&lt;DragDrop />"
type: docs
permalink: docs/react/drag-drop/
alias: docs/react/dragdrop/
order: 82
---

The `<DragDrop />` component wraps the [`@uppy/drag-drop`][] plugin.

## Installation

```shell
npm install @uppy/react
```

```js
import DragDrop from '@uppy/react/lib/DragDrop';
import { DragDrop } from '@uppy/react';
```

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
