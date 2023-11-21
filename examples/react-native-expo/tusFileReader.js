import * as FileSystem from 'expo-file-system'
import base64 from 'base64-js'

export default function getTusFileReader (file, chunkSize, cb) {
  FileSystem.getInfoAsync(file.uri, { size: true }).then((info) => {
    cb(null, new TusFileReader(file, info.size))
  }).catch(cb)
}

class TusFileReader {
  constructor (file, size) {
    this.file = file
    this.size = size
  }

  slice (start, end, cb) {
    const options = {
      encoding: FileSystem.EncodingType.Base64,
      length: Math.min(end, this.size) - start,
      position: start,
    }
    FileSystem.readAsStringAsync(this.file.uri, options).then((data) => {
      cb(null, base64.toByteArray(data))
    }).catch(cb)
  }
}
