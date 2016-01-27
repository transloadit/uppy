import Uppy from 'uppy/core'
import { DragDrop, Tus10 } from 'uppy/plugins'

const uppy = new Uppy({wait: false})
uppy
  .use(DragDrop, {target: '.UppyDragDrop-form', endpoint: 'http://master.tus.io:8080/files/'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  .run()

console.log('Uppy ' + uppy.type + ' loaded')
