/**
* Takes a full filename string and returns an object {name, extension}
*
* @param {string} fullFileName
* @return {object} {name, extension}
*/
module.exports = function getFileNameAndExtension (fullFileName) {
  var re = /(?:\.([^.]+))?$/
  var fileExt = re.exec(fullFileName)[1]
  var fileName = fullFileName.replace('.' + fileExt, '')
  return {
    name: fileName,
    extension: fileExt
  }
}
