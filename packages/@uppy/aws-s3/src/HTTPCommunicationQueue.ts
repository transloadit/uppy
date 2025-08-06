import type { Body, Meta, UppyFile } from '@uppy/core'
import type {
  RateLimitedQueue,
  WrapPromiseFunctionType,
} from '@uppy/utils/lib/RateLimitedQueue'
import type AwsS3Multipart from './index.js'
import type {
  AwsS3MultipartOptions,
  AwsS3UploadParameters,
  uploadPartBytes,
} from './index.js'
import { type Chunk, pausingUploadReason } from './MultipartUploader.js'
import type { UploadPartBytesResult, UploadResult } from './utils.js'
import { throwIfAborted } from './utils.js'

function removeMetadataFromURL(urlString: string) {
  const urlObject = new URL(urlString)
  urlObject.search = ''
  urlObject.hash = ''
  return urlObject.href
}

export class HTTPCommunicationQueue<M extends Meta, B extends Body> {
  #abortMultipartUpload!: WrapPromiseFunctionType<
    AwsS3Multipart<M, B>['abortMultipartUpload']
  >

  #cache = new WeakMap()

  #createMultipartUpload!: WrapPromiseFunctionType<
    AwsS3Multipart<M, B>['createMultipartUpload']
  >

  #fetchSignature!: WrapPromiseFunctionType<AwsS3Multipart<M, B>['signPart']>

  #getUploadParameters!: WrapPromiseFunctionType<
    AwsS3Multipart<M, B>['getUploadParameters']
  >

  #listParts!: WrapPromiseFunctionType<AwsS3Multipart<M, B>['listParts']>

  #previousRetryDelay!: number

  #requests

  #retryDelays!: { values: () => Iterator<number> }

  #sendCompletionRequest!: WrapPromiseFunctionType<
    AwsS3Multipart<M, B>['completeMultipartUpload']
  >

  #setS3MultipartState

  #uploadPartBytes!: WrapPromiseFunctionType<uploadPartBytes>

  #getFile

  constructor(
    requests: RateLimitedQueue,
    options: AwsS3MultipartOptions<M, B>,
    setS3MultipartState: (file: UppyFile<M, B>, result: UploadResult) => void,
    getFile: (file: UppyFile<M, B>) => UppyFile<M, B>,
  ) {
    this.#requests = requests
    this.#setS3MultipartState = setS3MultipartState
    this.#getFile = getFile
    this.setOptions(options)
  }

