import tus from 'tus-js-client'

function tusUpload (blob) {
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(blob, {
      endpoint: 'https://master.tus.io/files/',
      retryDelays: [0, 1000, 3000, 5000],
      metadata: {
        filename: blob.name,
        filetype: blob.type
      },
      onError: function (error) {
        console.log('Failed because: ' + error)
        reject(error)
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2)
        console.log(bytesUploaded, bytesTotal, percentage + '%')
      },
      onSuccess: function () {
        console.log('Download %s from %s', upload.file.name, upload.url)
        resolve(upload.url)
      }
    })

    upload.start()
  })
}

function testUploadFileWithTus (file) {
  return new Promise((resolve, reject) => {
    console.log('Attempting a tus upload in React Native...')
    console.log('with file: ', file)

    const xhr = new XMLHttpRequest()
    xhr.responseType = 'blob'
    xhr.onload = () => {
      console.log('LOAD', xhr.response)
      const blob = xhr.response
      tusUpload(blob)
        .then(resolve)
        .catch(reject)
    }
    xhr.onerror = (err) => {
      console.log(err)
      reject(err)
    }
    xhr.open('GET', file.uri)
    xhr.send()
  })
}

export default testUploadFileWithTus
