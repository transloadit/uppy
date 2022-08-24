import getFilesAndDirectoriesFromDirectory from './getFilesAndDirectoriesFromDirectory.js'

/**
 * Interop between deprecated webkitGetAsEntry and standard getAsFileSystemHandle.
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

async function* createPromiseToAddFileOrParseDirectory (entry, relativePath) {
  // For each dropped item, - make sure it's a file/directory, and start deepening in!
  if (entry.kind === 'file') {
    const file = await entry.getFile()
    if (file !== null) {
      file.relativePath = relativePath ? `${relativePath}/${entry.name}` : null
      yield file
    }
  } else if (entry.kind === 'directory') {
    for await (const handle of entry.values()) {
      yield* createPromiseToAddFileOrParseDirectory(handle, `${relativePath}/${entry.name}`)
    }
  }
}

export default async function* getFilesFromDataTransfer (dataTransfer, logDropError) {
  const entries = await Promise.all(Array.from(dataTransfer.items, async item => {
    const lastResortFile = item.getAsFile() // Chromium bug, see https://github.com/transloadit/uppy/issues/3505.
    const entry = await item.getAsFileSystemHandle?.()
      ?? getAsFileSystemHandleFromEntry(item.webkitGetAsEntry(), logDropError)

    return { lastResortFile, entry }
  }))

  for (const { lastResortFile, entry } of entries) {
    // :entry can be null when we drop the url e.g.
    if (entry != null) {
      try {
        yield* createPromiseToAddFileOrParseDirectory(entry, '')
      } catch (err) {
        if (lastResortFile) {
          yield lastResortFile
        } else {
          logDropError(err)
        }
      }
    }
  }
}
