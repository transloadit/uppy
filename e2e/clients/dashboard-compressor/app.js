import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Compressor from '@uppy/compressor'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const uppy = new Uppy()
  .use(Dashboard, {
    target: document.body,
    inline: true,
  })
  .use(Compressor, {
    mimeType: 'image/webp',
  })

// Keep this here to access uppy in tests
window.uppy = uppy
