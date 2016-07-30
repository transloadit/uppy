import Plugin from './Plugin'

export default class Multipart extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'uploader'
    this.id = 'Multipart'
    this.title = 'Multipart'

    // Default options
    const defaultOptions = {
      fieldName: 'files[]',
      responseUrlFieldName: 'url',
      bundle: true
    }

    // Merge default options with the ones set by user
    this.opts = Object.assign({}, defaultOptions, opts)
  }

  upload (file, current, total) {
    this.core.log(`uploading ${current} of ${total}`)
    return new Promise((resolve, reject) => {
      // turn file into an array so we can use bundle
      // if (!this.opts.bundle) {
      //   files = [files[current]]
      // }

      // for (let i in files) {
      //   formPost.append(this.opts.fieldName, files[i])
      // }

      const formPost = new FormData()
      formPost.append(this.opts.fieldName, file.data)

      Object.keys(file.meta).forEach((item) => {
        console.log(file.meta, file.meta[item])
        formPost.append(file.meta, file.meta[item])
      })

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (ev) => {
        if (ev.lengthComputable) {
          const bytesUploaded = ev.loaded
          const bytesTotal = ev.total
          let percentage = (bytesUploaded / bytesTotal * 100).toFixed(2)
          percentage = Math.round(percentage)

          this.core.log(`File progress: ${percentage}`)

          // Dispatch progress event
          this.core.emitter.emit('upload-progress', {
            uploader: this,
            id: file.id,
            bytesUploaded: bytesUploaded,
            bytesTotal: bytesTotal
          })
        }
      })

      xhr.addEventListener('load', (ev) => {
        if (ev.target.status === 200) {
          const resp = JSON.parse(xhr.response)
          const uploadURL = resp[this.opts.responseUrlFieldName]

          this.core.emitter.emit('upload-success', file.id, uploadURL)

          this.core.log(`Download ${file.name} from ${file.uploadURL}`)
          return resolve(file)
        }

        // var upload = {}
        //
        // if (this.opts.bundle) {
        //   upload = {files: files}
        // } else {
        //   upload = {file: files[current]}
        // }

        // return resolve(upload)
      })

      xhr.addEventListener('error', (ev) => {
        return reject('Upload error')
      })

      xhr.open('POST', this.opts.endpoint, true)
      xhr.send(formPost)
    })
  }

  selectForUpload (files) {
    const filesForUpload = []
    Object.keys(files).forEach((file) => {
      if (files[file].progress === 0) {
        filesForUpload.push(files[file])
      }
    })

    const uploaders = []
    filesForUpload.forEach((file, i) => {
      const current = parseInt(i, 10) + 1
      const total = filesForUpload.length
      uploaders.push(this.upload(file, current, total))
    })

    Promise.all(uploaders).then((result) => {
      this.core.log('Multipart has finished uploading!')
    })

    //   console.log({
    //     class: 'Multipart',
    //     method: 'run',
    //     results: results
    //   })
    //
    //   const files = results
    //
    //   var uploaders = []
    //
    //   if (this.opts.bundle) {
    //     uploaders.push(this.upload(files, 0, files.length))
    //   } else {
    //     for (let i in files) {
    //       uploaders.push(this.upload(files, i, files.length))
    //     }
    //   }
    //
    //   return Promise.all(uploaders)
  }

  install () {
    this.core.emitter.on('next', () => {
      this.core.log('Multipart is uploading...')
      const files = this.core.state.files
      this.selectForUpload(files)
    })
  }
}
