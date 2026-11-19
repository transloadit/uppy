import type { EmitterLike } from './index.js'

import { EventEmitter } from 'node:events'

export default function defaultEmitter(): EmitterLike {
  return new EventEmitter()
}
