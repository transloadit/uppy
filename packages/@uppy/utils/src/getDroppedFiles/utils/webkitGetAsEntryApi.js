const toArray = require('../../toArray')

/**
 * Get the relative path from the FileEntry#fullPath, because File#webkitRelativePath is always '', at least onDrop.
 *
 * @param {FileEntry} fileEntry
 *
 * @returns {string|null} - if file is not in a folder - return null (this is to be consistent with .relativePath-s of files selected from My Device). If file is in a folder - return its fullPath, e.g. '/simpsons/hi.jpeg'.
 */
function getRelativePath (fileEntry) {
  // fileEntry.fullPath - "/simpsons/hi.jpeg" or undefined (for browsers that don't support it)
  // fileEntry.name - "hi.jpeg"
  if (!fileEntry.fullPath || fileEntry.fullPath === '/' + fileEntry.name) {
    return null
  } else {
    return fileEntry.fullPath
  }
}

/**
 * Recursive function, calls the original callback() when the directory is entirely parsed.
 *
 * @param {FileSystemDirectoryReader} directoryReader
 * @param {Function} logDropError
 * @param {Array} oldEntries
 * @param {Function} callback - called with ([ all files and directories in that directoryReader ])
 */
function getFilesAndDirectoriesFromDirectory (directoryReader, logDropError, oldEntries, callback) {
  directoryReader.readEntries(
    (entries) => {
      const newEntries = [...oldEntries, ...entries]
      // According to the FileSystem API spec, getFilesAndDirectoriesFromDirectory() must be called until it calls the callback with an empty array.
      if (entries.length) {
        setTimeout(() => {
          getFilesAndDirectoriesFromDirectory(directoryReader, logDropError, newEntries, callback)
        }, 0)
      // Done iterating this particular directory
      } else {
        callback(newEntries)
      }
    },
    // Make sure we resolve on error anyway, it's fine if only one directory couldn't be parsed!
    (error) => {
      logDropError(error)
      callback(oldEntries)
    }
  )
}

/**
 * Returns a resolved promise, when :files array is enhanced
 *
 * @param {Array<File>} files - array of files to enhance
 * @param {(FileSystemFileEntry|FileSystemDirectoryEntry)} entry
 * @param {Function} logDropError
 */
function createPromiseToAddFileOrParseDirectory (files, entry, logDropError) {
  return new Promise((resolve) => {
    // This is a base call
    if (entry.isFile) {
      // Creates a new File object which can be used to read the file.
      entry.file(
        (file) => {
          file.relativePath = getRelativePath(entry)
          files.push(file)
          resolve()
        },
        // Make sure we resolve on error anyway, it's fine if only one file couldn't be read!
        (error) => {
          logDropError(error)
          resolve()
        }
      )
    // This is a recursive call
    } else if (entry.isDirectory) {
      const directoryReader = entry.createReader()
      getFilesAndDirectoriesFromDirectory(directoryReader, logDropError, [], (entries) => {
        const promises =
          entries.map((entry) =>
            createPromiseToAddFileOrParseDirectory(files, entry, logDropError)
          )
        Promise.all(promises).then(resolve)
      })
    }
  })
}

module.exports = function webkitGetAsEntryApi (dataTransfer, logDropError) {
  const files = []

  // Each of the root promises resolve when:
  // - ROOT file is parsed (and is added to the files array), or
  // - ROOT folder gets entirely parsed (populating files array)
  const rootPromises = []

  // For each dropped item, - make sure it's a file/directory, and start deepening in!
  toArray(dataTransfer.items)
    .forEach((item) => {
      const entry = item.webkitGetAsEntry()
      // :entry can be null when we drop the url e.g.
      if (entry) {
        rootPromises.push(createPromiseToAddFileOrParseDirectory(files, entry, logDropError))
      }
    })

  return Promise.all(rootPromises)
    .then(() => files)
}
