import type { PartialTree } from "@uppy/core/lib/Uppy";

// One-level copying is enough, because we're never mutating `.data = { THIS }` within our `partialTree` - we're only ever mutating stuff like `.status`, `.cached`, `.nextPagePath`.
const clone = (partialTree: PartialTree) => {
  return partialTree.map((item) => ({ ...item }))
}

export default clone
