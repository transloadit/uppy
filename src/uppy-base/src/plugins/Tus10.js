'use strict'

const tus = require('tus-js-client')
const UppySocket = require('../utils/UppySocket')
const EventEmitter = require('events')

/**
 * Tus resumable file uploader
 */
module.exports = class Tus10 extends EventEmitter {
  constructor (opts) {
    super()

    // set default options
    const defaultOptions = {
      resume: true,
      allowPause: true
    }

    // merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

/**
 * Start uploading for batch of files.
 * @param  {Array} files Files to upload
 * @return {Promise}       Resolves when all uploads succeed/fail
 */
  start (files) {
    const total = files.length

    const uploaders = files.map((file, index) => {
      const current = parseInt(index, 10) + 1

      if (file.isRemote) {
        return this.uploadRemote(file, current, total)
      }

      return this.upload(file, current, total)
    })

    return Promise.all(uploaders).then(() => {
      return {
        uploadedCount: files.length
      }
    })
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
    // Create a new tus upload
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file.data, {

        // TODO merge this.opts or this.opts.tus here
        metadata: file.meta,
        resume: this.opts.resume,
        endpoint: this.opts.endpoint,

        onError: (err) => {
          reject('Failed because: ' + err)
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          console.log('progress:')
          console.log(bytesUploaded / bytesTotal)
          // Dispatch progress event
          this.emit('progress', {
            uploader: this,
            id: file.id,
            bytesUploaded: bytesUploaded,
            bytesTotal: bytesTotal
          })
        },
        onSuccess: () => {
          console.log('success!')
          this.emit('success', file.id, upload.url)
          resolve(upload)
        }
      })

      this.on('abort', (fileID) => {
        // If no fileID provided, abort all uploads
        if (fileID === file.id || !fileID) {
          console.log('aborting file upload: ', fileID)
          upload.abort()
          resolve(`upload ${fileID} was aborted`)
        }
      })

      this.on('pause', (fileID) => {
        // If no fileID provided, pause all uploads
        if (fileID === file.id || !fileID) {
          upload.abort()
        }
      })

      this.on('resume', (fileID) => {
        // If no fileID provided, resume all uploads
        if (fileID === file.id || !fileID) {
          upload.start()
        }
      })

      upload.start()
      this.emit('file-upload-started', file.id, upload)
    })
  }

  uploadRemote (file, current, total) {
    return new Promise((resolve, reject) => {
      const remoteHost = this.opts.remoteHost ? this.opts.remoteHost : file.remote.host
      fetch(`${remoteHost}/${file.remote.provider}/get`, {
        method: 'post',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.assign({}, file.remote.body, {
          target: this.opts.endpoint,
          protocol: 'tus'
        }))
      })
      .then((res) => {
        if (res.status < 200 && res.status > 300) {
          return reject(res.statusText)
        }

        res.json()
        .then((data) => {
          // get the host domain
          // var regex = /^(?:https?:\/\/|\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^\/\n]+)/
          var regex = /^(?:https?:\/\/|\/\/)?(?:[^@\n]+@)?(?:www\.)?([^\n]+)/
          var host = regex.exec(remoteHost)[1]

          var token = data.token
          var socket = new UppySocket({
            target: `ws://${host}:3020/api/${token}`
          })

          socket.on('progress', (progressData) => {
            const {progress, bytesUploaded, bytesTotal} = progressData

            if (progress) {
              console.log(progress)
              // Dispatch progress event
              this.emit('progress', {
                uploader: this,
                id: file.id,
                bytesUploaded: bytesUploaded,
                bytesTotal: bytesTotal
              })

              if (progress === '100.00') {
                socket.close()
                return resolve()
              }
            }
          })
        })
      })
    })
  }

  abort (fileID) {
    this.emit('abort', fileID)
  }

  pause (fileID) {
    this.emit('pause', fileID)
  }

  resume (fileID) {
    this.emit('resume', fileID)
  }

  abortAll () {
    this.abort()
  }

  pauseAll () {
    this.pause()
  }

  resumeAll () {
    this.resume()
  }
}
