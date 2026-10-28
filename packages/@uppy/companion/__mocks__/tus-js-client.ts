type UploadOptions = {
  uploadSize: number
  onProgress: (bytesUploaded: number, bytesTotal: number) => void
  onSuccess: () => void
} & Record<string, unknown>

let lastUploadFile: unknown
let nextRequestUrl: string | undefined
let hang = false

export function __getLastUploadFile(): unknown {
  return lastUploadFile
}

export function __setNextRequestUrl(url: string | undefined): void {
  nextRequestUrl = url
}

/** Make uploads never finish, like a tus-js-client waiting on its source. */
export function __setHang(value: boolean): void {
  hang = value
}

export function __resetTusMockState(): void {
  lastUploadFile = undefined
  nextRequestUrl = undefined
  hang = false
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

  async start() {
    // Mirror the real client: invoke onBeforeRequest with the request it is
    // about to send. A throw there (our uploadUrls check) aborts the upload.
    const url = nextRequestUrl ?? this.url
    try {
      const onBeforeRequest = this.options['onBeforeRequest']
      if (typeof onBeforeRequest === 'function') {
        await onBeforeRequest({ getURL: () => url })
      }
    } catch (err) {
      const onError = this.options['onError']
      if (typeof onError === 'function') onError(err)
      return
    }
    if (hang) return
    setTimeout(this._triggerProgressThenSuccess.bind(this), 100)
  }

  async abort() {
    // noop
  }
}

export default { Upload }
