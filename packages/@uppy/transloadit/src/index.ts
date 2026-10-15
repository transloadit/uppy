import type {
  AssemblyInstructionsInput,
  AssemblyStatus,
  AssemblyStatusResult,
  AssemblyStatusUpload,
} from '@transloadit/types'
import type {
  Body,
  DefinePluginOpts,
  Meta,
  PluginOpts,
  Uppy,
  UppyEventMap,
  UppyFile,
} from '@uppy/core'
import { BasePlugin } from '@uppy/core'
import {
  ErrorWithCause,
  RateLimitedQueue,
  type RemoteUppyFile,
  toError,
} from '@uppy/core/utils'
import Tus, { type TusDetailedError, type TusOpts } from '@uppy/tus'
import packageJson from '../package.json' with { type: 'json' }
import Assembly from './Assembly.js'
import AssemblyWatcher from './AssemblyWatcher.js'
import Client, { type AssemblyError } from './Client.js'
import locale from './locale.js'

export type AssemblyResponse = AssemblyStatus & {
  progress_combined?: number
}
export type AssemblyFile = AssemblyStatusUpload
export type AssemblyResult = AssemblyStatusResult & { localId: string | null }
export type AssemblyParameters = AssemblyInstructionsInput

export interface AssemblyOptions {
  params?: AssemblyParameters | string | null
  fields?: Record<string, string | number> | string[] | null
  signature?: string | null
}

export type OptionsWithRestructuredFields = Omit<AssemblyOptions, 'fields'> & {
  fields: Record<string, string | number>
}

export interface TransloaditOptions<_M extends Meta, _B extends Body>
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
  /**
   * Live status of the currently-active assembly. Tracks every status
   * transition (UPLOADING → EXECUTING → ...). Cleared automatically when
   * `this.assembly = undefined` (no live assembly).
   */
  assemblyStatus: AssemblyResponse | undefined
  /**
   * Snapshot of the most recent non-null status seen. Persists across the
   * gap between uploads so the UI can keep showing "your last upload's
   * result" after `assemblyStatus` clears. Overwritten by the next
   * status update routed through `#handleAssemblyStatusUpdate`.
   */
  lastAssemblyStatus: AssemblyResponse | undefined
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

/**
 * An Assembly in use: by the upload that got it (none yet for a restored
 * one), with the watcher that settles once the Assembly is done.
 */
type AssemblyUse<M extends Meta, B extends Body> = {
  assembly: Assembly
  uploadID?: string
  watcher: AssemblyWatcher<M, B>
}

