import Uppy from 'uppy/core'
import { DragDrop, Progress, Tus10 } from 'uppy/plugins'

const uppyOne = new Uppy({autoProceed: true, debug: true})
uppyOne
  .use(Progress)
  .use(DragDrop, {target: '.UppyDragDrop-One'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/', progress: '#UppyDragDrop-Two'})
  .run()

// const uppyTwo = new Uppy({debug: true})
// uppyTwo
//   .use(DragDrop, {target: '#UppyDragDrop-Two'})
//   .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/', progress: '#UppyDragDrop-Two'})
//   .run()

// console.log(`Uppy ${uppyOne.type} loaded`)
