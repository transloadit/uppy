// import Uppy from 'uppy/core'
// import { DragDrop, Progressbar, Tus10 } from 'uppy/plugins'
import Uppy from '../../../../src/core/Core.js'
import DragDrop from '../../../../src/plugins/DragDrop.js'
import Progressbar from '../../../../src/plugins/Progressbar.js'
import Tus10 from '../../../../src/plugins/Tus10.js'

const uppyOne = new Uppy({autoProceed: true, debug: true})
uppyOne
  .use(DragDrop, {target: '.UppyDragDrop-One'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  .use(Progressbar, {target: '.UppyDragDrop-One .UppyDragDrop-progress'})
  .run()

const uppyTwo = new Uppy({debug: true})
uppyTwo
  .use(DragDrop, {target: '#UppyDragDrop-Two'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  .use(Progressbar, {target: '#UppyDragDrop-Two .UppyDragDrop-progress'})
  .run()
