import getFilesAndDirectoriesFromDirectory from './getFilesAndDirectoriesFromDirectory.js'

/**
 * Polyfill for the new (experimental) getAsFileSystemHandle API (using the popular webkitGetAsEntry behind the scenes)
 * so that we can switch to the getAsFileSystemHandle API once it (hopefully) becomes standard
 */
function getAsFileSystemHandleFromEntry (entry, logDropError) {
  if (entry == null) return entry
  return {
    // eslint-disable-next-line no-nested-ternary
    kind: entry.isFile ? 'file' : entry.isDirectory ? 'directory' : undefined,
    name: entry.name,
    getFile () {
      return new Promise((resolve, reject) => entry.file(resolve, reject))
    },
    async* values () {
      // If the file is a directory.
      const directoryReader = entry.createReader()
      const entries = await new Promise(resolve => {
        getFilesAndDirectoriesFromDirectory(directoryReader, [], logDropError, {
          onSuccess: (dirEntries) => resolve(dirEntries.map(file => getAsFileSystemHandleFromEntry(file, logDropError))),
        })
      })
      yield* entries
    },
  }
}

async function* createPromiseToAddFileOrParseDirectory (entry, relativePath, lastResortFile = undefined) {
  const getNextRelativePath = () => `${relativePath}/${entry.name}`

  // For each dropped item, - make sure it's a file/directory, and start deepening in!
  if (entry.kind === 'file') {
    const file = await entry.getFile()
    if (file != null) {
      file.relativePath = relativePath ? getNextRelativePath() : null
      yield file
    } else if (lastResortFile != null) yield lastResortFile
  } else if (entry.kind === 'directory') {
    for await (const handle of entry.values()) {
      // Recurse on the directory, appending the dir name to the relative path
      yield* createPromiseToAddFileOrParseDirectory(handle, relativePath ? getNextRelativePath() : entry.name)
    }
  } else if (lastResortFile != null) yield lastResortFile
}

/**
 * Load all files from data transfer, and recursively read any directories.
 * Note that IE is not supported for drag-drop, because IE doesn't support Data Transfers
 *
 * @param {DataTransfer} dataTransfer
 * @param {*} logDropError on error
 */
export default async function* getFilesFromDataTransfer (dataTransfer, logDropError) {
  // Retrieving the dropped items must happen synchronously
  // otherwise only the first item gets treated and the other ones are garbage collected.
  // https://github.com/transloadit/uppy/pull/3998
  const fileSystemHandles = await Promise.all(Array.from(dataTransfer.items, async item => {
    let fileSystemHandle

    // TODO enable getAsFileSystemHandle API once we can get it working with subdirectories
    // IMPORTANT: Need to check isSecureContext *before* calling getAsFileSystemHandle
    // or else Chrome will crash when running in HTTP: https://github.com/transloadit/uppy/issues/4133
    // if (window.isSecureContext && item.getAsFileSystemHandle != null) entry = await item.getAsFileSystemHandle()

    // `webkitGetAsEntry` exists in all popular browsers (including non-WebKit browsers),
    // however it may be renamed to getAsEntry() in the future, so you should code defensively, looking for both.
    // from https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/webkitGetAsEntry
    const getAsEntry = () => (typeof item.getAsEntry === 'function' ? item.getAsEntry() : item.webkitGetAsEntry())
    // eslint-disable-next-line prefer-const
    fileSystemHandle ??= getAsFileSystemHandleFromEntry(getAsEntry(), logDropError)

    return {
      fileSystemHandle,
      lastResortFile: item.getAsFile(), // can be used as a fallback in case other methods fail
    }
  }))

  for (const { lastResortFile, fileSystemHandle } of fileSystemHandles) {
    // fileSystemHandle and lastResortFile can be null when we drop an url.
    if (fileSystemHandle != null) {
      try {
        yield* createPromiseToAddFileOrParseDirectory(fileSystemHandle, '', lastResortFile)
      } catch (err) {
        // Example: If dropping a symbolic link, Chromium will throw:
        // "DOMException: A requested file or directory could not be found at the time an operation was processed.",
        // So we will use lastResortFile instead. See https://github.com/transloadit/uppy/issues/3505.
        if (lastResortFile != null) {
          yield lastResortFile
        } else {
          logDropError(err)
        }
      }
    } else if (lastResortFile != null) yield lastResortFile
  }
}
