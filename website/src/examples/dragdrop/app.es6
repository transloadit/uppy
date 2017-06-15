const Uppy = require('uppy/lib/core/Core')
const DragDrop = require('uppy/lib/plugins/DragDrop')
const ProgressBar = require('uppy/lib/plugins/ProgressBar')
const Tus10 = require('uppy/lib/plugins/Tus10')

const uppyOne = new Uppy({debug: true})
uppyOne
  .use(DragDrop, {target: '.UppyDragDrop-One'})
  .use(Tus10, {endpoint: '//master.tus.io/files/'})
  .use(ProgressBar, {target: '.UppyDragDrop-One-Progress'})
  .run()

const uppyTwo = new Uppy({debug: true, autoProceed: false})
uppyTwo
  .use(DragDrop, {target: '#UppyDragDrop-Two'})
  .use(Tus10, {endpoint: '//master.tus.io/files/'})
  .use(ProgressBar, {target: '.UppyDragDrop-Two-Progress'})
  .run()

var uploadBtn = document.querySelector('.UppyDragDrop-Two-Upload')
uploadBtn.addEventListener('click', function () {
  uppyTwo.upload()
})
