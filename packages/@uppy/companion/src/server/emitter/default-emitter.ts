import { EventEmitter } from 'node:events'
import type { EmitterLike } from './index.ts'

export default function defaultEmitter(): EmitterLike {
  return new EventEmitter()
}
