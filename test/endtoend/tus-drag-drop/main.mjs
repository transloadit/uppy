import Uppy from '@uppy/core'
import DragDrop from '@uppy/drag-drop'
import Tus from '@uppy/tus'
import ProgressBar from '@uppy/progress-bar'

// const endpoint = 'http://localhost:1080'
const endpoint = 'https://tusd.tusdemo.net'

// Initialise Uppy with Drag & Drop
const uppyDragDrop = new Uppy({
  id: 'uppyDragDrop',
  debug: true,
  autoProceed: true,
})

uppyDragDrop
  .use(DragDrop, {
    target: '#uppyDragDrop',
  })
  .use(ProgressBar, { target: '#uppyDragDrop-progress' })
  .use(Tus, { endpoint: `${endpoint}/files/` })
