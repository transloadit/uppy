import hasProperty from '@uppy/utils/lib/hasProperty'
import ErrorWithCause from '@uppy/utils/lib/ErrorWithCause'
import { RateLimitedQueue } from '@uppy/utils/lib/RateLimitedQueue'
import Tus, { type TusDetailedError, type TusOpts } from '@uppy/tus'
import { BasePlugin } from '@uppy/core'
import type {
  DefinePluginOpts,
  PluginOpts,
  Uppy,
  Body,
  Meta,
  UppyFile,
} from '@uppy/core'
import Assembly from './Assembly.js'
import Client, { AssemblyError } from './Client.js'
import AssemblyWatcher from './AssemblyWatcher.js'

import locale from './locale.js'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'

export interface AssemblyFile {
  id: string
  name: string
  basename: string
  ext: string
  size: number
  mime: string
  type: string
  field: string
  md5hash: string
  is_tus_file: boolean
  original_md5hash: string
  original_id: string
  original_name: string
  original_basename: string
  original_path: string
  url: string
  ssl_url: string
  tus_upload_url: string
  meta: Record<string, any>
}

export interface AssemblyResult extends AssemblyFile {
  cost: number
  execTime: number
  queue: string
  queueTime: number
  localId: string | null
}

export interface AssemblyResponse {
  ok: string
  message?: string
  assembly_id: string
  parent_id?: string
  account_id: string
  template_id?: string
  instance: string
  assembly_url: string
  assembly_ssl_url: string
  uppyserver_url: string
  companion_url: string
  websocket_url: string
  tus_url: string
  bytes_received: number
  bytes_expected: number
  upload_duration: number
  client_agent?: string
  client_ip?: string
  client_referer?: string
  transloadit_client: string
  start_date: string
  upload_meta_data_extracted: boolean
  warnings: any[]
  is_infinite: boolean
  has_dupe_jobs: boolean
  execution_start: string
  execution_duration: number
  execution_progress?: number
  queue_duration: number
  jobs_queue_duration: number
  notify_start?: any
  notify_url?: string
  notify_status?: any
  notify_response_code?: any
  notify_duration?: any
  last_job_completed?: string
  fields: Record<string, any>
  running_jobs: any[]
  bytes_usage: number
  executing_jobs: any[]
  started_jobs: string[]
  parent_assembly_status: any
  params: string
  template?: any
  merged_params: string
  uploads: AssemblyFile[]
  results: Record<string, AssemblyResult[]>
  build_id: string
  error?: string
  stderr?: string
  stdout?: string
  reason?: string
}

export interface AssemblyParameters {
  auth: {
    key: string
    expires?: string
  }
  template_id?: string
  steps?: { [step: string]: Record<string, unknown> }
  fields?: { [name: string]: number | string }
  notify_url?: string
}

export interface AssemblyOptions {
  params?: AssemblyParameters | null
  fields?: Record<string, string | number> | string[] | null
  signature?: string | null
}

