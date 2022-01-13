import { Uppy } from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Tus from '@uppy/tus'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const uppy = new Uppy()
  .use(Dashboard, { target: '#app', inline: true })
  .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files' })

// Keep this here to access uppy in tests
window.uppy = uppy
