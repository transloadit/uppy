---
type: docs
order: 33
title: "Transloadit"
permalink: docs/transloadit/
---

The Transloadit plugin can be used to upload files to [Transloadit](https://transloadit.com/) for all kinds of processing, such as transcoding video, resizing images, zipping/unzipping, [and more](https://transloadit.com/services/).

[Try it live](/examples/transloadit/)

The Transloadit plugin uses the [Tus plugin](/docs/tus) for the uploading itself. To upload files to Transloadit directly, both the Tus and Transloadit plugins must be used:

```js
// The `resume: false` option _must_ be provided to the Tus plugin.
// Otherwise, the Tus plugin remembers the URLs used to upload to Transloadit,
// which can cause future uploads to go to old Assemblies.
uppy.use(Tus, {
  resume: false
})
uppy.use(Transloadit, {
  // Transloadit plugin options
  service: 'https://api2.transloadit.com',
  waitForEncoding: false,
  waitForMetadata: false,
  importFromUploadURLs: false,
  alwaysRunAssembly: false,
  params: null,
  signature: null,
  fields: {}
})
```

Note: It is not required to use the `Tus` plugin if [`importFromUploadURLs`](#importFromUploadURLs) is enabled.

## Options

### `service`

The Transloadit API URL to use. Defaults to `https://api2.transloadit.com`, which will attempt to route traffic efficiently based on where your users are. You can set this to something like `https://api2-us-east-1.transloadit.com` if you want to use a particular region.

### `waitForEncoding`

Whether to wait for all Assemblies to complete before completing the upload.

### `waitForMetadata`

Whether to wait for metadata to be extracted from uploaded files before completing the upload. If `waitForEncoding` is enabled, this has no effect.

### `importFromUploadURLs`

Instead of uploading to Transloadit's servers directly, allow another plugin to upload files, and then import those files into the Transloadit Assembly. Default `false`.

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
    auth: { key: /* secret */ },
    template_id: /* not secret */
  }
})
```

In order for this to work, the upload plugin must assign a publically accessible `uploadURL` property to the uploaded file object. The Tus and S3 plugins both do this—for the XHRUpload plugin, you may have to specify a custom `getUploadResponse` function.

### `alwaysRunAssembly`

When true, always create and run an Assembly when `uppy.upload()` is called, even if no files were selected. This allows running Assemblies that do not receive files, but instead use a robot like [`/s3/import`](https://transloadit.com/docs/transcoding/#s3-import) to download the files from elsewhere, for example for a bulk transcoding job.

### `params`

The Assembly parameters to use for the upload. See the Transloadit documentation on [Assembly Instructions](https://transloadit.com/docs/#14-assembly-instructions). `params` should be a plain JavaScript object, or a JSON string if you are using the [`signature`](#signature) option.

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

### `signature`

An optional signature for the Assembly parameters. See the Transloadit documentation on [Signature Authentication](https://transloadit.com/docs/#26-signature-authentication).

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

Using the `fields` option, form fields have to be determined ahead of time. Form fields can also be computed dynamically however, by using the `getAssemblyOptions(file)` option.

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
  - `assembly` - The [Assembly Status][assembly-status] of the Assembly the file was uploaded to.

### `transloadit:assembly-executing`

Fired when Transloadit has received all uploads, and is now executing the Assembly.

**Parameters**

 - `assembly` - The [Assembly Status](https://transloadit.com/docs/api-docs/#assembly-status-response) of the Assembly that is now executing.

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
