/* eslint-disable */

import tus from 'tus-js-client'
import { FileSystem } from 'expo'
// import tus from 'react-native-tus-client'

if (!global.atob) {
  global.atob = require('base-64').decode
}

// const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
//   const byteCharacters = atob(b64Data)
//   const byteArrays = []

//   for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
//     const slice = byteCharacters.slice(offset, offset + sliceSize)

//     const byteNumbers = new Array(slice.length)
//     for (let i = 0; i < slice.length; i++) {
//       byteNumbers[i] = slice.charCodeAt(i)
//     }

//     const byteArray = new Uint8Array(byteNumbers)

//     byteArrays.push(byteArray)
//   }

//   const blob = new Blob(byteArrays, {type: contentType})
//   return blob
// }

async function testUploadFileWithTus (file) {
  console.log('Attempting a tus upload in React Native...')
  console.log('with file: ', file)

  let b64 = await FileSystem.readAsStringAsync(file.uri, {
    encoding: FileSystem.EncodingTypes.Base64
  })

  const byteCharacters = atob(b64)
  const blob = new Blob([byteCharacters], {type: 'image/jpeg'})
  console.log('BLOB --------> 456', blob)

  // const response = await fetch(file.uri)
  // const blob = await response.blob()

  // console.log('base64 ---------->', file.base64)
  // b64 = 'data:image/jpeg;base64,' + b64
  // file = b64toBlob(file.base64, 'image/jpeg')

  // Create a new tus upload
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

  // Start the upload
  upload.start()
}

export default testUploadFileWithTus
