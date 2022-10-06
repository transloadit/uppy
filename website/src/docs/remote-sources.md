---
type: docs
order: 10
title: "Remote Sources"
module: "@uppy/remote-sources"
permalink: docs/remote-sources/
category: "Miscellaneous"
tagline: "Uppy plugin that includes all remote sources that Uppy+Companion offer, like Instagram, Google Drive, Dropox, Box, Unsplash, Url etc"
---

`@uppy/remote-sources` is a preset plugin to add all the available remote sources, such Instagram, Google Drive, Dropbox, and others to Uppy Dashboard in one package.

> Note: Remote Sources requires Dashboard and automatically installs all its plugins to it.

```js
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import RemoteSources from '@uppy/remote-sources'

const uppy = new Uppy()
uppy.use(Dashboard)
uppy.use(RemoteSources, {
  companionUrl: 'https://your-companion-url',
})
```

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

A unique identifier for this plugin (`string`, default: `RemoteSources`).

### `sources`

List of remote sources that will be enabled (`array`, default: `['Box', 'Dropbox', 'Facebook', 'GoogleDrive','Instagram', 'OneDrive', 'Unsplash', 'Url', 'Zoom']`).

You don’t need to specify them manually or change them, but if you want to alter the order in which they appear in the Dashboard, or disable some sources, this option is for you.

```js
uppy.use(RemoteSources, {
  companionUrl: 'https://your-companion-url',
  sources: ['Instagram', 'GoogleDrive', 'Unsplash', 'Url'],
})
```

### `companionUrl`

URL to a [Companion](/docs/companion) instance (`string`, default: `null`).

### `companionHeaders`

Custom headers that should be sent along to [Companion](/docs/companion) on every request (`object`, default: `{}`).

### `companionAllowedHosts`

The valid and authorized URL(s) from which OAuth responses should be accepted (`string | RegExp | Array<string | RegExp>`, Default: `companionUrl`)

This value can be a `String`, a `Regex` pattern, or an `Array` of both.

This is useful when you have your [Companion](/docs/companion) running on several hosts. Otherwise, the default value, which is `companionUrl`, should do fine.

### `companionCookiesRule`

This option correlates to the [RequestCredentials value](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials), which tells the plugin whether to send cookies to [Companion](/docs/companion) (`string`, default: `same-origin`).
