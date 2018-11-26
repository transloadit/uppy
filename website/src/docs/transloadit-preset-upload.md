---
type: docs
title: "Upload API Documentation"
permalink: docs/transloadit-preset/upload/
hidden: true
---


Upload files straight to Transloadit from your own custom UI. Give us an array of files, and we'll give you an array of results!

```js
const resultPromise = transloadit.upload(files, {
  params: {
    auth: { key: '' },
    template_id: ''
  }
})
```

## `files`

An array of [File][file] objects, obtained from an `<input type="file">` or elsewhere.

These can also be [Blob][blob]s with a `.name` property. That way you can upload files that were created using JavaScript.

## Options

This method supports all the options of the [Transloadit Plugin][tl-options].

TODO inline them here probably

[file]: https://developer.mozilla.org/en-US/docs/Web/API/File
[blob]: https://developer.mozilla.org/en-US/docs/Web/API/Blob
[tl-options]: /docs/transloadit#options
