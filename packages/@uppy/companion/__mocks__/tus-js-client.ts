import { Readable } from 'node:stream'

type UploadOptions = {
  uploadSize: number
  uploadLengthDeferred?: boolean
  onProgress: (bytesUploaded: number, bytesTotal: number) => void
  onSuccess: () => void
  onError: (error: Error) => void
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

  file: unknown

  options: UploadOptions

  constructor(file: unknown, options: UploadOptions) {
    lastUploadFile = file
    this.file = file
    this.url = 'https://tus.endpoint/files/foo-bar'
    this.options = options
  }

  // Consume the source like tus-js-client does, so that stream errors are
  // reported through onError.
  async _readFile(): Promise<number> {
    if (!(this.file instanceof Readable)) return this.options.uploadSize
    let bytesRead = 0
    for await (const chunk of this.file) bytesRead += chunk.length
    return this.options.uploadLengthDeferred
      ? bytesRead
      : Math.min(bytesRead, this.options.uploadSize)
  }

  _triggerProgressThenSuccess() {
    this._readFile().then(
      (bytesRead) => {
        this.options.onProgress(bytesRead, bytesRead)
        setTimeout(() => this.options.onSuccess(), 100)
      },
      (err) => this.options.onError(err),
    )
  }

  start() {
    setTimeout(this._triggerProgressThenSuccess.bind(this), 100)
  }

  abort() {
    // noop
  }
}

export default { Upload }
