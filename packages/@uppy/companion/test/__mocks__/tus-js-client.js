class Upload {
  constructor (file, options) {
    this.url = 'https://tus.endpoint/files/foo-bar'
    this.options = options
  }

  _triggerProgressThenSuccess () {
    this.options.onProgress(this.options.uploadSize, this.options.uploadSize)
    setTimeout(() => this.options.onSuccess(), 100)
  }

  start () {
    setTimeout(this._triggerProgressThenSuccess.bind(this), 100)
  }

  abort () {
    // noop
  }
}

module.exports = { Upload }
