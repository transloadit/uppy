import BasePlugin from './BasePlugin.js'

export default class UploaderPlugin extends BasePlugin {
  async uploadRemoteFile (file) {
    // TODO: we could rewrite this to use server-sent events instead of creating WebSockets.
    try {
      if (file.serverToken) {
        return await this.connectToServerSocket(file)
      }
      const serverToken = await this.queueRequestSocketToken(file)

      if (!this.uppy.getState().files[file.id]) return undefined

      this.uppy.setFileState(file.id, { serverToken })
      return await this.connectToServerSocket(this.uppy.getFile(file.id))
    } catch (err) {
      this.uppy.setFileState(file.id, { serverToken: undefined })
      this.uppy.emit('upload-error', file, err)
      throw err
    }
  }
}
