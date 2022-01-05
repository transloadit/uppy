// The @uppy/ dependencies are resolved from source
/* eslint-disable import/no-extraneous-dependencies */
import Uppy from '@uppy/core'
import Tus from '@uppy/tus'
import DragDrop from '@uppy/drag-drop'
import ProgressBar from '@uppy/progress-bar'
/* eslint-enable import/no-extraneous-dependencies */

export default () => {
  const uppyDragDrop = new Uppy({
    debug: true,
    autoProceed: true,
  })
    .use(DragDrop, {
      target: '#uppyDragDrop',
    })
    .use(ProgressBar, { target: '#uppyDragDrop-progress', hideAfterFinish: false })
    .use(Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })

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
