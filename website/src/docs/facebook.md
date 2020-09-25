---
type: docs
order: 13
title: "Facebook"
menu_prefix: "<span title='Requires Companion'>ⓒ </span>"
module: "@uppy/facebook"
permalink: docs/facebook/
category: "Sources"
tagline: "import files from Facebook"
---

The `@uppy/facebook` plugin lets users import files from their Facebook account.

A Companion instance is required for the `@uppy/facebook` plugin to work. Companion handles authentication with Facebook, downloads the pictures and videos, and uploads them to the destination. This saves the user bandwidth, especially helpful if they are on a mobile connection.

```js
const Facebook = require('@uppy/facebook')

uppy.use(Facebook, {
  // Options
})
```

<a class="TryButton" href="/examples/dashboard/">Try it live</a>

## Installation

> If you are using the `uppy` package, you do not need to install this plugin manually.

This plugin is published as the `@uppy/facebook` package.

Install from NPM:

```shell
npm install @uppy/facebook
```

## CSS

Dashboard plugin is recommended as a container to all Provider plugins, including Facebook. If you are using Dashboard, it [comes with all the necessary styles](/docs/dashboard/#CSS) for Facebook as well.

⚠️ If you are feeling adventurous, and want to use Facebook plugin separately, without Dashboard, make sure to include `@uppy/provider-views/dist/style.css` (or `style.min.css`) CSS file. This is experimental, not officially supported and not recommended.

## Options

The `@uppy/facebook` plugin has the following configurable options:

```js
uppy.use(Facebook, {
  target: Dashboard,
  companionUrl: 'https://companion.uppy.io/',
})
```

### `id: 'Facebook'`

A unique identifier for this plugin. It defaults to `'Facebook'`.

### `title: 'Facebook'`

Configures the title / name shown in the UI, for instance, on Dashboard tabs. It defaults to `'Facebook'`.

### `target: null`

DOM element, CSS selector, or plugin to mount the Facebook provider into. This should normally be the [`@uppy/dashboard`](/docs/dashboard) plugin.

### `companionUrl: null`

URL to a [Companion](/docs/companion) instance.

### `companionHeaders: {}`

Custom headers that should be sent along to [Companion](/docs/companion) on every request.

### `credentials: 'same-origin'`

The `credentials` setting for requests [Companion](/docs/companion). Allowed values are 'omit', 'same-origin' (the default), and 'include'.

### `companionAllowedHosts: companionUrl`

The valid and authorized URL(s) from which OAuth responses should be accepted.

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
