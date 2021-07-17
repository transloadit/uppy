---
type: docs
title: "Robodog: Upload API"
menu: "Robodog Upload"
permalink: docs/robodog/upload/
order: 3
category: "File Processing"
---

Upload files straight to Transloadit from your own custom UI. Give us an array of files, and we'll give you an array of results!

```js
const resultPromise = Robodog.upload(files, {
  params: {
    auth: { key: '' },
    template_id: '',
  },
})
```

`resultPromise` is a [Promise][promise] that resolves with an object:

*   `successful` - An array containing data about files that were uploaded successfully
*   `failed` - An array containing data about files that failed to upload
*   `transloadit` - An array of Assembly statuses

## `files`

An array of [File][file] objects, obtained from an `<input type="file">` or elsewhere.

These can also be [Blob][blob]s with a `.name` property. That way you can upload files that were created using JavaScript.

## Transloadit

All the options to the [Transloadit][tl-options] plugin are supported.

[file]: https://developer.mozilla.org/en-US/docs/Web/API/File

[blob]: https://developer.mozilla.org/en-US/docs/Web/API/Blob

[promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

[tl-options]: /docs/transloadit#options
