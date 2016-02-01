import Uppy from 'uppy/core'
import { DragDrop, Tus10 } from 'uppy/plugins'

const uppyOne = new Uppy({autoProceed: true})
uppyOne
  .use(DragDrop, {target: '.UppyDragDrop-One'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  .run()

const uppyTwo = new Uppy()
uppyTwo
  .use(DragDrop, {target: '#UppyDragDrop-Two'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  .run()

console.log(`Uppy ${uppyOne.type} loaded`)
