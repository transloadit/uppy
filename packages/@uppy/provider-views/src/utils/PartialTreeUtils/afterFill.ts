import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolderNode,
  PartialTreeId,
} from '@uppy/core'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
// p-queue does not have a `"main"` field in its `package.json`, and that makes `import/no-unresolved` freak out.
// We can safely ignore it because bundlers will happily use the `"exports"` field instead.
import PQueue from 'p-queue'
import shallowClone from './shallowClone.js'

export type ApiList = (directory: PartialTreeId) => Promise<{
  nextPagePath: PartialTreeId
  items: CompanionFile[]
}>

const recursivelyFetch = async (
  queue: PQueue,
  poorTree: PartialTree,
  poorFolder: PartialTreeFolderNode,
  apiList: ApiList,
  validateSingleFile: (file: CompanionFile) => string | null,
) => {
  let items: CompanionFile[] = []
  let currentPath: PartialTreeId = poorFolder.cached
    ? poorFolder.nextPagePath
    : poorFolder.id
  while (currentPath) {
    const response = await apiList(currentPath)
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

  folders.forEach(async (folder) => {
    queue.add(() =>
      recursivelyFetch(queue, poorTree, folder, apiList, validateSingleFile),
    )
  })
}

const afterFill = async (
  partialTree: PartialTree,
  apiList: ApiList,
  validateSingleFile: (file: CompanionFile) => string | null,
  reportProgress: (n: number) => void,
): Promise<PartialTree> => {
  const queue = new PQueue({ concurrency: 6 })

  // fill up the missing parts of a partialTree!
  const poorTree: PartialTree = shallowClone(partialTree)
  const poorFolders = poorTree.filter(
    (item) =>
      item.type === 'folder' &&
      item.status === 'checked' &&
      // either "not yet cached at all" or "some pages are left to fetch"
      (item.cached === false || item.nextPagePath),
  ) as PartialTreeFolderNode[]
  // per each poor folder, recursively fetch all files and make them .checked!
  poorFolders.forEach((poorFolder) => {
    queue.add(() =>
      recursivelyFetch(
        queue,
        poorTree,
        poorFolder,
        apiList,
        validateSingleFile,
      ),
    )
  })

  queue.on('completed', () => {
    const nOfFilesChecked = poorTree.filter(
      (i) => i.type === 'file' && i.status === 'checked',
    ).length
    reportProgress(nOfFilesChecked)
  })

  await queue.onIdle()

  return poorTree
}

export default afterFill
