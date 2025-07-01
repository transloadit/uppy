import type { Body, Meta, UppyFile } from '@uppy/utils/lib/UppyFile'
import type { _UppyEventMap, Uppy, UppyEventMap } from './Uppy.js'

/**
 * Create a wrapper around an event emitter with a `remove` method to remove
 * all events that were added using the wrapped emitter.
 */
export default class EventManager<M extends Meta, B extends Body> {
  #uppy: Uppy<M, B>

  #events: Array<[keyof UppyEventMap<M, B>, (...args: any[]) => void]> = []

  constructor(uppy: Uppy<M, B>) {
    this.#uppy = uppy
  }

  on<K extends keyof _UppyEventMap<M, B>>(
    event: K,
    fn: _UppyEventMap<M, B>[K],
  ): Uppy<M, B>

  on<K extends keyof UppyEventMap<M, B>>(
    event: K,
    fn: UppyEventMap<M, B>[K],
  ): Uppy<M, B> {
    this.#events.push([event, fn])
    return this.#uppy.on(event as keyof _UppyEventMap<M, B>, fn)
  }

  remove(): void {
    for (const [event, fn] of this.#events.splice(0)) {
      this.#uppy.off(event, fn)
    }
  }

  onFilePause(
    fileID: UppyFile<M, B>['id'],
    cb: (isPaused: boolean) => void,
  ): void {
    this.on('upload-pause', (file, isPaused) => {
      if (fileID === file?.id) {
        cb(isPaused)
      }
    })
  }

  onFileRemove(
    fileID: UppyFile<M, B>['id'],
    cb: (isPaused: UppyFile<M, B>['id']) => void,
  ): void {
    this.on('file-removed', (file) => {
      if (fileID === file.id) cb(file.id)
    })
  }

  onPause(fileID: UppyFile<M, B>['id'], cb: (isPaused: boolean) => void): void {
    this.on('upload-pause', (file, isPaused) => {
      if (fileID === file?.id) {
        // const isPaused = this.#uppy.pauseResume(fileID)
        cb(isPaused)
      }
    })
  }

  onRetry(fileID: UppyFile<M, B>['id'], cb: () => void): void {
    this.on('upload-retry', (file) => {
      if (fileID === file?.id) {
        cb()
      }
    })
  }

  onRetryAll(fileID: UppyFile<M, B>['id'], cb: () => void): void {
    this.on('retry-all', () => {
      if (!this.#uppy.getFile(fileID)) return
      cb()
    })
  }

  onPauseAll(fileID: UppyFile<M, B>['id'], cb: () => void): void {
    this.on('pause-all', () => {
      if (!this.#uppy.getFile(fileID)) return
      cb()
    })
  }

  onCancelAll(
    fileID: UppyFile<M, B>['id'],
    eventHandler: UppyEventMap<M, B>['cancel-all'],
  ): void {
    this.on('cancel-all', (...args) => {
      if (!this.#uppy.getFile(fileID)) return
      eventHandler(...args)
    })
  }

  onResumeAll(fileID: UppyFile<M, B>['id'], cb: () => void): void {
    this.on('resume-all', () => {
      if (!this.#uppy.getFile(fileID)) return
      cb()
    })
  }
}
