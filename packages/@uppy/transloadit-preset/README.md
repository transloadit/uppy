# @uppy/transloadit

<img src="https://uppy.io/images/logos/uppy-dog-head-arrow.svg" width="120" alt="Uppy logo: a superman puppy in a pink suit" align="right">

<a href="https://www.npmjs.com/package/@uppy/transloadit"><img src="https://img.shields.io/npm/v/@uppy/transloadit.svg?style=flat-square"></a>
<a href="https://travis-ci.org/transloadit/uppy"><img src="https://img.shields.io/travis/transloadit/uppy/master.svg?style=flat-square" alt="Build Status"></a>

The Transloadit plugin can be used to upload files to Transloadit for all kinds of processing, such as transcoding video, resizing images, zipping/unzipping, [and more](https://transloadit.com/services/).

[Try it live →](https://uppy.io/examples/transloadit/)

Uppy is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

`transloadit.form` attaches Transloadit to an existing HTML form.
It could act like the jQuery SDK using the `@uppy/file-input` plugin,
or it could also add the `@uppy/dashboard`.
Uploads files on form submission, adds results to a hidden input,
then really submits the form.

```js
const transloadit = require('@uppy/transloadit-preset')

transloadit.form('#form', {
  params: {
    auth: { key: '' },
    template_id: ''
  }
})
```

Adding Dashboard could be optional, eg

```js
transloadit.form('#form', {
  ...
  dashboard: true // or css selector, true means input[type=file]
})
```
The file input would be replaced by a button that opens the dashboard modal.
Needs:
- a way of having a 'Done' button instead of 'Upload' that closes the modal but doesn't trigger upload.

`transloadit.modal` opens the Dashboard and allows the user to select files.
When the user is done, presses 'upload', files are uploaded and the modal closes.
Promise resolves with results.

Needs:
- `{multi: false}` option in core, so that no new files can be added once `upload()` was called
- `{autoClose: true}` option in dashboard, that closes it once upload is complete

```js
transloadit.modal({
  params: {
    auth: { key: '' },
    template_id: ''
  }
}).then(({ successful, failed }) => {
  // successful, failed are uppy.upload() result
  // perhaps it could be assembly status or assembly results instead
})
```

## Installation

```bash
$ npm install @uppy/transloadit --save
```

We recommend installing from npm and then using a module bundler such as [Webpack](http://webpack.github.io/), [Browserify](http://browserify.org/) or [Rollup.js](http://rollupjs.org/).

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit's CDN: Edgly. In that case `Uppy` will attach itself to the global `window.Uppy` object. See the [main Uppy documentation](https://uppy.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [Uppy website](https://uppy.io/docs/transloadit).

## License

[The MIT License](./LICENSE).
