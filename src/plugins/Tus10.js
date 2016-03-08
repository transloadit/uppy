import Plugin from './Plugin'
import tus from 'tus-js-client'

/**
 * Tus resumable file uploader
 *
 */
export default class Tus10 extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'uploader'

    // set default options
    const defaultOptions = {}

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

/**
 * Create a new Tus upload
 *
 * @param {object} file for use with upload
 * @param {integer} current file in a queue
 * @param {integer} total number of files in a queue
 * @returns {Promise}
 */
  upload (file, current, total) {
    this.core.log(`uploading ${current} of ${total}`)

    // Dispatch progress 0 on start
    this.core.emitter.emit('progress', {
      plugin: this,
      percentage: 0
    })

    // Create a new tus upload
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: this.opts.endpoint,
        onError: error => {
          reject('Failed because: ' + error)
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          let percentage = (bytesUploaded / bytesTotal * 100).toFixed(2)
          percentage = Math.round(percentage)

          // Dispatch progress event
          this.core.emitter.emit('progress', {
            plugin: this,
            percentage: percentage
          })
        },
        onSuccess: () => {
          this.core.log(`Download ${upload.file.name} from ${upload.url}`)
          resolve(upload)
        }
      })
      upload.start()
    })

    // const upload = new tus.Upload(file, {
    //   endpoint: this.opts.endpoint,
    //   onError: error => {
    //     return Promise.reject('Failed because: ' + error)
    //   },
    //   onProgress: (bytesUploaded, bytesTotal) => {
    //     let percentage = (bytesUploaded / bytesTotal * 100).toFixed(2)
    //     percentage = Math.round(percentage)
    //     // self.setProgress(percentage, current, total)
    //
    //     // Dispatch progress event
    //     this.core.emitter.emit('progress', {
    //       plugin: this,
    //       percentage: percentage
    //     })
    //   },
    //   onSuccess: () => {
    //     this.core.log(`Download ${upload.file.name} from ${upload.url}`)
    //     return Promise.resolve(upload)
    //   }
    // })
    // // Start the upload
    // return upload.start()
  }

/**
 * Add files to an array of `upload()` calles, passing the current and total file count numbers
 *
 * @param {Array | Object} results
 * @returns {Promise} of parallel uploads `Promise.all(uploaders)`
 */
  run (results) {
    this.core.log({
      class: this.constructor.name,
      method: 'run',
      results: results
    })

    const files = this.extractFiles(results)

    // this.core.log('tus got this: ')
    // this.core.log(results)

    // var uploaded  = [];
    const uploaders = []
    for (let i in files) {
      const file = files[i]
      const current = parseInt(i, 10) + 1
      const total = files.length
      uploaders.push(this.upload(file, current, total))
    }

    return Promise.all(uploaders).then(() => {
      return {
        uploadedCount: files.length
      }
    })

    // return Promise.all(uploaders)
  }
}
