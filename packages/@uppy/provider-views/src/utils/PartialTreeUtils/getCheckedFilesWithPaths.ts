import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolderNode,
  PartialTreeId,
} from '@uppy/core'
import type { CompanionFile } from '@uppy/utils'

export interface Cache {
  [key: string]: (PartialTreeFile | PartialTreeFolderNode)[]
}

const getPath = (
  partialTree: PartialTree,
  id: PartialTreeId,
  cache: Cache,
): (PartialTreeFile | PartialTreeFolderNode)[] => {
  const sId = id === null ? 'null' : id
  if (cache[sId]) return cache[sId]

  const file = partialTree.find((f) => f.id === id)
  // If we can't resolve the node (e.g. synthetic parent chain mismatch),
  // bail out gracefully rather than throwing.
  if (!file) {
    cache[sId] = []
    return []
  }

  if (file.type === 'root') return []

  const meAndParentPath = [...getPath(partialTree, file.parentId, cache), file]
  cache[sId] = meAndParentPath
  return meAndParentPath
}

// See "Uppy file properties" documentation for `.absolutePath` and `.relativePath`
// (https://uppy.io/docs/uppy/#working-with-uppy-files)
const getCheckedFilesWithPaths = (
  partialTree: PartialTree,
): CompanionFile[] => {
  // Equivalent to `const cache = {}`, but makes keys such as 'hasOwnProperty' safe too
  const cache: Cache = Object.create(null)

  // We're only interested in injecting paths into 'checked' files
  const checkedFiles = partialTree.filter(
    (item) => item.type === 'file' && item.status === 'checked',
  ) as PartialTreeFile[]

  const companionFilesWithInjectedPaths = checkedFiles.map((file) => {
    const absFolders: (PartialTreeFile | PartialTreeFolderNode)[] = getPath(
      partialTree,
      file.id,
      cache,
    )

    const firstCheckedFolderIndex = absFolders.findIndex(
      (i) => i.type === 'folder' && i.status === 'checked',
    )
    const relFolders =
      firstCheckedFolderIndex <= 0
        ? absFolders
        : absFolders.slice(firstCheckedFolderIndex)

    const namesAbs = absFolders.map((i) => (i as any)?.data?.name).filter(Boolean)
    const absDirPath = namesAbs.length ? `/${namesAbs.join('/')}` : '/'
    const namesRel = relFolders
      .map((i) => (i as any)?.data?.name)
      .filter(Boolean) as string[]
    const relDirPath =
      namesRel.length <= 1
        ? // Must return `undefined` (which later turns into `null` in `.getTagFile()`)
          // (https://github.com/transloadit/uppy/pull/4537#issuecomment-1629136652)
          undefined
        : namesRel.join('/')

    return {
      ...file.data,
      absDirPath,
      relDirPath,
    }
  })

  return companionFilesWithInjectedPaths
}

export default getCheckedFilesWithPaths
