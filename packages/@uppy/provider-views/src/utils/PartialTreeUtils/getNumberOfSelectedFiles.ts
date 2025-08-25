import type { PartialTree } from '@uppy/core'

/**
 * We're interested in all 'checked' leaves of this tree,
 * but we don't yet know how many files there are inside of each checked folder.
 * `getNumberOfSelectedFiles()` returns the most intuitive number we can show to the user
 * in this situation.
 */
const getNumberOfSelectedFiles = (partialTree: PartialTree): number => {
  const checkedLeaves = partialTree.filter((item) => {
    if (item.type === 'file' && item.status === 'checked') {
      return true
    }
    if (item.type === 'folder' && item.status === 'checked') {
      const doesItHaveChildren = partialTree.some(
        (i) => i.type !== 'root' && i.parentId === item.id,
      )
      return !doesItHaveChildren
    }
    return false
  })
  return checkedLeaves.length
}

export default getNumberOfSelectedFiles
