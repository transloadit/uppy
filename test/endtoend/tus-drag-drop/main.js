require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
const DragDrop = require('@uppy/drag-drop')
const Tus = require('@uppy/tus')
const ProgressBar = require('@uppy/progress-bar')

const isOnTravis = !!(process.env.TRAVIS && process.env.CI)
const endpoint = isOnTravis ? 'http://companion.test:1080' : 'http://localhost:1080'

// Initialise Uppy with Drag & Drop
const uppyDragDrop = new Uppy({
  id: 'uppyDragDrop',
  debug: true,
  autoProceed: true
})

uppyDragDrop
  .use(DragDrop, {
    target: '#uppyDragDrop'
  })
  .use(ProgressBar, { target: '#uppyDragDrop-progress' })
  .use(Tus, { endpoint: `${endpoint}/files/` })
