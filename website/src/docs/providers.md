---
title: "Provider Plugins"
type: docs
permalink: docs/providers/
order: 10
category: 'Sources'
---

The Provider plugins help you connect to your accounts with remote file providers such as [Dropbox](https://dropbox.com), [Google Drive](https://drive.google.com), [Instagram](https://instagram.com) and remote URLs (importing a file by pasting a direct link to it). Because this requires server-to-server communication, they work tightly with [Companion](https://github.com/transloadit/companion) to manage the server-to-server authorization for your account. Almost all of the communication (file download/upload) is done on the server-to-server end, so this saves you the stress and bills of data consumption on the client.

As of now, the supported providers are [**Dropbox**](/docs/dropbox), [**GoogleDrive**](/docs/google-drive), [**Instagram**](/docs/instagram), and [**URL**](/docs/url).

Usage of the Provider plugins is not that different from any other *acquirer* plugin, except that it takes an extra option `serverUrl`, which specifies the URL to the Companion that you are running. This allows Uppy to know what server to connect to when datacenter operations are required by the provider plugin.

Here's a quick example:

```js
const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboaord')
const uppy = Uppy()
uppy.use(Dashboard, {
  trigger: '#pick-files'
})

// for Google Drive
const GoogleDrive = require('@uppy/google-drive')
uppy.use(GoogleDrive, {target: Dashboard, serverUrl: 'http://localhost:3020'})

// for Dropbox
const Dropbox = require('@uppy/dropbox')
uppy.use(Dropbox, {target: Dashboard, serverUrl: 'http://localhost:3020'})

// for Instagram
const Instagram = require('@uppy/instagram')
uppy.use(Instagram, {target: Dashboard, serverUrl: 'http://localhost:3020'})

// for URL
const Url = require('@uppy/url')
uppy.use(Url, {target: Dashboard, serverUrl: 'http://localhost:3020'})
```

⚠️ The [Dashboard](/docs/dashboard) plugin is recommended as a universal container to all Provider plugins. It also comes with file previews, progress reporting and more. If you are using the Dashboard, it already [comes with all the nessesary styles](/docs/dashboard/#CSS) and functionality for Providers to work well.

If you are feeling adventurous, you can technically use a Provider plugin separately, without the Dashboard. Make sure to then include `@uppy/provider-views/dist/style.css` (or `style.min.css`) CSS file. But this is experimental, not officialy supported and not recommended.
