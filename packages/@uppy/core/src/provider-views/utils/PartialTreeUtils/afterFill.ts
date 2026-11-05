// p-queue does not have a `"main"` field in its `package.json`, and that makes `import/no-unresolved` freak out.
// We can safely ignore it because bundlers will happily use the `"exports"` field instead.
import PQueue from 'p-queue'
import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolderNode,
  PartialTreeId,
} from '../../../index.js'
import type { CompanionFile } from '../../../utils/index.js'
import shallowClone from './shallowClone.js'

export type ApiList = (
  directory: PartialTreeId,
  signal: AbortSignal,
) => Promise<{
  nextPagePath: PartialTreeId
  items: CompanionFile[]
}>

const recursivelyFetch = async (
  poorTree: PartialTree,
  poorFolder: PartialTreeFolderNode,
  apiList: ApiList,
  signal: AbortSignal,
  validateSingleFile: (file: CompanionFile) => string | null,
): Promise<PartialTreeFolderNode[]> => {
  let items: CompanionFile[] = []
  let currentPath: PartialTreeId = poorFolder.cached
    ? poorFolder.nextPagePath
    : poorFolder.id
  while (currentPath) {
    // in case the last page ignored the abort
    signal.throwIfAborted()
    const response = await apiList(currentPath, signal)
    items = items.concat(response.items)
    currentPath = response.nextPagePath
  }

  const newFolders = items.filter((i) => i.isFolder === true)
  const newFiles = items.filter((i) => i.isFolder === false)

  const folders: PartialTreeFolderNode[] = newFolders.map((folder) => ({
    type: 'folder',
    id: folder.requestPath,

    cached: false,
    nextPagePath: null,

    status: 'checked',
    parentId: poorFolder.id,
    data: folder,
  }))
  const files: PartialTreeFile[] = newFiles.map((file) => {
    const restrictionError = validateSingleFile(file)
    return {
      type: 'file',
      id: file.requestPath,

      restrictionError,

      status: restrictionError ? 'unchecked' : 'checked',
      parentId: poorFolder.id,
      data: file,
    }
  })

  poorFolder.cached = true
  poorFolder.nextPagePath = null
  poorTree.push(...files, ...folders)

  return folders
}

const afterFill = async (
  partialTree: PartialTree,
  apiList: ApiList,
  validateSingleFile: (file: CompanionFile) => string | null,
  reportProgress: (n: number) => void,
  signal?: AbortSignal,
): Promise<PartialTree> => {
  signal?.throwIfAborted()
  const queue = new PQueue({ concurrency: 6 })

  // fill up the missing parts of a partialTree!
  const poorTree: PartialTree = shallowClone(partialTree)

  // One failed listing fails the whole fill, or Done would add only part of the
  // selection. So the first failure aborts the fill, as a cancel via `signal`
  // does: running requests stop, queued listings are dropped, and `onIdle()`
  // resolves at once. (`AbortSignal.any()` is too new for iOS < 17.4.)
  const fill = new AbortController()
  const cancel = () => fill.abort()
  signal?.addEventListener('abort', cancel)
  // Recorded inside the task, so it is set before `onIdle()` resolves.
  let firstError: unknown
  const enqueue = (folder: PartialTreeFolderNode) => {
    queue
      .add(
        async () => {
          try {
            const subfolders = await recursivelyFetch(
              poorTree,
              folder,
              apiList,
              fill.signal,
              validateSingleFile,
            )
            subfolders.forEach(enqueue)
          } catch (err) {
            if (fill.signal.aborted) return
            firstError = err
            fill.abort()
          }
        },
        { signal: fill.signal },
      )
      // p-queue rejects the tasks the abort cut short: handled above.
      .catch(() => {})
  }

  const poorFolders = poorTree.filter(
    (item) =>
      item.type === 'folder' &&
      item.status === 'checked' &&
      // either "not yet cached at all" or "some pages are left to fetch"
      (item.cached === false || item.nextPagePath),
  ) as PartialTreeFolderNode[]
  // per each poor folder, recursively fetch all files and make them .checked!
  poorFolders.forEach(enqueue)

  queue.on('completed', () => {
    const nOfFilesChecked = poorTree.filter(
      (i) => i.type === 'file' && i.status === 'checked',
    ).length
    reportProgress(nOfFilesChecked)
  })

  try {
    await queue.onIdle()
  } finally {
    signal?.removeEventListener('abort', cancel)
  }

  // A cancel wins over an earlier failure: the user asked to stop.
  signal?.throwIfAborted()
  if (fill.signal.aborted) throw firstError
  return poorTree
}

export default afterFill
