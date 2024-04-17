import type { PartialTree } from "@uppy/core/lib/Uppy"

const filterItems = (items: PartialTree, filterInput: string | undefined): PartialTree => {
  if (!filterInput || filterInput === '') {
    return items
  }
  return items.filter((item) =>
    item.type !== 'root' &&
    item.data.name.toLowerCase().indexOf(filterInput.toLowerCase()) !== -1
  )
}

export default filterItems
