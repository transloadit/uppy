/* eslint-disable no-param-reassign */
import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolderNode,
  PartialTreeId,
} from '@uppy/core/lib/Uppy'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import PQueue from 'p-queue'
import clone from './clone'

interface ApiList {
  (directory: PartialTreeId): Promise<{
    nextPagePath: PartialTreeId
    items: CompanionFile[]
  }>
}

const recursivelyFetch = async (
  queue: PQueue,
  poorTree: PartialTree,
  poorFolder: PartialTreeFolderNode,
  apiList: ApiList,
  validateSingleFile: (file: CompanionFile) => string | null,
) => {
  let items: CompanionFile[] = []
  let currentPath: PartialTreeId =
    poorFolder.cached ? poorFolder.nextPagePath : poorFolder.id
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
): Promise<PartialTree> => {
  const queue = new PQueue({ concurrency: 6 })

  // fill up the missing parts of a partialTree!
  const poorTree: PartialTree = clone(partialTree)
  const poorFolders = poorTree.filter(
    (item) =>
      item.type === 'folder' &&
      item.status === 'checked' &&
      // either "not yet cached at all" or "some pages are left to fetch"
      (item.cached === false || item.nextPagePath),
  ) as PartialTreeFolderNode[]
  // per each poor folder, recursively fetch all files and make them .checked!!!
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

  await queue.onIdle()

  return poorTree
}

export default afterFill
