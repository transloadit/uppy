import { Uppy } from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Transloadit from '@uppy/transloadit'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

// Environment variables:
// https://en.parceljs.org/env.html
const uppy = new Uppy()
  .use(Dashboard, { target: '#app', inline: true })
  .use(Transloadit, {
    service: process.env.VITE_TRANSLOADIT_SERVICE_URL,
    waitForEncoding: true,
    params: {
      auth: { key: process.env.VITE_TRANSLOADIT_KEY },
      template_id: process.env.VITE_TRANSLOADIT_TEMPLATE,
    },
  })

// Keep this here to access uppy in tests
window.uppy = uppy
