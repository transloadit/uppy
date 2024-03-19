import BasePlugin, {
  type DefinePluginOpts,
  type PluginOpts,
} from '@uppy/core/lib/BasePlugin.js'
import * as tus from 'tus-js-client'
import EventManager from '@uppy/core/lib/EventManager.js'
import NetworkError from '@uppy/utils/lib/NetworkError'
import isNetworkError from '@uppy/utils/lib/isNetworkError'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore untyped
import { RateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue'
import hasProperty from '@uppy/utils/lib/hasProperty'
import {
  filterNonFailedFiles,
  filterFilesToEmitUploadStarted,
} from '@uppy/utils/lib/fileFilters'
import type { Meta, Body, UppyFile } from '@uppy/utils/lib/UppyFile'
import type { Uppy } from '@uppy/core'
import type { RequestClient } from '@uppy/companion-client'
import getFingerprint from './getFingerprint.ts'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'

declare module '@uppy/utils/lib/UppyFile' {
  // eslint-disable-next-line no-shadow, @typescript-eslint/no-unused-vars
  export interface UppyFile<M extends Meta, B extends Body> {
    // TODO: figure out what else is in this type
    tus?: { uploadUrl?: string | null }
  }
}

type RestTusUploadOptions = Omit<
  tus.UploadOptions,
  'onShouldRetry' | 'onBeforeRequest' | 'headers'
>

export type TusDetailedError = tus.DetailedError

export interface TusOpts<M extends Meta, B extends Body>
  extends PluginOpts,
    RestTusUploadOptions {
  endpoint: string
  headers?:
    | Record<string, string>
    | ((file: UppyFile<M, B>) => Record<string, string>)
  limit?: number
  chunkSize?: number
  onBeforeRequest?: (req: tus.HttpRequest, file: UppyFile<M, B>) => void
  onShouldRetry?: (
    err: tus.DetailedError,
    retryAttempt: number,
    options: TusOpts<M, B>,
    next: (e: tus.DetailedError) => void,
  ) => boolean
  retryDelays?: number[]
  withCredentials?: boolean
  allowedMetaFields?: string[]
  rateLimitedQueue?: RateLimitedQueue
}

/**
 * Extracted from https://github.com/tus/tus-js-client/blob/master/lib/upload.js#L13
 * excepted we removed 'fingerprint' key to avoid adding more dependencies
 */
const tusDefaultOptions = {
  endpoint: '',

  uploadUrl: null,
  metadata: {},
  uploadSize: null,

  onProgress: null,
  onChunkComplete: null,
  onSuccess: null,
  onError: null,

  overridePatchMethod: false,
  headers: {},
  addRequestId: false,

  chunkSize: Infinity,
  retryDelays: [100, 1000, 3000, 5000],
  parallelUploads: 1,
  removeFingerprintOnSuccess: false,
  uploadLengthDeferred: false,
  uploadDataDuringCreation: false,
} satisfies tus.UploadOptions

const defaultOptions = {
  limit: 20,
  retryDelays: tusDefaultOptions.retryDelays,
  withCredentials: false,
} satisfies Partial<TusOpts<any, any>>

type Opts<M extends Meta, B extends Body> = DefinePluginOpts<
  TusOpts<M, B>,
  keyof typeof defaultOptions
>

/**
 * Tus resumable file uploader
 */
export default class Tus<M extends Meta, B extends Body> extends BasePlugin<
  Opts<M, B>,
  M,
  B
> {
  static VERSION = packageJson.version

  #retryDelayIterator

  requests: RateLimitedQueue

  uploaders: Record<string, tus.Upload | null>

  uploaderEvents: Record<string, EventManager<M, B> | null>

  constructor(uppy: Uppy<M, B>, opts: TusOpts<M, B>) {
    super(uppy, { ...defaultOptions, ...opts })
    this.type = 'uploader'
    this.id = this.opts.id || 'Tus'

    if (opts?.allowedMetaFields === undefined && 'metaFields' in this.opts) {
      throw new Error(
        'The `metaFields` option has been renamed to `allowedMetaFields`.',
      )
    }

    if ('autoRetry' in opts) {
      throw new Error(
        'The `autoRetry` option was deprecated and has been removed.',
      )
    }

    /**
     * Simultaneous upload limiting is shared across all uploads with this plugin.
     *
     * @type {RateLimitedQueue}
     */
    this.requests =
      this.opts.rateLimitedQueue ?? new RateLimitedQueue(this.opts.limit)
    this.#retryDelayIterator = this.opts.retryDelays?.values()

    this.uploaders = Object.create(null)
    this.uploaderEvents = Object.create(null)

    this.handleResetProgress = this.handleResetProgress.bind(this)
  }

  handleResetProgress(): void {
    const files = { ...this.uppy.getState().files }
    Object.keys(files).forEach((fileID) => {
      // Only clone the file object if it has a Tus `uploadUrl` attached.
      if (files[fileID]?.tus?.uploadUrl) {
        const tusState = { ...files[fileID].tus }
        delete tusState.uploadUrl
        files[fileID] = { ...files[fileID], tus: tusState }
      }
    })

    this.uppy.setState({ files })
  }

  /**
   * Clean up all references for a file's upload: the tus.Upload instance,
   * any events related to the file, and the Companion WebSocket connection.
   */
  resetUploaderReferences(fileID: string, opts?: { abort: boolean }): void {
    const uploader = this.uploaders[fileID]
    if (uploader) {
      uploader.abort()

      if (opts?.abort) {
        uploader.abort(true)
      }

      this.uploaders[fileID] = null
    }
    if (this.uploaderEvents[fileID]) {
      this.uploaderEvents[fileID]!.remove()
      this.uploaderEvents[fileID] = null
    }
  }

  /**
   * Create a new Tus upload.
   *
   * A lot can happen during an upload, so this is quite hard to follow!
   * - First, the upload is started. If the file was already paused by the time the upload starts, nothing should happen.
   *   If the `limit` option is used, the upload must be queued onto the `this.requests` queue.
   *   When an upload starts, we store the tus.Upload instance, and an EventManager instance that manages the event listeners
   *   for pausing, cancellation, removal, etc.
   * - While the upload is in progress, it may be paused or cancelled.
   *   Pausing aborts the underlying tus.Upload, and removes the upload from the `this.requests` queue. All other state is
   *   maintained.
   *   Cancelling removes the upload from the `this.requests` queue, and completely aborts the upload-- the `tus.Upload`
   *   instance is aborted and discarded, the EventManager instance is destroyed (removing all listeners).
   *   Resuming the upload uses the `this.requests` queue as well, to prevent selectively pausing and resuming uploads from
   *   bypassing the limit.
   * - After completing an upload, the tus.Upload and EventManager instances are cleaned up, and the upload is marked as done
   *   in the `this.requests` queue.
   * - When an upload completed with an error, the same happens as on successful completion, but the `upload()` promise is
   *   rejected.
   *
   * When working on this function, keep in mind:
   *  - When an upload is completed or cancelled for any reason, the tus.Upload and EventManager instances need to be cleaned
   *    up using this.resetUploaderReferences().
   *  - When an upload is cancelled or paused, for any reason, it needs to be removed from the `this.requests` queue using
   *    `queuedRequest.abort()`.
   *  - When an upload is completed for any reason, including errors, it needs to be marked as such using
   *    `queuedRequest.done()`.
   *  - When an upload is started or resumed, it needs to go through the `this.requests` queue. The `queuedRequest` variable
   *    must be updated so the other uses of it are valid.
   *  - Before replacing the `queuedRequest` variable, the previous `queuedRequest` must be aborted, else it will keep taking
   *    up a spot in the queue.
   *
   */
  #uploadLocalFile(file: UppyFile<M, B>): Promise<tus.Upload | string> {
    this.resetUploaderReferences(file.id)

    // Create a new tus upload
    return new Promise<tus.Upload | string>((resolve, reject) => {
      let queuedRequest: ReturnType<RateLimitedQueue['run']>
      let qRequest: () => () => void
      let upload: tus.Upload

      const opts = {
        ...this.opts,
        ...(file.tus || {}),
      }

      if (typeof opts.headers === 'function') {
        opts.headers = opts.headers(file)
      }

      const { onShouldRetry, onBeforeRequest, ...commonOpts } = opts

      const uploadOptions: tus.UploadOptions = {
        ...tusDefaultOptions,
        ...commonOpts,
      }

      // We override tus fingerprint to uppy’s `file.id`, since the `file.id`
      // now also includes `relativePath` for files added from folders.
      // This means you can add 2 identical files, if one is in folder a,
      // the other in folder b.
      uploadOptions.fingerprint = getFingerprint(file)

      uploadOptions.onBeforeRequest = async (req) => {
        const xhr = req.getUnderlyingObject()
        xhr.withCredentials = !!opts.withCredentials

        let userProvidedPromise
        if (typeof onBeforeRequest === 'function') {
          userProvidedPromise = onBeforeRequest(req, file)
        }

        if (hasProperty(queuedRequest, 'shouldBeRequeued')) {
          if (!queuedRequest.shouldBeRequeued) return Promise.reject()
          // TODO: switch to `Promise.withResolvers` on the next major if available.
          let done: () => void
          // eslint-disable-next-line promise/param-names
          const p = new Promise<void>((res) => {
            done = res
          })
          queuedRequest = this.requests.run(() => {
            if (file.isPaused) {
              queuedRequest.abort()
            }
            done()
            return () => {}
          })
          // If the request has been requeued because it was rate limited by the
          // remote server, we want to wait for `RateLimitedQueue` to dispatch
          // the re-try request.
          // Therefore we create a promise that the queue will resolve when
          // enough time has elapsed to expect not to be rate-limited again.
          // This means we can hold the Tus retry here with a `Promise.all`,
          // together with the returned value of the user provided
          // `onBeforeRequest` option callback (in case it returns a promise).
          await Promise.all([p, userProvidedPromise])
          return undefined
        }
        return userProvidedPromise
      }

      uploadOptions.onError = (err) => {
        this.uppy.log(err)

        const xhr =
          (err as tus.DetailedError).originalRequest != null ?
            (err as tus.DetailedError).originalRequest.getUnderlyingObject()
          : null
        if (isNetworkError(xhr)) {
          // eslint-disable-next-line no-param-reassign
          err = new NetworkError(err, xhr)
        }

        this.resetUploaderReferences(file.id)
        queuedRequest?.abort()

        this.uppy.emit('upload-error', file, err)
        if (typeof opts.onError === 'function') {
          opts.onError(err)
        }
        reject(err)
      }

      uploadOptions.onProgress = (bytesUploaded, bytesTotal) => {
        this.onReceiveUploadUrl(file, upload.url)
        if (typeof opts.onProgress === 'function') {
          opts.onProgress(bytesUploaded, bytesTotal)
        }
        this.uppy.emit('upload-progress', this.uppy.getFile(file.id), {
          // TODO: remove `uploader` in next major
          // @ts-expect-error untyped
          uploader: this,
          bytesUploaded,
          bytesTotal,
        })
      }

      uploadOptions.onSuccess = () => {
        const uploadResp = {
          uploadURL: upload.url ?? undefined,
          status: 200,
          body: {} as B,
        }

        this.resetUploaderReferences(file.id)
        queuedRequest.done()

        this.uppy.emit('upload-success', this.uppy.getFile(file.id), uploadResp)

        if (upload.url) {
          // @ts-expect-error not typed in tus-js-client
          const { name } = upload.file
          this.uppy.log(`Download ${name} from ${upload.url}`)
        }
        if (typeof opts.onSuccess === 'function') {
          opts.onSuccess()
        }

        resolve(upload)
      }

      const defaultOnShouldRetry = (err: tus.DetailedError) => {
        const status = err?.originalResponse?.getStatus()

        if (status === 429) {
          // HTTP 429 Too Many Requests => to avoid the whole download to fail, pause all requests.
          if (!this.requests.isPaused) {
            const next = this.#retryDelayIterator?.next()
            if (next == null || next.done) {
              return false
            }
            this.requests.rateLimit(next.value)
          }
        } else if (
          status != null &&
          status > 400 &&
          status < 500 &&
          status !== 409 &&
          status !== 423
        ) {
          // HTTP 4xx, the server won't send anything, it's doesn't make sense to retry
          // HTTP 409 Conflict (happens if the Upload-Offset header does not match the one on the server)
          // HTTP 423 Locked (happens when a paused download is resumed too quickly)
          return false
        } else if (
          typeof navigator !== 'undefined' &&
          navigator.onLine === false
        ) {
          // The navigator is offline, let's wait for it to come back online.
          if (!this.requests.isPaused) {
            this.requests.pause()
            window.addEventListener(
              'online',
              () => {
                this.requests.resume()
              },
              { once: true },
            )
          }
        }
        queuedRequest.abort()
        queuedRequest = {
          shouldBeRequeued: true,
          abort() {
            this.shouldBeRequeued = false
          },
          done() {
            throw new Error(
              'Cannot mark a queued request as done: this indicates a bug',
            )
          },
          fn() {
            throw new Error('Cannot run a queued request: this indicates a bug')
          },
        }
        return true
      }

      if (onShouldRetry != null) {
        uploadOptions.onShouldRetry = (
          error: tus.DetailedError,
          retryAttempt: number,
        ) => onShouldRetry(error, retryAttempt, opts, defaultOnShouldRetry)
      } else {
        uploadOptions.onShouldRetry = defaultOnShouldRetry
      }

      const copyProp = (
        obj: Record<string, unknown>,
        srcProp: string,
        destProp: string,
      ) => {
        if (hasProperty(obj, srcProp) && !hasProperty(obj, destProp)) {
          // eslint-disable-next-line no-param-reassign
          obj[destProp] = obj[srcProp]
        }
      }

      // We can't use `allowedMetaFields` to index generic M
      // and we also don't care about the type specifically here,
      // we just want to pass the meta fields along.
      const meta: Record<string, string> = {}
      const allowedMetaFields =
        Array.isArray(opts.allowedMetaFields) ?
          opts.allowedMetaFields
          // Send along all fields by default.
        : Object.keys(file.meta)
      allowedMetaFields.forEach((item) => {
        // tus type definition for metadata only accepts `Record<string, string>`
        // but in reality (at runtime) it accepts `Record<string, unknown>`
        // tus internally converts everything into a string, but let's do it here instead to be explicit.
        // because Uppy can have anything inside meta values, (for example relativePath: null is often sent by uppy)
        meta[item] = String(file.meta[item])
      })

      // tusd uses metadata fields 'filetype' and 'filename'
      copyProp(meta, 'type', 'filetype')
      copyProp(meta, 'name', 'filename')

      uploadOptions.metadata = meta

      upload = new tus.Upload(file.data, uploadOptions)
      this.uploaders[file.id] = upload
      const eventManager = new EventManager(this.uppy)
      this.uploaderEvents[file.id] = eventManager

      // eslint-disable-next-line prefer-const
      qRequest = () => {
        if (!file.isPaused) {
          upload.start()
        }
        // Don't do anything here, the caller will take care of cancelling the upload itself
        // using resetUploaderReferences(). This is because resetUploaderReferences() has to be
        // called when this request is still in the queue, and has not been started yet, too. At
        // that point this cancellation function is not going to be called.
        // Also, we need to remove the request from the queue _without_ destroying everything
        // related to this upload to handle pauses.
        return () => {}
      }

      upload.findPreviousUploads().then((previousUploads) => {
        const previousUpload = previousUploads[0]
        if (previousUpload) {
          this.uppy.log(
            `[Tus] Resuming upload of ${file.id} started at ${previousUpload.creationTime}`,
          )
          upload.resumeFromPreviousUpload(previousUpload)
        }
      })

      queuedRequest = this.requests.run(qRequest)

      eventManager.onFileRemove(file.id, (targetFileID) => {
        queuedRequest.abort()
        this.resetUploaderReferences(file.id, { abort: !!upload.url })
        resolve(`upload ${targetFileID} was removed`)
      })

      eventManager.onPause(file.id, (isPaused) => {
        queuedRequest.abort()
        if (isPaused) {
          // Remove this file from the queue so another file can start in its place.
          upload.abort()
        } else {
          // Resuming an upload should be queued, else you could pause and then
          // resume a queued upload to make it skip the queue.
          queuedRequest = this.requests.run(qRequest)
        }
      })

      eventManager.onPauseAll(file.id, () => {
        queuedRequest.abort()
        upload.abort()
      })

      eventManager.onCancelAll(file.id, ({ reason } = {}) => {
        if (reason === 'user') {
          queuedRequest.abort()
          this.resetUploaderReferences(file.id, { abort: !!upload.url })
        }
        resolve(`upload ${file.id} was canceled`)
      })

      eventManager.onResumeAll(file.id, () => {
        queuedRequest.abort()
        if (file.error) {
          upload.abort()
        }
        queuedRequest = this.requests.run(qRequest)
      })
    }).catch((err) => {
      this.uppy.emit('upload-error', file, err)
      throw err
    })
  }

  /**
   * Store the uploadUrl on the file options, so that when Golden Retriever
   * restores state, we will continue uploading to the correct URL.
   */
  onReceiveUploadUrl(file: UppyFile<M, B>, uploadURL: string | null): void {
    const currentFile = this.uppy.getFile(file.id)
    if (!currentFile) return
    // Only do the update if we didn't have an upload URL yet.
    if (!currentFile.tus || currentFile.tus.uploadUrl !== uploadURL) {
      this.uppy.log('[Tus] Storing upload url')
      this.uppy.setFileState(currentFile.id, {
        tus: { ...currentFile.tus, uploadUrl: uploadURL },
      })
    }
  }

  #getCompanionClientArgs(file: UppyFile<M, B>) {
    const opts = { ...this.opts }

    if (file.tus) {
      // Install file-specific upload overrides.
      Object.assign(opts, file.tus)
    }

    return {
      ...file.remote?.body,
      endpoint: opts.endpoint,
      uploadUrl: opts.uploadUrl,
      protocol: 'tus',
      size: file.data.size,
      headers: opts.headers,
      metadata: file.meta,
    }
  }

  async #uploadFiles(files: UppyFile<M, B>[]) {
    const filesFiltered = filterNonFailedFiles(files)
    const filesToEmit = filterFilesToEmitUploadStarted(filesFiltered)
    this.uppy.emit('upload-start', filesToEmit)

    await Promise.allSettled(
      filesFiltered.map((file) => {
        if (file.isRemote) {
          const getQueue = () => this.requests
          const controller = new AbortController()

          const removedHandler = (removedFile: UppyFile<M, B>) => {
            if (removedFile.id === file.id) controller.abort()
          }
          this.uppy.on('file-removed', removedHandler)

          const uploadPromise = this.uppy
            .getRequestClientForFile<RequestClient<M, B>>(file)
            .uploadRemoteFile(file, this.#getCompanionClientArgs(file), {
              signal: controller.signal,
              getQueue,
            })

          this.requests.wrapSyncFunction(
            () => {
              this.uppy.off('file-removed', removedHandler)
            },
            { priority: -1 },
          )()

          return uploadPromise
        }

        return this.#uploadLocalFile(file)
      }),
    )
  }

  #handleUpload = async (fileIDs: string[]) => {
    if (fileIDs.length === 0) {
      this.uppy.log('[Tus] No files to upload')
      return
    }

    if (this.opts.limit === 0) {
      this.uppy.log(
        '[Tus] When uploading multiple files at once, consider setting the `limit` option (to `10` for example), to limit the number of concurrent uploads, which helps prevent memory and network issues: https://uppy.io/docs/tus/#limit-0',
        'warning',
      )
    }

    this.uppy.log('[Tus] Uploading...')
    const filesToUpload = this.uppy.getFilesByIds(fileIDs)

    await this.#uploadFiles(filesToUpload)
  }

  install(): void {
    this.uppy.setState({
      capabilities: {
        ...this.uppy.getState().capabilities,
        resumableUploads: true,
      },
    })
    this.uppy.addUploader(this.#handleUpload)

    this.uppy.on('reset-progress', this.handleResetProgress)
  }

  uninstall(): void {
    this.uppy.setState({
      capabilities: {
        ...this.uppy.getState().capabilities,
        resumableUploads: false,
      },
    })
    this.uppy.removeUploader(this.#handleUpload)
  }
}
