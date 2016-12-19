import Uppy from '../../../../src/core/Core.js'
import DragDrop from '../../../../src/plugins/DragDrop/index.js'
import ProgressBar from '../../../../src/plugins/ProgressBar.js'
import Tus10 from '../../../../src/plugins/Tus10.js'

const uppyOne = new Uppy({debug: true})
uppyOne
  .use(DragDrop, {target: '.UppyDragDrop-One'})
  .use(Tus10, {endpoint: '//master.tus.io/files/'})
  .use(ProgressBar, {target: '.UppyDragDrop-One-Progress'})
  .run()

const uppyTwo = new Uppy({debug: true, autoProceed: false})
uppyTwo
  .use(DragDrop, {target: '#UppyDragDrop-Two'})
  .use(Tus10, {endpoint: '//tusd.tus.io/files/'})
  .use(ProgressBar, {target: '.UppyDragDrop-Two-Progress'})
  .run()

var uploadBtn = document.querySelector('.UppyDragDrop-Two-Upload')
uploadBtn.addEventListener('click', function () {
  uppyTwo.startUpload()
})
