// The @uppy/ dependencies are resolved from source
import Uppy from '@uppy/core'
import Dashboard from '@uppy/dashboard'
import Tus from '@uppy/tus'

// DEV CONFIG: create a .env file in the project root directory to customize those values.
const { VITE_TUS_ENDPOINT: TUS_ENDPOINT } = import.meta.env

import.meta.env.VITE_TRANSLOADIT_KEY &&= '***' // to avoid leaking secrets in screenshots.
import.meta.env.VITE_TRANSLOADIT_SECRET &&= '***' // to avoid leaking secrets in screenshots.
console.log(import.meta.env)

export default () => {
  const uppyDashboard = new Uppy({
    debug: true,
    autoProceed: false,
  })
    .use(Dashboard, {
      target: '#uppyDragDrop',
      inline: true,
    })
    .use(Tus, { endpoint: TUS_ENDPOINT })

  window.uppy = uppyDashboard

  uppyDashboard.on('complete', (result) => {
    if (result.failed.length === 0) {
      console.log('Upload successful 😀')
    } else {
      console.warn('Upload failed 😞')
    }
    console.log('successful files:', result.successful)
    console.log('failed files:', result.failed)
  })
}
