import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import ImageEditor from '@uppy/image-editor'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const uppy = new Uppy()
  .use(Dashboard, { target: '#app', inline: true })
  .use(ImageEditor, { target: Dashboard })

// Keep this here to access uppy in tests
window.uppy = uppy
