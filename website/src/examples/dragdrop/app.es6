import Uppy from '../../../../src/core/Core.js'
import DragDrop from '../../../../src/plugins/DragDrop.js'
import ProgressBar from '../../../../src/plugins/ProgressBar.js'
import Spinner from '../../../../src/plugins/Spinner.js'
import Tus10 from '../../../../src/plugins/Tus10.js'

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
