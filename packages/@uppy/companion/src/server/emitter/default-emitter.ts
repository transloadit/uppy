import { EventEmitter } from 'node:events'
import type { EmitterLike } from './index.js'

export default function defaultEmitter(): EmitterLike {
  return new EventEmitter()
}
