const Uppy = require('@uppy/core')
const DragDrop = require('@uppy/drag-drop')
const ProgressBar = require('@uppy/progress-bar')
const Tus = require('@uppy/tus')

const uppyOne = new Uppy({debug: true})
uppyOne
  .use(DragDrop, {target: '.UppyDragDrop-One'})
  .use(Tus, {endpoint: '//master.tus.io/files/'})
  .use(ProgressBar, {target: '.UppyDragDrop-One-Progress', hideAfterFinish: false})

const uppyTwo = new Uppy({debug: true, autoProceed: false})
uppyTwo
  .use(DragDrop, {target: '#UppyDragDrop-Two'})
  .use(Tus, {endpoint: '//master.tus.io/files/'})
  .use(ProgressBar, {target: '.UppyDragDrop-Two-Progress', hideAfterFinish: false})

var uploadBtn = document.querySelector('.UppyDragDrop-Two-Upload')
uploadBtn.addEventListener('click', function () {
  uppyTwo.upload()
})
