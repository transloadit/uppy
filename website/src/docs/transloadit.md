---
type: docs
order: 10
title: "Transloadit"
module: "@uppy/transloadit"
permalink: docs/transloadit/
category: "Destinations"
tagline: "manipulate and transcode uploaded files using the <a href='https://transloadit.com'>transloadit.com</a> service"
---

The `@uppy/transloadit` plugin can be used to upload files to [Transloadit](https://transloadit.com/) for all kinds of processing, such as transcoding video, resizing images, zipping/unzipping, [and much more](https://transloadit.com/services/).

> If you’re okay to trade some flexibility for ergonomics, consider using
> the [Robodog](/docs/robodog/) Plugin instead, which is a higher-level abstraction for
> encoding files with Uppy and Transloadit.

<a class="TryButton" href="/examples/transloadit/">Try it live</a>

```js
import Transloadit from '@uppy/transloadit'

uppy.use(Transloadit, {
  service: 'https://api2.transloadit.com',
  params: null,
  waitForEncoding: false,
  waitForMetadata: false,
  importFromUploadURLs: false,
  alwaysRunAssembly: false,
  signature: null,
  fields: {},
  limit: 0,
})
```

As of Uppy version 0.24, the Transloadit plugin includes the [Tus](/docs/tus) plugin to handle the uploading, so you no longer have to add it manually.

## Installation

This plugin is published as the `@uppy/transloadit` package.

Install from NPM:

```shell
npm install @uppy/transloadit
```

In the [CDN package](/docs/#With-a-script-tag), the plugin class is available on the `Uppy` global object:

```js
const { Transloadit } = Uppy
```

## Hosted Companion Service

You can use this plugin together with Transloadit’s hosted Companion service to let your users import files from third party sources across the web.
To do so each provider plugin must be configured with Transloadit’s Companion URLs:

```js
import { COMPANION_URL, COMPANION_ALLOWED_HOSTS } from '@uppy/transloadit'
import Dropbox from '@uppy/dropbox'

uppy.use(Dropbox, {
  companionUrl: COMPANION_URL,
  companionAllowedHosts: COMPANION_ALLOWED_HOSTS,
})
```

This will already work. Transloadit’s OAuth applications are used to authenticate your users by default. Your users will be asked to provide Transloadit access to their files. Since your users are probably not aware of Transloadit, this may be confusing or decrease trust. You may also hit rate limits, because the OAuth application is shared between everyone using Transloadit.

To solve that, you can use your own OAuth keys with Transloadit’s hosted Companion servers by using Transloadit Template Credentials. [Create a Template Credential][template-credentials] on the Transloadit site. Select “Companion OAuth” for the service, and enter the key and secret for the provider you want to use. Then you can pass the name of the new credentials to that provider:

```js
import { COMPANION_URL, COMPANION_ALLOWED_HOSTS } from '@uppy/transloadit'
import Dropbox from '@uppy/dropbox'

uppy.use(Dropbox, {
  companionUrl: COMPANION_URL,
  companionAllowedHosts: COMPANION_ALLOWED_HOSTS,
  companionKeysParams: {
    key: 'YOUR_TRANSLOADIT_API_KEY',
    credentialsName: 'my_companion_dropbox_creds',
  },
})
```

## Static exports

### `COMPANION_URL`

The main endpoint for Transloadit’s hosted companions. You can use this constant in remote provider options, like so:

```js
import Dropbox from '@uppy/dropbox'
import { COMPANION_URL } from '@uppy/transloadit'

uppy.use(Dropbox, {
  companionUrl: COMPANION_URL,
})
```

When using `COMPANION_URL`, you should also configure [`companionAllowedHosts: COMPANION_ALLOWED_HOSTS`](#COMPANION_ALLOWED_HOSTS).

The value of this constant is `https://api2.transloadit.com/companion`. If you are using a custom [`service`](#service) option, you should also set a custom host option in your provider plugins, by taking a Transloadit API url and appending `/companion`:

```js
uppy.use(Dropbox, {
  companionUrl: 'https://api2-us-east-1.transloadit.com/companion',
})
```

### `COMPANION_ALLOWED_HOSTS`

A RegExp pattern matching Transloadit’s hosted companion endpoints. The pattern is used in remote provider `companionAllowedHosts` options, to make sure that third party authentication messages cannot be faked by an attacker’s page, but can only originate from Transloadit’s servers.

Use it whenever you use `companionUrl: COMPANION_URL`, like so:

```js
import Dropbox from '@uppy/dropbox'
import { COMPANION_ALLOWED_HOSTS } from '@uppy/transloadit'

uppy.use(Dropbox, {
  companionAllowedHosts: COMPANION_ALLOWED_HOSTS,
})
```

The value of this constant covers _all_ Transloadit’s Companion servers, so it does not need to be changed if you are using a custom [`service`](#service) option. But, if you are not using the Transloadit Companion servers at `*.transloadit.com`, make sure to set the `companionAllowedHosts` option to something that matches what you do use.

## Options

### `id`

A unique identifier for this plugin (`string`, default: `'Transloadit'`).

### `service`

The Transloadit API URL to use (`string`, default: `https://api2.transloadit.com`).

The default will try to route traffic efficiently based on the location of your users. You could for instance set it to `https://api2-us-east-1.transloadit.com` if you need the traffic to stay inside a particular region.

### `limit`

Limit the amount of uploads going on at the same time (`number`, default: `5`).

Setting this to `0` means no limit on concurrent uploads, but we recommend a value between `5` and `20`. This option is passed through to the [`@uppy/tus`](/docs/upload-strategies/tus) plugin, which this plugin uses internally.

### `assemblyOptions`

Configure the [Assembly Instructions](https://transloadit.com/docs/topics/assembly-instructions/), the fields to send along to the assembly, and authentication (`object | function`, default: `null`).

The object you can pass or return from a function has this structure:

```json
{
  "params": {
    "auth": { "key": "key-from-transloadit" },
    "template_id": "id-from-transloadit",
    "steps": {
      // Overruling Template at runtime
    },
    "notify_url": "https://your-domain.com/assembly-status",
  },
  "signature": "generated-signature",
  "fields": {
    // Dynamic or static fields to send along to the assembly
  },
}
```

* `params` is used to authenticate with Transloadit and using your desired [template](https://transloadit.com/docs/topics/templates/).
  * `auth.key` _(required)_ is your authentication key which you can find on the “Credentials” page of your account.
  * `template_id` _(required)_ is the unique identifier to use the right template from your account.
  * `steps` _(optional)_ can be used to [overrule Templates at runtime](https://transloadit.com/docs/topics/templates/#overruling-templates-at-runtime).
    A typical use case might be changing the storage path on the fly based on the session user id. For most use cases, we recommend to let your Templates handle dynamic cases (they can accept `fields` and execute arbitrary JavaScript as well), and not pass in `steps` from a browser. The template editor also has extra validations and context.
  * `notify_url` _(optional)_ is a pingback with the assembly status as JSON. For instance, if you don’t want to block the user experience by letting them wait for your template to complete with [`waitForEncoding`](#waitForEncoding), but you do want to want to asynchrounously have an update, you can provide an URL which will be “pinged” with the assembly status.
* `signature` _(optional, but recommended)_ is a cryptographic signature to provide further trust in unstrusted environments. Refer to “[Signature Authentication”](https://transloadit.com/docs/topics/signature-authentication/) for more information.
* `fields` _(optional)_ can be used to to send along key/value pairs, which can be [used dynamically in your template](https://transloadit.com/docs/topics/assembly-instructions/#form-fields-in-instructions).

> When you go to production always make sure to set the `signature`.
> **Not using [Signature Authentication](https://transloadit.com/docs/topics/signature-authentication/) can be a security risk**.
> Signature Authentication is a security measure that can prevent outsiders from tampering with your Assembly Instructions.
> While Signature Authentication is not implemented (yet),
> we recommend to enable `allow_steps_override` in your Templates to avoid outsiders being able to pass in any Instructions and storage targets on your behalf.

**Example as a function**

A custom `assemblyOptions()` option should return an object or a promise for an object.

```js
uppy.use(Transloadit, {
  assemblyOptions (file) {
    return {
      params: {
        auth: { key: 'TRANSLOADIT_AUTH_KEY_HERE' },
        template_id: 'xyz',
      },
      fields: {
        caption: file.meta.caption,
      },
    }
  },
})
```

The `${fields.caption}` variable will be available in the Assembly spawned from Template `xyz`. You can use this to dynamically watermark images for example.

`assemblyOptions()` may also return a Promise, so it could retrieve signed Assembly parameters from a server. For example, assuming an endpoint `/transloadit-params` that responds with a JSON object with `{ params, signature }` properties:

```js
uppy.use(Transloadit, {
  async assemblyOptions (file) {
    const res = await fetch('/transloadit-params')
    return response.json()
  },
})
```

**Example as an object**

If you don’t need to change anything dynamically, you can also pass an object directly.

```js
uppy.use(Transloadit, {
  assemblyOptions: {
    params: { auth: { key: 'transloadit-key' } },
  },
})
```

**Example with @uppy/form**

Combine the `assemblyOptions()` option with the [Form](/docs/form) plugin to pass user input from a `<form>` to a Transloadit Assembly:

```js
// This will add form field values to each file's `.meta` object:
uppy.use(Form, { getMetaFromForm: true })
uppy.use(Transloadit, {
  getAssemblyOptions (file) {
    return {
      params: { /* ... */ },
      // Pass through the fields you need:
      fields: {
        message: file.meta.message,
      },
    }
  },
})
```

### `waitForEncoding: false`

By default, the Transloadit plugin uploads files to Assemblies and then marks the files as complete in Uppy. The Assemblies will complete (or error) in the background but Uppy won’t know or care about it.

When `waitForEncoding` is set to true, the Transloadit plugin waits for Assemblies to complete before the files are marked as completed. This means users have to wait for a potentially long time, depending on how complicated your Assembly instructions are. But, you can receive transcoding results on the client side, and have a fully client-side experience this way.

When this is enabled, you can listen for the [`transloadit:result`](#transloadit-result) and [`transloadit:complete`](#transloadit-complete) events.

<a id="waitForMetadata"></a>

### `waitForMetadata: false`

By default, the Transloadit plugin uploads files to Assemblies and then marks the files as complete in Uppy. The Assemblies will complete (or error) in the background but Uppy won’t know or care about it.

When `waitForMetadata` is set to true, the Transloadit plugin waits for Transloadit’s backend to extract metadata from all the uploaded files. This is mostly handy if you want to have a quick user experience (so your users don’t necessarily need to wait for all the encoding to complete), but you do want to let users know about some types of errors that can be caught early on, like file format issues.

When this is enabled, you can listen for the [`transloadit:upload`](#transloadit-upload) event.

### `importFromUploadURLs`

Instead of uploading to Transloadit’s servers directly, allow another plugin to upload files, and then import those files into the Transloadit Assembly. This is set to `false` by default.

When enabling this option, Transloadit will _not_ configure the Tus plugin to upload to Transloadit. Instead, a separate upload plugin must be used. Once the upload completes, the Transloadit plugin adds the uploaded file to the Assembly.

For example, to upload files to an S3 bucket and then transcode them:

```js
uppy.use(AwsS3, {
  getUploadParameters (file) {
    return { /* upload parameters */ }
  },
})
uppy.use(Transloadit, {
  importFromUploadURLs: true,
  params: {
    auth: { key: 'YOUR_API_KEY' },
    template_id: 'YOUR_TEMPLATE_ID',
  },
})
```

For this to work, the upload plugin must assign a publically accessible `uploadURL` property to the uploaded file object. The Tus and S3 plugins both do this automatically. For the XHRUpload plugin, you may have to specify a custom `getResponseData` function.

### `alwaysRunAssembly`

When set to true, always create and run an Assembly when `uppy.upload()` is called, even if no files were selected. This allows running Assemblies that do not receive files, but instead use a robot like [`/s3/import`](https://transloadit.com/docs/transcoding/#s3-import) to download the files from elsewhere, for example, for a bulk transcoding job.

### `locale: {}`

```js
export default {
  strings: {
    // Shown while Assemblies are being created for an upload.
    creatingAssembly: 'Preparing upload...',
    // Shown if an Assembly could not be created.
    creatingAssemblyFailed: 'Transloadit: Could not create Assembly',
    // Shown after uploads have succeeded, but when the Assembly is still executing.
    // This only shows if `waitForMetadata` or `waitForEncoding` was enabled.
    encoding: 'Encoding...',
  },
}
```

### Deprecated options

`getAssemblyOptions`, `params`, `signature`, and `fields`  have been deprecated in favor of [`assemblyOptions`](#assemblyoptions), which we now recommend for all use cases. You can still use these options, but they will be removed in the next major version.

You can view the old docs for them [here](https://github.com/transloadit/uppy/blob/ff32dde1fd71af6dd5cd1927a1408dba36ab5329/website/src/docs/transloadit.md?plain=1).

## Errors

If an error occurs when an Assembly has already started, you can find the Assembly Status on the error object’s `assembly` property.

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

* `assembly` - The initial [Assembly Status][assembly-status].
* `fileIDs` - The IDs of the files that will be uploaded to this Assembly.

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

* `file` - The Transloadit file object that was uploaded.
* `assembly` - The [Assembly Status][assembly-status] of the Assembly to which the file was uploaded.

### `transloadit:assembly-executing`

Fired when Transloadit has received all uploads, and is executing the Assembly.

**Parameters**

* `assembly` - The [Assembly Status](https://transloadit.com/docs/api/#assembly-status-response) of the Assembly that is executing.

### `transloadit:result`

Fired when a result came in from an Assembly.

**Parameters**

* `stepName` - The name of the Assembly step that generated this result.
* `result` - The result object from Transloadit.
  This result object has one more property, namely `localId`.
  This is the ID of the file in Uppy’s local state, and can be used with `uppy.getFile(id)`.
* `assembly` - The [Assembly Status][assembly-status] of the Assembly that generated this result.

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

* `assembly` - The final [Assembly Status][assembly-status] of the completed Assembly.

```js
uppy.on('transloadit:complete', (assembly) => {
  // Could do something fun with this!
  console.log(assembly.results)
})
```

[assembly-status]: https://transloadit.com/docs/api/#assembly-status-response

[template-credentials]: https://transloadit.com/docs/#how-to-create-template-credentials

## Assembly behavior when Uppy is closed

When integrating `@uppy/transloadit` with `@uppy/dashboard`, closing the dashboard will result in continuing assemblies on the server. When the user manually cancels the upload any running assemblies will be cancelled.
