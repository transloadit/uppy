type UploadOptions = {
  uploadSize: number
  onProgress: (bytesUploaded: number, bytesTotal: number) => void
  onSuccess: () => void
} & Record<string, unknown>

let lastUploadFile: unknown
let nextRequestUrl: string | undefined
let hang = false
let sentRequests: string[] = []
let startGate: Promise<void> | undefined

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

/** Methods of the requests onBeforeRequest let through, in order. */
export function __getSentRequests(): string[] {
  return sentRequests
}

/** Hold every start() before its first request until `gate` settles. */
export function __setStartGate(gate: Promise<void> | undefined): void {
  startGate = gate
}

export function __resetTusMockState(): void {
  lastUploadFile = undefined
  nextRequestUrl = undefined
  hang = false
  sentRequests = []
  startGate = undefined
}

export class Upload {
  url: string

  options: UploadOptions

  _aborted = false

  constructor(file: unknown, options: UploadOptions) {
    lastUploadFile = file
    this.url = 'https://tus.endpoint/files/foo-bar'
    this.options = options
  }

  _triggerProgressThenSuccess() {
    this.options.onProgress(this.options.uploadSize, this.options.uploadSize)
    setTimeout(() => this.options.onSuccess(), 100)
  }

  async _send(method: string, url: string) {
    const onBeforeRequest = this.options['onBeforeRequest']
    if (typeof onBeforeRequest === 'function') {
      await onBeforeRequest({ getURL: () => url, getMethod: () => method })
    }
    sentRequests.push(method)
    // The server answers at once: in hang mode the upload then waits for its
    // source, as the real client does while it reads the next chunk.
    const onAfterResponse = this.options['onAfterResponse']
    if (typeof onAfterResponse === 'function') {
      await onAfterResponse(
        { getURL: () => url, getMethod: () => method },
        { getHeader: () => undefined, getStatus: () => 204 },
      )
    }
  }

  async start() {
    // Mirror the real client: the first request goes out a turn later (after
    // its fingerprint stat), start() clears the aborted flag, and
    // onBeforeRequest sees each request. A throw there (our uploadUrls check)
    // fails the upload unless it was aborted.
    await new Promise((resolve) => setImmediate(resolve))
    await startGate
    this._aborted = false
    try {
      await this._send('POST', nextRequestUrl ?? this.url)
    } catch (err) {
      const onError = this.options['onError']
      if (!this._aborted && typeof onError === 'function') onError(err)
      return
    }
    if (hang) return
    setTimeout(this._triggerProgressThenSuccess.bind(this), 100)
  }

  async abort(shouldTerminate?: boolean) {
    this._aborted = true
    // The real client's terminate() goes through onBeforeRequest too.
    if (shouldTerminate) await this._send('DELETE', this.url)
  }
}

export default { Upload }
