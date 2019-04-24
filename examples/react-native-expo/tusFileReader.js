import * as Expo from 'expo'
import base64 from 'base64-js'

export default function getTusFileReader (file, chunkSize, cb) {
  Expo.FileSystem.getInfoAsync(file.uri, { size: true }).then((info) => {
    cb(null, new TusFileReader(file, info.size))
  }).catch(cb)
}

class TusFileReader {
  constructor (file, size) {
    this.file = file
    this.size = size
  }

  slice (start, end, cb) {
    end = Math.min(end, this.size)
    const options = {
      encoding: Expo.FileSystem.EncodingTypes.Base64,
      length: end - start,
      postion: start
    }
    Expo.FileSystem.readAsStringAsync(this.file.uri, options).then((data) => {
      cb(null, base64.toByteArray(data))
    }).catch(cb)
  }

  close () {

  }
}