declare module '@uppy/core' {
  export interface UppyEventMap<M extends Meta, B extends Body> {
    // We're also overriding the `restored` event as it is now populated with Transloadit state.
    restored: (pluginData: Record<string, PersistentState>) => void
    'restore:plugin-data-changed': (
      pluginData: Record<string, PersistentState | undefined>,
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

  export interface PluginTypeRegistry<M extends Meta, B extends Body> {
    Transloadit: Transloadit<M, B>
  }
}

declare module '@uppy/core/utils' {
  export interface LocalUppyFile<M extends Meta, B extends Body> {
    transloadit?: { assembly: string }
    tus?: TusOpts<M, B>
  }
  export interface RemoteUppyFile<M extends Meta, B extends Body> {
    transloadit?: { assembly: string }
    tus?: TusOpts<M, B>
  }
}

const sendErrorToConsole = (originalErr: Error) => (err: Error) => {
  const error = new ErrorWithCause('Failed to send error to the client', {
    cause: err,
  })
  console.error(error, originalErr)
}

function validateParams(params?: AssemblyOptions['params']): void {
  if (params == null) {
    throw new Error('Transloadit: The `params` option is required.')
  }

  let parsed: AssemblyParameters
  if (typeof params === 'string') {
    try {
      parsed = JSON.parse(params) as AssemblyParameters
    } catch (err) {
      // Tell the user that this is not an Uppy bug!
      throw new ErrorWithCause(
        'Transloadit: The `params` option is a malformed JSON string.',
        { cause: err },
      )
    }
  } else {
    parsed = params
  }

  if (!parsed.auth?.key) {
    throw new Error(
      'Transloadit: The `params.auth.key` option is required. ' +
        'You can find your Transloadit API key at https://transloadit.com/c/template-credentials',
    )
  }
}

function ensureAssemblyId(status: AssemblyResponse): string {
  if (!status.assembly_id) {
    console.warn('Assembly status is missing `assembly_id`.', status)
    throw new Error('Transloadit: Assembly status is missing `assembly_id`.')
  }
  return status.assembly_id
}

function ensureUrl(
  label: string,
  ...candidates: Array<string | undefined>
): string {
  for (const value of candidates) {
    if (typeof value === 'string' && value.length > 0) {
      return value
    }
  }
  throw new Error(`Transloadit: Assembly status is missing ${label}.`)
}

export function getAssemblyUrl(
  assembly: Pick<AssemblyResponse, 'assembly_ssl_url' | 'assembly_url'>,
): string {
  return ensureUrl(
    '`assembly_url`',
    assembly.assembly_url,
    assembly.assembly_ssl_url,
  )
}

export function getAssemblyUrlSsl(
  assembly: Pick<AssemblyResponse, 'assembly_ssl_url' | 'assembly_url'>,
): string {
  return ensureUrl(
    '`assembly_ssl_url`',
    assembly.assembly_ssl_url,
    assembly.assembly_url,
  )
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

  static COMPANION_URL = COMPANION_URL

  static COMPANION_ALLOWED_HOSTS = COMPANION_ALLOWED_HOSTS

  #rateLimitedQueue: RateLimitedQueue

  client: Client<M, B>

  #assembly?: Assembly

  /**
   * The Assemblies in use. An upload gets one of its own (or claims one
   * restored with Golden Retriever that no upload has yet) and lets go of it
   * however it ends, so that no other upload's is touched on its account, and
   * none is left behind for the next upload to take.
   */
  #inUse = new Set<AssemblyUse<M, B>>()

  completedFiles: Record<string, boolean>

  restored: Promise<void> | null = null

  /** How many times all uploads were cancelled; an attempt notes it at its start. */
  #cancels = 0

  /** Whether admission is closed by this plugin (and so may be reopened by it). */
  #closedAdmission = false

  /**
   * Attempts that have ended (failed, cancelled, nothing left) but that core
   * may not have dropped yet: they no longer hold admission closed.
   */
  #endedUploads = new Set<string>()

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
    const assemblyUrl = getAssemblyUrl(status)
    const tusEndpoint = ensureUrl('`tus_url`', status.tus_url)
    const assemblyId = ensureAssemblyId(status)

    const meta = {
      ...file.meta,
      // @TODO(tim-kos), can we safely bump this to assembly_ssl_url / getAssemblyUrlSsl?
      assembly_url: assemblyUrl,
      filename: file.name,
      fieldname: 'file',
    }
    // Add Assembly-specific Tus endpoint.
    const tus = {
      ...file.tus,
      endpoint: tusEndpoint,
      // Include X-Request-ID headers for better debugging.
      addRequestId: true,
    }

    // Set Companion location. We only add this, if 'file' has the attribute
    // remote, because this is the criteria to identify remote files.
    // We only replace the hostname for Transloadit's companions, so that
    // people can also self-host them while still using Transloadit for encoding.
    let remote: RemoteUppyFile<M, B>['remote'] | undefined

    if ('remote' in file && file.remote) {
      ;({ remote } = file)

      if (status.companion_url && TL_COMPANION.test(file.remote.companionUrl)) {
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
    }

    // Store the Assembly ID this file is in on the file under the `transloadit` key.
    const newFile = {
      ...file,
      transloadit: {
        assembly: assemblyId,
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
    cancelled: () => boolean,
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

      if ((files.length === 0 && fileIDs.length !== 0) || cancelled()) {
        // All files have been removed, or the upload was cancelled: cancelling.
        await this.client.cancelAssembly(newAssembly)
        return null
      }

      const assembly = new Assembly(newAssembly, this.#rateLimitedQueue)
      const { status } = assembly
      const assemblyID = ensureAssemblyId(status)

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
    } catch (e) {
      const err = toError(e)
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
    const ids = Array.isArray(idOrArrayOfIds)
      ? idOrArrayOfIds
      : [idOrArrayOfIds]
    const watcher = new AssemblyWatcher(this.uppy, ids)

    watcher.on('assembly-complete', (id: string) => {
      const files = this.getAssemblyFiles(id)
      files.forEach((file) => {
        this.completedFiles[file.id] = true
        this.uppy.emit('postprocess-complete', file)
      })
    })

    watcher.on('assembly-error', (id: string, error: Error) => {
      // Its upload ends with the error, so nothing waits for it any more. A
      // late error of an older (cancelled) Assembly finds nothing in use.
      const use = this.#inUseWithId(id)
      if (use) this.#release(use)
      this.#reportAssemblyError(id, error)
    })

    return watcher
  }

  /** The Assembly upload `uploadID` is using, if any. */
  #inUseBy(uploadID: string) {
    for (const use of this.#inUse) {
      if (use.uploadID === uploadID) return use
    }
    return undefined
  }

  /** The Assembly `id` in use, if any. */
  #inUseWithId(id: string | undefined) {
    for (const use of this.#inUse) {
      if (use.assembly.status.assembly_id === id) return use
    }
    return undefined
  }

  /**
   * Done with an Assembly, however its upload ended: it stops updating, and
   * the next upload creates its own rather than take it. The live one (the
   * UI's) is another in use, if any; clearing it also clears `assemblyStatus`.
   */
  #release(use: AssemblyUse<M, B>) {
    this.#inUse.delete(use)
    use.assembly.close()
    use.watcher.stop()
    if (this.assembly === use.assembly) {
      this.assembly = this.#inUse.values().next().value?.assembly
    }
  }

  /** Fails the files of Assembly `id` and reports the error. */
  #reportAssemblyError(id: string, error: Error) {
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
    filesFromAssembly.forEach((file) => {
      delete files[file.id].tus
    })
    this.uppy.setState({ files })

    this.uppy.emit('error', error)
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
   * Mirrors the live Assembly status into plugin state and lets Golden
   * Retriever serialize it for restore. `assemblyStatus` is written
   * unconditionally — when `this.assembly = undefined`, `assemblyResponse`
   * is undefined and `assemblyStatus` clears too. `lastAssemblyStatus`
   * captures the most recent non-null status so the UI can keep displaying
   * the previous run's result after `assemblyStatus` clears.
   */
  #handleAssemblyStatusUpdate = (
    assemblyResponse: AssemblyResponse | undefined,
  ) => {
    if (assemblyResponse != null) {
      this.setPluginState({ lastAssemblyStatus: assemblyResponse })
    }
    this.setPluginState({ assemblyStatus: assemblyResponse })
    this.uppy.emit('restore:plugin-data-changed', {
      [this.id]: assemblyResponse ? { assemblyResponse } : undefined,
    })
  }

