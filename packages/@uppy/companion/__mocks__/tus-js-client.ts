import { Readable } from 'node:stream'

type UploadOptions = {
  uploadSize: number
  uploadLengthDeferred?: boolean
  onProgress: (bytesUploaded: number, bytesTotal: number) => void
  onSuccess: () => void
  onError: (error: Error) => void
} & Record<string, unknown>

let lastUploadFile: unknown
let lastUploadedBytes = 0

export function __getLastUploadFile(): unknown {
  return lastUploadFile
}

export function __getLastUploadedBytes(): number {
  return lastUploadedBytes
}

export function __resetTusMockState(): void {
  lastUploadFile = undefined
  lastUploadedBytes = 0
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

  // Consume the source like tus-js-client's StreamSource does, so that stream errors are
  // reported through onError: until the end if the length is deferred, otherwise only
  // `uploadSize` bytes (leaving the rest of the stream unread).
  async _readFile(): Promise<number> {
    const { uploadSize, uploadLengthDeferred } = this.options
    if (!(this.file instanceof Readable)) return uploadSize
    let bytesUploaded = 0
    for await (const chunk of this.file.iterator({ destroyOnReturn: false })) {
      bytesUploaded += uploadLengthDeferred
        ? chunk.length
        : Math.min(chunk.length, uploadSize - bytesUploaded)
      lastUploadedBytes = bytesUploaded
      if (!uploadLengthDeferred && bytesUploaded >= uploadSize) break
    }
    if (!uploadLengthDeferred && bytesUploaded !== uploadSize) {
      throw new Error(
        `upload was configured with a size of ${uploadSize} bytes, but the source is done after ${bytesUploaded} bytes`,
      )
    }
    return bytesUploaded
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
