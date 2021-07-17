---
title: "Provider Plugins"
type: docs
permalink: docs/providers/
order: 10
category: "Sources"
---

The Provider plugins help you connect to your accounts with remote file providers such as [Dropbox](https://dropbox.com), [Google Drive](https://drive.google.com), [Instagram](https://instagram.com) and remote URLs (importing a file by pasting a direct link to it). Because this requires server-to-server communication, they work tightly with [Companion](https://github.com/transloadit/uppy/tree/master/packages/%40uppy/companion) to manage the server-to-server authorization for your account. Almost all of the communication (file download/upload) is done on the server-to-server end, so this saves you the stress and bills of data consumption on the client.

As of now, the supported providers are [**Dropbox**](/docs/dropbox), [**Google Drive**](/docs/google-drive), [**OneDrive**](/docs/onedrive/), [**Box**](/docs/box/), [**Instagram**](/docs/instagram), [**Facebook**](/docs/facebook/), [**Zoom**](/docs/zoom/) and [**URL**](/docs/url).

Usage of the Provider plugins is not that different from any other *acquirer* plugin, except that it takes an extra option `companionUrl`, which specifies the URL to the Companion that you are running. This allows Uppy to know what server to connect to when datacenter operations are required by the provider plugin.

Here's a quick example:

<!-- eslint-disable import/first, import/newline-after-import -->

```js
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
const uppy = new Uppy()
uppy.use(Dashboard, {
  trigger: '#pick-files',
})

// for Google Drive
import GoogleDrive from '@uppy/google-drive'
uppy.use(GoogleDrive, { target: Dashboard, companionUrl: 'http://localhost:3020' })

// for Dropbox
import Dropbox from '@uppy/dropbox'
uppy.use(Dropbox, { target: Dashboard, companionUrl: 'http://localhost:3020' })

// for Instagram
import Instagram from '@uppy/instagram'
uppy.use(Instagram, { target: Dashboard, companionUrl: 'http://localhost:3020' })

// for URL
import Url from '@uppy/url'
uppy.use(Url, { target: Dashboard, companionUrl: 'http://localhost:3020' })
```

⚠️ The [Dashboard](/docs/dashboard) plugin is recommended as a universal container to all Provider plugins. It also comes with file previews, progress reporting and more. If you are using the Dashboard, it already [comes with all the nessesary styles](/docs/dashboard/#CSS) and functionality for Providers to work well.

If you are feeling adventurous, you can technically use a Provider plugin separately, without the Dashboard. Make sure to then include `@uppy/provider-views/dist/style.css` (or `style.min.css`) CSS file. But this is experimental, not officialy supported and not recommended.