  get assembly() {
    return this.#assembly
  }
  set assembly(newAssembly: Assembly | undefined) {
    // Only the live one reports its status (another one may still be in use).
    this.#assembly?.off('status', this.#handleAssemblyStatusUpdate)
    this.#assembly = newAssembly

    this.#handleAssemblyStatusUpdate(newAssembly?.status)

    newAssembly?.on('status', this.#handleAssemblyStatusUpdate)
  }

  /**
   * Used when `importFromUploadURLs` is enabled: adds files to the Assembly
   * once they have been fully uploaded.
   */
  #onFileUploadURLAvailable = (rawFile: UppyFile<M, B> | undefined) => {
    const file = this.uppy.getFile(rawFile!.id)
    // Its Assembly, which may have been let go of meanwhile (another of its
    // files failed, say): nothing to add the file to then.
    const use = this.#inUseWithId(file?.transloadit?.assembly)
    if (!use) {
      return
    }

    const { status } = use.assembly

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

    if (!('id' in result)) {
      console.warn('Result has no id', result)
      return
    }
    if (typeof result.id !== 'string') {
      console.warn('Result has no id of type string', result)
      return
    }

    const entry = {
      result,
      stepName,
      id: result.id,
      assembly: assemblyId,
    }

    this.setPluginState({
      results: [...state.results, entry],
    })
    this.uppy.emit(
      'transloadit:result',
      stepName,
      entry.result,
      this.getAssembly()!,
    )
  }

