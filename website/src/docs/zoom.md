---
type: docs
order: 13
title: "Zoom"
menu_prefix: "<span title='Requires Companion'>ⓒ </span>"
module: "@uppy/zoom"
permalink: docs/zoom/
category: "Sources"
tagline: "import files from Zoom"
---

The `@uppy/zoom` plugin lets users import files from their Zoom account.

A Companion instance is required for the `@uppy/zoom` plugin to work. Companion handles authentication with Zoom, downloads the pictures and videos, and uploads them to the destination. This saves the user bandwidth, especially helpful if they are on a mobile connection.

```js
import Zoom from '@uppy/zoom'

uppy.use(Zoom, {
  // Options
})
```

<a class="TryButton" href="/examples/dashboard/">Try it live</a>

## Installation

This plugin is published as the `@uppy/zoom` package.

Install from NPM:

```shell
npm install @uppy/zoom
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const { Zoom } = Uppy
```

## CSS

Dashboard plugin is recommended as a container to all Provider plugins, including Zoom. If you are using Dashboard, it [comes with all the necessary styles](/docs/dashboard/#CSS) for Zoom as well.

⚠️ If you are feeling adventurous, and want to use Zoom plugin separately, without Dashboard, make sure to include `@uppy/provider-views/dist/style.css` (or `style.min.css`) CSS file. This is experimental, not officially supported and not recommended.

## Options

The `@uppy/zoom` plugin has the following configurable options:

```js
uppy.use(Zoom, {
  target: Dashboard,
  companionUrl: 'https://companion.uppy.io/',
})
```

### `id: 'Zoom'`

A unique identifier for this plugin. It defaults to `'Zoom'`.

### `title: 'Zoom'`

Configures the title / name shown in the UI, for instance, on Dashboard tabs. It defaults to `'Zoom'`.

### `target: null`

DOM element, CSS selector, or plugin to mount the Zoom provider into. This should normally be the [`@uppy/dashboard`](/docs/dashboard) plugin.

### `companionUrl: null`

URL to a [Companion](/docs/companion) instance.

### `companionHeaders: {}`

Custom headers that should be sent along to [Companion](/docs/companion) on every request.

### `companionAllowedHosts: companionUrl`

The valid and authorised URL(s) from which OAuth responses should be accepted.

This value can be a `String`, a `Regex` pattern, or an `Array` of both.

This is useful when you have your [Companion](/docs/companion) running on multiple hosts. Otherwise, the default value should be good enough.

### `companionCookiesRule: 'same-origin'`

This option correlates to the [RequestCredentials value](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials), which tells the plugin whether or not to send cookies to [Companion](/docs/companion).

### `locale: {}`

Localize text that is shown to the user.

The default English strings are:

```js
const strings = {
  // TODO
}
```

## Zoom Marketplace

If you are a Zoom account owner and you are looking to enable the Transloadit Add-on into your Zoom account, please see the sections below.

### Install Transloadit Zoom Add-on

To enable the Transloadit Add-on on your Zoom account please visit the Transloadit App on the [Zoom Marketplace](https://marketplace.zoom.us/apps/oBMBQjN6SSakyh7OiLZMdA) and click the "Install" button.

### Uninstall via Marketplace

1.  Go to the Transloadit App on the [Zoom Marketplace](https://marketplace.zoom.us/apps/oBMBQjN6SSakyh7OiLZMdA)
2.  Click the “Manage” tab
3.  Scroll to the bottom of the page and click the “Uninstall” button
