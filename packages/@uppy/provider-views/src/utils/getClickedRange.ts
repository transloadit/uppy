import type { PartialTreeFile, PartialTreeFolderNode } from '@uppy/core'

// Shift-clicking selects a single consecutive list of items
// starting at the previous click.
const getClickedRange = (
  clickedId: string,
  displayedPartialTree: (PartialTreeFolderNode | PartialTreeFile)[],
  isShiftKeyPressed: boolean,
  previousCheckbox: string | null,
): string[] => {
  const previousCheckboxIndex = displayedPartialTree.findIndex(
    (item) => item.id === previousCheckbox,
  )

  if (previousCheckboxIndex !== -1 && isShiftKeyPressed) {
    const newCheckboxIndex = displayedPartialTree.findIndex(
      (item) => item.id === clickedId,
    )
    const clickedRange = displayedPartialTree.slice(
      Math.min(previousCheckboxIndex, newCheckboxIndex),
      Math.max(previousCheckboxIndex, newCheckboxIndex) + 1,
    )

    return clickedRange.map((item) => item.id)
  }

  return [clickedId]
}

export default getClickedRange
