/**
 * Recursive function, calls the original callback() when the directory is entirely parsed.
 *
 * @param {FileSystemDirectoryReader} directoryReader
 * @param {Array} oldEntries
 * @param {Function} logDropError
 * @param {Function} callback - called with ([ all files and directories in that directoryReader ])
 */
export default function getFilesAndDirectoriesFromDirectory (directoryReader, oldEntries, logDropError, { onSuccess }) {
  directoryReader.readEntries(
    (entries) => {
      const newEntries = [...oldEntries, ...entries]
      // According to the FileSystem API spec, getFilesAndDirectoriesFromDirectory()
      // must be called until it calls the onSuccess with an empty array.
      if (entries.length) {
        queueMicrotask(() => {
          getFilesAndDirectoriesFromDirectory(directoryReader, newEntries, logDropError, { onSuccess })
        })
      // Done iterating this particular directory
      } else {
        onSuccess(newEntries)
      }
    },
    // Make sure we resolve on error anyway, it's fine if only one directory couldn't be parsed!
    (error) => {
      logDropError(error)
      onSuccess(oldEntries)
    },
  )
}
