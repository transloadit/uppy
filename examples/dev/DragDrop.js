const Uppy = require('./../../packages/@uppy/core/src')
const Tus = require('./../../packages/@uppy/tus/src')

const DragDrop = require('./../../packages/@uppy/drag-drop/src')
const ProgressBar = require('./../../packages/@uppy/progress-bar/src')

const uppyDragDrop = Uppy({
  debug: true,
  autoProceed: true
})
  .use(DragDrop, {
    target: '#uppyDragDrop'
  })
  .use(ProgressBar, { target: '#uppyDragDrop-progress', hideAfterFinish: false })
  .use(Tus, { endpoint: 'https://master.tus.io/files/' })

uppyDragDrop.on('complete', (result) => {
  if (result.failed.length === 0) {
    console.log('Upload successful 😀')
  } else {
    console.warn('Upload failed 😞')
  }
  console.log('successful files:', result.successful)
  console.log('failed files:', result.failed)
})
