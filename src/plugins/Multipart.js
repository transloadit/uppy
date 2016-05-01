import Plugin from './Plugin'

export default class Multipart extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'uploader'
    this.name = 'Multipart'

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

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (ev) => {
        if (ev.lengthComputable) {
          let percentage = (ev.loaded / ev.total * 100).toFixed(2)
          percentage = Math.round(percentage)
          this.core.log(percentage)

          // Dispatch progress event
          this.core.emitter.emit('upload-progress', {
            uploader: this,
            id: file.id,
            percentage: percentage
          })
        }
      })

      xhr.addEventListener('load', (ev) => {
        if (ev.target.status === 200) {
          const resp = JSON.parse(xhr.response)
          file.uploadURL = resp[this.opts.responseUrlFieldName]

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
        return reject('fucking error!')
      })

      xhr.open('POST', this.opts.endpoint, true)
      xhr.send(formPost)
    })
  }

  run () {
    const files = this.core.state.files

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
      this.run()
    })
  }
}
