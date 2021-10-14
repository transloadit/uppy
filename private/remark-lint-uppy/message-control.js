import unifiedMessageControl from 'unified-message-control'
import { commentMarker } from 'mdast-comment-marker'

export default [
  unifiedMessageControl,
  {
    name: 'retext-simplify',
    marker: commentMarker,
    test: 'html',
  },
]
