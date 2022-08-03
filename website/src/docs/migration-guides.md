---
title: "Migration guides"
type: docs
permalink: docs/migration-guides
order: 10
category: "Docs"
---

These cover all the major Uppy versions and how to migrate to them.

## Migrate from Uppy 2.x to 3.x

### Uppy is pure ESM

Following the footsteps of many packages, we now only ship Uppy core and its plugins as
[ECMAScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) (ESM).
On Uppy 2.x, we were shipping CommonJS.

If are already using ESM yourself, or are using the CDN builds, nothing changes for you!

If you are using CommonJS, you might need to add some tooling for everything to work, or you might
want to refactor your codebase to ESM – refer to
the [Pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)
gist for added information and help on how to do that.

### Robodog is deprecated

Uppy is flexible and extensible through plugins. But the integration code could sometimes be daunting. This is what brought [Robodog](/docs/robodog/) to life. An alternative with the same features, but with a more ergonomic and minimal API.

But, it didn’t come with its own set of new problems:

* It tries to do the exact same, but it looks like a different product
* It’s confusing for users whether they want to use Robodog or Uppy directly.
* Robodog is more ergonomic because it’s limited. When you hit such a limit, you need to refactor everything to Uppy with plugins.
* Documentation is scarce, and the trade offs are unclear
* It’s not marketed, you need to stumble on it in the docs.
* Extra maintenance burden
* Extra hosting effort and costs

This has now led us to deprecating Robodog and embrace Uppy for its strong suits; modularity and flexibility. At the same time, we also introduced something to take away some repetitive integration code: [`@uppy/remote-sources`](/docs/remote-sources).

To migrate from Robodog to Uppy plugins, go through the [list of plugins](/docs/plugins/) and install and use the ones you need.

### Smaller breaking changes

#### `@uppy/core`

