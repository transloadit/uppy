/**
 * Create a wrapper around an event emitter with a `remove` method to remove
 * all events that were added using the wrapped emitter.
 */
export default class EventManager {
  #uppy

  #events = []

  constructor(uppy) {
    this.#uppy = uppy
  }

  on(event, fn) {
    this.#events.push([event, fn])
    return this.#uppy.on(event, fn)
  }

  remove() {
    for (const [event, fn] of this.#events.splice(0)) {
      this.#uppy.off(event, fn)
    }
  }

  onFilePause(fileID, cb) {
    this.on('upload-pause', (targetFileID, isPaused) => {
      if (fileID === targetFileID) {
        cb(isPaused)
      }
    })
  }

  onFileRemove(fileID, cb) {
    this.on('file-removed', (file) => {
      if (fileID === file.id) cb(file.id)
    })
  }

  onPause(fileID, cb) {
    this.on('upload-pause', (targetFileID, isPaused) => {
      if (fileID === targetFileID) {
        // const isPaused = this.#uppy.pauseResume(fileID)
        cb(isPaused)
      }
    })
  }

  onRetry(fileID, cb) {
    this.on('upload-retry', (targetFileID) => {
      if (fileID === targetFileID) {
        cb()
      }
    })
  }

  onRetryAll(fileID, cb) {
    this.on('retry-all', () => {
      if (!this.#uppy.getFile(fileID)) return
      cb()
    })
  }

  onPauseAll(fileID, cb) {
    this.on('pause-all', () => {
      if (!this.#uppy.getFile(fileID)) return
      cb()
    })
  }

  onCancelAll(fileID, eventHandler) {
    this.on('cancel-all', (...args) => {
      if (!this.#uppy.getFile(fileID)) return
      eventHandler(...args)
    })
  }

  onResumeAll(fileID, cb) {
    this.on('resume-all', () => {
      if (!this.#uppy.getFile(fileID)) return
      cb()
    })
  }
}
