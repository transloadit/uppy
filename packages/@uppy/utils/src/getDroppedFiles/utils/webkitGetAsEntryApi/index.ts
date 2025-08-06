import getFilesAndDirectoriesFromDirectory from './getFilesAndDirectoriesFromDirectory.js'

interface FileSystemFileHandle extends FileSystemHandle {
  getFile(): Promise<File>
}
interface FileSystemDirectoryHandle extends FileSystemHandle {
  values(): AsyncGenerator<
    FileSystemDirectoryHandle | FileSystemFileHandle,
    void,
    undefined
  >
}

/**
 * Polyfill for the new (experimental) getAsFileSystemHandle API (using the popular webkitGetAsEntry behind the scenes)
 * so that we can switch to the getAsFileSystemHandle API once it (hopefully) becomes standard
 */
function getAsFileSystemHandleFromEntry(
  entry: FileSystemEntry | null | undefined,
  logDropError: Parameters<typeof getFilesAndDirectoriesFromDirectory>[2],
): FileSystemFileHandle | FileSystemDirectoryHandle | null | undefined {
  if (entry == null) return entry
  return {
    kind: entry.isFile
      ? 'file'
      : entry.isDirectory
        ? 'directory'
        : (undefined as never),
    name: entry.name,
    getFile(): ReturnType<FileSystemFileHandle['getFile']> {
      return new Promise((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, reject),
      )
    },
    async *values(): ReturnType<FileSystemDirectoryHandle['values']> {
      // If the file is a directory.
      const directoryReader = (entry as FileSystemDirectoryEntry).createReader()
      const entries = await new Promise<
        Array<NonNullable<ReturnType<typeof getAsFileSystemHandleFromEntry>>>
      >((resolve) => {
        getFilesAndDirectoriesFromDirectory(directoryReader, [], logDropError, {
          onSuccess: (dirEntries) =>
            resolve(
              dirEntries.map(
                (file) => getAsFileSystemHandleFromEntry(file, logDropError)!,
              ),
            ),
        })
      })
      yield* entries
    },
    isSameEntry: undefined as any as FileSystemDirectoryHandle['isSameEntry'],
  }
}

async function* createPromiseToAddFileOrParseDirectory(
  entry: FileSystemFileHandle | FileSystemDirectoryHandle,
  relativePath: string,
  lastResortFile: File | null | undefined = undefined,
): AsyncGenerator<File> {
  const getNextRelativePath = (): string => `${relativePath}/${entry.name}`

  // For each dropped item, - make sure it's a file/directory, and start deepening in!
  if (entry.kind === 'file') {
    const file = await (entry as FileSystemFileHandle).getFile()
    if (file != null) {
      ;(file as any).relativePath = relativePath ? getNextRelativePath() : null
      yield file
    } else if (lastResortFile != null) yield lastResortFile
  } else if (entry.kind === 'directory') {
    for await (const handle of (entry as FileSystemDirectoryHandle).values()) {
      // Recurse on the directory, appending the dir name to the relative path
      yield* createPromiseToAddFileOrParseDirectory(
        handle,
        relativePath ? getNextRelativePath() : entry.name,
      )
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
export default async function* getFilesFromDataTransfer(
  dataTransfer: DataTransfer,
  logDropError: Parameters<typeof getFilesAndDirectoriesFromDirectory>[2],
): ReturnType<typeof createPromiseToAddFileOrParseDirectory> {
  // Retrieving the dropped items must happen synchronously
  // otherwise only the first item gets treated and the other ones are garbage collected.
  // https://github.com/transloadit/uppy/pull/3998
  const fileSystemHandles = await Promise.all(
    Array.from(dataTransfer.items, async (item) => {
      // biome-ignore lint/style/useConst: ...
      let fileSystemHandle:
        | FileSystemFileHandle
        | FileSystemDirectoryHandle
        | null
        | undefined

      // TODO enable getAsFileSystemHandle API once we can get it working with subdirectories
      // IMPORTANT: Need to check isSecureContext *before* calling getAsFileSystemHandle
      // or else Chrome will crash when running in HTTP: https://github.com/transloadit/uppy/issues/4133
      // if (window.isSecureContext && item.getAsFileSystemHandle != null)
      // fileSystemHandle = await item.getAsFileSystemHandle()

      // `webkitGetAsEntry` exists in all popular browsers (including non-WebKit browsers),
      // however it may be renamed to getAsEntry() in the future, so you should code defensively, looking for both.
      // from https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/webkitGetAsEntry
      const getAsEntry = (): ReturnType<
        DataTransferItem['webkitGetAsEntry']
      > =>
        typeof (item as any).getAsEntry === 'function'
          ? (item as any).getAsEntry()
          : item.webkitGetAsEntry()
      fileSystemHandle ??= getAsFileSystemHandleFromEntry(
        getAsEntry(),
        logDropError,
      )

      return {
        fileSystemHandle,
        lastResortFile: item.getAsFile(), // can be used as a fallback in case other methods fail
      }
    }),
  )

  for (const { lastResortFile, fileSystemHandle } of fileSystemHandles) {
    // fileSystemHandle and lastResortFile can be null when we drop an url.
    if (fileSystemHandle != null) {
      try {
        yield* createPromiseToAddFileOrParseDirectory(
          fileSystemHandle,
          '',
          lastResortFile,
        )
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
