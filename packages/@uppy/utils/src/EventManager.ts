import type {
  Uppy,
  UploadPauseCallback,
  FileRemovedCallback,
  UploadRetryCallback,
  GenericEventCallback,
} from '@uppy/core'
import type { UppyFile } from './UppyFile'
/**
 * Create a wrapper around an event emitter with a `remove` method to remove
 * all events that were added using the wrapped emitter.
 */
export default class EventManager {
  #uppy: Uppy

  #events: Array<Parameters<typeof Uppy.prototype.on>> = []

  constructor(uppy: Uppy) {
    this.#uppy = uppy
  }

  on(
    event: Parameters<typeof Uppy.prototype.on>[0],
    fn: Parameters<typeof Uppy.prototype.on>[1],
  ): Uppy {
    this.#events.push([event, fn])
    return this.#uppy.on(event, fn)
  }

  remove(): void {
    for (const [event, fn] of this.#events.splice(0)) {
      this.#uppy.off(event, fn)
    }
  }

  onFilePause(fileID: UppyFile['id'], cb: (isPaused: boolean) => void): void {
    this.on(
      'upload-pause',
      (
        targetFileID: Parameters<UploadPauseCallback>[0],
        isPaused: Parameters<UploadPauseCallback>[1],
      ) => {
        if (fileID === targetFileID) {
          cb(isPaused)
        }
      },
    )
  }

  onFileRemove(
    fileID: UppyFile['id'],
    cb: (isPaused: UppyFile['id']) => void,
  ): void {
    this.on('file-removed', (file: Parameters<FileRemovedCallback<any>>[0]) => {
      if (fileID === file.id) cb(file.id)
    })
  }

  onPause(fileID: UppyFile['id'], cb: (isPaused: boolean) => void): void {
    this.on(
      'upload-pause',
      (
        targetFileID: Parameters<UploadPauseCallback>[0],
        isPaused: Parameters<UploadPauseCallback>[1],
      ) => {
        if (fileID === targetFileID) {
          // const isPaused = this.#uppy.pauseResume(fileID)
          cb(isPaused)
        }
      },
    )
  }

  onRetry(fileID: UppyFile['id'], cb: () => void): void {
    this.on(
      'upload-retry',
      (targetFileID: Parameters<UploadRetryCallback>[0]) => {
        if (fileID === targetFileID) {
          cb()
        }
      },
    )
  }

  onRetryAll(fileID: UppyFile['id'], cb: () => void): void {
    this.on('retry-all', () => {
      if (!this.#uppy.getFile(fileID)) return
      cb()
    })
  }

  onPauseAll(fileID: UppyFile['id'], cb: () => void): void {
    this.on('pause-all', () => {
      if (!this.#uppy.getFile(fileID)) return
      cb()
    })
  }

  onCancelAll(
    fileID: UppyFile['id'],
    eventHandler: GenericEventCallback,
  ): void {
    this.on('cancel-all', (...args: Parameters<GenericEventCallback>) => {
      if (!this.#uppy.getFile(fileID)) return
      eventHandler(...args)
    })
  }

  onResumeAll(fileID: UppyFile['id'], cb: () => void): void {
    this.on('resume-all', () => {
      if (!this.#uppy.getFile(fileID)) return
      cb()
    })
  }
}
