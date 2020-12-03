---
type: docs
order: 11
title: "Box"
menu_prefix: "<span title='Requires Companion'>ⓒ </span>"
module: "@uppy/box"
permalink: docs/box/
category: "Sources"
tagline: "import files from Box"
---

The `@uppy/box` plugin lets users import files from their Box account.

A Companion instance is required for the Box plugin to work. Companion handles authentication with Box, downloads the files, and uploads them to the destination. This saves the user bandwidth, especially helpful if they are on a mobile connection.

```js
const Box = require('@uppy/box')

uppy.use(Box, {
  // Options
})
```

<a class="TryButton" href="/examples/dashboard/">Try it live</a>

## Installation

This plugin is published as the `@uppy/box` package.

Install from NPM:

```shell
npm install @uppy/box
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const Box = Uppy.Box
```

## Setting Up

To use the Box provider, you need to configure the Box keys that Companion should use. With the standalone Companion server, specify environment variables:
```shell
export COMPANION_BOX_KEY="Box API key"
export COMPANION_BOX_SECRET="Box API secret"
```

When using the Companion Node.js API, configure these options:
```js
companion.app({
  providerOptions: {
    box: {
      key: 'Box API key',
      secret: 'Box API secret'
    }
  }
})
```

You can create a Box App on the [Box Developers site](https://app.box.com/developers/console).

Things to note:
- Choose "Custom App" and select the "Standard OAuth 2.0 (User Authentication)" app type.

You'll be redirected to the app page. This page lists the client ID (app key) and client secret (app secret), which you should use to configure Companion as shown above.

The app page has a "Redirect URIs" field. Here, add:
```
https://$YOUR_COMPANION_HOST_NAME/box/redirect
```

You can only use the integration with your own account initially—make sure to apply for production status on the app page before you publish your app, or your users will not be able to sign in!

## CSS

Dashboard plugin is recommended as a container to all Provider plugins, including Box. If you are using Dashboard, it [comes with all the nessesary styles](/docs/dashboard/#CSS) for Box as well.

⚠️ If you are feeling adventurous, and want to use Box plugin separately, without Dashboard, make sure to include `@uppy/provider-views/dist/style.css` (or `style.min.css`) CSS file. This is experimental, not officially supported and not recommended.

## Options

The `@uppy/box` plugin has the following configurable options:

```js
uppy.use(Box, {
  target: Dashboard,
  companionUrl: 'https://companion.uppy.io/',
})
```

### `id: 'Box'`

A unique identifier for this plugin. It defaults to `'Box'`.

### `title: 'Box'`

Title / name shown in the UI, such as Dashboard tabs. It defaults to `'Box'`.

### `target: null`

DOM element, CSS selector, or plugin to mount the Box provider into. This should normally be the [`@uppy/dashboard`](/docs/dashboard) plugin.

### `companionUrl: null`

URL to a [Companion](/docs/companion) instance.

### `companionHeaders: {}`

Custom headers that should be sent along to [Companion](/docs/companion) on every request.

### `companionAllowedHosts: companionUrl`

The valid and authorised URL(s) from which OAuth responses should be accepted.

This value can be a `String`, a `Regex` pattern, or an `Array` of both.

This is useful when you have your [Companion](/docs/companion) running on multiple hosts. Otherwise, the default value should do just fine.

### `locale: {}`

Localize text that is shown to the user.

The default English strings are:

```js
strings: {
  // TODO
}
```
