const Uppy = require('@uppy/core/src')
const Tus = require('@uppy/tus/src')

const DragDrop = require('@uppy/drag-drop/src')
const ProgressBar = require('@uppy/progress-bar/src')

module.exports = () => {
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
}
