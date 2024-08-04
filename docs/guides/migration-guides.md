# Migration guides

These cover all the major Uppy versions and how to migrate to them.

## Migrate from Companion 4.x to 5.x

- End-of-Life versions of Node.js are no longer supported (use latest 18.x LTS,
  20.x LTS, or 22.x current).
- Setting the `corsOrigin` (`COMPANION_CLIENT_ORIGINS`) option is now required.
  You should define the list of origins you expect your app to be served from,
  otherwise it can be impersonated from a different origin you don’t control.
  Set it to `true` if you don’t care about impersonating.
- `COMPANION_REDIS_EXPRESS_SESSION_PREFIX` now defaults to `companion-session:`
  (before `sess:`). To revert keep backwards compatibility, set the environment
  variable `COMPANION_REDIS_EXPRESS_SESSION_PREFIX=sess:`.
- The URL endpoint (used by the `Url`/`Link` plugin) is now turned off by
  default and must be explicitly enabled with
  `COMPANION_ENABLE_URL_ENDPOINT=true` or `enableUrlEndpoint: true`.
- The option `streamingUpload` / `COMPANION_STREAMING_UPLOAD` now defaults to
  `true`.
- The option `getKey(req, filename, metadata)` has changed signature to
  `getKey({ filename, metadata, req })`.
- The option `bucket(req, metadata)` has changed signature to
  `bucketOrFn({ req, metadata, filename })`.
- Custom provider breaking changes. If you have not implemented a custom
  provider, you should not be affected.
  - The static `getExtraConfig` property has been renamed to
    `getExtraGrantConfig`.
  - The static `authProvider` property has been renamed to `oauthProvider`.
- Endpoint `GET /s3/params` now returns `{ method: "POST" }` instead of
  `{ method: "post" }`. This will not affect most people.
- `access-control-allow-headers` is no longer included in
  `Access-Control-Expose-Headers`, and `uppy-versions` is no longer an allowed
  header. We are not aware of any issues this might cause.
- Internal refactoring (probably won’t affect you)
  - `getProtectedGot` parameter `blockLocalIPs` changed to `allowLocalIPs`
    (inverted boolean).
  - `getURLMeta` 2nd (boolean) argument inverted.
  - `getProtectedHttpAgent` parameter `blockLocalIPs` changed to `allowLocalIPs`
    (inverted boolean).
  - `downloadURL` 2nd (boolean) argument inverted.
  - `StreamHttpJsonError` renamed to `HttpError`.
- Removed the `oauthOrigin` option, as well as the (undocumented) option
  `clients`. Use `corsOrigin` instead.

### `@uppy/companion-client`

:::info

Unless you built a custom provider, you don’t use `@uppy/companion-client`
directly but through provider plugins such as `@uppy/google-drive`. In which
case you don’t have to do anything.

:::

- `supportsRefreshToken` now defaults to `false` instead of `true`. If you have
  implemented a custom provider, this might affect you.
- `Socket` class is no longer in use and has been removed. Unless you used this
  class you don’t need to do anything.
- Remove deprecated options `serverUrl` and `serverPattern` (they were merely
  defined in Typescript, not in use).
- `RequestClient` methods `get`, `post`, `delete` no longer accepts a boolean as
  the third argument. Instead, pass `{ skipPostResponse: true | false }`. This
  won’t affect you unless you’ve been using `RequestClient`.
- When pausing uploads, the WebSocket towards companion will no longer be
  closed. This allows paused uploads to be cancelled, but once a file has been
  paused it will still occupy its place in the concurrency queue.

## Migrate from Uppy 3.x to 4.x

### TypeScript rewrite

Almost all plugins have been completely rewritten in TypeScript! This means you
may run into type error all over the place, but the types now accurately show
Uppy’s state and files.

There are too many small changes to cover, so you have to upgrade and see where
TypeScript complains.

