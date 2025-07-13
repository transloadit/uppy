import { EventEmitter } from 'node:events'

export default function defaultEmitter() {
  return new EventEmitter()
}
