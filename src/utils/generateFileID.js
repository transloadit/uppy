/**
 * Takes a file object and turns it into fileID, by converting file.name to lowercase,
 * removing extra characters and adding type, size and lastModified
 *
 * @param {Object} file
 * @return {String} the fileID
 *
 */
module.exports = function generateFileID (file) {
  // filter is needed to not join empty values with `-`
  return [
    'uppy',
    file.name ? file.name.toLowerCase().replace(/[^A-Z0-9]/ig, '') : '',
    file.type,
    file.data.size,
    file.data.lastModified
  ].filter(val => val).join('-')
}
