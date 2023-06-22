import BasePlugin from './BasePlugin.js'

export default class UploaderPlugin extends BasePlugin {
  #queueRequestSocketToken

  /** @protected */
  setQueueRequestSocketToken (fn) {
    this.#queueRequestSocketToken = fn
  }

  async uploadRemoteFile (file, options = {}) {
    // TODO: we could rewrite this to use server-sent events instead of creating WebSockets.
    try {
      if (file.serverToken) {
        return await this.connectToServerSocket(file)
      }
      const serverToken = await this.#queueRequestSocketToken(file).abortOn(options.signal)

      if (!this.uppy.getState().files[file.id]) return undefined

      this.uppy.setFileState(file.id, { serverToken })
      return await this.connectToServerSocket(this.uppy.getFile(file.id))
    } catch (err) {
      if (err?.cause?.name === 'AbortError') {
        // The file upload was aborted, it’s not an error
        return undefined
      }

      this.uppy.setFileState(file.id, { serverToken: undefined })
      this.uppy.emit('upload-error', file, err)
      throw err
    }
  }
}
