require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
const DragDrop = require('@uppy/drag-drop')
const Tus = require('@uppy/tus')
const ProgressBar = require('@uppy/progress-bar')

// Initialise Uppy with Drag & Drop
const uppyDragDrop = Uppy({
  id: 'uppyDragDrop',
  debug: true,
  autoProceed: true
})

uppyDragDrop
  .use(DragDrop, {
    target: '#uppyDragDrop'
  })
  .use(ProgressBar, { target: '#uppyDragDrop-progress' })
  .use(Tus, { endpoint: 'https://master.tus.io/files/' })
