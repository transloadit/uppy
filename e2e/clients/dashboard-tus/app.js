import { Uppy } from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Tus from '@uppy/tus'
import Unsplash from '@uppy/unsplash'
import Url from '@uppy/url'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const companionUrl = process.env.COMPANION_URL
const uppy = new Uppy()
  .use(Dashboard, { target: '#app', inline: true })
  .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files' })
  .use(Url, { target: Dashboard, companionUrl })
  .use(Unsplash, { target: Dashboard, companionUrl })

// Keep this here to access uppy in tests
window.uppy = uppy
