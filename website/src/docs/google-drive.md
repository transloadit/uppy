---
type: docs
order: 12
title: "Google Drive"
menu_prefix: "<span title='Requires Companion'>ⓒ </span>"
module: "@uppy/google-drive"
permalink: docs/google-drive/
category: "Sources"
tagline: "import files from Google Drive"
---

The `@uppy/google-drive` plugin lets users import files from their Google Drive account.

A Companion instance is required for the `@uppy/google-drive` plugin to work. Companion handles authentication with Google, downloads files from the Drive and uploads them to the destination. This saves the user bandwidth, especially helpful if they are on a mobile connection.

```js
import GoogleDrive from '@uppy/google-drive'

uppy.use(GoogleDrive, {
  // Options
})
```

<a class="TryButton" href="/examples/dashboard/">Try it live</a>

## Installation

This plugin is published as the `@uppy/google-drive` package.

Install from NPM:

```shell
npm install @uppy/google-drive
```

In the [CDN package](/docs/#With-a-script-tag), it is available on the `Uppy` global object:

```js
const { GoogleDrive } = Uppy
```

## Setting  Up

To use the Google Drive provider, you need to configure the Google Drive keys that Companion should use. With the standalone Companion server, specify environment variables:

```shell
export COMPANION_GOOGLE_KEY="Google Drive OAuth client ID"
export COMPANION_GOOGLE_SECRET="Google Drive OAuth client secret"
```

When using the Companion Node.js API, configure these options:

```js
companion.app({
  providerOptions: {
    drive: {
      key: 'Google Drive OAuth client ID',
      secret: 'Google Drive OAuth client secret',
    },
  },
})
```

To sign up for API keys, go to the [Google Developer Console](https://console.developers.google.com/).

Create a project for your app if you don't have one yet.

*   On the project's dashboard, [enable the Google Drive API](https://developers.google.com/drive/api/v3/enable-drive-api).
*   [Set up OAuth authorization](https://developers.google.com/drive/api/v3/about-auth). Use this for an authorized redirect URI:
    https://$YOUR_COMPANION_HOST_NAME/drive/redirect

Google will give you an OAuth client ID and client secret. Use them to configure Companion as shown above.

## CSS

Dashboard plugin is recommended as a container to all Provider plugins, including Google Drive. If you are using Dashboard, it [comes with all the necessary styles](/docs/dashboard/#CSS) for Google Drive as well.

⚠️ If you are feeling adventurous, and want to use Google Drive plugin separately, without Dashboard, make sure to include `@uppy/provider-views/dist/style.css` (or `style.min.css`) CSS file. This is experimental, not officialy supported and not recommended.

## Options

The `@uppy/google-drive` plugin has the following configurable options:

```js
uppy.use(GoogleDrive, {
  target: Dashboard,
  companionUrl: 'https://companion.uppy.io/',
})
```

### `id: 'GoogleDrive'`

A unique identifier for this plugin. It defaults to `'GoogleDrive'`.

### `title: 'Google Drive'`

Configures the title / name shown in the UI, for instance, on Dashboard tabs. It defaults to `'Google Drive'`.

### `target: null`

DOM element, CSS selector, or plugin to mount the Google Drive provider into. This should normally be the [`@uppy/dashboard`](/docs/dashboard) plugin.

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
const locale = {
  strings:{
    // TODO
  },
}
```
