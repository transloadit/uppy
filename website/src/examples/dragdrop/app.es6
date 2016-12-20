const Uppy = require('../../../../src/core/Core.js')
const DragDrop = require('../../../../src/plugins/DragDrop/index.js')
const ProgressBar = require('../../../../src/plugins/ProgressBar.js')
const Tus10 = require('../../../../src/plugins/Tus10.js')

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
