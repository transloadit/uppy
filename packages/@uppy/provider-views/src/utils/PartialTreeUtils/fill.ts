import type { PartialTree, PartialTreeFile, PartialTreeFolder, PartialTreeFolderNode, PartialTreeId } from "@uppy/core/lib/Uppy"
import type { CompanionClientProvider, RequestOptions } from "@uppy/utils/lib/CompanionClientProvider"
import type { CompanionFile } from "@uppy/utils/lib/CompanionFile"
import PQueue from "p-queue"
import injectPaths from "./injectPaths"

const recursivelyFetch = async (queue: PQueue, poorTree: PartialTree, poorFolder: PartialTreeFolderNode, provider: CompanionClientProvider, signal: AbortSignal): Promise<PartialTree> => {
  let items : CompanionFile[] = []
  let currentPath : PartialTreeId = poorFolder.cached ? poorFolder.nextPagePath : poorFolder.id
  while (currentPath) {
    const response = await provider.list(currentPath, { signal })
    console.log({ currentPath, response });
    items = items.concat(response.items)
    currentPath = response.nextPagePath
  }

  let newFolders = items.filter((i) => i.isFolder === true)
  let newFiles = items.filter((i) => i.isFolder === false)

  const folders : PartialTreeFolderNode[] = newFolders.map((folder) => ({
    type: 'folder',
    id: folder.requestPath,

    cached: false,
    nextPagePath: null,

    status: 'checked',
    parentId: poorFolder.id,
    data: folder,
  }))
  const files : PartialTreeFile[] = newFiles.map((file) => ({
    type: 'file',
    id: file.requestPath,

    status: 'checked',
    parentId: poorFolder.id,
    data: file,
  }))

  poorFolder.cached = true
  poorFolder.nextPagePath = null
  poorTree.push(...files, ...folders)

  folders.forEach(async (folder) => {
    queue.add(async () =>
      await recursivelyFetch(queue, poorTree, folder, provider, signal)
    )
  })

  return []
}

const fill = async (partialTree: PartialTree, provider: CompanionClientProvider, signal: AbortSignal) : Promise<CompanionFile[]> => {
  const queue = new PQueue({ concurrency: 6 })

  // fill up the missing parts of a partialTree!
  let poorTree : PartialTree = JSON.parse(JSON.stringify(partialTree))
  const poorFolders = poorTree.filter((item) =>
    item.type === 'folder' &&
    item.status === 'checked' &&
    // either "not yet cached at all" or "some pages are left to fetch"
    (item.cached === false || item.nextPagePath)
  ) as PartialTreeFolderNode[]
  // per each poor folder, recursively fetch all files and make them .checked!!!
  poorFolders.forEach((poorFolder) => {
    queue.add(async () =>
      await recursivelyFetch(queue, poorTree, poorFolder, provider, signal)
    )
  })

  await queue.onIdle()

  // Return all 'checked' files
  const checkedFiles = poorTree.filter((item) => item.type === 'file' && item.status === 'checked') as PartialTreeFile[]
  const uppyFiles = injectPaths(poorTree, checkedFiles)
  return uppyFiles
}

export default fill