* Remove `AggregateError` polyfill.
  * reason: it’s supported by most modern browsers and [can be polyfilled by the user](https://github.com/transloadit/uppy/pull/3532#discussion_r818602636) if needed.
  * migrate: install a `AggregateError` polyfill or use `core-js`.
* Remove `reset()` method.
  * reason: it’s a duplicate of `cancelAll`, but with a less intention revealing name.
  * migrate: use `cancelAll`.
* Remove backwards compatible exports (static properties on `Uppy`). Exports, such as `debugLogger`, used to also be accesible on the `Uppy` export. This has now been removed.
  * reason: transition to ESM.
  * migrate: import the `Uppy` class by default and/or use named exports for everything else.

#### `@uppy/aws-s3-multipart`

* Make `headers` inside the return value of [`prepareUploadParts`](/docs/aws-s3-multipart/#prepareUploadParts-file-partData) part-indexed too.
  * reason: allow custom headers to be set per part. See this [issue](https://github.com/transloadit/uppy/issues/3881) for details.
  * migrate: make headers part indexed like `presignedUrls`: `{ "headers": { "1": { "Content-MD5": "foo" } }}`.
* Remove `client` getter and setter.
  * reason: internal usage only.
  * migrate: use exposed options only.

#### `@uppy/react`

* Don’t expose `validProps` on the exported components.
  * reason: internal usage only.
  * migrate: use exposed options only.

#### `@uppy/store-redux`

* Remove backwards compatible exports (static properties on `ReduxStore`). Exports, such as `reducer`, used to also be accesible on the `ReduxStore` export. This has now been removed.
  * reason: transition to ESM.
  * migrate: use named imports.

#### `@uppy/thumbnail-generator`

* Remove `rotateImage`, `protect`, and `canvasToBlob` from plugin prototype.
  * reason: internal usage only.
  * migrate: use exposed options only.

## Migrate from Companion 3.x to 4.x

### Minimum required Node.js version is v14.20.0

Aligning with the Node.js [Long Term Support (LTS) schedule](https://nodejs.org/en/about/releases/) and to use modern syntax features.

### `companion.app()` returns `{ app, emitter }` instead of `app`

Companion 3.x provides the emitter as `companionEmitter` on `app`. As of 4.x, an object is returned
with an `app` property (express middleware) and an `emitter` property (event emitter). This
provides more flexibility in the future and follows best practices.

### Removed `searchProviders` wrapper object inside `providerOptions`

To use [`@uppy/unsplash`](/docs/unsplash), you had to configure Unsplash in Companion inside `providerOptions.searchProviders`. This is redundant, Unsplash is a provider as well so we removed the wrapper object.

### Moved the `s3` options out of `providerOptions`

To use AWS S3 for storage, you configured the `s3` object inside `providerOptions`. But as S3 is not a provider but a destination. To avoid confusion we moved the `s3` settings to the root settings object.

### Removed compatibility for legacy Custom Provider implementations

[Custom Provider](https://uppy.io/docs/companion/#Adding-custom-providers)
implementations must use the Promise API. The callback API is no longer supported.

### Default to no ACL for AWS S3

Default to no [ACL](https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html) for S3 uploads. Before the default was `public-read` but AWS now discourages ACLs. The environment variable `COMPANION_AWS_DISABLE_ACL` is also removed, instead Companion only uses `COMPANION_AWS_ACL`.

### `protocol` sent from Uppy in any `get` request is now required (before it would default to Multipart).

If you use any official Uppy plugins, then no migration is needed. For custom plugins that talk to Companion, make to send along the `protocol` header with a value of `multipart`, `s3Multipart`, or `tus`.

### `emitSuccess` and `emitError` are now private methods on the `Uploader` class.

It’s unlikely you’re using this, but it’s technically a breaking change.
In general, don’t depend on implicitly internal methods, use exposed APIs instead.

### Removed `chunkSize` backwards compatibility for AWS S3 Multipart

`chunkSize` option will now be used as `partSize` in AWS multipart. Before only valid values would be respected. Invalid values would be ignored. Now any value will be passed on to the AWS SDK, possibly throwing an error on invalid values.

### Removed backwards compatibility for `/metrics` endpoint

TODO @mifi

## Migrate from Uppy 1.x to 2.x

### New bundle requires manual polyfilling

With 2.0, following in the footsteps of Microsoft, we are dropping support for IE11. As a result, we are able to remove all built-in polyfills, and the new bundle size is **25% smaller**! If you want your app to still support older browsers (such as IE11), you may need to add the following polyfills to your bundle:

* [abortcontroller-polyfill](https://github.com/mo/abortcontroller-polyfill)
* [core-js](https://github.com/zloirock/core-js)
* [md-gum-polyfill](https://github.com/mozdevs/mediaDevices-getUserMedia-polyfill)
* [resize-observer-polyfill](https://github.com/que-etc/resize-observer-polyfill)
* [whatwg-fetch](https://github.com/github/fetch)

If you’re using a bundler, you need import these before Uppy:

```js
import 'core-js'
import 'whatwg-fetch'
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch'
// Order matters here: AbortController needs fetch, which needs Promise (provided by core-js).

import 'md-gum-polyfill'
import ResizeObserver from 'resize-observer-polyfill'

window.ResizeObserver ??= ResizeObserver

export { default } from '@uppy/core'
export * from '@uppy/core'
```

If you’re using Uppy from a CDN, we now provide two bundles: one for up-to-date browsers that do not include polyfills and use modern syntax, and one for legacy browsers. When migrating, be mindful about the types of browsers you want to support:

```html
<!-- Modern browsers (recommended) -->
<script src="https://releases.transloadit.com/uppy/v3.0.0-beta.3/uppy.min.js"></script>

<!-- Legacy browsers (IE11+) -->
<script nomodule src="https://releases.transloadit.com/uppy/v3.0.0-beta.3/uppy.legacy.min.js"></script>
<script type="module">import "https://releases.transloadit.com/uppy/v3.0.0-beta.3/uppy.min.js";</script>
```

Please note that while you may be able to get 2.0 to work in IE11 this way, we do not officially support it anymore.

### Use `BasePlugin` or `UIPlugin` instead of `Plugin`

[`@uppy/core`][core] used to provide a `Plugin` class for creating plugins. This was used for any official plugin, but also for users who want to create their own custom plugin. But, `Plugin` always came bundled with Preact, even if the plugin itself didn’t add any UI elements.

`Plugin` has been replaced with `BasePlugin` and `UIPlugin`. `BasePlugin` is the minimum you need to create a plugin and `UIPlugin` adds Preact for rendering user interfaces.

You can import them from [`@uppy/core`][core]:

```js
import { BasePlugin, UIPlugin } from '@uppy/core'
```

**Note:** some bundlers will include `UIPlugin` (and thus Preact) if you import from `@uppy/core`. To make sure this does not happen, you can import `Uppy` and `BasePlugin` directly:

```js
import Uppy from '@uppy/core/lib/Uppy.js'
import BasePlugin from '@uppy/core/lib/BasePlugin.js'
```

### Use the latest Preact for your Uppy plugins

Official plugins have already been upgraded. If you are using any custom plugins, upgrade Preact to the latest version. At the time of writing this is `10.5.13`.

### Set plugin titles from locales

Titles for plugins used to be set with the `title` property in the plugin options, but all other strings are set in `locale`. This has now been aligned. You should set your plugin title from the `locale` property.

Before

```js
import Webcam from '@uppy/webcam'

uppy.use(Webcam, {
  title: 'Some title',
})
```

After

```js
import Webcam from '@uppy/webcam'

uppy.use(Webcam, {
  locale: {
    strings: {
      title: 'Some title',
    },
  },
})
```

### Initialize Uppy with the `new` keyword

The default export `Uppy` is no longer callable as a function. This means you construct the `Uppy` instance using the `new` keyword.

```js
import Uppy from '@uppy/core'

const uppy = new Uppy() // correct.

const otherUppy = Uppy() // incorrect, will throw.
```

### Rename `allowMultipleUploads` to `allowMultipleUploadBatches`

[`allowMultipleUploadBatches`](https://uppy.io/docs/uppy/#allowMultipleUploadBatches-true) means allowing several calls to [`.upload()`](https://uppy.io/docs/uppy/#uppy-upload), in other words, a user can add more files after already having uploaded some.

<!--retext-simplify ignore multiple-->

We have renamed this to be more intention revealing that this is about uploads, and not whether a user can choose multiple files for one upload.

```js
const uppy = new Uppy({
  allowMultipleUploadBatches: true,
})
```

### New default limits for [`@uppy/xhr-upload`][xhr] and [`@uppy/tus`][tus]

The default limit has been changed from `0` to `5`. Setting this to `0` means no limit on concurrent uploads.

You can change the limit on the Tus and XHR plugin options.

```js
uppy.use(Tus, {
  // ...
  limit: 10,
})
```

```js
uppy.use(XHRUpload, {
  // ...
  limit: 10,
})
```

### TypeScript changes

Uppy used to have loose types by default and strict types as an opt-in. The default export was a function that returned the `Uppy` class, and the types came bundled with the default export (`Uppy.SomeType`).

```ts
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'

const uppy = Uppy<Uppy.StrictTypes>()

uppy.use(Tus, {
  invalidOption: null, // this will make the compilation fail!
})
```

Uppy is now strictly typed by default and loose types have been removed.

```ts
// ...

const uppy = new Uppy()

uppy.use(Tus, {
  invalidOption: null, // this will make the compilation fail!
})
```

Uppy types are now individual exports and should be imported separately.

<!-- eslint-disable @typescript-eslint/no-unused-vars -->

```ts
import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core'
```

#### Event types

[`@uppy/core`][core] provides an [`.on`](/docs/uppy/#uppy-on-39-event-39-action) method to listen to [events](/docs/uppy/#Events). The types for these events were loose and allowed for invalid events to be passed, such as `uppy.on('upload-errrOOOoooOOOOOrrrr')`.

<!-- eslint-disable @typescript-eslint/no-unused-vars -->

```ts
// Before:

type Meta = { myCustomMetadata: string }

// Invalid event
uppy.on<Meta>('upload-errrOOOoooOOOOOrrrr', () => {
  // ...
})

// After:

// Normal event signature
uppy.on('complete', (result) => {
  const successResults = result.successful
})

// Custom signature
type Meta = { myCustomMetadata: string }

// Notice how the custom type has now become the second argument
uppy.on<'complete', Meta>('complete', (result) => {
  // The passed type is now merged into the `meta` types.
  const meta = result.successful[0].meta.myCustomMetadata
})
```

Plugins that add their own events can merge with existing ones in `@uppy/core` with `declare module '@uppy/core' { ... }`. This is a TypeScript pattern called [module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation). For instance, when using [`@uppy/dashboard`][dashboard]:

<!-- eslint-disable @typescript-eslint/no-unused-vars -->

```ts
uppy.on('dashboard:file-edit-state', (file) => {
  const fileName = file.name
})
```

### Changes to pre-signing URLs for [`@uppy/aws-s3-multipart`][aws-s3-multipart]

See the Uppy 2.0.0 announcement post about the batch [pre-signing URLs change](https://uppy.io/blog/2021/08/2.0/#Batch-pre-signing-URLs-for-AWS-S3-Multipart).

`prepareUploadPart` has been renamed to [`prepareUploadParts`](https://uppy.io/docs/aws-s3-multipart/#prepareUploadParts-file-partData) (plural). See the documentation link on how to use this function.

### Removed the `.run` method from [`@uppy/core`][core]

The `.run` method on the `Uppy` instance has been removed. This method was already obsolete and only logged a warning. As of this major version, it no longer exists.

### Removed `resume` and `removeFingerprintOnSuccess` options from [`@uppy/tus`][tus]

Tus will now by default try to resume uploads if the upload has been started in the past.

This also means tus will store some data in localStorage for each upload, which will automatically be removed on success. Making `removeFingerprintOnSuccess` obsolete too.

### That’s it!

Uppy 1.0 will continue to receive bug fixes for three more months (until <time datetime="2021-12-01">1 December 2021</time>), security fixes for one more year (until <time datetime="2022-09-01">1 September 2022</time>), but no more new features after today. Exceptions are unlikely, but _can_ be made – to accommodate those with commercial support contracts, for example.

We hope you’ll waste no time in taking Uppy 2.0 out for a walk. When you do, please let us know what you thought of it on [Reddit](https://www.reddit.com/r/javascript/comments/penbr7/uppy_file_uploader_20_smaller_and_faster_modular/), [HN](https://news.ycombinator.com/item?id=28359287), ProductHunt, or [Twitter](https://twitter.com/uppy_io/status/1432399270846603264). We’re howling at the moon to hear from you!

## Migrate from Companion 1.x to 2.x

### Prerequisite

Since v2, you now need to be running `node.js >= v10.20.1` to use Companion.

### ProviderOptions

In v2 the `google` and `microsoft` [providerOptions](https://uppy.io/docs/companion/#Options) have been changed to `drive` and `onedrive` respectively.

### OAuth Redirect URIs

On your Providers’ respective developer platforms, the OAuth redirect URIs that you should supply has now changed from:

`http(s)://$COMPANION_HOST_NAME/connect/$AUTH_PROVIDER/callback` in v1

to:

`http(s)://$COMPANION_HOST_NAME/$PROVIDER_NAME/redirect` in v2

#### New Redirect URIs

<div class="table-responsive">

| Provider | New Redirect URI
|-|-|
| Dropbox | `https://$COMPANION_HOST_NAME/dropbox/redirect` |
| Google Drive | `https://$COMPANION_HOST_NAME/drive/redirect` |
| OneDrive | `https://$COMPANION_HOST_NAME/onedrive/redirect` |
| Box | `https://$YOUR_COMPANION_HOST_NAME/box/redirect` |
| Facebook | `https://$COMPANION_HOST_NAME/facebook/redirect` |
| Instagram | `https://$COMPANION_HOST_NAME/instagram/redirect` |

</div>

<!-- definitions -->

[core]: /docs/uppy/

[xhr]: /docs/xhr-upload/

[dashboard]: /docs/dashboard/

[aws-s3-multipart]: /docs/aws-s3-multipart/

[tus]: /docs/tus/
