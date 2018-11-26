---
type: docs
title: "File Picker API Documentation"
permalink: docs/transloadit-preset/picker/
hidden: true
---

```js
transloadit.pick(target, options)
```

## `target`

DOM element or CSS selector to place the modal element in. `document.body` is usually fine in this case because the modal is absolutely positioned on top of everything anyway.

<!-- This supports the same options as the Transloadit plugin … should we inline the documentation somehow? Or just link to it? -->
## `options.params`

The Assembly paramaters to use for the upload. [see here](https://uppy.io/docs/transloadit#params)
