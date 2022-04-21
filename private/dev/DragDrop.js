// The @uppy/ dependencies are resolved from source
/* eslint-disable import/no-extraneous-dependencies */
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import DragDrop from '@uppy/drag-drop'
import ProgressBar from '@uppy/progress-bar'
/* eslint-enable import/no-extraneous-dependencies */

// DEV CONFIG: create a .env file in the project root directory to customize those values.
const {
  VITE_TUS_ENDPOINT : TUS_ENDPOINT,
} = import.meta.env

import.meta.env.VITE_TRANSLOADIT_KEY &&= '***' // to avoid leaking secrets in screenshots.
import.meta.env.VITE_TRANSLOADIT_SECRET &&= '***' // to avoid leaking secrets in screenshots.
console.log(import.meta.env)

export default () => {
  const uppyDragDrop = new Uppy({
    debug: true,
    autoProceed: true,
  })
    .use(DragDrop, {
      target: '#uppyDragDrop',
    })
    .use(ProgressBar, { target: '#uppyDragDrop-progress', hideAfterFinish: false })
    .use(Tus, { endpoint: TUS_ENDPOINT })

  window.uppy = uppyDragDrop

  uppyDragDrop.on('complete', (result) => {
    if (result.failed.length === 0) {
      console.log('Upload successful 😀')
    } else {
      console.warn('Upload failed 😞')
    }
    console.log('successful files:', result.successful)
    console.log('failed files:', result.failed)
  })
}
