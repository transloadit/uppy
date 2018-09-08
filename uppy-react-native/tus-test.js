import tus from 'tus-js-client'

function testUploadFileWithTus (file) {
  console.log('Attempting a tus upload in React Native...')
  console.log('with file: ', file)
  // Create a new tus upload
  var upload = new tus.Upload(file, {
    endpoint: 'https://master.tus.io/files/',
    retryDelays: [0, 1000, 3000, 5000],
    metadata: {
      filename: file.name,
      filetype: file.type
    },
    onError: function (error) {
      console.log('Failed because: ' + error)
    },
    onProgress: function (bytesUploaded, bytesTotal) {
      var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2)
      console.log(bytesUploaded, bytesTotal, percentage + '%')
    },
    onSuccess: function () {
      console.log('Download %s from %s', upload.file.name, upload.url)
    }
  })

  // Start the upload
  upload.start()
}

export default testUploadFileWithTus
