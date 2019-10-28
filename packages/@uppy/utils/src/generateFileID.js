/**
 * Takes a file object and turns it into fileID, by converting file.name to lowercase,
 * removing extra characters and adding type, size and lastModified
 *
 * @param {object} file
 * @returns {string} the fileID
 *
 */
module.exports = function generateFileID (file) {
  // filter is needed to not join empty values with `-`
  return [
    'uppy',
    file.name ? encodeFilename(file.name.toLowerCase()) : '',
    file.type,
    file.meta && file.meta.relativePath ? encodeFilename(file.meta.relativePath.toLowerCase()) : '',
    file.data.size,
    file.data.lastModified
  ].filter(val => val).join('-')
}

function encodeFilename (name) {
  let suffix = ''
  return name.replace(/[^A-Z0-9]/ig, (character) => {
    suffix += '-' + encodeCharacter(character)
    return '/'
  }) + suffix
}

function encodeCharacter (character) {
  return character.charCodeAt(0).toString(32)
}
