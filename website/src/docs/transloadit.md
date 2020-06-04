---
type: docs
order: 10
title: "Transloadit"
module: "@uppy/transloadit"
permalink: docs/transloadit/
category: "File Processing"
tagline: "manipulate and transcode uploaded files using the <a href='https://transloadit.com'>transloadit.com</a> service"
---

The `@uppy/transloadit` plugin can be used to upload files to [Transloadit](https://transloadit.com/) for all kinds of processing, such as transcoding video, resizing images, zipping/unzipping, [and much more](https://transloadit.com/services/).

> If you're okay to trade some flexibility for ergonomics, consider using
> the [Robodog](/docs/robodog/) Plugin instead, which is a higher-level abstraction for
> encoding files with Uppy and Transloadit.

<a class="TryButton" href="/examples/transloadit/">Try it live</a>

```js
const Transloadit = require('@uppy/transloadit')

uppy.use(Transloadit, {
  service: 'https://api2.transloadit.com',
  params: null,
  waitForEncoding: false,
  waitForMetadata: false,
  importFromUploadURLs: false,
  alwaysRunAssembly: false,
  signature: null,
  fields: {},
  limit: 0
})
```

As of Uppy version 0.24, the Transloadit plugin includes the [Tus](/docs/tus) plugin to handle the uploading, so you no longer have to add it manually.

## Installation

This plugin is published as the `@uppy/transloadit` package.

Install from NPM:

```shell
npm install @uppy/transloadit
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const Transloadit = Uppy.Transloadit
```

## Properties

### `Transloadit.COMPANION`

The main endpoint for Transloadit's hosted companions. You can use this constant in remote provider options, like so:

```js
const Dropbox = require('@uppy/dropbox')
const Transloadit = require('@uppy/transloadit')

uppy.use(Dropbox, {
  companionUrl: Transloadit.COMPANION
  companionAllowedHosts: Transloadit.COMPANION_PATTERN
})
```

When using `Transloadit.COMPANION`, you should also configure [`companionAllowedHosts: Transloadit.COMPANION_PATTERN`](#Transloadit-COMPANION-PATTERN).

The value of this constant is `https://api2.transloadit.com/companion`. If you are using a custom [`service`](#service) option, you should also set a custom host option in your provider plugins, by taking a Transloadit API url and appending `/companion`:

```js
uppy.use(Dropbox, {
  companionUrl: 'https://api2-us-east-1.transloadit.com/companion'
})
```

### `Transloadit.COMPANION_PATTERN`

A RegExp pattern matching Transloadit's hosted companion endpoints. The pattern is used in remote provider `companionAllowedHosts` options, to ensure that third party authentication messages cannot be faked by an attacker's page, but can only originate from Transloadit's servers.

Use it whenever you use `companionUrl: Transloadit.COMPANION`, like so:

```js
const Dropbox = require('@uppy/dropbox')
const Transloadit = require('@uppy/transloadit')

uppy.use(Dropbox, {
  companionUrl: Transloadit.COMPANION
  companionAllowedHosts: Transloadit.COMPANION_PATTERN
})
```

The value of this constant covers _all_ Transloadit's Companion servers, so it does not need to be changed if you are using a custom [`service`](#service) option. However, if you are not using the Transloadit Companion servers at `*.transloadit.com`, make sure to set the `companionAllowedHosts` option to something that matches what you do use.

## Options

The `@uppy/transloadit` plugin has the following configurable options:

### `id: 'Transloadit'`

A unique identifier for this plugin. It defaults to `'Transloadit'`.

### `service`

The Transloadit API URL to use. It defaults to `https://api2.transloadit.com`, which will attempt to route traffic efficiently based on the location of your users. You can set this to something like `https://api2-us-east-1.transloadit.com` if you want to use a particular region.

### `params`

The Assembly parameters to use for the upload. See the Transloadit documentation on [Assembly Instructions](https://transloadit.com/docs/#14-assembly-instructions) for further information. `params` should be a plain JavaScript object, or a JSON string if you are using the [`signature`](#signature) option.

The `auth.key` Assembly parameter is required. You can also use the `steps` or `template_id` options here as described in the Transloadit documentation.

```js
uppy.use(Transloadit, {
  params: {
    auth: { key: 'YOUR_TRANSLOADIT_KEY' },
    steps: {
      encode: {
        robot: '/video/encode',
        use: {
          steps: [ ':original' ],
          fields: [ 'file_input_field2' ]
        },
        preset: 'iphone'
      }
    }
  }
})
```

### `waitForEncoding`

Configures whether or not to wait for all Assemblies to complete before completing the upload.

### `waitForMetadata`

Configures whether or not to wait for metadata to be extracted from uploaded files before completing the upload. If `waitForEncoding` is enabled, this has no effect.

### `importFromUploadURLs`

Instead of uploading to Transloadit's servers directly, allow another plugin to upload files, and then import those files into the Transloadit Assembly. This is set to `false` by default.

When enabling this option, Transloadit will *not* configure the Tus plugin to upload to Transloadit. Instead, a separate upload plugin must be used. Once the upload completes, the Transloadit plugin adds the uploaded file to the Assembly.

For example, to upload files to an S3 bucket and then transcode them:

```js
uppy.use(AwsS3, {
  getUploadParameters (file) {
    return { /* upload parameters */ }
  }
})
uppy.use(Transloadit, {
  importFromUploadURLs: true,
  params: {
    auth: { key: 'YOUR_API_KEY' },
    template_id: 'YOUR_TEMPLATE_ID'
  }
})
```

In order for this to work, the upload plugin must assign a publically accessible `uploadURL` property to the uploaded file object. The Tus and S3 plugins both do this automatically. For the XHRUpload plugin, you may have to specify a custom `getUploadResponse` function.

### `alwaysRunAssembly`

When set to true, always create and run an Assembly when `uppy.upload()` is called, even if no files were selected. This allows running Assemblies that do not receive files, but instead use a robot like [`/s3/import`](https://transloadit.com/docs/transcoding/#s3-import) to download the files from elsewhere, for example, for a bulk transcoding job.

### `signature`

An optional signature for the Assembly parameters. See the Transloadit documentation on [Signature Authentication](https://transloadit.com/docs/#26-signature-authentication) for further information.

If a `signature` is provided, `params` should be a JSON string instead of a JavaScript object, as otherwise the generated JSON in the browser may be different from the JSON string that was used to generate the signature.

### `fields`

An object of form fields to send along to the Assembly. Keys are field names, and values are field values. See also the Transloadit documentation on [Form Fields In Instructions](https://transloadit.com/docs/#23-form-fields-in-instructions).

```js
uppy.use(Transloadit, {
  ...,
  fields: {
    message: 'This is a form field'
  }
})
```

You can also pass an array of field names to send global or file metadata along to the Assembly. Global metadata is set using the [`meta` option](/docs/uppy/#meta) in the Uppy constructor, or using the [`setMeta` method](/docs/uppy/#uppy-setMeta-data). File metadata is set using the [`setFileMeta`](/docs/uppy/#uppy-setFileMeta-fileID-data) method. The [Form](/docs/form) plugin also sets global metadata based on the values of `<input />`s in the form, providing a handy way to use values from HTML form fields:

```js
uppy.use(Form, { target: 'form#upload-form', getMetaFromForm: true })
uppy.use(Transloadit, {
  fields: ['field_name', 'other_field_name'],
  params: { ... }
})
```

Form fields can also be computed dynamically using custom logic, by using the [`getAssemblyOptions(file)`](/docs/transloadit/#getAssemblyOptions-file) option.

### `getAssemblyOptions(file)`

While `params`, `signature`, and `fields` must be determined ahead of time, the `getAssemblyOptions` allows using dynamically generated values for these options. This way, it is possible to use different Assembly parameters for different files, or to use some user input in an Assembly.

A custom `getAssemblyOptions()` option should return an object or a Promise for an object with properties `{ params, signature, fields }`. For example, to add a field with some user-provided data from the `MetaData` plugin:

```js
uppy.use(MetaData, {
  fields: [
    { id: 'caption' }
  ]
})
uppy.use(Transloadit, {
  getAssemblyOptions (file) {
    return {
      params: {
        auth: { key: 'TRANSLOADIT_AUTH_KEY_HERE' },
        template_id: 'xyz'
      },
      fields: {
        caption: file.meta.caption
      }
    }
  }
})
```

Now, the `${fields.caption}` variable will be available in the Assembly template.

Combine the `getAssemblyOptions()` option with the [Form](/docs/form) plugin to pass user input from a `<form>` to a Transloadit Assembly:

```js
// This will add form field values to each file's `.meta` object:
uppy.use(Form, { getMetaFromForm: true })
uppy.use(Transloadit, {
  getAssemblyOptions (file) {
    return {
      params: { ... },
      // Pass through the fields you need:
      fields: {
        message: file.meta.message
      }
    }
  }
})
```

`getAssemblyOptions()` may also return a Promise, so it could retrieve signed Assembly parameters from a server. For example, assuming an endpoint `/transloadit-params` that responds with a JSON object with `{ params, signature }` properties:

```js
uppy.use(Transloadit, {
  getAssemblyOptions (file) {
    return fetch('/transloadit-params').then((response) => {
      return response.json()
    })
  }
})
```

### `limit: 0`

Limit the amount of uploads going on at the same time. Setting this to `0` means there is no limit on concurrent uploads. This option is passed through to the [`@uppy/tus`](/docs/tus) plugin that Transloadit plugin uses internally.

### `locale: {}`

Localize text that is shown to the user.

The default English strings are:

```js
strings: {
  // Shown while Assemblies are being created for an upload.
  creatingAssembly: 'Preparing upload...'
  // Shown if an Assembly could not be created.
  creatingAssemblyFailed: 'Transloadit: Could not create Assembly',
  // Shown after uploads have succeeded, but when the Assembly is still executing.
  // This only shows if `waitForMetadata` or `waitForEncoding` was enabled.
  encoding: 'Encoding...'
}
```

## Errors

If an error occurs when an Assembly has already started, you can find the Assembly Status on the error object's `assembly` property.

```js
uppy.on('error', (error) => {
  if (error.assembly) {
    console.log(`Assembly ID ${error.assembly.assembly_id} failed!`)
    console.log(error.assembly)
  }
})
```

## Events

### `transloadit:assembly-created`

Fired when an Assembly is created.

**Parameters**

  - `assembly` - The initial [Assembly Status][assembly-status].
  - `fileIDs` - The IDs of the files that will be uploaded to this Assembly.

```js
uppy.on('transloadit:assembly-created', (assembly, fileIDs) => {
  console.group('Created', assembly.assembly_id, 'for files:')
  for (const id of fileIDs) {
    console.log(uppy.getFile(id).name)
  }
  console.groupEnd()
})
```

### `transloadit:upload`

Fired when Transloadit has received an upload.

**Parameters**

  - `file` - The Transloadit file object that was uploaded.
  - `assembly` - The [Assembly Status][assembly-status] of the Assembly to which the file was uploaded.

### `transloadit:assembly-executing`

Fired when Transloadit has received all uploads, and is currently executing the Assembly.

**Parameters**

 - `assembly` - The [Assembly Status](https://transloadit.com/docs/api-docs/#assembly-status-response) of the Assembly that is currently executing.

### `transloadit:result`

Fired when a result came in from an Assembly.

**Parameters**

  - `stepName` - The name of the Assembly step that generated this result.
  - `result` - The result object from Transloadit.
    This result object contains one additional property, namely `localId`.
    This is the ID of the file in Uppy's local state, and can be used with `uppy.getFile(id)`.
  - `assembly` - The [Assembly Status][assembly-status] of the Assembly that generated this result.

```js
uppy.on('transloadit:result', (stepName, result) => {
  const file = uppy.getFile(result.localId)
  document.body.appendChild(html`
    <div>
      <h2>From ${file.name}</h2>
      <a href=${result.ssl_url}> View </a>
    </div>
  `)
})
```

### `transloadit:complete`

Fired when an Assembly completed.

**Parameters**

  - `assembly` - The final [Assembly Status][assembly-status] of the completed Assembly.

```js
uppy.on('transloadit:complete', (assembly) => {
  // Could do something fun with this!
  console.log(assembly.results)
})
```

[assembly-status]: https://transloadit.com/docs/api-docs/#assembly-status-response
