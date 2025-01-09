import { BasePlugin } from '@uppy/core'
import type {
  State,
  Uppy,
  DefinePluginOpts,
  PluginOpts,
  Meta,
  Body,
  UppyFile,
} from '@uppy/core'
import type { RequestClient } from '@uppy/companion-client'
import EventManager from '@uppy/core/lib/EventManager.js'
import {
  RateLimitedQueue,
  internalRateLimitedQueue,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore untyped
} from '@uppy/utils/lib/RateLimitedQueue'
import NetworkError from '@uppy/utils/lib/NetworkError'
import isNetworkError from '@uppy/utils/lib/isNetworkError'
import { fetcher, type FetcherOptions } from '@uppy/utils/lib/fetcher'
import {
  filterNonFailedFiles,
  filterFilesToEmitUploadStarted,
} from '@uppy/utils/lib/fileFilters'
import getAllowedMetaFields from '@uppy/utils/lib/getAllowedMetaFields'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'
import locale from './locale.js'

export interface XhrUploadOpts<M extends Meta, B extends Body>
  extends PluginOpts {
  endpoint: string
  method?:
    | 'GET'
    | 'HEAD'
    | 'POST'
    | 'PUT'
    | 'DELETE'
    | 'OPTIONS'
    | 'PATCH'
    | 'delete'
    | 'get'
    | 'head'
    | 'options'
    | 'post'
    | 'put'
    | string
  formData?: boolean
  fieldName?: string
  headers?:
    | Record<string, string>
    | ((file: UppyFile<M, B>) => Record<string, string>)
  timeout?: number
  limit?: number
  responseType?: XMLHttpRequestResponseType
  withCredentials?: boolean
  onBeforeRequest?: (
    xhr: XMLHttpRequest,
    retryCount: number,
    /** The files to be uploaded. When `bundle` is `false` only one file is in the array.  */
    files: UppyFile<M, B>[],
  ) => void | Promise<void>
  shouldRetry?: FetcherOptions['shouldRetry']
  onAfterResponse?: FetcherOptions['onAfterResponse']
  getResponseData?: (xhr: XMLHttpRequest) => B | Promise<B>
  allowedMetaFields?: boolean | string[]
  bundle?: boolean
}

export type { XhrUploadOpts as XHRUploadOptions }

declare module '@uppy/utils/lib/UppyFile' {
  // eslint-disable-next-line no-shadow
  export interface UppyFile<M extends Meta, B extends Body> {
    xhrUpload?: XhrUploadOpts<M, B>
  }
}

declare module '@uppy/core' {
  // eslint-disable-next-line no-shadow
  export interface State<M extends Meta, B extends Body> {
    xhrUpload?: XhrUploadOpts<M, B>
  }
}

function buildResponseError(
  xhr?: XMLHttpRequest,
  err?: string | Error | NetworkError,
) {
  let error = err
  // No error message
  if (!error) error = new Error('Upload error')
  // Got an error message string
  if (typeof error === 'string') error = new Error(error)
  // Got something else
  if (!(error instanceof Error)) {
    error = Object.assign(new Error('Upload error'), { data: error })
  }

  if (isNetworkError(xhr)) {
    error = new NetworkError(error, xhr)
    return error
  }

  // @ts-expect-error request can only be set on NetworkError
  // but we use NetworkError to distinguish between errors.
  error.request = xhr
  return error
}

/**
 * Set `data.type` in the blob to `file.meta.type`,
 * because we might have detected a more accurate file type in Uppy
 * https://stackoverflow.com/a/50875615
 */
function setTypeInBlob<M extends Meta, B extends Body>(file: UppyFile<M, B>) {
  const dataWithUpdatedType = file.data.slice(0, file.data.size, file.meta.type)
  return dataWithUpdatedType
}

const defaultOptions = {
  formData: true,
  fieldName: 'file',
  method: 'post',
  allowedMetaFields: true,
  bundle: false,
  headers: {},
  timeout: 30 * 1000,
  limit: 5,
  withCredentials: false,
  responseType: '',
} satisfies Partial<XhrUploadOpts<any, any>>

