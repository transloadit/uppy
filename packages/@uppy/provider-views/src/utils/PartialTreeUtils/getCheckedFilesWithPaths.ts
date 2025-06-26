import type {
  PartialTree,
  PartialTreeFile,
  PartialTreeFolderNode,
  PartialTreeId,
} from '@uppy/core'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'

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

  const file = partialTree.find((f) => f.id === id)!

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
    const relFolders = absFolders.slice(firstCheckedFolderIndex)

    const absDirPath = `/${absFolders.map((i) => i.data.name).join('/')}`
    const relDirPath =
      relFolders.length === 1
        ? // Must return `undefined` (which later turns into `null` in `.getTagFile()`)
          // (https://github.com/transloadit/uppy/pull/4537#issuecomment-1629136652)
          undefined
        : relFolders.map((i) => i.data.name).join('/')

    return {
      ...file.data,
      absDirPath,
      relDirPath,
    }
  })

  return companionFilesWithInjectedPaths
}

export default getCheckedFilesWithPaths