One important thing to note are the new generics on `@uppy/core`.

<!-- eslint-disable @typescript-eslint/no-unused-vars -->

<!-- eslint-disable @typescript-eslint/no-non-null-assertion -->

```ts
import Uppy from '@uppy/core';
// xhr-upload is for uploading to your own backend.
import XHRUpload from '@uppy/xhr-upload';

// Your own metadata on files
type Meta = { myCustomMetadata: string };
// The response from your server
type Body = { someThingMyBackendReturns: string };

const uppy = new Uppy<Meta, Body>().use(XHRUpload, {
	endpoint: '/upload',
});

const id = uppy.addFile({
	name: 'example.jpg',
	data: new Blob(),
	meta: { myCustomMetadata: 'foo' },
});

// This is now typed
const { myCustomMetadata } = uppy.getFile(id).meta;

await uppy.upload();

// This is strictly typed too
const { someThingMyBackendReturns } = uppy.getFile(id).response.body!;
```

### `@uppy/aws-s3` and `@uppy/aws-s3-multipart`

- `@uppy/aws-s3` and `@uppy/aws-s3-multipart` have been combined into a single
  plugin. You should now only use `@uppy/aws-s3` with the new option,
  [`shouldUseMultipart()`](/docs/aws-s3-multipart/#shouldusemultipartfile), to
  allow you to switch between regular and multipart uploads. You can read more
  about this in the
  [plugin docs](https://uppy.io/docs/aws-s3-multipart/#when-should-i-use-it).
- Remove deprecated `prepareUploadParts` option.
- Companion’s options (`companionUrl`, `companionHeaders`, and
  `companionCookieRules`) are renamed to more generic names (`endpoint`,
  `headers`, and `cookieRules`).

  Using Companion with the `@uppy/aws-s3` plugin only makes sense if you already
  need Companion for remote providers (such as Google Drive). When using your
  own backend, you can let Uppy do all the heavy lifting on the client which it
  would normally do for Companion, so you don’t have to implement that yourself.

  As long as you return the JSON for the expected endpoints (see our
  [server example](https://github.com/transloadit/uppy/blob/main/examples/aws-nodejs/index.js)),
  you only need to set `endpoint`.

  If you are using Companion, rename the options. If you have a lot of
  client-side complexity (`createMultipartUpload`, `signPart`, etc), consider
  letting Uppy do this for you.

### `@uppy/core`

- The `close()` method has been renamed to `destroy()` to more accurately
  reflect you can not recover from it without creating a new `Uppy` instance.
- The `clearUploadedFiles()` method has been renamed to `clear()` as a
  convenience method to clear all the state. This can be useful when a user
  navigates away and you want to clear the state on success.
- `bytesUploaded`, in `file.progress.bytesUploaded`, is now always a `boolean`,
  instead of a `boolean` or `number`.

### `@uppy/xhr-upload`

Before the plugin had the options `getResponseData`, `getResponseError`,
`validateStatus` and `responseUrlFieldName`. These were inflexible and too
specific. Now we have hooks similar to `@uppy/tus`:

- `onBeforeRequest` to manipulate the request before it is sent.
- `shouldRetry` to determine if a request should be retried. By default 3
  retries with exponential backoff. After three attempts it will throw an error,
  regardless of whether you returned `true`.
- `onAfterResponse` called after a successful response but before Uppy resolves
  the upload.

Checkout the [docs](/docs/xhr-upload/) for more info.

### `@uppy/transloadit`

The options `signature`, `params`, `fields`, and `getAssemblyOptions` have been
removed in favor of [`assemblyOptions`](/docs/transloadit/#assemblyoptions),
which can be an object or an (async) function returning an object.

When using `assemblyOptions()` as a function, it is now called only once for all
files, instead of per file. Before `@uppy/transloadit` was trying to be too
smart, creating multiple assemblies in which each assembly has files with
identical `fields`. This was done so you can use `fields` dynamically in your
template per file, instead of per assembly.

Now we sent all metadata of a file inside the tus upload (which
`@uppy/transloadit` uses under the hood) and make it accessible in your
Transloadit template as `file_user_meta`. You should use `fields` for global
values in your template and `file_user_meta` for per file values.

Another benefit of running `assemblyOptions()` only once, is that when
generating a
[secret](https://transloadit.com/docs/topics/signature-authentication/) on your
server (which you should), a network request is made only once for all files,
instead of per file.

### CDN

- We no longer build and serve the legacy build, made for IE11, on our CDN.

### Miscellaneous

- All uploaders plugins now consistently use
  [`allowedMetaFields`](/docs/xhr-upload/#allowedmetafields). Before there were
  inconsistencies between plugins.
- All plugin `titles` (what you see in the Dashboard when you open a plugin) are
  now set from the `locale` option. See the
  [docs](/docs/locales/#overriding-locale-strings-for-a-specific-plugin) on how
  to overide a string.

### `@uppy/angular`

- Upgrade to Angular 18.x (17.x is still supported too) and to TS 5.4

### `@uppy/react`

- Remove deprecated `useUppy`
- You can no longer set `inline` on the `Dashboard` component, use `Dashboard`
  or `DashboardModal` components respectively.

### `@uppy/svelte`

- Make Svelte 5 the peer dependency
- Remove UMD output

### `@uppy/vue`

- Migrate to Composition API with TypeScript & drop Vue 2 support
- Drop Vue 2 support

## Migrate from Robodog to Uppy plugins

Uppy is flexible and extensible through plugins. But the integration code could
sometimes be daunting. This is what brought Robodog to life. An alternative with
the same features, but with a more ergonomic and minimal API.

But, it didn’t come with its own set of new problems:

- It tries to do the exact same, but it looks like a different product.
- It’s confusing for users whether they want to use Robodog or Uppy directly.
- Robodog is more ergonomic because it’s limited. When you hit such a limit, you
  need to refactor everything to Uppy with plugins.

This has now led us to deprecating Robodog and embrace Uppy for its strong
suits; modularity and flexibility. At the same time, we also introduced
something to take away some repetitive integration code:
[`@uppy/remote-sources`](/docs/remote-sources).

To mimic the Robodog implementation with all its features, you can use the code
snippet below. But chances are Robodog did more than you need so feel free to
remove things or go through the [list of plugins](/docs/companion/) and install
and use the ones you need.

You can also checkout how we migrated the Robodog example ourselves in this
[commit](https://github.com/transloadit/uppy/commit/089aaed615c77bafaf905e291b6b4e82aaeb2f6f).

```js
import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import RemoteSources from '@uppy/remote-sources';
import Webcam from '@uppy/webcam';
import ScreenCapture from '@uppy/screen-capture';
import GoldenRetriever from '@uppy/golden-retriever';
import ImageEditor from '@uppy/image-editor';
import Audio from '@uppy/audio';
import Transloadit, {
	COMPANION_URL,
	COMPANION_ALLOWED_HOSTS,
} from '@uppy/transloadit';

import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import '@uppy/audio/dist/style.css';
import '@uppy/screen-capture/dist/style.css';
import '@uppy/image-editor/dist/style.css';

new Uppy()
	.use(Dashboard, {
		inline: true,
		target: '#app',
		showProgressDetails: true,
		proudlyDisplayPoweredByUppy: true,
	})
	.use(RemoteSources, {
		companionUrl: COMPANION_URL,
		companionAllowedHosts: COMPANION_ALLOWED_HOSTS,
	})
	.use(Webcam, {
		showVideoSourceDropdown: true,
		showRecordingLength: true,
	})
	.use(Audio, {
		showRecordingLength: true,
	})
	.use(ScreenCapture)
	.use(ImageEditor)
	.use(Transloadit, {
		service: 'https://api2.transloadit.com',
		async getAssemblyOptions(file) {
			// This is where you configure your auth key, auth secret, and template ID
			// /uppy/docs/transloadit/#getAssemblyOptions-file
			//
			// It is important to set the secret in production:
			// https://transloadit.com/docs/topics/signature-authentication/
			const response = await fetch('/some-endpoint');
			return response.json();
		},
	});
```

## Migrate from Uppy 2.x to 3.x

### Uppy is pure ESM

Following the footsteps of many packages, we now only ship Uppy core and its
plugins as
[ECMAScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
(ESM). On Uppy 2.x, we were shipping CommonJS.

If are already using ESM yourself, or are using the CDN builds, nothing changes
for you!

If you are using CommonJS, you might need to add some tooling for everything to
work, or you might want to refactor your codebase to ESM – refer to the
[Pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)
gist for added information and help on how to do that.

### Robodog is deprecated

See the [Robodog migration guide](#Migrate-from-Robodog-to-Uppy-plugins).

### `@uppy/core`

#### Remove `AggregateError` polyfill.

It’s supported by most modern browsers and
[can be polyfilled by the user](https://github.com/transloadit/uppy/pull/3532#discussion_r818602636)
if needed.

To migrate: install a `AggregateError` polyfill or use `core-js`.

#### Remove `reset()` method.

It’s a duplicate of `cancelAll`, but with a less intention revealing name.

To migrate: use `cancelAll`.

#### Remove backwards compatible exports (static properties on `Uppy`)\`

`Uppy`, `UIPlugin`, `BasePlugin`, and `debugLogger` used to also be accessible
on the `Uppy` export. This has now been removed due to the transition to ESM.

To migrate: import the `Uppy` class by default and/or use named exports for
everything else.

#### `uppy.validateRestrictions()` now returns a `RestrictionError`

This method used to return `{ result: false, reason: err.message }`, but that
felt strange as it tries to mimic an error. Instead it now return a
`RestrictionError`, which is extended `Error` class.

To migrate: check the return value, if it’s defined you have an error, otherwise
all went well. Note that the error is `return`’ed, it’s not `throw`’n, so you
don’t have to `catch` it.

### `@uppy/transloadit`

Remove export of `ALLOWED_COMPANION_PATTERN`, `COMPANION`, and
`COMPANION_PATTERN` in favor of `COMPANION_URL` and `COMPANION_ALLOWED_HOSTS`.
This is to have more intention revealing names, `COMPANION` sounds like the
Companion instance, `COMPANION_URL` makes it more clear that it’s a URL.

These are properties can now be imported and used for remote sources plugins
when using Transloadit:

```js
import { COMPANION_URL, COMPANION_ALLOWED_HOSTS } from '@uppy/transloadit';

// ...
uppy.use(Dropbox, {
	companionUrl: COMPANION_URL,
	companionAllowedHosts: COMPANION_ALLOWED_HOSTS,
});
```

### `@uppy/aws-s3-multipart`

#### Make `headers` inside the return value of [`prepareUploadParts`](/docs/aws-s3-multipart/#prepareUploadParts-file-partData) part-indexed too.

This is to allow custom headers to be set per part. See this
[issue](https://github.com/transloadit/uppy/issues/3881) for details.

To migrate: make headers part indexed like `presignedUrls`:
`{ "headers": { "1": { "Content-MD5": "foo" } }}`.

#### Remove `client` getter and setter.

It’s internal usage only.

To migrate: use exposed options only.

### `@uppy/tus/`, `@uppy/aws-s3`, `@uppy/xhr-upload`

Rename `metaFields` option to `allowedMetaFields`. Counter intuitively,
`metaFields` is for _filtering_ which `metaFields` to send along with the
request, not for adding extra meta fields to a request. As a lot of people were
confused by this, and the name overlaps with the
[`metaFields` option from Dashboard](/docs/dashboard/#metaFields), we renamed
it.

To migrate: use `allowedMetaFields`.

### `@uppy/react`

#### Uppy dependencies have become peer dependencies

`@uppy/dashboard`, `@uppy/drag-drop`, `@uppy/file-input`, `@uppy/progress-bar`,
and `@uppy/status-bar` are now peer dependencies. This means you don’t install
all these packages if you only need one.

To migrate: install only the packages you need. If you use the Dashboard
component, you need `@uppy/dashboard`, and so onwards.

#### Don’t expose `validProps` on the exported components.

It’s internal usage only.

To migrate: use exposed options only.

### `@uppy/svelte`

`@uppy/dashboard`, `@uppy/drag-drop`, `@uppy/progress-bar`, and
`@uppy/status-bar` are now peer dependencies. This means you don’t install all
these packages if you only need one.

To migrate: install only the packages you need. If you use the Dashboard
component, you need `@uppy/dashboard`, and so onwards.

### `@uppy/vue`

`@uppy/dashboard`, `@uppy/drag-drop`, `@uppy/file-input`, `@uppy/progress-bar`,
and `@uppy/status-bar` are now peer dependencies. This means you don’t install
all these packages if you only need one.

To migrate: install only the packages you need. If you use the Dashboard
component, you need `@uppy/dashboard`, and so onwards.

### `@uppy/store-redux`

Remove backwards compatible exports (static properties on `ReduxStore`).
Exports, such as `reducer`, used to also be accessible on the `ReduxStore`
export. This has now been removed due to the transition to ESM.

To migrate: use named imports.

### `@uppy/thumbnail-generator`

Remove `rotateImage`, `protect`, and `canvasToBlob` from the plugin prototype.
They are internal usage only.

To migrate: use exposed options only.

### Known issues

- [`ERESOLVE could not resolve` on npm install](https://github.com/transloadit/uppy/issues/4057).
- [@uppy/svelte reports a broken dependency with the Vite bundler](https://github.com/transloadit/uppy/issues/4069).

## Migrate from Companion 3.x to 4.x

### Minimum required Node.js version is v14.20.0

Aligning with the Node.js
[Long Term Support (LTS) schedule](https://nodejs.org/en/about/releases/) and to
use modern syntax features.

### `companion.app()` returns `{ app, emitter }` instead of `app`

Companion 3.x provides the emitter as `companionEmitter` on `app`. As of 4.x, an
object is returned with an `app` property (express middleware) and an `emitter`
property (event emitter). This provides more flexibility in the future and
follows best practices.

### Removed `searchProviders` wrapper object inside `providerOptions`

To use [`@uppy/unsplash`](/docs/unsplash), you had to configure Unsplash in
Companion inside `providerOptions.searchProviders`. This is redundant, Unsplash
is a provider as well so we removed the wrapper object.

### Moved the `s3` options out of `providerOptions`

To use AWS S3 for storage, you configured the `s3` object inside
`providerOptions`. But as S3 is not a provider but a destination. To avoid
confusion we moved the `s3` settings to the root settings object.

### Removed compatibility for legacy Custom Provider implementations

[Custom Provider](/docs/companion/#Adding-custom-providers) implementations must
use the Promise API. The callback API is no longer supported.

### Default to no ACL for AWS S3

Default to no
[ACL](https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html)
for S3 uploads. Before the default was `public-read` but AWS now discourages
ACLs. The environment variable `COMPANION_AWS_DISABLE_ACL` is also removed,
instead Companion only uses `COMPANION_AWS_ACL`.

### `protocol` sent from Uppy in any `get` request is now required (before it would default to Multipart).

If you use any official Uppy plugins, then no migration is needed. For custom
plugins that talk to Companion, make to send along the `protocol` header with a
value of `multipart`, `s3Multipart`, or `tus`.

### `emitSuccess` and `emitError` are now private methods on the `Uploader` class.

It’s unlikely you’re using this, but it’s technically a breaking change. In
general, don’t depend on implicitly internal methods, use exposed APIs instead.

### Removed `chunkSize` backwards compatibility for AWS S3 Multipart

`chunkSize` option will now be used as `partSize` in AWS multipart. Before only
valid values would be respected. Invalid values would be ignored. Now any value
will be passed on to the AWS SDK, possibly throwing an error on invalid values.

### Removed backwards compatibility for `/metrics` endpoint

The `metrics` option is a boolean flag to tell Companion whether to provide an
endpoint `/metrics` with Prometheus metrics. Metrics will now always be served
under `options.server.path`. Before v4.x, it would always be served under the
root.

For example: if `{ options: { metrics: true, server: { path: '/companion' }}}`,
metrics will now be served under `/companion/metrics`. In v3.x, the metrics
would be served under `/metrics`.

## Migrate from Uppy 1.x to 2.x

### New bundle requires manual polyfilling

With 2.0, following in the footsteps of Microsoft, we are dropping support for
IE11. As a result, we are able to remove all built-in polyfills, and the new
bundle size is **25% smaller**! If you want your app to still support older
browsers (such as IE11), you may need to add the following polyfills to your
bundle:

- [abortcontroller-polyfill](https://github.com/mo/abortcontroller-polyfill)
- [core-js](https://github.com/zloirock/core-js)
- [md-gum-polyfill](https://github.com/mozdevs/mediaDevices-getUserMedia-polyfill)
- [resize-observer-polyfill](https://github.com/que-etc/resize-observer-polyfill)
- [whatwg-fetch](https://github.com/github/fetch)

If you’re using a bundler, you need import these before Uppy:

```js
import 'core-js';
import 'whatwg-fetch';
import 'abortcontroller-polyfill/dist/polyfill-patch-fetch';
// Order matters here: AbortController needs fetch, which needs Promise (provided by core-js).

import 'md-gum-polyfill';
import ResizeObserver from 'resize-observer-polyfill';

window.ResizeObserver ??= ResizeObserver;

export { default } from '@uppy/core';
export * from '@uppy/core';
```

If you’re using Uppy from a CDN, we now provide two bundles: one for up-to-date
browsers that do not include polyfills and use modern syntax, and one for legacy
browsers. When migrating, be mindful about the types of browsers you want to
support:

```html
<!-- Modern browsers (recommended) -->
<script src="https://releases.transloadit.com/uppy/v3.17.0/uppy.min.js"></script>

<!-- Legacy browsers (IE11+) -->
<script
	nomodule
	src="https://releases.transloadit.com/uppy/v3.17.0/uppy.legacy.min.js"
></script>
<script type="module">
	import 'https://releases.transloadit.com/uppy/v3.17.0/uppy.min.js';
</script>
```

Please note that while you may be able to get 2.0 to work in IE11 this way, we
do not officially support it anymore.

### Use `BasePlugin` or `UIPlugin` instead of `Plugin`

[`@uppy/core`][core] used to provide a `Plugin` class for creating plugins. This
was used for any official plugin, but also for users who want to create their
own custom plugin. But, `Plugin` always came bundled with Preact, even if the
plugin itself didn’t add any UI elements.

`Plugin` has been replaced with `BasePlugin` and `UIPlugin`. `BasePlugin` is the
minimum you need to create a plugin and `UIPlugin` adds Preact for rendering
user interfaces.

You can import them from [`@uppy/core`][core]:

```js
import { BasePlugin, UIPlugin } from '@uppy/core';
```

**Note:** some bundlers will include `UIPlugin` (and thus Preact) if you import
from `@uppy/core`. To make sure this does not happen, you can import `Uppy` and
`BasePlugin` directly:

```js
import Uppy from '@uppy/core/lib/Uppy.js';
import BasePlugin from '@uppy/core/lib/BasePlugin.js';
```

### Use the latest Preact for your Uppy plugins

Official plugins have already been upgraded. If you are using any custom
plugins, upgrade Preact to the latest version. At the time of writing this is
`10.5.13`.

### Set plugin titles from locales

Titles for plugins used to be set with the `title` property in the plugin
options, but all other strings are set in `locale`. This has now been aligned.
You should set your plugin title from the `locale` property.

Before

```js
import Webcam from '@uppy/webcam';

uppy.use(Webcam, {
	title: 'Some title',
});
```

After

```js
import Webcam from '@uppy/webcam';

uppy.use(Webcam, {
	locale: {
		strings: {
			title: 'Some title',
		},
	},
});
```

### Initialize Uppy with the `new` keyword

The default export `Uppy` is no longer callable as a function. This means you
construct the `Uppy` instance using the `new` keyword.

```js
import Uppy from '@uppy/core';

const uppy = new Uppy(); // correct.

const otherUppy = Uppy(); // incorrect, will throw.
```

### Rename `allowMultipleUploads` to `allowMultipleUploadBatches`

[`allowMultipleUploadBatches`](/docs/uppy/#allowmultipleuploadbatches) means
allowing several calls to [`.upload()`](/docs/uppy/#upload), in other words, a
user can add more files after already having uploaded some.

<!--retext-simplify ignore multiple-->

We have renamed this to be more intention revealing that this is about uploads,
and not whether a user can choose multiple files for one upload.

```js
const uppy = new Uppy({
	allowMultipleUploadBatches: true,
});
```

### New default limits for [`@uppy/xhr-upload`][xhr] and [`@uppy/tus`][tus]

The default limit has been changed from `0` to `5`. Setting this to `0` means no
limit on concurrent uploads.

You can change the limit on the Tus and XHR plugin options.

```js
uppy.use(Tus, {
	// ...
	limit: 10,
});
```

```js
uppy.use(XHRUpload, {
	// ...
	limit: 10,
});
```

### TypeScript changes

Uppy used to have loose types by default and strict types as an opt-in. The
default export was a function that returned the `Uppy` class, and the types came
bundled with the default export (`Uppy.SomeType`).

```ts
import Uppy from '@uppy/core';
import Tus from '@uppy/tus';

const uppy = Uppy<Uppy.StrictTypes>();

uppy.use(Tus, {
	invalidOption: null, // this will make the compilation fail!
});
```

Uppy is now strictly typed by default and loose types have been removed.

```ts
// ...

const uppy = new Uppy();

uppy.use(Tus, {
	invalidOption: null, // this will make the compilation fail!
});
```

Uppy types are now individual exports and should be imported separately.

<!-- eslint-disable @typescript-eslint/no-unused-vars -->

```ts
import type { PluginOptions, UIPlugin, PluginTarget } from '@uppy/core';
```

#### Event types

[`@uppy/core`][core] provides an [`.on`](/docs/uppy/#uppy-on-39-event-39-action)
method to listen to [events](/docs/uppy/#Events). The types for these events
were loose and allowed for invalid events to be passed, such as
`uppy.on('upload-errrOOOoooOOOOOrrrr')`.

<!-- eslint-disable @typescript-eslint/no-unused-vars -->

```ts
// Before:

type Meta = { myCustomMetadata: string };

// Invalid event
uppy.on<Meta>('upload-errrOOOoooOOOOOrrrr', () => {
	// ...
});

// After:

// Normal event signature
uppy.on('complete', (result) => {
	const successResults = result.successful;
});

// Custom signature
type Meta = { myCustomMetadata: string };

// Notice how the custom type has now become the second argument
uppy.on<'complete', Meta>('complete', (result) => {
	// The passed type is now merged into the `meta` types.
	const meta = result.successful[0].meta.myCustomMetadata;
});
```

Plugins that add their own events can merge with existing ones in `@uppy/core`
with `declare module '@uppy/core' { ... }`. This is a TypeScript pattern called
[module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation).
For instance, when using [`@uppy/dashboard`][dashboard]:

<!-- eslint-disable @typescript-eslint/no-unused-vars -->

```ts
uppy.on('dashboard:file-edit-start', (file) => {
	const fileName = file.name;
});
```

### Changes to pre-signing URLs for [`@uppy/aws-s3-multipart`][aws-s3-multipart]

See the Uppy 2.0.0 announcement post about the batch
[pre-signing URLs change](/blog/2021/08/2.0/#Batch-pre-signing-URLs-for-AWS-S3-Multipart).

`prepareUploadPart` has been renamed to
[`prepareUploadParts`](/docs/aws-s3-multipart/#prepareUploadParts-file-partData)
(plural). See the documentation link on how to use this function.

### Removed the `.run` method from [`@uppy/core`][core]

The `.run` method on the `Uppy` instance has been removed. This method was
already obsolete and only logged a warning. As of this major version, it no
longer exists.

### Removed `resume` and `removeFingerprintOnSuccess` options from [`@uppy/tus`][tus]

Tus will now by default try to resume uploads if the upload has been started in
the past.

This also means tus will store some data in localStorage for each upload, which
will automatically be removed on success. Making `removeFingerprintOnSuccess`
obsolete too.

### That’s it!

Uppy 1.0 will continue to receive bug fixes for three more months (until
<time datetime="2021-12-01">1 December 2021</time>), security fixes for one more
year (until <time datetime="2022-09-01">1 September 2022</time>), but no more
new features after today. Exceptions are unlikely, but _can_ be made – to
accommodate those with commercial support contracts, for example.

We hope you’ll waste no time in taking Uppy 2.0 out for a walk. When you do,
please let us know what you thought of it on
[Reddit](https://www.reddit.com/r/javascript/comments/penbr7/uppy_file_uploader_20_smaller_and_faster_modular/),
[HN](https://news.ycombinator.com/item?id=28359287), ProductHunt, or
[Twitter](https://twitter.com/uppy_io/status/1432399270846603264). We’re howling
at the moon to hear from you!

## Migrate from Companion 1.x to 2.x

### Prerequisite

Since v2, you now need to be running `node.js >= v10.20.1` to use Companion.

### ProviderOptions

In v2 the `google` and `microsoft` [providerOptions](/docs/companion/#Options)
have been changed to `drive` and `onedrive` respectively.

### OAuth Redirect URIs

On your Providers’ respective developer platforms, the OAuth redirect URIs that
you should supply has now changed from:

`http(s)://$COMPANION_HOST_NAME/connect/$AUTH_PROVIDER/callback` in v1

to:

`http(s)://$COMPANION_HOST_NAME/$PROVIDER_NAME/redirect` in v2

#### New Redirect URIs

<div class="table-responsive">

| Provider      | New Redirect URI                                     |
| ------------- | ---------------------------------------------------- |
| Dropbox       | `https://$COMPANION_HOST_NAME/dropbox/redirect`      |
| Google Drive  | `https://$COMPANION_HOST_NAME/drive/redirect`        |
| Google Photos | `https://$COMPANION_HOST_NAME/googlephotos/redirect` |
| OneDrive      | `https://$COMPANION_HOST_NAME/onedrive/redirect`     |
| Box           | `https://$YOUR_COMPANION_HOST_NAME/box/redirect`     |
| Facebook      | `https://$COMPANION_HOST_NAME/facebook/redirect`     |
| Instagram     | `https://$COMPANION_HOST_NAME/instagram/redirect`    |

</div>

<!-- definitions -->

[core]: /docs/uppy/
[xhr]: /docs/xhr-upload/
[dashboard]: /docs/dashboard/
[aws-s3-multipart]: /docs/aws-s3-multipart/
[tus]: /docs/tus/
