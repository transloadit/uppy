---
type: docs
order: 9
title: "Transloadit"
permalink: docs/transloadit/
---

The Transloadit plugin can be used to upload files to [Transloadit](https://transloadit.com/) for all kinds of processing, such as transcoding video, resizing images, zipping/unzipping, [and more](https://transloadit.com/services/).

## Options

### `waitForEncoding`

Whether to wait for all assemblies to complete before completing the upload.

### `waitForMetadata`

Whether to wait for metadata to be extracted from uploaded files before completing the upload.
If `waitForEncoding` is enabled, this has no effect.

### `params`

The assembly parameters to use for the upload.

### `signature`

An optional signature for the assembly parameters.

If a `signature` is provided, `params` should be a JSON string instead of a JavaScript object, as otherwise the generated JSON in the browser may be different from the JSON string that was used to generate the signature.

### `fields`

An object of form fields to send along to the assembly.

### `getAssemblyOptions(file)`

While `params`, `signature`, and `fields` must be determined ahead of time, the `getAssemblyOptions` allows using dynamically generated values for these options.
This way, it is possible to use different assembly parameters for different files.

A custom `getAssemblyOptions()` option should return an object or a Promise for an object with properties `{ params, signature, fields }`.
For example, to add a field with some user-provided data from the `MetaData` plugin:

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

Now, the `${fields.caption}` variable will be available in the assembly template.

`getAssemblyOptions()` may also return a Promise, so it could retrieve signed assembly parameters from a server.
For example, assuming an endpoint `/transloadit-params` that responds with a JSON object with `{ params, signature }` properties:

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

Fired when an assembly is created.

**Parameters**

  - `assembly` - The initial assembly status.
  - `fileIDs` - The IDs of the files that will be uploaded to this assembly.

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
  - `assembly` - The assembly status of the assembly the file was uploaded to.

### `transloadit:result`

Fired when a result came in from an assembly.

**Parameters**

  - `stepName` - The name of the assembly step that generated this result.
  - `result` - The result object from Transloadit.
    This result object contains one additional property, namely `localId`.
    This is the ID of the file in Uppy's local state, and can be used with `uppy.getFile(id)`.
  - `assembly` - The assembly status of the assembly that generated this result.

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

Fired when an assembly completed.

**Parameters**

  - `assembly` - The final assembly status of the completed assembly.

```js
uppy.on('transloadit:complete', (assembly) => {
  // Could do something fun with this!
  console.log(assembly.results)
})
```
