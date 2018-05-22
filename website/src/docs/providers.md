---
title: "Provider Plugins"
type: docs
permalink: docs/providers/
order: 50
---

The Provider plugins help you connect to your accounts with remote file providers such as [Dropbox](https://dropbox.com), [Google Drive](https://drive.google.com), [Instagram](https://instagram.com) and remote urls (import a file by pasting a direct link to it). Because this requires server to server communication, they work tightly with [uppy-server](https://github.com/transloadit/uppy-server) to manage the server to server authorization for your account. Almost all of the communication (file download/upload) is done on the server-to-server end, so this saves you the stress and bills of data consumption on the client.

As of now, the supported providers are [**Dropbox**](/docs/dropbox), [**GoogleDrive**](/docs/google-drive), [**Instagram**](/docs/instagram), and [**Url**](/docs/url).

Usage of the Provider plugins is not that different from any other *acquirer* plugin, except that it takes an extra option `host`, which specifies the url to your running `uppy-server`. This allows Uppy to know what server to connect to when server related operations are required by the provider plugin. Here's a quick example.

```js
const Uppy = require('uppy/lib/core')
const Dashboard = require('uppy/lib/plugins/Dashboard')
const uppy = Uppy()
uppy.use(Dashboard, {
  trigger: '#pick-files'
})

// for Google Drive
const GoogleDrive = require('uppy/lib/plugins/GoogleDrive')
uppy.use(GoogleDrive, {target: Dashboard, host: 'http://localhost:3020'})

// for Dropbox
const Dropbox = require('uppy/lib/plugins/Dropbox')
uppy.use(Dropbox, {target: Dashboard, host: 'http://localhost:3020'})

// for Instagram
const Instagram = require('uppy/lib/plugins/Instagram')
uppy.use(Instagram, {target: Dashboard, host: 'http://localhost:3020'})

// for Url
const Url = require('uppy/lib/plugins/Url')
uppy.use(Url, {target: Dashboard, host: 'http://localhost:3020'})
```
