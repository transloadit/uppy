---
type: docs
order: 24
title: "Informer"
permalink: docs/informer/
---

The Informer is a pop-up bar for showing notifications. When plugins have some exciting news (or error) to share, they can show a notification here.

```js
const Informer = require('uppy/lib/plugins/Informer')

uppy.use(Informer, {
  // Options
})
```

[Try it live](/examples/dashboard/) - The Informer is included in the Dashboard by default.

## Options

### `target: null`

DOM element, CSS selector, or plugin to mount the informer into.

### `typeColors: {}`

Customize the background and foreground colors for different types of notifications. Supported types are `info`, `warning`, `error`, and `success`. To customize colors, pass an object containing `{ bg, text }` color pairs for each type of notification:

```js
uppy.use(Informer, {
  typeColors: {
    info:    { text: '#fff', bg: '#000000' },
    warning: { text: '#fff', bg: '#f6a623' },
    error:   { text: '#fff', bg: '#e74c3c' },
    success: { text: '#fff', bg: '#7ac824' }
  }
})
```