export type OptionsWithRestructuredFields = Omit<AssemblyOptions, 'fields'> & {
  fields: Record<string, string | number>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface TransloaditOptions<M extends Meta, B extends Body>
  extends PluginOpts {
  service?: string
  errorReporting?: boolean
  waitForEncoding?: boolean
  waitForMetadata?: boolean
  importFromUploadURLs?: boolean
  alwaysRunAssembly?: boolean
  limit?: number
  clientName?: string | null
  retryDelays?: number[]
  assemblyOptions?:
    | AssemblyOptions
    | (() => Promise<AssemblyOptions> | AssemblyOptions)
}

const defaultOptions = {
  service: 'https://api2.transloadit.com',
  errorReporting: true,
  waitForEncoding: false,
  waitForMetadata: false,
  alwaysRunAssembly: false,
  importFromUploadURLs: false,
  limit: 20,
  retryDelays: [7_000, 10_000, 15_000, 20_000],
  clientName: null,
} satisfies TransloaditOptions<any, any>

export type Opts<M extends Meta, B extends Body> = DefinePluginOpts<
  TransloaditOptions<M, B>,
  keyof typeof defaultOptions
>

type TransloaditState = {
  files: Record<
    string,
    { assembly: string; id: string; uploadedFile: AssemblyFile }
  >
  results: Array<{
    result: AssemblyResult
    stepName: string
    id: string
    assembly: string
  }>
}

/**
 * State we want to store in Golden Retriever to be able to recover uploads.
 */
type PersistentState = {
  assemblyResponse: AssemblyResponse
}

declare module '@uppy/core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface UppyEventMap<M extends Meta, B extends Body> {
    // We're also overriding the `restored` event as it is now populated with Transloadit state.
    restored: (pluginData: Record<string, TransloaditState>) => void
    'restore:get-data': (
      setData: (arg: Record<string, PersistentState>) => void,
    ) => void
    'transloadit:assembly-created': (
      assembly: AssemblyResponse,
      fileIDs: string[],
    ) => void
    'transloadit:assembly-cancel': (assembly: AssemblyResponse) => void
    'transloadit:import-error': (
      assembly: AssemblyResponse,
      fileID: string,
      error: Error,
    ) => void
    'transloadit:assembly-error': (
      assembly: AssemblyResponse,
      error: Error,
    ) => void
    'transloadit:assembly-executing': (assembly: AssemblyResponse) => void
    'transloadit:assembly-cancelled': (assembly: AssemblyResponse) => void
    'transloadit:upload': (
      file: AssemblyFile,
      assembly: AssemblyResponse,
    ) => void
    'transloadit:result': (
      stepName: string,
      result: AssemblyResult,
      assembly: AssemblyResponse,
    ) => void
    'transloadit:complete': (assembly: AssemblyResponse) => void
    'transloadit:execution-progress': (details: {
      progress_combined?: number
    }) => void
  }
}

declare module '@uppy/utils/lib/UppyFile' {
  // eslint-disable-next-line no-shadow, @typescript-eslint/no-unused-vars
  export interface UppyFile<M extends Meta, B extends Body> {
    transloadit?: { assembly: string }
    tus?: TusOpts<M, B>
  }
}

const sendErrorToConsole = (originalErr: Error) => (err: Error) => {
  const error = new ErrorWithCause('Failed to send error to the client', {
    cause: err,
  })
  // eslint-disable-next-line no-console
  console.error(error, originalErr)
}

function validateParams(params?: AssemblyParameters | null): void {
  if (params == null) {
    throw new Error('Transloadit: The `params` option is required.')
  }

  if (typeof params === 'string') {
    try {
      // eslint-disable-next-line no-param-reassign
      params = JSON.parse(params)
    } catch (err) {
      // Tell the user that this is not an Uppy bug!
      throw new ErrorWithCause(
        'Transloadit: The `params` option is a malformed JSON string.',
        { cause: err },
      )
    }
  }

  if (!params!.auth || !params!.auth.key) {
    throw new Error(
      'Transloadit: The `params.auth.key` option is required. ' +
        'You can find your Transloadit API key at https://transloadit.com/c/template-credentials',
    )
  }
}

const COMPANION_URL = 'https://api2.transloadit.com/companion'
// Regex matching acceptable postMessage() origins for authentication feedback from companion.
const COMPANION_ALLOWED_HOSTS = /\.transloadit\.com$/
// Regex used to check if a Companion address is run by Transloadit.
const TL_COMPANION = /https?:\/\/api2(?:-\w+)?\.transloadit\.com\/companion/

/**
 * Upload files to Transloadit using Tus.
 */
export default class Transloadit<
  M extends Meta,
  B extends Body,
