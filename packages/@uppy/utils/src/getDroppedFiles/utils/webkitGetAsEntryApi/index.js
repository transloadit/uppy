const toArray = require('../../../toArray')
const getRelativePath = require('./getRelativePath')
const getFilesAndDirectoriesFromDirectory = require('./getFilesAndDirectoriesFromDirectory')

module.exports = function webkitGetAsEntryApi (dataTransfer, logDropError) {
  const files = []

  const rootPromises = []

  /**
   * Returns a resolved promise, when :files array is enhanced
   *
   * @param {(FileSystemFileEntry|FileSystemDirectoryEntry)} entry
   * @returns {Promise} - empty promise that resolves when :files is enhanced with a file
   */
  const createPromiseToAddFileOrParseDirectory = (entry) =>
    new Promise((resolve) => {
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
        getFilesAndDirectoriesFromDirectory(directoryReader, [], logDropError, {
          onSuccess: (entries) => {
            const promises = entries.map((entry) => createPromiseToAddFileOrParseDirectory(entry))
            Promise.all(promises).then(() => resolve())
          }
        })
      }
    })

  // For each dropped item, - make sure it's a file/directory, and start deepening in!
  toArray(dataTransfer.items)
    .forEach((item) => {
      const entry = item.webkitGetAsEntry()
      // :entry can be null when we drop the url e.g.
      if (entry) {
        rootPromises.push(createPromiseToAddFileOrParseDirectory(entry))
      }
    })

  return Promise.all(rootPromises)
    .then(() => files)
}
