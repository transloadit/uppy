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
 * @param {Array} oldEntries
 * @param {Function} callback - called with ([ all files and directories in that directoryReader ])
 */
function readEntries (directoryReader, oldEntries, callback) {
  directoryReader.readEntries(
    (entries) => {
      const newEntries = [...oldEntries, ...entries]
      // According to the FileSystem API spec, readEntries() must be called until it calls the callback with an empty array.
      if (entries.length) {
        setTimeout(() => {
          readEntries(directoryReader, newEntries, callback)
        }, 0)
      // Done iterating this particular directory
      } else {
        callback(newEntries)
      }
    },
    // Make sure we resolve on error anyway
    () =>
      callback(oldEntries)
  )
}

/**
 * @param {Function} resolve - function that will be called when :files array is appended with a file
 * @param {Array<File>} files - array of files to enhance
 * @param {FileSystemFileEntry} fileEntry
 */
function addEntryToFiles (resolve, files, fileEntry) {
  // Creates a new File object which can be used to read the file.
  fileEntry.file(
    (file) => {
      file.relativePath = getRelativePath(fileEntry)
      files.push(file)
      resolve()
    },
    // Make sure we resolve on error anyway
    () =>
      resolve()
  )
}

/**
 * @param {Function} resolve - function that will be called when :directoryEntry is done being recursively parsed
 * @param {Array<File>} files - array of files to enhance
 * @param {FileSystemDirectoryEntry} directoryEntry
 */
function recursivelyAddFilesFromDirectory (resolve, files, directoryEntry) {
  const directoryReader = directoryEntry.createReader()
  readEntries(directoryReader, [], (entries) => {
    const promises =
      entries.map((entry) =>
        createPromiseToAddFileOrParseDirectory(files, entry)
      )
    Promise.all(promises)
      .then(() =>
        resolve()
      )
  })
}

/**
 * @param {Array<File>} files - array of files to enhance
 * @param {(FileSystemFileEntry|FileSystemDirectoryEntry)} entry
 */
function createPromiseToAddFileOrParseDirectory (files, entry) {
  return new Promise((resolve) => {
    if (entry.isFile) {
      addEntryToFiles(resolve, files, entry)
    } else if (entry.isDirectory) {
      recursivelyAddFilesFromDirectory(resolve, files, entry)
    }
  })
}

module.exports = function webkitGetAsEntryApi (dataTransfer) {
  const files = []

  const rootPromises = []

  toArray(dataTransfer.items)
    .forEach((item) => {
      const entry = item.webkitGetAsEntry()
      // :entry can be null when we drop the url e.g.
      if (entry) {
        rootPromises.push(createPromiseToAddFileOrParseDirectory(files, entry))
      }
    })

  return Promise.all(rootPromises)
    .then(() => files)
}