> extends BasePlugin<Opts<M, B>, M, B, TransloaditState> {
  static VERSION = packageJson.version

  #rateLimitedQueue: RateLimitedQueue

  client: Client<M, B>

  assembly?: Assembly

  #watcher!: AssemblyWatcher<M, B>

  completedFiles: Record<string, boolean>

  restored: Promise<void> | null = null

  constructor(uppy: Uppy<M, B>, opts?: TransloaditOptions<M, B>) {
    super(uppy, { ...defaultOptions, ...opts })
    this.type = 'uploader'
    this.id = this.opts.id || 'Transloadit'

    this.defaultLocale = locale

    this.#rateLimitedQueue = new RateLimitedQueue(this.opts.limit)

    this.i18nInit()

    this.client = new Client({
      service: this.opts.service,
      client: this.#getClientVersion(),
      errorReporting: this.opts.errorReporting,
      rateLimitedQueue: this.#rateLimitedQueue,
    })
    // Contains a file IDs that have completed postprocessing before the upload
    // they belong to has entered the postprocess stage.
    this.completedFiles = Object.create(null)
  }

  #getClientVersion() {
    const list = [
      // @ts-expect-error VERSION comes from babel, TS does not understand
      `uppy-core:${this.uppy.constructor.VERSION}`,
      // @ts-expect-error VERSION comes from babel, TS does not understand
      `uppy-transloadit:${this.constructor.VERSION}`,
      `uppy-tus:${Tus.VERSION}`,
    ]

    const addPluginVersion = (pluginName: string, versionName: string) => {
      const plugin = this.uppy.getPlugin(pluginName)
      if (plugin) {
        // @ts-expect-error VERSION comes from babel, TS does not understand
        list.push(`${versionName}:${plugin.constructor.VERSION}`)
      }
    }

    if (this.opts.importFromUploadURLs) {
      addPluginVersion('XHRUpload', 'uppy-xhr-upload')
      addPluginVersion('AwsS3', 'uppy-aws-s3')
      addPluginVersion('AwsS3Multipart', 'uppy-aws-s3-multipart')
    }

    addPluginVersion('Dropbox', 'uppy-dropbox')
    addPluginVersion('Box', 'uppy-box')
    addPluginVersion('Facebook', 'uppy-facebook')
    addPluginVersion('GoogleDrive', 'uppy-google-drive')
    addPluginVersion('GoogleDrivePicker', 'uppy-google-drive-picker')
    addPluginVersion('GooglePhotosPicker', 'uppy-google-photos-picker')
    addPluginVersion('Instagram', 'uppy-instagram')
    addPluginVersion('OneDrive', 'uppy-onedrive')
    addPluginVersion('Zoom', 'uppy-zoom')
    addPluginVersion('Url', 'uppy-url')

    if (this.opts.clientName != null) {
      list.push(this.opts.clientName)
    }

    return list.join(',')
  }

  /**
   * Attach metadata to files to configure the Tus plugin to upload to Transloadit.
   * Also use Transloadit's Companion
   *
   * See: https://github.com/tus/tusd/wiki/Uploading-to-Transloadit-using-tus#uploading-using-tus
   */
  #attachAssemblyMetadata(file: UppyFile<M, B>, status: AssemblyResponse) {
    // Add the metadata parameters Transloadit needs.
    const meta = {
      ...file.meta,
      assembly_url: status.assembly_url,
      filename: file.name,
      fieldname: 'file',
    }
    // Add Assembly-specific Tus endpoint.
    const tus = {
      ...file.tus,
      endpoint: status.tus_url,
      // Include X-Request-ID headers for better debugging.
      addRequestId: true,
    }

    // Set Companion location. We only add this, if 'file' has the attribute
    // remote, because this is the criteria to identify remote files.
    // We only replace the hostname for Transloadit's companions, so that
    // people can also self-host them while still using Transloadit for encoding.
    let { remote } = file

    if (file.remote && TL_COMPANION.test(file.remote.companionUrl)) {
      const newHost = status.companion_url.replace(/\/$/, '')
      const path = file.remote.url
        .replace(file.remote.companionUrl, '')
        .replace(/^\//, '')

      remote = {
        ...file.remote,
        companionUrl: newHost,
        url: `${newHost}/${path}`,
      }
    }

    // Store the Assembly ID this file is in on the file under the `transloadit` key.
    const newFile = {
      ...file,
      transloadit: {
        assembly: status.assembly_id,
      },
    }
    // Only configure the Tus plugin if we are uploading straight to Transloadit (the default).
    if (!this.opts.importFromUploadURLs) {
      Object.assign(newFile, { meta, tus, remote })
    }
    return newFile
  }

  async #createAssembly(
    fileIDs: string[],
    assemblyOptions: OptionsWithRestructuredFields,
  ) {
    this.uppy.log('[Transloadit] Create Assembly')

    try {
      const newAssembly = await this.client.createAssembly({
        ...assemblyOptions,
        expectedFiles: fileIDs.length,
      })

      const files = this.uppy
        .getFiles()
        .filter(({ id }) => fileIDs.includes(id))

      if (files.length === 0 && fileIDs.length !== 0) {
        // All files have been removed, cancelling.
        await this.client.cancelAssembly(newAssembly)
        return null
      }

      const assembly = new Assembly(newAssembly, this.#rateLimitedQueue)
      const { status } = assembly
      const assemblyID = status.assembly_id

      const updatedFiles: Record<string, UppyFile<M, B>> = {}
      files.forEach((file) => {
        updatedFiles[file.id] = this.#attachAssemblyMetadata(file, status)
      })

      this.uppy.setState({
        files: {
          ...this.uppy.getState().files,
          ...updatedFiles,
        },
      })

      this.uppy.emit('transloadit:assembly-created', status, fileIDs)

      this.uppy.log(`[Transloadit] Created Assembly ${assemblyID}`)
      return assembly
    } catch (err) {
      // TODO: use AssemblyError?
      const wrapped = new ErrorWithCause(
        `${this.i18n('creatingAssemblyFailed')}: ${err.message}`,
        { cause: err },
      )
      if ('details' in err) {
        // @ts-expect-error details is not in the Error type
        wrapped.details = err.details
      }
      if ('assembly' in err) {
        // @ts-expect-error assembly is not in the Error type
        wrapped.assembly = err.assembly
      }
      throw wrapped
    }
  }

  #createAssemblyWatcher(idOrArrayOfIds: string | string[]) {
    // AssemblyWatcher tracks completion states of all Assemblies in this upload.
    const ids =
      Array.isArray(idOrArrayOfIds) ? idOrArrayOfIds : [idOrArrayOfIds]
    const watcher = new AssemblyWatcher(this.uppy, ids)

    watcher.on('assembly-complete', (id: string) => {
      const files = this.getAssemblyFiles(id)
      files.forEach((file) => {
        this.completedFiles[file.id] = true
        this.uppy.emit('postprocess-complete', file)
      })
    })

    watcher.on('assembly-error', (id: string, error: Error) => {
      // Clear postprocessing state for all our files.
      const filesFromAssembly = this.getAssemblyFiles(id)
      filesFromAssembly.forEach((file) => {
        // TODO Maybe make a postprocess-error event here?

        this.uppy.emit('upload-error', file, error)
        this.uppy.emit('postprocess-complete', file)
      })

      // Reset `tus` key in the file state, so when the upload is retried,
      // old tus upload is not re-used — Assebmly expects a new upload, can't currently
      // re-use the old one. See: https://github.com/transloadit/uppy/issues/4412
      // and `onReceiveUploadUrl` in @uppy/tus
      const files = { ...this.uppy.getState().files }
      filesFromAssembly.forEach((file) => delete files[file.id].tus)
      this.uppy.setState({ files })

      this.uppy.emit('error', error)
    })

    this.#watcher = watcher
  }

  #shouldWaitAfterUpload() {
    return this.opts.waitForEncoding || this.opts.waitForMetadata
  }

  /**
   * Used when `importFromUploadURLs` is enabled: reserves all files in
   * the Assembly.
   */
  #reserveFiles(assembly: Assembly, fileIDs: string[]) {
    return Promise.all(
      fileIDs.map((fileID) => {
        const file = this.uppy.getFile(fileID)
        return this.client.reserveFile(assembly.status, file)
      }),
    )
  }

  /**
   * Used when `importFromUploadURLs` is enabled: adds files to the Assembly
   * once they have been fully uploaded.
   */
  #onFileUploadURLAvailable = (rawFile: UppyFile<M, B> | undefined) => {
    const file = this.uppy.getFile(rawFile!.id)
    if (!file?.transloadit?.assembly) {
      return
    }

    const { status } = this.assembly!

    this.client.addFile(status, file).catch((err) => {
      this.uppy.log(err)
      this.uppy.emit('transloadit:import-error', status, file.id, err)
    })
  }

  #findFile(uploadedFile: AssemblyFile) {
    const files = this.uppy.getFiles()
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      // Completed file upload.
      if (file.uploadURL === uploadedFile.tus_upload_url) {
        return file
      }
      // In-progress file upload.
      if (file.tus && file.tus.uploadUrl === uploadedFile.tus_upload_url) {
        return file
      }
      if (!uploadedFile.is_tus_file) {
        // Fingers-crossed check for non-tus uploads, eg imported from S3.
        if (
          file.name === uploadedFile.name &&
          file.size === uploadedFile.size
        ) {
          return file
        }
      }
    }
    return undefined
  }

  #onFileUploadComplete(assemblyId: string, uploadedFile: AssemblyFile) {
    const state = this.getPluginState()
    const file = this.#findFile(uploadedFile)
    if (!file) {
      this.uppy.log(
        '[Transloadit] Couldn’t find the file, it was likely removed in the process',
      )
      return
    }
    this.setPluginState({
      files: {
        ...state.files,
        [uploadedFile.id]: {
          assembly: assemblyId,
          id: file.id,
          uploadedFile,
        },
      },
    })
    this.uppy.emit('transloadit:upload', uploadedFile, this.getAssembly()!)
  }

  #onResult(assemblyId: string, stepName: string, result: AssemblyResult) {
    const state = this.getPluginState()
    const file = state.files[result.original_id]
    // The `file` may not exist if an import robot was used instead of a file upload.
    result.localId = file ? file.id : null // eslint-disable-line no-param-reassign

    const entry = {
      result,
      stepName,
      id: result.id,
      assembly: assemblyId,
    }

    this.setPluginState({
      results: [...state.results, entry],
    })
    this.uppy.emit('transloadit:result', stepName, result, this.getAssembly()!)
  }

  /**
   * When an Assembly has finished processing, get the final state
   * and emit it.
   */
  #onAssemblyFinished(assembly: Assembly) {
    const url = assembly.status.assembly_ssl_url
    this.client.getAssemblyStatus(url).then((finalStatus) => {
      // eslint-disable-next-line no-param-reassign
      assembly.status = finalStatus
      this.uppy.emit('transloadit:complete', finalStatus)
    })
  }

  async #cancelAssembly(assembly: AssemblyResponse) {
    await this.client.cancelAssembly(assembly)
    // TODO bubble this through AssemblyWatcher so its event handlers can clean up correctly
    this.uppy.emit('transloadit:assembly-cancelled', assembly)
    this.assembly = undefined
  }

  /**
   * When all files are removed, cancel in-progress Assemblies.
   */
  #onCancelAll = async () => {
    if (!this.assembly) return
    try {
      await this.#cancelAssembly(this.assembly.status)
    } catch (err) {
      this.uppy.log(err)
    }
  }

  /**
   * Custom state serialization for the Golden Retriever plugin.
   * It will pass this back to the `_onRestored` function.
   */
  #getPersistentData = (
    setData: (arg: Record<string, PersistentState>) => void,
  ) => {
    if (this.assembly) {
      setData({ [this.id]: { assemblyResponse: this.assembly.status } })
    }
  }

  #onRestored = (pluginData: Record<string, unknown>) => {
    const savedState = (
      pluginData && pluginData[this.id] ?
        pluginData[this.id]
      : {}) as PersistentState
    const previousAssembly = savedState.assemblyResponse

    if (!previousAssembly) {
      // Nothing to restore.
      return
    }

    // Convert loaded Assembly statuses to a Transloadit plugin state object.
    const restoreState = () => {
      const files: Record<
        string,
        { id: string; assembly: string; uploadedFile: AssemblyFile }
      > = {}
      const results: {
        result: AssemblyResult
        stepName: string
        id: string
        assembly: string
      }[] = []
      const { assembly_id: id } = previousAssembly

      previousAssembly.uploads.forEach((uploadedFile) => {
        const file = this.#findFile(uploadedFile)
        files[uploadedFile.id] = {
          id: file!.id,
          assembly: id,
          uploadedFile,
        }
      })

      const state = this.getPluginState()
      Object.keys(previousAssembly.results).forEach((stepName) => {
        for (const result of previousAssembly.results[stepName]) {
          const file = state.files[result.original_id]
          result.localId = file ? file.id : null
          results.push({
            id: result.id,
            result,
            stepName,
            assembly: id,
          })
        }
      })

      this.assembly = new Assembly(previousAssembly, this.#rateLimitedQueue)
      this.assembly.status = previousAssembly
      this.setPluginState({ files, results })
      return files
    }

    // Set up the Assembly instances and AssemblyWatchers for existing Assemblies.
    const restoreAssemblies = (ids: string[]) => {
      this.#createAssemblyWatcher(previousAssembly.assembly_id)
      this.#connectAssembly(this.assembly!, ids)
    }

    // Force-update Assembly to check for missed events.
    const updateAssembly = () => {
      return this.assembly?.update()
    }

    // Restore all Assembly state.
    this.restored = (async () => {
      const files = restoreState()
      restoreAssemblies(Object.keys(files))
      await updateAssembly()
      this.restored = null
    })()

    this.restored.catch((err) => {
      this.uppy.log('Failed to restore', err)
    })
  }

  #connectAssembly(assembly: Assembly, ids: UppyFile<M, B>['id'][]) {
    const { status } = assembly
    const id = status.assembly_id
    this.assembly = assembly

    assembly.on('upload', (file: AssemblyFile) => {
      this.#onFileUploadComplete(id, file)
    })
    assembly.on('error', (error: AssemblyError) => {
      error.assembly = assembly.status // eslint-disable-line no-param-reassign
      this.uppy.emit('transloadit:assembly-error', assembly.status, error)
    })

    assembly.on('executing', () => {
      this.uppy.emit('transloadit:assembly-executing', assembly.status)
    })

    assembly.on(
      'execution-progress',
      (details: { progress_combined?: number }) => {
        this.uppy.emit('transloadit:execution-progress', details)

        if (details.progress_combined != null) {
          // TODO: Transloadit emits progress information for the entire Assembly combined
          // (progress_combined) and for each imported/uploaded file (progress_per_original_file).
          // Uppy's current design requires progress to be set for each file, which is then
          // averaged to get the total progress (see calculateProcessingProgress.js).
          // Therefore, we currently set the combined progres for every file, so that this is
          // the same value that is displayed to the end user, although we have more accurate
          // per-file progress as well. We cannot use this here or otherwise progress from
          // imported files would not be counted towards the total progress because imported
          // files are not registered with Uppy.
          for (const file of this.uppy.getFilesByIds(ids)) {
            this.uppy.emit('postprocess-progress', file, {
              mode: 'determinate',
              value: details.progress_combined / 100,
              message: this.i18n('encoding'),
            })
          }
        }
      },
    )

    if (this.opts.waitForEncoding) {
      assembly.on('result', (stepName: string, result: AssemblyResult) => {
        this.#onResult(id, stepName, result)
      })
    }

    if (this.opts.waitForEncoding) {
      assembly.on('finished', () => {
        this.#onAssemblyFinished(assembly)
      })
    } else if (this.opts.waitForMetadata) {
      assembly.on('metadata', () => {
        this.#onAssemblyFinished(assembly)
      })
    }

    // No need to connect to the socket if the Assembly has completed by now.
    // @ts-expect-error ok does not exist on Assembly?
    if (assembly.ok === 'ASSEMBLY_COMPLETE') {
      return assembly
    }

    assembly.connect()
    return assembly
  }

  #prepareUpload = async (fileIDs: string[]) => {
    const assemblyOptions = (
      typeof this.opts.assemblyOptions === 'function' ?
        await this.opts.assemblyOptions()
      : this.opts.assemblyOptions) as OptionsWithRestructuredFields

    assemblyOptions.fields ??= {}
    validateParams(assemblyOptions.params)

    try {
      const assembly =
        // this.assembly can already be defined if we recovered files with Golden Retriever (this.#onRestored)
        this.assembly ?? (await this.#createAssembly(fileIDs, assemblyOptions))

      if (assembly == null)
        throw new Error('All files were canceled after assembly was created')

      if (this.opts.importFromUploadURLs) {
        await this.#reserveFiles(assembly, fileIDs)
      }
      fileIDs.forEach((fileID) => {
        const file = this.uppy.getFile(fileID)
        this.uppy.emit('preprocess-complete', file)
      })
      this.#createAssemblyWatcher(assembly.status.assembly_id)
      this.#connectAssembly(assembly, fileIDs)
    } catch (err) {
      fileIDs.forEach((fileID) => {
        const file = this.uppy.getFile(fileID)
        // Clear preprocessing state when the Assembly could not be created,
        // otherwise the UI gets confused about the lingering progress keys
        this.uppy.emit('preprocess-complete', file)
        this.uppy.emit('upload-error', file, err)
      })
      throw err
    }
  }

  #afterUpload = async (fileIDs: string[], uploadID: string): Promise<void> => {
    try {
      // If we're still restoring state, wait for that to be done.
      await this.restored

      const files = fileIDs
        .map((fileID) => this.uppy.getFile(fileID))
        // Only use files without errors
        .filter((file) => !file.error)

      const assemblyID = this.assembly?.status.assembly_id

      const closeSocketConnections = () => {
        this.assembly?.close()
      }

      // If we don't have to wait for encoding metadata or results, we can close
      // the socket immediately and finish the upload.
      if (!this.#shouldWaitAfterUpload()) {
        closeSocketConnections()
        const status = this.assembly?.status
        if (status != null) {
          this.uppy.addResultData(uploadID, {
            transloadit: [status],
          })
        }
        return
      }

      // If no Assemblies were created for this upload, we also do not have to wait.
      // There's also no sockets or anything to close, so just return immediately.
      if (!assemblyID) {
        this.uppy.addResultData(uploadID, { transloadit: [] })
        return
      }

      const incompleteFiles = files.filter(
        (file) => !hasProperty(this.completedFiles, file.id),
      )
      incompleteFiles.forEach((file) => {
        this.uppy.emit('postprocess-progress', file, {
          mode: 'indeterminate',
          message: this.i18n('encoding'),
        })
      })

      await this.#watcher.promise
      // assembly is now done processing!
      closeSocketConnections()
      const status = this.assembly?.status
      if (status != null) {
        this.uppy.addResultData(uploadID, {
          transloadit: [status],
        })
      }
    } finally {
      // in case allowMultipleUploadBatches is true and the user wants to upload again,
      // we need to allow a new assembly to be created.
      // see https://github.com/transloadit/uppy/issues/5397
      this.assembly = undefined
    }
  }

  #closeAssemblyIfExists = () => {
    this.assembly?.close()
  }

  #onError = (err: { name: string; message: string; details?: string }) => {
    this.#closeAssemblyIfExists()
    this.assembly = undefined

    this.client
      .submitError(err)
      // if we can't report the error that sucks
      .catch(sendErrorToConsole(err))
  }

  #onTusError = (_: UppyFile<M, B> | undefined, err: Error) => {
    this.#closeAssemblyIfExists()
    if (err?.message?.startsWith('tus: ')) {
      const endpoint = (
        err as TusDetailedError
      ).originalRequest?.getUnderlyingObject()?.responseURL as string
      this.client
        .submitError(err, { endpoint })
        // if we can't report the error that sucks
        .catch(sendErrorToConsole(err))
    }
  }

  install(): void {
    this.uppy.addPreProcessor(this.#prepareUpload)
    this.uppy.addPostProcessor(this.#afterUpload)

    // We may need to close socket.io connections on error.
    this.uppy.on('error', this.#onError)

    // Handle cancellation.
    this.uppy.on('cancel-all', this.#onCancelAll)

    this.uppy.on('upload-error', this.#onTusError)

    if (this.opts.importFromUploadURLs) {
      // No uploader needed when importing; instead we take the upload URL from an existing uploader.
      this.uppy.on('upload-success', this.#onFileUploadURLAvailable)
    } else {
      // we don't need it here.
      // the regional endpoint from the Transloadit API before we can set it.
      this.uppy.use(Tus, {
        // Disable tus-js-client fingerprinting, otherwise uploading the same file at different times
        // will upload to an outdated Assembly, and we won't get socket events for it.
        //
        // To resume a Transloadit upload, we need to reconnect to the websocket, and the state that's
        // required to do that is not saved by tus-js-client's fingerprinting. We need the tus URL,
        // the Assembly URL, and the WebSocket URL, at least. We also need to know _all_ the files that
        // were added to the Assembly, so we can properly complete it. All that state is handled by
        // Golden Retriever. So, Golden Retriever is required to do resumability with the Transloadit plugin,
        // and we disable Tus's default resume implementation to prevent bad behaviours.
        storeFingerprintForResuming: false,
        // Send all metadata to Transloadit. Metadata set by the user
        // ends up as in the template as `file.user_meta`
        allowedMetaFields: true,
        // Pass the limit option to @uppy/tus
        limit: this.opts.limit,
        rateLimitedQueue: this.#rateLimitedQueue,
        retryDelays: this.opts.retryDelays,
      })
    }

    this.uppy.on('restore:get-data', this.#getPersistentData)
    this.uppy.on('restored', this.#onRestored)

    this.setPluginState({
      // Contains file data from Transloadit, indexed by their Transloadit-assigned ID.
      files: {},
      // Contains result data from Transloadit.
      results: [],
    })

    // We cannot cancel individual files because Assemblies tend to contain many files.
    const { capabilities } = this.uppy.getState()
    this.uppy.setState({
      capabilities: {
        ...capabilities,
        individualCancellation: false,
      },
    })
  }

  uninstall(): void {
    this.uppy.removePreProcessor(this.#prepareUpload)
    this.uppy.removePostProcessor(this.#afterUpload)
    this.uppy.off('error', this.#onError)

    if (this.opts.importFromUploadURLs) {
      this.uppy.off('upload-success', this.#onFileUploadURLAvailable)
    }

    const { capabilities } = this.uppy.getState()
    this.uppy.setState({
      capabilities: {
        ...capabilities,
        individualCancellation: true,
      },
    })
  }

  getAssembly(): AssemblyResponse | undefined {
    return this.assembly?.status
  }

  getAssemblyFiles(assemblyID: string): UppyFile<M, B>[] {
    return this.uppy.getFiles().filter((file) => {
      return file?.transloadit?.assembly === assemblyID
    })
  }
}

export { COMPANION_URL, COMPANION_ALLOWED_HOSTS }
