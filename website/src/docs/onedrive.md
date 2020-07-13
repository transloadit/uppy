---
type: docs
order: 13
title: "OneDrive"
menu_prefix: "<span title='Requires Companion'>ⓒ </span>"
module: "@uppy/onedrive"
permalink: docs/onedrive/
category: "Sources"
tagline: "import files from OneDrive"
---

The `@uppy/onedrive` plugin lets users import files from their OneDrive account.

A Companion instance is required for the `@uppy/onedrive` plugin to work. Companion handles authentication with OneDrive, downloads the pictures and videos, and uploads them to the destination. This saves the user bandwidth, especially helpful if they are on a mobile connection.

```js
const OneDrive = require('@uppy/onedrive')

uppy.use(OneDrive, {
  // Options
})
```

<a class="TryButton" href="/examples/dashboard/">Try it live</a>

## Installation

> If you are using the `uppy` package, you do not need to install this plugin manually.

This plugin is published as the `@uppy/onedrive` package.

Install from NPM:

```shell
npm install @uppy/onedrive
```

## CSS

Dashboard plugin is recommended as a container to all Provider plugins, including OneDrive. If you are using Dashboard, it [comes with all the necessary styles](/docs/dashboard/#CSS) for OneDrive as well.

⚠️ If you are feeling adventurous, and want to use OneDrive plugin separately, without Dashboard, make sure to include `@uppy/provider-views/dist/style.css` (or `style.min.css`) CSS file. This is experimental, not officialy supported and not recommended.

## Options

The `@uppy/onedrive` plugin has the following configurable options:

```js
uppy.use(OneDrive, {
  target: Dashboard,
  companionUrl: 'https://companion.uppy.io/',
})
```

### `id: 'OneDrive'`

A unique identifier for this plugin. It defaults to `'OneDrive'`.

### `title: 'OneDrive'`

Configures the title / name shown in the UI, for instance, on Dashboard tabs. It defaults to `'OneDrive'`.

### `target: null`

DOM element, CSS selector, or plugin to mount the OneDrive provider into. This should normally be the Dashboard.

### `companionUrl: null`

URL to a [Companion](/docs/companion) instance.

### `companionHeaders: {}`

Custom headers that should be sent along to [Companion](/docs/companion) on every request.

### `companionAllowedHosts: companionUrl`

The valid and authorised URL(s) from which OAuth responses should be accepted.

This value can be a `String`, a `Regex` pattern, or an `Array` of both.

This is useful when you have your [Companion](/docs/companion) running on multiple hosts. Otherwise, the default value should be good enough.

### `locale: {}`

Localize text that is shown to the user.

The default English strings are:

```js
strings: {
  // TODO
}
```
