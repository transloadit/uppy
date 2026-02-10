type UploadOptions = {
  uploadSize: number
  onProgress: (bytesUploaded: number, bytesTotal: number) => void
  onSuccess: () => void
} & Record<string, unknown>

export class Upload {
  url: string

  options: UploadOptions

  constructor(_file: unknown, options: UploadOptions) {
    this.url = 'https://tus.endpoint/files/foo-bar'
    this.options = options
  }

  _triggerProgressThenSuccess() {
    this.options.onProgress(this.options.uploadSize, this.options.uploadSize)
    setTimeout(() => this.options.onSuccess(), 100)
  }

  start() {
    setTimeout(this._triggerProgressThenSuccess.bind(this), 100)
  }

  abort() {
    // noop
  }
}

export default { Upload }
