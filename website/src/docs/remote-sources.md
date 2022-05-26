---
type: docs
order: 10
title: "Remote Sources"
module: "@uppy/remote-sources"
permalink: docs/remote-sources/
category: "Miscellaneous"
tagline: "Uppy plugin that includes all remote sources that Uppy+Companion offer, like Instagram, Google Drive, Dropox, Box, Unsplash, Url etc"
---

Remote Sources plugin makes it convinient to add all the available remote sources — Instagram, Google Drive, Unsplash, Url, etc — to Uppy Dashboard in one convinient package.

> Note: Remote Sources requires Dashboard and automatically installs all its plugins to it.

```js
import Uppy from '@uppy/core'
import Dashbaord from '@uppy/dashboard'
import RemoteSources from '@uppy/compressor'

const uppy = new Uppy()
uppy.use(Dashboard)
uppy.use(RemoteSources, {
  companionUrl: 'https://your-companion-url',
})
```

You can possible to control which plugins will be used and the order they appear in the Dashboard, see below for `sources` option. All Companion-related options, such as `companionUrl`, are passed to the underlining plugins.

## Installation

This plugin is published as the `@uppy/remote-sources` package.

```shell
npm install @uppy/remote-sources
```

In the [CDN package](/docs/#With-a-script-tag), the plugin class is available on the `Uppy` global object:

```js
const { RemoteSources } = Uppy
```

## Options

### `id`

* Type: `string`
* Default: `RemoteSources`

A unique identifier for this plugin.

### `sources`

* Type: `array`
* Default: `['Box', 'Dropbox', 'Facebook', 'GoogleDrive','Instagram', 'OneDrive', 'Unsplash', 'Url']`

List of remote sources that will be enabled. You don’t need to specify them manually or change them, but if you want to alter the order in which they appear in the Dashboard, or disable some sources, this option is for you.

```js
uppy.use(RemoteSources, {
  companionUrl: 'https://your-companion-url',
  sources: ['Instagram', 'GoogleDrive', 'Unsplash', 'Url'],
})
```

### `companionUrl`

* Type: `string`
* Default: `null`

URL to a [Companion](/docs/companion) instance.

### `companionHeaders`

* Type: `object`
* Default: `{}`

Custom headers that should be sent along to [Companion](/docs/companion) on every request.

### `companionAllowedHosts`

* Type: `string | RegExp | Array<string | RegExp>`
* Default: `companionUrl`

The valid and authorised URL(s) from which OAuth responses should be accepted.

This value can be a `String`, a `Regex` pattern, or an `Array` of both.

This is useful when you have your [Companion](/docs/companion) running on several hosts. Otherwise, the default value, which is `companionUrl`, should do fine.

### `companionCookiesRule`

* Type: `string`
* Default: `same-origin`

This option correlates to the [RequestCredentials value](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials), which tells the plugin whether to send cookies to [Companion](/docs/companion).
