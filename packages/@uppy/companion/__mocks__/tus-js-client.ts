type UploadOptions = {
  uploadSize: number
  onProgress: (bytesUploaded: number, bytesTotal: number) => void
  onSuccess: () => void
} & Record<string, unknown>

let lastUploadFile: unknown

export function __getLastUploadFile(): unknown {
  return lastUploadFile
}

export function __resetTusMockState(): void {
  lastUploadFile = undefined
}

export class Upload {
  url: string

  options: UploadOptions

  constructor(file: unknown, options: UploadOptions) {
    lastUploadFile = file
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
