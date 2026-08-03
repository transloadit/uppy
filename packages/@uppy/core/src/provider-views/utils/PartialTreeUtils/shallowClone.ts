import type { PartialTree } from '../../../index.js'

/**
 * One-level copying is sufficient as mutations within our `partialTree` are limited to properties
 * such as `.status`, `.cached`, `.nextPagePath`, and not `.data = { THIS }`.
 */
const shallowClone = (partialTree: PartialTree): PartialTree => {
  return partialTree.map((item) => ({ ...item }))
}

export default shallowClone
