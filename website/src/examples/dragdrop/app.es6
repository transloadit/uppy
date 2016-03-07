import Uppy from 'uppy/core'
import { DragDrop, ProgressBar, Spinner, Tus10 } from 'uppy/plugins'

const uppyOne = new Uppy({debug: true})
uppyOne
  .use(DragDrop, {target: '.UppyDragDrop-One'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  .use(ProgressBar, {target: '.UppyDragDrop-One-Progress'})
  .use(Spinner, {target: '.UppyDragDrop-One-Spinner'})
  .run()

const uppyTwo = new Uppy({debug: true, autoProceed: false})
uppyTwo
  .use(DragDrop, {target: '#UppyDragDrop-Two'})
  .use(Tus10, {endpoint: 'http://master.tus.io:8080/files/'})
  .use(ProgressBar, {target: '.UppyDragDrop-Two-Progress'})
  .run()
