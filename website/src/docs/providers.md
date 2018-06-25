---
title: "Provider Plugins"
type: docs
permalink: docs/providers/
order: 50
---

The Provider plugins help you connect to your accounts with remote file providers such as [Dropbox](https://dropbox.com), [Google Drive](https://drive.google.com), [Instagram](https://instagram.com) and remote urls (import a file by pasting a direct link to it). Because this requires server to server communication, they work tightly with [uppy-server](https://github.com/transloadit/uppy-server) to manage the server to server authorization for your account. Almost all of the communication (file download/upload) is done on the server-to-server end, so this saves you the stress and bills of data consumption on the client.

As of now, the supported providers are [**Dropbox**](/docs/dropbox), [**GoogleDrive**](/docs/google-drive), [**Instagram**](/docs/instagram), and [**Url**](/docs/url).

Usage of the Provider plugins is not that different from any other *acquirer* plugin, except that it takes an extra option `serverUrl`, which specifies the url to your running `uppy-server`. This allows Uppy to know what server to connect to when server related operations are required by the provider plugin. Here's a quick example.

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

// for Url
const Url = require('@uppy/url')
uppy.use(Url, {target: Dashboard, serverUrl: 'http://localhost:3020'})
```