  setOptions(options: Partial<AwsS3MultipartOptions<M, B>>): void {
    const requests = this.#requests

    if ('abortMultipartUpload' in options) {
      this.#abortMultipartUpload = requests.wrapPromiseFunction(
        options.abortMultipartUpload as any,
        { priority: 1 },
      )
    }
    if ('createMultipartUpload' in options) {
      this.#createMultipartUpload = requests.wrapPromiseFunction(
        options.createMultipartUpload as any,
        { priority: -1 },
      )
    }
    if ('signPart' in options) {
      this.#fetchSignature = requests.wrapPromiseFunction(
        options.signPart as any,
      )
    }
    if ('listParts' in options) {
      this.#listParts = requests.wrapPromiseFunction(options.listParts as any)
    }
    if ('completeMultipartUpload' in options) {
      this.#sendCompletionRequest = requests.wrapPromiseFunction(
        options.completeMultipartUpload as any,
        { priority: 1 },
      )
    }
    if ('retryDelays' in options) {
      this.#retryDelays = options.retryDelays ?? []
    }
    if ('uploadPartBytes' in options) {
      this.#uploadPartBytes = requests.wrapPromiseFunction(
        options.uploadPartBytes as any,
        { priority: Infinity },
      )
    }
    if ('getUploadParameters' in options) {
      this.#getUploadParameters = requests.wrapPromiseFunction(
        options.getUploadParameters as any,
      )
    }
  }

  async #shouldRetry(err: any, retryDelayIterator: Iterator<number>) {
    const requests = this.#requests
    const status = err?.source?.status

    // TODO: this retry logic is taken out of Tus. We should have a centralized place for retrying,
    // perhaps the rate limited queue, and dedupe all plugins with that.
    if (status == null) {
      return false
    }
    if (status === 403 && err.message === 'Request has expired') {
      if (!requests.isPaused) {
        // We don't want to exhaust the retryDelayIterator as long as there are
        // more than one request in parallel, to give slower connection a chance
        // to catch up with the expiry set in Companion.
        if (requests.limit === 1 || this.#previousRetryDelay == null) {
          const next = retryDelayIterator.next()
          if (next == null || next.done) {
            return false
          }
          // If there are more than 1 request done in parallel, the RLQ limit is
          // decreased and the failed request is requeued after waiting for a bit.
          // If there is only one request in parallel, the limit can't be
          // decreased, so we iterate over `retryDelayIterator` as we do for
          // other failures.
          // `#previousRetryDelay` caches the value so we can re-use it next time.
          this.#previousRetryDelay = next.value
        }
        // No need to stop the other requests, we just want to lower the limit.
        requests.rateLimit(0)
        await new Promise((resolve) =>
          setTimeout(resolve, this.#previousRetryDelay),
        )
      }
    } else if (status === 429) {
      // HTTP 429 Too Many Requests => to avoid the whole download to fail, pause all requests.
      if (!requests.isPaused) {
        const next = retryDelayIterator.next()
        if (next == null || next.done) {
          return false
        }
        requests.rateLimit(next.value)
      }
    } else if (status > 400 && status < 500 && status !== 409) {
      // HTTP 4xx, the server won't send anything, it's doesn't make sense to retry
      return false
    } else if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      // The navigator is offline, let's wait for it to come back online.
      if (!requests.isPaused) {
        requests.pause()
        window.addEventListener(
          'online',
          () => {
            requests.resume()
          },
          { once: true },
        )
      }
    } else {
      // Other error code means the request can be retried later.
      const next = retryDelayIterator.next()
      if (next == null || next.done) {
        return false
      }
      await new Promise((resolve) => setTimeout(resolve, next.value))
    }
    return true
  }

  async getUploadId(
    file: UppyFile<M, B>,
    signal: AbortSignal,
  ): Promise<UploadResult> {
    let cachedResult: Promise<UploadResult> | UploadResult | undefined
    // As the cache is updated asynchronously, there could be a race condition
    // where we just miss a new result so we loop here until we get nothing back,
    // at which point it's out turn to create a new cache entry.
    for (;;) {
      cachedResult = this.#cache.get(file.data)
      if (cachedResult == null) break
      try {
        return await cachedResult
      } catch {
        // In case of failure, we want to ignore the cached error.
        // At this point, either there's a new cached value, or we'll exit the loop a create a new one.
      }
    }

    const promise = this.#createMultipartUpload(this.#getFile(file), signal)

    const abortPromise = () => {
      promise.abort(signal.reason)
      this.#cache.delete(file.data)
    }
    signal.addEventListener('abort', abortPromise, { once: true })
    this.#cache.set(file.data, promise)
    promise.then(
      async (result) => {
        signal.removeEventListener('abort', abortPromise)
        this.#setS3MultipartState(file, result)
        this.#cache.set(file.data, result)
      },
      () => {
        signal.removeEventListener('abort', abortPromise)
        this.#cache.delete(file.data)
      },
    )

    return promise
  }

  async abortFileUpload(file: UppyFile<M, B>): Promise<void> {
    const result = this.#cache.get(file.data)
    if (result == null) {
      // If the createMultipartUpload request never was made, we don't
      // need to send the abortMultipartUpload request.
      return
    }
    // Remove the cache entry right away for follow-up requests do not try to
    // use the soon-to-be aborted cached values.
    this.#cache.delete(file.data)
    this.#setS3MultipartState(file, Object.create(null))
    let awaitedResult: UploadResult
    try {
      awaitedResult = await result
    } catch {
      // If the cached result rejects, there's nothing to abort.
      return
    }
    await this.#abortMultipartUpload(this.#getFile(file), awaitedResult)
  }

  async #nonMultipartUpload(
    file: UppyFile<M, B>,
    chunk: Chunk,
    signal?: AbortSignal,
  ) {
    const {
      method = 'POST',
      url,
      fields,
      headers,
    } = await this.#getUploadParameters(this.#getFile(file), {
      signal,
    }).abortOn(signal)

    let body: FormData | Blob
    const data = chunk.getData()
    if (method.toUpperCase() === 'POST') {
      const formData = new FormData()
      Object.entries(fields!).forEach(([key, value]) =>
        formData.set(key, value),
      )
      formData.set('file', data)
      body = formData
    } else {
      body = data
    }

    const { onProgress, onComplete } = chunk

    const result = (await this.#uploadPartBytes({
      signature: { url, headers, method } as any,
      body,
      size: data.size,
      onProgress,
      onComplete,
      signal,
    }).abortOn(signal)) as unknown as B // todo this doesn't make sense

    // Note: `fields.key` is not returned by old Companion versions.
    // See https://github.com/transloadit/uppy/pull/5602
    const key = fields?.key
    this.#setS3MultipartState(file, { key: key! })

    return {
      ...result,
      location:
        (result.location as string | undefined) ?? removeMetadataFromURL(url),
      bucket: fields?.bucket,
      key,
    }
  }

  async uploadFile(
    file: UppyFile<M, B>,
    chunks: Chunk[],
    signal: AbortSignal,
  ): Promise<B & Partial<UploadPartBytesResult>> {
    throwIfAborted(signal)
    if (chunks.length === 1 && !chunks[0].shouldUseMultipart) {
      return this.#nonMultipartUpload(file, chunks[0], signal)
    }
    const { uploadId, key } = await this.getUploadId(file, signal)
    throwIfAborted(signal)
    try {
      const parts = await Promise.all(
        chunks.map((chunk, i) => this.uploadChunk(file, i + 1, chunk, signal)),
      )
      throwIfAborted(signal)
      return await this.#sendCompletionRequest(
        this.#getFile(file),
        { key, uploadId, parts, signal },
        signal,
      ).abortOn(signal)
    } catch (err) {
      if (err?.cause !== pausingUploadReason && err?.name !== 'AbortError') {
        // We purposefully don't wait for the promise and ignore its status,
        // because we want the error `err` to bubble up ASAP to report it to the
        // user. A failure to abort is not that big of a deal anyway.
        this.abortFileUpload(file)
      }
      throw err
    }
  }

  restoreUploadFile(file: UppyFile<M, B>, uploadIdAndKey: UploadResult): void {
    this.#cache.set(file.data, uploadIdAndKey)
  }

  async resumeUploadFile(
    file: UppyFile<M, B>,
    chunks: Array<Chunk | null>,
    signal: AbortSignal,
  ): Promise<B> {
    throwIfAborted(signal)
    if (
      chunks.length === 1 &&
      chunks[0] != null &&
      !chunks[0].shouldUseMultipart
    ) {
      return this.#nonMultipartUpload(file, chunks[0], signal)
    }
    const { uploadId, key } = await this.getUploadId(file, signal)
    throwIfAborted(signal)
    const alreadyUploadedParts = await this.#listParts(
      this.#getFile(file),
      { uploadId, key, signal },
      signal,
    ).abortOn(signal)
    throwIfAborted(signal)
    const parts = await Promise.all(
      chunks.map((chunk, i) => {
        const partNumber = i + 1
        const alreadyUploadedInfo = alreadyUploadedParts.find(
          ({ PartNumber }) => PartNumber === partNumber,
        )
        if (alreadyUploadedInfo == null) {
          return this.uploadChunk(file, partNumber, chunk!, signal)
        }
        // Already uploaded chunks are set to null. If we are restoring the upload, we need to mark it as already uploaded.
        chunk?.setAsUploaded?.()
        return { PartNumber: partNumber, ETag: alreadyUploadedInfo.ETag }
      }),
    )
    throwIfAborted(signal)
    return this.#sendCompletionRequest(
      this.#getFile(file),
      { key, uploadId, parts, signal },
      signal,
    ).abortOn(signal)
  }

  async uploadChunk(
    file: UppyFile<M, B>,
    partNumber: number,
    chunk: Chunk,
    signal: AbortSignal,
  ): Promise<UploadPartBytesResult & { PartNumber: number }> {
    throwIfAborted(signal)
    const { uploadId, key } = await this.getUploadId(file, signal)

    const signatureRetryIterator = this.#retryDelays.values()
    const chunkRetryIterator = this.#retryDelays.values()
    const shouldRetrySignature = () => {
      const next = signatureRetryIterator.next()
      if (next == null || next.done) {
        return null
      }
      return next.value
    }

    for (;;) {
      throwIfAborted(signal)
      const chunkData = chunk.getData()
      const { onProgress, onComplete } = chunk
      let signature: AwsS3UploadParameters

      try {
        signature = await this.#fetchSignature(this.#getFile(file), {
          // Always defined for multipart uploads
          uploadId: uploadId!,
          key,
          partNumber,
          body: chunkData,
          signal,
        }).abortOn(signal)
      } catch (err) {
        const timeout = shouldRetrySignature()
        if (timeout == null || signal.aborted) {
          throw err
        }
        await new Promise((resolve) => setTimeout(resolve, timeout))
        continue
      }

      throwIfAborted(signal)
      try {
        return {
          PartNumber: partNumber,
          ...(await this.#uploadPartBytes({
            signature,
            body: chunkData,
            size: chunkData.size,
            onProgress,
            onComplete,
            signal,
          }).abortOn(signal)),
        }
      } catch (err) {
        if (!(await this.#shouldRetry(err, chunkRetryIterator))) throw err
      }
    }
  }
}
