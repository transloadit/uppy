/* eslint-disable */

import tus from 'tus-js-client'
// import tus from 'react-native-tus-client'

function testUploadFileWithTus (file) {
  console.log('Attempting a tus upload in React Native...')
  console.log('with file: ', file)

  const xhr = new XMLHttpRequest()
  xhr.responseType = 'blob'
  xhr.onload = () => {
    console.log('LOAD', xhr.response)

    const blob = xhr.response

    var upload = new tus.Upload(blob, {
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

    upload.start()
  }

  xhr.onerror = (err) => { 
    console.log(err)
    throw err 
  }
  xhr.open('GET', file.uri)
  xhr.send()
}

export default testUploadFileWithTus
