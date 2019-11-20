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
  let id = 'uppy'
  if (typeof file.name === 'string') {
    id += '-' + encodeFilename(file.name.toLowerCase())
  }

  if (file.type !== undefined) {
    id += '-' + file.type
  }

  if (file.meta && typeof file.meta.relativePath === 'string') {
    id += '-' + encodeFilename(file.meta.relativePath.toLowerCase())
  }

  if (file.data.size !== undefined) {
    id += '-' + file.data.size
  }
  if (file.data.lastModified !== undefined) {
    id += '-' + file.data.lastModified
  }

  return id
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
