import Plugin from './Plugin'

export default class Multipart extends Plugin {
  constructor (core, opts) {
    super(core, opts)
    this.type = 'uploader'
    if (!this.opts.fieldName === undefined) {
      this.opts.fieldName = 'files[]'
    }
    if (this.opts.bundle === undefined) {
      this.opts.bundle = true
    }
  }

  run (results) {
    console.log({
      class  : 'Multipart',
      method : 'run',
      results: results
    })

    const files = this.extractFiles(results)

    this.setProgress(0)
    var uploaders = []

    if (this.opts.bundle) {
      uploaders.push(this.upload(files, 0, files.length))
    } else {
      for (let i in files) {
        uploaders.push(this.upload(files, i, files.length))
      }
    }

    return Promise.all(uploaders)
  }

  upload (files, current, total) {
    var formPost = new FormData()

    // turn file into an array so we can use bundle
    if (!this.opts.bundle) {
      files = [files[current]]
    }

    for (let i in files) {
      formPost.append(this.opts.fieldName, files[i])
    }

    var xhr = new XMLHttpRequest()
    xhr.open('POST', this.opts.endpoint, true)

    xhr.addEventListener('progress', (e) => {
      var percentage = (e.loaded / e.total * 100).toFixed(2)
      this.setProgress(percentage, current, total)
    })

    xhr.addEventListener('load', () => {
      var upload = {}
      if (this.opts.bundle) {
        upload = {files: files}
      } else {
        upload = {file: files[current]}
      }
      return Promise.resolve(upload)
    })

    xhr.addEventListener('error', () => {
      return Promise.reject('fucking error!')
    })

    xhr.send(formPost)
  }
}
