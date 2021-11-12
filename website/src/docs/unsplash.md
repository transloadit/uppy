---
type: docs
order: 14
title: "Unsplash"
menu_prefix: "<span title='Requires Companion'>ⓒ </span>"
module: "@uppy/unsplash"
permalink: docs/unsplash/
category: "Sources"
tagline: "import images from Unsplash"
---

The `@uppy/unsplash` plugin lets users search and select photos from Unsplash.

A Companion instance is required for the Unsplash plugin to work. Companion handles authentication with Unsplash, downloads the files, and uploads them to the destination. This saves the user bandwidth, especially helpful if they are on a mobile connection.

```js
import Uppy from '@uppy/core'
import Unsplash from '@uppy/unsplash'

const uppy = new Uppy()

uppy.use(Unsplash, {
  // Options
})
```

<a class="TryButton" href="/examples/dashboard/">Try it live</a>

## Installation

This plugin is published as the `@uppy/unsplash` package.

Install from NPM:

```shell
npm install @uppy/unsplash
```

In the [CDN package](/docs/#With-a-script-tag), the plugin class is available on the `Uppy` global object:

```js
const { Unsplash } = Uppy
```

## Setting Up

To use the Unsplash provider, you need to configure the Unsplash keys that Companion should use. With the standalone Companion server, specify environment variables:

```shell
export COMPANION_UNSPLASH_KEY="Unsplash API key"
export COMPANION_UNSPLASH_SECRET="Unsplash API secret"
```

When using the Companion Node.js API, configure these options:

```js
companion.app({
  providerOptions: {
    unsplash: {
      key: 'Unsplash API key',
      secret: 'Unsplash API secret',
    },
  },
})
```

You can create a Unsplash App on the [Unsplash Developers site](https://unsplash.com/developers).

You’ll be redirected to the app page. This page lists the app key and app secret, which you should use to configure Companion as shown above.

## CSS

Dashboard plugin is recommended as a container to all Provider plugins, including Unsplash. If you are using Dashboard, it [comes with all the nessesary styles](/docs/dashboard/#CSS) for Unsplash as well.

⚠️ If you are feeling adventurous, and want to use Unsplash plugin separately, without Dashboard, make sure to include `@uppy/provider-views/dist/style.css` (or `style.min.css`) CSS file. This is experimental, not officially supported and not recommended.

## Options

The `@uppy/dropbox` plugin has the following configurable options:

```js
uppy.use(Unsplash, {
  target: Dashboard,
  companionUrl: 'https://companion.uppy.io/',
})
```

### `id: 'Unsplash'`

A unique identifier for this plugin. It defaults to `'Unsplash'`.

### `title: 'Unsplash'`

Title / name shown in the UI, such as Dashboard tabs. It defaults to `'Unsplash'`.

### `target: null`

DOM element, CSS selector, or plugin to mount the Unsplash provider into. This should normally be the [`@uppy/dashboard`](/docs/dashboard) plugin.

### `companionUrl: null`

URL to a [Companion](/docs/companion) instance.

### `companionHeaders: {}`

Custom headers that should be sent along to [Companion](/docs/companion) on every request.

### `companionAllowedHosts: companionUrl`

The valid and authorised URL(s) from which OAuth responses should be accepted.

This value can be a `String`, a `Regex` pattern, or an `Array` of both.

This is useful when you have your [Companion](/docs/companion) running on several hosts. Otherwise, the default value should do fine.

### `companionCookiesRule: 'same-origin'`

This option correlates to the [RequestCredentials value](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials), which tells the plugin whether to send cookies to [Companion](/docs/companion).
