module.exports = function getArrayBuffer (chunk) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader()
    reader.addEventListener('load', function (e) {
      // e.target.result is an ArrayBuffer
      resolve(e.target.result)
    })
    reader.addEventListener('error', function (err) {
      console.error('FileReader error' + err)
      reject(err)
    })
    // file-type only needs the first 4100 bytes
    reader.readAsArrayBuffer(chunk)
  })
}
