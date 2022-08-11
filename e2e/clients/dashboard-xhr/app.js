import { Uppy } from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import XHRUpload from '@uppy/xhr-upload'
import Unsplash from '@uppy/unsplash'
import Url from '@uppy/url'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const companionUrl = 'http://localhost:3020'
const uppy = new Uppy()
  .use(Dashboard, { target: '#app', inline: true })
  .use(XHRUpload, { endpoint: 'https://xhr-server.herokuapp.com/upload', limit: 6 })
  .use(Url, { target: Dashboard, companionUrl })
  .use(Unsplash, { target: Dashboard, companionUrl })

// Keep this here to access uppy in tests
window.uppy = uppy