type Opts<M extends Meta, B extends Body> = DefinePluginOpts<
  XhrUploadOpts<M, B>,
  keyof typeof defaultOptions
>

interface OptsWithHeaders<M extends Meta, B extends Body> extends Opts<M, B> {
  headers: Record<string, string>
}

export default class XHRUpload<
  M extends Meta,
  B extends Body,
> extends BasePlugin<Opts<M, B>, M, B> {
  // eslint-disable-next-line global-require
  static VERSION = packageJson.version

  #getFetcher

  requests: RateLimitedQueue

  uploaderEvents: Record<string, EventManager<M, B> | null>

  constructor(uppy: Uppy<M, B>, opts: XhrUploadOpts<M, B>) {
    super(uppy, {
      ...defaultOptions,
      fieldName: opts.bundle ? 'files[]' : 'file',
      ...opts,
    })
    this.type = 'uploader'
    this.id = this.opts.id || 'XHRUpload'

    this.defaultLocale = locale

    this.i18nInit()

    // Simultaneous upload limiting is shared across all uploads with this plugin.
    if (internalRateLimitedQueue in this.opts) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore untyped internal
      this.requests = this.opts[internalRateLimitedQueue]
    } else {
      this.requests = new RateLimitedQueue(this.opts.limit)
    }

    if (this.opts.bundle && !this.opts.formData) {
      throw new Error(
        '`opts.formData` must be true when `opts.bundle` is enabled.',
      )
    }

    if (this.opts.bundle && typeof this.opts.headers === 'function') {
      throw new Error(
        '`opts.headers` can not be a function when the `bundle: true` option is set.',
      )
    }

    if (opts?.allowedMetaFields === undefined && 'metaFields' in this.opts) {
      throw new Error(
        'The `metaFields` option has been renamed to `allowedMetaFields`.',
      )
    }

    this.uploaderEvents = Object.create(null)
    /**
     * xhr-upload wrapper for `fetcher` to handle user options
     * `validateStatus`, `getResponseError`, `getResponseData`
     * and to emit `upload-progress`, `upload-error`, and `upload-success` events.
     */
    this.#getFetcher = (files: UppyFile<M, B>[]) => {
      return async (
        url: string,
        options: Omit<FetcherOptions, 'onBeforeRequest'> & {
          onBeforeRequest?: Opts<M, B>['onBeforeRequest']
        },
      ) => {
        try {
          const res = await fetcher(url, {
            ...options,
            onBeforeRequest: (xhr, retryCount) =>
              this.opts.onBeforeRequest?.(xhr, retryCount, files),
            shouldRetry: this.opts.shouldRetry,
            onAfterResponse: this.opts.onAfterResponse,
            onTimeout: (timeout) => {
              const seconds = Math.ceil(timeout / 1000)
              const error = new Error(this.i18n('uploadStalled', { seconds }))
              this.uppy.emit('upload-stalled', error, files)
            },
            onUploadProgress: (event) => {
              if (event.lengthComputable) {
                for (const { id } of files) {
                  const file = this.uppy.getFile(id)
                  this.uppy.emit('upload-progress', file, {
                    uploadStarted: file.progress.uploadStarted ?? 0,
                    bytesUploaded: (event.loaded / event.total) * file.size!,
                    bytesTotal: file.size,
                  })
                }
              }
            },
          })

          let body = await this.opts.getResponseData?.(res)
          try {
            body ??= JSON.parse(res.responseText) as B
          } catch (cause) {
            throw new Error(
              '@uppy/xhr-upload expects a JSON response (with a `url` property). To parse non-JSON responses, use `getResponseData` to turn your response into JSON.',
              { cause },
            )
          }

          const uploadURL = typeof body?.url === 'string' ? body.url : undefined

          for (const { id } of files) {
            this.uppy.emit('upload-success', this.uppy.getFile(id), {
              status: res.status,
              body,
              uploadURL,
            })
          }

          return res
        } catch (error) {
          if (error.name === 'AbortError') {
            return undefined
          }
          const request = error.request as XMLHttpRequest | undefined

          for (const file of files) {
            this.uppy.emit(
              'upload-error',
              this.uppy.getFile(file.id),
              buildResponseError(request, error),
              request,
            )
          }

          throw error
        }
      }
    }
  }

  getOptions(file: UppyFile<M, B>): OptsWithHeaders<M, B> {
    const overrides = this.uppy.getState().xhrUpload
    const { headers } = this.opts

    const opts = {
      ...this.opts,
      ...(overrides || {}),
      ...(file.xhrUpload || {}),
      headers: {},
    }
    // Support for `headers` as a function, only in the XHRUpload settings.
    // Options set by other plugins in Uppy state or on the files themselves are still merged in afterward.
    //
    // ```js
    // headers: (file) => ({ expires: file.meta.expires })
    // ```
    if (typeof headers === 'function') {
      opts.headers = headers(file)
    } else {
      Object.assign(opts.headers, this.opts.headers)
    }

    if (overrides) {
      Object.assign(opts.headers, overrides.headers)
    }
    if (file.xhrUpload) {
      Object.assign(opts.headers, file.xhrUpload.headers)
    }

    return opts
  }

  // eslint-disable-next-line class-methods-use-this
  addMetadata(
    formData: FormData,
    meta: State<M, B>['meta'],
    opts: Opts<M, B>,
  ): void {
    const allowedMetaFields = getAllowedMetaFields(opts.allowedMetaFields, meta)

    allowedMetaFields.forEach((item) => {
      const value = meta[item]
      if (Array.isArray(value)) {
        // In this case we don't transform `item` to add brackets, it's up to
        // the user to add the brackets so it won't be overridden.
        value.forEach((subItem) => formData.append(item, subItem))
      } else {
        formData.append(item, value as string)
      }
    })
  }

  createFormDataUpload(file: UppyFile<M, B>, opts: Opts<M, B>): FormData {
    const formPost = new FormData()

    this.addMetadata(formPost, file.meta, opts)

    const dataWithUpdatedType = setTypeInBlob(file)

    if (file.name) {
      formPost.append(opts.fieldName, dataWithUpdatedType, file.meta.name)
    } else {
      formPost.append(opts.fieldName, dataWithUpdatedType)
    }

    return formPost
  }

  createBundledUpload(files: UppyFile<M, B>[], opts: Opts<M, B>): FormData {
    const formPost = new FormData()

    const { meta } = this.uppy.getState()
    this.addMetadata(formPost, meta, opts)

    files.forEach((file) => {
      const options = this.getOptions(file)

      const dataWithUpdatedType = setTypeInBlob(file)

      if (file.name) {
        formPost.append(options.fieldName, dataWithUpdatedType, file.name)
      } else {
        formPost.append(options.fieldName, dataWithUpdatedType)
      }
    })

    return formPost
  }

  async #uploadLocalFile(file: UppyFile<M, B>) {
    const events = new EventManager(this.uppy)
    const controller = new AbortController()
    const uppyFetch = this.requests.wrapPromiseFunction(async () => {
      const opts = this.getOptions(file)
      const fetch = this.#getFetcher([file])
      const body =
        opts.formData ? this.createFormDataUpload(file, opts) : file.data
      return fetch(opts.endpoint, {
        ...opts,
        body,
        signal: controller.signal,
      })
    })

    events.onFileRemove(file.id, () => controller.abort())
    events.onCancelAll(file.id, () => {
      controller.abort()
    })

    try {
      await uppyFetch().abortOn(controller.signal)
    } catch (error) {
      // TODO: create formal error with name 'AbortError' (this comes from RateLimitedQueue)
      if (error.message !== 'Cancelled') {
        throw error
      }
    } finally {
      events.remove()
    }
  }

  async #uploadBundle(files: UppyFile<M, B>[]) {
    const controller = new AbortController()
    const uppyFetch = this.requests.wrapPromiseFunction(async () => {
      const optsFromState = this.uppy.getState().xhrUpload ?? {}
      const fetch = this.#getFetcher(files)
      const body = this.createBundledUpload(files, {
        ...this.opts,
        ...optsFromState,
      })
      return fetch(this.opts.endpoint, {
        // headers can't be a function with bundle: true
        ...(this.opts as OptsWithHeaders<M, B>),
        body,
        signal: controller.signal,
      })
    })

    function abort() {
      controller.abort()
    }

    // We only need to abort on cancel all because
    // individual cancellations are not possible with bundle: true
    this.uppy.once('cancel-all', abort)

    try {
      await uppyFetch().abortOn(controller.signal)
    } catch (error) {
      // TODO: create formal error with name 'AbortError' (this comes from RateLimitedQueue)
      if (error.message !== 'Cancelled') {
        throw error
      }
    } finally {
      this.uppy.off('cancel-all', abort)
    }
  }

  #getCompanionClientArgs(file: UppyFile<M, B>) {
    const opts = this.getOptions(file)
    const allowedMetaFields = getAllowedMetaFields(
      opts.allowedMetaFields,
      file.meta,
    )
    return {
      ...file.remote?.body,
      protocol: 'multipart',
      endpoint: opts.endpoint,
      size: file.data.size,
      fieldname: opts.fieldName,
      metadata: Object.fromEntries(
        allowedMetaFields.map((name) => [name, file.meta[name]]),
      ),
      httpMethod: opts.method,
      useFormData: opts.formData,
      headers: opts.headers,
    }
  }

  async #uploadFiles(files: UppyFile<M, B>[]) {
    await Promise.allSettled(
      files.map((file) => {
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
      this.uppy.log('[XHRUpload] No files to upload!')
      return
    }

    // No limit configured by the user, and no RateLimitedQueue passed in by a "parent" plugin
    // (basically just AwsS3) using the internal symbol
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore untyped internal
    if (this.opts.limit === 0 && !this.opts[internalRateLimitedQueue]) {
      this.uppy.log(
        '[XHRUpload] When uploading multiple files at once, consider setting the `limit` option (to `10` for example), to limit the number of concurrent uploads, which helps prevent memory and network issues: https://uppy.io/docs/xhr-upload/#limit-0',
        'warning',
      )
    }

    this.uppy.log('[XHRUpload] Uploading...')
    const files = this.uppy.getFilesByIds(fileIDs)

    const filesFiltered = filterNonFailedFiles(files)
    const filesToEmit = filterFilesToEmitUploadStarted(filesFiltered)
    this.uppy.emit('upload-start', filesToEmit)

    if (this.opts.bundle) {
      // if bundle: true, we don’t support remote uploads
      const isSomeFileRemote = filesFiltered.some((file) => file.isRemote)
      if (isSomeFileRemote) {
        throw new Error(
          'Can’t upload remote files when the `bundle: true` option is set',
        )
      }

      if (typeof this.opts.headers === 'function') {
        throw new TypeError(
          '`headers` may not be a function when the `bundle: true` option is set',
        )
      }

      await this.#uploadBundle(filesFiltered)
    } else {
      await this.#uploadFiles(filesFiltered)
    }
  }

  install(): void {
    if (this.opts.bundle) {
      const { capabilities } = this.uppy.getState()
      this.uppy.setState({
        capabilities: {
          ...capabilities,
          individualCancellation: false,
        },
      })
    }

    this.uppy.addUploader(this.#handleUpload)
  }

  uninstall(): void {
    if (this.opts.bundle) {
      const { capabilities } = this.uppy.getState()
      this.uppy.setState({
        capabilities: {
          ...capabilities,
          individualCancellation: true,
        },
      })
    }

    this.uppy.removeUploader(this.#handleUpload)
  }
}
