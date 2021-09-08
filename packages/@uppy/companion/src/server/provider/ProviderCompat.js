const { promisify } = require('util')

const Stream = require('stream')

/**
 * Backward compatibility layer for old provider API using callbacks and onData cb
 *
 * @returns {any}
 */
const wrapLegacyProvider = (legacyProvider) => {
  class CompatProvider extends legacyProvider {
    constructor (...args) {
      super(...args)

      this.list = promisify((options, cb) => super.list(options, cb))
      this.size = promisify((options, cb) => super.size(options, cb))
      this.thumbnail = promisify((options, cb) => super.thumbnail(options, cb))
      this.deauthorizationCallback = promisify((options, cb) => super.deauthorizationCallback(options, cb))
      this.logout = promisify((options, cb) => super.logout(options, cb))

      const superDownload = super.download

      this.download = async (options) => {
        let stream

        return new Promise((resolve, reject) => {
          superDownload(options, (err, chunk) => {
            if (err) {
              if (stream && !stream.destroyed) stream.destroy(err)
              reject(err)
              return
            }

            // Initialize on first chunk
            if (chunk != null && !stream) {
              stream = new Stream.PassThrough()
              // stream.on('end', () => console.log('stream end'))
              stream.pause()
              stream.push(chunk)
              resolve({ stream })
              return
            }

            stream.push(chunk)
          })
        })
      }
    }
  }

  return CompatProvider
}

module.exports = { wrapLegacyProvider }
