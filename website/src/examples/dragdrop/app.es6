require('es6-promise/auto')
require('whatwg-fetch')
const Uppy = require('@uppy/core')
const DragDrop = require('@uppy/drag-drop')
const ProgressBar = require('@uppy/progress-bar')
const Tus = require('@uppy/tus')

// Function for displaying uploaded files
const onUploadSuccess = (elForUploadedFiles) =>
  (file, response) => {
    const url = response.uploadURL
    const fileName = file.name

    document.querySelector(elForUploadedFiles).innerHTML +=
      `<li><a href="${url}" target="_blank">${fileName}</a></li>`
  }

const uppyOne = new Uppy({ debug: true, autoProceed: true })
uppyOne
  .use(DragDrop, { target: '.example-one .for-DragDrop' })
  .use(Tus, { endpoint: 'https://master.tus.io/files/' })
  .use(ProgressBar, { target: '.example-one .for-ProgressBar', hideAfterFinish: false })
  .on('upload-success', onUploadSuccess('.example-one .uploaded-files ol'))

const uppyTwo = new Uppy({ debug: true, autoProceed: false })
uppyTwo
  .use(DragDrop, { target: '.example-two .for-DragDrop' })
  .use(Tus, { endpoint: 'https://master.tus.io/files/' })
  .use(ProgressBar, { target: '.example-two .for-ProgressBar', hideAfterFinish: false })
  .on('upload-success', onUploadSuccess('.example-two .uploaded-files ol'))

const uploadBtn = document.querySelector('.example-two button.upload-button')
uploadBtn.addEventListener('click', function () {
  uppyTwo.upload()
})
