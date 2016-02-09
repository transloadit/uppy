import Uppy from 'uppy/core'
import { DragDrop, Progressbar, Tus10 } from 'uppy/plugins'

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

// console.log(`Uppy ${uppyOne.type} loaded`)
