---
type: docs
order: 11
title: "Dropbox"
menu_prefix: "<span title='Requires Companion'>ⓒ </span>"
module: "@uppy/dropbox"
permalink: docs/dropbox/
category: "Sources"
tagline: "import files from Dropbox"
---

The `@uppy/dropbox` plugin lets users import files from their Dropbox account.

A Companion instance is required for the Dropbox plugin to work. Companion handles authentication with Dropbox, downloads the files, and uploads them to the destination. This saves the user bandwidth, especially helpful if they are on a mobile connection.

```js
import Dropbox from '@uppy/dropbox'

uppy.use(Dropbox, {
  // Options
})
```

<a class="TryButton" href="/examples/dashboard/">Try it live</a>

## Installation

This plugin is published as the `@uppy/dropbox` package.

Install from NPM:

```shell
npm install @uppy/dropbox
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const { Dropbox } = Uppy
```

## Setting Up

To use the Dropbox provider, you need to configure the Dropbox keys that Companion should use. With the standalone Companion server, specify environment variables:

```shell
export COMPANION_DROPBOX_KEY="Dropbox API key"
export COMPANION_DROPBOX_SECRET="Dropbox API secret"
```

When using the Companion Node.js API, configure these options:

```js
companion.app({
  providerOptions: {
    dropbox: {
      key: 'Dropbox API key',
      secret: 'Dropbox API secret',
    },
  },
})
```

You can create a Dropbox App on the [Dropbox Developers site](https://www.dropbox.com/developers/apps/create).

Things to note:

*   Choose the "Dropbox API", not the business variant.
*   Typically you'll want "Full Dropbox" access, unless you are very certain that you need the other one.

You'll be redirected to the app page. This page lists the app key and app secret, which you should use to configure Companion as shown above.

The app page has a "Redirect URIs" field. Here, add:

    https://$YOUR_COMPANION_HOST_NAME/dropbox/redirect

You can only use the integration with your own account initially—make sure to apply for production status on the app page before you publish your app, or your users will not be able to sign in!

## CSS

Dashboard plugin is recommended as a container to all Provider plugins, including Dropbox. If you are using Dashboard, it [comes with all the nessesary styles](/docs/dashboard/#CSS) for Dropbox as well.

⚠️ If you are feeling adventurous, and want to use Dropbox plugin separately, without Dashboard, make sure to include `@uppy/provider-views/dist/style.css` (or `style.min.css`) CSS file. This is experimental, not officially supported and not recommended.

## Options

The `@uppy/dropbox` plugin has the following configurable options:

```js
uppy.use(Dropbox, {
  target: Dashboard,
  companionUrl: 'https://companion.uppy.io/',
})
```

### `id: 'Dropbox'`

A unique identifier for this plugin. It defaults to `'Dropbox'`.

### `title: 'Dropbox'`

Title / name shown in the UI, such as Dashboard tabs. It defaults to `'Dropbox'`.

### `target: null`

DOM element, CSS selector, or plugin to mount the Dropbox provider into. This should normally be the [`@uppy/dashboard`](/docs/dashboard) plugin.

### `companionUrl: null`

URL to a [Companion](/docs/companion) instance.

### `companionHeaders: {}`

Custom headers that should be sent along to [Companion](/docs/companion) on every request.

### `companionAllowedHosts: companionUrl`

The valid and authorised URL(s) from which OAuth responses should be accepted.

This value can be a `String`, a `Regex` pattern, or an `Array` of both.

This is useful when you have your [Companion](/docs/companion) running on multiple hosts. Otherwise, the default value should do just fine.

### `companionCookiesRule: 'same-origin'`

This option correlates to the [RequestCredentials value](https://developer.mozilla.org/en-US/docs/Web/API/Request/credentials), which tells the plugin whether or not to send cookies to [Companion](/docs/companion).

### `locale: {}`

Localize text that is shown to the user.

The default English strings are:

```js
const locale = {
  strings: {
    // TODO
  },
}
```