  /**
   * When an Assembly has finished processing, get the final state
   * and emit it.
   */
  #onAssemblyFinished(assembly: Assembly) {
    const url = getAssemblyUrlSsl(assembly.status)
    this.client.getAssemblyStatus(url).then(
      (finalStatus) => {
        assembly.status = finalStatus
        this.uppy.emit('transloadit:complete', finalStatus)
      },
      (err) => {
        // Without the final status the upload would wait forever: it fails
        // as it does when a status request fails while polling.
        this.uppy.emit(
          'transloadit:assembly-error',
          assembly.status,
          toError(err),
        )
      },
    )
  }

  async #cancelAssembly(assembly: Assembly) {
    await this.client.cancelAssembly(assembly.status)
    // TODO bubble this through AssemblyWatcher so its event handlers can clean up correctly

    // Its status may have been updated after the cancellation was triggered.
    this.uppy.emit('transloadit:assembly-cancelled', assembly.status)
  }

  /**
   * When all files are removed, cancel in-progress Assemblies.
   */
  #onCancelAll = async () => {
    this.#cancels += 1
    // Every upload ends here, but core keeps one without files (a Template
    // importing its own inputs) in `currentUploads`: it must not hold
    // admission closed, nor have later steps run for it.
    for (const id of Object.keys(this.uppy.getState().currentUploads)) {
      this.#endedUploads.add(id)
    }
    // Let go of before the requests: an upload started before they return
    // must create its own Assembly, not take one of these.
    const uses = [...this.#inUse]
    for (const use of uses) this.#release(use)
    for (const { assembly } of uses) {
      try {
        await this.#cancelAssembly(assembly)
      } catch (err) {
        this.uppy.log(err)
      }
    }
    // Reopen admission, unless an upload started meanwhile holds it.
    this.#allowNewUploadIfIdle()
  }

  #onRestored = (pluginData: Record<string, PersistentState>) => {
    const savedState: {
      assemblyResponse?: PersistentState['assemblyResponse']
    } = pluginData?.[this.id] ? pluginData[this.id] : {}
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
      const id = ensureAssemblyId(previousAssembly)

      previousAssembly.uploads?.forEach((uploadedFile) => {
        const file = this.#findFile(uploadedFile)
        files[uploadedFile.id] = {
          id: file!.id,
          assembly: id,
          uploadedFile,
        }
      })

      const state = this.getPluginState()
      const restoredResults = previousAssembly.results ?? {}

      Object.keys(restoredResults).forEach((stepName) => {
        const stepResults = restoredResults[stepName] ?? []
        for (const result of stepResults) {
          if (!('id' in result)) {
            console.warn('Result has no id', result)
            continue
          }
          if (typeof result.id !== 'string') {
            console.warn('Result has no id of type string', result)
            continue
          }
          if (!('original_id' in result)) {
            console.warn('Result has no original_id', result)
            continue
          }
          if (typeof result.original_id !== 'string') {
            console.warn('Result has no original_id of type string', result)
            continue
          }
          const file = state.files[result.original_id]
          results.push({
            id: result.id,
            result: { ...result, localId: file ? file.id : null },
            stepName,
            assembly: id,
          })
        }
      })

      const assembly = new Assembly(previousAssembly, this.#rateLimitedQueue)
      assembly.status = previousAssembly
      this.assembly = assembly
      this.setPluginState({ files, results })
      return files
    }

    // Set up the Assembly instances and AssemblyWatchers for existing Assemblies.
    const restoreAssemblies = (ids: string[]) => {
      const assembly = this.assembly!
      // The upload being restored uses it; if core restored none, the next
      // upload to prepare claims it.
      const [uploadID] = Object.keys(this.uppy.getState().currentUploads)
      this.#inUse.add({
        assembly,
        uploadID,
        watcher: this.#createAssemblyWatcher(
          ensureAssemblyId(previousAssembly),
        ),
      })
      this.#connectAssembly(assembly, ids)
    }

    // Force-update Assembly to check for missed events.
    const updateAssembly = () => {
      return this.assembly?.update()
    }

    // Restore all Assembly state.
    this.restored = (async () => {
      const files = restoreState()
      // By their Uppy ids, as `#connectAssembly` reports progress on them.
      restoreAssemblies(Object.values(files).map(({ id }) => id))
      await updateAssembly()
      this.restored = null
    })()

    this.restored.catch((err) => {
      this.uppy.log('Failed to restore', err)
    })
  }

  #connectAssembly(assembly: Assembly, ids: UppyFile<M, B>['id'][]) {
    const { status } = assembly
    const id = ensureAssemblyId(status)

    assembly.on('upload', (file: AssemblyFile) => {
      this.#onFileUploadComplete(id, file)
    })
    assembly.on('error', (error: AssemblyError) => {
      error.assembly = assembly.status
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

  #prepareUpload = async (fileIDs: string[], uploadID: string) => {
    // Prevent adding/dropping files during upload to avoid creating multiple assemblies
    // TODO we should rewrite to instead infer allowNewUpload based on upload state
    this.uppy.setState({ allowNewUpload: false })
    this.#closedAdmission = true
    // Cancelled while waiting below. Core does not stop a running preprocessor,
    // and a file added again meanwhile has the id of the removed one, so the
    // files alone cannot tell: an Assembly created now would attach to that
    // file and be reused by the next batch, whatever it was signed for. An
    // upload without files (a Template importing its own inputs) even stays
    // in `currentUploads` when all are cancelled.
    const cancelsAtStart = this.#cancels
    const cancelled = () =>
      this.#cancels !== cancelsAtStart ||
      !(uploadID in this.uppy.getState().currentUploads)
    // This attempt's Assembly: a restored one it claims, or one it creates.
    // The latter is `created` as well: it is cancelled on the server if the
    // attempt is.
    let assembly: Assembly | undefined
    let created: Assembly | undefined

    try {
      // Fetching the options can fail like creating the Assembly can; both
      // must fail the files and allow new uploads, as a retry has no `error`
      // event to fall back on.
      const assemblyOptions = (
        typeof this.opts.assemblyOptions === 'function'
          ? await this.opts.assemblyOptions()
          : this.opts.assemblyOptions
      ) as OptionsWithRestructuredFields

      assemblyOptions.fields = {
        ...(assemblyOptions.fields ?? {}),
      }
      validateParams(assemblyOptions.params)

      // Restored with Golden Retriever (#onRestored): for this upload, or for
      // none yet. Claimed before anything is awaited, so that another upload
      // preparing meanwhile creates its own.
      const restored =
        this.#inUseBy(uploadID) ??
        [...this.#inUse].find((use) => use.uploadID == null)
      if (restored) {
        restored.uploadID = uploadID
        assembly = restored.assembly
      } else if (!cancelled()) {
        created =
          (await this.#createAssembly(fileIDs, assemblyOptions, cancelled)) ??
          undefined
        assembly = created
      }
      if (assembly != null && this.opts.importFromUploadURLs && !cancelled()) {
        await this.#reserveFiles(assembly, fileIDs)
      }

      if (assembly == null || cancelled()) {
        // Nothing left to upload: every file was removed, or the upload was
        // cancelled while its options were fetched, its Assembly was created
        // or announced (an `assembly-created` listener), or its files were
        // reserved. An Assembly made for this attempt is cancelled on the
        // server, so the next batch cannot pick it up. One in use already (a
        // restored one) was let go of by the cancel, or is as the upload was
        // dropped (`#onStateUpdate`).
        if (created) await this.#cancelAssembly(created)
        this.#allowNewUploadIfIdle(uploadID)
        return
      }
      fileIDs.forEach((fileID) => {
        const file = this.uppy.getFile(fileID)
        this.uppy.emit('preprocess-complete', file)
      })
      // A restored one has been watched and connected since the restore.
      if (created) {
        this.#inUse.add({
          assembly: created,
          uploadID,
          watcher: this.#createAssemblyWatcher(
            ensureAssemblyId(created.status),
          ),
        })
        this.assembly = created
        this.#connectAssembly(created, fileIDs)
      }
    } catch (err) {
      const error = toError(err)
      if (cancelled()) {
        // Its files are gone, or belong to a newer upload by now, which owns
        // their error state and admission: this attempt has nothing to report.
        this.uppy.log(
          `[Transloadit] A cancelled upload could not be prepared: ${error.message}`,
          'warning',
        )
        // Its reservation failed, say: the Assembly is still this attempt's.
        if (created) {
          await this.#cancelAssembly(created).catch((cancelError) =>
            this.uppy.log(cancelError),
          )
        }
        this.#allowNewUploadIfIdle(uploadID)
        return
      }
      // The Assembly it failed with (a restored one whose reservation was
      // rejected, say) goes as core drops the upload (`#onStateUpdate`), so
      // a retry does not fail with it again.
      fileIDs.forEach((fileID) => {
        const file = this.uppy.getFile(fileID)
        // Clear preprocessing state when the Assembly could not be created,
        // otherwise the UI gets confused about the lingering progress keys
        this.uppy.emit('preprocess-complete', file)
        this.uppy.emit('upload-error', file, error)
      })
      // Reopen admission, unless another upload still holds it closed.
      this.#allowNewUploadIfIdle(uploadID)
      throw error
    }
  }

  /**
   * Files may be added again once an attempt ends with nothing to upload or
   * fails, unless another upload is preparing or running meanwhile and holds
   * that. `endedUploadID` is the attempt itself. Core only drops it once its
   * preprocessor has thrown, so it does not count, and neither does any other
   * attempt that has ended meanwhile (two retries failing in the same turn
   * each still see the other).
   */
  #allowNewUploadIfIdle(endedUploadID?: string) {
    if (endedUploadID) this.#endedUploads.add(endedUploadID)
    const { currentUploads } = this.uppy.getState()
    for (const id of this.#endedUploads) {
      // Dropped by core by now: nothing left to discount.
      if (!(id in currentUploads)) this.#endedUploads.delete(id)
    }
    const running = Object.keys(currentUploads).filter(
      (id) => !this.#endedUploads.has(id),
    )
    if (running.length === 0) {
      this.#closedAdmission = false
      this.uppy.setState({ allowNewUpload: true })
    }
  }

  /**
   * Core drops an upload without an event of its own: a retry whose uploader
   * rejects (XHRUpload with `bundle: true`, say) ends with no `error` after
   * the drop, as does one whose last file is removed, and both skip
   * `#afterUpload`. So the Assembly such an upload was using is let go of
   * here, and the admission this plugin closed is checked again.
   * Once the update is done: core hands `next` to the UI plugins after this
   * event, which would render over a state set from in here.
   */
  #onStateUpdate: UppyEventMap<M, B>['state-update'] = (prev, next) => {
    if (prev.currentUploads === next.currentUploads) return
    const dropped = [...this.#inUse].filter(
      ({ uploadID }) => uploadID != null && !(uploadID in next.currentUploads),
    )
    const reopen =
      this.#closedAdmission &&
      !next.allowNewUpload &&
      Object.keys(next.currentUploads).length <
        Object.keys(prev.currentUploads).length
    if (dropped.length === 0 && !reopen) return
    queueMicrotask(() => {
      for (const use of dropped) this.#release(use)
      if (this.#closedAdmission) this.#allowNewUploadIfIdle()
    })
  }

  #afterUpload = async (fileIDs: string[], uploadID: string): Promise<void> => {
    // If we're still restoring state, wait for that to be done.
    await this.restored
    // This upload's Assembly, if it got one: a cancelled or failed one has
    // none, and the live one may be another upload's.
    const use = this.#inUseBy(uploadID)
    const assembly = use?.assembly
    try {
      const files = fileIDs
        .map((fileID) => this.uppy.getFile(fileID))
        // Only use files without errors
        .filter((file) => !file.error)

      const closeSocketConnections = () => {
        assembly?.close()
      }

      // If we don't have to wait for encoding metadata or results, we can close
      // the socket immediately and finish the upload.
      if (!this.#shouldWaitAfterUpload()) {
        closeSocketConnections()
        const status = assembly?.status
        if (status != null) {
          this.uppy.addResultData(uploadID, {
            transloadit: [status],
          })
        }
        return
      }

      // If no Assemblies were created for this upload, we also do not have to wait.
      // There's also no sockets or anything to close, so just return immediately.
      if (!use) {
        this.uppy.addResultData(uploadID, { transloadit: [] })
        return
      }

      const incompleteFiles = files.filter(
        (file) => !Object.hasOwn(this.completedFiles, file.id),
      )
      incompleteFiles.forEach((file) => {
        this.uppy.emit('postprocess-progress', file, {
          mode: 'indeterminate',
          message: this.i18n('encoding'),
        })
      })

      // Settles once the Assembly is done or has failed, or once it is let go
      // of (cancelled, or its upload dropped by core) while waited for.
      await use.watcher.promise
      // assembly is now done processing!
      closeSocketConnections()
      const status = assembly?.status
      if (status != null) {
        this.uppy.addResultData(uploadID, {
          transloadit: [status],
        })
      }
    } finally {
      // in case allowMultipleUploadBatches is true and the user wants to upload again,
      // we need to allow a new assembly to be created.
      // see https://github.com/transloadit/uppy/issues/5397
      if (use) this.#release(use)
      // Allow new uploads now that this upload is complete, unless another
      // one is still preparing or running.
      this.#allowNewUploadIfIdle(uploadID)
    }
  }

  /**
   * Not every `error` is an upload's (core refuses an `upload()` with one
   * while a batch runs, say), and one that is was reported with its file
   * (`#onTusError`) or its Assembly (the watcher) first: no Assembly is let
   * go of here.
   */
  #onError = (err: { name: string; message: string; details?: string }) => {
    this.client
      .submitError(err)
      // if we can't report the error that sucks
      .catch(sendErrorToConsole(err))

    // Reopen admission after a failed upload (core has dropped it by now),
    // unless another one is still preparing or running.
    this.#allowNewUploadIfIdle()
  }

  #onTusError = (file: UppyFile<M, B> | undefined, err: Error) => {
    // Its Assembly cannot complete without it: its upload stops waiting for
    // that. Another upload's Assembly is not touched; a file that failed
    // before it got one (a failed preparation) has none.
    const use = this.#inUseWithId(file?.transloadit?.assembly)
    if (use) this.#release(use)
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

  override install(): void {
    this.uppy.addPreProcessor(this.#prepareUpload)
    this.uppy.addPostProcessor(this.#afterUpload)

    // Errors are reported to Transloadit.
    this.uppy.on('error', this.#onError)

    // Handle cancellation.
    this.uppy.on('cancel-all', this.#onCancelAll)
    this.uppy.on('state-update', this.#onStateUpdate)

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

    this.uppy.on('restored', this.#onRestored)

    this.setPluginState({
      assemblyStatus: undefined,
      lastAssemblyStatus: undefined,
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

  override uninstall(): void {
    this.uppy.removePreProcessor(this.#prepareUpload)
    this.uppy.removePostProcessor(this.#afterUpload)
    this.uppy.off('error', this.#onError)
    this.uppy.off('cancel-all', this.#onCancelAll)
    this.uppy.off('state-update', this.#onStateUpdate)
    this.uppy.off('upload-error', this.#onTusError)
    this.uppy.off('restored', this.#onRestored)

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

// Re-export type from @transloadit/types so callers can import it from the plugin package.
export type { AssemblyInstructionsInput } from '@transloadit/types'
// Low-level classes for advanced usage (e.g., creating assemblies without file uploads)
export { default as Assembly } from './Assembly.js'
export { AssemblyError, default as Client } from './Client.js'
export { COMPANION_ALLOWED_HOSTS, COMPANION_URL }
