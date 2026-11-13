import { Readable } from 'node:stream'

type UploadOptions = {
  uploadSize: number
  uploadLengthDeferred?: boolean
  onProgress: (bytesUploaded: number, bytesTotal: number) => void
  onSuccess: () => void
  onError: (error: unknown) => void
} & Record<string, unknown>

let lastUploadFile: unknown
let lastUploadedBytes = 0
let nextRequestUrl: string | undefined
let hang = false
let sentRequests: string[] = []
let startGate: Promise<void> | undefined
let resumeOffset = 0

export function __setResumeOffset(value: number): void {
  resumeOffset = value
}

export function __getLastUploadFile(): unknown {
  return lastUploadFile
}

export function __getLastUploadedBytes(): number {
  return lastUploadedBytes
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
  lastUploadedBytes = 0
  nextRequestUrl = undefined
  hang = false
  sentRequests = []
  startGate = undefined
  resumeOffset = 0
}

export class Upload {
  url: string

  file: unknown

  options: UploadOptions

  _aborted = false

  constructor(file: unknown, options: UploadOptions) {
    lastUploadFile = file
    this.file = file
    this.url =
      typeof options['uploadUrl'] === 'string'
        ? options['uploadUrl']
        : 'https://tus.endpoint/files/foo-bar'
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
        {
          getHeader: (name: string) => {
            if (method === 'POST' && name === 'Location') return url
            if (method === 'HEAD' && name === 'Upload-Offset')
              return String(resumeOffset)
            if (method === 'HEAD' && name === 'Upload-Length') return '100'
            return undefined
          },
          getStatus: () =>
            method === 'POST' ? 201 : method === 'HEAD' ? 200 : 204,
        },
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
      await this._send(
        this.options['uploadUrl'] ? 'HEAD' : 'POST',
        nextRequestUrl ?? this.url,
      )
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
